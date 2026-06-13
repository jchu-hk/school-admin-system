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
}
