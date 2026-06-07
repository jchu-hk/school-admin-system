/**
 * ABAC Policy Input Interface
 * 描述发送给 OPA 进行权限决策的输入结构
 */
export interface AbacInput {
  /** 用户角色 */
  role: string;
  /** 用户ID */
  user: {
    id: string;
    /** 教师关联的班级ID列表 */
    classIds?: string[];
    /** 家长关联的学生ID列表 */
    relatedStudentIds?: string[];
    /** 部门 */
    department?: string;
    /** 是否具有特殊授权（如工作时间外访问） */
    hasOverride?: boolean;
  };
  /** 操作类型 */
  action: 'read' | 'create' | 'update' | 'delete' | 'export' | 'print';
  /** 资源类型 */
  resource: string;
  /** 资源属性（用于 ABAC 细粒度判断） */
  resourceData?: {
    /** 学生所属班级ID */
    classId?: string;
    /** 学生关联的家长ID */
    parentId?: string;
    /** 学生ID */
    studentId?: string;
  };
  /** 当前时间（ISO 8601） */
  currentTime?: string;
  /** 当前星期几 */
  weekday?: string;
}

/**
 * ABAC 决策请求
 */
export interface AbacDecisionRequest {
  input: AbacInput;
  /** 用于缓存的键 */
  cacheKey?: string;
}

/**
 * ABAC 决策响应
 */
export interface AbacDecisionResult {
  /** 决策结果：true=允许，false=拒绝 */
  allow: boolean;
  /** 匹配的策略名称 */
  matchedPolicy?: string;
  /** 拒绝原因（当 allow=false 时） */
  reason?: string;
  /** 决策耗时（毫秒） */
  decisionTimeMs: number;
  /** 决策时间戳 */
  evaluatedAt: string;
}

/**
 * OPA Data Bundle 配置
 */
export interface OpaBundleConfig {
  /** OPA 服务器地址（sidecar 模式） */
  url?: string;
  /** bundle 文件路径（embedded 模式） */
  bundlePath?: string;
  /** 策略包名 */
  packageName: string;
}

/**
 * ABAC 规则元信息
 */
export interface AbacRuleMetadata {
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description: string;
  /** 规则版本 */
  version: string;
  /** 最后更新时间 */
  lastUpdated: string;
}

/**
 * ABAC 决策日志（审计用）
 */
export interface AbacAuditLog {
  id?: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  decision: 'allow' | 'deny';
  reason?: string;
  matchedPolicy?: string;
  decisionTimeMs: number;
  ip?: string;
  requestContext?: Record<string, any>;
  createdAt?: Date;
}
