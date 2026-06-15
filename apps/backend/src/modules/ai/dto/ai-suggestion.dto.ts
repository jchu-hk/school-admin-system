import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/** AI 智能建议类型枚举 */
export enum SuggestionType {
  /** 出勤风险预警 - 学生连续缺席/迟到 */
  ATTENDANCE_RISK = 'attendance_risk',
  /** 学业表现建议 - 成绩下滑/学习困难 */
  ACADEMIC_RISK = 'academic_risk',
  /** 资源优化建议 - 班级资源配置 */
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  /** 流程改进建议 - 工作流程优化 */
  PROCESS_IMPROVEMENT = 'process_improvement',
  /** 健康安全提醒 - 学生健康异常 */
  HEALTH_SAFETY = 'health_safety',
  /** 特殊关注学生 - 需要关注的学生 */
  SPECIAL_ATTENTION = 'special_attention',
  /** 资源分配建议 - 教师/教室/设备分配 */
  RESOURCE_ALLOCATION = 'resource_allocation',
  /** 预警解除 - 之前的预警已缓解 */
  ALERT_RESOLVED = 'alert_resolved',
}

/** 建议优先级 */
export enum SuggestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/** 建议紧急程度 */
export enum SuggestionUrgency {
  ROUTINE = 'routine', // 例行建议
  FOLLOW_UP = 'follow_up', // 需要跟进
  URGENT = 'urgent', // 紧急处理
}

/** 单条智能建议 */
export class AiSuggestion {
  /** 建议唯一ID */
  suggestionId: string;
  /** 建议类型 */
  type: SuggestionType;
  /** 优先级 */
  priority: SuggestionPriority;
  /** 紧急程度 */
  urgency: SuggestionUrgency;
  /** 建议标题 */
  title: string;
  /** 建议详情描述 */
  description: string;
  /** 关联学生ID（如果有） */
  studentId?: string;
  /** 关联学生姓名 */
  studentName?: string;
  /** 关联班级ID */
  classId?: string;
  /** 关联班级名称 */
  className?: string;
  /** 具体的建议内容 */
  recommendations: string[];
  /** 风险指标数值（如缺席天数、迟到次数） */
  riskMetrics?: {
    metric: string;
    value: number;
    threshold: number;
    unit?: string;
  }[];
  /** AI 分析依据 */
  analysisBasis?: string;
  /** 建议采取的行动 */
  suggestedAction?: string;
  /** 建议接收人角色 */
  targetRoles: string[];
  /** 状态：new / acknowledged / actioned / dismissed */
  status: 'new' | 'acknowledged' | 'actioned' | 'dismissed';
  /** 创建时间 */
  createdAt: Date;
  /** 过期时间（可选） */
  expiresAt?: Date;
}

/** 获取建议列表的查询参数 */
export class GetSuggestionsDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsEnum(SuggestionType)
  type?: SuggestionType;

  @IsOptional()
  @IsEnum(SuggestionPriority)
  priority?: SuggestionPriority;

  @IsOptional()
  @IsEnum(SuggestionUrgency)
  urgency?: SuggestionUrgency;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

/** 获取建议统计 */
export class GetSuggestionStatsDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/** 建议统计响应 */
export class SuggestionStatsResponse {
  totalSuggestions: number;
  byPriority: Record<SuggestionPriority, number>;
  byType: Record<SuggestionType, number>;
  byStatus: Record<string, number>;
  highPriorityCount: number;
  criticalCount: number;
  recentAlertsCount: number; // 最近7天
  resolvedCount: number; // 已处理
}

/** 学生分析报告 */
export class StudentAnalysisReport {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  /** 整体风险等级 */
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 出勤风险得分 (0-100) */
  attendanceRiskScore: number;
  /** 出勤分析详情 */
  attendanceAnalysis: {
    /** 最近30天出勤率 */
    attendanceRateLast30Days: number;
    /** 连续缺席天数 */
    consecutiveAbsentDays: number;
    /** 最近7天迟到次数 */
    lateCountLast7Days: number;
    /** 最近30天缺席次数 */
    absentCountLast30Days: number;
    /** 病假次数 */
    sickLeaveCount: number;
    /** 模式识别 */
    pattern?: string; // e.g. "周一固定迟到", "周末前后缺席"
  };
  /** 生成的分析建议 */
  suggestions: AiSuggestion[];
  /** 分析时间 */
  analyzedAt: Date;
}

/** 班级分析报告 */
export class ClassAnalysisReport {
  classId: string;
  className: string;
  /** 班级整体出勤率 */
  classAttendanceRate: number;
  /** 风险学生数量 */
  atRiskStudentCount: number;
  /** 需要关注的教师数量 */
  teacherAttentionNeeded: number;
  /** 班级整体风险评估 */
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 各科目风险分布 */
  riskDistribution: Record<string, number>;
  /** 建议列表 */
  suggestions: AiSuggestion[];
  /** 分析时间 */
  analyzedAt: Date;
}

/** 仪表板 AI 摘要 */
export class DashboardAiSummary {
  /** 今日新增建议数量 */
  newSuggestionsToday: number;
  /** 高优先级建议数量 */
  highPriorityCount: number;
  /** 紧急需要处理的建议 */
  urgentSuggestions: AiSuggestion[];
  /** 学生出勤风险摘要 */
  attendanceRiskSummary: {
    criticalStudents: number;
    highRiskStudents: number;
    mediumRiskStudents: number;
    improvingStudents: number;
  };
  /** AI 仪表板摘要消息 */
  summaryMessage: string;
  /** 建议操作 */
  recommendedActions: string[];
}

/** 更新建议状态 */
export class UpdateSuggestionStatusDto {
  @IsOptional()
  @IsString()
  status?: 'acknowledged' | 'actioned' | 'dismissed';

  @IsOptional()
  @IsString()
  actionTaken?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
