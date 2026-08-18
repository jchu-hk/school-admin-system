import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Brackets } from 'typeorm';
import {
  LeaveRequest,
  PortalLeaveType,
  PortalLeaveStatus,
  SubmitterRole,
} from '../entities/leave-request.entity';
import { CreateLeaveDto } from '../dto/create-leave.dto';
import { LeaveQueryDto, ApproveLeaveDto } from '../dto/update-leave.dto';
import { User, UserRole } from '../../user/user.entity';
import { ParentStudentLink } from '../../auth/entities/parent-student-link.entity';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-log.entity';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ParentStudentLink)
    private linkRepository: Repository<ParentStudentLink>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 计算请假天数（含首尾）
   */
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * 获取当前用户可访问的学生ID列表
   * - student: 仅自己
   * - parent: 通过 parent_student_links 关联的子女
   * - teacher / school_staff / school_director: 审批角色，可见全校所有学生（由调用方决定是否按 role 过滤）
   */
  private async getAccessibleStudentIds(
    userId: string,
    role: UserRole,
  ): Promise<string[]> {
    if (role === UserRole.STUDENT) {
      return [userId];
    }

    if (role === UserRole.PARENT) {
      const links = await this.linkRepository.find({
        where: { parentId: userId },
      });
      return links.map((l) => l.studentId);
    }

    // Teacher/Staff/Director — 审批角色，可见全校请假记录（不按学生过滤）
    return [];
  }

  /**
   * 提交请假申请
   * 学生为自己提交；家长为关联子女提交
   */
  async create(
    dto: CreateLeaveDto,
    userId: string,
    role: UserRole,
    ip?: string,
  ): Promise<LeaveRequest> {
    // 验证日期
    const end = new Date(dto.endDate);
    const start = new Date(dto.startDate);
    if (end < start) {
      throw new BadRequestException('结束日期不能早于开始日期');
    }

    // 确定请假学生
    let studentId: string;

    if (role === UserRole.STUDENT) {
      studentId = userId;
    } else if (role === UserRole.PARENT) {
      // 家长代提交 — 需指定 studentId
      if (!dto.studentId) {
        throw new BadRequestException('家长代提交请假需指定学生ID');
      }
      // 验证该学生是否确实关联
      const link = await this.linkRepository.findOne({
        where: { parentId: userId, studentId: dto.studentId },
      });
      if (!link) {
        throw new ForbiddenException('您不是该学生的关联家长');
      }
      studentId = dto.studentId;
    } else {
      throw new ForbiddenException('无权提交请假申请');
    }

    // 检查日期重叠（同一学生在同一时间段已有 pending/approved 请假）
    const overlapping = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.studentId = :studentId', { studentId })
      .andWhere('leave.status = :status', { status: PortalLeaveStatus.PENDING })
      .andWhere(
        new Brackets((qb) => {
          qb.where('leave.startDate <= :endDate', { endDate: dto.endDate }).andWhere(
            'leave.endDate >= :startDate',
            { startDate: dto.startDate },
          );
        }),
      )
      .getOne();
    if (overlapping) {
      throw new BadRequestException('该时间段已有请假申请，请先撤回或等待审批');
    }

    const totalDays = this.calculateDays(dto.startDate, dto.endDate);
    const submitterRole =
      role === UserRole.PARENT ? SubmitterRole.PARENT : SubmitterRole.STUDENT;

    const leave = this.leaveRepository.create({
      studentId,
      applicantId: userId,
      leaveType: dto.leaveType,
      startDate: dto.startDate as any,
      endDate: dto.endDate as any,
      totalDays,
      reason: dto.reason,
      attachmentUrl: dto.attachmentUrl || null,
      contactPhone: dto.contactPhone || null,
      submitterRole,
      status: PortalLeaveStatus.PENDING,
    });

    const saved = await this.leaveRepository.save(leave);

    // 审计日志
    await this.auditService.log(
      AuditAction.LEAVE_APPLY,
      userId,
      `提交请假申请: ${saved.id}, 类型=${dto.leaveType}, 天数=${totalDays}`,
      ip,
      { leaveId: saved.id, leaveType: dto.leaveType, totalDays, studentId },
      201,
    );

    this.logger.log(`Leave created: ${saved.id} for student ${studentId} by ${userId}`);

    return saved;
  }

  /**
   * 查询请假列表
   * student 看自己的，parent 看关联子女的
   */
  async findAll(
    query: LeaveQueryDto,
    userId: string,
    role: UserRole,
  ): Promise<{
    records: any[];
    total: number;
    page: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const isApprover =
      role === UserRole.TEACHER ||
      role === UserRole.SCHOOL_STAFF ||
      role === UserRole.SCHOOL_DIRECTOR;

    // 审批角色（教师/校务/主任）可见全校所有学生的请假记录，不按学生过滤
    if (isApprover) {
      const qb = this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.student', 'student')
        .leftJoinAndSelect('leave.approver', 'approver');

      if (query.status) {
        qb.andWhere('leave.status = :status', { status: query.status });
      }
      if (query.startDate) {
        qb.andWhere('leave.startDate >= :startDate', { startDate: query.startDate });
      }
      if (query.endDate) {
        qb.andWhere('leave.endDate <= :endDate', { endDate: query.endDate });
      }

      qb.orderBy('leave.createdAt', 'DESC').skip(skip).take(limit);

      const [records, total] = await qb.getManyAndCount();

      return {
        records: records.map((r) => this.formatLeaveRecord(r)),
        total,
        page,
      };
    }

    // 学生/家长路径：仅能访问自己的/关联子女的请假
    const accessibleIds = await this.getAccessibleStudentIds(userId, role);

    // 非审批角色，无任何可访问学生 → 返回空（而非 500）
    if (accessibleIds.length === 0) {
      return { records: [], total: 0, page };
    }

    const whereConditions: any = {};
    if (accessibleIds.length === 1) {
      whereConditions.studentId = accessibleIds[0];
    }
    if (query.status) {
      whereConditions.status = query.status;
    }
    if (query.startDate) {
      whereConditions.startDate = MoreThanOrEqual(query.startDate) as any;
    }
    if (query.endDate) {
      whereConditions.endDate = LessThanOrEqual(query.endDate) as any;
    }

    // 多学生（家长关联多个子女）用 IN 查询，否则用单 studentId
    if (accessibleIds.length > 1) {
      const qb = this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.student', 'student')
        .leftJoinAndSelect('leave.approver', 'approver')
        .where('leave.studentId IN (:...ids)', { ids: accessibleIds });

      if (query.status) {
        qb.andWhere('leave.status = :status', { status: query.status });
      }
      if (query.startDate) {
        qb.andWhere('leave.startDate >= :startDate', {
          startDate: query.startDate,
        });
      }
      if (query.endDate) {
        qb.andWhere('leave.endDate <= :endDate', { endDate: query.endDate });
      }

      qb.orderBy('leave.createdAt', 'DESC').skip(skip).take(limit);

      const [records, total] = await qb.getManyAndCount();

      return {
        records: records.map((r) => this.formatLeaveRecord(r)),
        total,
        page,
      };
    }

    const [records, total] = await this.leaveRepository.findAndCount({
      where: whereConditions,
      relations: ['student', 'approver'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      records: records.map((r) => this.formatLeaveRecord(r)),
      total,
      page,
    };
  }

  /**
   * 获取请假详情
   */
  async findOne(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<any> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['student', 'approver'],
    });

    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }

    // 权限校验
    const accessibleIds = await this.getAccessibleStudentIds(userId, role);
    if (
      role === UserRole.STUDENT ||
      role === UserRole.PARENT
    ) {
      if (!accessibleIds.includes(leave.studentId)) {
        throw new ForbiddenException('无权查看此请假记录');
      }
    }

    return this.formatLeaveRecord(leave);
  }

  /**
   * 撤回请假（仅 pending 状态可撤回）
   */
  async cancel(
    id: string,
    userId: string,
    role: UserRole,
    ip?: string,
  ): Promise<{ status: string; message: string }> {
    const leave = await this.leaveRepository.findOne({ where: { id } });

    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }

    // 权限校验
    const accessibleIds = await this.getAccessibleStudentIds(userId, role);
    if (
      role === UserRole.STUDENT ||
      role === UserRole.PARENT
    ) {
      if (!accessibleIds.includes(leave.studentId)) {
        throw new ForbiddenException('无权操作此请假记录');
      }
    }

    if (leave.status !== PortalLeaveStatus.PENDING) {
      throw new BadRequestException(
        '该请假状态不允许撤回（仅 pending 状态可撤回）',
      );
    }

    leave.status = PortalLeaveStatus.CANCELLED;
    await this.leaveRepository.save(leave);

    // 审计日志
    await this.auditService.log(
      AuditAction.LEAVE_CANCEL,
      userId,
      `撤回请假: ${id}`,
      ip,
      { leaveId: id, previousStatus: PortalLeaveStatus.PENDING },
      200,
    );

    this.logger.log(`Leave cancelled: ${id} by ${userId}`);

    return {
      status: 'CANCELLED',
      message: '请假已撤回',
    };
  }

  /**
   * 审批请假（Teacher/Staff 角色）
   */
  async approve(
    id: string,
    dto: ApproveLeaveDto,
    userId: string,
    role: UserRole,
    action: 'approve' | 'reject',
    ip?: string,
  ): Promise<any> {
    // 仅 Teacher/School Staff/Director 可审批
    if (
      role !== UserRole.TEACHER &&
      role !== UserRole.SCHOOL_STAFF &&
      role !== UserRole.SCHOOL_DIRECTOR
    ) {
      throw new ForbiddenException('无权审批请假');
    }

    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }

    if (leave.status !== PortalLeaveStatus.PENDING) {
      throw new BadRequestException(
        '仅待审批状态的请假可审批',
      );
    }

    if (action === 'approve') {
      leave.status = PortalLeaveStatus.APPROVED;
      leave.approvedBy = userId;
      leave.approvedAt = new Date();
      leave.approvalComment = dto.approvalComment || null;

      await this.auditService.log(
        AuditAction.LEAVE_APPROVE,
        userId,
        `审批通过请假: ${id}`,
        ip,
        { leaveId: id, comment: dto.approvalComment },
        200,
      );
    } else {
      leave.status = PortalLeaveStatus.REJECTED;
      leave.approvedBy = userId;
      leave.approvedAt = new Date();
      leave.approvalComment = dto.approvalComment || null;

      await this.auditService.log(
        AuditAction.LEAVE_REJECT,
        userId,
        `审批驳回请假: ${id}`,
        ip,
        { leaveId: id, comment: dto.approvalComment },
        200,
      );
    }

    await this.leaveRepository.save(leave);

    this.logger.log(`Leave ${action}d: ${id} by ${userId}`);

    return {
      leaveId: leave.id,
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedBy: userId,
    };
  }

  /**
   * 格式化请假记录输出
   * startDate/endDate 实体列类型为 date：在部分查询路径（findAndCount 单主 student/parent 路径）
   * 返回的是字符串，其他路径返回 Date。此工具对两者做类型安全处理，避免 .toISOString 崩溃。
   */
  private formatLeaveRecord(leave: LeaveRequest): any {
    const fmtDate = (v: Date | string | null | undefined): string | null => {
      if (v == null) return null;
      if (v instanceof Date && !isNaN(v.getTime())) {
        return v.toISOString().split('T')[0];
      }
      // 字符串（'YYYY-MM-DD' 或 ISO 串）直接用；非法则回退原值避免抛错
      const s = String(v);
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toISOString().split('T')[0];
    };

    return {
      leaveId: leave.id,
      student: leave.student
        ? {
            id: leave.student.id,
            name: leave.student.name,
            studentCode: leave.student.username,
          }
        : null,
      leaveType: leave.leaveType,
      startDate: fmtDate(leave.startDate),
      endDate: fmtDate(leave.endDate),
      totalDays: leave.totalDays,
      reason: leave.reason,
      attachmentUrl: leave.attachmentUrl,
      contactPhone: leave.contactPhone,
      submitterRole: leave.submitterRole,
      status: leave.status,
      approvedBy: leave.approver ? leave.approver.name : null,
      approvalComment: leave.approvalComment,
      createdAt: leave.createdAt instanceof Date ? leave.createdAt.toISOString() : String(leave.createdAt),
      canCancel: leave.status === PortalLeaveStatus.PENDING,
    };
  }
}
