import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { Leave, LeaveStatus } from '../leave/leave.entity';

export interface DashboardStats {
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
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
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
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

    // 获取最近的用户活动
    const recentUserActivities = await this.getRecentUserActivities(user, 5);
    activities.push(...recentUserActivities);

    // 按时间排序
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, 10);
  }

  /**
   * 管理员/校务主任统计数据
   */
  private async getAdminStats(
    today: Date,
    tomorrow: Date,
    firstDayOfMonth: Date,
  ): Promise<DashboardStats> {
    // 获取总学生数
    const totalUsers = await this.userRepository.count({
      where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
    });

    // 获取今日请假人数
    const todayLeaves = await this.leaveRepository.count({
      where: {
        startDate: Between(today, tomorrow),
        status: LeaveStatus.APPROVED,
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

    // 计算今日出勤统计（模拟数据）
    const present = Math.max(0, totalUsers - todayLeaves);
    const attendanceRate =
      totalUsers > 0 ? Math.round((present / totalUsers) * 100) : 0;

    return {
      todayAttendance: {
        total: totalUsers,
        present,
        absent: todayLeaves,
        leave: todayLeaves,
        attendanceRate,
      },
      monthlyLeave: {
        total: monthlyLeaves.length,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: rejectedLeaves,
      },
      pendingInquiries: pendingLeaves, // 待处理查询数 = 待审批请假
      todayNotifications: 0, // 今日通知数（可从通知服务获取）
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
    // 获取本班学生数
    const classStudents = await this.userRepository.count({
      where: {
        role: UserRole.STUDENT,
        className: user.className,
        status: UserStatus.ACTIVE,
      },
    });

    // 获取本班今日请假
    const todayLeaves = await this.leaveRepository
      .createQueryBuilder('leave')
      .innerJoin(User, 'user', 'user.id = leave.applicantId')
      .where('user.className = :className', { className: user.className })
      .andWhere('leave.startDate BETWEEN :today AND :tomorrow', {
        today,
        tomorrow,
      })
      .andWhere('leave.status = :status', { status: LeaveStatus.APPROVED })
      .getCount();

    // 获取本月请假统计
    const monthlyLeaves = await this.leaveRepository
      .createQueryBuilder('leave')
      .innerJoin(User, 'user', 'user.id = leave.applicantId')
      .where('user.className = :className', { className: user.className })
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

    const present = Math.max(0, classStudents - todayLeaves);
    const attendanceRate =
      classStudents > 0 ? Math.round((present / classStudents) * 100) : 0;

    return {
      todayAttendance: {
        total: classStudents,
        present,
        absent: todayLeaves,
        leave: todayLeaves,
        attendanceRate,
      },
      monthlyLeave: {
        total: monthlyLeaves.length,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: monthlyLeaves.filter((l) => l.status === LeaveStatus.REJECTED)
          .length,
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
    // 获取关联学生的请假统计
    const studentLeaves = await this.leaveRepository.find({
      where: {
        applicantId: user.relatedStudentId,
        startDate: Between(firstDayOfMonth, tomorrow),
      },
    });

    const todayLeaves = studentLeaves.filter(
      (l) => l.startDate >= today && l.startDate < tomorrow,
    ).length;

    return {
      todayAttendance: {
        total: 1,
        present: todayLeaves === 0 ? 1 : 0,
        absent: todayLeaves,
        leave: todayLeaves,
        attendanceRate: todayLeaves === 0 ? 100 : 0,
      },
      monthlyLeave: {
        total: studentLeaves.length,
        approved: studentLeaves.filter((l) => l.status === LeaveStatus.APPROVED)
          .length,
        pending: studentLeaves.filter((l) => l.status === LeaveStatus.PENDING)
          .length,
        rejected: studentLeaves.filter((l) => l.status === LeaveStatus.REJECTED)
          .length,
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
    // 获取自己的请假统计
    const myLeaves = await this.leaveRepository.find({
      where: {
        applicantId: user.id,
        startDate: Between(firstDayOfMonth, tomorrow),
      },
    });

    const todayLeaves = myLeaves.filter(
      (l) => l.startDate >= today && l.startDate < tomorrow,
    ).length;

    return {
      todayAttendance: {
        total: 1,
        present: todayLeaves === 0 ? 1 : 0,
        absent: todayLeaves,
        leave: todayLeaves,
        attendanceRate: todayLeaves === 0 ? 100 : 0,
      },
      monthlyLeave: {
        total: myLeaves.length,
        approved: myLeaves.filter((l) => l.status === LeaveStatus.APPROVED)
          .length,
        pending: myLeaves.filter((l) => l.status === LeaveStatus.PENDING)
          .length,
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
      todayAttendance: {
        total: 0,
        present: 0,
        absent: 0,
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
    _user: User,
  ): Promise<{
    present: number;
    absent: number;
    leave: number;
    attendanceRate: number;
  }> {
    // 获取当日请假人数
    const leaveCount = await this.leaveRepository.count({
      where: {
        startDate: Between(startDate, endDate),
        status: LeaveStatus.APPROVED,
      },
    });

    // 获取总用户数（简化处理）
    const totalUsers = await this.userRepository.count({
      where: { role: UserRole.STUDENT },
    });

    const present = Math.max(0, totalUsers - leaveCount);
    const attendanceRate =
      totalUsers > 0 ? Math.round((present / totalUsers) * 100) : 0;

    return {
      present,
      absent: leaveCount,
      leave: leaveCount,
      attendanceRate,
    };
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
      .leftJoinAndSelect('leave.applicant', 'applicant')
      .orderBy('leave.createdAt', 'DESC')
      .take(limit);

    // 根据角色过滤
    if (user.role === UserRole.TEACHER && user.className) {
      query.where('applicant.className = :className', {
        className: user.className,
      });
    } else if (user.role === UserRole.PARENT && user.relatedStudentId) {
      query.where('leave.applicantId = :studentId', {
        studentId: user.relatedStudentId,
      });
    } else if (user.role === UserRole.STUDENT) {
      query.where('leave.applicantId = :userId', { userId: user.id });
    }

    const leaves = await query.getMany();

    return leaves.map((leave) => ({
      id: leave.id,
      type: 'leave' as const,
      title: '请假申请',
      description: `${leave.applicant?.name || '用户'} 申请了 ${leave.leaveType}`,
      timestamp: leave.createdAt,
      user: leave.applicant
        ? {
            id: leave.applicant.id,
            name: leave.applicant.name,
          }
        : undefined,
    }));
  }

  /**
   * 获取最近的用户活动
   */
  private async getRecentUserActivities(
    user: User,
    limit: number,
  ): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

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
