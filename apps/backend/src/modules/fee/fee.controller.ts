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
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { FeeService } from './fee.service';
import { FeeType } from './fee-type.entity';
import { FeeRecord } from './fee-record.entity';
import { FeeItem, FeeCollection, FeeReduction } from './fee.entity';
import {
  CreateFeeTypeDto,
  UpdateFeeTypeDto,
  FeeTypeQueryDto,
  CreateFeeRecordDto,
  UpdateFeeRecordDto,
  FeeRecordQueryDto,
  CreateFeeItemDto,
  UpdateFeeItemDto,
  FeeItemQueryDto,
  CreateFeeCollectionDto,
  UpdateFeeCollectionDto,
  RecordPaymentDto,
  FeeCollectionQueryDto,
  CreateFeeReductionDto,
  ApproveReductionDto,
  FeeReductionQueryDto,
} from './dto/fee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('费用管理')
@Controller('fee')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // ============ Fee Types ============

  @Post('types')
  @ApiOperation({ summary: '创建费用类型' })
  @ApiResponse({ status: 201, description: '费用类型创建成功', type: FeeType })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createFeeType(@Body() createDto: CreateFeeTypeDto) {
    return this.feeService.createFeeType(createDto);
  }

  @Get('types')
  @ApiOperation({ summary: '获取费用类型列表' })
  @ApiResponse({ status: 200, description: '获取费用类型列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllFeeTypes(@Query() query: FeeTypeQueryDto) {
    return this.feeService.findAllFeeTypes(query);
  }

  @Get('types/:id')
  @ApiOperation({ summary: '获取费用类型详情' })
  @ApiResponse({
    status: 200,
    description: '获取费用类型详情成功',
    type: FeeType,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneFeeType(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findOneFeeType(id);
  }

  @Put('types/:id')
  @ApiOperation({ summary: '更新费用类型' })
  @ApiResponse({ status: 200, description: '费用类型更新成功', type: FeeType })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateFeeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFeeTypeDto,
  ) {
    return this.feeService.updateFeeType(id, updateDto);
  }

  @Delete('types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除费用类型' })
  @ApiResponse({ status: 204, description: '费用类型删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeFeeType(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.removeFeeType(id);
  }

  // ============ Fee Records ============

  @Post('records')
  @ApiOperation({ summary: '创建费用记录' })
  @ApiResponse({
    status: 201,
    description: '费用记录创建成功',
    type: FeeRecord,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createFeeRecord(@Body() createDto: CreateFeeRecordDto) {
    return this.feeService.createFeeRecord(createDto);
  }

  @Get('records')
  @ApiOperation({ summary: '获取费用记录列表' })
  @ApiResponse({ status: 200, description: '获取费用记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllFeeRecords(@Query() query: FeeRecordQueryDto) {
    return this.feeService.findAllFeeRecords(query);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取费用记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取费用记录详情成功',
    type: FeeRecord,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneFeeRecord(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findOneFeeRecord(id);
  }

  @Put('records/:id')
  @ApiOperation({ summary: '更新费用记录' })
  @ApiResponse({
    status: 200,
    description: '费用记录更新成功',
    type: FeeRecord,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateFeeRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFeeRecordDto,
  ) {
    return this.feeService.updateFeeRecord(id, updateDto);
  }

  @Delete('records/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除费用记录' })
  @ApiResponse({ status: 204, description: '费用记录删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeFeeRecord(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.removeFeeRecord(id);
  }

  // ============ Fee Items ============

  @Post('items')
  @ApiOperation({ summary: '创建费用项目' })
  @ApiResponse({ status: 201, description: '费用项目创建成功', type: FeeItem })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createFeeItem(@Body() createDto: CreateFeeItemDto) {
    return this.feeService.createFeeItem(createDto);
  }

  @Get('items')
  @ApiOperation({ summary: '获取费用项目列表' })
  @ApiResponse({ status: 200, description: '获取费用项目列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllFeeItems(@Query() query: FeeItemQueryDto) {
    return this.feeService.findAllFeeItems(query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: '获取费用项目详情' })
  @ApiResponse({
    status: 200,
    description: '获取费用项目详情成功',
    type: FeeItem,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneFeeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findOneFeeItem(id);
  }

  @Put('items/:id')
  @ApiOperation({ summary: '更新费用项目' })
  @ApiResponse({ status: 200, description: '费用项目更新成功', type: FeeItem })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateFeeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFeeItemDto,
  ) {
    return this.feeService.updateFeeItem(id, updateDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除费用项目' })
  @ApiResponse({ status: 204, description: '费用项目删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeFeeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.removeFeeItem(id);
  }

  // ============ Fee Collections ============

  @Post('collections')
  @ApiOperation({ summary: '创建费用征收记录' })
  @ApiResponse({ status: 201, description: '费用征收记录创建成功', type: FeeCollection })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createFeeCollection(@Body() createDto: CreateFeeCollectionDto) {
    return this.feeService.createFeeCollection(createDto);
  }

  @Get('collections')
  @ApiOperation({ summary: '获取费用征收记录列表' })
  @ApiResponse({ status: 200, description: '获取费用征收记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllFeeCollections(@Query() query: FeeCollectionQueryDto) {
    return this.feeService.findAllFeeCollections(query);
  }

  @Get('collections/:id')
  @ApiOperation({ summary: '获取费用征收记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取费用征收记录详情成功',
    type: FeeCollection,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneFeeCollection(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findOneFeeCollection(id);
  }

  @Put('collections/:id')
  @ApiOperation({ summary: '更新费用征收记录' })
  @ApiResponse({ status: 200, description: '费用征收记录更新成功', type: FeeCollection })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateFeeCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFeeCollectionDto,
  ) {
    return this.feeService.updateFeeCollection(id, updateDto);
  }

  @Post('collections/:id/payment')
  @ApiOperation({ summary: '记录付款' })
  @ApiResponse({ status: 200, description: '付款记录成功', type: FeeCollection })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.feeService.recordPayment(id, user?.sub, recordPaymentDto);
  }

  @Delete('collections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除费用征收记录' })
  @ApiResponse({ status: 204, description: '费用征收记录删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeFeeCollection(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.removeFeeCollection(id);
  }

  // ============ Fee Reductions ============

  @Post('reductions')
  @ApiOperation({ summary: '创建费用减免申请' })
  @ApiResponse({ status: 201, description: '费用减免申请创建成功', type: FeeReduction })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createFeeReduction(@Body() createDto: CreateFeeReductionDto) {
    return this.feeService.createFeeReduction(createDto);
  }

  @Get('reductions')
  @ApiOperation({ summary: '获取费用减免记录列表' })
  @ApiResponse({ status: 200, description: '获取费用减免记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllFeeReductions(@Query() query: FeeReductionQueryDto) {
    return this.feeService.findAllFeeReductions(query);
  }

  @Get('reductions/:id')
  @ApiOperation({ summary: '获取费用减免记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取费用减免记录详情成功',
    type: FeeReduction,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneFeeReduction(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findOneFeeReduction(id);
  }

  @Post('reductions/:id/approve')
  @ApiOperation({ summary: '审批费用减免申请' })
  @ApiResponse({ status: 200, description: '费用减免审批成功', type: FeeReduction })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  approveFeeReduction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveReductionDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.feeService.approveFeeReduction(id, user?.sub, dto);
  }

  @Delete('reductions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除费用减免记录' })
  @ApiResponse({ status: 204, description: '费用减免记录删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeFeeReduction(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.removeFeeReduction(id);
  }
}
