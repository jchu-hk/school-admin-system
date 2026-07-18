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
import { AssetService } from './asset.service';
import { Asset, AssetRental } from './asset.entity';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetQueryDto,
  CreateAssetRentalDto,
  UpdateAssetRentalDto,
  ApproveRentalDto,
  ReturnRentalDto,
  AssetRentalQueryDto,
} from './dto/asset.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('资产管理')
@Controller('asset')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  // ============ Asset CRUD ============

  @Post()
  @ApiOperation({ summary: '创建资产' })
  @ApiResponse({ status: 201, description: '资产创建成功', type: Asset })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createAsset(@Body() createDto: CreateAssetDto) {
    return this.assetService.createAsset(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取资产列表' })
  @ApiResponse({ status: 200, description: '获取资产列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllAssets(@Query() query: AssetQueryDto) {
    return this.assetService.findAllAssets(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取资产统计' })
  @ApiResponse({ status: 200, description: '获取资产统计成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStatistics(@Query('schoolId') schoolId: string) {
    return this.assetService.getAssetStatistics(schoolId);
  }

  // ============ Asset Rental CRUD ============

  @Post('rentals')
  @ApiOperation({ summary: '创建租借申请' })
  @ApiResponse({
    status: 201,
    description: '租借申请创建成功',
    type: AssetRental,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createRental(@Body() createDto: CreateAssetRentalDto, @Req() req: Request) {
    const user = req.user as any;
    return this.assetService.createRental(
      createDto,
      user?.sub,
      user?.name || 'System',
    );
  }

  @Get('rentals')
  @ApiOperation({ summary: '获取租借记录列表' })
  @ApiResponse({ status: 200, description: '获取租借记录列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllRentals(@Query() query: AssetRentalQueryDto) {
    return this.assetService.findAllRentals(query);
  }

  @Get('rentals/overdue')
  @ApiOperation({ summary: '获取逾期租借记录' })
  @ApiResponse({ status: 200, description: '获取逾期租借记录成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getOverdueRentals() {
    return this.assetService.getOverdueRentals();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取资产详情' })
  @ApiResponse({ status: 200, description: '获取资产详情成功', type: Asset })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneAsset(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.findOneAsset(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新资产' })
  @ApiResponse({ status: 200, description: '资产更新成功', type: Asset })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAssetDto,
  ) {
    return this.assetService.updateAsset(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除资产' })
  @ApiResponse({ status: 204, description: '资产删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeAsset(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.removeAsset(id);
  }

  @Get('rentals/:id')
  @ApiOperation({ summary: '获取租借记录详情' })
  @ApiResponse({
    status: 200,
    description: '获取租借记录详情成功',
    type: AssetRental,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneRental(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.findOneRental(id);
  }

  @Post('rentals/:id/approve')
  @ApiOperation({ summary: '审批租借申请' })
  @ApiResponse({ status: 200, description: '审批成功', type: AssetRental })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  approveRental(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRentalDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.assetService.approveRental(
      id,
      user?.sub,
      user?.name || 'System',
      dto,
    );
  }

  @Post('rentals/:id/lend')
  @ApiOperation({ summary: '发放资产' })
  @ApiResponse({ status: 200, description: '发放成功', type: AssetRental })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  lendAsset(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.lendAsset(id);
  }

  @Post('rentals/:id/return')
  @ApiOperation({ summary: '归还资产' })
  @ApiResponse({ status: 200, description: '归还成功', type: AssetRental })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  returnAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnRentalDto,
  ) {
    return this.assetService.returnAsset(id, dto);
  }

  @Post('rentals/:id/reject')
  @ApiOperation({ summary: '拒绝租借申请' })
  @ApiResponse({ status: 200, description: '拒绝成功', type: AssetRental })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  rejectRental(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
  ) {
    return this.assetService.rejectRental(id, note || '');
  }

  @Put('rentals/:id')
  @ApiOperation({ summary: '更新租借记录' })
  @ApiResponse({ status: 200, description: '更新成功', type: AssetRental })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateRental(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAssetRentalDto,
  ) {
    return this.assetService.updateRental(id, updateDto);
  }

  @Delete('rentals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除租借记录' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeRental(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.removeRental(id);
  }
}
