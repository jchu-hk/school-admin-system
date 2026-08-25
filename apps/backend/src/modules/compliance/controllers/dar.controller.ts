import {
  Controller,
  Post,
  Get,
  Patch,
  Query,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DataAccessRequestService } from '../services/dar.service';
import {
  CreateDataAccessRequestDto,
  ReviewDataAccessRequestDto,
  CompleteDataAccessRequestDto,
  DataAccessRequestQueryDto,
} from '../dto/dar.dto';
import { DataAccessRequestStatus } from '../entities/data-access-request.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('资料当事人权利（PDPO DAR）')
@Controller('compliance/data-access-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DataAccessRequestController {
  constructor(private readonly darService: DataAccessRequestService) {}

  @Post()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: '提交资料当事人权利申请（查询/更正/删除个人资料）' })
  @ApiCreatedResponse({ description: '申请已创建（submitted）' })
  async create(@Request() req: any, @Body() dto: CreateDataAccessRequestDto) {
    const user = req.user as any;
    return this.darService.create(user, dto, user.schoolId);
  }

  @Get()
  @ApiOperation({ summary: '申请列表（校级角色看全校，家长/学生看自己）' })
  async list(@Request() req: any, @Query() query: DataAccessRequestQueryDto) {
    const user = req.user as any;
    return this.darService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '申请详情' })
  @ApiParam({ name: 'id', description: '申请ID' })
  async findById(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as any;
    return this.darService.findById(id, user);
  }

  @Post(':id/review')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '进入审批（submitted → under_review）' })
  async startReview(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as any;
    return this.darService.startReview(id, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '审批通过（under_review → approved）' })
  async approve(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDataAccessRequestDto,
  ) {
    const user = req.user as any;
    return this.darService.approve(id, user, dto.note);
  }

  @Post(':id/reject')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '审批拒绝（submitted/under_review → rejected，须提供原因）' })
  async reject(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDataAccessRequestDto,
  ) {
    const user = req.user as any;
    return this.darService.reject(id, user, dto.note);
  }

  @Post(':id/complete')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '批准后执行响应/更正/删除（approved → completed）' })
  async complete(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteDataAccessRequestDto,
  ) {
    const user = req.user as any;
    return this.darService.complete(id, user, dto.responsePayload);
  }

  @Post(':id/withdraw')
  @ApiOperation({
    summary: '申请人撤回（submitted → withdrawn，仅未进入审批时）',
    description: '当前状态=' + DataAccessRequestStatus.SUBMITTED,
  })
  async withdraw(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as any;
    return this.darService.withdraw(id, user);
  }
}
