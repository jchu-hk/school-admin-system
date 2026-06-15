import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceStatus } from '../attendance/attendance.entity';
import { LeaveApplication } from '../leave/leave.entity';
import {
  AiSuggestion,
  SuggestionType,
  SuggestionPriority,
  SuggestionUrgency,
  GetSuggestionsDto,
  SuggestionStatsResponse,
  StudentAnalysisReport,
  ClassAnalysisReport,
  DashboardAiSummary,
  UpdateSuggestionStatusDto,
} from './dto/ai-suggestion.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiSuggestionService {
  private readonly logger = new Logger(AiSuggestionService.name);

  /** 内存中的建议存储（生产环境应持久化到数据库）*/
  private suggestionsStore: AiSuggestion[] = [];

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(LeaveApplication)
    private leaveRepository: Repository<LeaveApplication>,
  ) {}

  // ==================== 主要入口方法 ====================

  /**
   * 获取仪表板 AI 摘要
   * F-AI-001: 基于出勤数据生成智能摘要和建议
   */
  async getDashboardSummary(
    userRole: string,
    classId?: string,
  ): Promise<DashboardAiSummary> {
    this.logger.log(`生成仪表板AI摘要: role=${userRole}, classId=${classId}`);

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendanceStats = await this.getAttendanceRiskStats(
      sevenDaysAgo,
      today,
      classId,
    );

    const riskStudents = await this.getRiskStudents(classId);

    const urgentSuggestions = this.suggestionsStore
      .filter((s) => s.status === 'new')
      .filter(
        (s) =>
          s.priority === SuggestionPriority.HIGH ||
          s.priority === SuggestionPriority.CRITICAL,
      )
      .slice(0, 5);

    const highPriorityCount = this.suggestionsStore.filter(
      (s) =>
        s.status === 'new' &&
        (s.priority === SuggestionPriority.HIGH ||
          s.priority === SuggestionPriority.CRITICAL),
    ).length;

    const summaryMessage = this.generateDashboardSummaryMessage(
      attendanceStats,
      riskStudents,
      highPriorityCount,
    );

    const recommendedActions = this.generateRecommendedActions(
      attendanceStats,
      riskStudents,
    );

    const todayStart = new Date(today.toISOString().split('T')[0]);

    return {
      newSuggestionsToday: this.suggestionsStore.filter((s) => {
        return new Date(s.createdAt) >= todayStart;
      }).length,
      highPriorityCount,
      urgentSuggestions,
      attendanceRiskSummary: {
        criticalStudents: riskStudents.filter((s) => s.riskScore >= 80).length,
        highRiskStudents: riskStudents.filter(
          (s) => s.riskScore >= 60 && s.riskScore < 80,
        ).length,
        mediumRiskStudents: riskStudents.filter(
          (s) => s.riskScore >= 30 && s.riskScore < 60,
        ).length,
        improvingStudents: riskStudents.filter((s) => s.riskScore < 30).length,
      },
      summaryMessage,
      recommendedActions,
    };
  }

  /**
   * 获取学生分析报告
   * 分析单个学生的出勤、请假数据，生成智能建议
   */
  async getStudentAnalysis(studentId: string): Promise<StudentAnalysisReport> {
    this.logger.log(`分析学生: ${studentId}`);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        studentId,
        attendanceDate: Between(thirtyDaysAgo, today),
      },
      order: { attendanceDate: 'DESC' },
    });

    const _leaveRecords = await this.leaveRepository.find({
      where: {
        studentId,
        createdAt: Between(thirtyDaysAgo, today),
      },
      order: { createdAt: 'DESC' },
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absentDays = attendanceRecords.filter(
      (r) =>
        r.status === AttendanceStatus.ABSENT ||
        r.status === AttendanceStatus.ABSENT_WITH_LEAVE,
    ).length;
    const sickLeaveDays = attendanceRecords.filter(
      (r) => r.status === AttendanceStatus.SICK_LEAVE,
    ).length;

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    const consecutiveAbsentDays =
      this.detectConsecutiveAbsences(attendanceRecords);

    const recentRecords = attendanceRecords.filter((r) => {
      const recordDate = new Date(r.attendanceDate);
      return recordDate >= sevenDaysAgo;
    });
    const lateCountLast7Days = recentRecords.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;

    const pattern = this.detectAttendancePattern(attendanceRecords);

    const riskScore = this.calculateAttendanceRiskScore(
      attendanceRate,
      consecutiveAbsentDays,
      lateCountLast7Days,
      absentDays,
      sickLeaveDays,
    );

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    const suggestions = this.generateStudentSuggestions(
      studentId,
      attendanceRecords[0]?.classId || '',
      attendanceRate,
      consecutiveAbsentDays,
      lateCountLast7Days,
      absentDays,
      sickLeaveDays,
      pattern,
    );

    for (const suggestion of suggestions) {
      this.addSuggestion(suggestion);
    }

    return {
      studentId,
      studentName: studentId,
      classId: attendanceRecords[0]?.classId || '',
      className: attendanceRecords[0]?.classId || '',
      overallRiskLevel: riskLevel,
      attendanceRiskScore: riskScore,
      attendanceAnalysis: {
        attendanceRateLast30Days: Math.round(attendanceRate * 10) / 10,
        consecutiveAbsentDays,
        lateCountLast7Days,
        absentCountLast30Days: absentDays,
        sickLeaveCount: sickLeaveDays,
        pattern,
      },
      suggestions,
      analyzedAt: new Date(),
    };
  }

  /**
   * 获取班级分析报告
   */
  async getClassAnalysis(classId: string): Promise<ClassAnalysisReport> {
    this.logger.log(`分析班级: ${classId}`);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const classRecords = await this.attendanceRepository.find({
      where: {
        classId,
        attendanceDate: Between(thirtyDaysAgo, today),
      },
      order: { attendanceDate: 'DESC' },
    });

    const classLeaveRecords = await this.leaveRepository.find({
      where: {
        classId,
        createdAt: Between(thirtyDaysAgo, today),
      },
    });

    const totalRecords = classRecords.length;
    const presentRecords = classRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const classAttendanceRate =
      totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    const studentIds = [...new Set(classRecords.map((r) => r.studentId))];
    const atRiskStudents: string[] = [];

    for (const sid of studentIds.slice(0, 20)) {
      const studentRecords = classRecords.filter((r) => r.studentId === sid);
      const absentCount = studentRecords.filter(
        (r) =>
          r.status === AttendanceStatus.ABSENT ||
          r.status === AttendanceStatus.ABSENT_WITH_LEAVE,
      ).length;
      const lateCount = studentRecords.filter(
        (r) => r.status === AttendanceStatus.LATE,
      ).length;
      if (absentCount >= 3 || lateCount >= 5) {
        atRiskStudents.push(sid);
      }
    }

    let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    const riskRatio = atRiskStudents.length / Math.max(studentIds.length, 1);
    if (riskRatio >= 0.3 || classAttendanceRate < 90) overallRiskLevel = 'high';
    else if (riskRatio >= 0.15 || classAttendanceRate < 95)
      overallRiskLevel = 'medium';
    else overallRiskLevel = 'low';

    const suggestions = this.generateClassSuggestions(
      classId,
      classAttendanceRate,
      atRiskStudents.length,
      studentIds.length,
      classLeaveRecords.length,
    );

    for (const suggestion of suggestions) {
      this.addSuggestion(suggestion);
    }

    return {
      classId,
      className: classId,
      classAttendanceRate: Math.round(classAttendanceRate * 10) / 10,
      atRiskStudentCount: atRiskStudents.length,
      teacherAttentionNeeded: Math.ceil(atRiskStudents.length / 5),
      overallRiskLevel,
      riskDistribution: {
        attendance: Math.round((1 - classAttendanceRate / 100) * 100),
        leave: Math.round(
          (classLeaveRecords.length / Math.max(studentIds.length, 1)) * 10,
        ),
      },
      suggestions,
      analyzedAt: new Date(),
    };
  }

  /**
   * 智能建议列表（带过滤）
   */
  async getSuggestions(filters: GetSuggestionsDto): Promise<{
    suggestions: AiSuggestion[];
    total: number;
    page: number;
    limit: number;
  }> {
    let filtered = [...this.suggestionsStore];

    if (filters.studentId) {
      filtered = filtered.filter((s) => s.studentId === filters.studentId);
    }
    if (filters.classId) {
      filtered = filtered.filter((s) => s.classId === filters.classId);
    }
    if (filters.type) {
      filtered = filtered.filter((s) => s.type === filters.type);
    }
    if (filters.priority) {
      filtered = filtered.filter((s) => s.priority === filters.priority);
    }
    if (filters.urgency) {
      filtered = filtered.filter((s) => s.urgency === filters.urgency);
    }
    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }
    if (filters.startDate) {
      filtered = filtered.filter(
        (s) => new Date(s.createdAt) >= new Date(filters.startDate),
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (s) => new Date(s.createdAt) <= new Date(filters.endDate),
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return { suggestions: paginated, total, page, limit };
  }

  /**
   * 获取建议统计
   */
  async getSuggestionStats(classId?: string): Promise<SuggestionStatsResponse> {
    let suggestions = [...this.suggestionsStore];

    if (classId) {
      suggestions = suggestions.filter((s) => s.classId === classId);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const byPriority: Record<SuggestionPriority, number> = {
      [SuggestionPriority.LOW]: 0,
      [SuggestionPriority.MEDIUM]: 0,
      [SuggestionPriority.HIGH]: 0,
      [SuggestionPriority.CRITICAL]: 0,
    };

    const byType: Record<SuggestionType, number> = {
      [SuggestionType.ATTENDANCE_RISK]: 0,
      [SuggestionType.ACADEMIC_RISK]: 0,
      [SuggestionType.RESOURCE_OPTIMIZATION]: 0,
      [SuggestionType.PROCESS_IMPROVEMENT]: 0,
      [SuggestionType.HEALTH_SAFETY]: 0,
      [SuggestionType.SPECIAL_ATTENTION]: 0,
      [SuggestionType.RESOURCE_ALLOCATION]: 0,
      [SuggestionType.ALERT_RESOLVED]: 0,
    };

    const byStatus: Record<string, number> = {};

    for (const s of suggestions) {
      byPriority[s.priority]++;
      byType[s.type]++;
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    }

    return {
      totalSuggestions: suggestions.length,
      byPriority,
      byType,
      byStatus,
      highPriorityCount:
        byPriority[SuggestionPriority.HIGH] +
        byPriority[SuggestionPriority.CRITICAL],
      criticalCount: byPriority[SuggestionPriority.CRITICAL],
      recentAlertsCount: suggestions.filter((s) => {
        return new Date(s.createdAt) >= sevenDaysAgo;
      }).length,
      resolvedCount: byStatus['actioned'] || 0,
    };
  }

  /**
   * 更新建议状态
   */
  async updateSuggestionStatus(
    suggestionId: string,
    dto: UpdateSuggestionStatusDto,
  ): Promise<AiSuggestion | null> {
    const suggestion = this.suggestionsStore.find(
      (s) => s.suggestionId === suggestionId,
    );
    if (!suggestion) return null;

    if (dto.status) {
      suggestion.status = dto.status as AiSuggestion['status'];
    }

    return suggestion;
  }

  /**
   * 手动触发 AI 分析
   * F-AI-001: 执行全量学生出勤分析并生成建议
   */
  async triggerAnalysis(classId?: string): Promise<{
    analyzedStudents: number;
    analyzedClasses: number;
    newSuggestions: number;
    messages: string[];
  }> {
    this.logger.log(`触发AI分析: classId=${classId || '全量'}`);

    const messages: string[] = [];
    let analyzedClasses = 0;
    let totalAnalyzedStudents = 0;
    let newSuggestionsCount = 0;

    const classRecords = await this.attendanceRepository
      .createQueryBuilder('a')
      .select('DISTINCT a.class_id', 'classId')
      .getRawMany();

    for (const record of classRecords) {
      if (classId && record.classId !== classId) continue;

      const classStudentIds = await this.attendanceRepository
        .createQueryBuilder('a')
        .select('DISTINCT a.student_id', 'studentId')
        .where('a.class_id = :classId', { classId: record.classId })
        .getRawMany();
      totalAnalyzedStudents += classStudentIds.length;

      const classAnalysis = await this.getClassAnalysis(record.classId);
      analyzedClasses++;

      for (const _suggestion of classAnalysis.suggestions) {
        newSuggestionsCount++;
      }

      messages.push(
        `班级 ${record.classId}: 出勤率 ${classAnalysis.classAttendanceRate}%, 风险学生 ${classAnalysis.atRiskStudentCount}人`,
      );
    }

    messages.push(
      `分析完成: 共分析 ${analyzedClasses} 个班级, 生成 ${newSuggestionsCount} 条建议`,
    );

    return {
      analyzedStudents: totalAnalyzedStudents,
      analyzedClasses,
      newSuggestions: newSuggestionsCount,
      messages,
    };
  }

  // ==================== 私有分析方法 ====================

  private calculateAttendanceRiskScore(
    attendanceRate: number,
    consecutiveAbsentDays: number,
    lateCountLast7Days: number,
    absentCount: number,
    sickLeaveCount: number,
  ): number {
    let score = 0;
    if (attendanceRate < 80) score += 40;
    else if (attendanceRate < 90) score += 25;
    else if (attendanceRate < 95) score += 10;
    else if (attendanceRate < 98) score += 5;

    if (consecutiveAbsentDays >= 5) score += 30;
    else if (consecutiveAbsentDays >= 3) score += 20;
    else if (consecutiveAbsentDays >= 2) score += 10;
    else if (consecutiveAbsentDays >= 1) score += 5;

    if (lateCountLast7Days >= 5) score += 15;
    else if (lateCountLast7Days >= 3) score += 10;
    else if (lateCountLast7Days >= 2) score += 5;

    if (absentCount >= 5) score += 10;
    else if (absentCount >= 3) score += 5;

    if (sickLeaveCount >= 5) score += 5;

    return Math.min(100, score);
  }

  private detectConsecutiveAbsences(records: Attendance[]): number {
    if (records.length === 0) return 0;

    const sorted = [...records].sort(
      (a, b) =>
        new Date(b.attendanceDate).getTime() -
        new Date(a.attendanceDate).getTime(),
    );

    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const record of sorted) {
      if (
        record.status === AttendanceStatus.ABSENT ||
        record.status === AttendanceStatus.ABSENT_WITH_LEAVE
      ) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private detectAttendancePattern(records: Attendance[]): string | undefined {
    if (records.length < 7) return undefined;

    const mondayRecords = records.filter((r) => {
      return new Date(r.attendanceDate).getDay() === 1;
    });
    const mondayLateRate =
      mondayRecords.length > 0
        ? mondayRecords.filter((r) => r.status === AttendanceStatus.LATE)
            .length / mondayRecords.length
        : 0;

    const fridayRecords = records.filter((r) => {
      return new Date(r.attendanceDate).getDay() === 5;
    });
    const fridayAbsentRate =
      fridayRecords.length > 0
        ? fridayRecords.filter(
            (r) =>
              r.status === AttendanceStatus.ABSENT ||
              r.status === AttendanceStatus.ABSENT_WITH_LEAVE,
          ).length / fridayRecords.length
        : 0;

    if (mondayLateRate > 0.5) return '周一固定迟到模式';
    if (fridayAbsentRate > 0.4) return '周五缺席模式（疑似连休）';
    return undefined;
  }

  private async getRiskStudents(
    classId?: string,
  ): Promise<{ studentId: string; riskScore: number }[]> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('a')
      .select('a.student_id', 'studentId')
      .addSelect('a.class_id', 'classId')
      .where('a.attendance_date BETWEEN :start AND :end', {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      });

    if (classId) {
      queryBuilder.andWhere('a.class_id = :classId', { classId });
    }

    const studentGroups = await queryBuilder
      .groupBy('a.student_id, a.class_id')
      .getRawMany();

    const riskStudents: { studentId: string; riskScore: number }[] = [];

    for (const group of studentGroups) {
      const records = await this.attendanceRepository.find({
        where: {
          studentId: group.studentId,
          attendanceDate: Between(thirtyDaysAgo, today),
        },
      });

      const totalDays = records.length;
      const absentDays = records.filter(
        (r) =>
          r.status === AttendanceStatus.ABSENT ||
          r.status === AttendanceStatus.ABSENT_WITH_LEAVE,
      ).length;
      const presentDays = records.filter(
        (r) => r.status === AttendanceStatus.PRESENT,
      ).length;
      const attendanceRate =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      const consecutiveAbsent = this.detectConsecutiveAbsences(records);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLate = records.filter((r) => {
        const date = new Date(r.attendanceDate);
        return date >= sevenDaysAgo && r.status === AttendanceStatus.LATE;
      }).length;

      const sickLeaveDays = records.filter(
        (r) => r.status === AttendanceStatus.SICK_LEAVE,
      ).length;

      const riskScore = this.calculateAttendanceRiskScore(
        attendanceRate,
        consecutiveAbsent,
        recentLate,
        absentDays,
        sickLeaveDays,
      );

      if (riskScore >= 30) {
        riskStudents.push({ studentId: group.studentId, riskScore });
      }
    }

    return riskStudents.sort((a, b) => b.riskScore - a.riskScore);
  }

  private async getAttendanceRiskStats(
    startDate: Date,
    endDate: Date,
    classId?: string,
  ): Promise<{
    avgAttendanceRate: number;
    totalAbsent: number;
    totalLate: number;
    atRiskStudentCount: number;
  }> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('a')
      .where('a.attendance_date BETWEEN :start AND :end', {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      });

    if (classId) {
      queryBuilder.andWhere('a.class_id = :classId', { classId });
    }

    const records = await queryBuilder.getMany();
    const total = records.length;
    const present = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absent = records.filter(
      (r) =>
        r.status === AttendanceStatus.ABSENT ||
        r.status === AttendanceStatus.ABSENT_WITH_LEAVE,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;

    const riskStudents = await this.getRiskStudents(classId);

    return {
      avgAttendanceRate: total > 0 ? (present / total) * 100 : 0,
      totalAbsent: absent,
      totalLate: late,
      atRiskStudentCount: riskStudents.length,
    };
  }

  private generateStudentSuggestions(
    studentId: string,
    classId: string,
    attendanceRate: number,
    consecutiveAbsentDays: number,
    lateCountLast7Days: number,
    absentCount: number,
    sickLeaveCount: number,
    pattern: string | undefined,
  ): AiSuggestion[] {
    const suggestions: AiSuggestion[] = [];

    // 连续缺席警告
    if (consecutiveAbsentDays >= 3) {
      const riskScore = this.calculateAttendanceRiskScore(
        attendanceRate,
        consecutiveAbsentDays,
        lateCountLast7Days,
        absentCount,
        sickLeaveCount,
      );
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.ATTENDANCE_RISK,
        priority:
          consecutiveAbsentDays >= 5
            ? SuggestionPriority.CRITICAL
            : SuggestionPriority.HIGH,
        urgency: SuggestionUrgency.URGENT,
        title: `学生连续缺席 ${consecutiveAbsentDays} 天`,
        description: `该学生已连续缺席 ${consecutiveAbsentDays} 天，需要立即联系家长确认情况。`,
        studentId,
        classId,
        recommendations: [
          '立即联系家长确认学生状况',
          '检查是否因健康问题导致缺席',
          '如无法联系家长，考虑家访',
          '更新班主任了解该生是否有特殊家庭情况',
        ],
        riskMetrics: [
          {
            metric: '连续缺席天数',
            value: consecutiveAbsentDays,
            threshold: 3,
            unit: '天',
          },
          {
            metric: '综合风险得分',
            value: riskScore,
            threshold: 30,
          },
        ],
        analysisBasis: `根据最近30天出勤记录分析，该生连续缺席已达${consecutiveAbsentDays}天`,
        suggestedAction: '联系家长 + 上报校务主任',
        targetRoles: ['school_director', 'officer', 'teacher'],
        status: 'new',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // 频繁迟到警告
    if (lateCountLast7Days >= 3) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.ATTENDANCE_RISK,
        priority:
          lateCountLast7Days >= 5
            ? SuggestionPriority.HIGH
            : SuggestionPriority.MEDIUM,
        urgency: SuggestionUrgency.FOLLOW_UP,
        title: `近期迟到 ${lateCountLast7Days} 次`,
        description: `该学生在最近7天内有 ${lateCountLast7Days} 次迟到记录，建议与学生/家长沟通了解原因。`,
        studentId,
        classId,
        recommendations: [
          '与学生进行一对一谈话，了解迟到原因',
          '联系家长配合改善',
          '评估是否需要调整校车时间表',
          '持续监控未来2周的出勤情况',
        ],
        riskMetrics: [
          {
            metric: '7天内迟到次数',
            value: lateCountLast7Days,
            threshold: 3,
            unit: '次',
          },
        ],
        analysisBasis: `最近7天迟到次数分析: ${lateCountLast7Days}次，高于正常阈值(3次)`,
        suggestedAction: '约谈学生 + 联系家长',
        targetRoles: ['teacher'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    // 出勤率偏低
    if (attendanceRate < 90) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.ATTENDANCE_RISK,
        priority:
          attendanceRate < 80
            ? SuggestionPriority.HIGH
            : SuggestionPriority.MEDIUM,
        urgency: SuggestionUrgency.FOLLOW_UP,
        title: `近期出勤率偏低 (${Math.round(attendanceRate)}%)`,
        description: `该学生最近30天出勤率为 ${Math.round(attendanceRate)}%，低于健康标准(95%)。`,
        studentId,
        classId,
        recommendations: [
          '与家长沟通了解家庭情况',
          '评估是否需要额外学习支持',
          '考虑是否有校园适应问题',
          '建立出勤改善计划并定期跟进',
        ],
        riskMetrics: [
          {
            metric: '出勤率',
            value: Math.round(attendanceRate),
            threshold: 95,
            unit: '%',
          },
        ],
        analysisBasis: `30天出勤率统计: ${Math.round(attendanceRate)}%`,
        suggestedAction: '联系家长 + 持续关注',
        targetRoles: ['teacher', 'officer'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    // 模式识别建议
    if (pattern) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.ATTENDANCE_RISK,
        priority: SuggestionPriority.MEDIUM,
        urgency: SuggestionUrgency.FOLLOW_UP,
        title: `检测到异常出勤模式: ${pattern}`,
        description: `AI分析发现该学生存在 "${pattern}"，这可能是有意缺勤的信号。`,
        studentId,
        classId,
        recommendations: [
          '与学生沟通确认实际情况',
          '如确认有意缺勤，启动纪律/辅导流程',
          '记录相关证据',
        ],
        riskMetrics: [],
        analysisBasis: `AI模式识别算法检测到特定日期的异常出勤规律`,
        suggestedAction: '进一步调查 + 记录',
        targetRoles: ['teacher'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    // 健康/病假关注
    if (sickLeaveCount >= 4) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.HEALTH_SAFETY,
        priority: SuggestionPriority.MEDIUM,
        urgency: SuggestionUrgency.FOLLOW_UP,
        title: `近期病假次数较多 (${sickLeaveCount}次)`,
        description: `该学生最近30天内有 ${sickLeaveCount} 次病假记录，建议关注学生健康状况。`,
        studentId,
        classId,
        recommendations: [
          '了解是否有慢性健康问题',
          '如有需要，建议家长安排健康检查',
          '评估是否需要学习调适安排',
          '如病假集中在某个时期，考虑是否有心理因素',
        ],
        riskMetrics: [
          {
            metric: '病假次数',
            value: sickLeaveCount,
            threshold: 4,
            unit: '次',
          },
        ],
        analysisBasis: `30天内病假记录统计: ${sickLeaveCount}次`,
        suggestedAction: '了解健康状况 + 必要时建议就医',
        targetRoles: ['teacher', 'school_director'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  private generateClassSuggestions(
    classId: string,
    classAttendanceRate: number,
    atRiskStudentCount: number,
    totalStudents: number,
    leaveCount: number,
  ): AiSuggestion[] {
    const suggestions: AiSuggestion[] = [];

    // 班级出勤率偏低
    if (classAttendanceRate < 90) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.ATTENDANCE_RISK,
        priority: SuggestionPriority.HIGH,
        urgency: SuggestionUrgency.URGENT,
        title: `班级出勤率偏低 (${Math.round(classAttendanceRate)}%)`,
        description: `班级 ${classId} 最近30天平均出勤率为 ${Math.round(classAttendanceRate)}%，低于学校标准(95%)。`,
        classId,
        recommendations: [
          '召开班主任会议讨论对策',
          '分析缺席原因（疾病/交通/其他）',
          '加强家长沟通',
          '必要时上报校务主任',
        ],
        riskMetrics: [
          {
            metric: '班级出勤率',
            value: Math.round(classAttendanceRate),
            threshold: 95,
            unit: '%',
          },
          {
            metric: '风险学生数',
            value: atRiskStudentCount,
            threshold: 3,
            unit: '人',
          },
        ],
        analysisBasis: `班级整体出勤数据分析`,
        suggestedAction: '班级会议讨论 + 家长通知',
        targetRoles: ['school_director', 'officer'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    // 风险学生比例偏高
    if (totalStudents > 0 && atRiskStudentCount / totalStudents > 0.2) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.RESOURCE_OPTIMIZATION,
        priority: SuggestionPriority.MEDIUM,
        urgency: SuggestionUrgency.FOLLOW_UP,
        title: `班级风险学生比例偏高 (${atRiskStudentCount}/${totalStudents})`,
        description: `班级中有 ${atRiskStudentCount} 名学生需要关注，占班级总人数 ${Math.round((atRiskStudentCount / totalStudents) * 100)}%。`,
        classId,
        recommendations: [
          '优先跟进高风险学生',
          '考虑组织班级活动提升凝聚力',
          '如有必要，引入学生辅导服务',
        ],
        riskMetrics: [
          {
            metric: '风险学生比例',
            value: Math.round((atRiskStudentCount / totalStudents) * 100),
            threshold: 20,
            unit: '%',
          },
        ],
        analysisBasis: `班级风险学生统计分析`,
        suggestedAction: '学生辅导 + 班级活动',
        targetRoles: ['school_director', 'teacher'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    // 流程改进建议
    if (totalStudents > 0 && leaveCount > totalStudents * 0.5) {
      suggestions.push({
        suggestionId: uuidv4(),
        type: SuggestionType.PROCESS_IMPROVEMENT,
        priority: SuggestionPriority.LOW,
        urgency: SuggestionUrgency.ROUTINE,
        title: `班级请假申请较频繁`,
        description: `班级 ${classId} 近30天有 ${leaveCount} 条请假记录，建议优化请假流程管理。`,
        classId,
        recommendations: [
          '检查是否有请假制度执行不到位的情况',
          '加强对家长的请假政策宣传',
          '评估是否需要增设健康支持服务',
        ],
        analysisBasis: `班级请假记录统计分析`,
        suggestedAction: '优化请假流程 + 政策宣传',
        targetRoles: ['officer'],
        status: 'new',
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  private addSuggestion(suggestion: AiSuggestion): void {
    const existing = this.suggestionsStore.find(
      (s) =>
        s.studentId === suggestion.studentId &&
        s.type === suggestion.type &&
        s.status === 'new' &&
        (!s.expiresAt || new Date(s.expiresAt) > new Date()),
    );

    if (!existing) {
      this.suggestionsStore.push(suggestion);
    }
  }

  private generateDashboardSummaryMessage(
    attendanceStats: {
      avgAttendanceRate: number;
      atRiskStudentCount: number;
      totalAbsent: number;
      totalLate: number;
    },
    riskStudents: { studentId: string; riskScore: number }[],
    highPriorityCount: number,
  ): string {
    const { avgAttendanceRate, atRiskStudentCount, totalLate } =
      attendanceStats;

    if (highPriorityCount > 0) {
      return `⚠️ 有 ${highPriorityCount} 条高优先级建议待处理，涉及 ${atRiskStudentCount} 名风险学生。`;
    }
    if (avgAttendanceRate < 90) {
      return `📊 全校近期出勤率 ${Math.round(avgAttendanceRate)}%，${atRiskStudentCount} 名学生需要关注。`;
    }
    if (atRiskStudentCount > 0) {
      return `📊 ${atRiskStudentCount} 名学生出勤需要关注，${totalLate} 次迟到记录。`;
    }
    return `✅ 今日暂无明显异常，建议继续保持关注。`;
  }

  private generateRecommendedActions(
    attendanceStats: {
      avgAttendanceRate: number;
      atRiskStudentCount: number;
    },
    riskStudents: { studentId: string; riskScore: number }[],
  ): string[] {
    const actions: string[] = [];

    if (attendanceStats.avgAttendanceRate < 90) {
      actions.push('建议立即联系高风险学生的家长');
    }
    if (attendanceStats.atRiskStudentCount > 0) {
      const criticalStudents = riskStudents.filter(
        (s) => s.riskScore >= 80,
      ).length;
      if (criticalStudents > 0) {
        actions.push(`优先跟进 ${criticalStudents} 名高风险(分数≥80)学生`);
      }
    }

    if (actions.length === 0) {
      actions.push('继续日常出勤监控');
      actions.push('建议本周进行一次全校出勤回顾');
    }

    return actions;
  }
}
