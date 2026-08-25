# School Admin System — 功能实现状态报告

> 生成时间：2026-08-25 07:16 (GMT+8)
> 规格基准：`SPEC-COMPLETE.md` v2.0.0-draft.1（16 模块 / 81 功能，仍在「变更中」）
> 数据来源：`apps/backend/src/modules`（40 模块）· 前端页面清单（admin 25 页 + portal + QR）· GitHub Issues/里程碑（#312–#364）
> 维护者：PM（协调文档，属 PM 操作白名单）

---

## 1. 总览

本系统功能实现分四层递进：**规格 → 设计 → 代码 → 形式化追踪**。四层进度不一致，须区分看待。

| 层 | 状态 | 关键数字 |
|----|------|---------|
| ① 规格 Spec | 基准 | 16 模块 / 81 功能（v2.0.0-draft.1） |
| ② 技术设计 Design | ✅ 100% 冻结 | 10/10 设计任务完成（#355–#364，SD §16–25 + DB + DD + API） |
| ③ 代码 Code | 🟡 部分 | 40 后端模块（35 有 controller/service，5 仅 entity 脚手架）；admin 25 页 + portal + QR |
| ④ 形式化追踪 Tracking | 🔴 0% 功能关闭 | 43 功能 Issue（#312–#354）全部 OPEN；10 设计 Issue 全部 CLOSED |

**核心结论**：技术设计已全部冻结，代码层存在大量「既有实现」与「空脚手架」混杂，但按里程碑追踪的 43 项功能**尚无一项被正式关闭**——即「规格合规级完成度」为 0/43，这是当前最大的进度断层。

---

## 2. 规格范围（16 模块 / 81 功能）

| # | 模块 ID | 模块 | 功能数 |
|---|---------|------|--------|
| 1 | MOD-DAILY-001 | 每日晨检仪表板 | 10 |
| 2 | MOD-CYCL-001 | 周期性校务管理 | 11 |
| 3 | MOD-FIN-001 | 财务及资产管理 | 7 |
| 4 | MOD-USER-001 | 用户与权限管理 | 7 |
| 5 | MOD-INT-001 | 整合及合规 | 6 |
| 6 | MOD-AI-001 | AI 助理及自动化 | 5 |
| 7 | MOD-I18N-001 | 多语言 | 4 |
| 8 | MOD-NEW-001 | 新增功能 | 6 |
| 9 | MOD-OPS-001 | 运维自动化 | 9 |
| 10 | MOD-MEET-001 | 会议管理 | 4 |
| 11 | MOD-RECRUIT-001 | 教师招聘 | 5 |
| 12 | MOD-STU-001 | 学生档案 | 3 |
| 13 | MOD-ATTQR-001 | QR 考勤 | 4 |
| 14 | MOD-PORTAL-AC-001 | 门户权限 | 3 |
| 15 | —（Module 12） | 长期规划 | 0（roadmap 引用） |
| 16 | — | 合计 | 81 |

---

## 3. 代码层现状（后端 40 模块）

### 3.1 完整 CRUD 实现（含 controller + service + RBAC 守卫）

auth · user · student · student-profile · attendance · dashboard · inquiry · leave · lunch · bus · fee · tuition · scholarship · asset · budget · exam · dse · grades · ai · notification · address-book · course · health · metrics · settings · school-info · abac · permission · role · audit · backup · recruitment(×5 controller)

### 3.2 仅 entity 脚手架（无 controller/service，逻辑未落地）

meeting · otp · permission-approval · portal

> 说明：`integration-tests` 为测试目录，不计入业务模块。

### 3.3 前端页面

- **admin-app**（25 页）：仪表板、出勤、学生、请假、午膳、家长查询、财务（学费/奖学金/分期/收费）、资产（管理/租借）、考试、成绩、课程、用户、设置、二维码、通知等。
- **portal-app**：学生门户、家长门户、电子请假、QR 签到扫码页。

---

## 4. 模块级实现状态（代码 × 追踪 综合）

| 模块 | 代码现状 | 形式化追踪（里程碑 Issue） |
|------|---------|--------------------------|
| 每日晨检仪表板 | 🟡 核心已实现（dash/att/inq/lunch/leave/fee） | 校车 M2 #332、查询模板 M2 #340、收费追踪 M1 #331 |
| 周期性校务 | 🟡 exam/dse/grades 已有代码 | 注册/收生/年终 M1 #322–#329 |
| 财务及资产 | 🟡 tuition/scholarship/asset 已有代码 | 报销 M1 #330、供应商 M2 #339、资产 M2 #336–#338 |
| 用户与权限 | 🟡 auth/rbac/abac/audit 已有代码 | F-USER-003~007 M1 #312–#316 |
| 整合及合规 | 🟡 audit/backup 已有代码 | WebSAMS/eClass/合规/双人见证 M1 #317–#321 |
| AI 自动化 | 🟡 ai 基础 + notification | FAQ M2 #343、任务触发 M2 #341、提醒 M2 #342、OCR M4 #350 |
| 多语言 | 🟡 框架已建（P1 bug #367/#368） | 实时翻译 M4 #351、本地化 M4 #352 |
| 新增功能 | 🟡 budget/dse 部分 | 通知模板 M4 #353、报表 M4 #354 |
| 运维自动化 | 🟡 脚本/cron 部分（备份#309 等） | SSL/token/配额/告警/DDL审计/仪表板 M3 #344–#349 |
| 会议管理 | 🔴 仅 entity | （未入里程碑，待拆分） |
| 教师招聘 | 🟡 后端 5 controller 完整，无前端 | （未入里程碑，待拆分） |
| 学生档案 | ✅ CRUD + 学号已上线，班级分配部分 | 班级分配（依赖 F-STU-003） |
| QR 考勤 | ✅ 已上线 | — |
| 门户权限 | 🟡 档案/请假已上线，数据隔离部分 | — |

> 标注说明：✅ 已实现并上线 · 🟡 部分实现 · 🔴 未实现（纯规格）。

---

## 5. 里程碑进度（M1–M4）

| 里程碑 | 定位 | 功能 Issue | 设计 Issue | 说明 |
|--------|------|-----------|-----------|------|
| M1 Blocker 上线阻断 | 缺失则无法合规/安全/正确使用 | 20 OPEN / 0 CLOSED | 5 CLOSED | 权限授权、审计合规、教育局对接、核心教学/收生、基础财务 |
| M2 Core 核心业务闭环 | 日常校务运转必需 | 12 OPEN / 0 CLOSED | 3 CLOSED | 校车/资产/供应商/AI 自动化 |
| M3 Ops 运维安全保障 | 长期安全稳定 | 6 OPEN / 0 CLOSED | 1 CLOSED | SSL/Token 刷新/配额/告警/DDL 审计/健康仪表板 |
| M4 Enhance 重要增强 | 体验效率提升 | 5 OPEN / 0 CLOSED | 1 CLOSED | OCR/实时翻译/本地化/通知模板/报表推送 |

**合计**：43 功能 Issue 全部 OPEN，10 设计 Issue 全部 CLOSED。

> ⚠️ 里程碑「重要性分层、非时间」——M1 优先于 M2/M3/M4 推进，但无时间约束。

---

## 6. M1 Blocker 明细（20 功能 + 开始条件）

> 所有 M1 功能的「技术设计已就绪」门槛均已满足（设计任务 #355–#359 已 CLOSED）。下列为各功能的**额外依赖（开始条件）**。

| # | 功能 ID | 功能 | 优先级 | 开始条件（依赖） |
|---|---------|------|--------|-----------------|
| 312 | F-USER-003 | 功能授权 RBAC+ABAC | P0 | F-USER-002 闭环；角色-权限矩阵 + ABAC 策略冻结 |
| 313 | F-USER-004 | 会话与 Token 管理 | P0 | F-USER-002 闭环；token 生命周期/刷新/吊销策略入 API-DESIGN |
| 314 | F-USER-005 | 审计日志与登录记录 | P0 | F-USER-001/002 闭环；审计表结构 + 事件目录冻结 |
| 315 | F-USER-006 | 密码与凭证重置 | P0 | F-USER-001 闭环；管理员/自助两种重置流程定义 |
| 316 | F-USER-007 | 权限变更审批流程 | P1 | F-USER-003 闭环；审批链与双人见证(F-COMP-002)关系 |
| 317 | F-COMP-001 | 隐私条例合规检查 | P0 | 数据模型冻结；PDPO 合规清单 + 敏感字段清单冻结 |
| 318 | F-COMP-002 | 双人见证流程 | P0 | 见证适用范围（财务/敏感字段/权限变更）；依赖 F-USER 审计 |
| 319 | F-COMP-003 | 审计日志管理 | P0 | F-USER-005 事件目录已定义；审计保留策略冻结 |
| 320 | F-INT-001 | WebSAMS 数据同步 | P0 | WebSAMS API 文档/凭证（**外部依赖**）；字段映射冻结 |
| 321 | F-INT-002 | eClass 系统集成 | ~~P0~~ **P3 ⬇️** | eClass API 文档（**外部依赖**）；集成范围 + 字段映射冻结 |
| 322 | F-EXAM-001 | DSE 报考管理 | P0 | 学生档案 + 学年数据就绪；DSE 字段/状态机冻结 |
| 323 | F-EXAM-002 | 试卷管理 | P0 | F-EXAM-001 闭环；试卷状态机（拟卷/审核/印制/密封）冻结 |
| 324 | F-EXAM-003 | 特别考试安排 | P0 | F-EXAM-001/002 闭环；特别安排规则 + 审批流冻结 |
| 325 | F-EXAM-004 | 成绩单生成与发布 | P0 | 成绩数据模型冻结；发布/审核流程冻结 |
| 326 | F-ENRL-001 | 新生注册 | P0 | 学生档案 + 班级分配就绪；注册字段/状态机冻结 |
| 327 | F-ADM-001 | 中一自行分配学位 | P0 | F-ENRL-001 闭环；学位规则 + 面试流程冻结 |
| 328 | F-ADM-002 | JUPAS 联招管理 | P0 | 学生档案 + DSE 成绩就绪；JUPAS 文件/推荐信流程冻结 |
| 329 | F-YREND-002 | 学年财务结算 | P0 | 财务模块(F-FIN-*)就绪；结算科目 + 截止规则冻结 |
| 330 | F-FIN-002 | 零用现金报销 | P0 | F-COMP-002 双人见证闭环；报销科目表 + 额度规则冻结 |
| 331 | F-FEE-001 | 费用收取追踪 | P0 | 学生/班级数据就绪；收费项目 + 减免规则冻结 |

**M1 关键外部依赖**：#320 WebSAMS 需第三方 API 文档/凭证，属团队不可控项，建议并行推进其余可推进功能。⚠️ #321 eClass 已于 2026-08-25 降级为 P3（用户指令），不再作为 M1 阻断项。

---

## 7. 当前活跃缺陷与在途工作

- **活跃前端 bug（4）**：#367/#368（P1 i18n 切换失效）、#366（P2 下拉框不可达）、#365（移除 Agents 菜单，ready-for-review）。
- **PR #369** `fix/i18n-lang-switch`：已开，**mergeable=CONFLICTING**，需人工解决冲突后合入。
- **#309 备份**：已 CLOSED ✅，持续 15+ 晚非空备份验证有效。
- **#310 公网端点**：已 CLOSED（cloudflared host egress，非应用可修）。

---

## 8. 数据来源与口径说明

1. 功能总数以 SPEC `v2.0.0-draft.1` 的 Changelog（「功能函数总数 74→81，模块 14→16」）为准。
2. 「代码现状」以 `apps/backend/src/modules/*` 是否含 controller/service 判定；「仅 entity 脚手架」计为未实现逻辑。
3. 「形式化追踪」以 GitHub 里程碑（M1–M4）+ 功能 Issue（#312–#354）判定；设计 Issue（#355–#364）已全部 CLOSED。
4. 存在「既有代码 vs 形式化追踪」断层：部分模块（exam/dse/fee/asset/tuition/abac/permission/role 等）已有完整 CRUD 代码，但对应功能 Issue 仍 OPEN——原因为 08-13 批量建单时按「规格合规级完成」口径建档，未按既有代码回填。**建议后续做一次「代码 vs Issue」去重对账**（与 08-13 记录的旧 backlog #43–#56 重叠问题一并处理）。
