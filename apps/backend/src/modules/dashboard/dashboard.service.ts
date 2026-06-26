import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { LeaveApplication, LeaveStatus } from '../leave/leave.entity';
import { Attendance, AttendanceStatus } from '../attendance/attendance.entity';

export interface DashboardStats {
  studentCount: number;
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    attendanceRate: number;
  };
  monthlyLeave: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  pendingInquiries: number;
  todayNotifications: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendanceRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'leave' | 'attendance' | 'notification' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LeaveApplication)
    private readonly leaveRepository: Repository<LeaveApplication>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  /**
   * 获取仪表盘统计数据
   * 根据用户角色返回不同的统计数据
   */
  async getStats(user: User): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 根据角色获取不同的统计数据
    switch (user.role) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.SCHOOL_DIRECTOR:
      case UserRole.SCHOOL_STAFF:
        return this.getAdminStats(today, tomorrow, firstDayOfMonth);
      case UserRole.TEACHER:
        return this.getTeacherStats(user, today, tomorrow, firstDayOfMonth);
      case UserRole.PARENT:
        return this.getParentStats(user, today, tomorrow, firstDayOfMonth);
      case UserRole.STUDENT:
        return this.getStudentStats(user, today, tomorrow, firstDayOfMonth);
      default:
        return this.getDefaultStats();
    }
  }

  /**
   * 获取最近N天的出勤趋势数据
   */
  async getAttendanceTrend(
    days: number,
    user: User,
  ): Promise<AttendanceTrend[]> {
    const trends: AttendanceTrend[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // 获取当天的统计数据
      const stats = await this.getDailyAttendanceStats(date, nextDay, user);

      trends.push({
        date: date.toISOString().split('T')[0],
        ...stats,
      });
    }

    return trends;
  }

  /**
   * 获取近期活动列表
   */
  async getRecentActivities(user: User): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // 获取最近的请假申请
    const recentLeaves = await this.getRecentLeaves(user, 5);
    activities.push(...recentLeaves);

    // 获取最近的出勤记录
    const recentAttendances = await this.getRecentAttendances(user, 5);
    activities.push(...recentAttendances);

    // 获取最近的用户活动
    const recentUserActivities = await this.getRecentUserActivities(user, 5);
    activities.push(...recentUserActivities);

    // 按时间排序
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, 10);
  }

  /**
   * 管理员/校务主任统计数据
   * 从 attendances 表读取实际出勤数据
   */
  private async getAdminStats(
    today: Date,
    tomorrow: Date,
    firstDayOfMonth: Date,
  ): Promise<DashboardStats> {
    // 从 users 表读取学生总数
    const studentCount = await this.userRepository.count({
      where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
    });

    // 从 attendances 表读取今日出勤数据
    const todayAttendances = await this.attendanceRepository.find({
      where: {
        attendanceDate: Between(today, tomorrow),
      },
    });

    // 获取本月请假统计
    const monthlyLeaves = await this.leaveRepository.find({
      where: {
        startDate: Between(firstDayOfMonth, tomorrow),
      },
    });

    const approvedLeaves = monthlyLeaves.filter(
      (l) => l.status === LeaveStatus.APPROVED,
    ).length;
    const pendingLeaves = monthlyLeaves.filter(
      (l) => l.status === LeaveStatus.PENDING,
    ).length;
    const rejectedLeaves = monthlyLeaves.filter(
      (l) => l.status === LeaveStatus.REJECTED,
    ).length;

    // 计算今日出勤统计
    const total = todayAttendances.length;
    const present = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    const late = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const absent = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    const leave = todayAttendances.filter(
      (a) =>
        a.status === AttendanceStatus.LEAVE_EARLY ||
        a.status === AttendanceStatus.SICK_LEAVE ||
        a.status === AttendanceStatus.PERSONAL_LEAVE,
    ).length;

    const attendanceRate =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    // 获取待处理的家长查询 (使用原始查询，因为实体表名不匹配)
    const pendingInquiriesResult = await this.attendanceRepository.query(
      `SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'`
    );
    const pendingInquiries = parseInt(pendingInquiriesResult[0]?.count || '0', 10);

    return {
      studentCount,
      todayAttendance: {
        total,
        present,
        absent,
        late,
        leave,
        attendanceRate,
      },
      monthlyLeave: {
        total: monthlyLeaves.length,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: rejectedLeaves,
      },
      pendingInquiries,
      todayNotifications: 0,
    };
  }

  /**
   * 教师统计数据
   */
  private async getTeacherStats(
    user: User,
    today: Date,
    tomorrow: Date,
    firstDayOfMonth: Date,
  ): Promise<DashboardStats> {
    // 获取本班学生总数
    const studentCount = await this.userRepository.count({
      where: {
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        className: user.className,
      },
    });

    // 获取本班今日出勤数据
    const todayAttendances = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin(User, 'student', 'student.id = attendance.studentId')
      .where('student.className = :className', { className: user.className })
      .andWhere('attendance.attendanceDate BETWEEN :today AND :tomorrow', {
        today,
        tomorrow,
      })
      .getMany();

    // 获取本月本班请假统计
    const monthlyLeaves = await this.leaveRepository
      .createQueryBuilder('leave')
      .innerJoin(User, 'student', 'student.id = leave.studentId')
      .where('student.className = :className', { className: user.className })
      .andWhere('leave.startDate BETWEEN :firstDay AND :tomorrow', {
        firstDay: firstDayOfMonth,
        tomorrow,
      })
      .getMany();

    const approvedLeaves = monthlyLeaves.filter(
      (l) => l.status === LeaveStatus.APPROVED,
    ).length;
    const pendingLeaves = monthlyLeaves.filter(
      (l) => l.status === LeaveStatus.PENDING,
    ).length;

    // 计算今日出勤统计
    const total = todayAttendances.length;
    const present = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    const late = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const absent = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    const leave = todayAttendances.filter(
      (a) =>
        a.status === AttendanceStatus.LEAVE_EARLY ||
        a.status === AttendanceStatus.SICK_LEAVE,
    ).length;

    const attendanceRate =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      studentCount,
      todayAttendance: {
        total,
        present,
        absent,
        late,
        leave,
        attendanceRate,
      },
      monthlyLeave: {
        total: monthlyLeaves.length,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: monthlyLeaves.filter(
          (l) => l.status === LeaveStatus.REJECTED,
        ).length,
      },
      pendingInquiries: pendingLeaves,
      todayNotifications: 0,
    };
  }

  /**
   * 家长统计数据
   */
  private async getParentStats(
    user: User,
    today: Date,
    tomorrow: Date,
    firstDayOfMonth: Date,
  ): Promise<DashboardStats> {
    if (!user.relatedStudentId) {
      return this.getDefaultStats();
    }

    // 获取关联学生的今日出勤
    const todayAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: user.relatedStudentId,
        attendanceDate: Between(today, tomorrow),
      },
    });

    // 获取关联学生的请假统计
    const studentLeaves = await this.leaveRepository.find({
      where: {
        studentId: user.relatedStudentId,
        startDate: Between(firstDayOfMonth, tomorrow),
      },
    });

    const pendingLeaves = studentLeaves.filter(
      (l) => l.status === LeaveStatus.PENDING,
    ).length;

    // 计算出勤状态
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    if (todayAttendance) {
      switch (todayAttendance.status) {
        case AttendanceStatus.PRESENT:
          present = 1;
          break;
        case AttendanceStatus.ABSENT:
          absent = 1;
          break;
        case AttendanceStatus.LATE:
          late = 1;
          break;
        case AttendanceStatus.LEAVE_EARLY:
        case AttendanceStatus.SICK_LEAVE:
        case AttendanceStatus.PERSONAL_LEAVE:
          leave = 1;
          break;
      }
    }

    return {
      studentCount: 1, // 家长关联1个学生
      todayAttendance: {
        total: 1,
        present,
        absent,
        late,
        leave,
        attendanceRate: present + late > 0 ? 100 : 0,
      },
      monthlyLeave: {
        total: studentLeaves.length,
        approved: studentLeaves.filter(
          (l) => l.status === LeaveStatus.APPROVED,
        ).length,
        pending: pendingLeaves,
        rejected: studentLeaves.filter(
          (l) => l.status === LeaveStatus.REJECTED,
        ).length,
      },
      pendingInquiries: 0,
      todayNotifications: 0,
    };
  }

  /**
   * 学生统计数据
   */
  private async getStudentStats(
    user: User,
    today: Date,
    tomorrow: Date,
    firstDayOfMonth: Date,
  ): Promise<DashboardStats> {
    // 获取自己的今日出勤
    const todayAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: user.id,
        attendanceDate: Between(today, tomorrow),
      },
    });

    // 获取自己的请假统计
    const myLeaves = await this.leaveRepository.find({
      where: {
        studentId: user.id,
        startDate: Between(firstDayOfMonth, tomorrow),
      },
    });

    const pendingLeaves = myLeaves.filter(
      (l) => l.status === LeaveStatus.PENDING,
    ).length;

    // 计算出勤状态
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    if (todayAttendance) {
      switch (todayAttendance.status) {
        case AttendanceStatus.PRESENT:
          present = 1;
          break;
        case AttendanceStatus.ABSENT:
          absent = 1;
          break;
        case AttendanceStatus.LATE:
          late = 1;
          break;
        case AttendanceStatus.LEAVE_EARLY:
        case AttendanceStatus.SICK_LEAVE:
        case AttendanceStatus.PERSONAL_LEAVE:
          leave = 1;
          break;
      }
    }

    return {
      studentCount: 1, // 学生自己
      todayAttendance: {
        total: 1,
        present,
        absent,
        late,
        leave,
        attendanceRate: present + late > 0 ? 100 : 0,
      },
      monthlyLeave: {
        total: myLeaves.length,
        approved: myLeaves.filter((l) => l.status === LeaveStatus.APPROVED)
          .length,
        pending: pendingLeaves,
        rejected: myLeaves.filter((l) => l.status === LeaveStatus.REJECTED)
          .length,
      },
      pendingInquiries: 0,
      todayNotifications: 0,
    };
  }

  /**
   * 默认统计数据
   */
  private getDefaultStats(): DashboardStats {
    return {
      studentCount: 0,
      todayAttendance: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        attendanceRate: 0,
      },
      monthlyLeave: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      },
      pendingInquiries: 0,
      todayNotifications: 0,
    };
  }

  /**
   * 获取每日出勤统计
   */
  private async getDailyAttendanceStats(
    startDate: Date,
    endDate: Date,
    user: User,
  ): Promise<{
    present: number;
    absent: number;
    late: number;
    leave: number;
    attendanceRate: number;
  }> {
    let attendances: Attendance[];

    if (user.role === UserRole.TEACHER && user.className) {
      // 教师：获取本班数据
      attendances = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin(User, 'student', 'student.id = attendance.studentId')
        .where('student.className = :className', { className: user.className })
        .andWhere('attendance.attendanceDate BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .getMany();
    } else {
      // 管理员：获取全部数据
      attendances = await this.attendanceRepository.find({
        where: {
          attendanceDate: Between(startDate, endDate),
        },
      });
    }

    const present = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    const late = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const absent = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    const leave = attendances.filter(
      (a) =>
        a.status === AttendanceStatus.LEAVE_EARLY ||
        a.status === AttendanceStatus.SICK_LEAVE,
    ).length;

    const total = attendances.length;
    const attendanceRate =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { present, absent, late, leave, attendanceRate };
  }

  /**
   * 获取最近的请假活动
   */
  private async getRecentLeaves(
    user: User,
    limit: number,
  ): Promise<RecentActivity[]> {
    const query = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.student', 'applicant')
      .orderBy('leave.createdAt', 'DESC')
      .take(limit);

    // 根据角色过滤
    if (user.role === UserRole.TEACHER && user.className) {
      query.andWhere('leave.student.className = :className', {
        className: user.className,
      });
    } else if (user.role === UserRole.PARENT && user.relatedStudentId) {
      query.andWhere('leave.studentId = :studentId', {
        studentId: user.relatedStudentId,
      });
    } else if (user.role === UserRole.STUDENT) {
      query.andWhere('leave.studentId = :userId', { userId: user.id });
    }

    const leaves = await query.getMany();

    return leaves.map((leave) => ({
      id: leave.id,
      type: 'leave' as const,
      title: '请假申请',
      description: `${leave.student?.name || '用户'} 申请了 ${leave.leaveType}`,
      timestamp: leave.createdAt,
      user: leave.student
        ? {
            id: leave.student.id,
            name: leave.student.name,
          }
        : undefined,
    }));
  }

  /**
   * 获取最近的出勤记录
   */
  private async getRecentAttendances(
    user: User,
    limit: number,
  ): Promise<RecentActivity[]> {
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .orderBy('attendance.createdAt', 'DESC')
      .take(limit);

    // 根据角色过滤
    if (user.role === UserRole.TEACHER && user.className) {
      query.andWhere('student.className = :className', {
        className: user.className,
      });
    } else if (user.role === UserRole.PARENT && user.relatedStudentId) {
      query.andWhere('attendance.studentId = :studentId', {
        studentId: user.relatedStudentId,
      });
    } else if (user.role === UserRole.STUDENT) {
      query.andWhere('attendance.studentId = :userId', { userId: user.id });
    }

    const attendances = await query.getMany();

    return attendances.map((attendance) => ({
      id: attendance.id,
      type: 'attendance' as const,
      title: '出勤记录',
      description: `${attendance.student?.name || '用户'} - ${this.getAttendanceStatusText(attendance.status)}`,
      timestamp: attendance.createdAt,
      user: attendance.student
        ? {
            id: attendance.student.id,
            name: attendance.student.name,
          }
        : undefined,
    }));
  }

  /**
   * 获取出勤状态文本
   */
  private getAttendanceStatusText(status: AttendanceStatus): string {
    const statusMap: Record<AttendanceStatus, string> = {
      [AttendanceStatus.PRESENT]: '出勤',
      [AttendanceStatus.ABSENT]: '缺勤',
      [AttendanceStatus.LATE]: '迟到',
      [AttendanceStatus.LEAVE_EARLY]: '早退',
      [AttendanceStatus.ABSENT_WITH_LEAVE]: '请假缺勤',
      [AttendanceStatus.SICK_LEAVE]: '病假',
      [AttendanceStatus.PERSONAL_LEAVE]: '事假',
    };
    return statusMap[status] || status;
  }

  /**
   * 获取最近的用户活动
   */
  private async getRecentUserActivities(
    user: User,
    limit: number,
  ): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // 只对管理员显示其他用户活动
    if (user.role !== UserRole.SYSTEM_ADMIN && user.role !== UserRole.SCHOOL_DIRECTOR && user.role !== UserRole.SCHOOL_STAFF) {
      return activities;
    }

    // 获取最近登录的用户
    const recentUsers = await this.userRepository.find({
      where: { status: UserStatus.ACTIVE },
      order: { lastLoginAt: 'DESC' },
      take: limit,
    });

    recentUsers.forEach((u) => {
      if (u.lastLoginAt) {
        activities.push({
          id: `login-${u.id}`,
          type: 'user',
          title: '用户登录',
          description: `${u.name} 登录了系统`,
          timestamp: u.lastLoginAt,
          user: {
            id: u.id,
            name: u.name,
          },
        });
      }
    });

    return activities;
  }
}
