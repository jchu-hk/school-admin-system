import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Leave, LeaveStatus } from './leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ApproveLeaveDto, RejectLeaveDto } from './dto/approve-leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
  ) {}

  /**
   * 计算代课老师课时数
   * 根据请假时间段的课程安排计算代课老师需要代课的总课时数
   * 
   * 计算逻辑：
   * 1. 如果前端已传入 substituteTeacherClassHours，直接使用
   * 2. 否则根据请假天数和每日课时数估算（默认每天6课时）
   * 3. 如果有具体的开始和结束时间，按小时计算
   */
  private calculateSubstituteClassHours(
    startDate: Date,
    endDate: Date,
    startTime?: string,
    endTime?: string,
    providedHours?: number,
  ): number {
    // 如果前端已提供课时数，直接返回
    if (providedHours !== undefined && providedHours > 0) {
      return providedHours;
    }

    // 默认每天课时数（可根据学校实际安排调整）
    const DEFAULT_DAILY_HOURS = 6;

    // 计算请假天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 因为包含开始日

    // 如果有具体的开始和结束时间，按小时计算
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // 计算每天的小时数
      const hoursPerDay = (endMinutes - startMinutes) / 60;
      
      // 返回总课时数
      return Math.ceil(diffDays * hoursPerDay);
    }

    // 没有具体时间，使用默认每天课时数
    return diffDays * DEFAULT_DAILY_HOURS;
  }

  async create(createLeaveDto: CreateLeaveDto): Promise<Leave> {
    const leave = this.leaveRepository.create({
      ...createLeaveDto,
      startDate: new Date(createLeaveDto.startDate),
      endDate: new Date(createLeaveDto.endDate),
      status: LeaveStatus.PENDING,
    });

    return this.leaveRepository.save(leave);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    applicantId?: string,
    status?: LeaveStatus,
  ): Promise<{ leaves: Leave[]; total: number }> {
    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.applicant', 'applicant')
      .leftJoinAndSelect('leave.substituteTeacher', 'substituteTeacher')
      .leftJoinAndSelect('leave.approver', 'approver');

    if (applicantId) {
      queryBuilder.where('leave.applicantId = :applicantId', { applicantId });
    }

    if (status) {
      queryBuilder.andWhere('leave.status = :status', { status });
    }

    const [leaves, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { leaves, total };
  }

  async findOne(id: string): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['applicant', 'substituteTeacher', 'approver'],
    });

    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }

    return leave;
  }

  async update(
    id: string,
    updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    const leave = await this.findOne(id);

    // 只有待审批状态的请假可以修改
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('只有待审批的请假申请可以修改');
    }

    Object.assign(leave, updateLeaveDto);

    if (updateLeaveDto.startDate) {
      leave.startDate = new Date(updateLeaveDto.startDate);
    }
    if (updateLeaveDto.endDate) {
      leave.endDate = new Date(updateLeaveDto.endDate);
    }

    return this.leaveRepository.save(leave);
  }

  async approve(id: string, approveLeaveDto: ApproveLeaveDto): Promise<Leave> {
    const leave = await this.findOne(id);

    // 只有待审批状态的请假可以审批
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('只有待审批的请假申请可以审批');
    }

    // 更新请假状态
    leave.status = approveLeaveDto.approved
      ? LeaveStatus.APPROVED
      : LeaveStatus.REJECTED;
    leave.approverId = approveLeaveDto.approverId;
    leave.approvedAt = new Date();
    leave.approvalComment = approveLeaveDto.approvalComment;

    // 如果审批通过且有代课老师，计算代课课时数
    if (approveLeaveDto.approved && approveLeaveDto.substituteTeacherId) {
      leave.substituteTeacherId = approveLeaveDto.substituteTeacherId;
      
      // 计算 substituteTeacherClassHours
      leave.substituteTeacherClassHours = this.calculateSubstituteClassHours(
        leave.startDate,
        leave.endDate,
        leave.startTime,
        leave.endTime,
        approveLeaveDto.substituteTeacherClassHours,
      );
    }

    return this.leaveRepository.save(leave);
  }

  async reject(id: string, rejectLeaveDto: RejectLeaveDto): Promise<Leave> {
    const leave = await this.findOne(id);

    // 只有待审批状态的请假可以拒绝
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('只有待审批的请假申请可以拒绝');
    }

    leave.status = LeaveStatus.REJECTED;
    leave.approverId = rejectLeaveDto.approverId;
    leave.approvedAt = new Date();
    leave.approvalComment = rejectLeaveDto.rejectionReason;

    return this.leaveRepository.save(leave);
  }

  async cancel(id: string, cancelledBy: string): Promise<Leave> {
    const leave = await this.findOne(id);

    // 只有待审批状态的请假可以取消
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('只有待审批的请假申请可以取消');
    }

    leave.status = LeaveStatus.CANCELLED;
    leave.updatedBy = cancelledBy;

    return this.leaveRepository.save(leave);
  }

  async remove(id: string): Promise<void> {
    const leave = await this.findOne(id);
    await this.leaveRepository.softDelete(id);
  }

  /**
   * 获取代课老师统计数据
   * 用于统计某位代课老师的总代课课时数
   */
  async getSubstituteTeacherStats(
    substituteTeacherId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ totalClassHours: number; totalLeaves: number }> {
    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.substituteTeacherId = :substituteTeacherId', {
        substituteTeacherId,
      })
      .andWhere('leave.status = :status', { status: LeaveStatus.APPROVED });

    if (startDate && endDate) {
      queryBuilder.andWhere('leave.startDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const leaves = await queryBuilder.getMany();

    const totalClassHours = leaves.reduce(
      (sum, leave) => sum + (leave.substituteTeacherClassHours || 0),
      0,
    );

    return {
      totalClassHours,
      totalLeaves: leaves.length,
    };
  }

  /**
   * 获取请假统计数据
   */
  async getLeaveStats(
    applicantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalLeaves: number;
    totalDays: number;
    byType: Record<string, number>;
  }> {
    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.status = :status', { status: LeaveStatus.APPROVED });

    if (applicantId) {
      queryBuilder.andWhere('leave.applicantId = :applicantId', {
        applicantId,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('leave.startDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const leaves = await queryBuilder.getMany();

    const totalDays = leaves.reduce(
      (sum, leave) => sum + leave.totalDays,
      0,
    );

    const byType: Record<string, number> = {};
    leaves.forEach((leave) => {
      const type = leave.leaveType;
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalLeaves: leaves.length,
      totalDays,
      byType,
    };
  }
}
