import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentProfileService } from './student-profile.service';
import {
  CreateStudentProfileDto,
  UpdateStudentProfileDto,
  ArchiveStudentProfileDto,
} from './dto/student-profile.dto';
import { StudentProfile } from './student-profile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@ApiTags('学生档案管理')
@Controller('student-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentProfileController {
  constructor(
    private readonly studentProfileService: StudentProfileService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建学生档案' })
  @ApiResponse({
    status: 201,
    description: '档案创建成功',
    type: StudentProfile,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async create(@Body() dto: CreateStudentProfileDto, @Request() req) {
    try {
      const profile = await this.studentProfileService.create(dto, req.user.id);
      await this.auditService.log(
        AuditAction.STUDENT_PROFILE_CREATE,
        req.user.id,
        `创建学生档案: ${dto.studentId}`,
        req.ip,
        dto,
        HttpStatus.CREATED,
      );
      return profile;
    } catch (error) {
      await this.auditService.log(
        AuditAction.STUDENT_PROFILE_CREATE,
        req.user.id,
        `创建学生档案失败: ${error.message}`,
        req.ip,
        dto,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: '获取学生档案列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '获取档案列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.studentProfileService.findAll(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学生档案详情' })
  @ApiResponse({
    status: 200,
    description: '获取档案详情成功',
    type: StudentProfile,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async findOne(@Param('id') id: string, @Request() req) {
    const profile = await this.studentProfileService.findOne(id);
    // 家长只能查看关联学生的档案
    if (req.user.role === UserRole.PARENT) {
      if (profile.studentId !== req.user.relatedStudentId) {
        throw new Error('无权访问此学生档案');
      }
    }
    // 学生只能查看自己的档案
    if (req.user.role === UserRole.STUDENT) {
      if (profile.studentId !== req.user.id) {
        throw new Error('无权访问此学生档案');
      }
    }
    return profile;
  }

  @Get('student/:studentId/full')
  @ApiOperation({ summary: '获取学生完整档案（含成绩摘要）' })
  @ApiResponse({ status: 200, description: '获取完整档案成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async getFullProfile(@Param('studentId') studentId: string, @Request() req) {
    // 家长只能查看关联学生的档案
    if (req.user.role === UserRole.PARENT) {
      if (studentId !== req.user.relatedStudentId) {
        throw new Error('无权访问此学生档案');
      }
    }
    // 学生只能查看自己的档案
    if (req.user.role === UserRole.STUDENT) {
      if (studentId !== req.user.id) {
        throw new Error('无权访问此学生档案');
      }
    }
    return this.studentProfileService.getFullProfile(studentId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: '按学生ID获取档案' })
  @ApiResponse({
    status: 200,
    description: '获取档案成功',
    type: StudentProfile,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async findByStudentId(@Param('studentId') studentId: string, @Request() req) {
    // 家长只能查看关联学生的档案
    if (req.user.role === UserRole.PARENT) {
      if (studentId !== req.user.relatedStudentId) {
        throw new Error('无权访问此学生档案');
      }
    }
    // 学生只能查看自己的档案
    if (req.user.role === UserRole.STUDENT) {
      if (studentId !== req.user.id) {
        throw new Error('无权访问此学生档案');
      }
    }
    return this.studentProfileService.findByStudentId(studentId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新学生档案' })
  @ApiResponse({ status: 200, description: '更新成功', type: StudentProfile })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProfileDto,
    @Request() req,
  ) {
    try {
      const profile = await this.studentProfileService.update(
        id,
        dto,
        req.user.id,
      );
      await this.auditService.log(
        AuditAction.STUDENT_PROFILE_UPDATE,
        req.user.id,
        `更新学生档案: ${id}`,
        req.ip,
        { id, ...dto },
        HttpStatus.OK,
      );
      return profile;
    } catch (error) {
      await this.auditService.log(
        AuditAction.STUDENT_PROFILE_UPDATE,
        req.user.id,
        `更新学生档案失败: ${error.message}`,
        req.ip,
        { id, ...dto },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档学生档案' })
  @ApiResponse({ status: 200, description: '归档成功', type: StudentProfile })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async archive(
    @Param('id') id: string,
    @Body() dto: ArchiveStudentProfileDto,
    @Request() req,
  ) {
    try {
      const profile = await this.studentProfileService.archive(
        id,
        dto.archiveReason,
        req.user.id,
      );
      await this.auditService.log(
        AuditAction.STUDENT_PROFILE_ARCHIVE,
        req.user.id,
        `归档学生档案: ${id}`,
        req.ip,
        { id, archiveReason: dto.archiveReason },
        HttpStatus.OK,
      );
      return profile;
    } catch (error) {
      await this.auditService.log(
        AuditAction.STUDENT_PROFILE_ARCHIVE,
        req.user.id,
        `归档学生档案失败: ${error.message}`,
        req.ip,
        { id },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: '取消归档学生档案' })
  @ApiResponse({
    status: 200,
    description: '取消归档成功',
    type: StudentProfile,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async unarchive(@Param('id') id: string, @Request() req) {
    const profile = await this.studentProfileService.unarchive(id, req.user.id);
    await this.auditService.log(
      AuditAction.STUDENT_PROFILE_UPDATE,
      req.user.id,
      `取消归档学生档案: ${id}`,
      req.ip,
      { id },
      HttpStatus.OK,
    );
    return profile;
  }
}
