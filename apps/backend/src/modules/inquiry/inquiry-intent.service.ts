import { Injectable } from '@nestjs/common';

/**
 * 家长查询意图类型
 */
export enum IntentType {
  /** 出勤相关：请假、迟到、早退、缺勤 */
  ATTENDANCE = 'attendance',
  /** 学费相关：缴费、账单、退费、奖学金 */
  TUITION = 'tuition',
  /** 请假相关：病假、事假、离校 */
  LEAVE = 'leave',
  /** 纪律相关：奖惩、行为、课堂规则 */
  DISCIPLINE = 'discipline',
  /** 健康相关：身体不适、饮食、过敏、疾病 */
  HEALTH = 'health',
  /** 学业相关：成绩、作业、课程、教学 */
  ACADEMIC = 'academic',
  /** 安全相关：校园安全、霸凌、受伤 */
  SAFETY = 'safety',
  /** 其他 */
  OTHER = 'other',
  /** 未知 */
  UNKNOWN = 'unknown',
}

export interface IntentMatch {
  intent: IntentType;
  confidence: number; // 0-1
  matchedKeywords: string[];
  reasoning?: string;
}

export interface IntentClassificationResult {
  primaryIntent: IntentMatch;
  allIntents: IntentMatch[];
  originalText: string;
  classifiedAt: Date;
  /** 智能推荐回复列表 */
  suggestions: string[];
}

/**
 * AI意图分类服务
 * 使用关键词匹配 + 规则引擎实现意图识别
 */
@Injectable()
export class InquiryIntentService {
  // 意图关键词配置：(关键词列表, 基础置信度, 权重倍数)
  private readonly intentKeywords: Record<
    IntentType,
    { keywords: string[]; weight: number }
  > = {
    [IntentType.ATTENDANCE]: {
      keywords: [
        '出勤',
        '到校',
        '缺勤',
        '缺课',
        '旷课',
        '迟到',
        '早退',
        '请假',
        '缺席',
        '上学',
        '放学',
        '考勤',
        '签到',
        '没来',
        '没到',
        '什么时候到',
        '几点到',
        '几点放学',
        'attending',
        'attendance',
        'absent',
        'late',
        'present',
      ],
      weight: 1.2,
    },
    [IntentType.TUITION]: {
      keywords: [
        '学费',
        '缴费',
        '账单',
        '费用',
        '收费',
        '付款',
        '交费',
        '退费',
        '退款',
        '奖学金',
        '资助',
        '减免费用',
        '优惠',
        '收费',
        '价格',
        '多少钱',
        '如何支付',
        'payment',
        'fee',
        'tuition',
        'charge',
        'invoice',
        'refund',
        'scholarship',
      ],
      weight: 1.2,
    },
    [IntentType.LEAVE]: {
      keywords: [
        '请假',
        '病假',
        '事假',
        '离校',
        '休假',
        '休息',
        '什么时候回来',
        '病了吗',
        '不舒服',
        'leave',
        'sick',
        'absence',
        'off',
        'vacation',
        'medical',
        'doctor',
      ],
      weight: 1.2,
    },
    [IntentType.DISCIPLINE]: {
      keywords: [
        '纪律',
        '违规',
        '惩罚',
        '处分',
        '批评',
        '表扬',
        '奖励',
        '打架',
        '骂人',
        '不听话',
        '调皮',
        '捣乱',
        '纪律问题',
        'discipline',
        'punishment',
        'reward',
        'behavior',
        'conduct',
      ],
      weight: 1.2,
    },
    [IntentType.HEALTH]: {
      keywords: [
        '健康',
        '身体',
        '不舒服',
        '发烧',
        '生病',
        '医院',
        '医生',
        '过敏',
        '食物',
        '午餐',
        '饮食',
        '肚子疼',
        '头疼',
        '校医',
        '医务',
        '隔离',
        '疾病',
        'health',
        'sick',
        'medical',
        'allergy',
        'pain',
        'fever',
        'hospital',
        'clinic',
      ],
      weight: 1.2,
    },
    [IntentType.ACADEMIC]: {
      keywords: [
        '成绩',
        '分数',
        '考试',
        '作业',
        '学习',
        '课程',
        '老师',
        '教学',
        '课本',
        '功课',
        '课堂',
        '测验',
        '报告',
        '评分',
        'academic',
        'grade',
        'score',
        'exam',
        'homework',
        'assignment',
        'course',
        'study',
        'lesson',
        'test',
      ],
      weight: 1.2,
    },
    [IntentType.SAFETY]: {
      keywords: [
        '安全',
        '受伤',
        '霸凌',
        '欺凌',
        '危险',
        '事故',
        '紧急',
        '投诉',
        '虐待',
        '安全问题',
        '受伤了',
        '被人打',
        'safety',
        'injury',
        'bullying',
        'danger',
        'accident',
        'emergency',
        'complaint',
        'abuse',
        'hurt',
      ],
      weight: 1.5, // 安全类意图权重更高
    },
    [IntentType.OTHER]: {
      keywords: ['其他', '咨询', '问', '问题', '帮忙', 'help', 'question'],
      weight: 1.0,
    },
    [IntentType.UNKNOWN]: {
      keywords: [],
      weight: 0,
    },
  };

  // 智能推荐回复模板
  private readonly replySuggestions: Record<IntentType, string[]> = {
    [IntentType.ATTENDANCE]: [
      '感谢您的查询。请提供孩子的姓名和班级，我们会立即核查出勤记录。',
      '已收到您的出勤相关咨询，班主任会在1个工作日内与您联系确认。',
      '关于出勤情况，建议您登录学校考勤系统查看详细记录。',
    ],
    [IntentType.TUITION]: [
      '您好！关于学费相关问题，请告知您想了解的具体项目（学费/杂费/餐费等），我们会尽快解答。',
      '已收到您的费用咨询，学校财务部门会在2个工作日内发送正式账单到您的邮箱。',
      '如需查询具体费用明细，请提供孩子的学号，我们将为您详细说明。',
    ],
    [IntentType.LEAVE]: [
      '已收到请假申请。请通过学校请假系统提交正式请假申请，注明请假原因和日期。',
      '关于请假流程，请说明预计请假时间和原因，我们会及时转交班主任处理。',
      '如需紧急请假，请直接联系班主任或学校前台电话。',
    ],
    [IntentType.DISCIPLINE]: [
      '感谢您的反馈。我们会认真对待每一起纪律相关问题，请提供更多细节以便调查。',
      '已记录您的反馈，学校会根据相关政策进行调查处理，并尽快与您沟通结果。',
      '如需紧急沟通，请直接联系班主任或学生处。',
    ],
    [IntentType.HEALTH]: [
      '您好！如孩子身体不适，请第一时间就医并通知班主任。请提供孩子的具体症状。',
      '已收到健康相关咨询，请说明孩子的情况，我们会及时通知校医跟进。',
      '如需紧急医疗协助，请立即拨打学校医务室电话或120急救电话。',
    ],
    [IntentType.ACADEMIC]: [
      '您好！关于学业相关问题，请说明您想了解的具体科目或考试名称。',
      '已收到您的学业咨询，各科老师会在1-2个工作日内回复。',
      '如需了解孩子的具体成绩，请登录学校成绩系统或联系班主任。',
    ],
    [IntentType.SAFETY]: [
      '【重要】我们非常重视安全问题。请立即说明具体情况，以便我们立即介入处理。',
      '如情况紧急，请立即拨打学校安保电话或110报警。我们会同步启动调查。',
      '已收到您的安全相关反馈，请提供尽可能多的细节，我们会第一时间处理。',
    ],
    [IntentType.OTHER]: [
      '感谢您的查询。我们已将您的需求记录，会尽快给予回复。',
      '已收到您的信息，如有需要补充的内容，请随时告知。',
      '感谢您的来信，我们会尽快处理您的问题。',
    ],
    [IntentType.UNKNOWN]: [
      '感谢您的来信。我们已收到您的消息，会尽快给予回复。',
      '请提供更多详细信息，以便我们更好地帮助您。',
      '如有任何疑问，请随时与我们联系。',
    ],
  };

  /**
   * 对输入文本进行意图分类
   * @param text 家长查询的文本内容
   * @returns 意图分类结果
   */
  classify(text: string): IntentClassificationResult {
    if (!text || text.trim().length === 0) {
      return this.buildResult([], text);
    }

    const normalizedText = text.toLowerCase().trim();
    const allIntents: IntentMatch[] = [];

    for (const [intent, config] of Object.entries(this.intentKeywords)) {
      if (intent === IntentType.UNKNOWN) continue;

      const matchedKeywords: string[] = [];
      let matchCount = 0;

      for (const keyword of config.keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          matchCount++;
        }
      }

      if (matchCount > 0) {
        // 置信度 = 匹配关键词数 / 总关键词数 * 权重 * 归一化系数
        const baseConfidence = matchCount / config.keywords.length;
        const confidence = Math.min(baseConfidence * config.weight, 1.0);

        allIntents.push({
          intent: intent as IntentType,
          confidence: Math.round(confidence * 100) / 100,
          matchedKeywords,
          reasoning: this.buildReasoning(
            intent as IntentType,
            matchedKeywords,
            matchCount,
          ),
        });
      }
    }

    return this.buildResult(allIntents, text);
  }

  /**
   * 批量分类多个文本
   */
  classifyBatch(texts: string[]): IntentClassificationResult[] {
    return texts.map((text) => this.classify(text));
  }

  /**
   * 根据意图推荐合适的 InquiryType
   */
  mapIntentToInquiryType(intent: IntentType): string {
    const mapping: Partial<Record<IntentType, string>> = {
      [IntentType.ATTENDANCE]: 'attendance',
      [IntentType.TUITION]: 'finance',
      [IntentType.LEAVE]: 'attendance',
      [IntentType.DISCIPLINE]: 'discipline',
      [IntentType.HEALTH]: 'health',
      [IntentType.ACADEMIC]: 'academic',
      [IntentType.SAFETY]: 'other',
      [IntentType.OTHER]: 'other',
    };
    return mapping[intent] || 'other';
  }

  private buildResult(
    allIntents: IntentMatch[],
    originalText: string,
  ): IntentClassificationResult {
    // 按置信度降序排列
    allIntents.sort((a, b) => b.confidence - a.confidence);

    const primaryIntent: IntentMatch =
      allIntents.length > 0
        ? allIntents[0]
        : {
            intent: IntentType.UNKNOWN,
            confidence: 0,
            matchedKeywords: [],
            reasoning: '未识别到任何已知意图关键词',
          };

    // 获取推荐回复：优先用高置信度意图的回复，次选用前两个意图组合
    const suggestions = this.getSuggestions(primaryIntent.intent, allIntents);

    return {
      primaryIntent,
      allIntents,
      originalText,
      classifiedAt: new Date(),
      suggestions,
    };
  }

  /**
   * 根据意图类型获取智能推荐回复
   */
  private getSuggestions(
    primaryIntent: IntentType,
    allIntents: IntentMatch[],
  ): string[] {
    const baseSuggestions =
      this.replySuggestions[primaryIntent] ||
      this.replySuggestions[IntentType.OTHER];

    // 如果安全意图且置信度高，增加紧急回复
    if (
      primaryIntent === IntentType.SAFETY &&
      allIntents[0]?.confidence >= 0.5
    ) {
      return [
        '【紧急】我们非常重视安全问题。请立即说明具体情况，我们会立即介入处理。',
        '如情况紧急，请立即拨打学校安保电话或报警。',
        ...baseSuggestions,
      ];
    }

    return baseSuggestions;
  }

  private buildReasoning(
    intent: IntentType,
    keywords: string[],
    matchCount: number,
  ): string {
    const intentNames: Record<IntentType, string> = {
      [IntentType.ATTENDANCE]: '出勤/考勤',
      [IntentType.TUITION]: '学费/费用',
      [IntentType.LEAVE]: '请假',
      [IntentType.DISCIPLINE]: '纪律',
      [IntentType.HEALTH]: '健康',
      [IntentType.ACADEMIC]: '学业',
      [IntentType.SAFETY]: '安全',
      [IntentType.OTHER]: '其他',
      [IntentType.UNKNOWN]: '未知',
    };

    const matched = keywords.slice(0, 3).join('、');
    return `检测到${matchCount}个「${intentNames[intent]}」相关关键词：${matched}${keywords.length > 3 ? '...' : ''}`;
  }
}
