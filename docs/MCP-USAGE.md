# MCP 使用指南（Postgres 只读直连）— PM 视角

> 状态：v1.0（2026-08-15）
> 维护原则：**不断 review & improve**。每次使用后复盘价值，好的沉淀，噪音删除。

---

## 1. 这是什么

一个 **PostgreSQL MCP server**，给 PM 提供对测试库的**只读**直连能力：

- `pg__query` — 只读 SQL 查询
- `pg__resources_list` — 列出所有表的 schema
- `pg__resources_read` — 读取单表 schema

- 目标库：测试环境 `127.0.0.1:5432`（school_admin，约 63 张表）
- 权限：**query-only，不可写**

---

## 2. 核心定位

MCP 是 PM 的「**地面真相验证器**」（ground-truth verifier），不是诊断器、不是写入口。

它解决 PM 过去的最大痛点：**只能靠 HTTP 接口 / 容器日志 / 他人报告间接推断状态**。
现在可以一条 SQL 直接看到真实数据状态。

⚠️ 定位边界：
- ✅ 用它**验证事实**（数据是否落地、备份是否成功、迁移是否到位）
- ✅ 用它**陈述现象**（bug 报告时的数据事实）
- ❌ 不用它**诊断根因**（那仍是 DEV 的活）
- ❌ 永不写数据（违反 SVA 白名单 + 只读约束）

---

## 3. 标准用法（Canonical Use Cases）

### 3.1 部署后验收（最高价值）
DEV/DEVOPS 说「部署完成」→ PM 用只读查询确认**数据侧**生效，不轻信报告。

```sql
-- 例：验证 #309 备份修复是否真正生效
SELECT status, COUNT(*), MAX(created_at)
FROM backup_records GROUP BY status ORDER BY 3 DESC;
-- 结果：success 10（部署后）/ failed 39（部署前）→ 修复生效
```

### 3.2 心跳的数据证据
心跳除了 HTTP 200，加 DB 级探针，避免「接口通但数据坏」的盲区：

```sql
-- 最近一次备份是否新鲜且成功
SELECT status, MAX(created_at) FROM backup_records;

-- 迁移是否全部落库
SELECT COUNT(*) FROM migrations;
```

### 3.3 QA 验收证据
QA 说「功能通过」→ PM 抽查关键表确认数据确实写入、字段正确，而非只看 UI 截图。

### 3.4 故障陈述事实（只陈述，不诊断）
收到 bug 报告时，PM 用只读查询**陈述数据现状**（如「该表 0 行」「字段为 null」），
把事实写进 Issue，再 spawn DEV 诊断。PM 停在「现象」，不越界到「根因」。

---

## 4. 红线（Guardrails）

1. **只读是底线**：MCP 必须保持 query-only。若未来出现写能力，立即报告并禁用。
2. **最小权限**：敏感表非必要不查、查了不外泄。
   - 敏感表清单：`users` / `system_users` / `students` / `student_profiles` / `temporary_passwords` / `otp_requests` / `otp_sessions` / `permission_audit_logs` / `audit_logs`
   - 涉及 PDPO 隐私条例，读取要克制。
3. **环境意识**：当前是**测试库**。若将来接入生产库，读取边界、敏感表范围必须重新界定。
4. **查询可解释**：每条查询都能说明目的，避免无意义全表扫描或大量数据拉取。

---

## 5. 复盘节奏（Review & Improve）

- **每周一 09:00**（cron 自动提醒）复盘本周 MCP 使用效果：
  1. 哪些查询**产生了实际价值**？（如 backup_records 验证）
  2. 哪些是**噪音 / 多余**？→ 删除或合并
  3. 有没有**新的可复用检查**值得沉淀进 §3？
  4. 是否**守住红线**（只读 + 最小权限）？
- 结论写回本文档，版本号递增。
- 原则：**好的留下，噪音删除，持续迭代**。
