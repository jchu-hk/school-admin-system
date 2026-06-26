# Project Admin Agent

中央协调者Agent，负责:
- 协调Agent状态
- 更新Multi-Agent Dashboard
- 跟踪任务进度
- 监控Agent心跳

## 功能

### 1. Agent协调
- 接收PM任务分配
- 跟踪Agent任务状态
- 超时提醒

### 2. Dashboard更新
- 实时显示Agent状态
- 统计数据更新
- 每5分钟自动刷新

### 3. 心跳监控
- Agent写心跳文件
- 定期检查心跳年龄
- 超时自动报告PM

## 使用

### 作为Agent运行 (定时任务)
```bash
# Cron Job (每5分钟)
*/5 * * * * cd /workspace/projects/workspace/agents/project-admin && python3 main.py
```

### 写心跳 (Agent调用)
```bash
python3 main.py --write-heartbeat DEV 123 running "正在修复About页面"
```

## 配置

- `heartbeat_dir`: `/tmp` - 心跳文件目录
- `dashboard_file`: `/workspace/projects/workspace/multi-agent-dashboard.html`
- `max_age_seconds`: `600` - 超过10分钟无心跳视为挂起
- `check_interval_seconds`: `300` - 每5分钟检查一次

## 心跳文件格式

```json
{
  "agent_id": "DEV",
  "issue_id": "123",
  "status": "running|done|failed",
  "message": "任务描述",
  "timestamp": "2026-06-27T01:00:00.000Z"
}
```

## 文件

- `main.py`: 主逻辑
- `AGENT.json`: Agent配置
- `README.md`: 本文档