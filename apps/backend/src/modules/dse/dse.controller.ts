import {
  Controller, Get, Post, Put, Delete,
  Param, Query, Body, UseGuards, Req, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DseService } from './dse.service';
import {
  CreateDseReleaseDto, UpdateDseReleaseDto, QueryDseReleaseDto,
  ImportDseResultDto, BatchImportDseResultDto, QueryDseResultDto, UpdateDseResultDto,
  CreateDseReviewDto, ApproveDseReviewDto, UpdateDseReviewResultDto, QueryDseReviewDto,
  CreateDseOfferTrackingDto, UpdateDseOfferTrackingDto, QueryDseOfferTrackingDto,
  QueryDseStatsDto,
} from './dto/dse.dto';

@ApiTags('DSE放榜成绩追踪')
@Controller('dse')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DseController {
  constructor(private readonly dseService: DseService) {}

  // ==================== DSE Release ====================

  @Post('releases')
  @ApiOperation({ summary: '创建DSE放榜记录' })
  @ApiResponse({ status: 201, description: '放榜记录已创建' })
  createRelease(@Body(ValidationPipe) dto: CreateDseReleaseDto) {
    return this.dseService.createRelease(dto);
  }

  @Get('releases')
  @ApiOperation({ summary: '查询放榜记录列表' })
  findAllReleases(@Query(ValidationPipe) query: QueryDseReleaseDto) {
    return this.dseService.findAllReleases(query);
  }

  @Get('releases/:id')
  @ApiOperation({ summary: '获取放榜记录详情' })
  findOneRelease(@Param('id') id: string) {
    return this.dseService.findOneRelease(id);
  }

  @Put('releases/:id')
  @ApiOperation({ summary: '更新放榜记录' })
  updateRelease(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateDseReleaseDto) {
    return this.dseService.updateRelease(id, dto);
  }

  // ==================== DSE Results ====================

  @Post('results')
  @ApiOperation({ summary: '导入单个学生DSE成绩（HKEAA数据入库）' })
  @ApiResponse({ status: 201, description: '成绩已导入' })
  importResult(@Body(ValidationPipe) dto: ImportDseResultDto, @Req() req: any) {
    return this.dseService.importResult(dto, req.user.id);
  }

  @Post('results/batch')
  @ApiOperation({ summary: '批量导入DSE成绩（支持HKEAA CSV解析结果）' })
  @ApiResponse({ status: 201, description: '批量导入结果' })
  batchImport(@Body(ValidationPipe) dto: BatchImportDseResultDto) {
    return this.dseService.batchImport(dto);
  }

  @Get('results')
  @ApiOperation({ summary: '查询DSE成绩列表' })
  findAllResults(@Query(ValidationPipe) query: QueryDseResultDto) {
    return this.dseService.findAllResults(query);
  }

  @Get('results/:id')
  @ApiOperation({ summary: '获取DSE成绩详情' })
  findOneResult(@Param('id') id: string) {
    return this.dseService.findOneResult(id);
  }

  @Put('results/:id')
  @ApiOperation({ summary: '更新DSE成绩（状态、公布设置等）' })
  updateResult(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateDseResultDto) {
    return this.dseService.updateResult(id, dto);
  }

  // ==================== DSE Review ====================

  @Post('reviews')
  @ApiOperation({ summary: '提交成绩覆核申请' })
  @ApiResponse({ status: 201, description: '覆核申请已提交' })
  createReview(@Body(ValidationPipe) dto: CreateDseReviewDto, @Req() req: any) {
    return this.dseService.createReview(dto, req.user.id);
  }

  @Get('reviews')
  @ApiOperation({ summary: '查询覆核申请列表' })
  findAllReviews(@Query(ValidationPipe) query: QueryDseReviewDto) {
    return this.dseService.findAllReviews(query);
  }

  @Get('reviews/:id')
  @ApiOperation({ summary: '获取覆核申请详情' })
  findOneReview(@Param('id') id: string) {
    return this.dseService.findOneReview(id);
  }

  @Put('reviews/:id/approve')
  @ApiOperation({ summary: '审批覆核申请（批准后提交HKEAA）' })
  approveReview(@Param('id') id: string, @Body(ValidationPipe) dto: ApproveDseReviewDto, @Req() req: any) {
    return this.dseService.approveReview(id, dto, req.user.id);
  }

  @Put('reviews/:id/result')
  @ApiOperation({ summary: '录入HKEAA覆核结果（自动更正成绩）' })
  updateReviewResult(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateDseReviewResultDto) {
    return this.dseService.updateReviewResult(id, dto);
  }

  // ==================== Offer Tracking ====================

  @Post('offers')
  @ApiOperation({ summary: '创建升学去向追踪记录' })
  @ApiResponse({ status: 201, description: '记录已创建' })
  createOffer(@Body(ValidationPipe) dto: CreateDseOfferTrackingDto) {
    return this.dseService.createOfferTracking(dto);
  }

  @Get('offers')
  @ApiOperation({ summary: '查询升学去向列表（匿名化）' })
  findAllOffers(@Query(ValidationPipe) query: QueryDseOfferTrackingDto) {
    return this.dseService.findAllOffers(query);
  }

  @Get('offers/:id')
  @ApiOperation({ summary: '获取升学去向详情' })
  findOneOffer(@Param('id') id: string) {
    return this.dseService.findOneOffer(id);
  }

  @Put('offers/:id')
  @ApiOperation({ summary: '更新升学去向状态' })
  updateOffer(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateDseOfferTrackingDto) {
    return this.dseService.updateOffer(id, dto);
  }

  // ==================== Statistics ====================

  @Get('stats')
  @ApiOperation({ summary: '获取DSE放榜统计分析报告' })
  @ApiResponse({ status: 200, description: '统计分析数据' })
  getStats(@Query(ValidationPipe) query: QueryDseStatsDto) {
    return this.dseService.getStats(query.releaseId);
  }
}
