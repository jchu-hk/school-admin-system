# 18:00 — PM 每日状态汇报 (Fri 2026-11-20)

数据采集：
- 三端健康：backend:3000/api/health=200、admin:8080=200、portal:8081=200
- 容器 14/14 Up 24h（关键服务 healthy；16:04 记录的 opa 已恢复）
- 内存 available 1009M（09:00 为 1341M，持续下降）；磁盘 75%（剩 9.4G）
- backend 近 60m ERROR=2：13:00 handleReminder「column LunchChange.created_by does not exist」、14:00 handleAutoReject「missing FROM-clause entry for table "change"」→ #374 定时任务今日两段仍失败
- GH open = 55（p0=29 / p1=16）；无新 P0/P1；24h 内零 issue 关闭
- PR #369 CONFLICTING（最后更新 2026-08-23，逾期 ~89 天）

对比 09:00：无任何开发进展；#374 报错今日实锤复现（09:00 因窗口未到未捕获）。
Blocker（未变）：capabilities=none、仅 main、allowAny=false → 无法 spawn。
