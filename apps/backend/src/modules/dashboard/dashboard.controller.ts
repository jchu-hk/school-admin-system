import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  DashboardService,
  DashboardStats,
  AttendanceTrend,
  RecentActivity,
} from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/roles.decorator';
import { User } from '../user/user.entity';

@ApiTags('仪表盘')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取仪表盘统计数据' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      example: {
        todayAttendance: {
          total: 100,
          present: 95,
          absent: 3,
          leave: 2,
          attendanceRate: 95,
        },
        monthlyLeave: {
          total: 10,
          approved: 8,
          pending: 1,
          rejected: 1,
        },
        pendingInquiries: 1,
        todayNotifications: 5,
      },
    },
  })
  async getStats(@CurrentUser() user: User): Promise<DashboardStats> {
    return this.dashboardService.getStats(user);
  }

  @Get('attendance-trend')
  @ApiOperation({ summary: '获取出勤趋势数据' })
  @ApiQuery({
    name: 'days',
    description: '最近N天的数据',
    required: false,
    type: Number,
    example: 7,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      example: [
        {
          date: '2024-06-01',
          present: 95,
          absent: 3,
          leave: 2,
          attendanceRate: 95,
        },
        {
          date: '2024-06-02',
          present: 96,
          absent: 2,
          leave: 2,
          attendanceRate: 96,
        },
      ],
    },
  })
  async getAttendanceTrend(
    @Query('days') days: number = 7,
    @CurrentUser() user: User,
  ): Promise<AttendanceTrend[]> {
    return this.dashboardService.getAttendanceTrend(days, user);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: '获取近期活动列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      example: [
        {
          id: 'activity-1',
          type: 'leave',
          title: '请假申请',
          description: '张三 申请了 sick_leave',
          timestamp: '2024-06-08T10:00:00.000Z',
          user: {
            id: 'user-1',
            name: '张三',
          },
        },
        {
          id: 'activity-2',
          type: 'user',
          title: '用户登录',
          description: '李四 登录了系统',
          timestamp: '2024-06-08T09:30:00.000Z',
          user: {
            id: 'user-2',
            name: '李四',
          },
        },
      ],
    },
  })
  async getRecentActivities(
    @CurrentUser() user: User,
  ): Promise<RecentActivity[]> {
    return this.dashboardService.getRecentActivities(user);
  }
}
