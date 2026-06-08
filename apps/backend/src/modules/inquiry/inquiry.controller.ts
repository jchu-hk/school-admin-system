import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InquiryService } from './inquiry.service';
import { Inquiry, InquiryReply, InquiryStatus } from './inquiry.entity';
import { CreateInquiryDto, UpdateInquiryDto, CreateInquiryReplyDto } from './dto/inquiry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('家长查询')
@Controller('inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Get()
  @ApiOperation({ summary: '查询列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认10' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
  @ApiQuery({ name: 'inquiryType', required: false, description: '类型筛选' })
  @ApiQuery({ name: 'parentId', required: false, description: '家长ID筛选' })
  @ApiResponse({ status: 200, description: '获取查询列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: InquiryStatus,
    @Query('inquiryType') inquiryType?: string,
    @Query('parentId') parentId?: string,
    @Request() req?: any,
  ): Promise<{ inquiries: Inquiry[]; total: number }> {
    // 家长只能看到自己的查询
    let filterParentId = parentId;
    if (req?.user?.role === UserRole.PARENT) {
      filterParentId = req.user.id;
    }
    
    return this.inquiryService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      status,
      inquiryType,
      filterParentId,
    );
  }

  @Post()
  @ApiOperation({ summary: '提交查询' })
  @ApiResponse({ status: 201, description: '查询提交成功', type: Inquiry })
  @Roles(
    UserRole.PARENT,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  create(
    @Body() createDto: CreateInquiryDto,
    @Request() req,
  ): Promise<Inquiry> {
    // 如果没有提供parentId，使用当前用户
    if (!createDto.parentId) {
      createDto.parentId = req.user.id;
    }
    return this.inquiryService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询详情' })
  @ApiResponse({ status: 200, description: '获取查询详情成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const result = await this.inquiryService.findOneWithReplies(id);
    
    // 家长只能查看自己的查询
    if (req.user.role === UserRole.PARENT && result.inquiry.parentId !== req.user.id) {
      throw new BadRequestException('无权查看此查询');
    }
    
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新查询' })
  @ApiResponse({ status: 200, description: '查询更新成功', type: Inquiry })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInquiryDto,
    @Request() req,
  ): Promise<Inquiry> {
    return this.inquiryService.update(id, updateDto, req.user.id);
  }

  @Post(':id/replies')
  @ApiOperation({ summary: '回复查询' })
  @ApiResponse({ status: 201, description: '回复成功', type: InquiryReply })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  createReply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateInquiryReplyDto,
    @Request() req,
  ): Promise<InquiryReply> {
    return this.inquiryService.createReply(
      { inquiryId: id, content: createDto.content },
      req.user.id,
    );
  }

  @Patch(':id/close')
  @ApiOperation({ summary: '关闭查询' })
  @ApiResponse({ status: 200, description: '关闭成功', type: Inquiry })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  close(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.inquiryService.close(id, req.user.id);
  }

  @Post(':id/rating')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '满意度评价' })
  @ApiResponse({ status: 200, description: '评价成功', type: Inquiry })
  @Roles(UserRole.PARENT)
  addRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Request() req,
  ) {
    return this.inquiryService.addRating(id, req.user.id, rating, comment);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: '获取查询统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  getStats() {
    return this.inquiryService.getStats();
  }
}
