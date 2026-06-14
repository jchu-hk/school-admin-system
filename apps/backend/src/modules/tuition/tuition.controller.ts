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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TuitionService } from './tuition.service';
import { TuitionStandard } from './tuition-standard.entity';
import { TuitionPayment } from './tuition-payment.entity';
import {
  CreateTuitionStandardDto,
  UpdateTuitionStandardDto,
  TuitionStandardQueryDto,
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  TuitionPaymentQueryDto,
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

  // ============ Tuition Standards ============

  @Post('standards')
  @ApiOperation({ summary: '创建学费标准' })
  @ApiResponse({
    status: 201,
    description: '学费标准创建成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createStandard(@Body() createDto: CreateTuitionStandardDto) {
    return this.tuitionService.createStandard(createDto);
  }

  @Get('standards')
  @ApiOperation({ summary: '获取学费标准列表' })
  @ApiResponse({ status: 200, description: '获取学费标准列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllStandards(@Query() query: TuitionStandardQueryDto) {
    return this.tuitionService.findAllStandards(query);
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
    return this.tuitionService.findOneStandard(id);
  }

  @Put('standards/:id')
  @ApiOperation({ summary: '更新学费标准' })
  @ApiResponse({
    status: 200,
    description: '学费标准更新成功',
    type: TuitionStandard,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateStandard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTuitionStandardDto,
  ) {
    return this.tuitionService.updateStandard(id, updateDto);
  }

  @Delete('standards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除学费标准' })
  @ApiResponse({ status: 204, description: '学费标准删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeStandard(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.removeStandard(id);
  }

  // ============ Tuition Payments ============

  @Post('payments')
  @ApiOperation({ summary: '创建缴费记录' })
  @ApiResponse({
    status: 201,
    description: '缴费记录创建成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createPayment(@Body() createDto: CreateTuitionPaymentDto) {
    return this.tuitionService.createPayment(createDto);
  }

  @Get('payments')
  @ApiOperation({ summary: '获取缴费记录列表' })
  @ApiResponse({ status: 200, description: '获取缴费记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllPayments(@Query() query: TuitionPaymentQueryDto) {
    return this.tuitionService.findAllPayments(query);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: '获取缴费记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取缴费记录详情成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOnePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.findOnePayment(id);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: '更新缴费记录' })
  @ApiResponse({
    status: 200,
    description: '缴费记录更新成功',
    type: TuitionPayment,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTuitionPaymentDto,
  ) {
    return this.tuitionService.updatePayment(id, updateDto);
  }

  @Delete('payments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除缴费记录' })
  @ApiResponse({ status: 204, description: '缴费记录删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.tuitionService.removePayment(id);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: '获取学生缴费记录' })
  @ApiResponse({ status: 200, description: '获取学生缴费记录成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  findByStudent(@Param('studentId') studentId: string) {
    return this.tuitionService.findByStudent(studentId);
  }
}
