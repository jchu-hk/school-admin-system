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
import { FeeService } from './fee.service';
import { FeeType } from './fee-type.entity';
import { FeeRecord } from './fee-record.entity';
import {
  CreateFeeTypeDto,
  UpdateFeeTypeDto,
  FeeTypeQueryDto,
  CreateFeeRecordDto,
  UpdateFeeRecordDto,
  FeeRecordQueryDto,
} from './dto/fee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('费用管理')
@Controller('fees')
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
}
