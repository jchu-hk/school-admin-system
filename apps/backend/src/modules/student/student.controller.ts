import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryDto,
  CreateClassAllocationDto,
  ClassAllocationQueryDto,
} from './dto/student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('学生管理 (Student Management)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ============================================================
  // 学生档案 CRUD
  // ============================================================

  @Post()
  @ApiOperation({ summary: '创建学生档案（自动生成学号）' })
  async create(
    @Body() dto: CreateStudentDto,
    @Query('userId') userId?: string,
  ) {
    const student = await this.studentService.create(dto, userId);
    return {
      code: 0,
      message: 'created',
      data: student,
    };
  }

  @Get()
  @ApiOperation({ summary: '获取学生列表' })
  async findAll(@Query() query: StudentQueryDto) {
    const result = await this.studentService.findAll(query);
    return {
      code: 0,
      message: 'success',
      data: {
        items: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1,
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学生详情' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const student = await this.studentService.findOneWithDetails(id);
    return {
      code: 0,
      message: 'success',
      data: student,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新学生档案' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @Query('userId') userId?: string,
  ) {
    const student = await this.studentService.update(id, dto, userId);
    return {
      code: 0,
      message: 'success',
      data: student,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除学生档案（软删除）' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.studentService.remove(id);
    return {
      code: 0,
      message: 'success',
      data: { id, deleted_at: new Date().toISOString() },
    };
  }

  // ============================================================
  // 班级分配管理
  // ============================================================

  @Post(':id/classes')
  @ApiOperation({ summary: '为学生分配班级' })
  async createClassAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateClassAllocationDto,
    @Query('userId') userId?: string,
  ) {
    const allocation = await this.studentService.createClassAllocation(
      id,
      dto,
      userId,
    );
    return {
      code: 0,
      message: 'created',
      data: allocation,
    };
  }

  @Get(':id/classes')
  @ApiOperation({ summary: '获取学生班级分配历史' })
  async getStudentAllocations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ClassAllocationQueryDto,
  ) {
    const allocations = await this.studentService.findStudentAllocations(
      id,
      query,
    );
    const student = await this.studentService.findOne(id);
    return {
      code: 0,
      message: 'success',
      data: {
        student_id: student.studentId,
        student_name: student.nameZh,
        allocations: allocations.map((a) => ({
          id: a.id,
          class_id: a.classId,
          class_name: (a.class as any)?.name,
          academic_year: a.academicYearStr,
          allocation_type: a.allocationType,
          effective_date: a.effectiveDate,
          end_date: a.endDate,
          is_current: !a.endDate,
        })),
      },
    };
  }
}

@ApiTags('班级学生管理 (Class Students)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/classes')
export class ClassStudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get(':id/students')
  @ApiOperation({ summary: '获取班级学生列表（按学年筛选）' })
  async getClassStudents(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('academic_year') academicYear?: string,
  ) {
    const result = await this.studentService.findClassStudents(
      id,
      academicYear,
    );
    return {
      code: 0,
      message: 'success',
      data: result,
    };
  }
}

@ApiTags('学年管理 (Academic Years)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/academic-years')
export class AcademicYearController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @ApiOperation({ summary: '获取学年列表' })
  async findAll() {
    const years = await this.studentService.findAcademicYears();
    return {
      code: 0,
      message: 'success',
      data: years.map((y) => ({
        id: y.id,
        year: y.year,
        start_date: y.startDate,
        end_date: y.endDate,
        is_current: y.isCurrent,
        status: y.status,
      })),
    };
  }
}
