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
import { TuitionService } from './tuition.service';
import {
  TuitionStandard,
  TuitionPayment,
  TuitionStatus,
} from './tuition.entity';
import {
  CreateTuitionStandardDto,
  UpdateTuitionStandardDto,
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  PayTuitionDto,
} from './dto/tuition.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('学费管理')
@Controller('tuition')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TuitionController {
  constructor(private readonly tuitionService: TuitionService) {}

  // ===== TuitionStandard =====

  @Get('standards')
  @ApiOperation({ summary: '获取学费标准列表' })
  @ApiResponse({ status: 200, description: '获取学费标准列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllStandards(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('schoolId') schoolId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.tuitionService.findAllStandards(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      schoolId,
      gradeId,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get('standards/:id')
  @ApiOperation({ summary: '获取学费标准详情' })
  @ApiResponse({
    status: 200,
    description: '获取学费标准详情成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneStandard(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.findStandardById(id);
  }

  @Post('standards')
  @ApiOperation({ summary: '创建学费标准' })
  @ApiResponse({
    status: 201,
    description: '创建学费标准成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createStandard(@Body() dto: CreateTuitionStandardDto) {
    return this.tuitionService.createStandard(dto);
  }

  @Patch('standards/:id')
  @ApiOperation({ summary: '更新学费标准' })
  @ApiResponse({
    status: 200,
    description: '更新学费标准成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateStandard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTuitionStandardDto,
  ) {
    return this.tuitionService.updateStandard(id, dto);
  }

  @Delete('standards/:id')
  @ApiOperation({ summary: '删除学费标准' })
  @ApiResponse({ status: 200, description: '删除学费标准成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteStandard(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.deleteStandard(id);
  }

  // ===== TuitionPayment =====

  @Get('payments')
  @ApiOperation({ summary: '获取缴费记录列表' })
  @ApiResponse({ status: 200, description: '获取缴费记录列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAllPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('studentId') studentId?: string,
    @Query('parentId') parentId?: string,
    @Query('status') status?: TuitionStatus,
    @Query('schoolId') schoolId?: string,
    @Request() req?: any,
  ) {
    // 家长只能看到自己的缴费记录
    let filterParentId = parentId;
    if (req?.user?.role === UserRole.PARENT) {
      filterParentId = req.user.id;
    }

    return this.tuitionService.findAllPayments(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      studentId,
      filterParentId,
      status,
      schoolId,
    );
  }

  @Get('payments/:id')
  @ApiOperation({ summary: '获取缴费记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取缴费记录详情成功',
    type: TuitionPayment,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOnePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.findPaymentById(id);
  }

  @Post('payments')
  @ApiOperation({ summary: '创建缴费记录' })
  @ApiResponse({
    status: 201,
    description: '创建缴费记录成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createPayment(@Body() dto: CreateTuitionPaymentDto, @Request() _req) {
    return this.tuitionService.createPayment(dto);
  }

  @Patch('payments/:id')
  @ApiOperation({ summary: '更新缴费记录' })
  @ApiResponse({
    status: 200,
    description: '更新缴费记录成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTuitionPaymentDto,
    @Request() req,
  ) {
    return this.tuitionService.updatePayment(id, dto, req.user.id);
  }

  @Post('payments/:id/pay')
  @ApiOperation({ summary: '缴费' })
  @ApiResponse({ status: 200, description: '缴费成功', type: TuitionPayment })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  payTuition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayTuitionDto,
    @Request() req,
  ) {
    return this.tuitionService.payTuition(id, dto, req.user.id);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: '删除缴费记录' })
  @ApiResponse({ status: 200, description: '删除缴费记录成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deletePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.deletePayment(id);
  }

  // ===== TuitionArrears =====

  @Get('arrears')
  @ApiOperation({ summary: '获取欠费记录列表' })
  @ApiResponse({ status: 200, description: '获取欠费记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllArrears(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.tuitionService.findAllArrears(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      studentId,
    );
  }

  // ===== Stats =====

  @Get('stats')
  @ApiOperation({ summary: '获取学费统计' })
  @ApiResponse({ status: 200, description: '获取学费统计成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStats(@Query('schoolId') schoolId?: string) {
    return this.tuitionService.getTuitionStats(schoolId);
  }
}
