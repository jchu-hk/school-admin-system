import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { LeaveAiVerificationService } from './leave-ai-verification.service';
import { LeaveService } from './leave.service';
import { AiVerifyDto, AiVerifyResponseDto } from './dto/ai-verify.dto';
import {
  CertificateVerifyResponseDto,
  UploadCertificateDto,
} from './dto/certificate-verify.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('请假AI核验')
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeaveAiVerificationController {
  constructor(
    private readonly aiVerificationService: LeaveAiVerificationService,
    private readonly leaveService: LeaveService,
  ) {}

  /**
   * AI核验请假申请
   * POST /api/leaves/ai-verify
   */
  @Post('ai-verify')
  @ApiOperation({ summary: 'AI核验请假申请' })
  @ApiResponse({
    status: 200,
    description: '核验成功',
    type: AiVerifyResponseDto,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async verifyLeave(
    @Body() dto: AiVerifyDto,
    @Request() _req,
  ): Promise<AiVerifyResponseDto> {
    // 如果提供了leaveId，获取请假记录信息补充核验数据
    if (dto.leaveId) {
      try {
        const leave = await this.leaveService.findOne(dto.leaveId);
        // 补充申请人ID（如果未提供）
        if (!dto.applicantId) {
          dto.applicantId = leave.applicantId;
        }
        // 补充日期（如果未提供）
        if (!dto.startDate) {
          dto.startDate = leave.startDate.toISOString().split('T')[0];
        }
        if (!dto.endDate) {
          dto.endDate = leave.endDate.toISOString().split('T')[0];
        }
      } catch (error) {
        // leave不存在，继续使用提供的数据
      }
    }

    const result = await this.aiVerificationService.verifyLeave(dto);

    // 如果提供了leaveId，保存核验结果
    if (dto.leaveId) {
      await this.aiVerificationService.saveVerificationResult(dto.leaveId, {
        verified: result.verified,
        risk: result.risk,
        message: result.message,
        recognizedType: result.recognizedType,
        anomalyFlags: result.details?.anomalyFlags || [],
        requireMedicalCertificate: result.requireMedicalCertificate,
        verifiedAt: result.verifiedAt,
        details: result.details
          ? {
              historicalPattern: result.details.historicalPattern,
              recommendations: result.details.recommendations,
            }
          : undefined,
      });
    }

    return result;
  }

  /**
   * 上传并验证医生证明
   * POST /api/leaves/verify-certificate
   */
  @Post('verify-certificate')
  @ApiOperation({ summary: '上传并验证医生证明' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: '验证成功',
    type: CertificateVerifyResponseDto,
  })
  @Roles(
    UserRole.PARENT,
    UserRole.TEACHER,
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
  )
  @UseInterceptors(FileInterceptor('file'))
  async verifyCertificate(
    @UploadedFile() file: any,
    @Body() dto: UploadCertificateDto,
    @Request() _req,
  ): Promise<CertificateVerifyResponseDto> {
    if (!file) {
      return {
        valid: false,
        status: 'error',
        message: '请上传证明图片',
        confidence: 0,
        riskFlags: ['未上传文件'],
        verifiedAt: new Date(),
      };
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        status: 'invalid',
        message: '只支持 JPG、PNG、WebP 格式的图片',
        confidence: 0,
        riskFlags: ['文件格式不支持'],
        verifiedAt: new Date(),
      };
    }

    // 验证文件大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        status: 'invalid',
        message: '图片大小不能超过 10MB',
        confidence: 0,
        riskFlags: ['文件过大'],
        verifiedAt: new Date(),
      };
    }

    // 执行验证
    const result = await this.aiVerificationService.verifyCertificate(
      file.buffer,
      file.originalname,
    );

    // 如果提供了leaveId，保存验证结果
    if (dto.leaveId && result.valid) {
      // 在实际项目中，这里应该上传文件到云存储并获取URL
      const certificateUrl = `/uploads/certificates/${dto.leaveId}/${file.originalname}`;

      await this.aiVerificationService.saveCertificateResult(
        dto.leaveId,
        {
          valid: result.valid,
          status: result.status,
          message: result.message,
          confidence: result.confidence,
          riskFlags: result.riskFlags,
          details: result.details,
          verifiedAt: result.verifiedAt,
        },
        certificateUrl,
      );
    }

    return result;
  }

  /**
   * 获取请假的核验结果
   * GET /api/leaves/:id/verification
   */
  @Get(':id/verification')
  @ApiOperation({ summary: '获取请假核验结果' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async getVerificationResult(@Param('id', ParseUUIDPipe) id: string) {
    const leave = await this.leaveService.findOne(id);

    return {
      leaveId: leave.id,
      aiVerifyResult: leave.aiVerifyResult,
      certificateVerifyResult: leave.certificateVerifyResult,
      certificateUrl: leave.certificateUrl,
      verifiedAt: leave.verifiedAt,
    };
  }

  /**
   * 批量AI核验
   * POST /api/leaves/ai-verify/batch
   */
  @Post('ai-verify/batch')
  @ApiOperation({ summary: '批量AI核验请假申请' })
  @ApiResponse({ status: 200, description: '批量核验成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async batchVerifyLeaves(
    @Body() dtos: AiVerifyDto[],
  ): Promise<{ results: AiVerifyResponseDto[]; summary: any }> {
    const results: AiVerifyResponseDto[] = [];

    for (const dto of dtos) {
      const result = await this.aiVerificationService.verifyLeave(dto);
      results.push(result);

      // 保存核验结果
      if (dto.leaveId) {
        await this.aiVerificationService.saveVerificationResult(dto.leaveId, {
          verified: result.verified,
          risk: result.risk,
          message: result.message,
          recognizedType: result.recognizedType,
          anomalyFlags: result.details?.anomalyFlags || [],
          requireMedicalCertificate: result.requireMedicalCertificate,
          verifiedAt: result.verifiedAt,
        });
      }
    }

    // 汇总统计
    const summary = {
      total: results.length,
      verified: results.filter((r) => r.verified).length,
      failed: results.filter((r) => !r.verified).length,
      riskDistribution: {
        low: results.filter((r) => r.risk === 'low').length,
        medium: results.filter((r) => r.risk === 'medium').length,
        high: results.filter((r) => r.risk === 'high').length,
      },
      requireMedicalCertificate: results.filter(
        (r) => r.requireMedicalCertificate,
      ).length,
    };

    return { results, summary };
  }
}
