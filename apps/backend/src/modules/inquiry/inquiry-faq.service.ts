import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InquiryFaq, FaqMatchType } from './inquiry-faq.entity';
import { InquiryCategory } from './inquiry.entity';

export interface FaqMatchResult {
  faq: InquiryFaq;
  score: number;
  matchType: FaqMatchType;
  isHumanRequired: boolean;
}

@Injectable()
export class InquiryFaqService {
  private readonly logger = new Logger(InquiryFaqService.name);

  constructor(
    @InjectRepository(InquiryFaq)
    private faqRepository: Repository<InquiryFaq>,
  ) {}

  /**
   * 根据查询内容匹配最佳FAQ
   * @param content 家长查询内容
   * @param category 查询类别
   * @param schoolId 学校ID
   */
  async matchFaq(
    content: string,
    category: InquiryCategory,
    schoolId: string,
  ): Promise<FaqMatchResult | null> {
    const normalizedContent = content.toLowerCase().trim();

    // 1. 关键词精确匹配（最高优先级）
    const keywordMatch = await this.matchByKeywords(
      normalizedContent,
      schoolId,
    );
    if (keywordMatch) {
      return keywordMatch;
    }

    // 2. 类别匹配
    const categoryMatch = await this.matchByCategory(category, schoolId);
    if (categoryMatch) {
      return categoryMatch;
    }

    // 3. 模糊匹配（包含关系）
    const fuzzyMatch = await this.matchByFuzzy(normalizedContent, schoolId);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    return null;
  }

  /**
   * 关键词精确匹配
   */
  private async matchByKeywords(
    content: string,
    schoolId: string,
  ): Promise<FaqMatchResult | null> {
    // 获取所有激活的FAQ
    const faqs = await this.faqRepository.find({
      where: { schoolId, isActive: true, matchType: FaqMatchType.KEYWORD },
      order: { priority: 'ASC' },
    });

    let bestMatch: FaqMatchResult = null;
    let bestScore = 0;

    for (const faq of faqs) {
      if (!faq.keywords) continue;

      const keywords = faq.keywords
        .toLowerCase()
        .split(/[,，;；]/)
        .map((k) => k.trim())
        .filter(Boolean);

      // 计算命中关键词数量
      const matchedKeywords = keywords.filter((keyword) =>
        content.includes(keyword),
      );

      if (matchedKeywords.length === 0) continue;

      // 计算匹配得分：命中越多得分越高
      const score =
        (matchedKeywords.length / keywords.length) * 0.8 +
        (matchedKeywords.length > 0 ? 0.2 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          faq,
          score,
          matchType: FaqMatchType.KEYWORD,
          isHumanRequired: faq.requiresHuman,
        };
      }
    }

    return bestScore >= 0.3 ? bestMatch : null;
  }

  /**
   * 类别匹配（返回该类别的推荐FAQ）
   */
  private async matchByCategory(
    category: InquiryCategory,
    schoolId: string,
  ): Promise<FaqMatchResult | null> {
    const faq = await this.faqRepository.findOne({
      where: { schoolId, category, isActive: true, matchType: FaqMatchType.CATEGORY },
      order: { priority: 'ASC' },
    });

    if (!faq) return null;

    return {
      faq,
      score: 0.5,
      matchType: FaqMatchType.CATEGORY,
      isHumanRequired: faq.requiresHuman,
    };
  }

  /**
   * 模糊匹配（问题内容包含匹配）
   */
  private async matchByFuzzy(
    content: string,
    schoolId: string,
  ): Promise<FaqMatchResult | null> {
    const faqs = await this.faqRepository.find({
      where: { schoolId, isActive: true },
      order: { priority: 'ASC', usageCount: 'DESC' },
      take: 20, // 只取前20个高频FAQ做模糊匹配
    });

    let bestMatch: FaqMatchResult = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const questionNormalized = faq.question.toLowerCase();

      // 简单包含匹配
      if (questionNormalized.includes(content) || content.includes(questionNormalized)) {
        const score = Math.min(questionNormalized.length / content.length, 1) * 0.6;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            faq,
            score,
            matchType: FaqMatchType.INTENT,
            isHumanRequired: faq.requiresHuman,
          };
        }
      }

      // 分词匹配
      const contentWords = content.split(/\s+/);
      const questionWords = questionNormalized.split(/\s+/);
      const commonWords = contentWords.filter((w) =>
        questionWords.some((qw) => qw.includes(w) || w.includes(qw)),
      );

      if (commonWords.length > 0) {
        const score =
          (commonWords.length / Math.max(contentWords.length, 1)) * 0.5;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            faq,
            score,
            matchType: FaqMatchType.INTENT,
            isHumanRequired: faq.requiresHuman,
          };
        }
      }
    }

    return bestScore >= 0.2 ? bestMatch : null;
  }

  /**
   * 生成自动回复内容
   * @param matchResult FAQ匹配结果
   * @param inquiryContent 原始查询内容
   */
  buildAutoReply(
    matchResult: FaqMatchResult,
    inquiryContent: string,
  ): string {
    if (!matchResult) {
      return null;
    }

    if (matchResult.isHumanRequired) {
      return `感谢您的查询。我们已收到您关于"${inquiryContent.slice(0, 50)}"的咨询，将有专人在24小时内为您处理。如有紧急事项，请致电学校热线。`;
    }

    // 返回FAQ答案，并记录命中率
    const { faq } = matchResult;
    return `📋 参考信息：\n\n${faq.answer}\n\n---\n以上内容是否解答了您的问题？如果还有其他疑问，欢迎继续咨询！`;
  }

  /**
   * 获取所有激活的FAQ
   */
  async getAllFaqs(
    schoolId: string,
    category?: InquiryCategory,
  ): Promise<InquiryFaq[]> {
    const where: any = { schoolId, isActive: true };
    if (category) {
      where.category = category;
    }
    return this.faqRepository.find({
      where,
      order: { priority: 'ASC', usageCount: 'DESC' },
    });
  }

  /**
   * 创建FAQ
   */
  async createFaq(
    dto: Partial<InquiryFaq>,
    schoolId: string,
    userId: string,
  ): Promise<InquiryFaq> {
    const faq = this.faqRepository.create({
      ...dto,
      schoolId,
      createdBy: userId,
    });
    return this.faqRepository.save(faq);
  }

  /**
   * 更新FAQ
   */
  async updateFaq(id: string, dto: Partial<InquiryFaq>): Promise<InquiryFaq> {
    await this.faqRepository.update(id, dto);
    return this.faqRepository.findOne({ where: { id } });
  }

  /**
   * 删除FAQ（软删除）
   */
  async deleteFaq(id: string): Promise<void> {
    await this.faqRepository.update(id, { isActive: false });
  }

  /**
   * 增加FAQ使用次数
   */
  async incrementUsageCount(id: string): Promise<void> {
    await this.faqRepository.increment({ id }, 'usageCount', 1);
  }

  /**
   * 种子数据：初始化默认FAQ
   */
  async seedDefaultFaqs(schoolId: string, userId: string): Promise<void> {
    const count = await this.faqRepository.count({ where: { schoolId } });
    if (count > 0) return; // 已有FAQ，跳过

    const defaultFaqs: Partial<InquiryFaq>[] = [
      {
        question: '校车时间表',
        answer: '校车一般在校上学日运行，具体时间如下：\n上学：上午 7:30 从各站点出发\n放学：下午 3:30 从学校出发\n如有调整，学校会提前通知家长。',
        category: InquiryCategory.BUS_SCHEDULE,
        keywords: '校車,校车,校巴,时间,時刻表,schedule,bus time',
        matchType: FaqMatchType.KEYWORD,
        priority: 1,
        tags: '校车,交通',
      },
      {
        question: '校车路线查询',
        answer: '校车路线根据学生居住区域安排。如需查询具体路线，请提供学生姓名和居住区域，我们将为您查询对应的校车站点和时间。',
        category: InquiryCategory.BUS_SCHEDULE,
        keywords: '路线,route,站點,stop,上車,下车',
        matchType: FaqMatchType.KEYWORD,
        priority: 2,
        tags: '校车',
      },
      {
        question: '学费缴纳方式',
        answer: '学费可通过以下方式缴纳：\n1. 银行转账\n2. 学校缴费窗口（周一至周五 9:00-16:00）\n3. 网上缴费系统\n请留意学校发出的缴费通知书，按时缴纳。',
        category: InquiryCategory.TUITION_FEE,
        keywords: '學費,学费,繳費,payment,fee,交費',
        matchType: FaqMatchType.KEYWORD,
        priority: 1,
        tags: '财务',
      },
      {
        question: '午餐菜单查询',
        answer: '学校每周一会公布当周午餐菜单，请在学校官网或家长群查看。如有食物过敏，请提前告知学校医务室。',
        category: InquiryCategory.LUNCH,
        keywords: '午膳,午餐,午餐,menu,餐單,吃什么',
        matchType: FaqMatchType.KEYWORD,
        priority: 1,
        tags: '午餐',
      },
      {
        question: '上课时间',
        answer: '学校上课时间：\n上午：8:00 - 12:00\n午休：12:00 - 13:00\n下午：13:00 - 15:30\n请提醒学生提前10分钟到校。',
        category: InquiryCategory.GENERAL,
        keywords: '上課,上课,時間,time,幾點,几点,放學,放学',
        matchType: FaqMatchType.KEYWORD,
        priority: 1,
        tags: '日常',
      },
      {
        question: '请假申请流程',
        answer: '请假申请可通过以下方式：\n1. 在学校APP提交请假申请\n2. 联系班主任说明情况\n3. 长期病假需提供医生证明\n请假审批结果将通过APP通知您。',
        category: InquiryCategory.LEAVE,
        keywords: '請假,请假,leave,病假,事假,申请',
        matchType: FaqMatchType.KEYWORD,
        priority: 1,
        tags: '请假',
      },
    ];

    for (const faqDto of defaultFaqs) {
      await this.createFaq(faqDto, schoolId, userId);
    }

    this.logger.log(`[InquiryFaq] 初始化默认FAQ ${defaultFaqs.length} 条`);
  }
}
