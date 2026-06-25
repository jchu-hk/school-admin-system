import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GradesService } from './grades.service'
import { GradeRecordsService } from './grade-records.service'
import { GradeAlertsService } from './grade-alerts.service'
import { GradePdfService } from './grade-pdf.service'
import { CreateGradeDto, QueryGradesDto } from './dto/grade.dto'
import {
  CreateGradeRecordDto,
  UpdateGradeRecordDto,
  SubmitGradeRecordDto,
  RevokeGradeRecordDto,
  ApproveGradeRecordDto,
  QueryGradeRecordsDto,
  ClassStatsDto,
  GeneratePdfDto,
} from './dto/grade-record.dto'
import { QueryAlertsDto, AcknowledgeAlertDto, UpdateAlertStatusDto } from './dto/grade-alert.dto'

@ApiTags('grades')
@Controller('grades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly gradeRecordsService: GradeRecordsService,
    private readonly gradeAlertsService: GradeAlertsService,
    private readonly gradePdfService: GradePdfService,
  ) {}

  // ==================== Original Grades API ====================

  @Post()
  @ApiOperation({ summary: '创建成绩记录（单个科目）' })
  @ApiResponse({ status: 201, description: '成绩记录已创建' })
  create(@Body() dto: CreateGradeDto) {
    return this.gradesService.create(dto)
  }

  @Get()
  @ApiOperation({ summary: '查询成绩列表' })
  @ApiResponse({ status: 200, description: '成绩列表' })
  findAll(@Query() query: QueryGradesDto) {
    return this.gradesService.findAll(query)
  }

  @Get('stats/:studentId/:term')
  @ApiOperation({ summary: '获取学生成绩统计' })
  @ApiResponse({ status: 200, description: '成绩统计' })
  getStudentStats(@Param('studentId') studentId: string, @Param('term') term: string) {
    return this.gradesService.getStudentStats(studentId, term)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取成绩详情' })
  @ApiResponse({ status: 200, description: '成绩详情' })
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新成绩' })
  @ApiResponse({ status: 200, description: '成绩已更新' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateGradeDto>) {
    return this.gradesService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除成绩' })
  @ApiResponse({ status: 200, description: '成绩已删除' })
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id)
  }

  // ==================== Grade Records API ====================

  @Post('records')
  @ApiOperation({ summary: '创建学生成绩记录（完整成绩单）' })
  @ApiResponse({ status: 201, description: '成绩记录已创建' })
  createRecord(@Body() dto: CreateGradeRecordDto, @Req() req: any) {
    return this.gradeRecordsService.create(dto, req.user.id)
  }

  @Get('records')
  @ApiOperation({ summary: '查询成绩记录列表' })
  @ApiResponse({ status: 200, description: '成绩记录列表' })
  findAllRecords(@Query() query: QueryGradeRecordsDto) {
    return this.gradeRecordsService.findAll(query)
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取成绩记录详情' })
  @ApiResponse({ status: 200, description: '成绩记录详情' })
  findOneRecord(@Param('id') id: string) {
    return this.gradeRecordsService.findOne(id)
  }

  @Put('records/:id')
  @ApiOperation({ summary: '更新成绩记录' })
  @ApiResponse({ status: 200, description: '成绩记录已更新' })
  updateRecord(@Param('id') id: string, @Body() dto: UpdateGradeRecordDto) {
    return this.gradeRecordsService.update(id, dto)
  }

  @Post('records/:id/submit')
  @ApiOperation({ summary: '提交成绩记录审批' })
  @ApiResponse({ status: 200, description: '成绩记录已提交' })
  submitRecord(@Param('id') id: string, @Body() dto: SubmitGradeRecordDto, @Req() req: any) {
    return this.gradeRecordsService.submit(id, dto, req.user.id)
  }

  @Post('records/:id/revoke')
  @ApiOperation({ summary: '撤回成绩记录（48小时内）' })
  @ApiResponse({ status: 200, description: '成绩记录已撤回' })
  revokeRecord(@Param('id') id: string, @Body() dto: RevokeGradeRecordDto, @Req() req: any) {
    return this.gradeRecordsService.revoke(id, dto, req.user.id)
  }

  @Post('records/:id/approve')
  @ApiOperation({ summary: '审批通过成绩记录' })
  @ApiResponse({ status: 200, description: '成绩记录已通过' })
  approveRecord(@Param('id') id: string, @Body() dto: ApproveGradeRecordDto, @Req() req: any) {
    return this.gradeRecordsService.approve(id, dto, req.user.id)
  }

  @Post('records/:id/reject')
  @ApiOperation({ summary: '审批拒绝成绩记录' })
  @ApiResponse({ status: 200, description: '成绩记录已拒绝' })
  rejectRecord(@Param('id') id: string, @Body() dto: ApproveGradeRecordDto, @Req() req: any) {
    return this.gradeRecordsService.reject(id, dto, req.user.id)
  }

  @Delete('records/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除草稿成绩记录' })
  @ApiResponse({ status: 204, description: '成绩记录已删除' })
  removeRecord(@Param('id') id: string) {
    return this.gradeRecordsService.remove(id)
  }

  @Get('records/student/:studentId/history')
  @ApiOperation({ summary: '获取学生历史成绩' })
  @ApiResponse({ status: 200, description: '学生历史成绩' })
  getStudentHistory(@Param('studentId') studentId: string, @Query('academicYear') academicYear?: string) {
    return this.gradeRecordsService.getStudentHistory(studentId, academicYear)
  }

  @Get('records/class/stats')
  @ApiOperation({ summary: '获取班级成绩统计' })
  @ApiResponse({ status: 200, description: '班级成绩统计' })
  getClassStats(@Query() dto: ClassStatsDto) {
    return this.gradeRecordsService.getClassStats(dto)
  }

  // ==================== PDF Generation API ====================

  @Post('pdf/generate')
  @ApiOperation({ summary: '生成成绩单PDF' })
  @ApiResponse({ status: 200, description: 'PDF生成成功，返回下载链接' })
  generatePdf(@Body() dto: GeneratePdfDto, @Req() req: any) {
    return this.gradePdfService.generatePdf(dto, req.user.id)
  }

  @Get('pdf/download/:id')
  @ApiOperation({ summary: '下载成绩单PDF' })
  @ApiResponse({ status: 200, description: 'PDF文件' })
  async downloadPdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const { filepath, filename } = await this.gradePdfService.downloadPdf(id, req.user.id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.sendFile(filepath)
  }

  @Post('pdf/batch')
  @ApiOperation({ summary: '批量生成班级成绩单PDF' })
  @ApiResponse({ status: 200, description: '批量生成成功，返回ZIP下载链接' })
  async generateBatchPdf(@Body() body: { classId: string; academicYear: string; term: string; examName: string }) {
    return this.gradePdfService.generateBatchPdf(body.classId, body.academicYear, body.term, body.examName)
  }

  // ==================== Audit Alerts API ====================

  @Get('alerts')
  @ApiOperation({ summary: '查询审计告警列表' })
  @ApiResponse({ status: 200, description: '审计告警列表' })
  findAllAlerts(@Query() query: QueryAlertsDto) {
    return this.gradeAlertsService.findAll(query)
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: '获取审计告警详情' })
  @ApiResponse({ status: 200, description: '审计告警详情' })
  findOneAlert(@Param('id') id: string) {
    return this.gradeAlertsService.findOne(id)
  }

  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: '确认审计告警' })
  @ApiResponse({ status: 200, description: '审计告警已确认' })
  acknowledgeAlert(@Param('id') id: string, @Body() dto: AcknowledgeAlertDto, @Req() req: any) {
    return this.gradeAlertsService.acknowledge(id, dto, req.user.id)
  }

  @Put('alerts/:id/status')
  @ApiOperation({ summary: '更新审计告警状态' })
  @ApiResponse({ status: 200, description: '审计告警状态已更新' })
  updateAlertStatus(@Param('id') id: string, @Body() dto: UpdateAlertStatusDto, @Req() req: any) {
    return this.gradeAlertsService.updateStatus(id, dto, req.user.id)
  }

  @Get('alerts/open/count')
  @ApiOperation({ summary: '获取未处理告警数量' })
  @ApiResponse({ status: 200, description: '未处理告警数量' })
  getOpenAlertsCount(@Req() req: any) {
    return this.gradeAlertsService.getOpenAlertsCount(req.user.id)
  }
}