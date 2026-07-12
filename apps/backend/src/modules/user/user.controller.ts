import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Inject,
  forwardRef,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus, UserRole } from './user.entity';
import { UserLifecycleService } from './user-lifecycle.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    @Inject(forwardRef(() => UserLifecycleService))
    private readonly userLifecycleService: UserLifecycleService,
    private readonly userService: UserService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功', type: User })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    try {
      const user = await this.userService.create(createUserDto, req.user.id);
      await this.auditService.log(
        AuditAction.USER_CREATE,
        req.user.id,
        `创建用户: ${user.name} (${user.username})`,
        req.ip,
        createUserDto,
        HttpStatus.CREATED,
      );
      return user;
    } catch (error) {
      await this.auditService.log(
        AuditAction.USER_CREATE,
        req.user.id,
        `创建用户失败: ${error.message}`,
        req.ip,
        createUserDto,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认10' })
  @ApiQuery({ name: 'role', required: false, description: '用户角色筛选' })
  @ApiQuery({ name: 'status', required: false, description: '用户状态筛选' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词(用户名/姓名)' })
  @ApiResponse({ status: 200, description: '获取用户列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('className') className?: string,
  ) {
    const effectiveLimit = parseInt(limit || pageSize || '10');
    return this.userService.findAll(
      parseInt(page || '1'),
      effectiveLimit,
      role,
      status,
      keyword,
      className,
      req.user,
    );
  }

  @Get('profile/me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取用户信息成功', type: User })
  getProfile(@Request() req) {
    return this.userService.findOne(req.user.id, req.user);
  }

  @Get('expiry-stats')
  @ApiOperation({ summary: '获取账户过期统计信息' })
  @ApiResponse({ status: 200, description: '获取统计信息成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async getExpiryStatistics() {
    return this.userLifecycleService.getExpiryStatistics();
  }

  @Get('classes')
  @ApiOperation({ summary: '获取所有班级名称列表（去重）' })
  @ApiResponse({ status: 200, description: '获取班级列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  async getClasses() {
    const classes = await this.userService.getClasses();
    return { data: classes };
  }

  @Get('students')
  @ApiOperation({ summary: '获取学生列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认10' })
  @ApiQuery({ name: 'status', required: false, description: '用户状态筛选' })
  @ApiQuery({ name: 'className', required: false, description: '班级名称筛选' })
  @ApiResponse({ status: 200, description: '获取学生列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  getStudents(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('className') className?: string,
  ) {
    const effectiveLimit = parseInt(limit || pageSize || '10');
    return this.userService.findAll(
      parseInt(page || '1'),
      effectiveLimit,
      UserRole.STUDENT,
      status,
      keyword,
      className,
      req.user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '获取用户详情成功', type: User })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findOne(@Param('id') id: string, @Request() req) {
    return this.userService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '更新用户成功', type: User })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    try {
      const user = await this.userService.update(
        id,
        updateUserDto,
        req.user.id,
      );
      await this.auditService.log(
        AuditAction.USER_UPDATE,
        req.user.id,
        `更新用户信息: ${user.name} (${user.username})`,
        req.ip,
        { id, ...updateUserDto },
        HttpStatus.OK,
      );
      return user;
    } catch (error) {
      await this.auditService.log(
        AuditAction.USER_UPDATE,
        req.user.id,
        `更新用户信息失败: ${error.message}`,
        req.ip,
        { id, ...updateUserDto },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Post(':id/handle-departure')
  @ApiOperation({ summary: '处理员工离职' })
  @ApiResponse({ status: 200, description: '离职处理成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async handleDeparture(
    @Param('id') id: string,
    @Body('departureDate') departureDate: string,
    @Request() req,
    @Body('reason') reason?: string,
  ) {
    const user = await this.userLifecycleService.handleStaffDeparture(
      id,
      new Date(departureDate),
      reason,
    );
    await this.auditService.log(
      AuditAction.USER_DEPARTURE,
      req.user.id,
      `处理员工离职: ${user.name} (${user.username})`,
      req.ip,
      { id, departureDate, reason },
      HttpStatus.OK,
    );
    return user;
  }

  @Post(':id/handle-graduation')
  @ApiOperation({ summary: '处理学生毕业' })
  @ApiResponse({ status: 200, description: '毕业处理成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async handleGraduation(
    @Param('id') id: string,
    @Body('graduationDate') graduationDate: string,
    @Request() req,
  ) {
    const user = await this.userLifecycleService.handleStudentGraduation(
      id,
      new Date(graduationDate),
    );
    await this.auditService.log(
      AuditAction.USER_GRADUATION,
      req.user.id,
      `处理学生毕业: ${user.name} (${user.username})`,
      req.ip,
      { id, graduationDate },
      HttpStatus.OK,
    );
    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户（软删除）' })
  @ApiResponse({ status: 204, description: '删除用户成功' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async remove(@Param('id') id: string, @Request() req) {
    try {
      await this.userService.remove(id, req.user.id);
      await this.auditService.log(
        AuditAction.USER_DELETE,
        req.user.id,
        `删除用户: ID ${id}`,
        req.ip,
        { id },
        HttpStatus.NO_CONTENT,
      );
    } catch (error) {
      await this.auditService.log(
        AuditAction.USER_DELETE,
        req.user.id,
        `删除用户失败: ${error.message}`,
        req.ip,
        { id },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: '恢复已删除用户' })
  @ApiResponse({ status: 200, description: '用户恢复成功', type: User })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async restore(@Param('id') id: string, @Request() req) {
    try {
      const user = await this.userService.restore(id, req.user.id);
      await this.auditService.log(
        AuditAction.USER_RESTORE,
        req.user.id,
        `恢复用户: ${user.name} (${user.username})`,
        req.ip,
        { id },
        HttpStatus.OK,
      );
      return user;
    } catch (error) {
      await this.auditService.log(
        AuditAction.USER_RESTORE,
        req.user.id,
        `恢复用户失败: ${error.message}`,
        req.ip,
        { id },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: '启用/禁用用户' })
  @ApiResponse({ status: 200, description: '状态更新成功', type: User })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async toggleStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @Request() req,
  ) {
    try {
      const user = await this.userService.toggleStatus(id, status, req.user.id);
      await this.auditService.log(
        AuditAction.USER_STATUS_CHANGE,
        req.user.id,
        `修改用户状态: ${user.name} (${user.username}) -> ${status}`,
        req.ip,
        { id, status },
        HttpStatus.OK,
      );
      return user;
    } catch (error) {
      await this.auditService.log(
        AuditAction.USER_STATUS_CHANGE,
        req.user.id,
        `修改用户状态失败: ${error.message}`,
        req.ip,
        { id, status },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  @ApiResponse({ status: 200, description: '密码重置成功', type: User })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
    @Request() req,
  ) {
    try {
      const user = await this.userService.resetPassword(
        id,
        password,
        req.user.id,
      );
      await this.auditService.log(
        AuditAction.USER_PASSWORD_RESET,
        req.user.id,
        `重置用户密码: ${user.name} (${user.username})`,
        req.ip,
        { id },
        HttpStatus.OK,
      );
      return user;
    } catch (error) {
      await this.auditService.log(
        AuditAction.USER_PASSWORD_RESET,
        req.user.id,
        `重置用户密码失败: ${error.message}`,
        req.ip,
        { id },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
      throw error;
    }
  }

  @Post(':id/role')
  @ApiOperation({ summary: '变更用户角色' })
  @ApiResponse({ status: 200, description: '角色变更成功', type: User })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Request() req,
  ) {
    const user = await this.userService.update(
      id,
      { role } as UpdateUserDto,
      req.user.id,
    );
    await this.auditService.log(
      AuditAction.PERMISSION_CHANGE,
      req.user.id,
      `变更用户角色: ${user.name} (${user.username}) -> ${role}`,
      req.ip,
      { id, role },
      HttpStatus.OK,
    );
    return user;
  }
}
