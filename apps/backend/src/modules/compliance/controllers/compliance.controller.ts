import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ComplianceCheckService } from '../services/compliance-check.service';
import {
  ComplianceCheckDto,
  ComplianceCheckQueryDto,
  ComplianceCheckResultDto,
} from '../dto/compliance.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('PDPO 隐私合规（F-COMP-001）')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceCheckService) {}

  @Post('check')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'PDPO 合规判定',
    description:
      '在敏感数据访问/导出/同步推送前调用，逐项判定 目的限制/资料最小化/存取控制/保留期限，全部通过才 allow。',
  })
  @ApiCreatedResponse({
    description: '判定结果（decision=allow/deny + check_items + reason）',
    type: ComplianceCheckResultDto,
  })
  async check(
    @Request() req: any,
    @Body() dto: ComplianceCheckDto,
    @Ip() ip: string,
  ) {
    const user = req.user as any;
    return this.complianceService.check(user, dto, ip);
  }

  @Get('checks')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '合规检查记录分页查询' })
  @ApiOkResponse({
    description: '{ items[], total, page, pageSize }（items 含 check_id/decision/reason 等）',
  })
  async list(@Query() query: ComplianceCheckQueryDto) {
    return this.complianceService.list(query);
  }
}
