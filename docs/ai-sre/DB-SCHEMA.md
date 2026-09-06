# AI SRE — RDBMS Schema（PostgreSQL）

> AI SRE 服务（`apps/ai-sre-service`）采用 **PostgreSQL + `sre_*` 命名空间表**承载
> per-system 隔离的 incident / 状态迁移 / 审计语料（DESIGN-AI-SRE §7 / §12）。
> 本文档是 `apps/ai-sre-service/db/migrations/*.sql` 的 schema 说明与真值源对齐
> （READ 侧约定：以迁移 SQL 为准，本文档为人工可读契约）。
>
> 命名遵循 `docs/school-admin-system/DB-SCHEMA.md` §2 命名规范
> （snake_case / `_at` 时间戳 / PostgreSQL ENUM / UUID PK / JSONB）。
> 与本仓库 SAS 业务库（school-admin）**非同一 schema / 可能不同库实例**；二者各自迁移、各自文档。
>
> 本文档覆盖 Issue #372 — AI SRE incident 生命周期可观测（F-SRE-016 + §12）。

## 1. 版本历史

| 迁移 | 日期 | 内容 |
|------|------|------|
| `db/migrations/0001_sre_incidents.sql` | baseline | `sre_incidents` 主表（检测+intake 统一真相源）+ 数据源/严重度/processing-status/triage/ack 五组枚举 |
| `db/migrations/0002_sre_lifecycle_observability.sql` | #372 | 新增 incident 生命周期（`sre_incident_lifecycle_enum` + `sre_incidents.lifecycle` 列 增列不覆盖）+ `sre_incident_state_transitions` 迁移历史表 + 查询审计表 + 配套分区/索引/权限 |

## 2. 权威投影规则（四字段联合）

一个 incident instance 承载四个状态字段，描述**同一事物的不同轴**，非双源漂移：

| 字段 | 轴 | 作用域 | 对外是否权威 |
|------|----|--------|--------------|
| `status` | 处置管线 processing | detected 检测/自愈 管线 + intake | ✗（源流字段，保留） |
| `triage` | 三分类 | intake（dup/known/new 一次性判定） | ✗ |
| `ack_status` | 报障回执闭环 | intake（received/processing/fixed/closed） | ✗ |
| **`lifecycle`**（§12.6） | **显式生命周期状态机** | 全来源 | **✔ 对外权威（列表/详情/down-drill 均以它为准）** |

**联合/投影规则**（见 `src/lifecycle/project.ts`，`projectLifecycle()` 纯函数）：
1. **前向投影**（对外）：对外只暴露 `lifecycle`；`status/triage/ack_status` 作为各自轴的运行字段保留并给出，但**不替代** lifecycle 判定。
2. **生周期字段未显式落库时（如检测源 / 存量迁移数据）**由 legacy 投影引导一次性 seed：
   - detected 且 (status ∈ locating|healing|escalated) → `investigating`
   - detected/处理中 且 status=resolved|suppressed → `closed`
   - intake 且 triage=new → `reported→accepted_in_progress`（进入排查前）
   - intake 且 triage=dup|known → `closed@triage(并入)`（并入源，不入 investigating）
   - intake 且 ack_status=closed → `closed`
3. **反向护栏（防静默复活 AC-016）**：已 `closed` 的 incident，其下任一 legacy 字段（status/triage/ack_status）被后端推进（如 ack=closed 后再检测到同源）**不得**凭空把 lifecycle 拉回未完结处理态；唯一出路是**显式 reopen（带 reopen_reason）**。lifecycle 迁移必须经状态机校验（`src/lifecycle/machine.ts`），不落迁移表的跳转在网关/读路径拒绝并记审计。
4. **Issue 映射（唯一真相源 §2.3 复用）**：Issue open→lifecycle 相关处理态；Issue closed→lifecycle closed 的显式 close（可在详细审计从 `event.issue_state` 回推）；Issue reopen→显式 reopen 带原因。

## 3. 枚举类型（`sre_*_enum`，PostgreSQL ENUM）

| 枚举 | 值 | 对齐 |
|------|-----|------|
| `sre_incident_source_enum` | `detected` / `intake` | 0001 |
| `sre_severity_enum` | `P0`/`P1`/`P2`/`P3` | 0001 |
| `sre_incident_status_enum` | `detected`/`locating`/`healing`/`escalated`/`resolved`/`suppressed` | 0001（processing 轴） |
| `sre_incident_triage_enum` | `dup`/`known`/`new` | 0001 |
| `sre_incident_ack_enum` | `received`/`processing`/`fixed`/`closed` | 0001 |
| `sre_incident_lifecycle_enum` | `reported`/`triage`/`accepted_in_progress`/`investigating`/`closed` | 0002（新，§12.6） |
| `sre_lifecycle_trigger_enum` | `intake_normalize`/`intake_received`/`detector`/`triage_new`/`triage_merge`/`triage_known_issue`/`investigation_start`/`investigation_pause`/`fix_verify`/`manual_close`/`suppressed`/`explicit_reopen`/`issue_state_sync` | 0002（trigger 分类，驱动 audit/trigger 溯源） |

## 4. 表清单

| 表 | 说明 | 新建/迁移 |
|----|------|-----------|
| `sre_incidents` | 异常/报障统一真相源（detected+intake），lifecycle 增列 | 0001(建) + 0002(增列 lifecycle/lifecycle_updated_at/lifecycle_reopen_reason) |
| `sre_incident_state_transitions` | lifecycle 迁移历史（谁/何时/依据/旧新 state，§12.6 落库项） | 0002（新，审计取证类，默认长留存不走普通回收） |
| `sre_incident_query_audit` | 查询审计（§12.2「谁查过什么」，append 型） | 0002（新） |

> §12.1/12.4 的 `sre_audit_events` / `sre_decision_records`（动作审计 + 决策依据、WORM 哈希链）与
> §7.2 的其余引擎表（自愈/升级/白名单/适配器）**不在 #372 范围**，后续 §372/373 伴随各自需求落地，先不建 DDL。

## 5. 详细表结构

### 5.1 sre_incidents（0001 + 0002 增列）

列与 0001 一致，0002 追加三列：

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| …（0001 全部列同前：id PK、system_id、source、severity、status、triage、ack 等） | … | | see `db/migrations/0001_sre_incidents.sql` |
| `lifecycle` | `sre_incident_lifecycle_enum` | NOT NULL DEFAULT 'reported' | 对外权威生命周期（§12.6）；0002 增加 |
| `lifecycle_updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 最近一次 lifecycle 迁移时间（timeline 最新跳对齐） |
| `lifecycle_reopen_reason` | TEXT | NULL | 仅 closed→显式 reopen 时有值（§12.6 唯一出路） |

**索引（0001 已有 + 0002 追加用于 §12.2 过滤/游标）：**
- 0001：`idx_sre_incidents_system_fp(system_id, dedup_fingerprint, ack_status)`、`idx_sre_incidents_issue(issue_id)`。
- 0002：`(system_id, lifecycle)`、`(system_id, severity)`、`(system_id, created_at)`（§12.2 时间区间/系统/严重度/状态过滤）、
  `(system_id, issue_id)`。

### 5.2 sre_incident_state_transitions（0002 新建）

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | UUID | PK | 迁移主键 |
| incident_id | UUID | FK→sre_incidents(id) NOT NULL | 归属 incident |
| system_id | VARCHAR(64) | NOT NULL | per-system 隔离（denorm 便于独立分区/隔离查询） |
| issue_id | INTEGER | NULL | 关联 GitHub Issue（唯一真相源） |
| prev_state | `sre_incident_lifecycle_enum` | NOT NULL | 旧 lifecycle |
| new_state | `sre_incident_lifecycle_enum` | NOT NULL | 新 lifecycle |
| trigger | `sre_lifecycle_trigger_enum` | NOT NULL | 触发分类（驱动溯源/审计） |
| actor_type | VARCHAR(32) | NOT NULL DEFAULT 'ai_sre' | ai_sre / detector / triage / intake_channel / human |
| actor_id | VARCHAR(64) | NOT NULL DEFAULT 'ai-sre-service' | 触发者标识 |
| reason | TEXT | NULL | 依据/原因（reopen 必填） |
| reopen_reason | TEXT | NULL | 若为 closed→显式 reopen，冗余存别名便于聚合查询 |
| trace_id | UUID | NULL | 跨系统端到端追踪（对齐 §12.8 链路） |
| policy_version | VARCHAR(32) | NULL | 触发该迁移的策略版本（§12.4 重放契约） |
| occurred_at | TIMESTAMPTZ | NOT NULL | 迁移发生时刻 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 入库时间 |

**分区与索引（§12.7 审计取证长留存 / §12.2 scope=trace 下钻）：**
- RANGE 分区：`BY RANGE (occurred_at)`（各分区按月/季，供按龄归档 `DETACH/DROP` 不触碰在途，缺省年/季观察量可由 DEVOPS 调整）。
- 索引：`(incident_id, occurred_at)`（trace 时间线）、`(system_id, occurred_at)`（per-system 归档/隔离）、`(trace_id)`。
- **审计取证保护（m4/NFR-T）**：trace 记录属审计取证语料 → 默认长留存绝不走普通日志回收；DDL 以注释标注保留类，实际回收边界由保留策略表驱动（后续 §12.7）。

### 5.3 sre_incident_query_audit（0002 新建，append 型）——查询审计（§12.2「谁查过什么」）

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | UUID | PK | 审计主键 |
| system_id_requested | VARCHAR(64) | NOT NULL | 查询的系统命名空间（per-system；空串/`''` = 跨所辖全系统扫描——见 §7 空 scope 语义） |
| endpoint | VARCHAR(128) | NOT NULL | `/api/sre/incidents` 或 `/api/sre/incidents/{id}` |
| method | VARCHAR(8) | NOT NULL | GET |
| actor_id | VARCHAR(64) | NOT NULL | 查询主体（query-console / gateway-identified） |
| scope | VARCHAR(16) | NULL | detail: full/trace/audit（list 为 NULL） |
| filters | JSONB | NULL | list 查询过滤条件（白名单内键） |
| cursor | VARCHAR(128) | NULL | 游标（若有） |
| matched_ids | JSONB | NULL | 返回子集 incident_id（列表时受 limit 截断，用于对账） |
| requested_at | TIMESTAMPTZ | NOT NULL | 查询时刻 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 入库时间 |

**约束/隔离**：查询写入仅授权账户可 INSERT；DELETE/UPDATE 经 REVOKE/触发器拒绝（append 型，防「谁查过什么」被抹）。按 `system_id_requested` 分区便于 per-system 留存与越权分离（§12.1）。

## 6. 分区与权限（§12.7 / §12.1 落地说明）

- **转换历史 / 审计表**：RANGE 分区（occurred_at/requested_at）→ 供按龄整体归档（`DETACH`/移动），不触碰近期在途；默认不走普通行级删除回收。
- 角色最小权限：
  - `sre_ai_sre_writer` — 对 `sre_incidents` / `sre_incident_state_transitions` INSERT/UPDATE（迁移自己的 incident），对只审计表仅 INSERT。
  - `sre_report_reader`（只读，供运营/控制台走查询） — SELECT 限定所辖 `system_id`（应用侧 WHERE + DB RLS 可配套）。
  - `sre_query_audit_writer` — 仅能对 `sre_incident_query_audit` INSERT（防止查询者修改自己查询痕迹）。
- 分区与 RLS 权验收由 DEVOPS 依据目标环境实际执行（本文件是 DDL 契约真值源，不属于 app 内嵌）。

## 7. 应用侧读路径与 SQL 适配

代码（`src/query/`）读路径经 `IncidentReader` 接口；当前单实例参考实现读进程内 repository（与 app 既有「RDBMS DDL 契约 + 进程内参照实现」架构一致，见 DESIGN §10.3 / DEPLOY §10.3）。
DEVOPS 接入 PostgreSQL 时以 `sre_` 表 + 上表索引执行与迁移 0002 相同的 SELECT 谓词即得一致结果；SQL predicate 见各读函数的 SQL-pending 注释/规划（#372 交付代码不含 DSN 注入）。
