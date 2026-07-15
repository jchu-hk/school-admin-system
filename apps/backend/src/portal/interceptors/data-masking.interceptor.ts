import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * 敏感字段脱敏规则配置
 */
interface MaskRule {
  /** 字段名 */
  field: string;
  /** 脱敏模式 */
  mode: 'phone' | 'email' | 'address' | 'id_card' | 'name';
  /** 是否对家长角色也应用掩码 */
  maskForParent: boolean;
}

/**
 * 默认脱敏规则配置
 * 对应 FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md §6.1
 */
const DEFAULT_MASK_RULES: MaskRule[] = [
  { field: 'phone', mode: 'phone', maskForParent: true },
  { field: 'email', mode: 'email', maskForParent: true },
  { field: 'address', mode: 'address', maskForParent: true },
  { field: 'emergency_contact', mode: 'name', maskForParent: true },
  { field: 'emergencyPhone', mode: 'phone', maskForParent: true },
  { field: 'emergency_phone', mode: 'phone', maskForParent: true },
  { field: 'hkId', mode: 'id_card', maskForParent: true },
  { field: 'hk_id', mode: 'id_card', maskForParent: true },
  { field: 'guardianPhone', mode: 'phone', maskForParent: true },
  { field: 'guardian_phone', mode: 'phone', maskForParent: true },
  { field: 'whatsapp', mode: 'phone', maskForParent: true },
];

/**
 * 数据脱敏工具函数
 */
const MaskUtils = {
  /**
   * 手机号: 显示后4位，前4位掩码
   * 91234567 → ****4567
   */
  phone(value: string): string {
    if (!value || value.length < 4) return value;
    return '****' + value.slice(-4);
  },

  /**
   * 邮箱: 显示域名 + 用户名首字符
   * wong.siu.ming@example.com → w***@example.com
   */
  email(value: string): string {
    if (!value || !value.includes('@')) return value;
    const [local, domain] = value.split('@');
    const maskedLocal = local.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
  },

  /**
   * 地址: 显示到街道，门牌号掩码
   * 香港仔田灣大樓A座12樓 → 香港仔田灣大樓A座****
   */
  address(value: string): string {
    if (!value) return value;
    // 显示前 2/3，剩余掩码
    const keepLength = Math.ceil(value.length * 0.6);
    return value.slice(0, keepLength) + '****';
  },

  /**
   * 身份证号: 显示前6位+后2位
   * A123456(7) → A1234***(7)
   */
  idCard(value: string): string {
    if (!value) return value;
    if (value.length <= 6) return value;
    return value.slice(0, 4) + '****' + value.slice(-3);
  },

  /**
   * 姓名: 首字 + **
   * 陳小明 → 陳**
   */
  name(value: string): string {
    if (!value) return value;
    if (value.length <= 1) return value;
    return value.charAt(0) + '**';
  },
};

/**
 * 数据脱敏拦截器
 *
 * 在 Response 序列化前对敏感字段进行脱敏处理。
 * 根据用户角色应用不同的脱敏策略:
 * - parent 角色: 对所有敏感字段应用完整掩码规则
 * - student 角色: 基本掩码
 *
 * 脱敏规则在响应数据中进行递归遍历，匹配字段名后脱敏。
 */
@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataMaskingInterceptor.name);

  constructor(
    private readonly customRules?: MaskRule[],
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userRole = user?.role;

    return next.handle().pipe(
      map((data) => {
        if (!userRole) return data;
        return this.maskResponseData(data, userRole);
      }),
    );
  }

  /**
   * 递归处理响应数据，应用脱敏规则
   */
  private maskResponseData(data: any, role: string): any {
    if (data === null || data === undefined) return data;

    // 如果是数组，递归处理每个元素
    if (Array.isArray(data)) {
      return data.map((item) => this.maskResponseData(item, role));
    }

    // 如果是对象，递归处理字段
    if (typeof data === 'object' && !(data instanceof Date)) {
      const rules = this.customRules || DEFAULT_MASK_RULES;
      const masked: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        // 检查该字段是否需要脱敏
        const rule = rules.find(
          (r) =>
            r.field === key &&
            (role === 'parent' ? r.maskForParent : true),
        );

        if (rule && typeof value === 'string') {
          masked[key] = this.applyMask(rule.mode, value);
        } else if (typeof value === 'object' && value !== null) {
          // 递归处理嵌套对象
          masked[key] = this.maskResponseData(value, role);
        } else {
          masked[key] = value;
        }
      }

      return masked;
    }

    return data;
  }

  /**
   * 应用指定的脱敏模式
   */
  private applyMask(mode: MaskRule['mode'], value: string): string {
    switch (mode) {
      case 'phone':
        return MaskUtils.phone(value);
      case 'email':
        return MaskUtils.email(value);
      case 'address':
        return MaskUtils.address(value);
      case 'id_card':
        return MaskUtils.idCard(value);
      case 'name':
        return MaskUtils.name(value);
      default:
        return value;
    }
  }
}
