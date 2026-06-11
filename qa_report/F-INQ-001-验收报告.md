# 家长查询队列管理 F-INQ-001 QA验收报告

## 测试结果
- 用例数: 6
- 通过: 1
- 失败: 5
- 通过率: 16.7%

## 缺陷

### P0 缺陷（致命）

**INQ-001-02: AI意图分类功能完全缺失**
- **严重级别**: P0
- **描述**: 测试方案要求 INQ-001-02 "录入'校車會唔會遲？' → AI识别为bus_schedule_inquiry，置信度>0.9"，但 `inquiry.service.ts` 和 `inquiry.controller.ts` 中完全没有 AI intent classification 相关代码。`inquiry.entity.ts` 也没有 `intent` / `confidenceScore` / `aiProcessed` 字段。
- **影响**: 家长查询进入队列后无法被智能分类，所有查询均需人工处理，AI核验机制无法生效。
- **根因**: 模块未引入任何 AI/NLP 服务（如 FAQ service、intent classifier），所有 create/update/reply 方法均为纯数据 CRUD。

**INQ-001-05: 紧急查询升级功能完全缺失**
- **严重级别**: P0
- **描述**: 测试方案 INQ-001-05 要求查询涉及学生安全时可标记为 critical 并立即通知校务主任启动紧急响应。`inquiry.entity.ts` 没有 `priority` / `priorityLevel` / `isEscalated` 字段，`inquiry.service.ts` 没有 escalation 相关逻辑。
- **影响**: 涉及学生安全的紧急查询无法被系统识别和升级，可能导致响应延误。

### P1 缺陷（重要）

**INQ-001-03: 自动回复建议功能完全缺失**
- **严重级别**: P1
- **描述**: 测试方案要求 AI 识别意图成功后显示匹配 FAQ 的建议回复内容。`inquiry.service.ts` 没有任何 FAQ 匹配或 reply suggestion 逻辑，没有 `suggestedReplies` / `faqMatchScore` 字段。
- **影响**: 校务人员回复家长查询时无法获得 AI 推荐回复建议，降低处理效率。

**INQ-001-04: AI置信度不足转人工功能缺失**
- **严重级别**: P1
- **描述**: 测试方案要求当 AI 置信度<0.8 时标记为需人工处理并分配给值班人员。由于 INQ-001-02 的 AI 意图分类本身不存在，此功能也无法实现。
- **影响**: 模糊查询无法被智能识别和转接，队列积压风险增加。

**INQ-001-06: 查询处理超时提醒功能缺失**
- **严重级别**: P1
- **描述**: 测试方案要求查询超过2小时未处理时自动发送提醒给分配人员、升级优先级。`inquiry.service.ts` 没有 timeout detection、overdue handling 或 escalation timer 相关逻辑。
- **影响**: 待处理查询可能长期积压，家长体验差。

### 缺陷汇总

| 缺陷ID | 用例 | 严重级别 | 功能点 | 描述 |
|--------|------|---------|--------|------|
| BUG-INQ-001 | INQ-001-02 | P0 | AI意图分类 | AI intent classification 功能完全缺失 |
| BUG-INQ-002 | INQ-001-05 | P0 | 紧急查询升级 | 紧急查询升级/escalation 功能完全缺失 |
| BUG-INQ-003 | INQ-001-03 | P1 | 自动回复建议 | FAQ匹配/建议回复功能完全缺失 |
| BUG-INQ-004 | INQ-001-04 | P1 | AI置信度转人工 | 置信度不足转人工处理功能缺失 |
| BUG-INQ-005 | INQ-001-06 | P1 | 超时提醒 | 查询处理超时自动提醒功能缺失 |

### 通过的测试用例

**INQ-001-01: 电话查询录入 ✅**
- `inquiry.controller.ts` create() 方法正确实现了查询录入
- 渠道信息可通过扩展 entity 字段支持

## 结论
❌ 不通过

**核心原因**: F-INQ-001 模块5个测试用例中有4个依赖 AI/智能功能（意图分类、自动回复建议、AI置信度转人工、超时提醒），所有这些功能在代码中完全缺失。该模块实际上只实现了一个基础的 CRUD 存储库，没有 AI 能力，不符合 v1.7.0 SPEC 要求的新增 AI 智能核验机制（见变更记录："F-LEAVE-001病假自动批准增加AI核验机制"）。

**修复建议**:
1. 在 `inquiry.module.ts` 中引入 FAQ service 和 AI intent classifier
2. 在 entity 中补充 `intent`, `confidenceScore`, `priority`, `isEscalated`, `channel`, `callDuration` 等字段
3. 在 `inquiry.service.ts` 中实现 AI 意图分类 + 置信度评分逻辑
4. 实现超时检测定时任务（可使用 `@nestjs/schedule` CronJob）
5. 实现 FAQ 自动回复建议接口
