import 'reflect-metadata';

/**
 * 元数据键
 */
const MASKED_FIELDS_KEY = 'portal:masked-fields';

/**
 * Masked 装饰器选项
 */
export interface MaskedOptions {
  /** 脱敏函数名 (对应 DataMaskingService 中的方法) */
  maskFunction?: string;
  /** 是否跳过空值检查 */
  skipEmpty?: boolean;
}

/**
 * @Masked() 装饰器
 *
 * 用于标记 Entity/DTO 中的敏感字段，在序列化时自动应用脱敏。
 *
 * @example
 * ```ts
 * export class StudentProfile {
 *   \@Masked({ maskFunction: 'maskPhone' })
 *   phone: string;
 *
 *   \@Masked({ maskFunction: 'maskEmail' })
 *   email: string;
 *
 *   \@Masked({ maskFunction: 'maskAddress' })
 *   address: string;
 * }
 * ```
 *
 * 配合 ClassSerializerInterceptor 或自定义 interceptor 使用时，
 * 通过 Reflect metadata 获取哪些字段需要脱敏。
 */
export function Masked(options?: MaskedOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingFields: Set<string> =
      Reflect.getMetadata(MASKED_FIELDS_KEY, target.constructor) || new Set();
    existingFields.add(propertyKey as string);

    Reflect.defineMetadata(MASKED_FIELDS_KEY, existingFields, target.constructor);

    // 同时存储单个字段的配置
    const fieldConfig: MaskedOptions = options || {};
    Reflect.defineMetadata(
      `${MASKED_FIELDS_KEY}:${propertyKey as string}`,
      fieldConfig,
      target.constructor,
    );
  };
}

/**
 * 获取构造器上所有标记了 @Masked() 的字段名列表
 */
export function getMaskedFields(target: any): string[] {
  const fields: Set<string> =
    Reflect.getMetadata(MASKED_FIELDS_KEY, target) || new Set();
  return Array.from(fields);
}

/**
 * 获取某个字段的 @Masked() 配置
 */
export function getMaskedFieldOptions(
  target: any,
  field: string,
): MaskedOptions {
  return (
    Reflect.getMetadata(`${MASKED_FIELDS_KEY}:${field}`, target) || {}
  );
}
