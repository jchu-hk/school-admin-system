# DEV2 模块代码审查报告

> **审查分支：** `feature/phase-2-qa2-automation`（本地已检出，等效于 feature/phase-2-dev2-modules）
> **审查时间：** 2026-06-07
> **审查人：** CHECKER 质检岗
> **审查范围：** F-INQ-001（家长查询队列）、F-LEAVE-001（请假申请处理）、F-AUTO-002（多渠道通知服务）
> **参考规范：** SPEC v1.7.0、DB-SCHEMA v1.4.0

---

## 一、总体结论

**结论：🟡 条件通过**

三个模块整体架构合理，核心业务逻辑基本正确，审计日志覆盖面较完整。但存在 **5 个严重问题**（含 1 个安全漏洞）、**11 个中等缺陷**和**若干 ESLint 格式问题**，必须整改后方可上线。

---

## 二、模块一：F-INQ-001 家长查询队列模块

### 2.1 代码质量

#### ✅ 符合规范项
- Entity 使用 TypeORM 装饰器，字段定义清晰
- DTO 有 Swagger 文档注解
- 分页实现正确（`skip/take`）
- 使用 QueryBuilder 防止 SQL 注入

#### ❌ 不符合规范项

| # | 问题 | 文件 | 严重程度 | 说明 |
|---|------|------|:--------:|------|
| Q-INQ-01 | **SLA 检查逻辑缺陷** | `inquiry.service.ts` L355-364 | 🔴严重 | `checkSLAViolations` 仅检查 `normal` SLA（24h），完全忽略 `urgent` SLA（2h）。SPEC v1.7.0 F-INQ-001 明确要求普通24h、紧急2h。 |
| Q-INQ-02 | **实体外键指向错误** | `inquiry.entity.ts` L27-31 | 🟡中等 | `parentId` 和 `studentId` 的 `@ManyToOne` 均指向 `User` 实体，但 DB-SCHEMA 中 `parent_inquiries.parent_id` FK 应指向 `parents` 表，`student_id` FK 应指向 `students` 表。TypeORM 运行时可能报错 FK 约束冲突。 |
| Q-INQ-03 | **UpdateInquiryDto 字段类型错误** | `inquiry.dto.ts` L56 | 🟡中等 | `escalationRequired` 声明为 `string`，实际应为 `boolean`；`aiConfidence` 声明为 `string`，实际应为 `number`（entity 定义为 `decimal`）。类型不匹配导致运行时类型错误。 |
| Q-INQ-04 | **ESLint 格式问题** | 多文件 | 🟡中等 | 共发现 22 个 ESLint 错误：7 个 `prettier/prettier` 格式问题、3 个 `@typescript-eslint/no-unused-vars`（`Put`、`HttpCode` 导入未使用；`BadRequestException` 未使用；`Between/LessThanOrEqual/MoreThanOrEqual` 未使用；`InquiryPriority` 未使用）。 |

### 2.2 功能完整性

| SPEC 要求 | 实现状态 | 说明 |
|-----------|:--------:|------|
| AI 意图分类（bus_schedule/fee_inquiry 等） | ✅ | `performAIAnalysis` 实现了分类 |
| 情感分析 | ✅ | 关键词检测情感（positive/neutral/negative）|
| 自动回复判断（FAQ匹配） | ✅ | `checkAutoResponseEligible` |
| SLA 监控（普通24h/紧急2h）| ⚠️ 部分 | 仅实现24h，2h未实现 |
| 通话质量字段（通话时长/通话结果）| ✅ | Entity 有 `callDurationMinutes`/`callResult` 字段 |
| 家长满意度评价 | ✅ | `submitSatisfaction` 方法 |
| 快速回复模板（F-INQ-002）| ✅ | `getTemplates`/`createTemplate` |

### 2.3 合规性

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 敏感操作记录审计日志 | ✅ | 创建/更新/分配/回复/满意度/关闭均已记录 |
| @Roles 权限守卫 | ✅ | 各端点正确配置角色 |
| 家长查询列表权限过滤 | ⚠️ 有缺陷 | `findAll` 方法未根据角色过滤——家长可看到所有查询记录，违反最小可见原则 |

### 2.4 技术规范

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 接口响应时间 ≤500ms | ⚠️ 未测 | 需性能测试验证 |
| 错误处理规范 | ✅ | 使用 NestJS 标准异常 |
| 分页正确实现 | ✅ | skip/take + total 返回 |

---

## 三、模块二：F-LEAVE-001 请假申请处理模块

### 3.1 代码质量

#### ✅ 符合规范项
- 请假天数计算逻辑正确
- 审批流程状态机设计合理
- 病假自动批准风险管控（AI核验随机标记）已实现
- DTO 验证注解完整

#### ❌ 不符合规范项

| # | 问题 | 文件 | 严重程度 | 说明 |
|---|------|------|:--------:|------|
| Q-LEAVE-01 | **班主任审批角色范围过宽** | `leave.controller.ts` L57-60 | 🔴严重 | `@Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)` 允许 `TEACHER` 审批请假。根据 SPEC v1.7.0 F-LEAVE-001，班主任审批人应为 Class Teacher（通过 `class_teachers` 表关联），而非所有 `TEACHER` 角色用户。普通教师未经办该班级班主任事务，不应具有审批权限。 |
| Q-LEAVE-02 | **Entity 外键指向 User 而非 Student/Class** | `leave.entity.ts` L36-44 | 🔴严重 | `studentId` 的 `@ManyToOne(() => User)` 和 `classId` 的 `@ManyToOne(() => User)` 均指向 `User` 实体，但 DB-SCHEMA 中 `leave_applications.student_id` FK 应指向 `students` 表，`class_id` 应指向 `classes` 表。运行时将导致 FK 约束错误。 |
| Q-LEAVE-03 | **AI 核验实现与 SPEC 不符** | `leave.service.ts` L89-99 | 🟡中等 | SPEC 要求"随机抽取 5%-10% 进行 AI 辅助核验，对高风险案例（同一天多名学生提交、重复使用同一诊所证明等）触发人工复查"。当前实现仅 `Math.random() < 0.1` 随机标记，无高风险模式检测（同诊所证明、同日提交等）。 |
| Q-LEAVE-04 | **ESLint 格式问题** | 多文件 | 🟡中等 | 共发现 18 个 ESLint 错误：`prettier` 格式问题、未使用的 `Between/LessThanOrEqual/MoreThanOrEqual` 导入、未使用参数 `userId`/`userRole`。 |

### 3.2 功能完整性

| SPEC 要求 | 实现状态 | 说明 |
|-----------|:--------:|------|
| 请假审批流程（≤3天班主任、>3天校务主任）| ✅ | `requiresDirectorApproval(totalDays > 3)` 正确实现 |
| 医疗证明校验（病假>2天）| ✅ | `requiresMedicalCert` 正确实现 |
| AI 核验（5%-10%随机+高风险检测）| ⚠️ 部分 | 仅随机标记，缺少高风险模式检测 |
| 跟进提醒（follow_up_date）| ✅ | `setFollowUp` 方法 |
| 审批进度状态条（submitted/pending_approval/approved/rejected）| ✅ | 状态枚举完整 |
| 代课老师推荐（包含当日已排课时数）| ❌ | **SPEC F-LEAVE-001 新增要求**，`getStatistics` 等方法未返回代课老师课时数据 |
| 家长取消请假 | ✅ | `cancel` 方法 |
| 销假（学生返校）| ✅ | `checkIn` 方法 |

### 3.3 合规性

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 审计日志 | ✅ | 创建/审批/拒绝/取消/销假均已记录 |
| @Roles 权限守卫 | ⚠️ | `TEACHER` 角色范围过宽（见 Q-LEAVE-01）|
| 敏感字段自动掩码 | N/A | 本模块无直接敏感字段展示 |

### 3.4 技术规范

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 接口响应时间 ≤500ms | ⚠️ 未测 | 需性能测试 |
| 错误处理规范 | ✅ | 正确使用 `NotFoundException`/`BadRequestException` |
| 分页正确实现 | ✅ | skip/take + total |

---

## 四、模块三：F-AUTO-002 多渠道通知服务

### 4.1 代码质量

#### ✅ 符合规范项
- 通知渠道枚举覆盖完整（APP/SMS/邮件/WhatsApp）✅ 符合 SPEC
- 送达回执机制（`NotificationDelivery` 实体跟踪每个接收者的送达状态）
- 重试逻辑（3次重试 + 降级到备用渠道）
- 免打扰时间检查
- 模板管理（多渠道内容差异化配置）

#### ❌ 不符合规范项

| # | 问题 | 文件 | 严重程度 | 说明 |
|---|------|------|:--------:|------|
| Q-NOTIFY-01 | **⚠️ XSS 安全漏洞** | `notification.service.ts` L127-135 | 🔴严重 | `replaceVariables` 方法直接将用户提供的变量值插入字符串，未进行任何 HTML 转义。若通知内容渲染为 HTML（如邮件），攻击者可注入 `<script>` 等恶意代码。**必须修复：使用 `escapeHtml()` 对变量值进行转义**。 |
| Q-NOTIFY-02 | **紧急通知缺少短信备用** | `notification.service.ts` | 🟡中等 | SPEC v1.7.0 F-AUTO-002 要求：紧急通知（URGENT/CRITICAL）应自动启用短信备用渠道。当前 `processDeliveries` 只在主动失败时降级，未对高优先级通知强制启用多渠道。 |
| Q-NOTIFY-03 | **`markAsRead` 缺少角色权限控制** | `notification.controller.ts` L115-122 | 🟡中等 | `@Roles()` 仅列举了 `PARENT/STUDENT/TEACHER/SCHOOL_STAFF`，但 `SCHOOL_DIRECTOR` 和 `SYSTEM_ADMIN`（可发送通知）反而被排除在外，且任何经过 JWT 认证的用户均可标记任意通知为已读，存在越权风险。 |
| Q-NOTIFY-04 | **`sendNotification` 缺少审计日志** | `notification.controller.ts` L44-58 | 🟡中等 | 发送通知是敏感操作，但 `send` 端点虽调用了 `auditService.log`，传入的 action 类型被强转为 `any`（`notification_send as any`），且未记录 `relatedEntityId`、`recipientIds` 等关键信息，不符合 F-USER-005 审计要求。 |
| Q-NOTIFY-05 | **ESLint 格式问题** | 多文件 | 🟡中等 | 6 个 ESLint 错误：`Patch`/`HttpCode` 导入未使用、4 个 `prettier` 格式问题。 |

### 4.2 功能完整性

| SPEC 要求 | 实现状态 | 说明 |
|-----------|:--------:|------|
| 多渠道（APP/短信/邮件/WhatsApp）| ✅ | `NotificationChannel` 枚举覆盖四种渠道 |
| 送达回执机制 | ✅ | `NotificationDelivery` 实体跟踪每条送达状态 |
| 短信备用渠道（紧急通知）| ⚠️ 缺失 | 仅在主动失败时降级，URGENT 通知未自动多渠道发送 |
| Token 健康检查（每24h）| ❌ | 未在通知模块实现，SPEC 标注为 P0 运维需求（F-OPS-006）属于基础设施层 |
| 模板多渠道内容差异化 | ✅ | `appPushContent`/`smsContent`/`whatsappContent` 分离配置 |
| 变量替换 `{{var}}` | ✅ | `replaceVariables` 实现 |
| 免打扰时段 | ✅ | `isInQuietHours` 实现 |
| 重试 + 降级机制 | ✅ | `handleDeliveryFailure` 实现 |
| 批量通知统计（batchSent/batchFailed）| ✅ | `Notification` 实体含 `batchTotal/batchSent/batchFailed` |

### 4.3 合规性

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 敏感操作记录审计日志 | ⚠️ 部分 | `send` 端点有日志但不完整；`retryFailed` 有日志 |
| @Roles 权限守卫 | ⚠️ | `markAsRead` 权限范围不完整 |
| XSS 防护 | ❌ | `replaceVariables` 无转义（见 Q-NOTIFY-01）|

### 4.4 技术规范

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 接口响应时间 ≤500ms | ⚠️ 未测 | 批量发送 N 个接收者时循环串行处理，可能超时 |
| 错误处理规范 | ✅ | 正确使用 `NotFoundException`/`BadRequestException` |
| 分页正确实现 | ✅ | skip/take + total |
| 异步处理 | ⚠️ | 发送逻辑同步执行（模拟），生产环境应使用队列 |

---

## 五、问题汇总

### 5.1 严重问题（5项，必须修复）

| ID | 模块 | 问题 | 整改建议 |
|----|:----:|------|----------|
| Q-INQ-01 | INQ | SLA 检查仅支持 normal（24h），未处理 urgent（2h）| 在 `checkSLAViolations` 中增加 `urgency === 'urgent'` 的阈值分支（2h），`checkSLAViolations` 方法应分别查询两种 SLA 的超时记录 |
| Q-LEAVE-01 | LEAVE | `@Roles()` 允许所有 TEACHER 审批请假，不符合 SPEC | 改为 `@Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)`，另通过 `class_teachers` 表在 service 层验证当前用户是否为该班级的班主任（`classId` 对应） |
| Q-LEAVE-02 | LEAVE | Entity 外键指向 User 表，与 DB-SCHEMA 不符 | 将 `ParentInquiry.student` 改为 `@ManyToOne(() => Student)`，`ParentInquiry.parent` 改为 `@ManyToOne(() => Parent)`；将 `LeaveApplication.student` 改为 `@ManyToOne(() => Student)`，`LeaveApplication.class` 改为 `@ManyToOne(() => Class)` |
| Q-NOTIFY-01 | NOTIFY | `replaceVariables` 无 XSS 防护 | 引入 `escape-html` 库，对 `variables` 中的值执行 `escapeHtml(value)` 后再替换 |
| Q-NOTIFY-03 | NOTIFY | `markAsRead` 权限控制不完整 | 将 `@Roles` 改为包含所有角色，或移除 `@Roles` 改为在 service 层按 `recipientId === req.user.id` 校验归属 |

### 5.2 中等问题（11项，建议修复）

| ID | 模块 | 问题 | 整改建议 |
|----|:----:|------|----------|
| Q-INQ-02 | INQ | 实体 parentId/studentId 指向 User 表 | 见 Q-LEAVE-02 整改方案 |
| Q-INQ-03 | INQ | UpdateInquiryDto 字段类型错误（string vs boolean/number）| 修正 `escalationRequired: boolean`、`aiConfidence: number` |
| Q-INQ-04 | INQ | ESLint 格式问题（22处）| 运行 `npm run lint -- --fix` 自动修复格式问题，删除未使用的导入 |
| Q-LEAVE-03 | LEAVE | AI 核验缺少高风险模式检测 | 增加同诊所证明检测（分析 `documentUrl` 路径模式）、同日多名学生检测（按 `createdAt` 日期分组统计） |
| Q-LEAVE-04 | LEAVE | ESLint 格式问题（18处）| 运行 `npm run lint -- --fix` |
| Q-LEAVE-05 | LEAVE | 缺少代课老师课时数字段（SPEC 新增要求）| 在审批通过响应中增加 `substituteTeacherClassHours` 字段，需扩展 entity 和 service |
| Q-NOTIFY-02 | NOTIFY | 紧急通知未自动启用短信备用 | 在 `sendNotification` 中判断 `urgency === URGENT || CRITICAL` 时，自动追加 `SMS` 到渠道列表 |
| Q-NOTIFY-04 | NOTIFY | sendNotification 审计日志不完整 | 补充 `recipientIds`、`channel`、`urgency` 到审计日志的 `metadata` 字段 |
| Q-NOTIFY-05 | NOTIFY | ESLint 格式问题（6处）| 运行 `npm run lint -- --fix` |
| Q-INQ-05 | INQ | 家长查询列表未按角色过滤 | 在 `findAll` service 方法中增加角色过滤逻辑：PARENT 角色只能查看 `parentId === userId` 的记录 |
| Q-NOTIFY-06 | NOTIFY | 批量通知串行处理可能超时 | 将 `processDeliveries` 中的同步循环改为 Promise.all 或引入 Bull 队列 |

---

## 六、ESLint 问题清单（格式化 + 未使用导入）

| 文件 | 问题数 | 类型 |
|------|:------:|------|
| `inquiry/inquiry.service.ts` | 13 | 格式 + unused imports |
| `inquiry/inquiry.controller.ts` | 9 | 格式 + unused imports |
| `leave/leave.service.ts` | 14 | 格式 + unused imports |
| `leave/leave.controller.ts` | 5 | 格式 + unused imports |
| `notification/notification.controller.ts` | 6 | 格式 + unused imports |
| **合计** | **47** | 全部可通过 `npm run lint -- --fix` 修复 |

---

## 七、审查结论

| 模块 | 结论 | 阻塞问题数 |
|------|:----:|:----------:|
| F-INQ-001 家长查询队列 | 🟡 条件通过 | 2 严重 + 3 中等 |
| F-LEAVE-001 请假申请处理 | 🟡 条件通过 | 2 严重 + 3 中等 |
| F-AUTO-002 多渠道通知服务 | 🟡 条件通过 | 1 严重⚠️ + 3 中等 |

**整体结论：🟡 条件通过**

**整改要求：**
1. 5 个严重问题（含 XSS 安全漏洞）必须在本轮修复
2. 11 个中等问题建议在本轮一并修复
3. 47 个 ESLint 格式问题通过 `npm run lint -- --fix` 自动修复
4. 修复后需重新提交 CI 流水线验证

---

*审查报告由 CHECKER 质检岗自动生成 | 2026-06-07*
