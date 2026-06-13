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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SystemConfig, SystemLog, SystemUser } from './settings.entity';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemLogQueryDto,
  CreateSystemUserDto,
  UpdateSystemUserDto,
  SystemUserQueryDto,
} from './dto/settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('系统设置')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===== System Config Endpoints =====

  @Get('configs')
  @ApiOperation({ summary: '获取系统配置列表' })
  @ApiResponse({ status: 200, description: '获取配置列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findAllConfigs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
  ) {
    return this.settingsService.findAllConfigs({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 50,
      category,
    });
  }

  @Get('configs/:id')
  @ApiOperation({ summary: '获取配置详情' })
  @ApiResponse({
    status: 200,
    description: '获取配置详情成功',
    type: SystemConfig,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findConfigById(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.findConfigById(id);
  }

  @Post('configs')
  @ApiOperation({ summary: '创建系统配置' })
  @ApiResponse({ status: 201, description: '配置创建成功', type: SystemConfig })
  @Roles(UserRole.SYSTEM_ADMIN)
  createConfig(@Body() createDto: CreateSystemConfigDto) {
    return this.settingsService.createConfig(createDto);
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: '更新系统配置' })
  @ApiResponse({ status: 200, description: '配置更新成功', type: SystemConfig })
  @Roles(UserRole.SYSTEM_ADMIN)
  updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSystemConfigDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateConfig(id, updateDto, req.user?.id);
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除系统配置' })
  @ApiResponse({ status: 204, description: '配置删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN)
  deleteConfig(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.deleteConfig(id);
  }

  // ===== System Log Endpoints =====

  @Get('logs')
  @ApiOperation({ summary: '获取系统日志' })
  @ApiResponse({ status: 200, description: '获取日志成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findAllLogs(@Query() query: SystemLogQueryDto) {
    return this.settingsService.findAllLogs(query);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: '获取日志详情' })
  @ApiResponse({
    status: 200,
    description: '获取日志详情成功',
    type: SystemLog,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findLogById(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.findLogById(id);
  }

  @Post('logs')
  @ApiOperation({ summary: '记录系统日志' })
  @ApiResponse({ status: 201, description: '日志记录成功' })
  createLog(@Body() createDto: any) {
    return this.settingsService.createLog(createDto);
  }

  @Delete('logs/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '清理旧日志' })
  @ApiResponse({ status: 200, description: '日志清理成功' })
  @Roles(UserRole.SYSTEM_ADMIN)
  clearOldLogs(@Body('daysOld') daysOld: number = 90) {
    return this.settingsService.clearOldLogs(daysOld);
  }

  // ===== System User Endpoints =====

  @Get('users')
  @ApiOperation({ summary: '获取系统用户列表' })
  @ApiResponse({ status: 200, description: '获取用户列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findAllUsers(@Query() query: SystemUserQueryDto) {
    return this.settingsService.findAllUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({
    status: 200,
    description: '获取用户详情成功',
    type: SystemUser,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.findUserById(id);
  }

  @Post('users')
  @ApiOperation({ summary: '创建系统用户' })
  @ApiResponse({ status: 201, description: '用户创建成功', type: SystemUser })
  @Roles(UserRole.SYSTEM_ADMIN)
  createUser(@Body() createDto: CreateSystemUserDto) {
    return this.settingsService.createUser(createDto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '更新系统用户' })
  @ApiResponse({ status: 200, description: '用户更新成功', type: SystemUser })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSystemUserDto,
  ) {
    return this.settingsService.updateUser(id, updateDto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '更新用户状态' })
  @ApiResponse({ status: 200, description: '状态更新成功', type: SystemUser })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'active' | 'inactive',
  ) {
    return this.settingsService.updateUserStatus(id, status);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除系统用户' })
  @ApiResponse({ status: 204, description: '用户删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN)
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.deleteUser(id);
  }
}
