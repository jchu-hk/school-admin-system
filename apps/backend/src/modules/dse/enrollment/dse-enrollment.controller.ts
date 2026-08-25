import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';
import { DseEnrollmentService } from './dse-enrollment.service';
import {
  CreateDseBatchDto,
  UpdateDseBatchDto,
  QueryDseBatchDto,
  SubmitBatchDto,
  CreateRegistrationDto,
  UpdateRegistrationDto,
  QueryRegistrationDto,
  WithdrawRegistrationDto,
  SubmitRegistrationDto,
} from './dto/dse-enrollment.dto';

// 批次管理角色：系统管理员/校长（副校长）/教务处（校务主任）
const BATCH_ADMIN_ROLES = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
];
// 报考录入/退选角色：教研组长（TEACHER）/校长/教务处/校务主任/学生（本人）
const REGISTRATION_ROLES = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
  UserRole.TEACHER,
  UserRole.STUDENT,
];

@ApiTags('DSE报考管理')
@Controller('exam/dse')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DseEnrollmentController {
  constructor(private readonly service: DseEnrollmentService) {}

  // ==================== 报考科目字典 ====================

  @Get('subjects')
  @ApiOperation({ summary: '获取 DSE 报考科目字典（Category A/B/C）' })
  @ApiResponse({ status: 200, description: '科目列表' })
  @Roles(...REGISTRATION_ROLES)
  listSubjects() {
    return this.service.listSubjects();
  }

  // ==================== 报考批次 ====================

  @Post('batches')
  @ApiOperation({ summary: '创建报考批次' })
  @ApiResponse({ status: 201, description: '批次已创建' })
  @Roles(...BATCH_ADMIN_ROLES)
  createBatch(@Body(ValidationPipe) dto: CreateDseBatchDto, @Req() req: any) {
    return this.service.createBatch(dto, req.user?.id);
  }

  @Get('batches')
  @ApiOperation({ summary: '查询报考批次列表' })
  @ApiResponse({ status: 200, description: '批次列表' })
  @Roles(...REGISTRATION_ROLES)
  findAllBatches(@Query(ValidationPipe) query: QueryDseBatchDto) {
    return this.service.findAllBatches(query);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: '获取批次详情' })
  @ApiResponse({ status: 200, description: '批次详情' })
  @ApiResponse({ status: 404, description: '批次不存在' })
  @Roles(...REGISTRATION_ROLES)
  findOneBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneBatch(id);
  }

  @Patch('batches/:id')
  @ApiOperation({ summary: '更新批次（仅 DRAFT 状态）' })
  @ApiResponse({ status: 200, description: '批次已更新' })
  @Roles(...BATCH_ADMIN_ROLES)
  updateBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateDseBatchDto,
    @Req() req: any,
  ) {
    return this.service.updateBatch(id, dto, req.user?.id);
  }

  @Post('batches/:id/open')
  @ApiOperation({ summary: '开放报名（DRAFT -> OPEN）' })
  @ApiResponse({ status: 200, description: '报考已开放' })
  @Roles(...BATCH_ADMIN_ROLES)
  openBatch(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.openBatch(id, req.user?.id);
  }

  @Post('batches/:id/close')
  @ApiOperation({ summary: '截止报名（OPEN -> CLOSED）' })
  @ApiResponse({ status: 200, description: '报考已截止' })
  @Roles(...BATCH_ADMIN_ROLES)
  closeBatch(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.closeBatch(id, req.user?.id);
  }

  @Post('batches/:id/submit')
  @ApiOperation({ summary: '提交 HKEAA（CLOSED -> SUBMITTED）' })
  @ApiResponse({ status: 200, description: '已提交 HKEAA' })
  @Roles(...BATCH_ADMIN_ROLES)
  submitBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: SubmitBatchDto,
    @Req() req: any,
  ) {
    return this.service.submitBatch(id, dto, req.user?.id);
  }

  @Post('batches/:id/confirm')
  @ApiOperation({ summary: '确认 HKEAA 结果（SUBMITTED -> CONFIRMED）' })
  @ApiResponse({ status: 200, description: 'HKEAA 已确认' })
  @Roles(...BATCH_ADMIN_ROLES)
  confirmBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: SubmitBatchDto,
    @Req() req: any,
  ) {
    return this.service.confirmBatch(id, dto, req.user?.id);
  }

  @Post('batches/:id/cancel')
  @ApiOperation({ summary: '取消批次（已提交/确认不可取消）' })
  @ApiResponse({ status: 200, description: '批次已取消' })
  @Roles(...BATCH_ADMIN_ROLES)
  cancelBatch(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.cancelBatch(id, req.user?.id);
  }

  // ==================== 报考记录 ====================

  @Post('registrations')
  @ApiOperation({ summary: '创建/申报报考记录' })
  @ApiResponse({ status: 201, description: '报考记录已创建' })
  @Roles(...REGISTRATION_ROLES)
  createRegistration(
    @Body(ValidationPipe) dto: CreateRegistrationDto,
    @Req() req: any,
  ) {
    return this.service.createRegistration(dto, req.user?.id);
  }

  @Get('registrations')
  @ApiOperation({ summary: '查询报考记录（按批次/学生/状态）' })
  @ApiResponse({ status: 200, description: '报考记录列表' })
  @Roles(...REGISTRATION_ROLES)
  findAllRegistrations(@Query(ValidationPipe) query: QueryRegistrationDto) {
    return this.service.findAllRegistrations(query);
  }

  @Get('registrations/:id')
  @ApiOperation({ summary: '报考详情' })
  @ApiResponse({ status: 200, description: '报考详情' })
  @ApiResponse({ status: 404, description: '报考记录不存在' })
  @Roles(...REGISTRATION_ROLES)
  findOneRegistration(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneRegistration(id);
  }

  @Put('registrations/:id')
  @ApiOperation({ summary: '修改报考（截止前）' })
  @ApiResponse({ status: 200, description: '报考已更新' })
  @Roles(...REGISTRATION_ROLES)
  updateRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateRegistrationDto,
    @Req() req: any,
  ) {
    return this.service.updateRegistration(id, dto, req.user?.id);
  }

  @Post('registrations/:id/submit')
  @ApiOperation({ summary: '提交本人报考' })
  @ApiResponse({ status: 200, description: '报考已提交' })
  @Roles(...REGISTRATION_ROLES)
  submitRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: SubmitRegistrationDto,
    @Req() req: any,
  ) {
    return this.service.submitRegistration(id, dto, req.user?.id);
  }

  @Post('registrations/:id/withdraw')
  @ApiOperation({ summary: '退选（截止后需医疗证明）' })
  @ApiResponse({ status: 200, description: '已退选' })
  @Roles(...REGISTRATION_ROLES)
  withdrawRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: WithdrawRegistrationDto,
    @Req() req: any,
  ) {
    return this.service.withdrawRegistration(id, dto, req.user?.id);
  }

  @Delete('registrations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消报考（DRAFT 可删）' })
  @ApiResponse({ status: 200, description: '报考已取消' })
  @Roles(...REGISTRATION_ROLES)
  cancelRegistration(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.cancelRegistration(id, req.user?.id);
  }

  @Post('registrations/:id/confirm')
  @ApiOperation({ summary: 'HKEAA 确认报考结果（SUBMITTED -> CONFIRMED）' })
  @ApiResponse({ status: 200, description: 'HKEAA 已确认报考结果' })
  @Roles(...BATCH_ADMIN_ROLES)
  hkeaaConfirmRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.service.hkeaaConfirmRegistration(id, req.user?.id);
  }
}
