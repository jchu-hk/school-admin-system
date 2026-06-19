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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LunchService } from './lunch.service';
import { LunchOrder } from './lunch.entity';
import { LunchChange } from './lunch-change.entity';
import { LunchMenu } from './lunch-menu.entity';
import {
  CreateLunchOrderDto,
  UpdateLunchOrderDto,
  LunchOrderQueryDto,
} from './dto/lunch.dto';
import {
  CreateLunchChangeDto,
  LunchChangeQueryDto,
  ApproveLunchChangeDto,
  RejectLunchChangeDto,
  CreateLunchMenuDto,
  UpdateLunchMenuDto,
  LunchMenuQueryDto,
  SupplierReportQueryDto,
  PredictionQueryDto,
} from './dto/lunch-change.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('午膳管理')
@Controller('lunch')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LunchController {
  constructor(private readonly lunchService: LunchService) {}

  // ==================== 订单端点（保留原有） ====================

  @Post()
  @ApiOperation({ summary: '创建午膳订单' })
  @ApiResponse({ status: 201, description: '订单创建成功', type: LunchOrder })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  create(@Body() createDto: CreateLunchOrderDto): Promise<LunchOrder> {
    return this.lunchService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取午膳订单列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(
    @Query() query: LunchOrderQueryDto,
  ): Promise<{ orders: LunchOrder[]; total: number }> {
    return this.lunchService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取午膳统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.lunchService.getStats(startDate, endDate);
  }

  @Get('settlement')
  @ApiOperation({ summary: '获取结算金额' })
  @ApiResponse({ status: 200, description: '获取结算成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getSettlement(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.lunchService.getSettlement(startDate, endDate);
  }

  @Get('cutoff-status')
  @ApiOperation({ summary: '获取当日截止状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  getCutoffStatus() {
    return this.lunchService.getCutoffStatus();
  }

  @Get('supplier-report')
  @ApiOperation({ summary: '获取供应商报表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getSupplierReport(@Query() query: SupplierReportQueryDto) {
    return this.lunchService.getSupplierReport(query);
  }

  @Get('prediction')
  @ApiOperation({ summary: '获取预订预测' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getPrediction(@Query() query: PredictionQueryDto) {
    return this.lunchService.getPrediction(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取午膳订单详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: LunchOrder })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LunchOrder> {
    return this.lunchService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新午膳订单' })
  @ApiResponse({ status: 200, description: '更新成功', type: LunchOrder })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLunchOrderDto,
    @Request() req,
  ): Promise<LunchOrder> {
    return this.lunchService.update(id, updateDto, req.user.id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认午膳订单' })
  @ApiResponse({ status: 200, description: '确认成功', type: LunchOrder })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<LunchOrder> {
    return this.lunchService.confirm(id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消午膳订单' })
  @ApiResponse({ status: 200, description: '取消成功', type: LunchOrder })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<LunchOrder> {
    return this.lunchService.cancel(id, req.user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '标记午膳订单完成' })
  @ApiResponse({ status: 200, description: '完成成功', type: LunchOrder })
  @Roles(UserRole.SCHOOL_STAFF)
  complete(@Param('id', ParseUUIDPipe) id: string): Promise<LunchOrder> {
    return this.lunchService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除午膳订单' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.lunchService.remove(id);
  }

  // ==================== 变更端点 ====================

  @Post('changes')
  @ApiOperation({ summary: '提交午膳变更申请' })
  @ApiResponse({ status: 201, description: '变更申请提交成功', type: LunchChange })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  createChange(@Body() createDto: CreateLunchChangeDto): Promise<LunchChange> {
    return this.lunchService.createChange(createDto);
  }

  @Get('changes')
  @ApiOperation({ summary: '获取变更申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllChanges(
    @Query() query: LunchChangeQueryDto,
  ): Promise<{ changes: LunchChange[]; total: number }> {
    return this.lunchService.findAllChanges(query);
  }

  @Get('changes/:id')
  @ApiOperation({ summary: '获取变更申请详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: LunchChange })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneChange(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LunchChange> {
    return this.lunchService.findOneChange(id);
  }

  @Post('changes/:id/approve')
  @ApiOperation({ summary: '批准变更申请' })
  @ApiResponse({ status: 200, description: '批准成功', type: LunchChange })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  approveChange(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLunchChangeDto,
    @Request() req,
  ): Promise<LunchChange> {
    return this.lunchService.approveChange(id, req.user.id, dto);
  }

  @Post('changes/:id/reject')
  @ApiOperation({ summary: '拒绝变更申请' })
  @ApiResponse({ status: 200, description: '拒绝成功', type: LunchChange })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  rejectChange(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLunchChangeDto,
    @Request() req,
  ): Promise<LunchChange> {
    return this.lunchService.rejectChange(id, req.user.id, dto);
  }

  // ==================== 菜单端点 ====================

  @Get('menu/items')
  @ApiOperation({ summary: '获取菜单列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAllMenus(
    @Query() query: LunchMenuQueryDto,
  ): Promise<{ menus: LunchMenu[]; total: number }> {
    return this.lunchService.findAllMenus(query);
  }

  @Post('menu/items')
  @ApiOperation({ summary: '创建菜单项' })
  @ApiResponse({ status: 201, description: '创建成功', type: LunchMenu })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  createMenu(@Body() createDto: CreateLunchMenuDto): Promise<LunchMenu> {
    return this.lunchService.createMenu(createDto);
  }

  @Get('menu/items/:id')
  @ApiOperation({ summary: '获取菜单项详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: LunchMenu })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOneMenu(@Param('id', ParseUUIDPipe) id: string): Promise<LunchMenu> {
    return this.lunchService.findOneMenu(id);
  }

  @Put('menu/items/:id')
  @ApiOperation({ summary: '更新菜单项' })
  @ApiResponse({ status: 200, description: '更新成功', type: LunchMenu })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  updateMenu(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLunchMenuDto,
    @Request() req,
  ): Promise<LunchMenu> {
    return this.lunchService.updateMenu(id, updateDto, req.user.id);
  }

  @Delete('menu/items/:id')
  @ApiOperation({ summary: '删除菜单项' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  removeMenu(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.lunchService.removeMenu(id);
  }
}
