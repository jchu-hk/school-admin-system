# PM 处理 Stuck Task 标准流程

> 当任务被指派但 Agent 无响应或进度停滞时，PM 必须执行的标准处理流程

---

## 触发条件

以下情况视为 **Stuck Task**：

| 场景 | 判断标准 |
|------|---------|
| Agent 无响应 | 任务指派后 >2小时 无心跳/无消息 |
| 进度停滞 | Agent 报告 running 但 >4小时 无实质进展 |
| 任务阻塞 | Agent 报告 blocked 且无自主解决方案 |
| 虚假完成 | Agent 标记 done 但实际未完成 |

---

## 处理流程 (5步法)

### Step 1: 诊断 (Diagnose)

**目标**: 确定 stuck 的根本原因

**检查清单**:
- [ ] 检查心跳文件: `/tmp/agent-heartbeat-*.json`
- [ ] 检查 GitHub Issue 最新评论
- [ ] 检查最近 Git commit
- [ ] 检查 agent-messages.json 最后消息
- [ ] 检查是否有 ERROR/FAIL 日志

**诊断输出**:
```markdown
## Stuck Task 诊断报告
**任务**: [Issue #XXX]
**指派给**: [Agent]
**指派时间**: [YYYY-MM-DD HH:MM]
**Stuck 时长**: [X 小时]

### 诊断结果
| 检查项 | 状态 | 发现 |
|--------|------|------|
| 心跳文件 | ✅/❌ | [有/无/过期] |
| GitHub 活动 | ✅/❌ | [最后更新 X小时前] |
| Git Commit | ✅/❌ | [有/无] |
| Agent 消息 | ✅/❌ | [最后消息内容] |
| 错误日志 | ✅/❌ | [有/无] |

### 根因分类
- [ ] Agent 崩溃/未启动
- [ ] 任务范围不清 (ambiguous task)
- [ ] 技术阻塞 (technical blocker)
- [ ] 依赖缺失 (dependency missing)
- [ ] Agent 能力不匹配 (wrong agent for task)
- [ ] 外部系统故障 (external failure)
```

---

### Step 2: 决策 (Decide)

基于诊断结果，PM 选择处理策略：

| 根因 | 处理策略 | 执行动作 |
|------|---------|---------|
| Agent 崩溃 | 重启任务 | 1. 重置 Dashboard<br>2. 重新指派同一 Agent<br>3. 简化任务范围 |
| 任务范围不清 | 澄清需求 | 1. 更新 Issue 描述<br>2. 补充示例/截图<br>3. 重新指派 |
| 技术阻塞 | 升级处理 | 1. PM 介入分析<br>2. 拆分子任务<br>3. 指派给 ARCH/DEV |
| 依赖缺失 | 等待/并行 | 1. 标记 blocked-by<br>2. 先完成依赖<br>3. 或并行开发 mock |
| 能力不匹配 | 更换 Agent | 1. 收回任务<br>2. 重新分配给合适 Agent<br>3. 更新 Dashboard |
| 外部故障 | 等待修复 | 1. 标记 blocked<br>2. 通知相关方<br>3. 监控恢复 |

**决策记录**:
```markdown
## PM 决策
**决策时间**: [YYYY-MM-DD HH:MM]
**处理策略**: [重启/澄清/升级/等待/更换/阻塞]
**理由**: [简要说明]
**下一步**: [具体行动]
```

---

### Step 3: 重置 Dashboard (Reset Dashboard)

**必须执行**: 清理过期的 Agent 状态

**自动化脚本**:
```bash
# 1. 清理心跳文件 (如 Agent 已崩溃)
rm -f /tmp/agent-heartbeat-[AGENT]-[ISSUE].json

# 2. 更新 agent-status.json
python3 << 'EOF'
import json
from datetime import datetime, timezone

status_file = "/workspace/projects/workspace/agents/project-admin/logs/agent-status.json"
with open(status_file, 'r') as f:
    data = json.load(f)

data["agents"]["[AGENT]"] = {
    "status": "idle",
    "task": "等待任务",
    "lastUpdate": datetime.now(timezone.utc).isoformat()
}

with open(status_file, 'w') as f:
    json.dump(data, f, indent=2)
print("✅ Agent status reset to idle")
EOF

# 3. 重新生成 Dashboard
cd /workspace/projects/workspace && \
  python3 skills/multi-agent-dashboard/scripts/update_dashboard.py
```

---

### Step 4: 重新安排 (Rearrange)

**根据决策执行重新指派**:

#### 场景 A: 同一 Agent 重试
```bash
# 1. 更新 Issue 评论 (说明重新指派)
gh issue comment [ISSUE] --body "🔄 PM: 任务重新指派

原因: [简要说明]
调整: [任务范围/需求澄清]
预计: [新完成时间]"

# 2. 记录消息
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to [AGENT] \
  --message "[Issue #XXX] 任务重新指派 - [调整说明]" \
  --type assign --status running

# 3. Spawn subagent
sessions_spawn(
  runtime="subagent",
  task="[更新后的任务描述]"
)
```

#### 场景 B: 更换 Agent
```bash
# 1. 记录原 Agent 失败
python3 skills/agent-communication/scripts/write_message.py \
  --from [OLD_AGENT] --to PM \
  --message "[Issue #XXX] 任务转交 - [原因]" \
  --type failed --status idle

# 2. 指派给新 Agent
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to [NEW_AGENT] \
  --message "[Issue #XXX] 新任务指派 - [澄清后的需求]" \
  --type assign --status running

# 3. Spawn 新 subagent
```

#### 场景 C: 任务拆分
```bash
# 1. 关闭原 Issue (说明拆分)
gh issue comment [ISSUE] --body "📋 PM: 任务拆分

原任务过于复杂，拆分为以下子任务:
- [ ] #XXX-1: [子任务1] → 指派给 [AGENT1]
- [ ] #XXX-2: [子任务2] → 指派给 [AGENT2]

本 Issue 关闭，由子任务跟踪。"

gh issue close [ISSUE]

# 2. 创建子任务 Issues
gh issue create --title "[子任务1]" --label "..."
gh issue create --title "[子任务2]" --label "..."
```

---

### Step 5: 监控与跟进 (Monitor)

**重新指派后的监控**:

| 时间点 | 行动 |
|--------|------|
| +30分钟 | 检查 Agent 是否已启动 (心跳文件) |
| +2小时 | 检查是否有进度更新 |
| +4小时 | 如无进展，发送询问消息 |
| +8小时 | 如仍 stuck，升级处理 (通知人类) |

**监控脚本**:
```bash
# 添加到 PM Patrol 检查清单
python3 skills/agent-communication/scripts/check_agents.py
```

---

## 完整示例

### 场景: DEV 任务 Stuck

```bash
# === Step 1: 诊断 ===
ls -la /tmp/agent-heartbeat-DEV-*.json
# 结果: 文件不存在 (Agent 未启动)

cat agents/project-admin/logs/agent-messages.json | grep DEV | tail -5
# 结果: 最后消息 6小时前，状态 running

# === Step 2: 决策 ===
# 诊断: Agent 崩溃 (session 超时/失败)
# 策略: 重启任务 + 简化范围

# === Step 3: 重置 Dashboard ===
rm -f /tmp/agent-heartbeat-DEV-206.json
python3 << 'EOF'
import json
from datetime import datetime, timezone
status_file = "/workspace/projects/workspace/agents/project-admin/logs/agent-status.json"
with open(status_file, 'r') as f:
    data = json.load(f)
data["agents"]["DEV"] = {
    "status": "idle",
    "task": "等待任务",
    "lastUpdate": datetime.now(timezone.utc).isoformat()
}
with open(status_file, 'w') as f:
    json.dump(data, f, indent=2)
EOF
cd /workspace/projects/workspace && \
  python3 skills/multi-agent-dashboard/scripts/update_dashboard.py

# === Step 4: 重新安排 ===
gh issue comment 206 --body "🔄 PM: 任务重新指派给 DEV

原因: 原 session 超时，Agent 未正常启动
调整: 简化任务范围，先修复班级下拉框数据问题
预计: 2小时内完成"

python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV \
  --message "[Issue #206] 重新指派 - 简化范围: 只修复班级下拉框数据" \
  --type assign --status running

# Spawn new subagent...

# === Step 5: 监控 ===
# 添加到下次 PM Patrol 检查点
```

---

## 自动化集成

### 添加到 PM Patrol (心跳检查)

```python
# 在 HEARTBEAT.md 中添加检查项
- [ ] 检查 stuck tasks (>2h no heartbeat)
- [ ] 检查 running tasks (>4h no progress)
- [ ] 如有 stuck，执行 Stuck Task Process
```

### 添加到 Dashboard 刷新脚本

```bash
# update_dashboard.py 中添加:
def detect_stuck_tasks():
    stuck = []
    for agent_id, data in status["agents"].items():
        if data["status"] == "running":
            last_update = datetime.fromisoformat(data["lastUpdate"])
            hours_ago = (now - last_update).total_seconds() / 3600
            if hours_ago > 4:
                stuck.append({
                    "agent": agent_id,
                    "hours": hours_ago,
                    "task": data["task"]
                })
    return stuck

# 在 Dashboard 上显示警告
if stuck:
    print("⚠️ Detected stuck tasks:", stuck)
    # 写入 /tmp/pm-stuck-tasks-alert.txt
```

---

## 总结

| 步骤 | 关键产出 | 时间目标 |
|------|---------|---------|
| Step 1: 诊断 | 诊断报告 | 10分钟 |
| Step 2: 决策 | 处理策略 | 5分钟 |
| Step 3: 重置 | Dashboard 更新 | 2分钟 |
| Step 4: 重新安排 | Issue 更新 + Agent 指派 | 5分钟 |
| Step 5: 监控 | 检查清单 | 持续 |

**总目标**: Stuck task 发现后 **30分钟内** 完成诊断和重新安排。
