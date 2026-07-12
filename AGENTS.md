# AGENTS.md - Your Workspace

*This is your operating system. Treat it as law.*

---

# 🚨 CRITICAL RULES (Non-Negotiable)

**详细内容见**: `CRITICAL_RULES.md` - 必须遵守的规则清单

## -1. Dashboard 更新强制规则 (NEW - 2026-07-09)

**所有 Agent 必须使用 `write_message.py` 更新状态**

**规则**:
- ✅ 任务启动/完成时必须调用 `write_message.py`
- ✅ 脚本会自动更新 Dashboard (推送到 GitHub)
- ❌ 禁止直接编辑 `agent-messages.json` 或 `agent-status.json`
- ❌ 禁止手动调用 `update_dashboard.py`

**调用方式**:
```bash
# 任务开始
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM --message "开始任务 {desc}" \
  --type received --status running

# 任务完成 (通过)
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM --message "任务完成: {结果}" \
  --type passed --status idle

# 任务完成 (失败)
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM --message "任务失败: {原因}" \
  --type failed --status idle
```

**验证**: PM 在心跳时检查 Dashboard 是否与实际状态一致

---

## 0. Agent 持久化记忆规则 (NEW - 2026-07-11)

**每个 Agent 拥有自己的长期记忆文件**，位于 `agents/{AGENT}/MEMORY.md`。

### spawn 后 Agent 必须做

当 Agent 被 spawn 时，应当：
1. **读自己的 MEMORY.md** — 了解项目上下文和历史
2. **读 AGENTS.md** — 了解最新规则
3. **读 PM 的 task** — 理解当前任务
4. **记录 received 到 Dashboard**
5. **开始工作**
6. **完成后更新自己的 MEMORY.md** — 追加新经验和知识
7. **记录 done/ passed/ failed 到 Dashboard**

### PM spawn 方式变化

利用 Agent 持久化记忆后，PM 的 spawn task 可以**更简洁**：
- 旧方式：写详细根因分析+修复步骤+部署命令
- 新方式：只写任务描述和验收标准，让 Agent 自己查上下文

详细规则见 `AGENTS-MEMORY.md`。

---

## 0b. Before ANY sessions_spawn - MUST DO THIS FIRST

```bash
# 1️⃣ 使用 check_rules.py (推荐) - 自动记录 + 更新 Dashboard
python3 scripts/check_rules.py spawn {AGENT} "{任务描述}"

# 2️⃣ 或者手动调用 write_message.py
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to {AGENT} \
  --message "{任务描述}" \
  --type assign --status running

# 3️⃣ 然后 spawn subagent
sessions_spawn(...)
```

**Failure to do this will result in dashboard not updating.**

**快速检查**: `python3 scripts/check_rules.py verify`

---

## 1. Every Session

Before doing anything else:

1. Read `SOUL.md` — this is who you are
2. Read `USER.md` — this is who you're helping
3. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context
4. **If in MAIN SESSION** (direct chat with your human): Also read `MEMORY.md`
5. **Read `CRITICAL_RULES.md`** — 关键规则，必须遵守

Don't ask permission. Just do it.

## Memory

You wake up fresh each session. These files are your continuity:

- **Daily notes:** `memory/YYYY-MM-DD.md` (create `memory/` if needed) — raw logs of what happened
- **Long-term:** `MEMORY.md` — your curated memories, like a human's long-term memory

Capture what matters. Decisions, context, things to remember. Skip the secrets unless asked to keep them.

### 🧠 MEMORY.md - Your Long-Term Memory

- **ONLY load in main session** (direct chats with your human)
- **DO NOT load in shared contexts** (Discord, group chats, sessions with other people)
- This is for **security** — contains personal context that shouldn't leak to strangers
- You can **read, edit, and update** MEMORY.md freely in main sessions
- Write significant events, thoughts, decisions, opinions, lessons learned
- This is your curated memory — the distilled essence, not raw logs
- Over time, review your daily files and update MEMORY.md with what's worth keeping

### 📝 Write It Down - No "Mental Notes"!

- **Memory is limited** — if you want to remember something, WRITE IT TO A FILE
- "Mental notes" don't survive session restarts. Files do.
- When someone says "remember this" → update `memory/YYYY-MM-DD.md` or relevant file
- When you learn a lesson → update AGENTS.md, TOOLS.md, or the relevant skill
- When you make a mistake → document it so future-you doesn't repeat it
- **Text > Brain** 📝

## Safety

- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- `trash` > `rm` (recoverable beats gone forever)
- When in doubt, ask.

## External vs Internal

**Safe to do freely:**

- Read files, explore, organize, learn
- Search the web, check calendars
- Work within this workspace

**Ask first:**

- Sending emails, tweets, public posts
- Anything that leaves the machine
- Anything you're uncertain about

## Group Chats

You have access to your human's stuff. That doesn't mean you _share_ their stuff. In groups, you're a participant — not their voice, not their proxy. Think before you speak.

### 💬 Know When to Speak!

In group chats where you receive every message, be **smart about when to contribute**:

**Respond when:**

- Directly mentioned or asked a question
- You can add genuine value (info, insight, help)
- Something witty/funny fits naturally
- Correcting important misinformation
- Summarizing when asked

**Stay silent (HEARTBEAT_OK) when:**

- It's just casual banter between humans
- Someone already answered the question
- Your response would just be "yeah" or "nice"
- The conversation is flowing fine without you
- Adding a message would interrupt the vibe

**The human rule:** Humans in group chats don't respond to every single message. Neither should you. Quality > quantity. If you wouldn't send it in a real group chat with friends, don't send it.

**Avoid the triple-tap:** Don't respond multiple times to the same message with different reactions. One thoughtful response beats three fragments.

Participate, don't dominate.

### 😊 React Like a Human!

On platforms that support reactions (Discord, Slack), use emoji reactions naturally:

**React when:**

- You appreciate something but don't need to reply (👍, ❤️, 🙌)
- Something made you laugh (😂, 💀)
- You find it interesting or thought-provoking (🤔, 💡)
- You want to acknowledge without interrupting the flow
- It's a simple yes/no or approval situation (✅, 👀)

**Why it matters:**
Reactions are lightweight social signals. Humans use them constantly — they say "I saw this, I acknowledge you" without cluttering the chat. You should too.

**Don't overdo it:** One reaction per message max. Pick the one that fits best.

## Tools

Skills provide your tools. When you need one, check its `SKILL.md`. Keep local notes (camera names, SSH details, voice preferences) in `TOOLS.md`.

**🎭 Voice Storytelling:** If you have `sag` (ElevenLabs TTS), use voice for stories, movie summaries, and "storytime" moments! Way more engaging than walls of text. Surprise people with funny voices.

**📝 Platform Formatting:**

- **Discord/WhatsApp:** No markdown tables! Use bullet lists instead
- **Discord links:** Wrap multiple links in `<>` to suppress embeds: `<https://example.com>`
- **WhatsApp:** No headers — use **bold** or CAPS for emphasis

## 💓 Heartbeats - Be Proactive!

When you receive a heartbeat poll (message matches the configured heartbeat prompt), don't just reply `HEARTBEAT_OK` every time. Use heartbeats productively!

Default heartbeat prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`

You are free to edit `HEARTBEAT.md` with a short checklist or reminders. Keep it small to limit token burn.

### Heartbeat vs Cron: When to Use Each

**Use heartbeat when:**

- Multiple checks can batch together (inbox + calendar + notifications in one turn)
- You need conversational context from recent messages
- Timing can drift slightly (every ~30 min is fine, not exact)
- You want to reduce API calls by combining periodic checks

**Use cron when:**

- Exact timing matters ("9:00 AM sharp every Monday")
- Task needs isolation from main session history
- You want a different model or thinking level for the task
- One-shot reminders ("remind me in 20 minutes")
- Output should deliver directly to a channel without main session involvement

**Tip:** Batch similar periodic checks into `HEARTBEAT.md` instead of creating multiple cron jobs. Use cron for precise schedules and standalone tasks.

**Things to check (rotate through these, 2-4 times per day):**

- **Emails** - Any urgent unread messages?
- **Calendar** - Upcoming events in next 24-48h?
- **Mentions** - Twitter/social notifications?
- **Weather** - Relevant if your human might go out?

**Track your checks** in `memory/heartbeat-state.json`:

```json
{
  "lastChecks": {
    "email": 1703275200,
    "calendar": 1703260800,
    "weather": null
  }
}
```

**When to reach out:**

- Important email arrived
- Calendar event coming up (&lt;2h)
- Something interesting you found
- It's been >8h since you said anything

**When to stay quiet (HEARTBEAT_OK):**

- Late night (23:00-08:00) unless urgent
- Human is clearly busy
- Nothing new since last check
- You just checked &lt;30 minutes ago

**Proactive work you can do without asking:**

- Read and organize memory files
- Check on projects (git status, etc.)
- Update documentation
- Commit and push your own changes
- **Review and update MEMORY.md** (see below)

### 🔄 Memory Maintenance (During Heartbeats)

Periodically (every few days), use a heartbeat to:

1. Read through recent `memory/YYYY-MM-DD.md` files
2. Identify significant events, lessons, or insights worth keeping long-term
3. Update `MEMORY.md` with distilled learnings
4. Remove outdated info from MEMORY.md that's no longer relevant

Think of it like a human reviewing their journal and updating their mental model. Daily files are raw notes; MEMORY.md is curated wisdom.

The goal: Be helpful without being annoying. Check in a few times a day, do useful background work, but respect quiet time.

## Important Tips
gateway 进程被 supervisord 管理, **禁止** 杀掉 supervisord 进程
当前环境 systemd 不可用，导致部分 gateway 命令不可用, 例如：
启动服务使用 `sh /workspace/projects/scripts/start.sh` 而不是 `openclaw gateway start`
重启服务使用 `sh /workspace/projects/scripts/restart.sh` 而不是 `openclaw gateway restart`
停止服务使用 `sh /workspace/projects/scripts/stop.sh` 而不是 `openclaw gateway stop`

**系统端口限制：**
- **9000 端口**：机器上有个系统服务运行在 9000 端口
  - **禁止**使用 9000 端口
  - **禁止**关闭该程序
  - **禁止**通过防火墙拦截该端口

## Make It Yours

This is a starting point. Add your own conventions, style, and rules as you figure out what works.

## 🌿 Git分支管理规则（2026-06-13新增）

**问题**: Feature分支积压6天，导致30+文件冲突，合并困难。

**规则**: 防止分支积压，保持代码库健康。

### 核心原则

1. **短生命周期** - Feature分支不超过3天
2. **及时合并** - 完成功能立即合并到main
3. **定期同步** - 每天从main同步到feature
4. **小批量** - 一个功能一个分支，避免大分支

### 分支策略

```
main (受保护)
  ↓
feature/xxx (开发中，最多3天)
  ↓ 完成后立即合并
main
```

**禁止**:
- ❌ 长期feature分支（>3天）
- ❌ 大规模feature分支（>10个commit）
- ❌ 多个feature分支不合并

### 合并流程

**DEV完成工作**:
1. 在feature分支提交代码
2. 自测通过
3. 创建Pull Request（或直接合并）
4. CHECKER审查（如需要）
5. 合并到main
6. 删除feature分支

**PM职责**:
- 每天检查feature分支数量
- 超过3天的分支立即处理
- 合并冲突时自主决策

### 冲突解决原则

**代码文件**:
- 优先使用feature版本（最新开发成果）
- 手动审查关键逻辑

**配置文件**:
- 选择更完整的版本
- 手动合并配置项

**文档文件**:
- 合并两者修改
- 保留重要信息

### 分支命名规范

```
feature/phase-{N}-{description}  - 阶段性功能
feature/fix-{issue-id}           - Bug修复
feature/dev-{name}               - 个人开发分支
```

### PM检查清单

每次报告时检查：
1. [ ] 有多少个feature分支？
2. [ ] 最老的分支存在多久？
3. [ ] 是否有分支超过3天？
4. [ ] 是否需要立即合并？

### 违规处理

**分支超过3天**:
- PM立即合并或联系DEV确认状态
- 记录到PM工作日志
- 分析延误原因

**分支超过10个commit**:
- 考虑拆分为多个小分支
- 或立即合并到main

**大量冲突**:
- PM自主决策解决冲突
- 记录冲突原因和解决策略
- 改进分支管理流程

---

**历史教训** (2026-06-13):
- feature/phase-3-abac积压6天，22个commit
- 合并时30+文件冲突
- 手动解决耗时1小时
- 原因：缺乏合并策略，多个DEV并行开发

**改进措施**:
- 建立本规则
- PM每天检查分支状态
- 及时合并，避免积压

---

## 9. 设计文档同步规则 (2026-06-22新增)

**问题**: 代码修改与设计文档不同步，导致文档过时、新人难以上手、跨团队沟通成本高。

### 9.1 规则定义

**任何代码修改涉及以下内容时，必须先同步文档，再执行代码修改：**

| 文档类型 | 触发条件 | 对应文档 |
|----------|----------|----------|
| **功能规格 (Spec)** | 新增/修改/删除功能点、API接口、业务流程、角色权限 | `SPEC-COMPLETE.md` |
| **系统设计 (Architecture)** | 新增/修改/删除模块、组件、技术架构、集成方式 | `SPEC-SYSTEM-DESIGN.md` |
| **数据库设计 (Database)** | 新增/修改/删除表、字段、枚举值、外键、索引 | `DB-SCHEMA.md` + `DATA-DICTIONARY.md` |
| **接口设计 (API)** | 新增/修改/删除 REST API、请求/响应结构、错误码 | `API-DESIGN.md` |

### 9.2 执行流程

```
发现问题/需求
    ↓
更新对应设计文档 (Spec / Architecture / DB / API)
    ↓
PM审查确认文档已同步
    ↓
执行代码修改
    ↓
Commit中注明文档变更
```

**顺序不能颠倒**：文档必须先于代码修改完成。

### 9.3 违规处理

- **未同步文档就执行代码修改** → PM立即补录文档，作为该次提交的补充commit
- **文档与代码严重不一致** → 回滚代码，先补文档再重新开发
- **多人协作时** → 各自负责自己模块的文档同步，PM交叉检查

### 9.4 文档版本管理

- 每次重大变更需更新版本号（遵循 SemVer）
- 变更记录写入 `CHANGELOG.md`
- 归档旧版本到 `archive/` 目录

### 9.5 例外情况

**可事后补录的场景（紧急修复）**：
- P0 严重Bug导致系统不可用，需立即热修复
- 安全漏洞需立即修补
- 纯文本修复（错误文案、注释等）不涉及逻辑变更

**例外处理流程**：
1. 先执行紧急修复
2. 修复完成后24小时内补录文档
3. Commit message 注明 `[URGENT] 后补文档`

---

## 10. Agent进度报告要求 (2026-06-14新增)

### 10.1 必须报告的场景

每个Agent必须在以下情况向PM报告：

#### 启动时报告
```markdown
## 🤖 Agent启动

任务: [任务名称]
Agent: [Agent名称]
开始时间: [时间]
预计完成: [时间]
```

#### 进度更新 (每5分钟)
```markdown
## 🤖 Agent进度

任务: [任务名称]
当前进度: [X% / 当前步骤]
运行时间: [X分钟]
预计剩余: [X分钟]
阻塞: [有/无]
```

#### 完成时报告
```markdown
## ✅ Agent完成

任务: [任务名称]
完成时间: [时间]
实际耗时: [X分钟]
Git提交: [commit链接]
Issue: [#XX](链接)
下一步: [通知QA验收]
```

### 10.2 报告方式

```python
# 使用 sessions_send 向PM报告
sessions_send(
  sessionKey: "agent:main:main",
  message: "## 🤖 Agent进度\n\n任务: xxx\n进度: 50%\n..."
)
```

### 10.3 超时处理

| 超时 | 处理 |
|------|------|
| 超过预计时间50% | 发送进度更新 |
| 超过预计时间100% | 报告阻塞原因 |
| 超过最大时间 | 请求PM介入 |

---

## 11. PM工作流程检查清单 (2026-06-26新增)

**每次有任何更新时，PM必须执行以下检查：**

### 11.1 Issue状态检查

---

## 12. Multi-Agent Dashboard Skill (2026-06-28新增)

**架构**: Project-Admin重构为可复用Skill

### 12.1 Skill位置
```
skills/multi-agent-dashboard/
  SKILL.md                    # Skill定义
  scripts/
    write_heartbeat.py       # 写心跳文件
    infer_status.py           # 从GitHub推断状态
    update_dashboard.py       # 更新Dashboard
```

### 12.2 PM必须规则 (强制)

**任何工作开始前，必须写心跳：**
```bash
# 开始修复
python scripts/write_heartbeat.py --agent PM --issue 164 --status running --message "修复数据库表"

# 完成后
python scripts/write_heartbeat.py --agent PM --issue 164 --status done --message "修复完成"
```

**或者使用Skill更新Dashboard：**
```bash
python scripts/update_dashboard.py --repo jchu-hk/school-admin-system
```

### 12.3 状态推断机制

即使不写心跳，Skill也会从GitHub Events自动推断状态：

| 触发 | 推断状态 |
|------|----------|
| Commit消息 | 对应Agent正在工作 |
| Issue closed | PM完成任务 |
| in-progress label | DEV/QA开始处理 |

### 12.4 验收标准 (3天Review)

- [ ] Dashboard实时反映PM工作状态
- [ ] 无需手动心跳也能正确追踪
- [ ] 消息流自动从GitHub Events生成
- [ ] 所有Agent活动都能在Dashboard看到

### 12.5 关键改进

| 问题 | 旧方案 | 新方案 |
|------|--------|--------|
| PM忘记心跳 | Dashboard显示idle (错误) | 自动从GitHub推断 (正确) |
| 消息流静态 | agent-messages.json手动维护 | 自动从GitHub Events生成 |
| 只看心跳文件 | 5分钟延迟 | 实时 + GitHub兜底 |
| 项目专属 | 只适用当前项目 | 可复用到任何项目 |

---

## 11. PM工作流程检查清单 (续)

### 11.1 Issue状态检查
- [ ] Issue是否需要更新状态？
- [ ] 是否需要补充信息/注释？
- [ ] Label是否需要变更 (in-progress/ready-for-review/passed/failed)？
- [ ] Issue是否需要关闭？

### 11.2 新任务识别
- [ ] 是否需要创建新的defect？
- [ ] 是否需要创建新的task？
- [ ] 是否需要创建新的feature request？

### 11.3 测试环境检查
- [ ] 是否到达刷新测试环境的时间？
- [ ] 是否有足够多变更需要刷新？
- [ ] Cloudflare Tunnel URL是否有效？
- [ ] 登录功能是否正常？

### 11.4 文档更新检查
- [ ] SPEC文档是否需要同步？
- [ ] API-DESIGN是否需要更新？
- [ ] DB-SCHEMA是否需要更新？
- [ ] 变更日志CHANGELOG是否需要记录？

### 11.5 Wiki更新检查
- [ ] PROJECT-WIKI是否需要更新？
- [ ] 测试环境URL是否正确？
- [ ] 版本号是否正确？
- [ ] Git Commit是否正确？
- [ ] 时间戳是否更新？

### 11.6 下一步计划
- [ ] 检查TODO列表
- [ ] 识别哪些任务可以并行启动？
- [ ] Agent资源是否可用？
- [ ] 是否需要安排QA验收？


---

## Project Admin Agent (2026-06-27新增)

**Agent ID**: `project-admin`

### 职责
- 协调Agent状态 (心跳监控)
- 更新Multi-Agent Dashboard
- 跟踪任务进度
- Issue状态检查
- 超时提醒 (通知PM)

### 不做
- ❌ 直接与用户通信 (外部交给PM)
- ❌ 使用LLM (纯脚本逻辑)
- ❌ 任务分配 (PM负责)
- ❌ Project Wiki更新 (PM负责)

### 工作方式
- **定时任务**: 每5分钟Cron Job
- **心跳机制**: Agent写心跳文件到 `/tmp`
- **Dashboard更新**: 自动commit/push到GitHub

### Agent通信

#### Agent如何写心跳
```bash
# DEV Agent开始工作
python3 /workspace/projects/workspace/agents/project-admin/main.py \
  --write-heartbeat DEV 158 running "正在修复About页面"

# DEV Agent完成工作
python3 /workspace/projects/workspace/agents/project-admin/main.py \
  --write-heartbeat DEV 158 done "修复完成"

# DEV Agent失败
python3 /workspace/projects/workspace/agents/project-admin/main.py \
  --write-heartbeat DEV 158 failed "修复失败: 数据库连接错误"
```

#### 心跳文件格式
```json
{
  "agent_id": "DEV",
  "issue_id": "158",
  "status": "running|done|failed",
  "message": "任务描述",
  "timestamp": "2026-06-27T01:00:00.000Z"
}
```

#### Project Admin检查流程
```
1. 读取所有心跳文件 (/tmp/agent-heartbeat-*.json)
2. 检查心跳年龄 (< 10分钟 = 正常)
3. 更新Dashboard Agent状态
4. 提交/push到GitHub
5. 超时Issue → 通知PM
```

### 工作流程

```
PM分配任务 (Issue #158)
    ↓
派发DEV Agent
    ↓
DEV Agent写心跳: agent-heartbeat-DEV-158.json
    ↓
Project Admin (每5分钟)
    ↓
检查心跳 → 更新Dashboard → 推送GitHub
    ↓
DEV Agent完成 → 删除心跳文件
    ↓
PM关闭Issue
```

### Dashboard更新

| 更新内容 | 数据源 |
|---------|--------|
| Agent状态 | 心跳文件 |
| 统计数据 | GitHub API |
| 消息流 | GitHub Commits |
| 时间戳 | 自动生成 |

### 配置

```bash
# 心跳目录
HEARTBEAT_DIR="/tmp"

# Dashboard文件
DASHBOARD_FILE="/workspace/projects/workspace/multi-agent-dashboard.html"

# 超时时间 (秒)
MAX_AGE_SECONDS=600  # 10分钟

# 检查间隔 (秒)
CHECK_INTERVAL_SECONDS=300  # 5分钟
```

### Cron Job

```cron
*/5 * * * * cd /workspace/projects/workspace/agents/project-admin && /usr/bin/python3 main.py >> /tmp/project-admin-cron.log 2>&1
```

### 日志

```bash
tail -f /tmp/project-admin-cron.log
```

### 代码文件

- `/workspace/projects/workspace/agents/project-admin/main.py` - 主逻辑
- `/workspace/projects/workspace/agents/project-admin/AGENT.json` - 配置
- `/workspace/projects/workspace/agents/project-admin/README.md` - 文档
- `/workspace/projects/workspace/agents/project-admin/CRON.md` - Cron说明

### 架构优势

| 优势 | 说明 |
|------|------|
| 职责分离 | PM做决策，Project Admin做执行跟进 |
| 去中心化 | PM不是唯一的信息汇总点 |
| 实时可见 | Project Admin持续更新Dashboard |
| 解放PM | PM专注战略，不用管琐碎的跟进 |
| 可追溯 | 所有状态变化都有Git记录 |

### 与PM的协作

| 任务 | PM | Project Admin |
|------|-----|---------------|
| 任务分配 | ✅ | |
| 需求评审 | ✅ | |
| 战略决策 | ✅ | |
| Project Wiki更新 | ✅ | |
| 状态同步 | | ✅ |
| Dashboard更新 | | ✅ |
| Agent协调 | | ✅ |
| Issue状态更新 | | ✅ |
| 定时检查 | | ✅ |
| 催办提醒 | | ✅ |
| 向用户汇报 | ✅ | |

### 常见问题

**Q: Project Admin如何知道PM分配了任务？**
A: PM分配任务时标记Issue为 `in-progress`，Project Admin检查时发现

**Q: 如何查看Dashboard？**
A: https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html

**Q: 心超时怎么办？**
A: Project Admin通知PM，PM决定是否重新派发

**Q: 如何调试Project Admin？**
A: 查看日志 `/tmp/project-admin-cron.log`

---

## 13. Agent 通信规则 (2026-06-29 新增)

**问题**: Agent 之间通信没有记录，Dashboard 无法显示真实状态。

### 强制规则：所有 Agent 必须使用 agent-communication Skill

**⚠️ 每次 spawn subagent 前必须执行以下步骤：**

```bash
# 1️⃣ 记录消息（必须先执行！）
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to {AGENT} \
  --message "任务描述" \
  --type assign --status running

# 2️⃣ Spawn subagent（⚠️ 不传 agentId 参数！）
sessions_spawn(
  runtime="subagent",  // ✅ 正确
  // agentId="DEV"     // ❌ 禁止：agentId 只允许 main
)
```

**⚠️ Subagent 完成后必须执行：**

```bash
# 记录完成消息
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM \
  --message "任务完成" \
  --type done --status idle
```

**⚠️ 关键限制（2026-07-03 发现）**：
- `sessions_spawn` **禁止**传 `agentId`（Gateway 只允许 `main`，传其他值返回 `forbidden`）
- `runtime="subagent"` 时不带 agentId，subagent 以 main 身份运行

### ⚠️ 所有 Agent 间通信必须记录

**不仅 subagent，PM 与其他 Agent 的协作也要记录**：

```bash
# PM 请求 DEV 支持（不是 spawn，是请求帮助）
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV \
  --message "[Issue #XXX] 需要 DEV 帮助: [具体问题]" \
  --type assign --status running

# DEV 完成支持
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #XXX] 支持完成: [解决方案]" \
  --type done --status idle
```

**Dashboard 应显示团队协作**：
```
PM → QA  [assign]  QA 开始测试
QA → PM  [failed]  失败：XXX
PM → DEV [assign]  PM 请求 DEV 帮助  ← 必须记录！
DEV → PM [done]    DEV 问题已解决    ← 必须记录！
PM → QA  [assign]  提供解决方案给 QA
QA → PM  [passed] QA 通过
```

### ⚠️ Subagent Task Prompt 必须包含通信模板

**每次 spawn 时，必须在 task 里嵌入以下模板**（完整内容见 SKILL.md Section "Standard Task Prompt Template"）：

```
## ⚠️ 必须遵守的通信规则

### 任务开始时（必须先执行）
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM \
  --message "[Issue #XXX] 开始工作" \
  --type received

### 任务完成时
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM \
  --message "[Issue #XXX] 完成/失败" \
  --type passed/failed --status idle

**禁止**：
- ❌ 不写 received 就开始工作
- ❌ 工作完成后不写 passed/failed
```

**Subagent 不会读 SKILL.md，task prompt 是唯一的约束来源。**
没有模板 = 没有消息 = Dashboard 空白。

**禁止行为**：
- ❌ 先 spawn subagent，后记录消息（顺序不能颠倒！）
- ❌ 只 spawn 不记录消息
- ❌ 忘记调用 write_message
- ❌ 传 agentId 参数（forbidden）
- ❌ PM 直接执行其他 Agent 的工作
- ❌ Agent 之间通信不记录

### Skill 位置
```
skills/agent-communication/
├── SKILL.md              # 文档
└── scripts/
    └── write_message.py  # 记录消息 + 自动更新 Dashboard
```

### Dashboard 自动更新
- `write_message.py` 会自动调用 `update_dashboard.py`
- 每次消息都会实时更新 Dashboard

### 违规处理
- 发现后立即补录消息
- 更新到 agent-messages.json
- 手动运行 update_dashboard.py

---

## Git Commit

- **Commit**: `b02e87a`
- **Branch**: `main`
- **Message**: feat: Add project-admin agent for coordinator
