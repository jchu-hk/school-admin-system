import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async create(createDto: CreateAttendanceDto): Promise<Attendance> {
    const attendance = this.attendanceRepository.create({
      ...createDto,
      attendanceDate: createDto.attendanceDate
        ? new Date(createDto.attendanceDate)
        : new Date(),
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

  // ---- 统计 ----

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

  // ---- 学生出勤记录 ----
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

  // ---- 班级出勤统计 ----
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

  // ---- 每日统计 ----
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

  // ---- 月度统计 ----
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
