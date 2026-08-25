import {
  Controller,
  Post,
  Get,
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
import { ConsentService } from '../services/consent.service';
import { CreateConsentDto, ConsentQueryDto } from '../dto/consent.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('同意管理（PDPO Consent）')
@Controller('compliance/consents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: '授予同意（记录版本、渠道、签署人）' })
  @ApiCreatedResponse({ description: '同意记录已创建（granted）' })
  async grant(@Request() req: any, @Body() dto: CreateConsentDto) {
    const user = req.user as any;
    return this.consentService.grant(user, dto, user.schoolId);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '同意记录分页查询' })
  @ApiOkResponse({ description: '{ items[], total, page, pageSize }' })
  async list(@Request() req: any, @Query() query: ConsentQueryDto) {
    const user = req.user as any;
    return this.consentService.list(user, query);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: '撤回同意（granted → revoked）' })
  @ApiParam({ name: 'id', description: '同意记录ID' })
  async revoke(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as any;
    return this.consentService.revoke(id, user);
  }

  @Post(':id/expire')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: '标记同意过期（granted → expired）' })
  @ApiParam({ name: 'id', description: '同意记录ID' })
  async expire(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as any;
    return this.consentService.expire(id, user);
  }
}
