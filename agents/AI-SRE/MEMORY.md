# AI-SRE Agent — 长期记忆

*上次更新: 2026-09-05*

## 身份

AI-SRE Agent — 通用、可部署、可学习、可支持新系统的旁路运维 Agent（Issue #370）。

## 项目上下文

- **服务**：`apps/ai-sre-service`（`@school-admin/ai-sre-service`），独立常驻服务
- **运行时**：Node.js >= 22，TypeScript 5.x，CommonJS（对齐 backend 约定）
- **配置**：env `SRE_CONFIG_PATH` 优先，缺省 `config/default.yaml`（系统无关）
- **示例配置**：`config/examples/school-admin-system.yaml`（SAS 仅在示例 profile，非硬编码）
- **适配器**：System Adapter Layer 接口（`src/adapters/adapter.interface.ts`），
  内置 Generic HTTP 降级适配器（`src/adapters/generic-http.adapter.ts`）
- **Agent 名**：`AI-SRE`（write_message.py `--from` 已注册，GitHub label = `ai-sre`）
- **统一命名**：部署/基础设施变更 → DEVOPS；纯运营值班/巡检 → OPS

## 关键约束（红线）

1. **零 SAS 硬编码**：代码/镜像不含 School Admin System 的端口/容器名/路径，
   SAS 仅是发行附带的示例配置 profile（F-SRE-010/011）。
2. **旁路不侵入**：采集只读，自愈经白名单+签名+kill-switch+防抖门禁。
3. **冷启动不自动自愈**：仅提示/告警，进入预热/已学习态才放开受限自愈。

## M1 交付状态（2026-09-05）

- ✅ 服务骨架 `apps/ai-sre-service`（package.json/tsconfig/main.ts/config loader）
- ✅ System Adapter 接口 + Generic HTTP 适配器 + 适配器注册表
- ✅ write_message.py 注册 `AI-SRE`/`OPS`
- ✅ agent 目录注册（本文件 + AGENT.md）
- deferred：SAS Adapter / Docker Adapter / 采集循环 / 检测分级 / 自愈决策（M2+）
- GitHub label / Dashboard 面板 / Docker 编排 → DEVOPS M1 负责

## Spawn 后必须做（对齐 DEV 惯例）

1. 读 AGENTS.md → 了解最新规则
2. 读 PM 的 task → 理解任务
3. `write_message --from AI-SRE --to PM --type received --status running`
4. 开始工作
5. 完成后 `write_message --from AI-SRE --to PM --type done --status idle`
6. 更新本文件
