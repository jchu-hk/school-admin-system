# 17:04 — PM Patrol (Sun 10-18, 17:04 轮次) [refresh, 服务全绿, 17:00 窗口 0 ERROR]

🟢 **服务全绿** — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d23:03; 探针全 200 (backend `/api/health`, admin :8080, portal :8081); load **1.33/0.91/0.58** (1min 略抬头，仍属低位可接受); mem avail 514M (free 127M); 磁盘 75% (9.8G free)。
✅ **17:00 窗口 0 ERROR**: 15:00–17:04 backend 日志仅 6 行 BackupService 正常清理（15/16/17 点各删 0），无 ERROR/QueryFailedError，无午膳调度变体。
🔴 镜像仍 **v1.5.9** (StartedAt 10-11T10:01:02Z, restarts=0) → #374 修复仍未上线。
**GH 无变化**: 55 open (0 assigned, p0 积压仍在); PR 仅 #369 OPEN (i18n, 末更 08-20); HEAD 4f7b19f (patrol 15:04), main ahead origin 7。
**代理**: 仅 main (allowAny=false), 无 DEV/QA/DEVOPS 可 spawn → blocker 持续。
**Needs your input**: ① 部署含 #374 修复的镜像 ② 处理 #369 i18n 冲突 ③ 指派 owner 给 p0 积压 ④ 确认 10-11 18:00 宿主重启原因。

---

# 15:04 — PM Patrol (Sun 10-18, 15:04 轮次) [refresh, 服务全绿, 15:00 窗口 0 新增 ERROR]

🟢 **服务全绿** — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d21:03; 探针全 200 (backend `/api/health`, admin :8080, portal :8081); load **0.33/0.47/0.49** 平稳; mem avail 496M (free 178M); 磁盘 74% (9.8G free)。
✅ **15:00 窗口 0 新增 ERROR**: 近 90m backend 仅 12 行日志，仅 14:00 一条 `handleAutoReject` → `missing FROM-clause entry for table "change"`（与本轮前的 14:04 记录同一条，非新增）。15:00 整点无调度执行。
🔴 镜像仍 **v1.5.9** (StartedAt 10-11T10:01:02Z, restarts=0) → #374 修复仍未上线。
**GH 无变化**: 55 open (0 assigned); PR 仅 #369 OPEN (i18n, 末更 08-20); HEAD e6a9856, main ahead origin 6。
**代理**: 仅 main (allowAny=false), 无 DEV/QA/DEVOPS 可 spawn → blocker 持续。
**Needs your input**: ① 部署含 #374 修复的镜像 ② 处理 #369 i18n 冲突 ③ 指派 owner 给 p0 积压 ④ 确认 10-11 18:00 宿主重启原因。

---

# 14:04 — PM Patrol (Sun 10-18, 14:04 轮次) [refresh, 服务全绿, 14:00 窗口 2 ERROR 同 #374]

🟢 **服务全绿** — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d20:03; 探针全 200 (backend `/api/health`, admin :8080, portal :8081); load **0.51/0.41/0.37** 平稳; mem avail 506M (free 126M); 磁盘 75% (9.8G free)。
🔴 **14:00 窗口 2 ERROR (非 0)**: `LunchReminderScheduler.handleAutoReject` → `QueryFailedError: missing FROM-clause entry for table "change"`（13:00 同源 `LunchChange.created_by does not exist`）。周日午膳调度本应不跑，今日却有执行 → **#374 schema 漂移线上持续发作**，非回归。近 35m 日志共 10 行。
🔴 镜像仍 **v1.5.9** (2 months) → #374 修复仍未上线。
**GH 无变化**: 55 open (0 assigned); PR 仅 #369 OPEN (i18n, 末更 08-23); HEAD 82af1a9, main ahead origin 5。
**代理**: 仅 main (allowAny=false), 无 DEV/QA/DEVOPS 可 spawn → blocker 持续。
**Needs your input**: ① 部署含 #374 修复的镜像（14:00 已实际报错，优先级上升）② 处理 #369 i18n 冲突 ③ 指派 owner 给 p0 积压 ④ 确认 10-11 18:00 宿主重启原因。

---

# 14:00 — PM Patrol (Sun 10-18, 14:00 轮次) [🔴 有变化: 14:00 午膳 cron 恢复执行并报 ERROR]

🟢 **服务全绿** — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d19:59; 探针: backend `/api/health` → 200, admin :8080 → 200, portal :8081 → 200; load **0.49/0.38/0.37** (平稳); mem avail 552M (98M free, 偏低); 磁盘 75% (9.8G free)。
🔴 **变化点 — 14:00 窗口 4 ERROR (非 0, 上轮 11:00 为 0)**: 午膳定时任务恢复执行并连续失败 2 次 —
- 13:00 `LunchReminderScheduler.handleReminder` → `column LunchChange.created_by does not exist`
- 14:00 `handleAutoReject` → `missing FROM-clause entry for table "change"`
→ 即 **#374 schema 漂移 bug 在线上持续发作**（周日午膳调度本应不跑，今日却有执行）。非回归，属已知 p1。
🔴 镜像仍 **v1.5.9**, started 10-11T10:01:02Z (restarts=0) → #374 修复未上线。
**GH 无变化**: 55 open (0 assigned, 含 p0 积压); PR 仅 #369 OPEN (i18n, 末更 08-20); HEAD 3efefb6, main ahead origin 4。
**代理**: 环境仅 main (allowAny=false), 无 DEV/QA/DEVOPS 可 spawn → blocker 持续。
**Needs your input**: ① 部署修复版以关闭 #374（14:00 已实际报错，优先级上升）② 处理 #369 i18n 冲突 ③ 指派 owner 给 p0 积压 ④ 确认 10-11 18:00 宿主重启原因。

---

# 11:04 — PM Patrol (Sun 10-18, 11:04 轮次) [refresh, 无新变体, 11:00 窗口 0 ERROR]

🟢 **全绿** — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d17:03; 探针: admin :8080 → 200, portal :8081 → 200, backend `/api/health` → 200; load **0.39/0.37/0.39** (低位平稳, 09:06 尖峰确认已回落); mem avail 522M (131M free); 磁盘 74% (9.8G free)。
✅ **11:00 窗口 0 ERROR**: backend 近 2h 仅 4 行日志 (10:00/11:00 BackupService 正常清理各删 0), 无 ERROR/QueryFailedError/exception; 无 cron/lunch 变体 (周日无午膳调度, 符合预期)。
🔴 镜像仍 **v1.5.9**, StartedAt 10-11T10:01:02Z (restarts=0, 非部署) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); PR 仅 #369 CONFLICTING (i18n, 末更 08-23); HEAD 4acdafc, main ahead origin 3。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 10:04 — PM Patrol (Sun 10-18, 10:04 轮次) [refresh, 无新变体, 10:00 窗口 0 ERROR]

🟢 **全绿 + 负载已回落** — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d16:03; 探针: admin :8080 → 200, portal :8081 → 200, backend `/api/health` → 200 (:3000 根路径 404 为正常, 无 root route); load **0.58/0.43/0.45** (09:06 的 23.37 尖峰已回落, 确认瞬时); mem avail 501M (109M free); 磁盘 74% (9.8G free)。
✅ **10:00 窗口 0 ERROR**: backend 近 2h 仅 6 行日志 (08:00/09:00/10:00 BackupService 正常清理各删 0, 09:00 UserLifecycle 0 warnings), 无 ERROR/QueryFailedError/exception; 无 cron/lunch 变体。
🔴 镜像仍 **v1.5.9**, StartedAt 10-11T10:01:02Z (restarts=0, 非部署) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); PR 仅 #369 CONFLICTING (i18n #366-#368); HEAD 4acdafc (patrol 09:06), main ahead origin 3。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 09:06 — PM Patrol (Sun 10-18, 09:06 轮次) [refresh, 无新变体, 09:00 窗口 0 ERROR]

🟢 服务全绿 — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d15:05; 探针全 200 (backend :3000 → 200, admin :8080 → 200, portal :8081 → 200); 磁盘 74% (9.8G free)。
⚠️ **瞬时负载尖峰**: load 23.37/9.32/3.77 (1min 急升), 但进程列表中无高 CPU 常驻者 (top 为 ps/npm MCP/java 7.4%), 疑似 Java/容器短时 GC + 探针并发叠加; mem avail 407M (120M free, 偏低)。→ 下轮复核是否回落。
✅ **09:00 窗口 0 ERROR**: backend 近 2h 无 ERROR/QueryFailedError/exception, 近 1h 仅 4 行日志 (整点 BackupService 正常)。
🔴 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); PR 仅 #369 CONFLICTING; HEAD ac62ff6 (patrol 09:00, 已 trim HEARTBEAT)。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 09:00 — PM Patrol (Sun 10-18, 09:00 轮次) [refresh, 无新变体, 09:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d15:00; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.60/0.43/0.38; mem avail 371M (115M free, 略降); 磁盘 74% (9.8G free)。
✅ **09:00 窗口 0 ERROR**: backend 近 2h 仅 6 行日志 (08:00/09:00 BackupService 正常清理各删 0 个, 09:00 UserLifecycle 0 warnings), 无 ERROR/QueryFailedError/exception; 无 cron/lunch 变体。
🔴 StartedAt 10-11T10:01:02Z (restarts=0, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); p0/p1 大量积压; PR 仅 #369 CONFLICTING (末更 08-23); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 09:00 — PM Patrol (Sun 10-18, 09:00 轮次) [refresh, 无新变体, 09:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d14:59; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.67/0.42/0.38; mem avail 474M (119M free); 磁盘 74% (9.8G free)。
✅ **09:00 窗口 0 ERROR**: backend 近 2h 仅 6 行日志 (08:00/09:00 BackupService 正常清理各删 0 个, 09:00 UserLifecycle 0 warnings), 无 ERROR/QueryFailedError/exception; 无 cron/lunch 变体。
🔴 StartedAt 10-11T10:01:02Z (restarts=0, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee), ready-for-review 5 个 (365/274/262/261/140, 无 p1); HEAD 5053079 (patrol 08:04), ahead 1; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 08:04 — PM Patrol (Sun 10-18, 08:04 轮次) [refresh, 无新变体, 08:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d14:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.79/0.76/0.58; mem avail 576M (181M free); 磁盘 74% (9.8G free)。
✅ **08:00 窗口 0 ERROR**: backend 近 2h 仅 4 行日志 (07:00/08:00 BackupService 正常清理, 各删 0 个), 无 ERROR/QueryFailedError/exception; 无 cron/lunch 变体。
🔴 StartedAt 10-11T10:01:02Z (restarts=0, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee), ready-for-review 5 个 (365/274/262/261/140, 无 p1 可执行); HEAD b153dda (dashboard rebuild), ahead 0; PR 仅 #369 (mergeable=UNKNOWN); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 07:00 — PM Patrol (Sun 10-18, 07:00 轮次) [refresh, 无新变体, 07:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up (healthy 5, unhealthy 0); 宿主 uptime 6d12:59; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.17/0.28/0.31; mem avail 553M (107M free); 磁盘 74% (9.8G free)。
✅ **07:00 窗口 0 ERROR**: backend 近 2h 仅 4 行日志 (06:00/07:00 BackupService 正常清理, 各删 0 个), 无 ERROR/QueryFailedError/exception; 无 cron/lunch 变体。
🔴 StartedAt 10-11T10:01:02Z (restarts=0, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee), 0 个 ready/可启动标签; HEAD 01ce99d (chore: dashboard rebuild), ahead 0; PR 仅 #369 (mergeable=UNKNOWN); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main (allowAny=false), 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n 冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 21:04 — PM Patrol (Sat 10-17, 21:04 轮次) [refresh, 无新变体, 21:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d02:59; 探针全 200 (backend :3000 → 200, admin :8080 → 200, portal :8081 → 200); load 0.39/0.37/0.44; mem avail 519M (130M free); 磁盘 74% (9.8G free)。
✅ **21:00 窗口 0 ERROR**: backend 近 2h 仅 4 行日志 (20:00/21:00 BackupService 正常清理, 各删 0 个旧备份), 无 ERROR/QueryFailedError/exception; 21:00 整点未复现 lunch 变体。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 1fee6cf (chore: patrol 20:04), main 领先 origin 7; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main, 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 20:04 — PM Patrol (Sat 10-17, 20:04 轮次) [refresh, 无新变体, 20:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 6 days (healthy 5, unhealthy 0); 宿主 uptime 6d02:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.29/0.33/0.35; mem avail 566M (130M free); 磁盘 74% (9.8G free)。
✅ **20:00 窗口 0 ERROR**: backend 近 2h 仅 5 行日志 (19:00/20:00 BackupService 正常清理), 无 ERROR/QueryFailedError/exception; 19:00/20:00 整点未复现任何变体 (午后 lunch 变体已滚出窗口)。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 08fa498 (chore: patrol 17:04), main 领先 origin 6; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main, 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 17:04 — PM Patrol (Sat 10-17, 17:04 轮次) [refresh, 无新变体, 17:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (healthy 5, unhealthy 0); 宿主 uptime 5d23:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.39/0.42/0.38; mem avail 528M (127M free); 磁盘 74% (9.8G free)。
✅ **17:00 窗口 0 ERROR**: backend 近 2h 仅 4 行日志, 无 ERROR/QueryFailedError/exception; 16:00/17:00 整点未复现变体 (13:00/14:00 午膳变体已滚出窗口)。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 2bcf11b (chore: patrol 16:04); PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main, 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 16:04 — PM Patrol (Sat 10-17, 16:04 轮次) [refresh, 无新变体, 16:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (healthy 5, unhealthy 0); 宿主 uptime 5d22:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.95/0.55/0.43; mem avail 499M (111M free); 磁盘 74% (9.8G free)。
✅ **16:00 窗口 0 ERROR**: backend 近 2h 仅 4 行日志, 无 ERROR/QueryFailedError/exception; 15:00/16:00 整点未复现任何变体 (14:00 午膳变体已滚出窗口)。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 9adb078 (chore: patrol 15:04), main 领先 origin 4; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main, 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 15:04 — PM Patrol (Sat 10-17, 15:04 轮次) [refresh, 无新变体, 15:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (healthy 5, unhealthy 0); 宿主 uptime 5d21:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.38/0.43/0.57; mem avail 541M (112M free); 磁盘 74% (9.8G free)。
✅ **15:00 窗口 0 新 ERROR**: backend 近 2h 12 行日志, 仅 14:00 遗留 `午膳变更自动拒绝` `missing FROM-clause entry for table "change"` (QueryFailedError, lunch-reminder.service.js) — 无 15:00 报错, 无新变体。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD ae754c0 (chore: patrol 14:00), main 领先 origin 3; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee)。
**代理**: 环境仅 main, 无可 spawn 的 DEV/QA/DEVOPS → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 14:04 — PM Patrol (Sat 10-17, 14:04 轮次) [refresh, #374 同族 13:00/14:00 双变体复现 (窗口内)]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d20:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.77/0.49/0.49; mem avail 504M (114M free); 磁盘 74% (9.8G free); 无 D-state。
⚠️ **#374 同族双变体复现 (无新变体)**: backend 近 2h **2 ERROR 事件 / 4 行** — 13:00 `午膳变更提醒任务失败: column LunchChange.created_by does not exist` (lunch-reminder.service.js:56); 14:00 `午膳变更自动拒绝任务失败: missing FROM-clause entry for table "change"` (lunch-reminder.service.js:32)。均 QueryFailedError, 与 10-14/10-15/10-16 历史同变体; 13:00/14:00 BackupService 正常清理。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD ae754c0 (chore: patrol 14:00), main 领先 origin 3; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main 可 spawn 候选未确认 (allowAny=false 历史 blocker), 本轮无 spawn 动作。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 (根因未修, 本轮 13:00+14:00 双变体复现) / 确认 10-11 18:00 宿主重启原因。

---

# 13:04 — PM Patrol (Sat 10-17, 13:04 轮次) [⚠️ #374 同族 13:00 整点复现: LunchChange.created_by 变体]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d19:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.90/0.43/0.34; mem avail 518M (111M free); 磁盘 74% (9.8G free)。
⚠️ **#374 同族 13:00 整点复现 (无新变体)**: backend 近 2h **1 ERROR 事件 / 2 行** — 13:00 `[LunchReminderScheduler] 【Cron】午膳变更提醒任务失败: column LunchChange.created_by does not exist` (QueryFailedError, lunch-reminder.service.js:56), 与 10-14/10-16 历史同变体; 12:00/13:00 BackupService 正常清理; 13:00 LunchReminder 任务启动 LOG 正常但查询失败。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (2 months old) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 083a21c (chore: patrol 10:04), main 领先 origin 2; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 环境仅 main (allowAny=false) → 无可 spawn 的 DEV/QA/DEVOPS, blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 (根因未修, 本轮 13:00 复现) / 确认 10-11 18:00 宿主重启原因。

---

# 11:04 — PM Patrol (Sat 10-17, 11:04 轮次) [refresh, 无实质变化, 11:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d17:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.57/0.43/0.38; mem avail 532M (121M free); 磁盘 74% (9.8G free)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (10:00/11:00 BackupService 正常清理), 无 ERROR/QueryFailedError/exception。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 083a21c (chore: patrol 10:04), main 领先 origin 2; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 无可 spawn 的 DEV/QA/DEVOPS (环境仅 main, allowAny=false) → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 10:04 — PM Patrol (Sat 10-17, 10:04 轮次) [refresh, 无实质变化, #374 报错窗口本轮 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d16:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.76/0.42/0.38; mem avail 536M (196M free); 磁盘 74% (9.8G free)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 6 行日志 (09:00/10:00 BackupService 正常清理), 无 ERROR/QueryFailedError/exception。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD dc7379e (chore: patrol 09:00), main 领先 origin 1; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 无可 spawn 的 DEV/QA/DEVOPS (环境仅 main, allowAny=false) → blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验+指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 09:01 — PM Patrol (Sat 10-17, 09:01 轮次) [refresh, 无实质变化, 09:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d15:00; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.62/0.34/0.29; mem avail 445M (120M free); 磁盘 74% (9.8G free)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 6 行日志 (08:00/09:00 BackupService 正常清理; 09:00 UserLifecycle 0 warnings), 无 ERROR/QueryFailedError/exception。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: open issues 含 p1 #374/#368/#367 全无 assignee; HEAD dc7379e (chore: patrol 09:00); PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 无可 spawn 的 DEV/QA/DEVOPS (环境仅 main, allowAny=false) → blocker (持续)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 09:00 — PM Patrol (Sat 10-17, 09:00 轮次) [refresh, 无实质变化, 09:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d14:59; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.20/0.24/0.26; mem avail 499M (119M free); 磁盘 74% (9.8G free)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 6 行日志, 无 ERROR/QueryFailedError/exception。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 1d438af (chore: dashboard rebuild); PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 无可 spawn 的 DEV/QA/DEVOPS (环境仅 main, allowAny=false) → blocker (持续)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 07:00 — PM Patrol (Sat 10-17, 07:00 轮次) [refresh, 无实质变化, 07:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d12:59; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200); load 0.92/0.50/0.52; mem avail 647M (127M free); 磁盘 74% (9.8G free)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 4 行日志, 无 ERROR/QueryFailedError/exception。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 60a8182 (chore: dashboard rebuild); PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**代理**: 无可 spawn 的 DEV/QA/DEVOPS (环境仅 main, allowAny=false) → blocker (持续)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 21:04 — PM Patrol (Fri 10-16, 21:04 轮次) [refresh, 无实质变化, 21:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d03:03; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 → 200, portal :8081 → 200)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (20:00/21:00 BackupService 正常清理), 无 ERROR/QueryFailedError/exception; 21:00 整点未复现任何变体。
资源: load 0.29/0.36/0.36; mem avail 579M (112M free); 磁盘 74% (9.8G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 97ce7bc (chore: patrol 21:00), main 领先 origin 13; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 21:00 — PM Patrol (Fri 10-16, 21:00 轮次) [refresh, 无实质变化, 21:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d02:59; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (20:00/21:00 BackupService 正常清理), 无 ERROR/QueryFailedError/exception; 20:00/21:00 整点未复现任何变体 (18:00 DailyReportService school_id 变体已随窗口滚动移出)。
资源: load 0.54/0.36/0.35; mem avail 591M (111M free); 磁盘 74% (9.8G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 774b68a (chore: patrol 20:04), main 领先 origin 12; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 20:04 — PM Patrol (Fri 10-16, 20:04 轮次) [refresh, 无实质变化, 20:00 窗口 0 新增 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d01:07; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
⚠️ **#374 同族 18:00 事件仍在 2h 窗口内 (无新变体)**: backend 近 2h 30 行含 4 行 ERROR = 18:00 DailyReportService `AttendanceDailyReport.school_id does not exist` (与前轮记录同一 18:00 事件, 非新变体); 19:00/20:00 整点未新增。
资源: load 0.27/0.30/0.27; mem avail 667M (128M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 26d89d0 (chore: patrol 19:04), main 领先 origin 11; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 19:04 — PM Patrol (Fri 10-16, 19:04 轮次) [refresh, 无实质变化, 19:00 窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); 宿主 uptime 5d00:59; 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
✅ **#374 报错窗口本轮 0 ERROR**: backend 近 19m 0 ERROR; 近 2h 30 行仅 4 行 ERROR = 18:00 DailyReportService `AttendanceDailyReport.school_id does not exist` (与 18:04 记录同一事件, 非新变体)。
资源: load 0.38/0.24/0.25; mem avail 705M (242M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD b0167d4 (chore: patrol 18:04), main 领先 origin 10; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因。

---

# 18:04 — PM Patrol (Fri 10-16, 18:04 轮次) [⚠️ #374 同族 18:00 整点复现: 新变体 AttendanceDailyReport.school_id]

🟢 全绿 — 14 容器 Up 5 days (5 healthy, 0 unhealthy); uptime 5d00:03 (宿主已越过 5 天, 但 StartedAt 仍 10-11T10:01:02Z → 重启拉起非部署); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
⚠️ **#374 同族 18:00 整点复现 (⚠️ 新变体)**: backend 近 2h **4 ERROR 事件** — 18:00 `[DailyReportService] 生成班级日报失败: class=中一A班: column AttendanceDailyReport.school_id does not exist` + `签到日报生成失败: column "school_id" of relation "attendance_daily_reports" does not exist` (QueryFailedError, daily-report.service.js:159/57)。← **本轮新变体** (此前后端窗口整点 0 ERROR), 与前日 schema-drift 同族。其余日志 (17:00/18:00 BackupService 正常清理, DailyReport 生成 12 班级/2 空班跳过) 无异常。
资源: load 0.61/0.74/0.72; mem avail 756M (128M free); 磁盘 74% (9.8G free); 1 D-state (node, 常态短暂)。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD b4eadf1 (chore: patrol 17:04), main 领先 origin 9; PR 仅 #369 CONFLICTING (DIRTY, 末更 08-23); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验/指派 #374 (根因未修, 本轮 18:00 新增 DailyReport school_id 变体) / 确认 10-11 18:00 宿主重启原因。

---

# 17:04 — PM Patrol (Fri 10-16, 17:04 轮次) [refresh, #374 报错窗口本轮 0 ERROR]

🟢 全绿 — 14 容器 Up 4 days (5 healthy, 0 unhealthy); uptime 4d23:03 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
✅ **#374 报错本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (16:00/17:00 BackupService 正常清理), 无 ERROR/exception/QueryFailedError; 16:00/17:00 整点未复现任何变体 (14:00 lunch 变体已随窗口滚动移出)。
资源: load 0.69/0.48/0.58; mem avail 543M (131M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 38c4d3b (chore: patrol 16:04), main 领先 origin 8; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 整点变体仍会复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 16:04 — PM Patrol (Fri 10-16, 16:04 轮次) [refresh, #374 报错窗口本轮 0 ERROR]

🟢 全绿 — 14 容器 Up 4 days (5 healthy, 0 unhealthy); uptime 4d22:03 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
✅ **#374 报错本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (15:00/16:00 BackupService 正常清理), 无 ERROR/exception/QueryFailedError; 15:00/16:00 整点未复现任何变体 (14:00 lunch 变体随窗口滚动移出)。
资源: load 0.22/0.37/0.36; mem avail 632M (149M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD a12fa6d (chore: patrol 15:04), main 领先 origin 7; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 整点变体仍会复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 15:04 — PM Patrol (Fri 10-16, 15:04 轮次) [⚠️ #374 同族 14:00 整点复现 (lunch 变体), 15:00 窗口内未新增]

🟢 全绿 — 14 容器 Up 4 days (5 healthy, 0 unhealthy); uptime 4d20:03 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
⚠️ **#374 同族 14:00 整点复现 (lunch 变体, 无新变体)**: backend 近 2h (13:04–15:04) **1 ERROR 事件 / 12 行** — 14:00 `[LunchReminderScheduler] 【Cron】午膳变更自动拒绝任务失败: missing FROM-clause entry for table "change"` (QueryFailedError, lunch-reminder.service.js:32)。与前轮 14:04 window 同变体, 未部署按整点触发; 15:00 整点未新增变体。
资源: load 0.31/0.37/0.43; mem avail 588M (125M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD a12fa6d (chore: patrol 15:04), main 领先 origin 7; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。⚠️ 注: dev/qa/ops 等 agent 均已配置, spawn 可用 (此前 "allowAny=false → 无法 spawn" 为误判)。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 整点变体仍会复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 14:04 — PM Patrol (Fri 10-16, 14:04 轮次) [⚠️ #374 同族 14:00 整点复现: 新变体 missing FROM-clause]

🟢 全绿 — 14 容器 Up 4days (5 healthy, 0 unhealthy); uptime 4d19:59 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
⚠️ **#374 同族 14:00 整点复现 (⚠️ 新变体)**: backend 近 2h **2 ERROR 事件** — 13:00 `[LunchReminderScheduler] 【Cron】午膳变更提醒任务失败: column LunchChange.created_by does not exist`; 14:00 `[LunchReminderScheduler] 【Cron】午膳变更自动拒绝任务失败: missing FROM-clause entry for table "change"` (QueryFailedError) ← **本轮新变体**。2h 共 23 行日志 (12:00/13:00/14:00 BackupService 正常清理)。未部署, 按整点触发; 无 schema 迁移。
资源: load 0.38/0.41/0.37; mem avail 580M (114M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 2277245 (chore: patrol 13:04), main 领先 origin 5; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 本轮 14:00 新增 `missing FROM-clause` 变体) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---
# 13:04 — PM Patrol (Fri 10-16, 13:04 轮次) [⚠️ #374 同族 13:00 整点复现: LunchChange.created_by 变体]

🟢 全绿 — 14 容器 Up 4d (5 healthy, 0 unhealthy); uptime 4d19:03 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
⚠️ **#374 同族 13:00 整点复现 (lunch 变体, 无新变体)**: backend 近 2h **1 ERROR 事件 / 2 行** — 13:00 `[LunchReminderScheduler] 【Cron】午膳变更提醒任务失败: column LunchChange.created_by does not exist` (QueryFailedError, lunch-reminder.service.js:56)。与 10-14/10-13 历史同变体, 未部署按整点触发; 无 schema 迁移; 2h 共 11 行日志 (12:00/13:00 BackupService 正常清理)。
资源: load 0.24/0.29/0.34; mem avail 628M (131M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 3faacda (chore: patrol 12:04), main 领先 origin 4; PR 仅 #369 CONFLICTING (DIRTY, 末更 08-23); #374 OPEN (p1, 无 assignee, 末更 10-04)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 本轮 lunch 变体复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 11:04 — PM Patrol (Fri 10-16, 11:04 轮次) [refresh, #374 报错窗口本轮 0 ERROR]

🟢 全绿 — 14 容器 Up 4d (5 healthy, 0 unhealthy); uptime 4d17:03 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
✅ **#374 报错本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (10:00/11:00 BackupService 正常清理), 无 ERROR/exception/QueryFailedError; 整点未复现 (09:00 notifications 变体已随窗口滚动移出)。
资源: load 0.94/0.61/0.72; mem avail 604M (111M free); 磁盘 74% (9.8G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 473c1b9 (chore: patrol 09:00), main 领先 origin 2; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 整点变体仍会复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---


# 09:04 — PM Patrol (Fri 10-16, 09:04 轮次) [refresh, no delta vs 09:00]

🟢 全绿 — 14 容器 Up 4d (5 healthy, 0 unhealthy); uptime 4d15:00 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → 200, admin :8080 `/` → 200, portal :8081 `/` → 200)。
⚠️ **#374 同族 09:00 整点复现 (notifications 变体, 无新变体)**: backend 近 2h **1 ERROR 事件 / 1 行** — 09:00 `[UserLifecycleScheduler] Error processing expiring accounts: column "school_id" of relation "notifications" does not exist` (42703, QueryFailedError)。与前轮同变体, 未部署按整点触发; 无 schema 迁移; 2h 共 76 行日志。
资源: load 0.49/0.36/0.33; mem avail 458M (119M free); 磁盘 74% (9.8G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 0bf582f (chore: patrol 09:00), main 领先 origin 1; PR 仅 #369 CONFLICTING (DIRTY); #374 OPEN (p1, 无 assignee, 末更 10-04)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 本轮复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 09:00 — PM Patrol (Fri 10-16, 09:00 轮次) [⚠️ #374 同族 09:00 整点复现: notifications 变体]

🟢 全绿 — 14 容器 Up 4d (5 healthy, 0 unhealthy); uptime 4d14:59 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → ok, admin :8080 `/`, portal :8081 `/`)。
⚠️ **#374 同族 09:00 整点复现 (notifications 变体, 无新变体)**: backend 近 2h **1 ERROR 事件 / 1 行** — 09:00 `[UserLifecycleScheduler] Error processing expiring accounts: column "school_id" of relation "notifications" does not exist` (42703, QueryFailedError)。与前轮同变体, 未部署按整点触发; 无 schema 迁移; 2h 共 76 行日志。
资源: load 0.22/0.30/0.31; mem avail 590M (179M free); 磁盘 74% (9.8G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee, 近 24h 0 新建); HEAD 4bd4fb2 (chore: dashboard rebuild), main 与 origin 同步; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee, 末更 10-04)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修, 本轮复现) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 08:04 — PM Patrol (Fri 10-16, 08:04 轮次) [no change, #374 报错窗口本轮 0 ERROR]

🟢 全绿 — 14 容器 Up 4d (5 healthy, 0 unhealthy); uptime 4d14:03 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → ok, admin :8080 `/`, portal :8081 `/`)。
✅ **#374 报错本轮 0 ERROR**: backend 近 2h 仅 4 行日志 (07:00/08:00 BackupService 正常清理), 无 ERROR/exception/QueryFailedError。
资源: load 0.94/0.50/0.39; mem avail 618M (119M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 4bd4fb2 (chore: dashboard rebuild), main 与 origin 同步; PR 仅 #369; #374 OPEN (p1, 无 assignee)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 07:00 — PM Patrol (Fri 10-16, 07:00 轮次) [no change vs 21:04, #374 报错窗口本轮 0 ERROR]

🟢 全绿 — 14 容器 Up 4d (5 healthy, 0 unhealthy); uptime 4d12:59 (自 10-11 18:00:54); 探针全 200 (backend :3000 `/api/health` → ok, admin :8080 `/`, portal :8081 `/`)。
✅ **#374 报错本轮 0 ERROR**: backend 近 2h 仅 BackupService 06:00/07:00 正常清理, 无 ERROR/exception/QueryFailedError。
资源: load 0.34/0.38/0.41; mem avail 656M (116M free); 磁盘 74% (9.9G free); 无 D-state。
🔴 StartedAt 10-11T10:01:02Z (重启拉起, 非部署), 镜像仍 v1.5.9 (08-14) → #374 修复未上线。
**GH 无变化**: 55 open (全部无 assignee); HEAD 94d1e97 (chore: dashboard rebuild), main 与 origin 同步; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee)。⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (冲突) / 复验 #374 (根因未修) / 确认 10-11 18:00 宿主重启原因 / #374 assignee 指派。

---

# 14:00 — PM Patrol (Sat 10-17, 14:00 轮次) [refresh, #374 持续: 14:00 新错误信息]

🟢 全绿 — 14 容器 Up 5d (5 healthy, 0 unhealthy); uptime 5d19:59; 探针全 200 (backend :3000 `/api/health`, admin :8080 `/`, portal :8081 `/`)。
⚠️ **#374 同族持续, 13:00+14:00 各 1 事件**: 13:00 `LunchChange.created_by does not exist`; 14:00 自动拒绝任务 **`missing FROM-clause entry for table "change"`** (新错误信息, 同 lunch 表)。2h 共 23 行日志 / 4 ERROR。镜像仍 v1.5.9 → 未部署。
资源: load 0.84/0.48/0.51; mem avail **582M** (152M free); 磁盘 74% (9.8G free); 无 D-state。
**GH 无变化**: 55 open (45 个无 assignee 且 p0/p1); HEAD 083a21c (patrol 10:04), 本地领先 origin 2; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee)。
⚠️ main-only allowAny=false → 无法 spawn。
**Needs your input**: 部署 #375 / 处理 #369 (对应 #366-#368) / 指派+修复 #374 / 确认 10-11 18:00 宿主重启原因。

# 19:00 — PM Patrol (Sat 10-17, 19:00 轮次) [refresh, 无实质变化, #374 本窗口 0 ERROR]

🟢 全绿 — 14 容器 Up 6d (5 healthy, 0 unhealthy); uptime 6d00:59; 探针全 200 (backend :3000 `/api/health`, admin :8080 `/`, portal :8081 `/`)。
✅ **#374 本窗口 0 ERROR**: backend 近 2h 仅 5 行日志 (18:00/19:00 BackupService 清理, 删 1 个旧备份), 无 QueryFailedError。镜像仍 v1.5.9 → 修复未上线, 仅调度窗口未触发。
资源: load 0.32/0.45/0.61; mem avail **633M** (143M free); 磁盘 74% (9.8G free); 无 D-state。
**GH 无变化**: 55 open (全部无 assignee); HEAD 08fa498 (patrol 17:04), 本地领先 origin 6; PR 仅 #369 CONFLICTING; #374 OPEN (p1, 无 assignee)。
⚠️ main-only allowAny=false → 无法 spawn DEV/QA/DEVOPS, blocker 持续。
**Needs your input**: 部署 #375 / 处理 #369 (i18n, 对应 #366-#368) / 指派+修复 #374 / 确认 10-11 18:00 宿主重启原因。

---

# 21:04 — PM Patrol (Sat 10-17, 21:04 轮次) — 已由上一条记录覆盖 (重复触发)
