import {
  Controller,
  Get,
  Post,
  Patch,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { SspaBatchService } from './sspa-batch.service';
import { SspaApplicationService } from './sspa-application.service';
import {
  CreateSspaBatchDto,
  UpdateSspaBatchDto,
  SspaBatchQueryDto,
} from './dto/sspa-batch.dto';
import {
  CreateSspaApplicationDto,
  UpdateSspaApplicationDto,
  SspaApplicationQueryDto,
} from './dto/sspa-application.dto';
import {
  UpsertSspaScoresDto,
  ConfirmOfferDto,
  AnnounceResultDto,
  RegisterSspaApplicationDto,
} from './dto/sspa-score.dto';

/** 可操作 SSPA 申请/评分/公布的角色：校务主任 + 收生主任（教务管理档） */
const SSPA_MANAGER_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
];

/** 可公布结果/确认/注册的角色：校务主任级 */
const SSPA_DIRECTOR_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
];

/**
 * SSPA 中一自行分配学位（F-ADM-001）
 * 学生入学收生（admissions）域，独立于教师招聘（recruitment）。
 * @see SPEC-SYSTEM-DESIGN §19.5 / API-DESIGN §10.4
 */
@ApiTags('收生管理 - SSPA 中一自行分配学位')
@ApiBearerAuth()
@Controller('sspa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SspaController {
  constructor(
    private readonly batchService: SspaBatchService,
    private readonly applicationService: SspaApplicationService,
  ) {}

  // ============================================================
  // 批次
  // ============================================================

  @Post('batches')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '创建 SSPA 批次' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createBatch(
    @Body() dto: CreateSspaBatchDto,
    @CurrentUser() user: any,
  ) {
    const batch = await this.batchService.create(dto, user?.id);
    return { success: true, data: batch, message: '创建成功' };
  }

  @Get('batches')
  @ApiOperation({ summary: '批次列表' })
  async listBatches(@Query() query: SspaBatchQueryDto) {
    const data = await this.batchService.findAll(query);
    return { success: true, data, message: '获取成功' };
  }

  @Get('batches/:id')
  @ApiOperation({ summary: '批次详情' })
  async getBatch(@Param('id', ParseUUIDPipe) id: string) {
    const batch = await this.batchService.findOne(id);
    return { success: true, data: batch, message: '获取成功' };
  }

  @Patch('batches/:id')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '更新批次/权重' })
  async updateBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSspaBatchDto,
    @CurrentUser() user: any,
  ) {
    const batch = await this.batchService.update(id, dto, user?.id);
    return { success: true, data: batch, message: '更新成功' };
  }

  @Post('batches/:id/open')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '开放批次接受申请' })
  async openBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const batch = await this.batchService.open(id, user?.id);
    return { success: true, data: batch, message: '批次已开放申请' };
  }

  // ============================================================
  // 申请
  // ============================================================

  @Post('applications')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '录入 SSPA 申请（含截止校验）' })
  @HttpCode(HttpStatus.CREATED)
  async createApplication(
    @Body() dto: CreateSspaApplicationDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.applicationService.create(dto, user?.id);
    return { success: true, data: app, message: '申请录入成功' };
  }

  @Get('applications')
  @ApiOperation({ summary: '申请列表' })
  async listApplications(@Query() query: SspaApplicationQueryDto) {
    const data = await this.applicationService.findAll(query);
    return { success: true, data, message: '获取成功' };
  }

  @Get('applications/:id')
  @ApiOperation({ summary: '申请详情（含评分）' })
  async getApplication(@Param('id', ParseUUIDPipe) id: string) {
    const app = await this.applicationService.findOne(id);
    return { success: true, data: app, message: '获取成功' };
  }

  @Patch('applications/:id')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '更新申请' })
  async updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSspaApplicationDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.applicationService.update(id, dto, user?.id);
    return { success: true, data: app, message: '更新成功' };
  }

  @Post('applications/:id/scores')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '录入/更新分项评分' })
  @HttpCode(HttpStatus.OK)
  async upsertScores(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertSspaScoresDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.applicationService.upsertScores(
      id,
      dto,
      dto.scoredById ?? user?.id,
    );
    return { success: true, data, message: '评分已录入' };
  }

  @Get('applications/:id/total-score')
  @ApiOperation({ summary: '计算总分排序' })
  async totalScore(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.applicationService.getTotalScore(id);
    return { success: true, data, message: '获取成功' };
  }

  // ============================================================
  // 公布 / 确认 / 注册
  // ============================================================

  @Post('batches/:id/announce')
  @Roles(...SSPA_DIRECTOR_ROLES)
  @ApiOperation({ summary: '公布正取/备取结果' })
  @HttpCode(HttpStatus.OK)
  async announce(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnnounceResultDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.applicationService.announce(
      id,
      dto.accepted,
      dto.waitlist,
      user?.id,
    );
    return { success: true, data: result, message: '结果已公布' };
  }

  @Post('applications/:id/confirm-offer')
  @Roles(...SSPA_DIRECTOR_ROLES)
  @ApiOperation({ summary: '正取学生确认学位' })
  @HttpCode(HttpStatus.OK)
  async confirmOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmOfferDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.applicationService.confirmOffer(
      id,
      dto.confirmedById ?? user?.id,
    );
    return { success: true, data: app, message: '学位已确认' };
  }

  @Post('applications/:id/register')
  @Roles(...SSPA_DIRECTOR_ROLES)
  @ApiOperation({ summary: '确认后进入新生注册' })
  @HttpCode(HttpStatus.OK)
  async register(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterSspaApplicationDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.applicationService.register(
      id,
      dto.applicationId,
      dto.registeredById ?? user?.id,
    );
    return { success: true, data: app, message: '已进入新生注册流' };
  }

  @Post('applications/:id/withdraw')
  @Roles(...SSPA_MANAGER_ROLES)
  @ApiOperation({ summary: '撤回申请' })
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const app = await this.applicationService.withdraw(id, user?.id);
    return { success: true, data: app, message: '申请已撤回' };
  }
}
