import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  ApprovalLevel,
} from './leave.entity';
import { CreateLeaveDto, ApproveLeaveDto, RejectLeaveDto, LeaveQueryDto, LeaveStatisticsDto, SetFollowUpDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveApplication)
    private leaveRepository: Repository<LeaveApplication>,
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
  private requiresMedicalCert(leaveType: LeaveType, totalDays: number): boolean {
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

    return this.findOne(saved.id);
  }

  /**
   * AI核验（模拟）
   * 实际应调用Coze AI对医疗证明进行核验
   */
  private async performAIReview(application: LeaveApplication): Promise<void> {
    // 模拟：随机5%-10%标记为需人工核验
    const riskLevel = Math.random();
    if (application.documentUrl && riskLevel < 0.1) {
      await this.leaveRepository.update(application.id, {
        aiReviewFlagged: true,
        aiReviewNote: '高风险案例：同一诊所多份证明，建议人工复查',
      });
    }
  }

  /**
   * 获取请假列表
   */
  async findAll(
    query: LeaveQueryDto,
    userId: string,
    userRole: string,
  ): Promise<{ applications: LeaveApplication[]; total: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const qb = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.student', 'student')
      .orderBy('leave.createdAt', 'DESC');

    if (query.leaveType) {
      qb.andWhere('leave.leaveType = :leaveType', { leaveType: query.leaveType });
    }
    if (query.status) {
      qb.andWhere('leave.status = :status', { status: query.status });
    }
    if (query.studentId) {
      qb.andWhere('leave.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.classId) {
      qb.andWhere('leave.classId = :classId', { classId: query.classId });
    }
    if (query.startDate) {
      qb.andWhere('leave.startDate >= :startDate', { startDate: new Date(query.startDate) });
    }
    if (query.endDate) {
      qb.andWhere('leave.endDate <= :endDate', { endDate: new Date(query.endDate) });
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
   * 班主任审批
   */
  async classTeacherApprove(
    id: string,
    dto: ApproveLeaveDto,
    approverId: string,
  ): Promise<LeaveApplication> {
    const application = await this.findOne(id);

    if (application.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('当前状态不允许班主任审批');
    }

    // 如果需要校务主任审批，则进入下一级
    const requiresDirector = this.requiresDirectorApproval(application.totalDays);
    let newStatus = LeaveStatus.APPROVED;
    let newLevel = ApprovalLevel.SCHOOL_ADMIN;

    if (requiresDirector) {
      newStatus = LeaveStatus.PENDING_DIRECTOR;
      newLevel = ApprovalLevel.SCHOOL_DIRECTOR;
    }

    await this.leaveRepository.update(id, {
      status: newStatus,
      currentApprovalLevel: newLevel,
      classTeacherApprovedBy: approverId,
      classTeacherApprovedAt: new Date(),
      classTeacherComment: dto.comment,
    });

    return this.findOne(id);
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

    await this.leaveRepository.update(id, {
      status: LeaveStatus.APPROVED,
      currentApprovalLevel: ApprovalLevel.SCHOOL_ADMIN,
      directorApprovedBy: approverId,
      directorApprovedAt: new Date(),
      directorComment: dto.comment,
    });

    return this.findOne(id);
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

    return this.findOne(id);
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
  async getStatistics(
    dto: LeaveStatisticsDto,
    schoolId: string,
  ): Promise<any> {
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
    const totalDays = stats.reduce((sum, s) => sum + parseFloat(s.totalDays || '0'), 0);

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
}
