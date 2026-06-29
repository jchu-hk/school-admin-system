import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
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
  ConfirmPreviewDto,
  WebhookPayloadDto,
  GenerateQrCodeDto,
  BatchGenerateQrCodeDto,
  MobileScanDto,
  MobileBatchSubmitDto,
} from './dto/batch-attendance.dto';
import { User, UserRole } from '../user/user.entity';
import { Class } from '../user/class.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
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

    const records = await this.attendanceRepository.save(
      attendanceRecords as Attendance[],
    );
    return { batchId, records, count: records.length };
  }

  /** 确认预览（不保存，返回摘要统计）*/
  async confirmPreview(dto: ConfirmPreviewDto): Promise<{
    attendanceDate: string;
    classId: string;
    studentCount: number;
    statusSummary: Record<string, number>;
    records: Array<{
      studentId: string;
      studentName: string;
      status: AttendanceStatus;
    }>;
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

    // 使用SQL聚合获取统计信息
    const statsQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        'COUNT(*) as total',
        `COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) as present`,
        `COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) as absent`,
        `COUNT(CASE WHEN attendance.status = 'late' THEN 1 END) as late`,
      ])
      .where('attendance.class_id = :classId', { classId })
      .andWhere('attendance.attendance_date = :date', { date });

    const statsResult = await statsQuery.getRawOne();

    return {
      classId,
      date,
      records,
      summary: {
        total: parseInt(statsResult.total, 10) || 0,
        present: parseInt(statsResult.present, 10) || 0,
        absent: parseInt(statsResult.absent, 10) || 0,
        late: parseInt(statsResult.late, 10) || 0,
      },
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
    const results: Array<{
      studentId: string;
      success: boolean;
      error?: string;
    }> = [];
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
          existing.checkInTime = record.timestamp
            .split('T')[1]
            ?.substring(0, 8);
          existing.syncSource =
            payload.source === 'face'
              ? SyncSource.BIOMETRIC
              : SyncSource.BIOMETRIC;
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
            attendanceType:
              record.eventType === 'check_out' ? 'check_out' : 'check_in',
            createdBy: 'system',
          } as Attendance);
        }
        results.push({ studentId: record.studentId, success: true });
        processed++;
      } catch (err) {
        results.push({
          studentId: record.studentId,
          success: false,
          error: String(err),
        });
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
        syncStatus: In([
          SyncStatus.FAILED,
          SyncStatus.PARTIAL,
          SyncStatus.OFFLINE,
        ]),
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
      .select([
        'COUNT(*) as total',
        `COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) as present`,
        `COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) as absent`,
        `COUNT(CASE WHEN attendance.status = 'late' THEN 1 END) as late`,
        `COUNT(CASE WHEN attendance.status = 'leave_early' THEN 1 END) as "leaveEarly"`,
        `COUNT(CASE WHEN attendance.status = 'sick_leave' THEN 1 END) as "sickLeave"`,
        `COUNT(CASE WHEN attendance.status = 'personal_leave' THEN 1 END) as "personalLeave"`,
      ])
      .where('attendance.attendance_date BETWEEN :startDate AND :endDate', {
        startDate:
          startDate ||
          new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
      });

    if (classId) {
      queryBuilder.andWhere('attendance.class_id = :classId', { classId });
    }

    const result = await queryBuilder.getRawOne();

    const total = parseInt(result.total, 10) || 0;
    const present = parseInt(result.present, 10) || 0;
    const absent = parseInt(result.absent, 10) || 0;
    const late = parseInt(result.late, 10) || 0;
    const leaveEarly = parseInt(result.leaveEarly, 10) || 0;
    const sickLeave = parseInt(result.sickLeave, 10) || 0;
    const personalLeave = parseInt(result.personalLeave, 10) || 0;
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
      .select([
        'COUNT(*) as "totalRecords"',
        `COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) as present`,
        `COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) as absent`,
        `COUNT(CASE WHEN attendance.status = 'late' THEN 1 END) as late`,
        `COUNT(CASE WHEN attendance.status = 'leave_early' THEN 1 END) as "leaveEarly"`,
        `COUNT(CASE WHEN attendance.status = 'sick_leave' THEN 1 END) as "sickLeave"`,
        `COUNT(CASE WHEN attendance.status = 'personal_leave' THEN 1 END) as "personalLeave"`,
      ])
      .where('attendance.class_id = :classId', { classId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'attendance.attendance_date BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const result = await queryBuilder.getRawOne();

    const totalRecords = parseInt(result.totalRecords, 10) || 0;
    const present = parseInt(result.present, 10) || 0;
    const absent = parseInt(result.absent, 10) || 0;
    const late = parseInt(result.late, 10) || 0;
    const leaveEarly = parseInt(result.leaveEarly, 10) || 0;
    const sickLeave = parseInt(result.sickLeave, 10) || 0;
    const personalLeave = parseInt(result.personalLeave, 10) || 0;
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
      .select([
        'COUNT(*) as total',
        `COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) as present`,
        `COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) as absent`,
        `COUNT(CASE WHEN attendance.status = 'late' THEN 1 END) as late`,
        `COUNT(CASE WHEN attendance.status = 'leave_early' THEN 1 END) as "leaveEarly"`,
        `COUNT(CASE WHEN attendance.status = 'sick_leave' THEN 1 END) as "sickLeave"`,
        `COUNT(CASE WHEN attendance.status = 'personal_leave' THEN 1 END) as "personalLeave"`,
      ])
      .where('attendance.attendance_date = :date', { date });

    if (classId) {
      queryBuilder.andWhere('attendance.class_id = :classId', { classId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      date,
      total: parseInt(result.total, 10) || 0,
      present: parseInt(result.present, 10) || 0,
      absent: parseInt(result.absent, 10) || 0,
      late: parseInt(result.late, 10) || 0,
      leaveEarly: parseInt(result.leaveEarly, 10) || 0,
      sickLeave: parseInt(result.sickLeave, 10) || 0,
      personalLeave: parseInt(result.personalLeave, 10) || 0,
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

    // 使用SQL聚合获取总体统计
    const summaryQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        'COUNT(*) as total',
        `COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) as present`,
        `COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) as absent`,
        `COUNT(CASE WHEN attendance.status = 'late' THEN 1 END) as late`,
        `COUNT(CASE WHEN attendance.status = 'leave_early' THEN 1 END) as "leaveEarly"`,
        `COUNT(CASE WHEN attendance.status = 'sick_leave' THEN 1 END) as "sickLeave"`,
        `COUNT(CASE WHEN attendance.status = 'personal_leave' THEN 1 END) as "personalLeave"`,
      ])
      .where('attendance.attendance_date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });

    // 使用SQL GROUP BY获取每日统计
    const dailyQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        'attendance.attendance_date as date',
        'COUNT(*) as total',
        `COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) as present`,
        `COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) as absent`,
      ])
      .where('attendance.attendance_date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      })
      .groupBy('attendance.attendance_date')
      .orderBy('attendance.attendance_date', 'ASC');

    if (classId) {
      summaryQuery.andWhere('attendance.class_id = :classId', { classId });
      dailyQuery.andWhere('attendance.class_id = :classId', { classId });
    }

    const [summaryResult, dailyResult] = await Promise.all([
      summaryQuery.getRawOne(),
      dailyQuery.getRawMany(),
    ]);

    const total = parseInt(summaryResult.total, 10) || 0;
    const present = parseInt(summaryResult.present, 10) || 0;
    const absent = parseInt(summaryResult.absent, 10) || 0;
    const late = parseInt(summaryResult.late, 10) || 0;
    const leaveEarly = parseInt(summaryResult.leaveEarly, 10) || 0;
    const sickLeave = parseInt(summaryResult.sickLeave, 10) || 0;
    const personalLeave = parseInt(summaryResult.personalLeave, 10) || 0;
    const attendanceRate =
      total > 0
        ? Math.round(((present + sickLeave + personalLeave) / total) * 10000) /
          100
        : 0;

    const dailyStats = dailyResult.map((row) => ({
      date: row.date,
      total: parseInt(row.total, 10) || 0,
      present: parseInt(row.present, 10) || 0,
      absent: parseInt(row.absent, 10) || 0,
    }));

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

  // ==================== 二维码生成（学生证扫码签到）====================

  /**
   * 生成单个学生二维码
   * 二维码格式: STUDENT:{studentId}:{name}
   */
  async generateQrCode(dto: GenerateQrCodeDto): Promise<{
    studentId: string;
    studentName: string;
    qrcode: string;
    url: string;
  }> {
    // 查找学生信息
    const student = await this.userRepository.findOne({
      where: { id: dto.studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const studentName = dto.studentName || student.name;
    // 二维码内容格式: STUDENT:{studentId}:{name}
    const qrcodeContent = `STUDENT:${dto.studentId}:${studentName}`;

    // 生成二维码 Data URL
    const url = await QRCode.toDataURL(qrcodeContent, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      studentId: dto.studentId,
      studentName,
      qrcode: qrcodeContent,
      url,
    };
  }

  /**
   * 批量生成班级学生二维码
   */
  async batchGenerateQrCode(dto: BatchGenerateQrCodeDto): Promise<{
    classId: string;
    qrcodes: Array<{
      studentId: string;
      studentName: string;
      qrcode: string;
      url: string;
    }>;
  }> {
    // 查找班级信息
    const classEntity = await this.classRepository.findOne({
      where: { id: dto.classId },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    // 查找该班级的所有学生
    // 学生通过 className 字段关联班级
    const students = await this.userRepository.find({
      where: { className: classEntity.name, role: UserRole.STUDENT },
    });

    if (students.length === 0) {
      throw new NotFoundException('该班级没有学生');
    }

    // 批量生成二维码
    const qrcodes = await Promise.all(
      students.map(async (student) => {
        const qrcodeContent = `STUDENT:${student.id}:${student.name}`;
        const url = await QRCode.toDataURL(qrcodeContent, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        return {
          studentId: student.id,
          studentName: student.name,
          qrcode: qrcodeContent,
          url,
        };
      }),
    );

    return {
      classId: dto.classId,
      qrcodes,
    };
  }

  // ==================== 移动端扫码API ====================

  /**
   * 解析二维码格式: STUDENT:{studentId}:{name}
   */
  private parseStudentQrCode(
    qrcode: string,
  ): { studentId: string; name: string } | null {
    const match = qrcode.match(/^STUDENT:([^:]+):(.+)$/);
    if (!match) {
      return null;
    }
    return {
      studentId: match[1],
      name: match[2],
    };
  }

  /**
   * 移动端扫码识别学生
   */
  async mobileScan(
    dto: MobileScanDto,
    _teacherId: string, // used
  ): Promise<{
    student: {
      id: string;
      name: string;
      className?: string;
    };
    status: 'scanned' | 'already_recorded';
    existingRecord?: {
      id: string;
      status: AttendanceStatus;
      checkInTime?: string;
    };
  }> {
    // 解析二维码
    const parsed = this.parseStudentQrCode(dto.qrcode);
    if (!parsed) {
      throw new BadRequestException('无效的二维码格式');
    }

    const { studentId } = parsed;

    // 查找学生
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    // 检查当天是否已有出勤记录
    const attendanceDate =
      dto.attendanceDate || new Date().toISOString().split('T')[0];
    const existingRecord = await this.attendanceRepository.findOne({
      where: {
        studentId,
        attendanceDate: new Date(attendanceDate),
      },
    });

    if (existingRecord) {
      return {
        student: {
          id: student.id,
          name: student.name,
          className: student.className,
        },
        status: 'already_recorded',
        existingRecord: {
          id: existingRecord.id,
          status: existingRecord.status,
          checkInTime: existingRecord.checkInTime,
        },
      };
    }

    return {
      student: {
        id: student.id,
        name: student.name,
        className: student.className,
      },
      status: 'scanned',
    };
  }

  /**
   * 获取教师负责的班级列表
   * 使用聚合查询替代循环查询，解决N+1问题
   */
  async getTeacherClasses(teacherId: string): Promise<{
    classes: Array<{
      id: string;
      name: string;
      grade: string;
      studentCount: number;
    }>;
  }> {
    // 查找教师信息
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    // 校务主任和系统管理员可以查看所有班级
    const isAdmin =
      teacher.role === UserRole.SCHOOL_DIRECTOR ||
      teacher.role === UserRole.SYSTEM_ADMIN;

    // 使用聚合查询一次性获取班级和学生数量
    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoin(
        'users',
        'student',
        'student.className = class.name AND student.role = :studentRole',
        {
          studentRole: UserRole.STUDENT,
        },
      )
      .select([
        'class.id as id',
        'class.name as name',
        'class.grade as grade',
        'COUNT(student.id) as "studentCount"',
      ])
      .where('class.is_active = :isActive', { isActive: true })
      .groupBy('class.id')
      .orderBy('class.grade', 'ASC')
      .addOrderBy('class.name', 'ASC');

    if (!isAdmin) {
      queryBuilder.andWhere('class.homeroom_teacher_id = :teacherId', {
        teacherId,
      });
    }

    const classes = await queryBuilder.getRawMany();

    return {
      classes: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        studentCount: parseInt(cls.studentCount, 10) || 0,
      })),
    };
  }

  /**
   * 获取班级学生列表
   */
  async getClassStudents(classId: string): Promise<{
    classId: string;
    className: string;
    students: Array<{
      id: string;
      name: string;
      hkId?: string;
    }>;
  }> {
    // 查找班级
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    // 查找该班级的所有学生
    const students = await this.userRepository.find({
      where: { className: classEntity.name, role: UserRole.STUDENT },
      order: { name: 'ASC' },
    });

    return {
      classId,
      className: classEntity.name,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        hkId: s.hkId || undefined,
      })),
    };
  }

  /**
   * 移动端批量提交出勤记录
   */
  async mobileBatchSubmit(
    dto: MobileBatchSubmitDto,
    teacherId: string, // used
  ): Promise<{
    batchId: string;
    count: number;
    records: Attendance[];
  }> {
    const batchId = uuidv4();
    const canRevokeUntil = new Date(Date.now() + 15 * 60 * 1000); // 15分钟

    const attendanceRecords: Partial<Attendance>[] = dto.records.map((r) => ({
      studentId: r.studentId,
      classId: dto.classId,
      attendanceDate: new Date(dto.attendanceDate),
      status: r.status,
      checkInTime:
        r.checkInTime ||
        new Date().toTimeString().split(' ')[0].substring(0, 8),
      syncSource: SyncSource.MANUAL,
      syncStatus: SyncStatus.SUCCESS,
      batchId,
      canRevokeUntil,
      createdBy: teacherId,
      teacherId,
      remark: r.remark || '移动端扫码签到',
    }));

    const records = await this.attendanceRepository.save(
      attendanceRecords as Attendance[],
    );

    return {
      batchId,
      count: records.length,
      records,
    };
  }

  // ==================== AC-04: 连续缺席告警 ====================

  /**
   * 检测连续缺席≥3天的学生，并通知班主任
   * 验收标准 AC-04: 连续缺席≥3天的学生触发告警，通知班主任
   */
  async checkConsecutiveAbsencesAndAlert(
    schoolId: string,
    triggeredBy: string, // 触发检查的用户ID（system/scheduler）
  ): Promise<{
    checkedStudents: number;
    alertedStudents: number;
    alerts: Array<{
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      consecutiveDays: number;
      absentDates: string[];
      teacherId: string;
      teacherName: string;
      notificationId?: string;
    }>;
  }> {
    // 1. 找出所有状态为 ABSENT 的最近记录
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30); // 只看最近30天

    const absences = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.class', 'cls')
      .where('attendance.status = :status', { status: AttendanceStatus.ABSENT })
      .andWhere('attendance.attendanceDate >= :recentDate', {
        recentDate: recentDate.toISOString().split('T')[0],
      })
      .orderBy('attendance.attendanceDate', 'DESC')
      .getMany();

    if (absences.length === 0) {
      return { checkedStudents: 0, alertedStudents: 0, alerts: [] };
    }

    // 2. 按学生分组，统计连续缺席天数
    // 排除节假日（sick_leave / personal_leave / absent_with_leave）
    const studentAbsencesMap = new Map<
      string,
      { student: User; classId: string; className: string; dates: Date[] }
    >();

    for (const record of absences) {
      if (!record.studentId || !record.student) continue;

      const dateStr = new Date(record.attendanceDate)
        .toISOString()
        .split('T')[0];

      if (!studentAbsencesMap.has(record.studentId)) {
        studentAbsencesMap.set(record.studentId, {
          student: record.student,
          classId: record.classId,
          className: (record as any).cls?.name || '',
          dates: [],
        });
      }
      // 去重（同一天多条记录只计一次）
      const entry = studentAbsencesMap.get(record.studentId)!;
      if (!entry.dates.some((d) => d.toISOString().split('T')[0] === dateStr)) {
        entry.dates.push(new Date(record.attendanceDate));
      }
    }

    // 3. 获取每个学生的班级班主任
    const classTeacherMap = new Map<string, string>(); // classId -> teacherId
    const classMap = new Map<
      string,
      { name: string; homeroomTeacherId: string }
    >();

    const classIds = [
      ...new Set(
        [...studentAbsencesMap.values()].map((e) => e.classId).filter(Boolean),
      ),
    ];

    if (classIds.length > 0) {
      const classes = await this.classRepository.find({
        where: { id: In(classIds) },
      });
      for (const cls of classes) {
        classMap.set(cls.id, {
          name: cls.name,
          homeroomTeacherId: cls.homeroomTeacherId,
        });
        if (cls.homeroomTeacherId) {
          classTeacherMap.set(cls.id, cls.homeroomTeacherId);
        }
      }
    }

    // 4. 获取班主任信息
    const teacherIds = [...new Set(classTeacherMap.values())];
    const teachers =
      teacherIds.length > 0
        ? await this.userRepository.find({ where: { id: In(teacherIds) } })
        : [];
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    // 5. 计算连续缺席天数并过滤≥3天
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts: Array<{
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      consecutiveDays: number;
      absentDates: string[];
      teacherId: string;
      teacherName: string;
      notificationId?: string;
    }> = [];

    for (const [studentId, entry] of studentAbsencesMap) {
      if (!entry.dates || entry.dates.length === 0) continue;

      // 按日期排序（从新到旧）
      const sortedDates = [...entry.dates].sort(
        (a, b) => b.getTime() - a.getTime(),
      );

      // 计算从今天往前推算的连续缺席天数
      let consecutiveDays = 0;
      const absentDateSet = new Set(
        sortedDates.map((d) => d.toISOString().split('T')[0]),
      );

      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        // 跳过周末
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        if (absentDateSet.has(dateStr)) {
          consecutiveDays++;
        } else {
          break; // 中断了，连续计算停止
        }
      }

      if (consecutiveDays >= 3) {
        const teacherId = classTeacherMap.get(entry.classId);
        const teacher = teacherId ? teacherMap.get(teacherId) : null;

        alerts.push({
          studentId,
          studentName: entry.student?.name || studentId,
          classId: entry.classId,
          className: entry.className || classMap.get(entry.classId)?.name || '',
          consecutiveDays,
          absentDates: sortedDates
            .slice(0, consecutiveDays)
            .map((d) => d.toISOString().split('T')[0])
            .sort(),
          teacherId: teacherId || '',
          teacherName: teacher?.name || '',
        });
      }
    }

    // 6. 发送通知给班主任
    let alertedStudents = 0;
    for (const alert of alerts) {
      if (!alert.teacherId) continue;

      try {
        const notification = await this.notificationService.sendNotification(
          {
            title: `【出勤告警】${alert.studentName} 连续缺席${alert.consecutiveDays}天`,
            content: `学生 ${alert.studentName}（${alert.className}）已连续缺席 ${alert.consecutiveDays} 天（${alert.absentDates.join('、')}），请及时确认情况并跟进。`,
            channel: 'app_push' as any,
            urgency: 'high' as any,
            recipientType: 'user',
            recipientIds: [alert.teacherId],
            relatedEntityType: 'attendance',
            relatedEntityId: alert.studentId,
          },
          triggeredBy,
          schoolId,
        );
        alert.notificationId = notification?.id;
        alertedStudents++;
      } catch (err) {
        console.error(
          `Failed to send notification for student ${alert.studentId}:`,
          err,
        );
      }
    }

    return {
      checkedStudents: studentAbsencesMap.size,
      alertedStudents,
      alerts,
    };
  }
}
