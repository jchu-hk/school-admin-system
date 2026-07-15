import { UserRole } from '../../modules/user/user.entity';

/**
 * 脱敏级别
 */
export enum MaskingLevel {
  /** 完全显示（内部权限：校务处/教师） */
  NONE = 'NONE',
  /** 部分脱敏（学生查看本人档案） */
  PARTIAL = 'PARTIAL',
  /** 完全脱敏（家长查看子女档案 / 日志记录） */
  FULL = 'FULL',
}

/**
 * 角色对应的脱敏级别映射
 */
export const ROLE_MASKING_LEVEL: Record<UserRole, MaskingLevel> = {
  [UserRole.SYSTEM_ADMIN]: MaskingLevel.NONE,
  [UserRole.SCHOOL_DIRECTOR]: MaskingLevel.NONE,
  [UserRole.SCHOOL_STAFF]: MaskingLevel.NONE,
  [UserRole.TEACHER]: MaskingLevel.NONE,
  [UserRole.STUDENT]: MaskingLevel.PARTIAL,
  [UserRole.PARENT]: MaskingLevel.FULL,
};

/**
 * 字段脱敏配置
 */
export interface FieldMaskingRule {
  /** 字段名 */
  field: string;
  /** 显示名称 */
  label: string;
  /** 脱敏函数名 */
  maskFunction: string;
  /** 学生角色脱敏级别 */
  studentLevel: MaskingLevel;
  /** 家长角色脱敏级别 */
  parentLevel: MaskingLevel;
}

/**
 * 学生档案敏感字段脱敏规则配置
 *
 * 规则来源：FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md §6.1
 */
export const FIELD_MASKING_RULES: Record<string, FieldMaskingRule> = {
  phone: {
    field: 'phone',
    label: '手机号',
    maskFunction: 'maskPhone',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  email: {
    field: 'email',
    label: '邮箱',
    maskFunction: 'maskEmail',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  address: {
    field: 'address',
    label: '地址',
    maskFunction: 'maskAddress',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  emergency_contact: {
    field: 'emergency_contact',
    label: '紧急联系人',
    maskFunction: 'maskEmergencyContact',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  emergency_phone: {
    field: 'emergency_phone',
    label: '紧急联系电话',
    maskFunction: 'maskPhone',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  guardian_phone: {
    field: 'guardian_phone',
    label: '监护人电话',
    maskFunction: 'maskPhone',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  student_id: {
    field: 'student_id',
    label: '学号',
    maskFunction: 'maskStudentId',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
  hk_id: {
    field: 'hk_id',
    label: '香港身份证号',
    maskFunction: 'maskHKId',
    studentLevel: MaskingLevel.PARTIAL,
    parentLevel: MaskingLevel.FULL,
  },
};

/**
 * 根据角色获取脱敏级别
 */
export function getMaskingLevelForRole(role: UserRole): MaskingLevel {
  return ROLE_MASKING_LEVEL[role] ?? MaskingLevel.FULL;
}
