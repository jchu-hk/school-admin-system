import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, IsNull, Not } from 'typeorm';
import {
  AttendanceDailyReport,
  DailyReportStatus,
} from '../entities/attendance-daily-report.entity';
import {
  Attendance,
  AttendanceStatus,
} from '../attendance.entity';
import { Class } from '../../user/class.entity';
import { User, UserRole } from '../../user/user.entity';

/**
 * 日报推送服务（简化通知注入接口）
 */
export interface ReportNotificationService {
  sendToUsers(params: {
    title: string;
    content: string;
    userIds: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<any>;
}

/**
 * 签到日报服务
 *
 * 每日自动生成各班签到统计日报，并推送通知至班主任。
 * 由定时任务在工作日 18:00 触发执行。
 *
 * 参考: FSD-QR-ATT-001 §3 F-ATTQR-003 (日报表推送)
 */
@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);

  constructor(
    @InjectRepository(AttendanceDailyReport)
    private readonly reportRepository: Repository<AttendanceDailyReport>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

  ) {}

  /**
   * 工作日 18:00 定时任务 — 生成当日签到日报
   *
   * @Cron('0 18 * * 1-5')
   */
  @Cron('0 18 * * 1-5')
  async generateDailyReports(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.log(`开始生成签到日报: ${today.toISOString().split('T')[0]}`);

    try {
      // 1. 获取所有活跃班级
      const classes = await this.classRepository.find({
        where: { isActive: true },
      });

      this.logger.log(`找到 ${classes.length} 个活跃班级`);

      let generatedCount = 0;
      let notificationCount = 0;

      for (const cls of classes) {
        try {
          const report = await this.generateReportForClass(cls, today);
          if (report) {
            generatedCount++;

            // 推送通知
            const notified = await this.pushReportNotification(report, cls);
            if (notified) {
              notificationCount++;
            }
          }
        } catch (err) {
          this.logger.error(
            `生成班级日报失败: class=${cls.name}(${cls.id}): ${err.message}`,
            err.stack,
          );
          // Create failure record
          await this.reportRepository.save({
            schoolId: cls.schoolId,
            classId: cls.id,
            className: cls.name,
            grade: cls.grade,
            reportDate: today,
            status: DailyReportStatus.FAILED,
            failureReason: err.message,
          } as any);
        }
      }

      this.logger.log(
        `签到日报生成完成: ` +
          `total_classes=${classes.length}, ` +
          `generated=${generatedCount}, ` +
          `notifications=${notificationCount}`,
      );
    } catch (err) {
      this.logger.error(`签到日报生成失败: ${err.message}`, err.stack);
    }
  }

  /**
   * 为指定班级生成指定日期的签到日报
   */
  async generateReportForClass(
    cls: Class,
    reportDate: Date = new Date(),
  ): Promise<AttendanceDailyReport | null> {
    // 标准化日期
    const dayStart = new Date(reportDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const reportDateStr = dayStart.toISOString().split('T')[0];

    // 查找该班级的所有学生（通过 className 或 classAllocation）
    const students = await this.userRepository.find({
      where: {
        className: cls.name,
        role: UserRole.STUDENT,
      },
    });

    const studentIds = students.map((s) => s.id);
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      this.logger.warn(
        `班级无学生: class=${cls.name}(${cls.id}), 跳过日报生成`,
      );
      return null;
    }

    // 查询当日签到记录
    const attendances = await this.attendanceRepository.find({
      where: {
        classId: cls.id,
        attendanceDate: Between(dayStart, dayEnd),
      },
    });

    // 学生名映射
    const studentNameMap = new Map<string, string>();
    for (const s of students) {
      studentNameMap.set(s.id, s.name);
    }

    // 统计
    const checkedInSet = new Set<string>();
    const lateSet = new Set<string>();
    const absentSet = new Set<string>();

    const checkedInStudents: Array<{
      studentId: string;
      studentName: string;
      checkInTime: string;
      status: 'on_time' | 'late';
    }> = [];

    for (const att of attendances) {
      if (att.status === AttendanceStatus.PRESENT) {
        checkedInSet.add(att.studentId);
        checkedInStudents.push({
          studentId: att.studentId,
          studentName: studentNameMap.get(att.studentId) || att.studentId,
          checkInTime: att.checkInTime || '',
          status: 'on_time',
        });
      } else if (att.status === AttendanceStatus.LATE) {
        checkedInSet.add(att.studentId);
        lateSet.add(att.studentId);
        checkedInStudents.push({
          studentId: att.studentId,
          studentName: studentNameMap.get(att.studentId) || att.studentId,
          checkInTime: att.checkInTime || '',
          status: 'late',
        });
      } else if (att.status === AttendanceStatus.ABSENT) {
        absentSet.add(att.studentId);
      }
    }

    // 未签到学生
    const uncheckedStudents: Array<{
      studentId: string;
      studentName: string;
      status: 'absent' | 'late' | 'pending';
    }> = [];

    for (const sid of studentIds) {
      if (!checkedInSet.has(sid)) {
        const status = absentSet.has(sid) ? 'absent' : 'pending';
        uncheckedStudents.push({
          studentId: sid,
          studentName: studentNameMap.get(sid) || sid,
          status,
        });
      }
    }

    // 班主任信息
    let teacherIds: string[] = [];
    if (cls.homeroomTeacherId) {
      const teacher = await this.userRepository.findOne({
        where: { id: cls.homeroomTeacherId },
      });
      if (teacher) {
        teacherIds = [teacher.id];
      }
    }

    const checkedIn = checkedInSet.size;
    const lateCount = lateSet.size;
    const absentCount = absentSet.size;

    // 计算已请假人数（简单近似，实际需联表 leave 模块）
    // 这里假设没有请假数据时可以设置为0或者从attendance状态中获取
    const leaveApproved = attendances.filter(
      (a) =>
        a.status === AttendanceStatus.ABSENT_WITH_LEAVE ||
        a.status === AttendanceStatus.SICK_LEAVE ||
        a.status === AttendanceStatus.PERSONAL_LEAVE,
    ).length;

    // 写入或更新日报
    const existing = await this.reportRepository.findOne({
      where: {
        classId: cls.id,
        reportDate: dayStart,
      },
    });

    const reportData: Partial<AttendanceDailyReport> = {
      schoolId: cls.schoolId,
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      reportDate: dayStart,
      totalStudents,
      checkedIn,
      lateCount,
      absentCount,
      leaveApproved,
      uncheckedStudents,
      checkedInStudents,
      leaveStudents: [],
      status: DailyReportStatus.GENERATED,
      teacherIds,
    };

    if (existing) {
      await this.reportRepository.update(existing.id, reportData as any);
      return this.reportRepository.findOne({ where: { id: existing.id } });
    }

    const report = this.reportRepository.create(reportData as any);
    return this.reportRepository.save(report) as unknown as AttendanceDailyReport;
  }

  /**
   * 推送日报通知给班主任
   */
  private async pushReportNotification(
    report: AttendanceDailyReport,
    cls: Class,
  ): Promise<boolean> {
    if (!report.teacherIds || report.teacherIds.length === 0) {
      this.logger.warn(
        `班级无班主任: class=${cls.name}(${cls.id}), 跳过推送`,
      );
      return false;
    }

    this.logger.log(`通知服务未注入，跳过推送: class=${report.className}`);
    return false;
  }

  /**
   * 获取日报列表（支持过滤）
   */
  async getReports(params: {
    classId?: string;
    grade?: string;
    dateFrom?: string;
    dateTo?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: AttendanceDailyReport[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      classId,
      grade,
      dateFrom,
      dateTo,
      date,
      page = 1,
      pageSize = 10,
    } = params;

    const qb = this.reportRepository.createQueryBuilder('report');

    if (classId) {
      qb.andWhere('report.class_id = :classId', { classId });
    }

    if (grade) {
      qb.andWhere('report.grade = :grade', { grade });
    }

    if (date) {
      qb.andWhere('report.report_date = :date', { date });
    } else if (dateFrom && dateTo) {
      qb.andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    } else if (dateFrom) {
      qb.andWhere('report.report_date >= :dateFrom', { dateFrom });
    } else if (dateTo) {
      qb.andWhere('report.report_date <= :dateTo', { dateTo });
    }

    qb.orderBy('report.report_date', 'DESC')
      .addOrderBy('report.class_name', 'ASC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  /**
   * 手动触发指定日期和班级的日报生成
   */
  async triggerManual(params: {
    classId?: string;
    date?: string;
  }): Promise<{
    generated: number;
    reports: AttendanceDailyReport[];
  }> {
    const reportDate = params.date ? new Date(params.date) : new Date();
    const generated: AttendanceDailyReport[] = [];

    if (params.classId) {
      const cls = await this.classRepository.findOne({
        where: { id: params.classId },
      });
      if (!cls) {
        throw new Error(`班级不存在: ${params.classId}`);
      }
      const report = await this.generateReportForClass(cls, reportDate);
      if (report) {
        generated.push(report);
      }
    } else {
      const classes = await this.classRepository.find({
        where: { isActive: true },
      });
      for (const cls of classes) {
        const report = await this.generateReportForClass(cls, reportDate);
        if (report) {
          generated.push(report);
        }
      }
    }

    return {
      generated: generated.length,
      reports: generated,
    };
  }
}
