import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GradesService } from './grades.service'
import { CreateGradeDto, QueryGradesDto } from './dto/grade.dto'

@ApiTags('grades')
@Controller('grades')
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @ApiOperation({ summary: '创建成绩记录' })
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
  getStudentStats(
    @Param('studentId') studentId: string,
    @Param('term') term: string,
  ) {
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
}
