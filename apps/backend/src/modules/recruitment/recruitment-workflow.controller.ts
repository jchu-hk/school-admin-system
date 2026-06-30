import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RecruitmentWorkflowService } from './recruitment-workflow.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('招聘管理 - 招聘流程状态跟踪')
@ApiBearerAuth()
@Controller('v1/recruitment/workflows')
export class RecruitmentWorkflowController {
  constructor(private readonly workflowService: RecruitmentWorkflowService) {}

  @Get('status/:applicationId')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '获取申请的工作流程状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWorkflowStatus(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.workflowService.getWorkflowStatus(applicationId);
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }

  @Get('pipeline')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '获取招聘漏斗概览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPipelineOverview() {
    const result = await this.workflowService.getPipelineOverview();
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }

  @Get('stats')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '获取招聘时间统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTimeStats(@Query('positionId') positionId?: string) {
    const result = await this.workflowService.getTimeStats(positionId);
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }

  @Get('timeline/:applicationId')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '获取申请时间线' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getApplicationTimeline(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.workflowService.getApplicationTimeline(applicationId);
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }
}
