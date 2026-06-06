import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  SendNotificationDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  NotificationQueryDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';

@ApiTags('多渠道通知服务')
@Controller('api/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  // ==================== 通知发送 ====================

  @Post()
  @ApiOperation({ summary: '发送通知' })
  @ApiResponse({ status: 201, description: '发送成功' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.SYSTEM_ADMIN,
  )
  async send(@Body() dto: SendNotificationDto, @Request() req) {
    const result = await this.notificationService.sendNotification(
      dto,
      req.user.id,
      req.user.schoolId,
    );
    await this.auditService.log(
      'notification_send' as any,
      req.user.id,
      `发送通知: ${result.notificationNo}`,
      req.ip,
      { recipientType: dto.recipientType, channel: dto.channel },
      HttpStatus.CREATED,
    );
    return result;
  }

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findAll(@Query() query: NotificationQueryDto, @Request() req) {
    return this.notificationService.findAllNotifications(query, req.user.schoolId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取通知统计' })
  @ApiResponse({ status: 200, description: '统计数据' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStatistics(@Request() req) {
    return this.notificationService.getStatistics(req.user.schoolId);
  }

  @Get('failed')
  @ApiOperation({ summary: '获取发送失败的记录' })
  @ApiResponse({ status: 200, description: '失败列表' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getFailedDeliveries() {
    return this.notificationService.getFailedDeliveries();
  }

  @Post(':id/retry')
  @ApiOperation({ summary: '重试发送失败的通知' })
  @ApiResponse({ status: 200, description: '重试成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async retryFailed(@Param('id') id: string, @Request() req) {
    await this.notificationService.retryFailed(id);
    await this.auditService.log(
      'notification_send' as any,
      req.user.id,
      `重试通知: ${id}`,
      req.ip,
      { id },
      HttpStatus.OK,
    );
    return { message: '重试任务已提交' };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({ status: 200, description: '通知详情' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findOne(@Param('id') id: string) {
    return this.notificationService.findOneNotification(id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: '获取送达记录' })
  @ApiResponse({ status: 200, description: '送达记录列表' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findDeliveries(
    @Param('id') id: string,
    @Query('status') status: string,
  ) {
    return this.notificationService.findDeliveries(id, status);
  }

  @Post(':id/mark-read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @Roles(
    UserRole.PARENT,
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.SCHOOL_STAFF,
  )
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  // ==================== 模板管理 ====================

  @Get('templates')
  @ApiOperation({ summary: '获取通知模板列表' })
  @ApiResponse({ status: 200, description: '模板列表' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getTemplates(@Query('category') category: string, @Request() req) {
    return this.notificationService.getTemplates(req.user.schoolId, category);
  }

  @Post('templates')
  @ApiOperation({ summary: '创建通知模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async createTemplate(@Body() dto: CreateTemplateDto, @Request() req) {
    const result = await this.notificationService.createTemplate(
      dto,
      req.user.schoolId,
      req.user.id,
    );
    await this.auditService.log(
      'notification_template_create' as any,
      req.user.id,
      `创建通知模板: ${result.name}`,
      req.ip,
      dto,
      HttpStatus.CREATED,
    );
    return result;
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '更新通知模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Request() req,
  ) {
    const result = await this.notificationService.updateTemplate(id, dto);
    await this.auditService.log(
      'notification_template_update' as any,
      req.user.id,
      `更新通知模板: ${result.name}`,
      req.ip,
      dto,
      HttpStatus.OK,
    );
    return result;
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '获取模板详情' })
  @ApiResponse({ status: 200, description: '模板详情' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getTemplate(@Param('id') id: string) {
    return this.notificationService.getTemplate(id);
  }
}
