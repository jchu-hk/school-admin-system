# Multi-Agent Dashboard — Agent 自更新工作流

## 核心设计

Dashboard 不是被动轮询，而是 **Agent 主动上报**。每个 Agent 在状态变化时自己调用更新接口，Dashboard 实时反映。

```
Agent 状态变化 → 调用 update_dashboard.py → HTML 刷新 → Push to GitHub
```

## 工作流 (以 DEV Agent 为例)

```
1. PM spawn DEV → Issue #123 assigned
2. DEV 开始工作:
   python scripts/update_dashboard.py --agent DEV --issue 123 --status running --message "修复登录Bug"
3. DEV 提交代码 → push
4. DEV 完成工作:
   python scripts/update_dashboard.py --agent DEV --issue 123 --status done --message "登录Bug已修复"
5. PM spawn QA → 流程继续
```

## 每个 Agent 必须做的事

| 时机 | 动作 | 命令 |
|------|------|------|
| 收到任务 | 上报 running + 任务描述 | `update_dashboard.py --agent X --status running` |
| 任务完成 | 上报 done | `update_dashboard.py --agent X --status done` |
| 遇到阻塞 | 上报 blocked + 原因 | `update_dashboard.py --agent X --status blocked` |
| 开始新任务 | 同上 | 同上 |

## 调用方式

```bash
python scripts/update_dashboard.py \
  --agent DEV \
  --issue 123 \
  --status running \
  --message "正在修复登录页面 Bug"
```

参数说明:

| 参数 | 必填 | 说明 |
|------|------|------|
| `--agent` | ✅ | Agent 名: PM / DEV / QA / DEVOPS / CHECKER / ARCH / REQ |
| `--status` | ✅ | running / done / blocked / idle |
| `--issue` | ❌ | 关联的 Issue 编号 |
| `--message` | ❌ | 当前任务描述 |

## 两个数据源（冗余设计）

### 主路径 — Agent 自上报

```
Agent → update_dashboard.py → HTML → /agents 页面
```

精确、实时、Agent 自己最清楚自己在做什么。

### 兜底路径 — GitHub 推断（只读）

```
Crontab 每 5 分钟 → 抓 GitHub Issues + Commits → 推断状态 → 更新 Dashboard
```

Agent crash 或忘记上报时的安全网。**不能替代 Agent 自上报。**

## Agent 自上报 vs GitHub 推断

| | Agent 自上报 | GitHub 推断 |
|---|---|---|
| 数据来源 | Agent 主动调用 | Issues/Commits 推断 |
| 准确度 | 100%（Agent 自己说的） | ~70%（猜测） |
| 延迟 | 立刻 | ≤ 5 分钟 |
| 用途 | **主要** | 兜底 |
| Token 成本 | 0（shell 命令） | 0（crontab） |

## 防假数据机制

1. **超时检测**: heartbeat 超过 10 分钟无更新 → 标记 stale → 通知 PM
2. **状态一致性**: 如果 Agent 显示 running 但 GitHub 无对应活动 → 标记可疑
3. **PM 心跳**: 每次心跳检查 Dashboard 最后更新时间 ≤ 15 分钟 → 否则重新生成

## 总结

> Dashboard 不是"系统帮你看 Agent 在干嘛"，而是 **Agent 告诉 Dashboard 自己在干嘛**。Agent 自己不报，Dashboard 就只能猜。猜不准就是假数据，不可接受。
