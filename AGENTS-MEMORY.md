# AGENTS-MEMORY.md - Agent 持久化记忆系统

*生效日期: 2026-07-11*

---

## 🎯 目标

让每个 Agent（DEV、QA、OPS 等）拥有**独立的长期记忆**，不依赖 PM 传递上下文。
Agent 被 spawn 后能自主读自己的记忆文件，减少 PM 在 spawn task 中写详细说明的负担。

---

## 📁 文件结构

```
agents/
├── DEV/
│   ├── AGENT.md          # Agent 角色定义和工作流
│   └── MEMORY.md         # 长期记忆：项目上下文、Bug历史、经验教训
├── QA/
│   └── MEMORY.md
├── OPS/
│   └── MEMORY.md
├── DEVOPS/
│   └── MEMORY.md
├── CHECKER/
│   └── MEMORY.md
└── ARCH/
    └── MEMORY.md
```

---

## 🔄 PM 如何 spawn 带记忆的 Agent

### 新模式（精简版）

```python
# PM spawn DEV - 指令轻量化，利用 Agent 自身记忆
sessions_spawn(
    task=f"""
## 🤖 DEV任务

**Issue**: #{issue_id} - {title}

### 任务描述
{简短描述（不需要写详细步骤）}

### 验收标准
{1-2行验收条件}

### 注意事项
{如果有新的关键信息才写，否则留空}

---
⚠️ 先读你的 MEMORY.md 了解项目上下文，再开始工作
每次 spawn 必须更新 Dashboard（received + done）
完成后更新你的 MEMORY.md
""",
    mode="run"
)
```

### 和旧模式对比

| 方面 | 旧模式 | 新模式（持久化记忆） |
|------|-------|------------------|
| spawn task 长度 | 500-1000字（含根因分析+修复步骤） | 50-100字（任务描述+验收标准） |
| 上下文来源 | PM 在 task 中手动传递 | Agent 自己从 MEMORY.md 读取 |
| 是否需要 PM 提前诊断 | 是，PM 必须先看代码 | 否，DEV 自己去诊断 |
| 重建部署命令 | PM 在 task 中写 | DEV 从 MEMORY.md 知道 |
| bug 背景 | 每次重新说 | DEV 从 MEMORY.md 看到历史 |

---

## 📝 Agent 更新自己 MEMORY.md 的规则

每个 Agent 在工作完成后应当：

1. **追加工作记录**: 日期、Issue编号、做了什么、学到了什么
2. **更新项目上下文**: 如果有新信息（URL变化、端口变化等）
3. **记录教训**: 特别是有坑的地方，避免下次重复踩

### 示例追加格式
```markdown
### 2026-07-11 — #XXX: 标题
- **现象**: {描述}
- **根因**: {原因}
- **修复**: {修改了什么}
- **教训**: {下次要注意什么}
- **涉及文件**: {文件列表}
```

---

## ⚠️ 保留的旧规则（不变）

- Dashboard 更新规则不变 — 每个 Agent 依然必须调用 `write_message.py`
- 通信规则不变 — `sessions_send` 和 `write_message.py` 仍然使用
- spawn 时不传 `agentId` 的限制不变
- AGENTS.md 的规则仍然适用

---

## 🎓 预期收益

1. **PM 专注调度决策** — 不再需要亲自看代码做深度诊断
2. **Agent 越用越聪明** — DEV 积累的 bug 修复经验可复用
3. **减少 spawn task 长度** — token 消耗降低
4. **真正的并行** — DEV 发现相关 bug 可以自主修复，不用等 PM 分配
