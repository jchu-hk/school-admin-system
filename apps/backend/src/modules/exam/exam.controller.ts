import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { Exam, ExamStatus } from './exam.entity';
import { CreateExamDto, UpdateExamDto, ExamQueryDto } from './dto/exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('考试管理')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiOperation({ summary: '创建考试' })
  @ApiResponse({ status: 201, description: '考试创建成功', type: Exam })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  create(@Body() createDto: CreateExamDto) {
    return this.examService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取考试列表' })
  @ApiResponse({ status: 200, description: '获取考试列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findAll(@Query() query: ExamQueryDto) {
    return this.examService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取考试统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStats() {
    return this.examService.getStats();
  }

  @Get('date/:date')
  @ApiOperation({ summary: '按日期获取考试' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findByDate(@Param('date') date: string) {
    return this.examService.findByDate(date);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: '按班级获取考试' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.examService.findByClass(classId);
  }

  @Get('subject/:subject')
  @ApiOperation({ summary: '按科目获取考试' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findBySubject(@Param('subject') subject: string) {
    return this.examService.findBySubject(subject);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取考试详情' })
  @ApiResponse({ status: 200, description: '获取考试详情成功', type: Exam })
  @ApiResponse({ status: 404, description: '考试不存在' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新考试' })
  @ApiResponse({ status: 200, description: '考试更新成功', type: Exam })
  @ApiResponse({ status: 404, description: '考试不存在' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateExamDto,
  ) {
    return this.examService.update(id, updateDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新考试状态' })
  @ApiResponse({ status: 200, description: '状态更新成功', type: Exam })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ExamStatus,
  ) {
    return this.examService.update(id, { status } as UpdateExamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除考试' })
  @ApiResponse({ status: 204, description: '考试删除成功' })
  @ApiResponse({ status: 404, description: '考试不存在' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examService.remove(id);
  }
}
