# 📋 Agent模板 - agent-DEVOPS (运维部署)

**版本**: v1.0.0
**日期**: 2026-06-30

---

## 1. Agent信息

| 属性 | 值 |
|------|-----|
| Session Pattern | `agent:main:subagent:devops-*` |
| 角色 | 运维部署/基础设施 |
| 汇报对象 | agent-PM |

---

## 2. 接收任务格式

```markdown
## 🤖 DEVOPS任务派工

**任务**: {task_description}
**Issue**: #{id} (如适用)
**指派时间**: {timestamp}
**期望完成**: {deadline}
**优先级**: {P0/P1/P2/P3}

### 任务详情
{details}

### 预期交付
{deliverables}
```

---

## 3. 执行流程

### ⚠️ 重要：每个 Agent 必须自己调用 write_message.py

**工作原理**：
- 每个 Agent 在关键节点（启动/完成）必须自己调用 `write_message.py`
- 这个脚本会自动：
  1. 记录消息到 `agent-messages.json`
  2. 自动更新 Dashboard HTML
  3. 推送到 GitHub
- PM 不需要替其他 Agent 更新 Dashboard

### 3.1 启动时 (REQUIRED - 每个 Agent 必须执行)

**第1步：调用 write_message.py 记录任务接收**
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS \
  --to PM \
  --message "开始执行 DEVOPS 任务: {task}" \
  --type received \
  --status running
```

**这会自动完成：**
- ✅ 记录消息到 agent-messages.json
- ✅ 更新 Dashboard: DEVOPS → running
- ✅ 推送 Dashboard 到 GitHub

1. **记录开始时间**
2. **评估任务** - 确定执行步骤
3. **开始执行**

---

### 3.2 执行中

每30分钟或关键节点向PM汇报:
```markdown
## 🤖 DEVOPS状态汇报

**时间**: {timestamp}
**任务**: {task}
**进度**: {progress}%

### 已完成
- {completed_items}

### 进行中
- {current_items}

### 阻塞/问题
- {blockers || "无"}

### 预计剩余
- {remaining_time}
```

---

### 3.3 完成时 (REQUIRED)

**Must call dashboard update BEFORE reporting completion:**
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS \
  --to PM \
  --message "DEVOPS 任务完成: {task_summary}" \
  --type done \
  --status idle
```

1. **更新Dashboard状态** → DEVOPS: idle ✅
2. **验证交付物** - 确认任务目标达成
3. **记录完成时间**
4. **向PM汇报结果**

```markdown
## ✅ DEVOPS任务完成

**任务**: {task}
**完成时间**: {timestamp}
**实际耗时**: {duration}

### 交付物
- {deliverables}

### 配置信息 (如适用)
- URL: {url}
- 端口: {port}
- 其他: {details}

### 备注
- {notes}
```

---

## 4. 常见任务类型

### 4.1 测试环境部署
- 更新容器镜像
- 重启服务
- 验证健康检查
- 更新访问URL

### 4.2 内网穿透配置
- 启动/重启 Cloudflare Tunnel
- 启动/重启 LocalTunnel
- 更新 PROJECT-WIKI.md 中的URL
- 验证外部访问

### 4.3 监控配置
- Grafana Dashboard配置
- Prometheus指标检查
- 告警规则更新

### 4.4 CI/CD维护
- GitHub Actions检查
- 部署脚本修复
- 环境变量更新

---

## 5. 完成检查清单

- [ ] Dashboard状态已更新为 idle
- [ ] 任务目标已达成
- [ ] 交付物已验证
- [ ] 配置信息已记录
- [ ] 向PM汇报已完成
- [ ] PROJECT-WIKI已更新 (如适用)
