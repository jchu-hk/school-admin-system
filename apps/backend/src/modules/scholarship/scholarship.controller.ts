import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ScholarshipService } from './scholarship.service';
import {
  Scholarship,
  ScholarshipApplication,
  ScholarshipDisbursement,
  ApplicationStatus,
  ScholarshipStatus,
  DisbursementStatus,
} from './scholarship.entity';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('奖学金管理')
@Controller('scholarships')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  // ---- 奖学金项目 ----

  @Post()
  @ApiOperation({ summary: '创建奖学金项目' })
  @ApiResponse({ status: 201, description: '创建成功', type: Scholarship })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN)
  createScholarship(
    @Body() dto: CreateScholarshipDto,
    @Request() req,
  ): Promise<Scholarship> {
    dto.createdBy = req.user.id;
    return this.scholarshipService.createScholarship(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取奖学金项目列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findAllScholarships(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ScholarshipStatus,
  ) {
    return this.scholarshipService.findAllScholarships(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取奖学金项目详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Scholarship })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findOneScholarship(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Scholarship> {
    return this.scholarshipService.findOneScholarship(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新奖学金项目' })
  @ApiResponse({ status: 200, description: '更新成功', type: Scholarship })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN)
  updateScholarship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScholarshipDto,
  ): Promise<Scholarship> {
    return this.scholarshipService.updateScholarship(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除奖学金项目' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN)
  removeScholarship(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.scholarshipService.removeScholarship(id);
  }

  // ---- 申请 ----

  @Post('applications')
  @ApiOperation({ summary: '提交奖学金申请' })
  @ApiResponse({ status: 201, description: '申请提交成功', type: ScholarshipApplication })
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER)
  createApplication(
    @Body() dto: CreateApplicationDto,
    @Request() req,
  ): Promise<ScholarshipApplication> {
    dto.createdBy = req.user.id;
    return this.scholarshipService.createApplication(dto);
  }

  @Get('applications')
  @ApiOperation({ summary: '获取申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findAllApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('scholarshipId') scholarshipId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: ApplicationStatus,
  ) {
    return this.scholarshipService.findAllApplications(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      { scholarshipId, studentId, status },
    );
  }

  @Get('applications/:id')
  @ApiOperation({ summary: '获取申请详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: ScholarshipApplication })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findOneApplication(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScholarshipApplication> {
    return this.scholarshipService.findOneApplication(id);
  }

  @Put('applications/:id/review')
  @ApiOperation({ summary: '审核申请' })
  @ApiResponse({ status: 200, description: '审核完成', type: ScholarshipApplication })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  reviewApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApplicationDto,
  ): Promise<ScholarshipApplication> {
    return this.scholarshipService.reviewApplication(id, dto);
  }

  @Delete('applications/:id')
  @ApiOperation({ summary: '删除申请' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeApplication(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.scholarshipService.removeApplication(id);
  }

  // ---- 发放 ----

  @Post('disbursements')
  @ApiOperation({ summary: '创建发放记录' })
  @ApiResponse({ status: 201, description: '创建成功', type: ScholarshipDisbursement })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createDisbursement(
    @Body() body: {
      applicationId: string;
      amount: number;
      bankAccount?: string;
      bankName?: string;
      recipientName?: string;
      processedBy: string;
    },
  ): Promise<ScholarshipDisbursement> {
    return this.scholarshipService.createDisbursement(
      body.applicationId,
      body.amount,
      body.processedBy,
      body.bankAccount,
      body.bankName,
      body.recipientName,
    );
  }

  @Get('disbursements')
  @ApiOperation({ summary: '获取发放记录列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.SYSTEM_ADMIN)
  findAllDisbursements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('applicationId') applicationId?: string,
    @Query('status') status?: DisbursementStatus,
  ) {
    return this.scholarshipService.findAllDisbursements(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      { applicationId, status },
    );
  }

  @Put('disbursements/:id/success')
  @ApiOperation({ summary: '标记发放成功' })
  @ApiResponse({ status: 200, description: '标记成功', type: ScholarshipDisbursement })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  markDisbursementSuccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('transactionId') transactionId: string,
  ): Promise<ScholarshipDisbursement> {
    return this.scholarshipService.markDisbursementSuccess(id, transactionId);
  }

  @Put('disbursements/:id/failed')
  @ApiOperation({ summary: '标记发放失败' })
  @ApiResponse({ status: 200, description: '标记成功', type: ScholarshipDisbursement })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  markDisbursementFailed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('failureReason') failureReason: string,
  ): Promise<ScholarshipDisbursement> {
    return this.scholarshipService.markDisbursementFailed(id, failureReason);
  }

  // ---- 统计 ----

  @Get('stats/summary')
  @ApiOperation({ summary: '获取奖学金统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  getStats(
    @Query('scholarshipId') scholarshipId?: string,
  ) {
    return this.scholarshipService.getStats(scholarshipId);
  }
}
