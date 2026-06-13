# AI功能开发计划 - P1优先级

## 一、#76 Leave跟进提醒功能

### 1.1 功能描述
系统自动跟进请假申请状态，并在关键时间点发送提醒通知。

### 1.2 业务场景
1. **请假提交后** - 自动通知审批人
2. **审批超时提醒** - 审批人超过设定时间未处理
3. **审批结果通知** - 结果出来后通知申请人
4. **请假临近提醒** - 提醒申请人请假即将开始
5. **请假到期提醒** - 提醒申请人假期即将结束

### 1.3 后端实现方案

```typescript
// apps/backend/src/modules/leave/leave-followup.service.ts
interface LeaveFollowupConfig {
  // 审批超时提醒时间（小时）
  approvalTimeoutHours: number;
  // 提前提醒时间（天）
  advanceReminderDays: number;
  // 临近提醒时间（小时）
  imminentReminderHours: number;
}

class LeaveFollowupService {
  // 1. 创建请假时触发
  async onLeaveCreated(leaveId: string): Promise<void> {
    // 通知审批人
    const leave = await this.leaveService.findById(leaveId);
    await this.notificationService.send({
      userId: leave.approverId,
      type: 'leave_request',
      title: '新的请假申请',
      content: `学生 ${leave.studentName} 提交了请假申请`,
    });
  }

  // 2. 检查超时未审批
  async checkPendingApprovals(): Promise<void> {
    const pendingLeaves = await this.leaveService.findPendingApprovals();
    for (const leave of pendingLeaves) {
      const hoursSinceCreation = this.getHoursDifference(leave.createdAt);
      if (hoursSinceCreation >= this.config.approvalTimeoutHours) {
        await this.sendTimeoutReminder(leave);
      }
    }
  }

  // 3. 审批完成后通知
  async onLeaveApproved(leaveId: string): Promise<void> {
    const leave = await this.leaveService.findById(leaveId);
    await this.notificationService.send({
      userId: leave.applicantId,
      type: 'leave_approved',
      title: '请假申请已批准',
      content: `您的请假申请已获批准`,
    });
  }

  // 4. 请假临近提醒
  async sendAdvanceReminders(): Promise<void> {
    const upcomingLeaves = await this.leaveService.findUpcomingLeaves(
      this.config.advanceReminderDays
    );
    for (const leave of upcomingLeaves) {
      await this.notificationService.send({
        userId: leave.applicantId,
        type: 'leave_advance_reminder',
        title: '请假即将开始',
        content: `您的请假将于 ${leave.startDate} 开始`,
      });
    }
  }
}
```

### 1.4 Cron Job配置
```typescript
// apps/backend/src/modules/leave/leave.module.ts
ScheduleModule.register([
  {
    name: 'leave-followup-check',
    cron: '*/15 * * * *', // 每15分钟检查一次
    job: LeaveFollowupService.prototype.checkPendingApprovals,
  },
  {
    name: 'leave-advance-reminder',
    cron: '0 9 * * *', // 每天早上9点发送临近提醒
    job: LeaveFollowupService.prototype.sendAdvanceReminders,
  },
]);
```

### 1.5 前端实现
- 在LeavePage中添加跟进状态显示
- 添加提醒设置面板
- 显示提醒历史记录

---

## 二、#73 Inquiry自动回复功能

### 2.1 功能描述
系统自动分析家长查询内容，并提供智能回复建议或自动回复。

### 2.2 业务场景
1. **关键词自动匹配** - 根据查询关键词匹配FAQ
2. **意图识别** - 识别查询类型（咨询/投诉/建议）
3. **自动回复建议** - 提供AI生成的回复建议
4. **升级判断** - 根据关键词判断是否需要人工介入

### 2.3 后端实现方案

```typescript
// apps/backend/src/modules/inquiry/inquiry-auto-reply.service.ts
interface InquiryAutoReplyConfig {
  // 启用自动回复
  enabled: boolean;
  // 最低置信度阈值
  minConfidence: number;
  // 升级关键词
  escalationKeywords: string[];
}

class InquiryAutoReplyService {
  // 1. 处理新查询
  async processInquiry(inquiryId: string): Promise<AutoReplyResult> {
    const inquiry = await this.inquiryService.findById(inquiryId);
    
    // 意图识别
    const intent = await this.intentRecognition(inquiry.content);
    
    // 匹配FAQ
    const faqMatch = await this.matchFAQ(inquiry.content);
    
    // 判断是否需要升级
    const shouldEscalate = this.shouldEscalate(inquiry.content);
    
    if (shouldEscalate) {
      return {
        type: 'escalate',
        reason: '关键词触发升级',
        suggestion: null,
      };
    }
    
    if (faqMatch && faqMatch.confidence >= this.config.minConfidence) {
      return {
        type: 'faq_match',
        faq: faqMatch.faq,
        confidence: faqMatch.confidence,
        suggestion: faqMatch.faq.answer,
      };
    }
    
    // AI生成回复建议
    const aiSuggestion = await this.generateReplySuggestion(inquiry);
    return {
      type: 'ai_suggestion',
      suggestion: aiSuggestion,
      confidence: 0.8,
    };
  }

  // 2. 意图识别
  private async intentRecognition(content: string): Promise<InquiryIntent> {
    // 实现意图识别逻辑
    // 返回: question | complaint | suggestion | compliment | other
  }

  // 3. FAQ匹配
  private async matchFAQ(content: string): Promise<FAQMatch | null> {
    // 实现FAQ匹配逻辑
    // 返回匹配度最高的FAQ
  }

  // 4. 升级判断
  private shouldEscalate(content: string): boolean {
    return this.config.escalationKeywords.some(keyword => 
      content.includes(keyword)
    );
  }

  // 5. AI生成回复建议
  private async generateReplySuggestion(inquiry: Inquiry): Promise<string> {
    // 调用AI服务生成回复建议
  }
}

interface AutoReplyResult {
  type: 'faq_match' | 'ai_suggestion' | 'escalate';
  faq?: FAQ;
  suggestion?: string;
  reason?: string;
  confidence: number;
}
```

### 2.4 FAQ管理
```typescript
// apps/backend/src/modules/inquiry/faq.entity.ts
@Entity('inquiry_faqs')
export class InquiryFAQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column('text')
  answer: string;

  @Column({ default: 0 })
  matchCount: number;

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 1.0 })
  successRate: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2.5 前端实现
```typescript
// InquiryPage.tsx - 添加自动回复功能

const InquiryPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [autoReplySuggestions, setAutoReplySuggestions] = useState<Map<string, string>>(new Map());

  // 处理新查询时自动获取回复建议
  const handleNewInquiry = async (inquiry: Inquiry) => {
    const result = await inquiryApi.getAutoReply(inquiry.id);
    
    if (result.type === 'faq_match') {
      setAutoReplySuggestions(prev => 
        prev.set(inquiry.id, result.suggestion || result.faq?.answer || '')
      );
    } else if (result.type === 'ai_suggestion') {
      setAutoReplySuggestions(prev => 
        prev.set(inquiry.id, result.suggestion || '')
      );
    } else if (result.type === 'escalate') {
      // 显示升级提示
      showEscalationWarning(inquiry.id);
    }
  };

  // 快速应用回复建议
  const applySuggestion = (inquiryId: string) => {
    const suggestion = autoReplySuggestions.get(inquiryId);
    if (suggestion) {
      setReplyContent(suggestion);
    }
  };

  // 标记建议有效
  const markSuggestionHelpful = async (inquiryId: string, helpful: boolean) => {
    await inquiryApi.feedbackSuggestion(inquiryId, helpful);
  };
};
```

### 2.6 API端点
```
GET    /api/inquiry/:id/auto-reply    - 获取自动回复建议
POST   /api/inquiry/:id/feedback       - 反馈回复建议效果
GET    /api/inquiry/faqs              - 获取FAQ列表
POST   /api/inquiry/faqs              - 创建FAQ
PATCH  /api/inquiry/faqs/:id          - 更新FAQ
```

---

## 三、开发时间估算

| 任务 | 功能 | 预估工时 | 依赖 |
|------|------|----------|------|
| Leave跟进提醒后端 | #76 | 4h | 通知模块 |
| Leave跟进提醒前端 | #76 | 2h | 后端API |
| Inquiry自动回复后端 | #73 | 6h | AI服务 |
| Inquiry FAQ管理 | #73 | 3h | 后端API |
| Inquiry自动回复前端 | #73 | 3h | 后端API |
| **总计** | | **18h** | |

---

## 四、测试计划

### Leave跟进提醒测试
1. 请假提交后审批人收到通知
2. 超时未审批发送提醒
3. 审批结果通知申请人
4. 请假临近提醒正确发送

### Inquiry自动回复测试
1. 关键词匹配FAQ
2. AI生成回复建议
3. 升级关键词触发升级
4. 用户反馈改进匹配

---
生成时间: 2026-06-13
