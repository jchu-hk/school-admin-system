# Hybrid AI Architecture — 本地流程 + 云端推理

> 将 AI 团队拆分为两层：
> - **本地层**：流程编排、规则执行、巡检调度（轻量 LLM，零成本）
> - **云端层**：复杂分析、编码、设计推理（强 LLM，按需付费）
>
> 目标：PM Agent 7x24 在线零成本，DEV/QA/OPS 按需调用云端能力。

---

## 一、架构概览

完整 AI 团队 8 个角色，分层如下：

```
┌──────────────────────────────────────────────────────────────┐
│                     本地层（Local LLM）                       │
│                                                              │
│   Ollama Server ──── PM  ── OPS（部分）                       │
│   (Qwen2.5-7B)      调度中枢    巡检、健康检查、重启           │
│   (本地推理,          spawn       docker exec                  │
│   零 Token 成本)     质量门      系统监控                      │
│                      决策分类                                  │
│                      写 HEARTBEAT                              │
│   GPU: ~4-6GB VRAM (量化 7B)                                  │
│   或 CPU: ~12GB RAM (流程任务量小, CPU 也可)                   │
└──────────┬───────────────────────────────────────────────────┘
           │ spawn / 任务触发 / 需要深度推理
           ▼
┌──────────────────────────────────────────────────────────────┐
│                     云端层（Cloud LLM）                       │
│                                                              │
│   DeepSeek / GPT / Claude                                    │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │  REQ / BA   │  │   ARCH      │  │    DEV      │         │
│   │ 需求分析     │  │ 系统设计     │  │ 编码、重构   │         │
│   │ 功能规格     │  │ 技术方案     │  │ 单元测试     │         │
│   │ 用户故事     │  │ DB设计      │  │ Bug修复     │         │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│          │                │                │                  │
│   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐         │
│   │    QA       │  │  CHECKER    │  │   DEVOPS    │         │
│   │ 测试用例     │  │ 代码审查    │  │ CI/CD配置   │         │
│   │ 回归测试     │  │ 质量审计    │  │ 环境搭建     │         │
│   │ 验收验证     │  │ 规范检查    │  │ Pipeline    │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│   OPS（复杂部分→Cloud）                                       │
│   ├─ 复杂故障排查（日志分析、性能调优）                         │
│   └─ 架构级运维方案（扩容、容灾）                               │
│                                                              │
│   成本: 仅在深度工作时产生                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、本地 PM Agent 选型

### 方案对比

| 模型 | 参数量 | 量化后显存 | 推理质量 | 推荐度 |
|------|--------|-----------|---------|-------|
| **Qwen2.5-7B-Instruct** | 7B | 4-5GB (Q4) | ⭐⭐⭐⭐ | ✅ 首选 |
| **DeepSeek-R1-Distill-Qwen-7B** | 7B | 5-6GB (Q4) | ⭐⭐⭐⭐ | ✅ 首选 |
| **Qwen2.5-3B-Instruct** | 3B | 2-3GB (Q4) | ⭐⭐⭐ | 硬件受限时 |
| **Llama-3.2-3B** | 3B | 2-3GB (Q4) | ⭐⭐⭐ | 备选 |
| **Phi-3-mini-4K** | 3.8B | 3-4GB (Q4) | ⭐⭐⭐ | 备选 |

### 推荐

**推荐: Qwen2.5-7B-Instruct (Q4_K_M 量化)**
- 中文能力优秀（PM Agent 需要中文工作）
- 指令遵循好（适合流程/规则执行）
- 4.5GB VRAM，消费级 GPU 可跑
- 推理速度：~30-50 tokens/s (RTX 3060)

### 无 GPU 方案

如果无独立 GPU，也可以跑 CPU 模式：
```
Qwen2.5-7B-Q4_K_M → ~12GB RAM, ~3-5 tokens/s
```
PM 任务量小（每次 heartbeat 只需几十 token），CPU 模式也够用。

---

## 三、部署方案

### Step 1: 安装 Ollama

```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# 拉取模型
ollama pull qwen2.5:7b-instruct-q4_K_M
# 或
ollama pull deepseek-r1:7b-qwen-distill-q4_K_M

# 启动（默认 11434 端口）
ollama serve
```

### Step 2: 配置 OpenClaw Gateway

在 OpenClaw 配置中增加本地 LLM provider：

```yaml
# gateway.yaml 或 config patch
providers:
  - id: ollama
    type: openai-compat
    baseUrl: http://127.0.0.1:11434/v1
    models:
      - ollama/qwen2.5:7b-instruct-q4_K_M
      - ollama/deepseek-r1:7b-qwen-distill-q4_K_M

# PM Agent 默认使用本地模型
agents:
  - id: pm
    model: ollama/qwen2.5:7b-instruct-q4_K_M
```

```bash
# 热加载配置（无需重启）
openclaw gateway config.patch --path providers --raw '...'
```

### Step 3: API 兼容层（关键）

OpenClaw 原生支持 OpenAI-compatible API，本地 Ollama 暴露 `/v1/chat/completions`，网关层即可做到**无缝切换**：

```yaml
# PM 始终走本地
sessions_spawn(
  model: "ollama/qwen2.5:7b-instruct-q4_K_M",
  ...
)

# DEV 按需走云端
sessions_spawn(
  model: "deepseek/deepseek-reasoner",  # ← 云端
  ...
)
```

### Step 4: 云端回退策略

如果本地模型 down / 任务超出能力，自动回退云端：

```yaml
# 在 gateway config 中做 fallback
fallbacks:
  - provider: dallama  # 本地挂了
    ➡ deepseek/deepseek-chat  # 自动转云端
```

或在 spawn 时手动指定：

```python
# PM 发现任务需要深度分析
sessions_spawn(
  agentId: "DEV",
  model: "deepseek/deepseek-reasoner",  # 直接指定云端
  ...
)
```

---

## 四、Token 流与成本对比

### 当前（纯云端）

| Agent | 每日 Token | 日成本(估) | 备注 |
|-------|-----------|-----------|------|
| PM (heartbeat) | ~50,000 | ~$0.30 | 每分钟检查 → 积少成多 |
| PM (spawn) | ~10,000 | ~$0.06 | 每次 spawn |
| DEV (编码) | ~200,000 | ~$1.20 | 按需 |
| 合计 | ~260,000 | ~$1.56/天 | ~$47/月 |

### 混合架构后

| Agent | 每日 Token | 日成本(估) | 备注 |
|-------|-----------|-----------|------|
| **PM (本地)** | **~30,000** | **$0** | 本地 Ollama |
| DEV (云端) | ~200,000 | ~$1.20 | 不变 |
| QA (云端) | ~50,000 | ~$0.30 | 按需 |
| 合计 | ~280,000 | **~$1.50/天** | **月省~$9** |

**更深层的收益**：
- PM 从每分钟检查 → 可做到**秒级检查**（无 API 延迟）
- PM 可以**常驻内存**，响应时间从 3-10s → 0.1-0.5s
- 运维巡检不再受 API 限速限制

---

## 五、全角色分层决策矩阵

### 5.1 本地层（Local）— PM + OPS 基础

| Agent | 本地可执行任务 | 说明 |
|-------|--------------|------|
| **PM** | 系统健康检查、写 HEARTBEAT.md、write_message.py、根因分类决策、spawn 分派、质量门检查、每日总结 | 规则驱动，不需要深度推理 |
| **OPS**（基础） | 容器健康巡检、curl 检查端点、docker ps/exec/restart、磁盘/内存检查、服务重启、日志 tail | 命令执行，纯脚本化，0 token |

### 5.2 云端层（Cloud）— 需要深度推理

| Agent | 云端执行任务 | 原因 |
|-------|-------------|------|
| **REQ/BA** | 需求分析、功能规格编写、用户故事拆分、业务流程设计 | 需要理解业务上下文和用户意图，涉及创造性分析 |
| **ARCH** | 系统架构设计、技术方案选型、DB Schema 设计、API 设计 | 需要全局视野和深度技术判断 |
| **DEV** | 编码实现、重构、Bug 修复、单元测试编写 | 需要全代码上下文，大 token 消耗 |
| **QA** | 测试用例编写、回归测试计划、验收测试、自动化测试脚本 | 需要理解功能和边界条件 |
| **CHECKER** | 代码审查（Code Review）、质量审计、规范检查、安全审计 | 需要理解完整代码上下文 |
| **DEVOPS** | CI/CD Pipeline 配置、Docker Compose 编写、环境搭建、部署脚本 | 需要理解基础设施和部署拓扑 |
| **OPS**（复杂） | 故障排查、日志深度分析、性能瓶颈定位、容灾方案 | 需要上下文关联分析 |

### 5.3 混合过渡（Mixed）

| 场景 | 本地做 | 云端做 |
|------|--------|--------|
| CI 红了 | OPS 检查错误信息 + 判断类型 | 如需修 CI 配置 → spawn DEVOPS |
| 部署 | OPS 执行 docker cp / compose up | 如需改部署拓扑 → spawn DEVOPS |
| 故障响应 | OPS 初步诊断（看日志开头/exit code） | 复杂堆栈 → spawn DEV |
| 需求变更 | PM 更新 Issue + 分类 | 理解变更影响 → spawn REQ/BA |

---

## 六、实施路线图

### Phase 1 — 本地验证（1 天）
- [ ] 安装 Ollama
- [ ] 拉取 Qwen2.5-7B
- [ ] 验证本地推理可用
- [ ] 写一个测试脚本模拟 PM heartbeat

### Phase 2 — 网关集成（1 天）
- [ ] OpenClaw 配置新增 ollama provider
- [ ] 配置 PM agent 默认模型
- [ ] 测试 spawn 走本地 / 走云端
- [ ] 验证回退机制

### Phase 3 — 生产切换（0.5 天）
- [ ] 设置 PM heartbeat 由本地模型执行
- [ ] 本地 PM 运行 24h 观察稳定性
- [ ] 监控 Dashboard 状态
- [ ] 收集 token 节省数据

### Phase 4 — 优化（持续）
- [ ] 调整本地模型 prompt 模板（针对流程任务）
- [ ] 开启 GPU 推理加速
- [ ] 如果 CPU 模式慢，增加缓存层
- [ ] 定期评估是否需要升级本地模型

---

## 七、风险与对策

| 风险 | 对策 |
|------|------|
| 本地模型生成质量不足，分类错误 | 高置信任务本地跑，低置信自动回退云端 |
| GPU 资源不足 | CPU 模式 + 减少 heartbeat 频率 |
| 本地进程崩溃 | 自动重启 + 云端回退 |
| 模型量化后中文变差 | 用 Qwen2.5（中文优化）+ 选 Q4_K_M（比 Q4_0 好） |
| Agent 切换模型时上下文丢失 | PM 的 spawn prompt 包含完整上下文摘要 |

---

## 八、一句话总结

> **PM + OPS 基础跑本地（流程调度 0 成本 0 延迟，7x24 在线）**  
> **REQ/BA + ARCH + DEV + QA + CHECKER + DEVOPS + OPS 复杂 → 云端（按需付费不掉质量）**  
> **网关层做无缝切换，一个 config 搞定**

---

*版本: v1.0 | 基于 OpenClaw + Ollama 实现*
*更新: 2026-07-24*
