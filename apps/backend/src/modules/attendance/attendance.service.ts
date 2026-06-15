import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, In, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Attendance,
  AttendanceStatus,
  SyncSource,
  SyncStatus,
} from './attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  BatchCreateAttendanceDto,
  BatchRecordDto,
  ConfirmPreviewDto,
  WebhookPayloadDto,
  WebhookRecordDto,
} from './dto/batch-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  // ==================== 基础 CRUD ====================

  async create(createDto: CreateAttendanceDto): Promise<Attendance> {
    const attendance = this.attendanceRepository.create({
      ...createDto,
      attendanceDate: createDto.attendanceDate
        ? new Date(createDto.attendanceDate)
        : new Date(),
      syncSource: SyncSource.MANUAL,
      syncStatus: SyncStatus.SUCCESS,
    });
    return this.attendanceRepository.save(attendance);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      studentId?: string;
      teacherId?: string;
      classId?: string;
      attendanceDate?: string;
      status?: AttendanceStatus;
    } = {},
  ): Promise<{ records: Attendance[]; total: number }> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.teacher', 'teacher')
      .leftJoinAndSelect('attendance.approver', 'approver');

    if (filters.studentId) {
      queryBuilder.andWhere('attendance.studentId = :studentId', {
        studentId: filters.studentId,
      });
    }
    if (filters.teacherId) {
      queryBuilder.andWhere('attendance.teacherId = :teacherId', {
        teacherId: filters.teacherId,
      });
    }
    if (filters.classId) {
      queryBuilder.andWhere('attendance.classId = :classId', {
        classId: filters.classId,
      });
    }
    if (filters.attendanceDate) {
      queryBuilder.andWhere('attendance.attendanceDate = :attendanceDate', {
        attendanceDate: filters.attendanceDate,
      });
    }
    if (filters.status) {
      queryBuilder.andWhere('attendance.status = :status', {
        status: filters.status,
      });
    }

    const [records, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attendance.attendanceDate', 'DESC')
      .getManyAndCount();

    return { records, total };
  }

  async findOne(id: string): Promise<Attendance> {
    const record = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['student', 'teacher', 'approver'],
    });
    if (!record) {
      throw new NotFoundException('出勤记录不存在');
    }
    return record;
  }

  async update(
    id: string,
    updateDto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    if (updateDto.attendanceDate) {
      record.attendanceDate = new Date(updateDto.attendanceDate);
    }
    return this.attendanceRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.attendanceRepository.softDelete(id);
  }

  // ==================== 批量操作（按 F-ATT-001 spec）====================

  /** 批量创建出勤记录（F-ATT-001 批量录入 + 确认预览）*/
  async batchCreate(
    dto: BatchCreateAttendanceDto,
    createdBy: string,
  ): Promise<{ batchId: string; records: Attendance[]; count: number }> {
    const batchId = uuidv4();
    const canRevokeUntil = new Date(Date.now() + 15 * 60 * 1000); // 15分钟

    const attendanceRecords: Partial<Attendance>[] = dto.records.map((r) => ({
      studentId: r.studentId,
      classId: dto.classId,
      attendanceDate: new Date(dto.attendanceDate),
      status: r.status,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      attendanceType: r.attendanceType,
      remark: r.remark,
      syncSource: dto.syncSource || SyncSource.MANUAL,
      syncStatus: SyncStatus.SUCCESS,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      batchId,
      canRevokeUntil,
      createdBy,
    }));

    const records = await this.attendanceRepository.save(attendanceRecords as Attendance[]);
    return { batchId, records, count: records.length };
  }

  /** 确认预览（不保存，返回摘要统计）*/
  async confirmPreview(
    dto: ConfirmPreviewDto,
  ): Promise<{
    attendanceDate: string;
    classId: string;
    studentCount: number;
    statusSummary: Record<string, number>;
    records: Array<{ studentId: string; studentName: string; status: AttendanceStatus }>;
  }> {
    const statusSummary: Record<string, number> = {};
    for (const r of dto.records) {
      const key = r.status;
      statusSummary[key] = (statusSummary[key] || 0) + 1;
    }

    return {
      attendanceDate: dto.attendanceDate,
      classId: dto.classId || '',
      studentCount: dto.records.length,
      statusSummary,
      records: dto.records.map((r) => ({
        studentId: r.studentId || '',
        studentName: r.studentName || '',
        status: r.status,
      })),
    };
  }

  /** 批量撤销（仅 15 分钟内可操作）*/
  async batchRevoke(
    batchId: string,
    userId: string,
    userRole: string,
  ): Promise<{ deletedCount: number }> {
    const records = await this.attendanceRepository.find({
      where: { batchId },
      select: ['id', 'batchId', 'canRevokeUntil', 'createdBy'],
    });

    if (records.length === 0) {
      throw new NotFoundException(`批次 ${batchId} 无可撤销记录`);
    }

    const firstRecord = records[0];

    // 检查撤销权限：录入人或校务主任
    const canRevokeRoles = ['school_director', 'system_admin'];
    const isCreator = firstRecord.createdBy === userId;
    const isDirector = canRevokeRoles.includes(userRole);

    if (!isCreator && !isDirector) {
      throw new ForbiddenException('无批量撤销权限，仅录入人或校务主任可操作');
    }

    // 检查是否在15分钟撤销窗口内
    const now = new Date();
    if (!firstRecord.canRevokeUntil || now > firstRecord.canRevokeUntil) {
      throw new BadRequestException(
        '已超过15分钟撤销时限，请逐条删除或联系校务主任',
      );
    }

    const result = await this.attendanceRepository
      .createQueryBuilder()
      .softDelete()
      .where('batch_id = :batchId', { batchId })
      .execute();

    return { deletedCount: result.affected || records.length };
  }

  // ==================== 按班级/日期查询（F-ATT-001 Step 1.1）====================

  /** 按班级和日期获取出勤记录（对接 eClass API）*/
  async findByClassAndDate(
    classId: string,
    date: string,
  ): Promise<{
    classId: string;
    date: string;
    records: Attendance[];
    summary: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
  }> {
    const records = await this.attendanceRepository.find({
      where: { classId, attendanceDate: new Date(date) },
      relations: ['student', 'teacher'],
      order: { checkInTime: 'ASC' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;

    return {
      classId,
      date,
      records,
      summary: { total, present, absent, late },
    };
  }

  // ==================== Webhook 生物识别设备数据接收 ====================

  /** 处理生物识别设备 Webhook 推送（F-ATT-001 Step 1.3）*/
  async handleWebhook(
    payload: WebhookPayloadDto,
    deviceId?: string,
  ): Promise<{
    received: number;
    processed: number;
    failed: number;
    results: Array<{ studentId: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{ studentId: string; success: boolean; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const record of payload.records) {
      try {
        const existing = await this.attendanceRepository.findOne({
          where: {
            studentId: record.studentId,
            attendanceDate: new Date(record.timestamp.split('T')[0]),
          },
        });

        if (existing) {
          // 更新现有记录
          existing.checkInTime = record.timestamp.split('T')[1]?.substring(0, 8);
          existing.syncSource = payload.source === 'face' ? SyncSource.BIOMETRIC : SyncSource.BIOMETRIC;
          existing.syncStatus = SyncStatus.SUCCESS;
          existing.deviceId = record.deviceId || deviceId;
          existing.deviceName = record.deviceName;
          existing.remark = record.eventType;
          await this.attendanceRepository.save(existing);
        } else {
          // 新建记录
          await this.attendanceRepository.save({
            studentId: record.studentId,
            attendanceDate: new Date(record.timestamp.split('T')[0]),
            checkInTime: record.timestamp.split('T')[1]?.substring(0, 8),
            status: record.status || AttendanceStatus.PRESENT,
            syncSource: SyncSource.BIOMETRIC,
            syncStatus: SyncStatus.SUCCESS,
            deviceId: record.deviceId || deviceId,
            deviceName: record.deviceName,
            attendanceType: record.eventType === 'check_out' ? 'check_out' : 'check_in',
            createdBy: 'system',
          } as Attendance);
        }
        results.push({ studentId: record.studentId, success: true });
        processed++;
      } catch (err) {
        results.push({ studentId: record.studentId, success: false, error: String(err) });
        failed++;
      }
    }

    return { received: payload.records.length, processed, failed, results };
  }

  // ==================== 受影响学生列表（F-ATT-001 数据源独立状态）====================

  /** 获取受影响学生列表（数据源同步失败时）*/
  async getAffectedStudents(date?: string): Promise<{
    date: string;
    total: number;
    students: Array<{
      studentId: string;
      studentName: string;
      classId: string;
      affectedSources: string[];
      suggestedAction: 'confirm_present' | 'mark_pending' | 'none';
      lastKnownStatus: string;
    }>;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // 查找同步失败或离线的记录
    const failedRecords = await this.attendanceRepository.find({
      where: {
        attendanceDate: new Date(targetDate),
        syncStatus: In([SyncStatus.FAILED, SyncStatus.PARTIAL, SyncStatus.OFFLINE]),
      },
      relations: ['student'],
    });

    const students = failedRecords.map((r) => ({
      studentId: r.studentId,
      studentName: (r.student as any)?.name || r.studentId,
      classId: r.classId,
      affectedSources: [r.deviceName || r.deviceId || r.syncSource],
      suggestedAction: 'confirm_present' as const,
      lastKnownStatus: r.syncStatus,
    }));

    return { date: targetDate, total: students.length, students };
  }

  // ==================== 统计 ====================

  async getStats(
    classId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    leaveEarly: number;
    sickLeave: number;
    personalLeave: number;
    attendanceRate: number;
  }> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.attendanceDate BETWEEN :startDate AND :endDate', {
        startDate:
          startDate ||
          new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
      });

    if (classId) {
      queryBuilder.andWhere('attendance.classId = :classId', { classId });
    }

    const records = await queryBuilder.getMany();
    const total = records.length;
    const present = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absent = records.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;
    const leaveEarly = records.filter(
      (r) => r.status === AttendanceStatus.LEAVE_EARLY,
    ).length;
    const sickLeave = records.filter(
      (r) => r.status === AttendanceStatus.SICK_LEAVE,
    ).length;
    const personalLeave = records.filter(
      (r) => r.status === AttendanceStatus.PERSONAL_LEAVE,
    ).length;
    const attendanceRate =
      total > 0
        ? Math.round(((present + sickLeave + personalLeave) / total) * 10000) /
          100
        : 0;

    return {
      total,
      present,
      absent,
      late,
      leaveEarly,
      leaveEarly,
      sickLeave,
      personalLeave,
      attendanceRate,
    };
  }

  async getUnreportedAbsences(classId?: string): Promise<Attendance[]> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .where('attendance.status = :status', { status: AttendanceStatus.ABSENT })
      .andWhere('attendance.reminderSent = :sent', { sent: false });

    if (classId) {
      queryBuilder.andWhere('attendance.classId = :classId', { classId });
    }

    return queryBuilder.getMany();
  }

  async markReminderSent(ids: string[]): Promise<void> {
    await this.attendanceRepository
      .createQueryBuilder()
      .update(Attendance)
      .set({ reminderSent: true, reminderSentAt: new Date() })
      .whereInIds(ids)
      .execute();
  }

  async checkIn(id: string, checkInTime: string): Promise<Attendance> {
    const record = await this.findOne(id);
    record.checkInTime = checkInTime;
    return this.attendanceRepository.save(record);
  }

  async checkOut(id: string, checkOutTime: string): Promise<Attendance> {
    const record = await this.findOne(id);
    record.checkOutTime = checkOutTime;
    return this.attendanceRepository.save(record);
  }

  async findByStudent(
    studentId: string,
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
  ): Promise<{ records: Attendance[]; total: number }> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.teacher', 'teacher')
      .where('attendance.studentId = :studentId', { studentId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'attendance.attendanceDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const [records, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attendance.attendanceDate', 'DESC')
      .getManyAndCount();

    return { records, total };
  }

  async getClassStats(
    classId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    classId: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    leaveEarly: number;
    sickLeave: number;
    personalLeave: number;
    attendanceRate: number;
  }> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.classId = :classId', { classId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'attendance.attendanceDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const records = await queryBuilder.getMany();
    const totalRecords = records.length;
    const present = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absent = records.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;
    const leaveEarly = records.filter(
      (r) => r.status === AttendanceStatus.LEAVE_EARLY,
    ).length;
    const sickLeave = records.filter(
      (r) => r.status === AttendanceStatus.SICK_LEAVE,
    ).length;
    const personalLeave = records.filter(
      (r) => r.status === AttendanceStatus.PERSONAL_LEAVE,
    ).length;
    const attendanceRate =
      totalRecords > 0
        ? Math.round(
            ((present + sickLeave + personalLeave) / totalRecords) * 10000,
          ) / 100
        : 0;

    return {
      classId,
      totalRecords,
      present,
      absent,
      late,
      leaveEarly,
      sickLeave,
      personalLeave,
      attendanceRate,
    };
  }

  async getDailyStats(
    date: string,
    classId?: string,
  ): Promise<{
    date: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    leaveEarly: number;
    sickLeave: number;
    personalLeave: number;
  }> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.attendanceDate = :date', { date });

    if (classId) {
      queryBuilder.andWhere('attendance.classId = :classId', { classId });
    }

    const records = await queryBuilder.getMany();
    const total = records.length;
    const present = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absent = records.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;
    const leaveEarly = records.filter(
      (r) => r.status === AttendanceStatus.LEAVE_EARLY,
    ).length;
    const sickLeave = records.filter(
      (r) => r.status === AttendanceStatus.SICK_LEAVE,
    ).length;
    const personalLeave = records.filter(
      (r) => r.status === AttendanceStatus.PERSONAL_LEAVE,
    ).length;

    return {
      date,
      total,
      present,
      absent,
      late,
      leaveEarly,
      sickLeave,
      personalLeave,
    };
  }

  async getMonthlyStats(
    year: number,
    month: number,
    classId?: string,
  ): Promise<{
    year: number;
    month: number;
    total: number;
    present: number;
    absent: number;
    late: number;
    leaveEarly: number;
    sickLeave: number;
    personalLeave: number;
    attendanceRate: number;
    dailyStats: Array<{
      date: string;
      total: number;
      present: number;
      absent: number;
    }>;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.attendanceDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });

    if (classId) {
      queryBuilder.andWhere('attendance.classId = :classId', { classId });
    }

    const records = await queryBuilder.getMany();
    const total = records.length;
    const present = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absent = records.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;
    const leaveEarly = records.filter(
      (r) => r.status === AttendanceStatus.LEAVE_EARLY,
    ).length;
    const sickLeave = records.filter(
      (r) => r.status === AttendanceStatus.SICK_LEAVE,
    ).length;
    const personalLeave = records.filter(
      (r) => r.status === AttendanceStatus.PERSONAL_LEAVE,
    ).length;
    const attendanceRate =
      total > 0
        ? Math.round(((present + sickLeave + personalLeave) / total) * 10000) /
          100
        : 0;

    // 按日期分组统计
    const dailyMap = new Map<
      string,
      { total: number; present: number; absent: number }
    >();
    for (const record of records) {
      const dateStr = new Date(record.attendanceDate)
        .toISOString()
        .split('T')[0];
      const stats = dailyMap.get(dateStr) || {
        total: 0,
        present: 0,
        absent: 0,
      };
      stats.total++;
      if (record.status === AttendanceStatus.PRESENT) stats.present++;
      if (record.status === AttendanceStatus.ABSENT) stats.absent++;
      dailyMap.set(dateStr, stats);
    }

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      year,
      month,
      total,
      present,
      absent,
      late,
      leaveEarly,
      sickLeave,
      personalLeave,
      attendanceRate,
      dailyStats,
    };
  }
}
