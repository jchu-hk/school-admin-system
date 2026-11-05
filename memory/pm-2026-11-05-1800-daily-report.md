# PM 每日状态汇报 — 2026-11-05 18:00 (Asia/Shanghai)

数据来源：gh issue list（open/closed/created，含 labels/assignee）、gh pr list、memory/2026-11-05.md、memory/pm-2026-11-05-0900-daily-report.md、HEARTBEAT.md、实机健康检查 + backend 日志。

## 1. 已完成（今日）
- **GitHub 侧：0 项**。今日 closed = 0，created = 0，无 PR 合并。
- 唯一产出：07:00 与 09:00 两轮巡检/汇报归档（pm-2026-11-05-0700-patrol.md、pm-2026-11-05-0900-daily-report.md）。
- 与 09:00 相比无任何 Issue 状态变化。

## 2. 进行中
- 无 in-progress 任务（open Issue 中 assignee 数量 = **0**，55 个 Issue 全部未认领）。
- 唯一 open PR：**#369** fix(i18n) — mergeable = **CONFLICTING**（自 2026-08-23 未更新，停滞约 2.5 个月）。

## 3. 阻塞项 Blockers
1. 🔴 **派单能力仍失效（唯一硬阻塞，连续第 2 天）** — `/root/.openclaw/openclaw.json` 的 `agents.list` 仍只注册 `main`，`allowAny = null`。dev/qa/devops/arch/checker/ops/req 均已配置但无法派单。
   → 后果：45 个 unassigned P0/P1 全天无推进。
2. 🔴 **45 个 P0/P1 全部无 assignee**（p0=29, p1=16）。
3. 🟡 **#374（p1 schema 漂移）已在持续报错** — 今日 18:00 整点 DailyReportService 再次报 `column AttendanceDailyReport.school_id does not exist`（近 2h ERROR = 2 条）。线上镜像仍 2026-08-14（v1.5.9）。
4. 🟡 **PR #369 CONFLICTING** — 阻塞 #366 / #367 / #368 三条 i18n。
5. 🟡 环境：内存 available **613M**（较 14:04 的 827M 明显下降，逼近 600M 阈值；free 仅 98M，无 swap）、磁盘 76%（剩 9.2G）。重建镜像/并发开工前需留意。

## 4. 需用户确认 / 输入 Needs your input
（4 项自 09:00 汇报起全部未决）

1. **恢复派单（最高优先级，阻塞一切）**
   - 原因：agents.list 只剩 main，无法 spawn DEV/QA/DEVOPS，45 个 P0/P1 全停摆。
   - 选项：A) 把 dev/qa/devops/arch/checker/ops/req 写回 `agents.list`（11-04 曾生效）；B) 设 `allowAny = true`；C) 保持现状，PM 仅做巡检与汇报。

2. **#374 schema 漂移处理方式**
   - 原因：每日整点定时报表持续失败（今日 18:00 又报一次），线上镜像落后近 3 个月。
   - 选项：A) 立即派 DEV 写 migration + DEVOPS 重建镜像上线；B) 暂缓，先给定时任务加失败告警；C) 只修 migration，等下个发布窗口一起上。

3. **PR #369 处置**
   - 原因：停滞 2.5 个月且冲突，占着 i18n 三条 p1/p2。
   - 选项：A) 派 DEV rebase 解冲突后重跑 CI；B) 关闭 PR，由 #366/#367/#368 重新排期；C) 原样保留。

4. **P0 存量排序**
   - 原因：29 个 P0 全未认领，派单恢复后同时开工将造成并行过载（subagents maxConcurrent = 8）。
   - 选项：A) 我按 M1 Blocker 里程碑 + 依赖顺序自动排；B) 您指定前 5 个优先项；C) 先只做安全类 8 条（#312–#319）。

## 5. 下一步（下一时段）
- **若派单恢复（1A/1B）**：
  1. P1 — 派 DEV 处理 #374（migration + 镜像重建），再派 QA 验证定时任务。
  2. P1 — 派 DEV 解 #369 冲突，合入后 QA 验证 #366/#367/#368。
  3. P1 — 派 DEVOPS 重建镜像并部署（依赖 #374 migration）。
  4. P2 — T25/T26 已 ready-for-review，派 CHECKER 收尾。
- **若派单仍阻塞**：继续 30 分钟级心跳巡检，只做健康监控与 Issue 梳理，不推送同质报告。
- 内存 613M 逼近阈值 → 下轮若 <600M 或出现 unhealthy/5xx，建议重启内存大户容器（java 965M / openclaw 560M）释放。

## 系统健康（本次实测 18:00）
| 端点 | 状态 | 耗时 |
|---|---|---|
| backend :3000/api/health | 200 | 2.3ms |
| admin :8080 | 200 | 0.7ms |
| portal :8081 | 200 | 0.6ms |

- 容器 14 Up / 5 healthy / 0 unhealthy
- backend 近 2h ERROR = 2（均为 #374 schema 漂移表现）
- 内存 available 613M｜free 98M｜buff/cache 817M｜swap 0｜磁盘 76%（剩 9.2G）
- GH open = 55（p0=29, p1=16, p2=7, p3=2）；unassigned p0/p1 = 45；open PR = 1
