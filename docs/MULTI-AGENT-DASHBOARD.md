# Multi-Agent Dashboard 运作说明

## 是什么

一个**实时状态看板**，展示 AI Agent 团队（PM、DEV、QA、DEVOPS、CHECKER、ARCH、REQ）的工作状态。

访问地址：`https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/agents`

## Agent 角色

| Agent | 职责 | 图标 |
|-------|------|------|
| PM | 调度协调，分配任务，把控全局 | 🧑💼 |
| DEV | 编码实现，修 Bug，功能开发 | 🤖 |
| QA | 质量验收，浏览器验证，回归测试 | 🔍 |
| DEVOPS | 运维部署，Docker，CI/CD，备份 | 🔧 |
| CHECKER | 代码审查，PR Review | ✓ |
| ARCH | 架构设计，技术选型 | 🏗️ |
| REQ | 需求分析，规格编写 | 📝 |

## 数据来源（两条路径，互为冗余）

### 路径 A — Agent 主动上报（实时）

```
Agent 开始/完成工作 → 写 heartbeat → Dashboard 更新
```

Agent 工作时自己上报状态，最精确。

### 路径 B — GitHub 推断（兜底）

```
Crontab 每 5 分钟 → 抓 GitHub Issues + Commits → 推断 Agent 状态 → 更新 Dashboard
```

Agent 不干活时，从 commit message、issue label 推断谁在做什么。

## 如何阅读

| 元素 | 含义 |
|------|------|
| 🟢 运行中 | Agent 正在执行任务 |
| ⏸️ 空闲 | 无活跃任务 |
| 任务描述 | 当前处理的 Issue # 或 Commit |

## 架构

```
GitHub Issues / Commits
        ↓
  main.py (系统 crontab 每 5 分钟, 0 token)
        ↓
  multi-agent-dashboard.html (自动生成, 单一数据源)
        ↓
  /agents (Nginx 直接服务纯静态 HTML)
```

## 关键设计原则

1. **单一数据源** — `/agents` 和 `multi-agent-dashboard.html` 是同一份 HTML，不存在两套数据
2. **假数据不可接受** — 状态必须真实。Agent idle 就显示 idle，不显示虚假的 "运行中"
3. **零 token 维护** — 刷新由系统 crontab 直接调用 Python 脚本，不经 AI 模型，无额外成本
4. **双路径冗余** — Agent 自上报 + GitHub 推断，确保即使 Agent crash 也不丢数据
5. **纯静态服务** — Nginx 直接返回 HTML，无后端依赖，无 CORS 问题

## 更新频率

每 5 分钟自动刷新，数据源为 GitHub Events（Issues + Commits）。
