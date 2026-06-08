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
  ApiQuery,
} from '@nestjs/swagger';
import { InquiryService } from './inquiry.service';
import { Inquiry, InquiryReply, InquiryStatus } from './inquiry.entity';
import { CreateInquiryDto, UpdateInquiryDto, CreateInquiryReplyDto } from './dto/inquiry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('咨询管理')
@Controller('api/inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Get()
  @ApiOperation({ summary: '获取咨询列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认10' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
  @ApiQuery({ name: 'inquiryType', required: false, description: '类型筛选' })
  @ApiQuery({ name: 'parentId', required: false, description: '家长ID筛选' })
  @ApiResponse({ status: 200, description: '获取咨询列表成功' })
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
  ): Promise<{ inquiries: Inquiry[]; total: number }> {
    return this.inquiryService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      status,
      inquiryType,
      parentId,
    );
  }

  @Post()
  @ApiOperation({ summary: '创建咨询' })
  @ApiResponse({ status: 201, description: '咨询创建成功', type: Inquiry })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  create(
    @Body() createDto: CreateInquiryDto,
    @Request() req,
  ): Promise<Inquiry> {
    // If parentId not provided, use current user
    if (!createDto.parentId) {
      createDto.parentId = req.user.id;
    }
    return this.inquiryService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取咨询详情' })
  @ApiResponse({ status: 200, description: '获取咨询详情成功', type: Inquiry })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Inquiry> {
    return this.inquiryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新咨询' })
  @ApiResponse({ status: 200, description: '咨询更新成功', type: Inquiry })
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

  @Delete(':id')
  @ApiOperation({ summary: '删除咨询' })
  @ApiResponse({ status: 204, description: '咨询删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.inquiryService.remove(id);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: '获取咨询回复列表' })
  @ApiResponse({ status: 200, description: '获取回复列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findReplies(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InquiryReply[]> {
    return this.inquiryService.findReplies(id);
  }

  @Post(':id/replies')
  @ApiOperation({ summary: '回复咨询' })
  @ApiResponse({ status: 201, description: '回复创建成功', type: InquiryReply })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  createReply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('content') content: string,
    @Request() req,
  ): Promise<InquiryReply> {
    return this.inquiryService.createReply(
      { inquiryId: id, content },
      req.user.id,
    );
  }
}
