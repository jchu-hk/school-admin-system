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
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeeService } from './fee.service';
import { FeeItem, FeeCollection, FeeReduction, FeeStatus } from './fee.entity';
import {
  CreateFeeItemDto,
  UpdateFeeItemDto,
  CreateFeeCollectionDto,
  UpdateFeeCollectionDto,
  PayFeeDto,
  CreateFeeReductionDto,
  ApproveFeeReductionDto,
  FeeCollectionQueryDto,
  FeeItemQueryDto,
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

  // ===== FeeItem =====

  @Get('items')
  @ApiOperation({ summary: '获取费用项目列表' })
  @ApiResponse({ status: 200, description: '获取费用项目列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  findAllItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('schoolId') schoolId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('schoolYear') schoolYear?: string,
    @Query('semester') semester?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.feeService.findAllItems(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      schoolId,
      gradeId,
      schoolYear,
      semester,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get('items/:id')
  @ApiOperation({ summary: '获取费用项目详情' })
  @ApiResponse({ status: 200, description: '获取费用项目详情成功', type: FeeItem })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  findOneItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findItemById(id);
  }

  @Post('items')
  @ApiOperation({ summary: '创建费用项目' })
  @ApiResponse({ status: 201, description: '创建费用项目成功', type: FeeItem })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  createItem(@Body() dto: CreateFeeItemDto) {
    return this.feeService.createItem(dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: '更新费用项目' })
  @ApiResponse({ status: 200, description: '更新费用项目成功', type: FeeItem })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeItemDto,
  ) {
    return this.feeService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除费用项目' })
  @ApiResponse({ status: 200, description: '删除费用项目成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.deleteItem(id);
  }

  // ===== FeeCollection =====

  @Get('collections')
  @ApiOperation({ summary: '获取费用收取记录列表' })
  @ApiResponse({ status: 200, description: '获取费用收取记录列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAllCollections(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('studentId') studentId?: string,
    @Query('parentId') parentId?: string,
    @Query('status') status?: FeeStatus,
    @Query('schoolId') schoolId?: string,
    @Request() req?: any,
  ) {
    // 家长只能看到自己的记录
    let filterParentId = parentId;
    if (req?.user?.role === UserRole.PARENT) {
      filterParentId = req.user.id;
    }

    return this.feeService.findAllCollections(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      studentId,
      filterParentId,
      status,
      schoolId,
    );
  }

  @Get('collections/:id')
  @ApiOperation({ summary: '获取费用收取记录详情' })
  @ApiResponse({ status: 200, description: '获取费用收取记录详情成功', type: FeeCollection })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOneCollection(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findCollectionById(id);
  }

  @Post('collections')
  @ApiOperation({ summary: '创建费用收取记录' })
  @ApiResponse({ status: 201, description: '创建费用收取记录成功', type: FeeCollection })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  createCollection(@Body() dto: CreateFeeCollectionDto, @Request() req) {
    return this.feeService.createCollection(dto);
  }

  @Patch('collections/:id')
  @ApiOperation({ summary: '更新费用收取记录' })
  @ApiResponse({ status: 200, description: '更新费用收取记录成功', type: FeeCollection })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  updateCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeCollectionDto,
    @Request() req,
  ) {
    return this.feeService.updateCollection(id, dto, req.user.id);
  }

  @Post('collections/:id/pay')
  @ApiOperation({ summary: '缴纳费用' })
  @ApiResponse({ status: 200, description: '缴纳费用成功', type: FeeCollection })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  payFee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayFeeDto,
    @Request() req,
  ) {
    return this.feeService.payFee(id, dto, req.user.id);
  }

  @Delete('collections/:id')
  @ApiOperation({ summary: '删除费用收取记录' })
  @ApiResponse({ status: 200, description: '删除费用收取记录成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteCollection(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.deleteCollection(id);
  }

  // ===== FeeReduction =====

  @Get('reductions')
  @ApiOperation({ summary: '获取费用减免记录列表' })
  @ApiResponse({ status: 200, description: '获取费用减免记录列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  findAllReductions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.feeService.findAllReductions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      studentId,
    );
  }

  @Get('reductions/:id')
  @ApiOperation({ summary: '获取费用减免记录详情' })
  @ApiResponse({ status: 200, description: '获取费用减免记录详情成功', type: FeeReduction })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  findOneReduction(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.findReductionById(id);
  }

  @Post('reductions')
  @ApiOperation({ summary: '创建费用减免记录' })
  @ApiResponse({ status: 201, description: '创建费用减免记录成功', type: FeeReduction })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  createReduction(@Body() dto: CreateFeeReductionDto) {
    return this.feeService.createReduction(dto);
  }

  @Patch('reductions/:id/approve')
  @ApiOperation({ summary: '审核费用减免' })
  @ApiResponse({ status: 200, description: '审核费用减免成功', type: FeeReduction })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  approveReduction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveFeeReductionDto,
    @Request() req,
  ) {
    return this.feeService.approveReduction(id, dto, req.user.id);
  }

  @Delete('reductions/:id')
  @ApiOperation({ summary: '删除费用减免记录' })
  @ApiResponse({ status: 200, description: '删除费用减免记录成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteReduction(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeService.deleteReduction(id);
  }

  // ===== Stats =====

  @Get('stats')
  @ApiOperation({ summary: '获取费用统计' })
  @ApiResponse({ status: 200, description: '获取费用统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  getStats(@Query('schoolId') schoolId?: string) {
    return this.feeService.getFeeStats(schoolId);
  }
}
