import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Notification, NotificationRecipient } from './notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';
import { CreateNotificationTemplateDto } from './dto/notification-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('通知管理')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认10' })
  @ApiQuery({ name: 'type', required: false, description: '通知类型筛选' })
  @ApiQuery({ name: 'senderId', required: false, description: '发送人ID筛选' })
  @ApiResponse({ status: 200, description: '获取通知列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('senderId') senderId?: string,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.notificationService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      type as any,
      senderId,
    );
  }

  @Post()
  @ApiOperation({ summary: '发送通知' })
  @ApiResponse({ status: 201, description: '通知发送成功', type: Notification })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  create(
    @Body() createDto: CreateNotificationDto,
    @Request() req,
  ): Promise<Notification> {
    // If senderId not provided, use current user
    if (!createDto.senderId) {
      createDto.senderId = req.user.id;
    }
    return this.notificationService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({ status: 200, description: '获取通知详情成功', type: Notification })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: '获取通知接收人列表' })
  @ApiResponse({ status: 200, description: '获取接收人列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findRecipients(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationRecipient[]> {
    return this.notificationService.findRecipients(id);
  }
}

@ApiTags('通知模板管理')
@Controller('notification-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationTemplateController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取通知模板列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认10' })
  @ApiResponse({ status: 200, description: '获取模板列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): { templates: any[]; total: number } {
    return this.notificationService.findAllTemplates(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post()
  @ApiOperation({ summary: '创建通知模板' })
  @ApiResponse({ status: 201, description: '模板创建成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  create(@Body() createDto: CreateNotificationTemplateDto): any {
    return this.notificationService.createTemplate(createDto);
  }
}
