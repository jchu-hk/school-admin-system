import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { WitnessService } from '../services/witness.service';
import {
  CreateWitnessVerificationDto,
  ConfirmWitnessDto,
  RejectWitnessDto,
  EscalateWitnessDto,
  CancelWitnessDto,
} from '../dto/witness.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('双人见证（F-COMP-002）')
@Controller('witness')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WitnessController {
  constructor(private readonly witnessService: WitnessService) {}

  @Post('verifications')
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: '触发双人见证（可自动触发）' })
  @ApiCreatedResponse({ description: '见证单已创建（await_first/await_second）' })
  async createVerification(
    @Request() req: any,
    @Body() dto: CreateWitnessVerificationDto,
  ) {
    const user = req.user as any;
    return this.witnessService.create(user, dto, user.schoolId);
  }

  @Get('pending')
  @ApiOperation({ summary: '当前用户待处理的见证任务（App/角标）' })
  @ApiOkResponse({ description: '{ count, items[] }' })
  async getMyPending(@Request() req: any) {
    const user = req.user as any;
    return this.witnessService.getMyPending(user);
  }

  @Get('verifications/:id')
  @ApiOperation({ summary: '见证单详情（含步骤）' })
  @ApiParam({ name: 'id', description: '见证单ID' })
  async getVerification(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as any;
    return this.witnessService.findById(id, user);
  }

  @Post('verifications/:id/confirm')
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: '见证人确认见证（须本人短信 OTP）' })
  async confirm(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmWitnessDto,
    @Ip() ip: string,
  ) {
    const user = req.user as any;
    return this.witnessService.confirm(id, user, dto, ip);
  }

  @Post('verifications/:id/reject')
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: '见证人拒绝见证（记录原因，退回申请人）' })
  async reject(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectWitnessDto,
    @Ip() ip: string,
  ) {
    const user = req.user as any;
    return this.witnessService.reject(id, user, dto, ip);
  }

  @Post('verifications/:id/escalate')
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: '升级至校务主任（可指定替代见证人）' })
  async escalate(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateWitnessDto,
  ) {
    const user = req.user as any;
    return this.witnessService.escalate(id, user, dto);
  }

  @Post('verifications/:id/cancel')
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_STAFF,
  )
  @ApiOperation({ summary: '作废见证单（发起人/审批角色）' })
  async cancel(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelWitnessDto,
  ) {
    const user = req.user as any;
    return this.witnessService.cancel(id, user, dto);
  }
}
