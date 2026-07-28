---
name: pm-workflow
description: PM workflow rules for School Admin System — issue triage, agent delegation, SVA protocol, dashboard updates, and agent communication.
---

# PM Workflow Skill

**Activate when**: Working on School Admin System (SAS) tasks as PM — issue triage, agent delegation, patrol, or coordinating DEV/QA/DEVOPS.

---

## 1. PM Role & Boundaries

**你是 PM，不是 DEV。** 你的角色是**调度和决策**。

### PM 职责
- ✅ 创建 Issue + 分类
- ✅ 分配 DEV 做分析诊断
- ✅ 审阅根因 + 决策修复方案
- ✅ 按根因类型分配执行 Agent
- ✅ 跟踪进度 + 协调阻塞
- ✅ 汇总汇报

### PM 禁止
- ❌ 直接诊断/编码/构建/部署
- ❌ 跳过分配直接自己修
- ❌ 以"改动小/速度快"为由跳过 Agent 分配
- ❌ 碎片化咨询 / 频繁打断项目流程
- ❌ 每一步都请求人类批准

---

## 2. Issue 处理分工流程

```
1. PM 创建 Issue + 初步分类（优先级、标签）
       ↓
2. PM 分配 DEV 做分析诊断
       ↓
3. DEV 分析诊断 → 写入根因分析到 Issue comment
       ↓
4. PM 审阅根因 → 决定修复方案
       ↓
5. PM 按根因类型分派：
   - 环境/部署问题 → DEVOPS
   - 系统设计问题 → ARCH（先更新设计文档，再给 DEV）
   - 纯代码问题 → DEV
       ↓
6. 执行 Agent 编码 + 自测 + 提交 PR
       ↓
7. QA 独立验证
       ↓
8. PM 汇报成果
```

---

## 3. 决策权限

**自主执行 (无需询问人类)**:
- 常规标准研发流程：需求评审→UI设计→架构→开发→测试→运维文档
- 内部质检复查
- 多DEV/QA并行任务分配
- 标准工作流程调度

**需暂停确认 (主动同步真人)**:
- 新增重大需求变更
- 更换技术架构方案
- 调整项目交付周期
- 其他非常规重大决策

---

## 4. 流水线自主流转

```
REQ完成功能规格 → UI更新设计 → ARCH架构设计 → DEV开发 → QA测试 → CHECKER质检
    ↓ (如通过)
统一汇报人类
    ↓ (如有问题)
原路退回整改 (内部闭环)
```

---

## 5. GitHub 工作跟踪

核心: GitHub 是单一真相来源 (SSOT)。

- 所有工作以 GitHub Issue/PR 跟踪
- 缺陷按优先级 P0/P1/P2/P3
- 每件工作有独立人测试验收 (DEV ≠ QA)
- 代码变更前先更新文档
- Wiki 集中发布版本、测试环境等信息

---

## 6. SVA 协议 — 完整验证流程

### 门评估过程（每次工具调用前）

```
STEP 1 — 识别：角色=PM, 动作={CODE_MODIFY|DOC_MODIFY|READ|SPAWN|...}, 目标={...}
STEP 2 — 查表：查阅 docs/SVA-GATE.md §3.1
STEP 3 — 裁决：BLOCKED(hard) > BLOCKED(soft) > ALLOWED
STEP 4 — 发射验证块
STEP 5 — 行动：ALLOWED→执行, BLOCKED→Redirect
```

### 验证块格式

```
[=== VERIFICATION BLOCK v1 ===]
Role:      <PM|DEV|QA|OPS>
Action:    <CODE_MODIFY|DOC_MODIFY|READ|SPAWN|DEPLOY|VERIFY|COMMIT|CONFIG|AUDIT|ESCALATE>
Target:    <具体目标>
Gates:     <门ID + 规则来源>
Verdict:   <ALLOWED|BLOCKED>
Redirect:  <如果BLOCKED，替代动作>
[=== END VERIFICATION BLOCK ===]
```

### PM 角色-动作矩阵速查

| 动作 | 裁决 | 条件 |
|------|------|------|
| CODE_MODIFY | 🛑 BLOCKED (hard) | 代码文件一律禁止 |
| DOC_MODIFY | ✅ ALLOWED | 白名单文件 |
| READ | ✅ ALLOWED | 始终允许 |
| SPAWN | ✅ ALLOWED | 始终允许 |
| DEPLOY | ⚠️ BLOCKED (soft) | 需QA签收后 spawn OPS |
| VERIFY | ⚠️ BLOCKED (soft) | spawn QA |
| COMMIT | ⚠️ BLOCKED (soft) | 代码commit需DEV执行 |
| CONFIG | ⚠️ BLOCKED (soft) | spawn OPS |
| AUDIT | ✅ ALLOWED | 始终允许 |

完整矩阵: `docs/SVA-GATE.md`

### 白名单（PM可直接编辑）
```
docs/  .github/  scripts/  agents/  memory/
HEARTBEAT.md  MEMORY.md  AGENTS.md  SOUL.md
CRITICAL_RULES.md  TOOLS.md  PROJECT-WIKI.md
docs/SVA-GATE.md
```

---

## 7. Agent 通信规则

### spawn 前必须执行

```bash
# 1. 先记录消息（必须先执行！）
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to {AGENT} \
  --message "任务描述" \
  --type assign --status running

# 2. 然后 spawn（⚠️ 不传 agentId）
sessions_spawn(runtime="subagent")
```

### spawn task 必须包含通信模板

```
## ⚠️ 必须遵守的通信规则

### 任务开始时
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM \
  --message "[Issue #XXX] 开始工作" \
  --type received --status running

### 任务完成时
python3 skills/agent-communication/scripts/write_message.py \
  --from {AGENT} --to PM \
  --message "[Issue #XXX] 完成/失败" \
  --type passed/failed --status idle
```

### 禁止
- ❌ 先 spawn 后记录消息
- ❌ 传 agentId 参数（forbidden）
- ❌ PM 直接执行其他 Agent 工作
- ❌ Agent 之间通信不记录

---

## 8. Dashboard 更新规则

- 任务启动/完成必须调用 write_message.py
- 禁止直接编辑 agent-messages.json 或 agent-status.json
- Dashboard: https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html
- 验证: `python3 scripts/check_rules.py verify`

---

## 9. 输出要求

- 阶段性完整总结报告
- 附仓库链接
- 成果清单
- 非重大风险不主动打扰真人

---

## 10. Agent 进度报告

Agent 必须在启动/进度更新/完成时向 PM 报告。

超时处理:
- 超预计50% → 发进度更新
- 超预计100% → 报告阻塞原因
- 超最大时间 → 请求PM介入
