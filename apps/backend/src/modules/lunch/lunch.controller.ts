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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LunchService } from './lunch.service';
import { LunchOrder, LunchOrderStatus } from './lunch.entity';
import { CreateLunchOrderDto, UpdateLunchOrderDto, LunchOrderQueryDto } from './dto/lunch.dto';
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
  findAll(@Query() query: LunchOrderQueryDto): Promise<{ orders: LunchOrder[]; total: number }> {
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
}
