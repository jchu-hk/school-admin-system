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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { JupasService } from './jupas.service';
import {
  CreateJupasApplicationDto,
  UpdateJupasApplicationDto,
  JupasApplicationQueryDto,
  UpsertChoicesDto,
  CreateJupasLetterDto,
  UpdateJupasLetterDto,
  AiAssistLetterDto,
  SubmitLetterDto,
  CreateJupasAppealDto,
  ReviewJupasAppealDto,
} from './dto/jupas.dto';

/** 可管理 JUPAS 的收生/教务角色 */
const JUPAS_MANAGER_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
];

/** 可撰写推荐信的角色（教师/校长/校务） */
const JUPAS_LETTER_WRITER_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
  UserRole.TEACHER,
];

/**
 * JUPAS 联招管理（F-ADM-002）
 * 学生入学收生（admissions）域，与 SSPA（F-ADM-001）同域，独立于教师招聘（recruitment）。
 * @see SPEC-SYSTEM-DESIGN §19.6 / §10.4 / API-DESIGN §10.5 / DB-SCHEMA §19
 */
@ApiTags('收生管理 - JUPAS 大学联招管理')
@ApiBearerAuth()
@Controller('jupas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JupasController {
  constructor(private readonly jupasService: JupasService) {}

  // ============================================================
  // 申请
  // ============================================================

  @Post('applications')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '创建 JUPAS 申请记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @HttpCode(HttpStatus.CREATED)
  async createApplication(
    @Body() dto: CreateJupasApplicationDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.jupasService.create(dto, user?.id);
    return { success: true, data: app, message: '创建成功' };
  }

  @Get('applications')
  @ApiOperation({ summary: 'JUPAS 申请列表' })
  async listApplications(@Query() query: JupasApplicationQueryDto) {
    const data = await this.jupasService.findAll(query);
    return { success: true, data, message: '获取成功' };
  }

  @Get('applications/:id')
  @ApiOperation({ summary: '申请详情（含志愿/推荐信/上诉）' })
  async getApplication(@Param('id', ParseUUIDPipe) id: string) {
    const app = await this.jupasService.findOne(id);
    return { success: true, data: app, message: '获取成功' };
  }

  @Patch('applications/:id')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '更新申请' })
  async updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJupasApplicationDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.jupasService.update(id, dto, user?.id);
    return { success: true, data: app, message: '更新成功' };
  }

  // ============================================================
  // 志愿
  // ============================================================

  @Post('applications/:id/choices')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '增/改志愿选择（优先级唯一，重复覆盖）' })
  @HttpCode(HttpStatus.OK)
  async upsertChoices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertChoicesDto,
    @CurrentUser() user: any,
  ) {
    const app = await this.jupasService.upsertChoices(id, dto.choices, user?.id);
    return { success: true, data: app, message: '志愿已更新' };
  }

  @Delete('applications/:id/choices/:choiceId')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '删除志愿' })
  @HttpCode(HttpStatus.OK)
  async deleteChoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('choiceId', ParseUUIDPipe) choiceId: string,
    @CurrentUser() user: any,
  ) {
    await this.jupasService.deleteChoice(id, choiceId, user?.id);
    return { success: true, message: '志愿已删除' };
  }

  @Post('applications/:id/submit')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '提交学校推荐（更新 edu 状态，含截止校验）' })
  @HttpCode(HttpStatus.OK)
  async submitApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const app = await this.jupasService.submitApplication(id, user?.id);
    return { success: true, data: app, message: '学校推荐已提交' };
  }

  // ============================================================
  // 推荐信
  // ============================================================

  @Get('applications/:id/letters')
  @ApiOperation({ summary: '推荐信列表' })
  async listLetters(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.jupasService.listLetters(id);
    return { success: true, data, message: '获取成功' };
  }

  @Post('letters')
  @Roles(...JUPAS_LETTER_WRITER_ROLES)
  @ApiOperation({ summary: '创建推荐信（含 AI 辅助）' })
  @HttpCode(HttpStatus.CREATED)
  async createLetter(
    @Body() dto: CreateJupasLetterDto,
    @CurrentUser() user: any,
  ) {
    const letter = await this.jupasService.createLetter(dto, user?.id);
    return { success: true, data: letter, message: '推荐信已创建' };
  }

  @Patch('letters/:id')
  @Roles(...JUPAS_LETTER_WRITER_ROLES)
  @ApiOperation({ summary: '更新推荐信正文/状态流转' })
  async updateLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJupasLetterDto,
    @CurrentUser() user: any,
  ) {
    const letter = await this.jupasService.updateLetter(id, dto, user?.id);
    return { success: true, data: letter, message: '推荐信已更新' };
  }

  @Post('letters/:id/ai-assist')
  @Roles(...JUPAS_LETTER_WRITER_ROLES)
  @ApiOperation({ summary: '触发 AI 写作大纲/字数统计' })
  @HttpCode(HttpStatus.OK)
  async aiAssist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AiAssistLetterDto,
  ) {
    const data = await this.jupasService.aiAssist(id, dto.content);
    return { success: true, data, message: 'AI 辅助生成完成' };
  }

  @Post('letters/:id/submit')
  @Roles(...JUPAS_LETTER_WRITER_ROLES)
  @ApiOperation({ summary: '提交推荐信' })
  @HttpCode(HttpStatus.OK)
  async submitLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitLetterDto,
    @CurrentUser() user: any,
  ) {
    const letter = await this.jupasService.submitLetter(id, dto.submittedById ?? user?.id);
    return { success: true, data: letter, message: '推荐信已提交' };
  }

  @Get('letters/:id/stats')
  @ApiOperation({ summary: '字数统计/术语一致性' })
  async letterStats(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.jupasService.letterStats(id);
    return { success: true, data, message: '获取成功' };
  }

  // ============================================================
  // 上诉
  // ============================================================

  @Post('applications/:id/appeals')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '提交上诉' })
  @HttpCode(HttpStatus.CREATED)
  async createAppeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateJupasAppealDto,
    @CurrentUser() user: any,
  ) {
    const appeal = await this.jupasService.createAppeal(id, dto, user?.id);
    return { success: true, data: appeal, message: '上诉已提交' };
  }

  @Get('applications/:id/appeals')
  @ApiOperation({ summary: '上诉列表' })
  async listAppeals(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.jupasService.listAppeals(id);
    return { success: true, data, message: '获取成功' };
  }

  @Post('appeals/:id/review')
  @Roles(...JUPAS_MANAGER_ROLES)
  @ApiOperation({ summary: '复核处理上诉' })
  @HttpCode(HttpStatus.OK)
  async reviewAppeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewJupasAppealDto,
    @CurrentUser() user: any,
  ) {
    const appeal = await this.jupasService.reviewAppeal(id, dto, dto.reviewedBy ?? user?.id);
    return { success: true, data: appeal, message: '上诉已复核' };
  }
}
