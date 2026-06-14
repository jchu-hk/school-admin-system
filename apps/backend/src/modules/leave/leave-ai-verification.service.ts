import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { LeaveApplication, LeaveType } from './leave.entity';
import { AiVerifyDto, AiVerifyResponseDto } from './dto/ai-verify.dto';
import { CertificateVerifyResponseDto } from './dto/certificate-verify.dto';

/**
 * AI核验服务
 * 负责请假申请的智能核验和医生证明验证
 */
@Injectable()
export class LeaveAiVerificationService {
  private readonly logger = new Logger(LeaveAiVerificationService.name);

  constructor(
    @InjectRepository(LeaveApplication)
    private leaveRepository: Repository<LeaveApplication>,
  ) {}

  /**
   * AI核验请假申请
   * @param dto 核验请求数据
   * @returns 核验结果
   */
  async verifyLeave(dto: AiVerifyDto): Promise<AiVerifyResponseDto> {
    this.logger.log(`AI核验请假申请: ${JSON.stringify(dto)}`);

    const anomalyFlags: string[] = [];
    const recommendations: string[] = [];
    let requireMedicalCertificate = false;
    const recognizedType = this.recognizeLeaveType(dto.type, dto.reason);

    // 1. 分析请假类型与理由的匹配度
    const typeReasonMatch = this.analyzeTypeReasonMatch(dto.type, dto.reason);
    if (!typeReasonMatch.match) {
      anomalyFlags.push(
        `请假类型与理由不匹配: 填写的是${this.getLeaveTypeName(dto.type)}但理由描述的是${typeReasonMatch.recognizedType}`,
      );
      recommendations.push('建议确认请假类型是否正确');
    }

    // 2. 分析请假天数异常
    const daysAnalysis = this.analyzeDaysAnomaly(dto.type, dto.days);
    anomalyFlags.push(...daysAnalysis.flags);
    recommendations.push(...daysAnalysis.recommendations);

    // 3. 分析历史请假记录
    const historyAnalysis = dto.applicantId
      ? await this.analyzeHistoricalPattern(dto.applicantId, dto.type)
      : null;

    if (historyAnalysis) {
      anomalyFlags.push(...historyAnalysis.flags);
      recommendations.push(...historyAnalysis.recommendations);
    }

    // 4. 病假自动要求医生证明
    if (dto.type === LeaveType.SICK && dto.days >= 1) {
      requireMedicalCertificate = true;
      recommendations.push('病假1天及以上建议上传医生证明');
    }

    // 5. 敏感日期检测（周一/周五/节假日附近）
    if (dto.startDate) {
      const dateFlags = this.analyzeSensitiveDates(dto.startDate, dto.endDate);
      anomalyFlags.push(...dateFlags.flags);
      recommendations.push(...dateFlags.recommendations);
    }

    // 6. 计算风险等级
    const risk = this.calculateRiskLevel(
      anomalyFlags,
      dto.type,
      dto.days,
      historyAnalysis,
    );

    // 7. 生成核验结果
    const verified = risk !== 'high';
    const message = this.generateVerificationMessage(
      risk,
      verified,
      anomalyFlags,
    );

    const result: AiVerifyResponseDto = {
      verified,
      risk,
      message,
      recognizedType,
      requireMedicalCertificate,
      verifiedAt: new Date(),
      details: {
        anomalyFlags,
        recommendations,
        historicalPattern: historyAnalysis?.pattern,
      },
    };

    this.logger.log(`AI核验完成: risk=${risk}, verified=${verified}`);
    return result;
  }

  /**
   * 验证医生证明
   * @param imageBuffer 图片Buffer
   * @param originalName 原始文件名
   * @returns 验证结果
   */
  async verifyCertificate(
    imageBuffer: Buffer,
    originalName: string,
  ): Promise<CertificateVerifyResponseDto> {
    this.logger.log(
      `验证医生证明: ${originalName}, 大小: ${imageBuffer.length} bytes`,
    );

    const riskFlags: string[] = [];

    try {
      // 1. OCR文字识别（模拟）
      const ocrResult = await this.performOcr(imageBuffer, originalName);

      // 2. 解析证明内容
      const parsed = this.parseCertificateContent(ocrResult.text);

      // 3. 验证证明真实性
      const validation = this.validateCertificate(parsed, ocrResult.text);

      // 4. 检查风险标记
      if (validation.suspiciousFlags.length > 0) {
        riskFlags.push(...validation.suspiciousFlags);
      }

      // 5. 生成验证结果
      const isValid = validation.isValid && riskFlags.length === 0;
      const confidence = Math.max(0, Math.min(1, validation.confidence));

      let status: 'verified' | 'invalid' | 'suspicious' | 'error';
      let message: string;

      if (!ocrResult.success) {
        status = 'error';
        message = '无法识别证明内容，请确保图片清晰';
      } else if (!isValid) {
        status = riskFlags.length > 0 ? 'suspicious' : 'invalid';
        message =
          riskFlags.length > 0
            ? `证明内容存在疑问: ${riskFlags.join('; ')}`
            : '证明内容验证未通过';
      } else {
        status = 'verified';
        message = '医生证明验证通过';
      }

      return {
        valid: isValid && status !== 'error',
        status,
        message,
        details: {
          hospitalName: parsed.hospitalName,
          doctorName: parsed.doctorName,
          diagnosisDate: parsed.diagnosisDate,
          patientName: parsed.patientName,
          suggestedRestDays: parsed.suggestedRestDays,
          certificateType: parsed.certificateType,
          certificateNumber: parsed.certificateNumber,
          rawOcrText: ocrResult.text,
        },
        confidence,
        riskFlags,
        verifiedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`证明验证失败: ${error.message}`);
      return {
        valid: false,
        status: 'error',
        message: `验证过程出错: ${error.message}`,
        confidence: 0,
        riskFlags: ['验证系统错误'],
        verifiedAt: new Date(),
      };
    }
  }

  /**
   * 保存核验结果到请假记录
   */
  async saveVerificationResult(
    leaveId: string,
    result: AiVerifyResponseDto,
  ): Promise<void> {
    const verifyResultStr = result.verified ? 'VERIFIED' : 'MANUAL_REVIEW_REQUIRED';
    await this.leaveRepository.update(leaveId, {
      aiVerifyResult: verifyResultStr,
      verifiedAt: new Date(),
    });
  }

  /**
   * 保存证明验证结果到请假记录
   */
  async saveCertificateResult(
    leaveId: string,
    result: CertificateVerifyResponseDto,
    certificateUrl: string,
  ): Promise<void> {
    await this.leaveRepository.update(leaveId, {
      certificateVerifyResult: result.status,
      certificateUrl,
      verifiedAt: new Date(),
    });
  }

  // ==================== 私有方法 ====================

  /**
   * 识别请假类型（基于理由文本）
   */
  private recognizeLeaveType(type: LeaveType, reason: string): string {
    const reasonLower = reason.toLowerCase();

    if (type === LeaveType.SICK) {
      const sickKeywords = [
        '病',
        '医院',
        '医生',
        '发烧',
        '感冒',
        '不舒服',
        'sick',
        'doctor',
        'hospital',
      ];
      if (sickKeywords.some((k) => reasonLower.includes(k))) {
        return '病假';
      }
    }

    if (type === LeaveType.PERSONAL) {
      const personalKeywords = ['私事', '个人', 'personal', '家', 'home'];
      if (personalKeywords.some((k) => reasonLower.includes(k))) {
        return '事假';
      }
    }

    return this.getLeaveTypeName(type);
  }

  /**
   * 分析请假类型与理由的匹配度
   */
  private analyzeTypeReasonMatch(
    type: LeaveType,
    reason: string,
  ): { match: boolean; recognizedType: string } {
    const reasonLower = reason.toLowerCase();

    // 病假相关关键词
    const sickKeywords = [
      '病',
      '发烧',
      '感冒',
      '医院',
      '医生',
      '不舒服',
      '肚子',
      '头疼',
      'sick',
      'fever',
      'hospital',
      'doctor',
    ];
    const hasSickIndicator = sickKeywords.some((k) => reasonLower.includes(k));

    // 事假相关关键词
    const personalKeywords = [
      '私事',
      '个人',
      '家',
      'personal',
      'home',
      'family',
    ];
    const hasPersonalIndicator = personalKeywords.some((k) =>
      reasonLower.includes(k),
    );

    if (type === LeaveType.SICK && hasSickIndicator) {
      return { match: true, recognizedType: '病假' };
    }
    if (type === LeaveType.PERSONAL && hasPersonalIndicator) {
      return { match: true, recognizedType: '事假' };
    }
    if (
      type === LeaveType.SICK &&
      hasPersonalIndicator &&
      !hasSickIndicator
    ) {
      return { match: false, recognizedType: '事假' };
    }
    if (
      type === LeaveType.PERSONAL &&
      hasSickIndicator &&
      !hasPersonalIndicator
    ) {
      return { match: false, recognizedType: '病假' };
    }

    return { match: true, recognizedType: this.getLeaveTypeName(type) };
  }

  /**
   * 分析请假天数异常
   */
  private analyzeDaysAnomaly(
    type: LeaveType,
    days: number,
  ): { flags: string[]; recommendations: string[] } {
    const flags: string[] = [];
    const recommendations: string[] = [];

    // 长假检测
    if (days > 7) {
      flags.push(`请假天数较长(${days}天)，需额外审批`);
      recommendations.push('长假申请建议附上详细说明或证明');
    }

    // 半天假检测
    if (days < 1 && days > 0) {
      // 半天假正常
    }

    // 特定类型的天数限制
    if (type === LeaveType.SICK && days > 14) {
      flags.push(`病假超过14天(${days}天)，建议核实`);
      recommendations.push('长期病假建议提供完整医疗证明');
    }

    return { flags, recommendations };
  }

  /**
   * 分析历史请假模式
   */
  private async analyzeHistoricalPattern(
    studentId: string,
    _currentType: LeaveType,
  ): Promise<{
    flags: string[];
    recommendations: string[];
    pattern: any;
  } | null> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLeaves = await this.leaveRepository.find({
        where: {
          studentId,
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
      });

      const totalLeaves = recentLeaves.length;
      const sickLeaves = recentLeaves.filter(
        (l) => l.leaveType === LeaveType.SICK,
      ).length;
      const avgDaysPerLeave =
        totalLeaves > 0
          ? recentLeaves.reduce((sum, l) => sum + l.totalDays, 0) / totalLeaves
          : 0;

      const flags: string[] = [];
      const recommendations: string[] = [];

      // 频繁请假检测
      if (totalLeaves >= 5) {
        flags.push(`近30天请假次数较多(${totalLeaves}次)`);
        recommendations.push('频繁请假建议与家长/老师沟通了解情况');
      }

      // 频繁病假检测
      if (sickLeaves >= 3) {
        flags.push(`近30天病假次数较多(${sickLeaves}次)`);
        recommendations.push('频繁病假建议关注学生健康状况');
      }

      // 连续请假检测（检查是否有重叠或连续的请假）
      if (totalLeaves >= 2) {
        const sortedLeaves = recentLeaves.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );
        for (let i = 1; i < sortedLeaves.length; i++) {
          const prev = new Date(sortedLeaves[i - 1].endDate);
          const curr = new Date(sortedLeaves[i].startDate);
          const diffDays =
            (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 1) {
            flags.push('存在连续或紧密相连的请假记录');
            recommendations.push('请核实连续请假的原因');
            break;
          }
        }
      }

      return {
        flags,
        recommendations,
        pattern: {
          totalLeavesLast30Days: totalLeaves,
          sickLeavesLast30Days: sickLeaves,
          avgDaysPerLeave: Math.round(avgDaysPerLeave * 10) / 10,
        },
      };
    } catch (error) {
      this.logger.error(`历史记录分析失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 分析敏感日期（周一/周五/节假日附近）
   */
  private analyzeSensitiveDates(
    startDate: string,
    endDate?: string,
  ): { flags: string[]; recommendations: string[] } {
    const flags: string[] = [];
    const recommendations: string[] = [];

    const start = new Date(startDate);
    const dayOfWeek = start.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 周五请假且周一回来（连休检测）
    if (endDate) {
      const end = new Date(endDate);
      const endDayOfWeek = end.getDay();

      if (dayOfWeek === 5 && endDayOfWeek === 0) {
        flags.push('周五至周一请假（连休模式）');
        recommendations.push('请确认连休的必要性');
      }
    }

    // 周一请假检测
    if (dayOfWeek === 1) {
      flags.push('周一请假');
      recommendations.push('周一请假建议说明原因');
    }

    return { flags, recommendations };
  }

  /**
   * 计算风险等级
   */
  private calculateRiskLevel(
    anomalyFlags: string[],
    type: LeaveType,
    days: number,
    historyAnalysis: any,
  ): 'low' | 'medium' | 'high' {
    let score = 0;

    // 根据异常标记数量扣分
    if (anomalyFlags.length === 0) {
      score = 0;
    } else if (anomalyFlags.length === 1) {
      score = 1;
    } else if (anomalyFlags.length === 2) {
      score = 2;
    } else {
      score = 3;
    }

    // 特殊风险项
    if (anomalyFlags.some((f) => f.includes('不匹配'))) score += 1;
    if (anomalyFlags.some((f) => f.includes('频繁'))) score += 2;
    if (anomalyFlags.some((f) => f.includes('连续'))) score += 2;
    if (anomalyFlags.some((f) => f.includes('较长'))) score += 1;

    // 病假且无证明
    if (type === LeaveType.SICK && days >= 2) {
      score += 1;
    }

    // 历史分析
    if (historyAnalysis?.pattern?.totalLeavesLast30Days >= 5) {
      score += 2;
    }
    if (historyAnalysis?.pattern?.sickLeavesLast30Days >= 3) {
      score += 2;
    }

    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * 生成核验消息
   */
  private generateVerificationMessage(
    risk: 'low' | 'medium' | 'high',
    verified: boolean,
    flags: string[],
  ): string {
    if (verified && flags.length === 0) {
      return '请假申请核验通过，未发现明显异常';
    }
    if (verified && flags.length <= 2) {
      return `请假申请核验通过，但有以下注意事项: ${flags.join('; ')}`;
    }
    if (risk === 'medium') {
      return `请假申请核验发现异常，建议人工复核: ${flags.join('; ')}`;
    }
    if (risk === 'high') {
      return `请假申请核验未通过，存在以下风险: ${flags.join('; ')}`;
    }
    return `核验完成，共发现${flags.length}项需关注事项`;
  }

  /**
   * 执行OCR识别（模拟实现）
   * 实际项目中应调用真实的OCR服务（如阿里云OCR、腾讯OCR等）
   */
  private async performOcr(
    imageBuffer: Buffer,
    originalName: string,
  ): Promise<{ success: boolean; text: string }> {
    // 模拟OCR处理
    // 实际项目中应调用真实的OCR服务API
    this.logger.log(`[OCR模拟] 处理图片: ${originalName}`);

    // 模拟返回的OCR结果
    const simulatedTexts = [
      {
        text: `醫生證明書
醫院：香港大學深圳醫院
醫生：陳大明醫生
日期：2024年1月15日
患者：張三
診斷：上呼吸道感染
建議休息：3天
證明編號：MC20240115001
醫院印章：有效`,
        confidence: 0.95,
      },
      {
        text: `病假证明
医院：深圳市儿童医院
医生：李四医生
日期：2024-01-16
患者：李明
诊断：感冒
建议休息：2天`,
        confidence: 0.92,
      },
    ];

    // 简单模拟：基于文件名判断
    const isMedicalCert =
      originalName.toLowerCase().includes('medical') ||
      originalName.toLowerCase().includes('sick') ||
      originalName.toLowerCase().includes('cert') ||
      originalName.toLowerCase().includes('doctor');

    if (isMedicalCert) {
      const result =
        simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
      return { success: true, text: result.text };
    }

    return { success: true, text: '' };
  }

  /**
   * 解析证明内容
   */
  private parseCertificateContent(text: string): {
    hospitalName?: string;
    doctorName?: string;
    diagnosisDate?: string;
    patientName?: string;
    suggestedRestDays?: number;
    certificateType?: string;
    certificateNumber?: string;
  } {
    const result: any = {};

    // 提取医院名称
    const hospitalPatterns = [
      /醫院[：:]\s*(.+)/,
      /医院[：:]\s*(.+)/,
      /Hospital[：:]\s*(.+)/,
    ];
    for (const pattern of hospitalPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.hospitalName = match[1].trim();
        break;
      }
    }

    // 提取医生姓名
    const doctorPatterns = [
      /醫生[：:]\s*(.+)/,
      /医生[：:]\s*(.+)/,
      /Doctor[：:]\s*(.+)/,
    ];
    for (const pattern of doctorPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.doctorName = match[1].trim();
        break;
      }
    }

    // 提取日期
    const datePatterns = [
      /日期[：:]\s*(\d{4}[年\-]\d{1,2}[月\-]\d{1,2})/,
      /(\d{4}[年\-]\d{1,2}[月\-]\d{1,2})/,
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.diagnosisDate = match[1].trim();
        break;
      }
    }

    // 提取患者姓名
    const patientPatterns = [
      /患者[：:]\s*(.+)/,
      /姓名[：:]\s*(.+)/,
      /Name[：:]\s*(.+)/,
    ];
    for (const pattern of patientPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.patientName = match[1].trim();
        break;
      }
    }

    // 提取休息天数
    const restPatterns = [
      /建議休息[：:]\s*(\d+)天/,
      /建议休息[：:]\s*(\d+)天/,
      /休息[：:]\s*(\d+)天/,
    ];
    for (const pattern of restPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.suggestedRestDays = parseInt(match[1], 10);
        break;
      }
    }

    // 提取证明类型
    if (
      text.includes('醫生證明') ||
      text.includes('医生证明') ||
      text.includes('病假')
    ) {
      result.certificateType = 'medical_certificate';
    } else if (text.includes('醫囑') || text.includes('医嘱')) {
      result.certificateType = 'medical_advice';
    }

    // 提取证明编号
    const certNumPatterns = [
      /證明編號[：:]\s*(.+)/,
      /证明编号[：:]\s*(.+)/,
      /Certificate[ ]*No[.:]\s*(.+)/,
    ];
    for (const pattern of certNumPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.certificateNumber = match[1].trim();
        break;
      }
    }

    return result;
  }

  /**
   * 验证证明真实性
   */
  private validateCertificate(
    parsed: any,
    rawText: string,
  ): { isValid: boolean; suspiciousFlags: string[]; confidence: number } {
    const suspiciousFlags: string[] = [];
    let confidence = 0.8;
    let validityScore = 0;
    // 检查必要字段
    if (!parsed.hospitalName) {
      suspiciousFlags.push('缺少医院名称');
    } else {
      validityScore++;
    }

    if (!parsed.doctorName) {
      suspiciousFlags.push('缺少医生姓名');
    } else {
      validityScore++;
    }

    if (!parsed.diagnosisDate) {
      suspiciousFlags.push('缺少诊断日期');
    } else {
      validityScore++;
      // 检查日期是否合理
      try {
        const date = new Date(parsed.diagnosisDate);
        const now = new Date();
        if (date > now) {
          suspiciousFlags.push('诊断日期在未来');
          confidence -= 0.2;
        }
      } catch {
        suspiciousFlags.push('诊断日期格式异常');
        confidence -= 0.1;
      }
    }

    if (!parsed.patientName) {
      suspiciousFlags.push('缺少患者姓名');
    } else {
      validityScore++;
    }

    if (!parsed.certificateType) {
      suspiciousFlags.push('无法识别证明类型');
      confidence -= 0.1;
    } else {
      validityScore++;
    }

    // 检查内容完整性
    if (rawText.length < 50) {
      suspiciousFlags.push('证明内容过少');
      confidence -= 0.2;
    }

    // 计算置信度
    confidence = Math.max(0.3, Math.min(0.98, confidence));

    // 判断有效性
    const isValid = validityScore >= 3 && suspiciousFlags.length <= 1;

    return { isValid, suspiciousFlags, confidence };
  }

  /**
   * 获取请假类型名称
   */
  private getLeaveTypeName(type: LeaveType): string {
    const names: Record<LeaveType, string> = {
      [LeaveType.SICK]: '病假',
      [LeaveType.PERSONAL]: '事假',
      [LeaveType.COMPASSIONATE]: '丧假',
      [LeaveType.OTHER]: '其他',
    };
    return names[type] || '未知';
  }
}
