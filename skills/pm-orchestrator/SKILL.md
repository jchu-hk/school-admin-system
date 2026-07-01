# PM Orchestrator Skill

## 概述
可靠的PM任务协调器，基于脚本（非LLM），确保任务正确派发和追踪。

## 核心价值
- ✅ **可预测**: 脚本不会"忘记"spawn agent
- ✅ **Token高效**: 纯脚本执行，零推理成本
- ✅ **可审计**: 每步操作都有日志记录
- ✅ **透明**: Dashboard实时可见所有状态

## 工作流

```
1. 派发任务 (assign_task.py)
   ↓
   - 写消息到 agent-messages.json
   - Spawn目标agent (sessions_spawn)
   - 更新GitHub Issue标签
   ↓
2. 监控状态 (check_status.py)
   ↓
   - 检查心跳文件 /tmp/agent-heartbeat-*.json
   - 检查agent-messages.json最新消息
   - 超时提醒
   ↓
3. 协调下一步 (workflow.py)
   ↓
   - DEV完成 → 自动spawn QA
   - QA通过 → 自动spawn CHECKER
   - CHECKER PASS → 关闭Issue
```

## 使用方法

### 派发任务给DEV
```bash
python3 scripts/assign_task.py \
  --from PM --to DEV \
  --issue 193 \
  --message "修复课程管理Failed to fetch错误" \
  --priority p1 \
  --spawn
```

### 检查任务状态
```bash
python3 scripts/check_status.py \
  --issue 193 \
  --agent DEV \
  --timeout-minutes 30
```

### 执行多步骤工作流
```bash
python3 scripts/workflow.py \
  --issue 193 \
  --steps DEV:QA:CHECKER \
  --auto-advance
```

## 与现有系统集成

- **agent-communication skill**: 调用 `write_message.py` 记录消息
- **multi-agent-dashboard**: 自动更新Dashboard
- **GitHub API**: 自动更新Issue状态/标签

## 配置文件

### config/workflow.json
```json
{
  "workflows": {
    "bug_fix": {
      "steps": ["DEV", "QA", "CHECKER"],
      "timeout_minutes": 60,
      "auto_advance": true
    },
    "feature_dev": {
      "steps": ["ARCH", "DEV", "QA", "CHECKER"],
      "timeout_minutes": 180,
      "auto_advance": true
    }
  }
}
```

## 日志

所有操作日志到：
- `/tmp/pm-orchestrator.log`
- `/workspace/projects/workspace/agents/project-admin/logs/pm-orchestrator.log`

## 与Agent-PM的区别

| 特性 | Agent-PM (LLM) | PM Skill (Script) |
|------|---------------|-------------------|
| 可靠性 | ⚠️ 可能忘记spawn | ✅ 总是spawn |
| Token成本 | 🔴 高 (每次推理) | 🟢 零 (纯脚本) |
| 可预测性 | ⚠️ 依赖上下文 | ✅ 确定性逻辑 |
| 审计性 | 🟡 需要解析消息 | ✅ 结构化日志 |
| 复杂度 | 🔴 高 (记忆+推理) | 🟢 低 (简单脚本) |

## 测试

```bash
# 测试任务派发
python3 scripts/assign_task.py --test --dry-run

# 测试状态检查
python3 scripts/check_status.py --test --simulated-timeout

# 测试完整工作流
python3 scripts/workflow.py --test --workflow bug_fix
```