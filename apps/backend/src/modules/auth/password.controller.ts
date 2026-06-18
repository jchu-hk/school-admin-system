import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkStudentDto } from './dto/link-student.dto';

@ApiTags('认证 - 密码管理')
@Controller('auth')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  /**
   * Set or update password
   */
  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置密码（首次登录或修改密码）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '密码设置成功',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '密码设置成功',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '密码强度不足或两次密码不一致',
    schema: {
      example: {
        success: false,
        code: 'PASSWORD_MISMATCH',
        message: '两次密码输入不一致',
        data: null,
      },
    },
  })
  async setPassword(
    @Request() req,
    @Body() dto: SetPasswordDto,
  ) {
    return this.passwordService.setPassword(req.user.id, dto);
  }

  /**
   * Get password status for current user
   */
  @Get('password-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取密码状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '密码状态',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '操作成功',
        data: {
          isPasswordSet: true,
          mustSetPassword: false,
          passwordExpiresAt: '2026-09-15T00:00:00Z',
        },
      },
    },
  })
  async getPasswordStatus(@Request() req) {
    return this.passwordService.getPasswordStatus(req.user.id);
  }

  /**
   * Request OTP for password reset
   */
  @Post('request-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '请求密码重置验证码' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证码已发送',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '验证码已发送',
        data: null,
      },
    },
  })
  async requestResetOtp(@Body('phone') phone: string) {
    return this.passwordService.requestResetOtp(phone);
  }

  /**
   * Reset password with OTP
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '密码重置成功',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '密码重置成功',
        data: null,
      },
    },
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }

  /**
   * Link a student to parent account
   */
  @Post('link-student')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '关联学生账号' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '关联成功',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '关联成功',
        data: {
          id: 'uuid',
          studentId: 'STU001',
          relationship: 'father',
          isPrimary: false,
          verifiedAt: '2026-06-18T10:00:00Z',
        },
      },
    },
  })
  async linkStudent(@Request() req, @Body() dto: LinkStudentDto) {
    return this.passwordService.linkStudent(req.user.id, dto);
  }

  /**
   * Unlink a student
   */
  @Delete('link-student/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '解除学生关联' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '已解除关联',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '已解除关联',
        data: null,
      },
    },
  })
  async unlinkStudent(@Request() req, @Param('id') id: string) {
    return this.passwordService.unlinkStudent(req.user.id, id);
  }

  /**
   * Get all linked students
   */
  @Get('linked-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取已关联学生列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码（从1开始）' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页条数（最大100）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '关联学生列表',
    schema: {
      example: {
        success: true,
        code: 'SUCCESS',
        message: '操作成功',
        data: {
          items: [
            {
              id: 'uuid',
              studentId: 'STU001',
              studentName: '陈小明',
              relationship: 'father',
              isPrimary: true,
              verifiedAt: '2026-06-01T10:00:00Z',
            },
          ],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 1,
            totalPages: 1,
          },
        },
      },
    },
  })
  async getLinkedStudents(
    @Request() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const pageSizeNum = Math.min(parseInt(pageSize || '20', 10), 100);
    return this.passwordService.getLinkedStudents(req.user.id, pageNum, pageSizeNum);
  }
}
