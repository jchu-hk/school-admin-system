# 多Agent协作工作流规则 (v2.0)

> **最后更新**: 2026-07-14 23:55 (GMT+8)
> **适用范围**: 所有Agent (PM/DEV/QA/DEVOPS/CHECKER/ARCH/REQ)
> **规则类型**: 强制 (Mandatory)

---

## 1️⃣ GitHub Issue 同步规则 (Issue Lifecycle)

### 1.1 Issue 状态流

```
Created (OPEN)
   │
   ├─→ PM分配标签+指派 → [in-progress] + assignee
   │      │
   │      ├─→ Agent开始工作 → 添加 [in-progress] 标签
   │      │      │
   │      │      ├─→ Agent完成 → 关闭 Issue (CLOSED)
   │      │      │       └── 必须添加 comment: 交付物列表 + 测试结果
   │      │      │
   │      │      └─→ 阻塞/取消 → 移除 [in-progress] → 添加 [blocked]/[cancelled]
   │      │
   │      └─→ PM确认完成 → Close + 标签 [completed]
   │
   └─→ 无需处理 → Close + comment 说明理由
```

### 1.2 标签规则

| 事件 | 操作 | 示例 |
|------|------|------|
| 创建Issue | PM添加 Phase标签 + P0/P1/P2/P3 + 角色标签 | `Phase 4`, `p0`, `qa` |
| 分配任务 | PM添加 `[in-progress]` + 指派 Agent | `gh issue edit #255 --add-label "in-progress" --assign "qa"` |
| Agent开始工作 | Agent确认 `Received` 后保持 `in-progress` | 自动保持 |
| Agent完成 | Agent移除 `in-progress` + 关闭 Issue | `gh issue close #255` |
| 需要CHECKER | Agent添加 `[need-checker]` + 等待CHECKER确认 | 见 §3 |
| CHECKER通过 | CHECKER添加 `[checker-approved]` | |
| CHECKER驳回 | CHECKER添加 `[checker-rejected]` + 原因 | |

### 1.3 Issue 关闭前必填

**每个关闭的 Issue 必须包含 comment 记录**:

```markdown
### 交付物
- `文件路径` — 说明

### 关键结果
- 模块: xxx
- 覆盖率: xxx%
- 测试通过: N/M

### 根因/备注
- (如适用)
```

---

## 2️⃣ 任务完成 → Issue 闭环规则

### 2.1 强制流程

```
Agent完成任务
   ↓
Agent写入交付物到文件系统
   ↓
Agent调用 write_message.py 通知 PM (type=passed)
   ↓
Agent关闭 GitHub Issue + 添加结果comment
   ↓
== 如需CHECKER验证特殊路径 ↓ ==
Agent请求CHECKER验证
   ↓
CHECKER确认 → 关闭Issue
```

### 2.2 违规处理

| 违规行为 | 后果 |
|---------|------|
| 任务完成但 Issue 未关闭 | PM 立即关闭 + 记录违规 |
| 关闭 Issue 但无 comment | PM 追加 comment 补录 |
| 跳过 CHECKER 直接关闭 | 回滚 + 重新验证 |

---

## 3️⃣ CHECKER 验证交接规则

### 3.1 需要 CHECKER 的场景

以下场景必须经过 CHECKER 验证才能关闭 Issue:

| 场景 | 说明 | 示例 |
|------|------|------|
| 🔐 **安全相关** | RBAC/越权/脱敏/认证 | 门户权限隔离、数据脱敏实现 |
| 🏗️ **架构变更** | 新增模块/中间件/数据流变更 | QR考勤模块集成、OPA策略 |
| 📄 **设计文档** | 功能规格/系统设计/API设计 | SPEC-COMPLETE、API-DESIGN 变更 |
| 🔄 **跨模块依赖** | 影响2个以上模块 | 学生门户依赖RBAC+档案+请假 |
| 🚀 **生产部署** | 发布前验证 | UAT通过后、生产发布前 |

### 3.2 交接流程

```bash
# Step 1: 执行Agent通知CHECKER（必须！）
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to CHECKER \
  --message "[Issue #255] 请求CHECKER验证: QR考勤后端实现 — RBAC权限+数据隔离" \
  --type assign --status running

# Step 2: PM创建CHECKER验证Issue（可选）
gh issue create \
  --title "[CHECKER] #255 QR考勤后端实现验证" \
  --label "checker,p0" \
  --assign "CHECKER"

# Step 3: CHECKER验证 → 记录到Issue comment
# 通过: gh issue close #255 --comment "CHECKER验证通过"
# 驳回: gh issue reopen #255 --comment "CHECKER驳回: 缺少XSS防护"

# Step 4: CHECKER通知PM完成
python3 skills/agent-communication/scripts/write_message.py \
  --from CHECKER --to PM \
  --message "[Issue #255] CHECKER验证通过" \
  --type done --status idle
```

### 3.3 不允许行为

- ❌ Agent 自行判断"不需要CHECKER"跳过
- ❌ CHECKER 未确认就关闭安全/架构相关 Issue
- ❌ PM 绕过 CHECKER 直接关闭需验证的 Issue

### 3.4 CHECKER 超时处理

| 等待时间 | 操作 |
|---------|------|
| ≤ 2小时 | PM 等待 |
| 2-4小时 | PM 发消息催促: `--message "[Issue #255] CHECKER请尽快验证"` |
| > 4小时 | PM 重新分配其他 Agent 验证或裁决 |

---

## 4️⃣ 项目 Wiki 维护规则

### 4.1 Wiki 内容全覆盖要求

Wiki (`docs/school-admin-system/PROJECT-WIKI.md`) 必须包含以下全部内容:

| # | 内容 | 说明 | 更新时机 |
|---|------|------|---------|
| 1 | **文档清单 + 版本号 + 最后更新时间** | 所有规格/设计/API/DB文档 | 文档更新时立即同步 |
| 2 | **文档链接** | 各文档的外部访问URL | 部署变更时 |
| 3 | **测试环境连接信息** | Coze URL + 本地URL + 端口 | 环境变更时立即同步 |
| 4 | **Multi-Agent Dashboard 链接** | GitHub Pages + GitHub Raw | Dashboard更新时 |
| 5 | **测试账号信息** | 用户名/密码/权限/验证状态 | 新增/修改账号时 |
| 6 | **最新版本号 + 对应Git Commit** | 后端 + 前端 + 数据库版本 | 版本发布时 |
| 7 | **Release 页面链接 + Change Log** | GitHub Releases | 新Release创建时 |
| 8 | **跨环境部署/安装指南** | Mac/Docker/直接从GitHub启动 | 部署流程变更时 |
| 9 | **联系方式** | 仓库Owner | 团队变更时 |
| 10 | **Coze Proxy 用户配置** | 外部访问配置 | Proxy变更时 |
| 11 | **Bug修复记录** | 近期关闭的P0/P1 | 每日维护 |
| 12 | **模块完成度** | 各模块开发状态 | 任务完成时 |

### 4.2 Wiki 最后修改时间戳规则

```markdown
> **最后更新**: YYYY-MM-DD HH:MM (GMT+8)
> **版本**: vX.Y.Z
> **维护人**: PM Agent
```

- 每次修改Wiki内容必须更新**顶部时间戳**
- 时间戳格式: `YYYY-MM-DD HH:MM (GMT+8)`
- 如果某段内容有独立的最后更新，使用 `> ⚠️ **最后更新**: ...`

### 4.3 Wiki 维护责任人

| 角色 | 职责 |
|------|------|
| **PM Agent** | 主要维护人 — 模块完成度/版本/Bug记录/文档清单 |
| **DEVOPS Agent** | 环境信息/部署指南/Release |
| **QA Agent** | 测试账号/测试结果 |

### 4.4 Wiki 更新触发事件

| 事件 | 操作 | 责任人 |
|------|------|--------|
| 文档版本更新 | 更新文档清单中的版本号 | PM |
| 新版本发布 | 更新版本信息 + Release链接 | PM |
| 环境变更 | 更新Coze URL/本地端口 | DEVOPS |
| 测试账号变更 | 更新账号表 | QA |
| 新Bug修复 | 追加到Bug记录 | PM |
| 模块完成度变更 | 更新完成度表格 | PM |
| 部署流程变更 | 更新安装指南 | DEVOPS |

---

## 5️⃣ 提醒机制 (Reminder System)

### 5.1 PM 定期检查计划

| 频率 | 检查项 | 检查方法 |
|------|--------|----------|
| **每30分钟** | 心跳 — 系统状态 + Issue巡检 | `gh issue list --label "in-progress"` |
| **每小时** | 子Agent状态 + 异常检测 | `subagents list` |
| **每天09:00** | 早晨状态汇报 (已完成+今日计划) | 脚本报告 |
| **每天18:00** | 晚间状态汇报 (当日成果+阻塞项) | 脚本报告 |
| **任务完成时** | 更新Wiki + 关闭Issue + Dashboard | 即时 |

### 5.2 Wiki 维护定时提醒

```bash
# Cron Job: 每天09:00提醒PM检查Wiki
cron add --schedule "0 9 * * *" --tz "Asia/Shanghai" \
  --payload '{"kind":"systemEvent","text":"⏰ PM提醒: 请检查PROJECT-WIKI.md是否需要更新 (昨天有任务完成吗？版本更新了吗？)"}' \
  --target main

# Cron Job: 每次版本发布后提醒更新Wiki
cron add --schedule after-release \
  --payload '{"kind":"systemEvent","text":"⏰ PM提醒: 新版本已发布，立即更新PROJECT-WIKI.md ①版本号 ②模块完成度 ③Release链接 ④部署指南"}' \
  --target main
```

### 5.3 Issue 过期提醒

```bash
# 检查超过3天未关闭的 in-progress Issue
gh issue list --state open --label "in-progress" --json number,title,updatedAt --jq '.[] | select((now - (.updatedAt | fromdateiso8601)) > 259200) | "#\(.number): \(.title)"'

# → PM 主动跟进，必要时重新分配
```

### 5.4 Wiki 更新提醒

在 AGENTS.md 心跳模板中增加:

```markdown
### 🔄 每日Wiki维护检查
- [ ] PROJECT-WIKI.md 版本号是否最新？
- [ ] 模块完成度是否有更新？
- [ ] 测试环境信息是否正确？
- [ ] 最新Bug修复是否已记录？
- [ ] 文档清单版本号是否同步？
```

---

## 6️⃣ 规则变更历史

| 日期 | 版本 | 变更内容 | 触发事件 |
|------|------|----------|----------|
| 2026-07-14 | v2.0 | 新增Issue同步规则、CHECKER交接、Wiki维护、提醒机制 | UI原型审查反馈 |
| 2026-07-12 | v1.0 | 初始版本 | 多Agent系统建立 |
