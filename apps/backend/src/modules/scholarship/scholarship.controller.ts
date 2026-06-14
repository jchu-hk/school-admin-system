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
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScholarshipService } from './scholarship.service';
import { Scholarship } from './scholarship.entity';
import { ScholarshipApplication } from './scholarship-application.entity';
import {
  CreateScholarshipDto,
  UpdateScholarshipDto,
  ScholarshipQueryDto,
  ApplyScholarshipDto,
  ReviewScholarshipApplicationDto,
  ScholarshipApplicationQueryDto,
} from './dto/scholarship.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('奖学金管理')
@Controller('scholarships')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  // ============ Scholarships ============

  @Post()
  @ApiOperation({ summary: '创建奖学金' })
  @ApiResponse({
    status: 201,
    description: '奖学金创建成功',
    type: Scholarship,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  create(@Body() createDto: CreateScholarshipDto) {
    return this.scholarshipService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取奖学金列表' })
  @ApiResponse({ status: 200, description: '获取奖学金列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.STUDENT,
  )
  findAll(@Query() query: ScholarshipQueryDto) {
    return this.scholarshipService.findAll(query);
  }

  @Get('applications')
  @ApiOperation({ summary: '获取奖学金申请列表' })
  @ApiResponse({ status: 200, description: '获取奖学金申请列表成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllApplications(@Query() query: ScholarshipApplicationQueryDto) {
    return this.scholarshipService.findAllApplications(query);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: '获取奖学金申请详情' })
  @ApiResponse({
    status: 200,
    description: '获取申请详情成功',
    type: ScholarshipApplication,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneApplication(@Param('id', ParseUUIDPipe) id: string) {
    return this.scholarshipService.findOneApplication(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取奖学金详情' })
  @ApiResponse({
    status: 200,
    description: '获取奖学金详情成功',
    type: Scholarship,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.STUDENT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.scholarshipService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新奖学金' })
  @ApiResponse({
    status: 200,
    description: '奖学金更新成功',
    type: Scholarship,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateScholarshipDto,
  ) {
    return this.scholarshipService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除奖学金' })
  @ApiResponse({ status: 204, description: '奖学金删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.scholarshipService.remove(id);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: '申请奖学金' })
  @ApiResponse({
    status: 201,
    description: '申请成功',
    type: ScholarshipApplication,
  })
  @Roles(UserRole.STUDENT, UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_STAFF)
  apply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() applyDto: ApplyScholarshipDto,
  ) {
    return this.scholarshipService.apply(id, applyDto);
  }

  @Put('applications/:id/review')
  @ApiOperation({ summary: '审核奖学金申请' })
  @ApiResponse({
    status: 200,
    description: '审核成功',
    type: ScholarshipApplication,
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewScholarshipApplicationDto,
  ) {
    return this.scholarshipService.reviewApplication(id, reviewDto);
  }
}
