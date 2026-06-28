import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchoolInfoService } from './school-info.service';
import { SchoolInfo } from './school-info.entity';
import {
  CreateSchoolInfoDto,
  UpdateSchoolInfoDto,
  SchoolInfoQueryDto,
} from './dto/school-info.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('学校信息')
@Controller('school-info')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolInfoController {
  constructor(private readonly schoolInfoService: SchoolInfoService) {}

  @Get()
  @ApiOperation({ summary: '获取学校信息列表' })
  @ApiResponse({ status: 200, description: '获取学校列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findAll(@Query() query: SchoolInfoQueryDto) {
    return this.schoolInfoService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: '获取启用的学校列表' })
  @ApiResponse({ status: 200, description: '获取启用学校列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findActive() {
    return this.schoolInfoService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学校信息详情' })
  @ApiResponse({
    status: 200,
    description: '获取学校详情成功',
    type: SchoolInfo,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolInfoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建学校信息' })
  @ApiResponse({ status: 201, description: '学校创建成功', type: SchoolInfo })
  @Roles(UserRole.SYSTEM_ADMIN)
  create(@Body() createDto: CreateSchoolInfoDto, @Request() req: any) {
    return this.schoolInfoService.create(createDto, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新学校信息' })
  @ApiResponse({ status: 200, description: '学校更新成功', type: SchoolInfo })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSchoolInfoDto,
    @Request() req: any,
  ) {
    return this.schoolInfoService.update(id, updateDto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除学校信息' })
  @ApiResponse({ status: 204, description: '学校删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolInfoService.remove(id);
  }
}
