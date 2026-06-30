import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RecruitmentAnalyticsService } from './recruitment-analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('招聘管理 - 数据统计看板')
@ApiBearerAuth()
@Controller('v1/recruitment/analytics')
export class RecruitmentAnalyticsController {
  constructor(private readonly analyticsService: RecruitmentAnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '获取招聘数据统计看板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDashboard() {
    const result = await this.analyticsService.getDashboard();
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }
}
