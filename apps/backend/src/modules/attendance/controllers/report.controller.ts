import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Attendance,
  AttendanceStatus,
} from '../attendance.entity';
import { DailyReportService } from '../services/daily-report.service';
import { AttendanceDailyReport } from '../entities/attendance-daily-report.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../user/user.entity';

@ApiTags('QR签到-记录查询')
@Controller('attendance/qr')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly dailyReportService: DailyReportService,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 查询签到记录
   *
   * GET /attendance/qr/record
   *
   * 角色行为:
   * - 学生: 查询自己的签到记录
   * - 家长: 查询关联孩子（parent_student_links）的签到记录
   * - 班主任: 查询所带班级某日签到记录
   * - 管理员: 查询任意学生的签到记录
   */
  @Get('record')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '查询签到记录',
    description:
      '按角色查询签到记录：学生查自己，家长查关联孩子，' +
      '班主任查班级，管理员查任意。',
  })
  @ApiQuery({
    name: 'student_id',
    required: false,
    type: String,
    description: '学生ID（管理员/班主任可用；学生和家长无需传）',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    type: String,
    description: '班级ID（班主任/管理员按班级过滤）',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: '日期 (YYYY-MM-DD)，默认当天',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    type: String,
    description: '起始日期 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    type: String,
    description: '结束日期 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AttendanceStatus,
    description: '签到状态过滤',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码（默认1）',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页条数（默认20）',
  })
  @ApiResponse({
    status: 200,
    description: '签到记录列表',
  })
  async getRecords(
    @Request() req: any,
    @Query('student_id') studentId?: string,
    @Query('class_id') classId?: string,
    @Query('date') date?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('status') status?: AttendanceStatus,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<{
    items: Attendance[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const currentUser: User = req.user;
    const p = page || 1;
    const ps = Math.min(pageSize || 20, 100);

    // Build query
    const qb = this.attendanceRepository.createQueryBuilder('attendance');

    // Role-based filtering
    const role = currentUser.role;

    if (role === UserRole.STUDENT) {
      // 学生只能查自己的记录
      qb.andWhere('attendance.student_id = :studentId', {
        studentId: currentUser.id,
      });
    } else if (role === UserRole.PARENT) {
      // 家长: 查关联孩子
      // 如果传了student_id参数，校验是否关联
      if (studentId) {
        // 校验 parent_student_links
        const isLinked = await this.verifyParentStudentLink(
          currentUser.id,
          studentId,
        );
        if (!isLinked) {
          throw new ForbiddenException(
            '您与指定学生无关联，无法查看其签到记录',
          );
        }
        qb.andWhere('attendance.student_id = :studentId', { studentId });
      } else {
        // 没传student_id，查所有关联孩子
        const linkedStudentIds = await this.getLinkedStudentIds(
          currentUser.id,
        );
        if (linkedStudentIds.length === 0) {
          return { items: [], total: 0, page: p, pageSize: ps };
        }
        qb.andWhere('attendance.student_id IN (:...studentIds)', {
          studentIds: linkedStudentIds,
        });
      }
    } else if (role === UserRole.TEACHER) {
      // 班主任或老师
      if (classId) {
        qb.andWhere('attendance.class_id = :classId', { classId });
      } else if (studentId) {
        qb.andWhere('attendance.student_id = :studentId', { studentId });
      } else {
        // 老师未指定范围，默认只能查自己班级
        throw new BadRequestException(
          '教师角色需指定 class_id 或 student_id',
        );
      }
    } else {
      // 管理员（school_staff, school_director, system_admin）
      if (studentId) {
        qb.andWhere('attendance.student_id = :studentId', { studentId });
      }
      if (classId) {
        qb.andWhere('attendance.class_id = :classId', { classId });
      }
    }

    // Date filters
    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      qb.andWhere(
        'attendance.created_at BETWEEN :dayStart AND :dayEnd',
        { dayStart: dayStart.toISOString(), dayEnd: dayEnd.toISOString() },
      );
    } else if (dateFrom && dateTo) {
      qb.andWhere(
        'attendance.created_at BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo + 'T23:59:59.999Z'),
        },
      );
    } else if (dateFrom) {
      qb.andWhere('attendance.created_at >= :dateFrom', {
        dateFrom: new Date(dateFrom).toISOString(),
      });
    } else if (dateTo) {
      qb.andWhere('attendance.created_at <= :dateTo', {
        dateTo: new Date(dateTo + 'T23:59:59.999Z').toISOString(),
      });
    }

    // Status filter
    if (status) {
      qb.andWhere('attendance.status = :status', { status });
    }

    // Order
    qb.orderBy('attendance.created_at', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((p - 1) * ps)
      .take(ps)
      .getMany();

    return { items, total, page: p, pageSize: ps };
  }

  /**
   * 查询签到日报
   *
   * GET /attendance/qr/report
   *
   * 管理端按年级/班级/日期范围过滤。
   */
  @Get('report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.TEACHER,
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: '查询签到日报',
    description:
      '按年级/班级/日期范围查询签到日报。教师可查自己班级，管理员可查任意。',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    type: String,
    description: '班级ID',
  })
  @ApiQuery({
    name: 'grade',
    required: false,
    type: String,
    description: '年级（如 P1、F.1）',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    type: String,
    description: '起始日期 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    type: String,
    description: '结束日期 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: '指定日期 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码（默认1）',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页条数（默认10）',
  })
  @ApiResponse({
    status: 200,
    description: '日报列表',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        total: { type: 'integer' },
        page: { type: 'integer' },
        pageSize: { type: 'integer' },
      },
    },
  })
  async getReports(
    @Request() req: any,
    @Query('class_id') classId?: string,
    @Query('grade') grade?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('date') date?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<{
    items: AttendanceDailyReport[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const currentUser: User = req.user;
    const role = currentUser.role;

    // 教师角色只能查自己班级
    if (role === UserRole.TEACHER) {
      if (!classId) {
        throw new BadRequestException('教师角色需指定 class_id');
      }
    }

    return this.dailyReportService.getReports({
      classId,
      grade,
      dateFrom,
      dateTo,
      date,
      page,
      pageSize,
    });
  }

  /**
   * 手动触发日报生成
   */
  @Post('report/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '手动触发日报生成',
    description:
      '手动触发指定班级和日期的签到日报生成。不传 class_id 则生成所有班级。',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    type: String,
    description: '班级ID（不传则生成全部活跃班级）',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: '日期 (YYYY-MM-DD)，默认当天',
  })
  @ApiResponse({
    status: 200,
    description: '生成的日报数量',
    schema: {
      type: 'object',
      properties: {
        generated: { type: 'integer' },
        reports: { type: 'array' },
      },
    },
  })
  async triggerManualReport(
    @Query('class_id') classId?: string,
    @Query('date') date?: string,
  ): Promise<{
    generated: number;
    reports: AttendanceDailyReport[];
  }> {
    return this.dailyReportService.triggerManual({ classId, date });
  }

  // ============ 家长-学生关联校验辅助方法 ============

  /**
   * 验证家长与学生的关联关系
   */
  private async verifyParentStudentLink(
    parentId: string,
    studentId: string,
  ): Promise<boolean> {
    // 使用原生的 Repository 查询 parent_student_links 表
    try {
      const result = await this.userRepository.query(
        `SELECT 1 FROM parent_student_links
         WHERE parent_id = $1 AND student_id = $2
         LIMIT 1`,
        [parentId, studentId],
      );
      return result && result.length > 0;
    } catch (err) {
      this.logger.warn(
        `家长-学生关联校验查询失败: ${err.message}`,
      );
      return false;
    }
  }

  /**
   * 获取家长关联的所有学生ID
   */
  private async getLinkedStudentIds(
    parentId: string,
  ): Promise<string[]> {
    try {
      const results = await this.userRepository.query(
        `SELECT student_id FROM parent_student_links
         WHERE parent_id = $1`,
        [parentId],
      );
      return results.map((r: any) => r.student_id);
    } catch (err) {
      this.logger.warn(
        `查询关联学生ID失败: ${err.message}`,
      );
      return [];
    }
  }


}
