import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RecruitmentPositionService } from './recruitment-position.service';
import {
  CreatePositionDto,
  UpdatePositionDto,
  PositionQueryDto,
} from './dto/position.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('招聘管理 - 职位管理')
@ApiBearerAuth()
@Controller('v1/recruitment/positions')
export class RecruitmentPositionController {
  constructor(private readonly positionService: RecruitmentPositionService) {}

  @Post()
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '创建职位草稿' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() dto: CreatePositionDto) {
    const position = await this.positionService.create(dto);
    return {
      success: true,
      data: {
        id: position.id,
        status: position.status,
        createdAt: position.createdAt,
      },
      message: '创建成功',
    };
  }

  @Get()
  @ApiOperation({ summary: '列出所有职位' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: PositionQueryDto) {
    const result = await this.positionService.findAll(query);
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取职位详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const position = await this.positionService.findOne(id);
    return {
      success: true,
      data: {
        id: position.id,
        title: position.title,
        subject: position.subject,
        employmentType: position.employmentType,
        salaryRange: {
          min: position.salaryMin,
          max: position.salaryMax,
          currency: position.salaryCurrency,
        },
        location: position.location,
        requirements: position.requirements,
        responsibilities: position.responsibilities,
        benefits: position.benefits,
        applicationDeadline: position.applicationDeadline,
        status: position.status,
        applicationCount: position.applicationCount,
        createdAt: position.createdAt,
        publishedAt: position.publishedAt,
        pausedAt: position.pausedAt,
        closedAt: position.closedAt,
        updatedAt: position.updatedAt,
      },
      message: '获取成功',
    };
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '更新职位信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    const position = await this.positionService.update(id, dto);
    return {
      success: true,
      data: {
        id: position.id,
        status: position.status,
        updatedAt: position.updatedAt,
      },
      message: '更新成功',
    };
  }

  @Post(':id/publish')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发布职位' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    const position = await this.positionService.publish(id);
    return {
      success: true,
      data: {
        id: position.id,
        status: position.status,
        publishedAt: position.publishedAt,
      },
      message: '发布成功',
    };
  }

  @Post(':id/pause')
  @Roles(UserRole.SCHOOL_DIRECTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '暂停职位' })
  @ApiResponse({ status: 200, description: '暂停成功' })
  async pause(@Param('id', ParseUUIDPipe) id: string) {
    const position = await this.positionService.pause(id);
    return {
      success: true,
      data: {
        id: position.id,
        status: position.status,
        pausedAt: position.pausedAt,
      },
      message: '暂停成功',
    };
  }

  @Post(':id/resume')
  @Roles(UserRole.SCHOOL_DIRECTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重新发布职位' })
  @ApiResponse({ status: 200, description: '重新发布成功' })
  async resume(@Param('id', ParseUUIDPipe) id: string) {
    const position = await this.positionService.resume(id);
    return {
      success: true,
      data: {
        id: position.id,
        status: position.status,
        resumedAt: position.publishedAt,
      },
      message: '重新发布成功',
    };
  }

  @Post(':id/close')
  @Roles(UserRole.SCHOOL_DIRECTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '关闭职位' })
  @ApiResponse({ status: 200, description: '关闭成功' })
  async close(@Param('id', ParseUUIDPipe) id: string) {
    const position = await this.positionService.close(id);
    return {
      success: true,
      data: {
        id: position.id,
        status: position.status,
        closedAt: position.closedAt,
      },
      message: '关闭成功',
    };
  }
}
