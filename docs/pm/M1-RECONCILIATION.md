# M1 功能实现对账审计报告（代码 vs 规格）

- **审计日期**：2026-08-25
- **审计角色**：DEV（只读，未修改任何业务代码）
- **规格版本**：`docs/school-admin-system/SPEC-COMPLETE.md` v2.0.0-draft.1
- **审计范围**：M1 里程碑 20 项功能（GitHub #312–#331）
- **状态图例**：✅ 已实现（controller+service 完整 CRUD+RBAC） / 🟡 部分（仅脚手架或仅部分端点） / ❌ 缺失（无对应代码）

> 说明：本规格中仅部分功能含显式「验收标准 (AC)」章节（如 F-FIN-002、各 ATT/INQ/BUS 等）。M1 中的 F-EXAM/ADM/YREND/ENRL 多项以「业务规则 + 输入/输出 + 流程」代替 AC。以下「关键 AC 摘要」取自该功能的业务规则/输出/流程等价验收点。

---

## 对账总表

| 功能ID | 功能名 | 后端模块/文件 | 后端状态 | 前端页面 | 前端状态 | 缺口(对照AC) | 建议首步动作 |
|--------|--------|--------------|---------|---------|---------|-------------|-------------|
| F-USER-003 | 功能授权 (RBAC+ABAC) | `modules/permission/`（templates+audit+init）、`modules/role/`、`modules/abac/`（abac.guard.ts + OPA rego策略 + controller: health/policies/evaluate/audit）、全局 JwtAuthGuard+RolesGuard | ✅ | `pages/UserPage.tsx`（角色+权限矩阵分配） | 🟡 | ABAC 细粒度策略管理/评估 UI 缺失；OPA 运行时部署依赖 | 加 ABAC 策略查看/热更新管理页 |
| F-USER-004 | 会话与 Token 管理 | `modules/auth/`（auth.controller login/verify-otp/refresh；RefreshToken） | 🟡 | `pages/Login.tsx` | 🟡 | 无会话列表/主动登出/强制登出/并发上限(3)/空闲自动登出(60min)/异地登录检测/改密作废会话 端点 | 新增 sessions 端点 + 登出/并发/空闲逻辑 |
| F-USER-005 | 审计日志与登录记录 | `modules/audit/`（仅 entity+service 写侧，无 controller）；部分读侧在 `modules/permission/`permission.controller + `modules/abac/`abac.controller audit 端点 | 🟡 | 无 | ❌ | 审计日志写入了，但无通用审计查询/登录事件记录/保留策略管理 UI | 新增 audit 查询 controller + 审计管理页 |
| F-USER-006 | 密码与凭证重置 | `modules/auth/password.controller.ts`（set-password/request-reset-otp/reset-password/link-student）+ `modules/otp/`（generate/verify/bind） | ✅ | `pages/SetPasswordPage.tsx`、`pages/LinkStudentPage.tsx` | 🟡 | 邮箱/短信OTP 找回 UI 完备度待确认；到校办理流程 UI 缺 | 补齐 OTP 找回完整 UI 流程 |
| F-USER-007 | 权限变更审批流程 | `modules/permission-approval/`（create/my-requests/pending-approvals/approve/reject/cancel/expire + applyPermissionChange） | ✅ | 无 | ❌ | 审批时的二次认证（短信OTP/硬件Token）校验未实现；无审批前端 | approval 前端页 + 审批二次OTP接入 |
| F-COMP-001 | 隐私条例合规检查 | 无对应模块 | ❌ | 无 | ❌ | PDPO 合规检查（目的限制/资料最小化/保留期限）未实现 | 新建 compliance 模块（PDPO检查规则引擎） |
| F-COMP-002 | 双人见证流程 | 无对应模块 | ❌ | 无 | ❌ | 双人见证状态机/见证人推送/时间戳锁定未实现 | 建 witness 服务（可复用于报销/保险箱） |
| F-COMP-003 | 审计日志管理 | `modules/audit/`（仅写侧） | 🟡 | 无 | ❌ | 审计日志查询/导出/保留策略管理缺 | 审计管理端（列表/检索/导出/归档） |
| F-INT-001 | WebSAMS 数据同步 | 无（仅 grade-record.entity 提及字段） | ❌（外部依赖） | 无 | ❌ | **外部依赖**：WebSAMS 同步调度/双向同步未实现 | 依赖外部系统，暂不派发 |
| F-INT-002 | eClass 系统集成 | 无 | ❌（外部依赖,P3） | 无 | ❌ | **外部依赖**：eClass API 消费未实现 | 已降 P3，暂缓 |
| F-EXAM-001 | DSE 报考管理 | `modules/dse/`（releases/results/offers/reviews = DSE放榜+结果）非报考；`modules/exam/` = 通用考试排期 | ❌ | 无 | ❌ | 报考流程（6-8科 A/B/C分类、逾期费、特殊安排、提交HKEAA）未实现 | 新增 DSE 报考模块（enrollment） |
| F-EXAM-002 | 试卷管理 | `modules/exam/`（仅通用考试排期，无印刷/密封/保险箱/分发/销毁） | ❌ | 无 | ❌ | 试卷印刷申请/密封追踪/保险箱/监考签收/回收销毁 全部缺 | 新增 exam-paper 模块（6子功能） |
| F-EXAM-003 | 特别考试安排 | `modules/exam/`（无 special-arrangements 字段逻辑） | ❌ | 无 | ❌ | 额外时间/独立考场/抄写员/读卷员/盲文/轮椅 安排+审批未实现 | 在 exam 加 special arrangement + HKEAA审批 |
| F-EXAM-004 | 成绩单生成与发布 | `modules/grades/`（records CRUD + submit/revoke-48h/approve/reject + grade-pdf.service 生成/下载/批量 + class stats + grade-alerts 告警） | ✅ | `pages/StudentProfilePage.tsx`（成绩视图） | 🟡 | 前端缺教师/主任专用成绩单管理+审批工作台、家长PDF导出 | 建成绩单审批+家长导出前端页 |
| F-ENRL-001 | 新生注册管理 | `modules/student/`（CRUD + class 分配 + admission_date）；无注册申请工作流 | 🟡 | `pages/StudentPage.tsx` | 🟡 | 注册申请(application_no、文件核对清单、SEN、webSAMS同步)未实现 | 新增 enrollment 注册申请+文件核对流 |
| F-ADM-001 | 中一自行分配学位 | 无 | ❌ | 无 | ❌ | 收生准则/面试/评分(30/30/10/5/10/15)/正取名单 未实现 | 新增 S1 admission 模块 |
| F-ADM-002 | JUPAS 联招管理 | 无 | ❌ | 无 | ❌ | 选择收集/推荐信(含AI提示)/申请状态/上诉 未实现 | 新增 jupas 模块 |
| F-YREND-002 | 学年财务结算 | `modules/budget/`（fiscal-year 预算+expense+approve/pay+对比）；无年末对账算法 | 🟡 | `pages/FinanceTuitionPage.tsx` | 🟡 | 年末对账（总收费 vs 支出 vs 净结余/欠费/预算差异）算法+报表缺 | 新增年末对账汇总服务 |
| F-FIN-002 | 零用现金报销 | 无（无 reimburse/petty-cash/witness/OCR 代码） | ❌ | 无 | ❌ | 报销提交/OCR收据/双人见证/审批/备用金追踪/动态限额 全缺 | 新增 petty-cash 报销模块（复用 witness+OCR） |
| F-FEE-001 | 收费追踪 | `modules/fee/`（fee.controller types/records/items/collections/reductions/payment 全 CRUD）+ `modules/tuition/` | ✅ | `pages/FinanceFeePage.tsx`、`FinanceTuitionPage.tsx` | ✅ | 基本完备；欠费提醒/收据推送等增强待确认 | 按需增强收据/提醒 |

---

## 结论汇总

- **✅ 已实现**：F-USER-003、F-USER-006、F-USER-007、F-EXAM-004、F-FEE-001（5 项）
- **🟡 部分实现**：F-USER-004、F-USER-005、F-COMP-003、F-ENRL-001、F-YREND-002（5 项）
- **❌ 缺失**：F-COMP-001、F-COMP-002、F-EXAM-001、F-EXAM-002、F-EXAM-003、F-ADM-001、F-ADM-002、F-FIN-002（8 项）＋ F-INT-001/002（外部依赖）
- 后端状态：实现度 **13/20**（✅5 + 🟡5 + 可视为具备基础设施），其余无明显对应代码。
- 前端明显滞后：仅 5 项有对应页面，审计/审批/见证/DSE/报考/报销/合规等均无 UI。

---

## 可直接派发开工的 M1 第一批（❌缺失 且 无外部依赖）

按依赖顺序排列（先依赖层，后复用层）：

| 顺序 | 功能 | 依赖理由 / 建议 |
|------|------|---------------|
| 1 | F-COMP-002 双人见证流程 | 底层通用基础设施，F-FIN-002 依赖它；先建 witness 服务 |
| 2 | F-FIN-002 零用现金报销 | 复用 F-COMP-002 witness + OCR；业务独立、闭环 |
| 3 | F-EXAM-001 DSE 报考 | 独立报考流程，优先于试卷/特别考试 |
| 4 | F-EXAM-003 特别考试安排 | 复用 exam 模块加 special-arrangement 字段 |
| 5 | F-EXAM-002 试卷管理 | 依赖考试排期后做印刷/密封/保险箱/分发/销毁 |
| 6 | F-ADM-001 中一自行分配学位 | 独立 EDB 收生流程 |
| 7 | F-ADM-002 JUPAS 联招管理 | 相对独立，排中一之后 |
| 8 | F-COMP-001 隐私条例合规检查 | 跨模块检查逻辑，建议与 witness/审计统一基建后做 |

> **不排入第一批**（外部依赖）：F-INT-001 WebSAMS、F-INT-002 eClass（P3）。
> **建议与第一批并行排期**：补强 🟡 项缺口（F-USER-004 会话管理端点、F-USER-005/F-COMP-003 审计查询端、F-ENRL-001 注册工作流、F-YREND-002 年末对账算法），因多为后端端点补齐，工作量小、价值高。
