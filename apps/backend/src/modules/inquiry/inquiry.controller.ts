import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
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
} from '@nestjs/swagger';
import { InquiryService } from './inquiry.service';
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  CreateReplyDto,
  SatisfactionDto,
  CreateTemplateDto,
  InquiryQueryDto,
} from './dto/inquiry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';

@ApiTags('家长查询管理')
@Controller('api/inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InquiryController {
  constructor(
    private readonly inquiryService: InquiryService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建家长查询' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.PARENT, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  async create(@Body() dto: CreateInquiryDto, @Request() req) {
    const result = await this.inquiryService.create(
      dto,
      req.user.id,
      req.user.schoolId,
    );
    await this.auditService.log(
      'inquiry_create' as any,
      req.user.id,
      `创建家长查询: ${result.inquiryNo}`,
      req.ip,
      dto,
      HttpStatus.CREATED,
    );
    return result;
  }

  @Get()
  @ApiOperation({ summary: '获取查询列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(@Query() query: InquiryQueryDto, @Request() req) {
    return this.inquiryService.findAll(query, req.user.id, req.user.role);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取查询统计' })
  @ApiResponse({ status: 200, description: '统计信息' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStatistics(@Request() req) {
    return this.inquiryService.getStatistics(req.user.schoolId);
  }

  @Get('sla-violations')
  @ApiOperation({ summary: '获取SLA超时查询' })
  @ApiResponse({ status: 200, description: '超时列表' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  checkSLAViolations(@Request() req) {
    return this.inquiryService.checkSLAViolations(req.user.schoolId);
  }

  @Get('templates')
  @ApiOperation({ summary: '获取快速回复模板' })
  @ApiResponse({ status: 200, description: '模板列表' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  getTemplates(@Query('category') category: string, @Request() req) {
    return this.inquiryService.getTemplates(req.user.schoolId, category);
  }

  @Post('templates')
  @ApiOperation({ summary: '创建快速回复模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async createTemplate(@Body() dto: CreateTemplateDto, @Request() req) {
    const result = await this.inquiryService.createTemplate(
      dto,
      req.user.schoolId,
      req.user.id,
    );
    await this.auditService.log(
      'inquiry_template_create' as any,
      req.user.id,
      `创建快速回复模板: ${result.title}`,
      req.ip,
      dto,
      HttpStatus.CREATED,
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: '获取查询详情' })
  @ApiResponse({ status: 200, description: '查询详情' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(@Param('id') id: string) {
    return this.inquiryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新查询' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryDto,
    @Request() req,
  ) {
    const result = await this.inquiryService.update(id, dto);
    await this.auditService.log(
      'inquiry_update' as any,
      req.user.id,
      `更新家长查询: ${result.inquiryNo}`,
      req.ip,
      { id, ...dto },
      HttpStatus.OK,
    );
    return result;
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: '分配查询' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async assign(
    @Param('id') id: string,
    @Body('assignedTo') assignedTo: string,
    @Request() req,
  ) {
    const result = await this.inquiryService.assign(id, assignedTo);
    await this.auditService.log(
      'inquiry_assign' as any,
      req.user.id,
      `分配查询 ${result.inquiryNo} 给 ${assignedTo}`,
      req.ip,
      { id, assignedTo },
      HttpStatus.OK,
    );
    return result;
  }

  @Post(':id/replies')
  @ApiOperation({ summary: '添加回复' })
  @ApiResponse({ status: 201, description: '回复成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.PARENT)
  async addReply(
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @Request() req,
  ) {
    const isParent = req.user.role === UserRole.PARENT;
    const result = await this.inquiryService.addReply(
      id,
      dto,
      req.user.id,
      isParent ? ('parent' as any) : ('officer' as any),
    );
    await this.auditService.log(
      'inquiry_reply' as any,
      req.user.id,
      `回复查询 ${id}`,
      req.ip,
      dto,
      HttpStatus.CREATED,
    );
    return result;
  }

  @Get(':id/replies')
  @ApiOperation({ summary: '获取回复列表' })
  @ApiResponse({ status: 200, description: '回复列表' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  getReplies(@Param('id') id: string) {
    return this.inquiryService.getReplies(id);
  }

  @Patch(':id/replies/:replyId/viewed')
  @ApiOperation({ summary: '标记回复已查看' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @Roles(UserRole.PARENT)
  markReplyViewed(@Param('id') id: string, @Param('replyId') replyId: string) {
    return this.inquiryService.markReplyViewed(replyId);
  }

  @Patch(':id/satisfaction')
  @ApiOperation({ summary: '提交满意度评价' })
  @ApiResponse({ status: 200, description: '提交成功' })
  @Roles(UserRole.PARENT)
  async submitSatisfaction(
    @Param('id') id: string,
    @Body() dto: SatisfactionDto,
    @Request() req,
  ) {
    const result = await this.inquiryService.submitSatisfaction(id, dto);
    await this.auditService.log(
      'inquiry_satisfaction' as any,
      req.user.id,
      `提交满意度评价: ${id}, 评分=${dto.rating}`,
      req.ip,
      dto,
      HttpStatus.OK,
    );
    return result;
  }

  @Patch(':id/close')
  @ApiOperation({ summary: '关闭查询' })
  @ApiResponse({ status: 200, description: '关闭成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async close(@Param('id') id: string, @Request() req) {
    const result = await this.inquiryService.update(id, {
      status: 'closed' as any,
    });
    await this.auditService.log(
      'inquiry_close' as any,
      req.user.id,
      `关闭查询 ${result.inquiryNo}`,
      req.ip,
      { id },
      HttpStatus.OK,
    );
    return result;
  }
}
