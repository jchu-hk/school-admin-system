import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiSuggestionService } from './ai-suggestion.service';
import {
  GetSuggestionsDto,
  UpdateSuggestionStatusDto,
} from './dto/ai-suggestion.dto';

/**
 * AI智能建议控制器
 * F-AI-001: 提供智能建议API，分析学生出勤、成绩等数据，提供建议
 */
@Controller('api/v1/ai/suggestions')
@UseGuards(JwtAuthGuard)
export class AiSuggestionController {
  constructor(private readonly aiSuggestionService: AiSuggestionService) {}

  /**
   * 获取AI仪表板摘要
   * GET /api/v1/ai/suggestions/dashboard-summary
   */
  @Get('dashboard-summary')
  async getDashboardSummary(
    @Req() req: any,
    @Query('classId') classId?: string,
  ) {
    const userRole = req.user?.role || 'officer';
    return this.aiSuggestionService.getDashboardSummary(userRole, classId);
  }

  /**
   * 获取学生分析报告
   * GET /api/v1/ai/suggestions/students/:studentId/analysis
   */
  @Get('students/:studentId/analysis')
  async getStudentAnalysis(@Param('studentId') studentId: string) {
    return this.aiSuggestionService.getStudentAnalysis(studentId);
  }

  /**
   * 获取班级分析报告
   * GET /api/v1/ai/suggestions/classes/:classId/analysis
   */
  @Get('classes/:classId/analysis')
  async getClassAnalysis(@Param('classId') classId: string) {
    return this.aiSuggestionService.getClassAnalysis(classId);
  }

  /**
   * 获取建议列表（带过滤和分页）
   * GET /api/v1/ai/suggestions
   */
  @Get()
  async getSuggestions(@Query() filters: GetSuggestionsDto) {
    return this.aiSuggestionService.getSuggestions(filters);
  }

  /**
   * 获取建议统计
   * GET /api/v1/ai/suggestions/stats
   */
  @Get('stats')
  async getSuggestionStats(@Query('classId') classId?: string) {
    return this.aiSuggestionService.getSuggestionStats(classId);
  }

  /**
   * 获取单个建议详情
   * GET /api/v1/ai/suggestions/:suggestionId
   */
  @Get(':suggestionId')
  async getSuggestion(@Param('suggestionId') suggestionId: string) {
    const result = await this.aiSuggestionService.getSuggestions({
      page: 1,
      limit: 1,
    });
    return result.suggestions.find((s) => s.suggestionId === suggestionId);
  }

  /**
   * 更新建议状态
   * PATCH /api/v1/ai/suggestions/:suggestionId
   */
  @Patch(':suggestionId')
  async updateSuggestionStatus(
    @Param('suggestionId') suggestionId: string,
    @Body() dto: UpdateSuggestionStatusDto,
  ) {
    return this.aiSuggestionService.updateSuggestionStatus(suggestionId, dto);
  }

  /**
   * 手动触发AI分析
   * POST /api/v1/ai/suggestions/trigger-analysis
   */
  @Post('trigger-analysis')
  async triggerAnalysis(@Query('classId') classId?: string) {
    return this.aiSuggestionService.triggerAnalysis(classId);
  }
}
