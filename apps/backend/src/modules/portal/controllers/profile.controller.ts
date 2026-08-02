import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('门户 — 个人档案')
@Controller('portal/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: '查看个人档案' })
  @ApiResponse({ status: 200, description: '返回个人档案' })
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.id, req.user.role);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '编辑个人档案（仅student角色，有限字段）' })
  @ApiResponse({ status: 200, description: '个人档案更新成功' })
  @Roles(UserRole.STUDENT)
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req) {
    return this.profileService.updateProfile(
      req.user.id,
      dto,
      req.ip,
    );
  }
}
