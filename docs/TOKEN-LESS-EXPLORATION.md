# Token-Less 可行性分析

## 原则

**能用脚本完成的，不需要 Agent。**
**能用 Cron 调度的，不需要手动触发。**

## 当前 Token 消耗分析

| 任务类型 | 当前方式 | Token 消耗 | Token-Less 可行性 |
|---------|---------|-----------|-----------------|
| 环境健康检查 | healthcheck.py | **0** ✅ | 已实现 |
| PM Patrol | patrol.py | **0** ✅ | 已实现 |
| Cloudflare 监控 | watchdog.py | **0** ✅ | 已实现 |
| Dashboard 更新 | update_dashboard.py | **0** ✅ | 已实现 |
| GitHub 操作 | gh CLI | **0** ✅ | 已实现 |
| 文件操作 | Python | **0** ✅ | 已实现 |
| **CI/CD 故障排查** | DEVOPS Agent | **高** ⚠️ | 待探索 |
| **架构决策** | ARCH Agent | **高** ⚠️ | 待探索 |
| **Bug 根因分析** | DEV Agent | **高** ⚠️ | 待探索 |

## Token-Less 场景分类

### ✅ 已实现（零 Token）

```
Cron (每5分钟)
├── healthcheck.py → 测试环境健康
├── cloudflare-watchdog.py → Tunnel 监控
└── auto-commit.py → 定期 commit

Cron (每天3次)
├── patrol.py → PM 巡逻检查
└── report.py → 状态汇总

Agent 通信
├── write_message.py → 记录消息 (0 token)
└── update_dashboard.py → 更新显示 (0 token)
```

### ⚠️ 需要探索

| 任务 | 脚本可行吗？ | 挑战 |
|------|------------|------|
| CI/CD 故障排查 | 读取 logs，但决策需要 LLM | 可以先脚本收集数据 |
| Bug 根因分析 | 脚本收集 stack trace | 需要 LLM 分析 |
| 架构决策 | 脚本列出选项 | 需要 LLM 权衡 |

### 混合模式（部分 Token-Less）

```
Agent (LLM) + 脚本 (零 Token)

Agent 做：
- 理解需求
- 决策判断
- 代码生成

脚本 做：
- 环境检查
- GitHub 操作
- 文件读写
- 数据收集
```

## 开发过程 Token-Less 方案

### 场景：创建新 Feature

| 步骤 | 传统方式 | Token-Less 方式 |
|------|---------|----------------|
| 1. 创建 Issue | 手动 | gh issue create |
| 2. 分配给 DEV | Agent | gh issue edit |
| 3. 开发代码 | DEV Agent | **待探索** |
| 4. 提交代码 | git | git commit |
| 5. 创建 PR | Agent | gh pr create |
| 6. Code Review | CHECKER | **待探索** |
| 7. 合并 | Agent | gh pr merge |

**待探索** = 需要 LLM 判断，但可以用脚本收集数据

### 探索方向

1. **Template-based 生成**
   - 预先定义代码模板
   - 脚本根据参数填充
   - 简单 CRUD 可行

2. **Rule-based 决策**
   - 预先定义规则
   - 脚本根据规则执行
   - 异常情况才调用 LLM

3. **Human-in-the-Loop**
   - 脚本收集数据
   - Human/LLM 决策
   - 脚本执行

## 实践建议

### 第一步：脚本收集 + Agent 决策

```python
# 脚本收集数据（零 Token）
def collect_ci_logs():
    logs = subprocess.run(["gh", "run", "view", "--log-failed"], ...)
    return parse_logs(logs)

# Agent 分析数据（少量 Token）
def analyze_failure(logs):
    # 只有这里需要 LLM
    return llm_analyze(logs)
```

### 第二步：Template + 脚本

```bash
# 简单 CRUD
python3 generate_crud.py --entity User --fields name,email,phone
# 生成 entity.ts, service.ts, controller.ts
```

### 第三步：渐进式自动化

| 复杂度 | Token 消耗 | 使用场景 |
|--------|-----------|---------|
| 简单 | 0 | CRUD, 模板 |
| 中等 | 低 | 有规则可循 |
| 复杂 | 高 | 需要判断 |

## 下一步行动

- [ ] 分析开发过程中哪些步骤可以脚本化
- [ ] 创建常用代码模板库
- [ ] 实现 CI/CD 日志自动收集
- [ ] 建立 Human-in-the-Loop 流程

## 记录

| 日期 | 探索内容 | 结果 |
|------|---------|------|
| 2026-06-29 | 环境运维 | ✅ 完全零 Token |
| 2026-06-29 | Agent 通信 | ✅ 完全零 Token |
| 待探索 | 开发代码 | ⚠️ 部分可行 |
| 待探索 | Bug 分析 | ⚠️ 需要 LLM |
