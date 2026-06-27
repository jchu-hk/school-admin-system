# agent-project-admin

中央协调者Agent - 协调Agent状态，更新Dashboard

---

## 📋 架构

### 职责

| 职责 | 说明 |
|------|------|
| 状态同步 | 监控Agent心跳文件 |
| Dashboard更新 | 自动更新multi-agent-dashboard.html |
| Agent协调 | 跟踪任务进度 |
| Issue检查 | 检查in-progress Issues |
| 超时提醒 | 发现停滞任务通知PM |

### 不做

| ❌ 任务 | 理由 |
|--------|------|
| 直接与用户通信 | 外部交给PM |
| 使用LLM | 纯脚本逻辑，标准流程 |
| 任务分配 | PM负责 |
| Project Wiki | PM负责 |

---

## 🏃 运行方式

### Cron Job (每5分钟)

```cron
*/5 * * * * cd /workspace/projects/workspace/agents/project-admin && /usr/bin/python3 main.py >> /tmp/project-admin-cron.log 2>&1
```

### 手动运行

```bash
cd /workspace/projects/workspace/agents/project-admin
python3 main.py
```

---

## 💓 心跳机制

### Agent如何写心跳

```bash
# 开始任务
python3 main.py --write-heartbeat DEV 158 running "正在修复About页面"

# 完成任务 (自动删除心跳文件)
python3 main.py --write-heartbeat DEV 158 done "修复完成"

# 任务失败 (通知PM)
python3 main.py --write-heartbeat DEV 158 failed "修复失败: 数据库连接错误"
```

### 心跳文件格式

```json
{
  "agent_id": "DEV",
  "issue_id": "158",
  "status": "running",
  "message": "正在修复About页面",
  "timestamp": "2026-06-27T01:00:00.000Z"
}
```

### 超时判定

- **MAX_AGE_SECONDS**: `600` (10分钟)
- **超过10分钟无心跳**: 视为挂起
- **Project Admin自动通知PM**

---

## 📊 Dashboard更新

### 更新内容

1. **Agent状态** - 基于心跳文件显示运行/空闲
2. **统计数据** - 今日提交数、缺陷数
3. **消息流** - 显示最新活动

### 更新频率

- **自动**: 每5分钟 (Cron Job)
- **手动**: 运行 `python3 main.py`

### Git Commit

- 自动提交到 `multi-agent-dashboard.html`
- 推送到 `main` 分支
- Commit消息: `chore: Update dashboard at <timestamp>`

---

## 🔄 工作流程

```
PM分配任务
    ↓
Issue #158 in-progress
    ↓
DEV Agent接收任务
    ↓
写心跳: agent-heartbeat-DEV-158.json
    ↓
Project Admin (每5分钟)
    ↓
检查心跳 → 更新Dashboard → 推送GitHub
    ↓
Agent完成 → 删除心跳
    ↓
PM关闭Issue
```

---

## 📁 文件结构

```
agents/project-admin/
├── main.py          # 主逻辑 (Python)
├── AGENT.json       # Agent配置
├── README.md        # 本文档
└── CRON.md          # Cron配置说明
```

---

## 🚀 快速开始

### 1. 测试运行

```bash
cd /workspace/projects/workspace/agents/project-admin
python3 main.py
```

### 2. 测试心跳

```bash
python3 main.py --write-heartbeat DEV 158 running "测试任务"
python3 main.py
```

### 3. 检查日志

```bash
tail -f /tmp/project-admin-cron.log
```

---

## ⚠️ 注意事项

1. **不使用LLM** - 纯脚本逻辑，快速可靠
2. **纯内部协调** - 不直接与用户通信
3. **超时通知** - 超过10分钟无心跳自动通知PM
4. **Dashboard版本控制** - 每次更新都有Git记录

---

## 📚 相关文档

- PM Agent: `/workspace/projects/workspace/AGENTS.md`
- Dashboard: `/workspace/projects/workspace/multi-agent-dashboard.html`
- Cron配置: `agents/project-admin/CRON.md`