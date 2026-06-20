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
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TuitionService, ReconciliationReport } from './tuition.service';
import { TuitionStandard } from './tuition.entity';
import { TuitionPayment } from './tuition.entity';
import { SubsidyType } from './tuition.entity';
import {
  CreateTuitionStandardDto,
  UpdateTuitionStandardDto,
  TuitionStandardQueryDto,
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  TuitionPaymentQueryDto,
  ApplySubsidyDto,
  CreateDisputeDto,
  ResolveDisputeDto,
} from './dto/tuition.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('学费管理')
@Controller('tuition')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TuitionController {
  constructor(private readonly tuitionService: TuitionService) {}

  // ============ Tuition Standards ============

  @Post('standards')
  @ApiOperation({ summary: '创建学费标准' })
  @ApiResponse({
    status: 201,
    description: '学费标准创建成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createStandard(@Body() createDto: CreateTuitionStandardDto) {
    return this.tuitionService.createStandard(createDto);
  }

  @Get('standards')
  @ApiOperation({ summary: '获取学费标准列表' })
  @ApiResponse({ status: 200, description: '获取学费标准列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllStandards(@Query() query: TuitionStandardQueryDto) {
    return this.tuitionService.findAllStandards(query);
  }

  @Get('standards/:id')
  @ApiOperation({ summary: '获取学费标准详情' })
  @ApiResponse({
    status: 200,
    description: '获取学费标准详情成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneStandard(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.findOneStandard(id);
  }

  @Put('standards/:id')
  @ApiOperation({ summary: '更新学费标准' })
  @ApiResponse({
    status: 200,
    description: '学费标准更新成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateStandard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTuitionStandardDto,
  ) {
    return this.tuitionService.updateStandard(id, updateDto);
  }

  @Delete('standards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除学费标准' })
  @ApiResponse({ status: 204, description: '学费标准删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeStandard(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.removeStandard(id);
  }

  // ============ Tuition Payments ============

  @Post('payments')
  @ApiOperation({ summary: '创建缴费记录' })
  @ApiResponse({
    status: 201,
    description: '缴费记录创建成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createPayment(@Body() createDto: CreateTuitionPaymentDto) {
    return this.tuitionService.createPayment(createDto);
  }

  @Get('payments')
  @ApiOperation({ summary: '获取缴费记录列表' })
  @ApiResponse({ status: 200, description: '获取缴费记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllPayments(@Query() query: TuitionPaymentQueryDto) {
    return this.tuitionService.findAllPayments(query);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: '获取缴费记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取缴费记录详情成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOnePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.findOnePayment(id);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: '更新缴费记录' })
  @ApiResponse({
    status: 200,
    description: '缴费记录更新成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTuitionPaymentDto,
  ) {
    return this.tuitionService.updatePayment(id, updateDto);
  }

  @Delete('payments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除缴费记录' })
  @ApiResponse({ status: 204, description: '缴费记录删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.removePayment(id);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: '获取学生缴费记录' })
  @ApiResponse({ status: 200, description: '获取学生缴费记录成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  findByStudent(@Param('studentId') studentId: string) {
    return this.tuitionService.findByStudent(studentId);
  }

  // ============ AC-01: Subsidy/Exemption Management ============

  @Post('payments/:id/subsidy')
  @ApiOperation({ summary: 'AC-01: 申请学费减免/资助' })
  @ApiResponse({
    status: 200,
    description: '减免/资助申请成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  applySubsidy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplySubsidyDto,
  ) {
    return this.tuitionService.applySubsidy(
      id,
      dto.subsidyType as unknown as SubsidyType,
      dto.subsidyAmount,
      dto.remark,
    );
  }

  @Get('payments/:id/subsidy-summary')
  @ApiOperation({ summary: 'AC-01: 获取资助汇总' })
  @ApiResponse({ status: 200, description: '资助汇总信息' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.PARENT,
  )
  getSubsidySummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.getSubsidySummary(id);
  }

  // ============ AC-02: Overdue Management ============

  @Post('payments/check-overdue')
  @ApiOperation({ summary: 'AC-02: 检查逾期缴费' })
  @ApiResponse({ status: 200, description: '逾期检查完成' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  checkOverduePayments() {
    return this.tuitionService.checkOverduePayments();
  }

  // ============ AC-03: Dispute Management ============

  @Post('payments/:id/dispute')
  @ApiOperation({ summary: 'AC-03: 发起缴费争议（家长申诉）' })
  @ApiResponse({ status: 201, description: '争议已提交' })
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  createDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDisputeDto,
    @Request() req: any,
  ) {
    return this.tuitionService.createDispute(id, dto.reason, req.user.id);
  }

  @Post('payments/:id/resolve-dispute')
  @ApiOperation({ summary: 'AC-03: 解决缴费争议' })
  @ApiResponse({ status: 200, description: '争议已解决' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req: any,
  ) {
    return this.tuitionService.resolveDispute(
      id,
      dto.resolution,
      dto.newAmount,
      req.user.id,
    );
  }

  // ============ AC-04: Reconciliation Report ============

  @Get('reports/reconciliation')
  @ApiOperation({ summary: 'AC-04: 学费对账报表（学期末）' })
  @ApiResponse({ status: 200, description: '对账报表数据' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  generateReconciliationReport(
    @Query('academicYear') academicYear: string,
  ) {
    if (!academicYear) {
      // Default to current academic year
      const now = new Date();
      const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
      academicYear = `${year}-${year + 1}`;
    }
    return this.tuitionService.generateReconciliationReport(academicYear);
  }
}
