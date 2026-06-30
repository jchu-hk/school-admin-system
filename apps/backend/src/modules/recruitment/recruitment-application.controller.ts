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
import { RecruitmentApplicationService } from './recruitment-application.service';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  RejectApplicationDto,
  ApplicationQueryDto,
} from './dto/application.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('招聘管理 - 申请管理')
@ApiBearerAuth()
@Controller('v1/recruitment/applications')
export class RecruitmentApplicationController {
  constructor(private readonly applicationService: RecruitmentApplicationService) {}

  @Post()
  @ApiOperation({ summary: '提交申请' })
  @ApiResponse({ status: 201, description: '提交成功' })
  async create(@Body() dto: CreateApplicationDto) {
    const application = await this.applicationService.create(dto);
    return {
      success: true,
      data: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        submittedAt: application.submittedAt,
      },
      message: '提交成功',
    };
  }

  @Get()
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '列出所有申请' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: ApplicationQueryDto) {
    const result = await this.applicationService.findAll(query);
    return {
      success: true,
      data: result,
      message: '获取成功',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取申请详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const application = await this.applicationService.findOne(id);
    return {
      success: true,
      data: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        applicantName: application.applicantName,
        email: application.email,
        phone: application.phone,
        position: application.position
          ? {
              id: application.position.id,
              title: application.position.title,
              subject: application.position.subject,
            }
          : null,
        cvUrl: application.cvUrl,
        coverLetter: application.coverLetter,
        education: application.education,
        experience: application.experience,
        status: application.status,
        screeningNotes: application.screeningNotes,
        rejectionReason: application.rejectionReason,
        submittedAt: application.submittedAt,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      },
      message: '获取成功',
    };
  }

  @Put(':id/status')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新申请状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.applicationService.updateStatus(id, dto);
    return {
      success: true,
      data: {
        id: application.id,
        status: application.status,
        updatedAt: application.updatedAt,
      },
      message: '更新成功',
    };
  }

  @Post(':id/reject')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '拒绝申请' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    const application = await this.applicationService.reject(id, dto);
    return {
      success: true,
      data: {
        id: application.id,
        status: application.status,
        rejectedAt: application.rejectedAt,
      },
      message: '拒绝成功',
    };
  }
}
