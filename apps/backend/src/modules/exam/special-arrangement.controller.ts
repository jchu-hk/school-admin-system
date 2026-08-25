import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { SpecialArrangementService } from './special-arrangement.service';
import {
  SpecialExamArrangement,
  SpecialArrangementApproval,
  SpecialArrangementStatus,
} from './special-arrangement.entity';
import {
  CreateSpecialArrangementDto,
  ApproveArrangementDto,
  SpecialArrangementQueryDto,
} from './dto/special-arrangement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

/** 可操作特别安排的角色：学校管理/职员 + 教师 */
const STAFF_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
];

const ALL_STAFF_ROLES: UserRole[] = [...STAFF_ROLES, UserRole.TEACHER];

@ApiTags('特别考试安排')
@Controller('exam/special-arrangements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SpecialArrangementController {
  constructor(
    private readonly specialArrangementService: SpecialArrangementService,
  ) {}

  @Post()
  @ApiOperation({ summary: '申请特别考试安排' })
  @ApiResponse({
    status: 201,
    description: '申请创建成功',
    type: SpecialExamArrangement,
  })
  @ApiResponse({
    status: 422,
    description: '需 HKEAA 审批类型未标记',
  })
  @Roles(...ALL_STAFF_ROLES)
  create(
    @Body() dto: CreateSpecialArrangementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.specialArrangementService.create(dto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: '安排单列表' })
  @ApiResponse({ status: 200, description: '获取安排单列表成功' })
  @Roles(...ALL_STAFF_ROLES)
  findAll(@Query() query: SpecialArrangementQueryDto) {
    return this.specialArrangementService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '安排详情（含审批记录）' })
  @ApiResponse({ status: 200, description: '获取安排详情成功' })
  @ApiResponse({ status: 404, description: '安排单不存在' })
  @Roles(...ALL_STAFF_ROLES)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialArrangementService.findWithApprovals(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '修改安排（DRAFT/PENDING_APPROVAL/REJECTED）' })
  @ApiResponse({ status: 200, description: '修改成功', type: SpecialExamArrangement })
  @ApiResponse({ status: 404, description: '安排单不存在' })
  @ApiResponse({ status: 409, description: '状态不可修改' })
  @Roles(...ALL_STAFF_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateSpecialArrangementDto>,
    @CurrentUser() user: { id?: string },
  ) {
    return this.specialArrangementService.update(id, dto, user?.id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交审批（DRAFT/REJECTED -> PENDING_APPROVAL）' })
  @ApiResponse({ status: 200, description: '提交成功', type: SpecialExamArrangement })
  @Roles(...ALL_STAFF_ROLES)
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialArrangementService.submit(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过（学校级 / HKEAA 多级）' })
  @ApiResponse({
    status: 200,
    description: '审批成功（或仍有后续审批级别保持待审批）',
    type: SpecialExamArrangement,
  })
  @Roles(...STAFF_ROLES)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveArrangementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.specialArrangementService.approve(id, dto, user?.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '拒绝安排（-> REJECTED）' })
  @ApiResponse({ status: 200, description: '拒绝成功', type: SpecialExamArrangement })
  @Roles(...STAFF_ROLES)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveArrangementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.specialArrangementService.reject(id, dto, user?.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '标记当日使用中（APPROVED -> ACTIVE）' })
  @ApiResponse({ status: 200, description: '激活成功', type: SpecialExamArrangement })
  @Roles(...ALL_STAFF_ROLES)
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialArrangementService.activate(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '标记完成（APPROVED/ACTIVE -> COMPLETED）' })
  @ApiResponse({ status: 200, description: '完成成功', type: SpecialExamArrangement })
  @Roles(...STAFF_ROLES)
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialArrangementService.complete(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消（DRAFT/PENDING_APPROVAL -> CANCELLED）' })
  @ApiResponse({ status: 200, description: '取消成功', type: SpecialExamArrangement })
  @Roles(...ALL_STAFF_ROLES)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialArrangementService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除安排（仅 DRAFT）' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialArrangementService.remove(id);
  }
}
