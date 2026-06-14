import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  ApprovalLevel,
} from './leave.entity';
import {
  CreateLeaveDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  LeaveQueryDto,
  LeaveStatisticsDto,
  SetFollowUpDto,
} from './dto/leave.dto';
import { UserRole } from '../user/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationUrgency } from '../notification/template.entity';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveApplication)
    private leaveRepository: Repository<LeaveApplication>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 生成申请编号
   */
  private generateApplicationNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LEAVE-${dateStr}-${random}`;
  }

  /**
   * 计算请假天数
   */
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  /**
   * 判断是否需要校务主任审批（>3天）
   */
  private requiresDirectorApproval(totalDays: number): boolean {
    return totalDays > 3;
  }

  /**
   * 判断是否需要医疗证明（病假>2天）
   */
  private requiresMedicalCert(
    leaveType: LeaveType,
    totalDays: number,
  ): boolean {
    return leaveType === LeaveType.SICK && totalDays > 2;
  }

  /**
   * 创建请假申请
   */
  async create(
    dto: CreateLeaveDto,
    userId: string,
    schoolId: string,
  ): Promise<LeaveApplication> {
    const totalDays = this.calculateDays(dto.startDate, dto.endDate);

    // 业务规则校验
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('结束日期不能早于开始日期');
    }

    const requiresDirector = this.requiresDirectorApproval(totalDays);
    const requiresMedical = this.requiresMedicalCert(dto.leaveType, totalDays);

    // 确定初始审批级别
    let currentLevel = ApprovalLevel.CLASS_TEACHER;
    let initialStatus = LeaveStatus.PENDING;
    if (requiresDirector) {
      initialStatus = LeaveStatus.PENDING_DIRECTOR;
      currentLevel = ApprovalLevel.SCHOOL_DIRECTOR;
    }

    const application = this.leaveRepository.create({
      applicationNo: this.generateApplicationNo(),
      schoolId,
      studentId: dto.studentId,
      classId: dto.classId,
      leaveType: dto.leaveType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      totalDays,
      reason: dto.reason,
      documentUrl: dto.documentUrl,
      medicalCertRequired: requiresMedical,
      status: initialStatus,
      currentApprovalLevel: currentLevel,
      parentSubmittedAt: new Date(),
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      followUpContent: dto.followUpContent,
      createdBy: userId,
    });

    const saved = await this.leaveRepository.save(application);

    // AI核验（模拟）
    await this.performAIReview(saved);

    // 自动通知：发送请假申请通知给班主任和校务人员
    await this.sendLeaveSubmissionNotification(saved);

    return this.findOne(saved.id);
  }

  /**
   * 请假申请提交后自动通知班主任和校务人员
   */
  private async sendLeaveSubmissionNotification(
    application: LeaveApplication,
  ): Promise<void> {
    try {
      // 通知班主任
      // 在实际实现中，应通过 classId 查询该班级的班主任
      // 这里使用 classTeacherNotified 标记避免重复通知
      await this.notificationService.sendNotification(
        {
          recipientIds: [], // TODO: 查询该班级的班主任 userId
          title: '新请假申请待审批',
          content: `学生 ${application.student?.name || application.studentId} 提交了请假申请（${application.totalDays}天），请及时审批。`,
          recipientType: 'staff',
          urgency: NotificationUrgency.NORMAL,
          relatedEntityType: 'leave_application',
          relatedEntityId: application.id,
        },
        application.createdBy,
        application.schoolId,
      );
    } catch (error) {
      console.warn('[Leave] Failed to send submission notification:', error);
    }
  }

  /**
   * AI核验（模拟）
   * 实际应调用Coze AI对医疗证明进行核验
   *
   * 高风险检测：
   * 1. 同诊所证明：同一诊所开具的多份证明（通过documentUrl路径模式识别）
   * 2. 同日多名学生：同一日期有多名学生提交请假申请
   */
  private async performAIReview(application: LeaveApplication): Promise<void> {
    let isHighRisk = false;
    const riskNotes: string[] = [];

    // 高风险检测1：检查是否有同诊所证明
    if (application.documentUrl) {
      const sameClinicRisk = await this.checkSameClinicRisk(application);
      if (sameClinicRisk.isHighRisk) {
        isHighRisk = true;
        riskNotes.push(sameClinicRisk.note);
      }
    }

    // 高风险检测2：检查同日多名学生
    const sameDayRisk = await this.checkSameDayMultipleStudents(application);
    if (sameDayRisk.isHighRisk) {
      isHighRisk = true;
      riskNotes.push(sameDayRisk.note);
    }

    // 如果是高风险案例，标记需人工核验
    if (isHighRisk) {
      await this.leaveRepository.update(application.id, {
        aiReviewFlagged: true,
        aiReviewNote: `高风险案例：${riskNotes.join('；')}，建议人工复查`,
      });
    }
  }

  /**
   * 检测同诊所证明风险
   */
  private async checkSameClinicRisk(
    application: LeaveApplication,
  ): Promise<{ isHighRisk: boolean; note: string }> {
    if (!application.documentUrl) {
      return { isHighRisk: false, note: '' };
    }

    // 从documentUrl中提取诊所标识（模拟，实际应解析URL或OCR识别）
    // 假设URL格式：https://clinic.example.com/reports/{clinicId}/{reportId}
    const clinicMatch =
      application.documentUrl.match(/clinic[_-]?id[=:]?([a-zA-Z0-9]+)/i) ||
      application.documentUrl.match(/\/clinic\/([a-zA-Z0-9]+)\//);

    if (!clinicMatch) {
      return { isHighRisk: false, note: '' };
    }

    const clinicId = clinicMatch[1];

    // 查询同诊所近期（30天内）的其他申请
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sameClinicCount = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.documentUrl LIKE :pattern', {
        pattern: `%clinic%${clinicId}%`,
      })
      .andWhere('leave.id != :id', { id: application.id })
      .andWhere('leave.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('leave.documentUrl IS NOT NULL')
      .getCount();

    // 同一诊所30天内有3份以上证明视为高风险
    if (sameClinicCount >= 3) {
      return {
        isHighRisk: true,
        note: `同一诊所(${clinicId})近期已出具${sameClinicCount}份证明`,
      };
    }

    return { isHighRisk: false, note: '' };
  }

  /**
   * 检测同日多名学生请假风险
   */
  private async checkSameDayMultipleStudents(
    application: LeaveApplication,
  ): Promise<{ isHighRisk: boolean; note: string }> {
    // 提取申请日期（只取日期部分）
    const applicationDate = application.startDate.toISOString().split('T')[0];

    // 查询同日同班级的其他申请
    const sameDayCount = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('DATE(leave.startDate) = :date', { date: applicationDate })
      .andWhere('leave.classId = :classId', { classId: application.classId })
      .andWhere('leave.id != :id', { id: application.id })
      .getCount();

    // 同日同班级有2名以上学生请假视为高风险
    if (sameDayCount >= 2) {
      return {
        isHighRisk: true,
        note: `同日(${applicationDate})同班级已有${sameDayCount}名学生请假`,
      };
    }

    return { isHighRisk: false, note: '' };
  }

  /**
   * 获取请假列表
   * 按角色过滤：家长只能看到自己关联的请假申请
   */
  async findAll(
    query: LeaveQueryDto,
    userId: string,
    userRole: UserRole,
  ): Promise<{ applications: LeaveApplication[]; total: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const qb = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.student', 'student')
      .orderBy('leave.createdAt', 'DESC');

    // 按角色过滤
    if (userRole === UserRole.PARENT) {
      // 家长只能看到与自己关联的学生请假记录（需要通过student.parentId关联）
      // 实际应查询关联的学生ID列表
      qb.andWhere(
        'leave.studentId IN (SELECT s.id FROM students s WHERE s.parentId = :userId)',
        { userId },
      );
    }

    if (query.leaveType) {
      qb.andWhere('leave.leaveType = :leaveType', {
        leaveType: query.leaveType,
      });
    }
    if (query.status) {
      qb.andWhere('leave.status = :status', { status: query.status });
    }
    if (query.studentId) {
      qb.andWhere('leave.studentId = :studentId', {
        studentId: query.studentId,
      });
    }
    if (query.classId) {
      qb.andWhere('leave.classId = :classId', { classId: query.classId });
    }
    if (query.startDate) {
      qb.andWhere('leave.startDate >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }
    if (query.endDate) {
      qb.andWhere('leave.endDate <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const [applications, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { applications, total };
  }

  /**
   * 获取单个请假申请
   */
  async findOne(id: string): Promise<LeaveApplication> {
    const application = await this.leaveRepository.findOne({
      where: { id },
      relations: ['student', 'class'],
    });

    if (!application) {
      throw new NotFoundException('请假申请不存在');
    }

    return application;
  }

  /**
   * 计算代课老师当日已有课时数
   * 通过查询班级当日上课记录来估算教师课时负担
   *
   * @param substituteTeacherId 代课老师ID
   * @param dateStr 请假开始日期（代课日期）
   * @param excludeClassId 排除的班级ID（原任课班级）
   * @returns 课时数
   */
  private async computeSubstituteTeacherClassHours(
    substituteTeacherId: string,
    dateStr: string,
    excludeClassId?: string,
  ): Promise<number> {
    // 使用 attendance_records 表估算教师课时
    // 统计该教师当日已登记的班级数量（每个班级代表一节课时）
    let queryBuilder = this.leaveRepository.manager
      .createQueryBuilder('leave', 'unused')
      .select('')
      .from('attendance_records', 'ar');

    // 如果存在班级教师关联表 class_teachers，使用它来统计
    // 否则通过班级上课记录数估算（每个班级一节课）
    queryBuilder = queryBuilder
      .innerJoin('class_teachers', 'ct', 'ct.class_id = ar.class_id')
      .where('ct.teacher_id = :teacherId', { teacherId: substituteTeacherId })
      .andWhere('ar.date = :date', { date: dateStr });

    if (excludeClassId) {
      queryBuilder = queryBuilder.andWhere('ar.class_id != :excludeClassId', {
        excludeClassId,
      });
    }

    // 统计该教师当日已有课时（去重班级数）
    const result = await queryBuilder
      .select('COUNT(DISTINCT ar.class_id)', 'classCount')
      .getRawOne();

    return parseInt(result?.classCount || '0', 10);
  }

  /**
   * 班主任审批
   * 验证审批人是否为该班级的班主任（通过 classId 关联）
   */
  async classTeacherApprove(
    id: string,
    dto: ApproveLeaveDto,
    approverId: string,
    approverRole: UserRole,
    approverClassId?: string,
  ): Promise<LeaveApplication> {
    const application = await this.findOne(id);

    if (application.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('当前状态不允许班主任审批');
    }

    // 权限验证：校务主任和校务人员可直接审批
    // 班主任角色需要验证是否为该班级班主任
    if (approverRole === UserRole.TEACHER) {
      // 检查是否为该班级的班主任
      if (approverClassId !== application.classId) {
        throw new BadRequestException(
          '您不是该班级的班主任，无权审批此请假申请',
        );
      }
    }

    // 如果需要校务主任审批，则进入下一级
    const requiresDirector = this.requiresDirectorApproval(
      application.totalDays,
    );
    let newStatus = LeaveStatus.APPROVED;
    let newLevel = ApprovalLevel.SCHOOL_ADMIN;

    if (requiresDirector) {
      newStatus = LeaveStatus.PENDING_DIRECTOR;
      newLevel = ApprovalLevel.SCHOOL_DIRECTOR;
    }

    // 如果提供了代课老师，计算其当日已有课时
    let substituteTeacherClassHours: number | undefined;
    if (dto.substituteTeacherId) {
      substituteTeacherClassHours =
        await this.computeSubstituteTeacherClassHours(
          dto.substituteTeacherId,
          application.startDate.toISOString().split('T')[0],
          application.classId,
        );
    }

    await this.leaveRepository.update(id, {
      status: newStatus,
      currentApprovalLevel: newLevel,
      classTeacherApprovedBy: approverId,
      classTeacherApprovedAt: new Date(),
      classTeacherComment: dto.comment,
    });

    const updated = await this.findOne(id);
    // 附加代课老师课时信息到实体
    (updated as any).substituteTeacherClassHours = substituteTeacherClassHours;

    // 自动通知家长：请假审批通过
    await this.sendLeaveApprovalNotification(updated);

    return updated;
  }

  /**
   * 校务主任审批（超过3天）
   */
  async directorApprove(
    id: string,
    dto: ApproveLeaveDto,
    approverId: string,
  ): Promise<LeaveApplication> {
    const application = await this.findOne(id);

    if (application.status !== LeaveStatus.PENDING_DIRECTOR) {
      throw new BadRequestException('当前状态不允许校务主任审批');
    }

    // 如果提供了代课老师，计算其当日已有课时
    let substituteTeacherClassHours: number | undefined;
    if (dto.substituteTeacherId) {
      substituteTeacherClassHours =
        await this.computeSubstituteTeacherClassHours(
          dto.substituteTeacherId,
          application.startDate.toISOString().split('T')[0],
          application.classId,
        );
    }

    await this.leaveRepository.update(id, {
      status: LeaveStatus.APPROVED,
      currentApprovalLevel: ApprovalLevel.SCHOOL_ADMIN,
      directorApprovedBy: approverId,
      directorApprovedAt: new Date(),
      directorComment: dto.comment,
    });

    const updated = await this.findOne(id);
    (updated as any).substituteTeacherClassHours = substituteTeacherClassHours;

    // 自动通知家长：请假审批通过（校务主任审批）
    await this.sendLeaveApprovalNotification(updated);

    return updated;
  }

  /**
   * 拒绝请假申请
   */
  async reject(
    id: string,
    dto: RejectLeaveDto,
    rejecterId: string,
  ): Promise<LeaveApplication> {
    const application = await this.findOne(id);

    if (
      application.status !== LeaveStatus.PENDING &&
      application.status !== LeaveStatus.PENDING_DIRECTOR
    ) {
      throw new BadRequestException('当前状态不允许拒绝');
    }

    await this.leaveRepository.update(id, {
      status: LeaveStatus.REJECTED,
      directorComment: dto.reason,
      directorApprovedBy: rejecterId,
      directorApprovedAt: new Date(),
    });

    const updated = await this.findOne(id);
    // 自动通知家长：请假被拒绝
    await this.sendLeaveRejectionNotification(updated, dto.reason);

    return updated;
  }

  /**
   * 家长取消请假申请
   */
  async cancel(id: string): Promise<LeaveApplication> {
    const application = await this.findOne(id);

    if (
      application.status !== LeaveStatus.PENDING &&
      application.status !== LeaveStatus.PENDING_DIRECTOR
    ) {
      throw new BadRequestException('当前状态不允许取消');
    }

    await this.leaveRepository.update(id, {
      status: LeaveStatus.CANCELLED,
    });

    return this.findOne(id);
  }

  /**
   * 销假（学生返校）
   */
  async checkIn(id: string, operatorId: string): Promise<LeaveApplication> {
    const application = await this.findOne(id);

    if (application.status !== LeaveStatus.APPROVED) {
      throw new BadRequestException('只有已批准的请假可以销假');
    }

    await this.leaveRepository.update(id, {
      status: LeaveStatus.CHECKED_IN,
      checkedInAt: new Date(),
      checkedInBy: operatorId,
    });

    return this.findOne(id);
  }

  /**
   * 设置跟进提醒
   */
  async setFollowUp(
    id: string,
    dto: SetFollowUpDto,
  ): Promise<LeaveApplication> {
    await this.leaveRepository.update(id, {
      followUpDate: new Date(dto.followUpDate),
      followUpContent: dto.followUpContent,
    });

    return this.findOne(id);
  }

  /**
   * 统计请假数据
   */
  async getStatistics(dto: LeaveStatisticsDto, schoolId: string): Promise<any> {
    const qb = this.leaveRepository
      .createQueryBuilder('leave')
      .select('leave.leaveType', 'leaveType')
      .addSelect('leave.status', 'status')
      .addSelect('leave.classId', 'classId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(leave.totalDays)', 'totalDays')
      .where('leave.schoolId = :schoolId', { schoolId })
      .andWhere('leave.startDate >= :startDate', {
        startDate: new Date(dto.startDate),
      })
      .andWhere('leave.endDate <= :endDate', {
        endDate: new Date(dto.endDate),
      });

    if (dto.classId) {
      qb.andWhere('leave.classId = :classId', { classId: dto.classId });
    }

    const stats = await qb
      .groupBy('leave.leaveType')
      .addGroupBy('leave.status')
      .addGroupBy('leave.classId')
      .getRawMany();

    const total = stats.reduce((sum, s) => sum + parseInt(s.count || '0'), 0);
    const totalDays = stats.reduce(
      (sum, s) => sum + parseFloat(s.totalDays || '0'),
      0,
    );

    return { total, totalDays, breakdown: stats };
  }

  /**
   * 获取待处理请假申请
   */
  async getPendingApplications(schoolId: string): Promise<LeaveApplication[]> {
    return this.leaveRepository.find({
      where: [
        { schoolId, status: LeaveStatus.PENDING },
        { schoolId, status: LeaveStatus.PENDING_DIRECTOR },
      ],
      relations: ['student', 'class'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取需AI核验的申请
   */
  async getAIReviewQueue(schoolId: string): Promise<LeaveApplication[]> {
    return this.leaveRepository.find({
      where: { schoolId, aiReviewFlagged: true },
      relations: ['student', 'class'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 确认AI核验（人工复查后）
   */
  async confirmAIReview(id: string): Promise<LeaveApplication> {
    await this.leaveRepository.update(id, {
      aiReviewFlagged: false,
      aiReviewNote: '已通过人工复查确认',
    });
    return this.findOne(id);
  }

  /**
   * 发送请假审批通过通知给家长
   */
  private async sendLeaveApprovalNotification(
    application: LeaveApplication,
  ): Promise<void> {
    try {
      // TODO: 查询该学生的家长用户ID
      await this.notificationService.sendNotification(
        {
          recipientIds: [], // 家长 userId
          title: '请假申请已批准',
          content: `您为学生 ${application.student?.name || application.studentId} 提交的请假申请已批准。`,
          recipientType: 'parent',
          urgency: NotificationUrgency.NORMAL,
          relatedEntityType: 'leave_application',
          relatedEntityId: application.id,
        },
        application.createdBy,
        application.schoolId,
      );
    } catch (error) {
      console.warn('[Leave] Failed to send approval notification:', error);
    }
  }

  /**
   * 发送请假被拒绝通知给家长
   */
  private async sendLeaveRejectionNotification(
    application: LeaveApplication,
    reason: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification(
        {
          recipientIds: [], // 家长 userId
          title: '请假申请被拒绝',
          content: `您为学生 ${application.student?.name || application.studentId} 提交的请假申请已被拒绝。原因：${reason}`,
          recipientType: 'parent',
          urgency: NotificationUrgency.NORMAL,
          relatedEntityType: 'leave_application',
          relatedEntityId: application.id,
        },
        application.createdBy,
        application.schoolId,
      );
    } catch (error) {
      console.warn('[Leave] Failed to send rejection notification:', error);
    }
  }
}
