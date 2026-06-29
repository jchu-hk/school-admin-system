# Mistake Log - 从错误中学习

记录所有重复发生的错误，防止再次发生。

## 格式

```json
{
  "mistake": "忘记调用 write_message",
  "category": "流程违规",
  "count": 3,
  "first_seen": "2026-06-28",
  "last_seen": "2026-06-29",
  "root_cause": "没有强制机制",
  "solution": "AGENTS.md Section 13 强制规则",
  "status": "resolved"
}
```

## 历史 Mistakes

### 已解决

| Mistake | 次数 | 解决方案 | Commit |
|---------|------|---------|--------|
| 忘记调用 write_message | 3 | AGENTS.md 强制规则 | 45a1659 |
| Dashboard 不自动更新 | 2 | write_message 自动调用 update | c5ced52 |
| Commit 推断错误状态 | 2 | 移除推断，只用显式状态 | cb4163c |

### 进行中

| Mistake | 次数 | 临时方案 | 长期方案 |
|---------|------|---------|---------|
| Cloudflare URL 变化 | 2 | Watchdog 自动重启 | Named Tunnel |

### 新增检查项

每次 heartbeat 检查：
- [ ] write_message 是否被调用？
- [ ] Dashboard 是否更新？
- [ ] 有新的重复错误吗？

## PM 教训清单

### Spawn Agent 前检查
- [ ] 调用 write_message (--from PM --to {AGENT} --status running)
- [ ] 任务描述清晰
- [ ] 设置预期完成时间

### Agent 完成检查
- [ ] Agent 调用 write_message (--status idle)
- [ ] 任务结果记录
- [ ] 关闭相关 issue

### Dashboard 检查
- [ ] 消息是否显示？
- [ ] 状态是否正确？
- [ ] 时间是否 GMT+8？

## 自动检测

添加 heartbeat 检查：
```python
# 检查 agent-messages.json 是否最近更新
# 检查 dashboard.html 是否最近更新
# 检查是否有 24h 内未关闭的 in-progress
```

## Review Schedule

- **每日**: 检查新错误
- **每周**: 回顾 mistake log
- **每月**: 更新预防措施

---

## 2026-06-29 教训

### 今天学到的

1. **Agent 状态 = 消息 + 状态**
   - 必须在 write_message 时同时交付
   - 文档已更新 SKILL.md

2. **零 Token 优先**
   - 脚本可以完成的工作不需要 spawn agent
   - DEVOPS 工作 → cloudflare-watchdog.py

3. **强制规则在核心文件**
   - AGENTS.md / SOUL.md 是必须遵守的
   - 不是"建议"，是"规则"

### 明天要做的

1. [ ] 添加 mistake log 自动检测
2. [ ] 更新 heartbeat checklist
3. [ ] 考虑开发过程 token-less 方案
