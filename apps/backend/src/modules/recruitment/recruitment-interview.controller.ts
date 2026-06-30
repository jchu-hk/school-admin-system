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
import { RecruitmentInterviewService } from './recruitment-interview.service';
import {
  CreateInterviewDto,
  UpdateInterviewDto,
  CancelInterviewDto,
  SubmitScoreDto,
  CompleteInterviewDto,
  InterviewQueryDto,
} from './dto/interview.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('招聘管理 - 面试管理')
@ApiBearerAuth()
@Controller('v1/recruitment/interviews')
export class RecruitmentInterviewController {
  constructor(private readonly interviewService: RecruitmentInterviewService) {}

  @Post()
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '创建面试安排' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() dto: CreateInterviewDto) {
    const interview = await this.interviewService.create(dto);
    return {
      success: true,
      data: {
        id: interview.id,
        status: interview.status,
        createdAt: interview.createdAt,
      },
      message: '创建成功',
    };
  }

  @Get()
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '列出所有面试' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: InterviewQueryDto) {
    const result = await this.interviewService.findAll(query);
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取面试详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const interview = await this.interviewService.findOne(id);
    return {
      success: true,
      data: interview,
      message: '获取成功',
    };
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新面试安排' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    const interview = await this.interviewService.update(id, dto);
    return {
      success: true,
      data: { id: interview.id, updatedAt: interview.updatedAt },
      message: '更新成功',
    };
  }

  @Post(':id/cancel')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消面试' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInterviewDto,
  ) {
    const interview = await this.interviewService.cancel(id, dto);
    return {
      success: true,
      data: {
        id: interview.id,
        status: interview.status,
        cancelledAt: interview.cancelledAt,
      },
      message: '取消成功',
    };
  }

  @Post(':id/scores')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交面试评分' })
  @ApiResponse({ status: 200, description: '提交成功' })
  async submitScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitScoreDto,
  ) {
    await this.interviewService.submitScore(id, dto);
    return {
      success: true,
      data: { interviewId: id, submittedAt: new Date() },
      message: '提交成功',
    };
  }

  @Post(':id/complete')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '完成面试' })
  @ApiResponse({ status: 200, description: '完成成功' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteInterviewDto,
  ) {
    const interview = await this.interviewService.complete(id, dto);
    return {
      success: true,
      data: {
        id: interview.id,
        status: interview.status,
        completedAt: interview.completedAt,
      },
      message: '完成成功',
    };
  }
}
