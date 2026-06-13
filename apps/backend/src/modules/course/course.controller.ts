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
import { CourseService } from './course.service';
import { Course } from './course.entity';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
} from './dto/course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('课程管理')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: '创建课程' })
  @ApiResponse({ status: 201, description: '课程创建成功', type: Course })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: '获取课程列表' })
  @ApiResponse({ status: 200, description: '获取课程列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findAll(@Query() query: CourseQueryDto) {
    return this.courseService.findAll(query);
  }

  @Get('grade/:grade')
  @ApiOperation({ summary: '按年级获取课程' })
  @ApiResponse({ status: 200, description: '获取年级课程成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findByGrade(@Param('grade') grade: string) {
    return this.courseService.findByGrade(grade);
  }

  @Get('subject/:subject')
  @ApiOperation({ summary: '按科目获取课程' })
  @ApiResponse({ status: 200, description: '获取科目课程成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findBySubject(@Param('subject') subject: string) {
    return this.courseService.findBySubject(subject);
  }

  @Get('teacher/:teacher')
  @ApiOperation({ summary: '按教师获取课程' })
  @ApiResponse({ status: 200, description: '获取教师课程成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findByTeacher(@Param('teacher') teacher: string) {
    return this.courseService.findByTeacher(teacher);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课程详情' })
  @ApiResponse({ status: 200, description: '获取课程详情成功', type: Course })
  @ApiResponse({ status: 404, description: '课程不存在' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新课程' })
  @ApiResponse({ status: 200, description: '课程更新成功', type: Course })
  @ApiResponse({ status: 404, description: '课程不存在' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除课程' })
  @ApiResponse({ status: 204, description: '课程删除成功' })
  @ApiResponse({ status: 404, description: '课程不存在' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.remove(id);
  }

  @Patch(':id/enrollment')
  @ApiOperation({ summary: '更新选课人数' })
  @ApiResponse({ status: 200, description: '更新成功', type: Course })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('enrolled') enrolled: number,
  ) {
    return this.courseService.updateEnrollment(id, enrolled);
  }
}
