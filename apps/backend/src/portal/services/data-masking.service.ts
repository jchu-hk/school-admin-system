import { Injectable } from '@nestjs/common';
import {
  MaskingLevel,
  FIELD_MASKING_RULES,
  getMaskingLevelForRole,
} from '../config/masking-rules.config';
import { UserRole } from '../../modules/user/user.entity';

/**
 * 数据脱敏 Service
 *
 * 职责：
 * 1. 根据目标角色应用不同脱敏规则
 * 2. 提供各字段脱敏函数
 * 3. 提供对完整对象进行脱敏的方法
 *
 * 脱敏规则（对应 FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md §6.1）：
 *
 * | 字段        | PARTIAL (学生看自己)    | FULL (家长看子女)        |
 * |------------|------------------------|--------------------------|
 * | 手机号     | 显示后4位               | 全部掩码                 |
 * | 邮箱       | 域名 + 用户名首字符      | 全部掩码                 |
 * | 地址       | 显示到街道，门牌号掩码   | 全部掩码                 |
 * | 紧急联系人  | 部分掩码                | 全部掩码                 |
 * | 学号       | 显示前4+后4             | 全部掩码                 |
 * | 身份证号   | 显示前6+后2             | 全部掩码                 |
 */
@Injectable()
export class DataMaskingService {
  /**
   * 手机号脱敏
   *
   * - PARTIAL: 显示后 4 位，前 4 位掩码  (91234567 → ****4567)
   * - FULL:    全部掩码                   (91234567 → ********)
   */
  maskPhone(phone: string, role: UserRole): string {
    if (!phone) return phone;
    const level = getMaskingLevelForRole(role);

    if (level === MaskingLevel.NONE) {
      return phone;
    }

    if (level === MaskingLevel.PARTIAL) {
      if (phone.length <= 4) return '****';
      return '*'.repeat(phone.length - 4) + phone.slice(-4);
    }

    // FULL
    return '*'.repeat(phone.length);
  }

  /**
   * 邮箱脱敏
   *
   * - PARTIAL: 显示域名 + 用户名首字符 (wong.siu.ming@example.com → w***@example.com)
   * - FULL:    全部掩码               (wong.siu.ming@example.com → **********)
   */
  maskEmail(email: string, role: UserRole): string {
    if (!email) return email;
    const level = getMaskingLevelForRole(role);

    if (level === MaskingLevel.NONE) {
      return email;
    }

    if (level === MaskingLevel.PARTIAL) {
      const [localPart, domain] = email.split('@');
      if (!domain) {
        // 非法邮箱格式，全掩码
        return '*'.repeat(email.length);
      }
      const firstChar = localPart.charAt(0);
      const maskedLocal = firstChar + '*'.repeat(Math.max(1, localPart.length - 1));
      return `${maskedLocal}@${domain}`;
    }

    // FULL
    return '*'.repeat(email.length);
  }

  /**
   * 地址脱敏
   *
   * - PARTIAL: 显示到街道，门牌号掩码
   *   (香港仔田灣大樓A座12樓 → 香港仔田灣大樓A座****)
   * - FULL:    全部掩码
   */
  maskAddress(address: string, role: UserRole): string {
    if (!address) return address;
    const level = getMaskingLevelForRole(role);

    if (level === MaskingLevel.NONE) {
      return address;
    }

    if (level === MaskingLevel.PARTIAL) {
      // 保留前 2/3 内容，掩码后 1/3
      const maskLen = Math.max(4, Math.floor(address.length / 3));
      const keepLen = address.length - maskLen;
      if (keepLen <= 0) return '*'.repeat(address.length);
      return address.slice(0, keepLen) + '*'.repeat(maskLen);
    }

    // FULL
    return '*'.repeat(address.length);
  }

  /**
   * 紧急联系人姓名脱敏
   *
   * - PARTIAL: 显示姓氏，名字掩码 (陳大文 → 陳**)
   * - FULL:    全部掩码
   */
  maskEmergencyContact(name: string, role: UserRole): string {
    if (!name) return name;
    const level = getMaskingLevelForRole(role);

    if (level === MaskingLevel.NONE) {
      return name;
    }

    if (level === MaskingLevel.PARTIAL) {
      // 中文姓名：保留姓氏，名称部分掩码
      // 常见场景：双字姓（歐陽）或单字姓（陳）
      if (name.length <= 1) return name;
      if (name.length === 2) return name[0] + '*';
      if (name.length === 3) return name[0] + '**';
      // 4字及以上（含双字姓）：保留姓氏（可能2字），其余掩码
      const surnameLen = 1; // 默认单字姓
      // 尝试检测是否是双字姓（常见列表）
      const doubleSurnames = ['歐陽', '司徒', '司馬', '諸葛', '西門', '上官'];
      const actualSurnameLen = doubleSurnames.some((s) => name.startsWith(s))
        ? 2
        : surnameLen;
      return name.slice(0, actualSurnameLen) + '*'.repeat(name.length - actualSurnameLen);
    }

    // FULL
    return '*'.repeat(name.length);
  }

  /**
   * 学号脱敏
   *
   * - PARTIAL: 显示前4+后4 (2026S10001 → 2026S****001)
   * - FULL:    全部掩码
   */
  maskStudentId(id: string, role: UserRole): string {
    if (!id) return id;
    const level = getMaskingLevelForRole(role);

    if (level === MaskingLevel.NONE) {
      return id;
    }

    if (level === MaskingLevel.PARTIAL) {
      if (id.length <= 8) {
        // 短学号：显示前2后2
        const prefix = 2;
        if (id.length <= 4) return id.slice(0, 2) + '*'.repeat(id.length - 2);
        return id.slice(0, prefix) + '*'.repeat(id.length - prefix * 2) + id.slice(-prefix);
      }
      // 常规学号：显示前4后4
      const prefix = 4;
      return (
        id.slice(0, prefix) +
        '*'.repeat(Math.max(1, id.length - prefix * 2)) +
        id.slice(-prefix)
      );
    }

    // FULL
    return '*'.repeat(id.length);
  }

  /**
   * 香港身份证号脱敏
   *
   * - PARTIAL: 显示前6+后2 (A123456(7) → A1234***(7))
   * - FULL:    全部掩码
   */
  maskHKId(id: string, role: UserRole): string {
    if (!id) return id;
    const level = getMaskingLevelForRole(role);

    if (level === MaskingLevel.NONE) {
      return id;
    }

    if (level === MaskingLevel.PARTIAL) {
      // 格式: A123456(7) - 1字母 + 6数字 + (1数字)
      // 需要保留字母、括号位和最后1位
      // 掩码中间部分
      if (id.length <= 3) return id[0] + '*'.repeat(id.length - 1);
      // 保留首字母和最后括号及数字
      const first = id.charAt(0);
      const lastPart = id.length > 4 ? id.slice(-4) : id.slice(-2);
      // 如果包含括号，保留括号及后1位
      if (id.includes('(')) {
        const parenIdx = id.indexOf('(');
        const firstPart = first + id.slice(1, Math.min(5, parenIdx));
        return firstPart + '*'.repeat(Math.max(1, parenIdx - Math.min(5, parenIdx))) + id.slice(parenIdx);
      }
      const midLen = id.length - 1 - lastPart.length;
      return first + '*'.repeat(midLen) + lastPart;
    }

    // FULL
    return '*'.repeat(id.length);
  }

  /**
   * 对单个敏感字段应用脱敏
   */
  maskField(
    fieldName: string,
    value: string,
    role: UserRole,
  ): string {
    const rule = FIELD_MASKING_RULES[fieldName];
    if (!rule) return value; // 非敏感字段不处理

    switch (rule.maskFunction) {
      case 'maskPhone':
        return this.maskPhone(value, role);
      case 'maskEmail':
        return this.maskEmail(value, role);
      case 'maskAddress':
        return this.maskAddress(value, role);
      case 'maskEmergencyContact':
        return this.maskEmergencyContact(value, role);
      case 'maskStudentId':
        return this.maskStudentId(value, role);
      case 'maskHKId':
        return this.maskHKId(value, role);
      default:
        return value;
    }
  }

  /**
   * 对完整学生档案对象应用脱敏
   *
   * @param profile 学生档案对象
   * @param role    目标角色（确定脱敏级别）
   * @returns       脱敏后的档案对象
   */
  maskProfile<T extends Record<string, any>>(profile: T, role: UserRole): T {
    const result: Record<string, any> = { ...profile };

    for (const [fieldName, rule] of Object.entries(FIELD_MASKING_RULES)) {
      if (fieldName in result && result[fieldName] !== null && result[fieldName] !== undefined) {
        result[fieldName] = this.maskField(
          fieldName,
          String(result[fieldName]),
          role,
        );
      }
    }

    return result as T;
  }

  /**
   * 对审计日志中的敏感变更值进行脱敏
   * 确保日志中不存储明文敏感数据
   */
  maskChangesForAudit(
    changes: Array<{ field: string; old: string; new: string }>,
    role: UserRole = UserRole.SYSTEM_ADMIN,
  ): Array<{ field: string; old: string; new: string }> {
    // 审计日志：即使校务处也需要在日志中脱敏
    // 日志脱敏使用 FULL 级别
    return changes.map((change) => ({
      field: change.field,
      old: this.maskField(change.field, change.old, UserRole.PARENT),
      new: this.maskField(change.field, change.new, UserRole.PARENT),
    }));
  }
}
