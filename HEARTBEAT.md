# 19:04 — PM Patrol (Wed 11-18, 19:04 轮次) [🟢 三端全绿 / 🟡 近 3h ERROR = 2（18:00 日报，#374 已知复现）/ 🟢 内存 420M / 🟢 GH 持平 55]

🟢 backend :3000/api/health = 200；admin :8080 = 200；portal :8081 = 200。
🟢 14 容器 Up / 0 unhealthy。
🟡 近 3h ERROR = **2**（grep 计数 4，含 2 条 QueryFailedError 堆栈行），全部 18:00 DailyReportService，其余时段无错误：
  · 班级日报 `column AttendanceDailyReport.school_id does not exist`
  · 签到日报 `column "school_id" of relation "attendance_daily_reports" does not exist`
  ⚠️ 线索（已并入 #374 Needs-input ②）：`attendance_daily_reports.school_id` 需加入同一 migration。
🟢 内存 available **420M**（459M → 420M，-39M；轨道 559→388→437→417→409→459→420）；free 121M + cache 615M；swap 0；load 2.42/0.87/1.17（1min 短时尖峰，5/15min 平稳）；磁盘 76%（剩 9.3G）。
🟢 GH open = **55**（持平）；55/55 未指派；最新 #374（10-04）；无新增、无新 P0/P1。
🟡 PR #369 仍 OPEN/CONFLICTING（i18n #367/#368/#366）— 第 139 天。
⚠️ 观察：origin 上 `fix/leave-backend-3bugs-p0`（8a08b09）、`fix/portal-basename-262`（60b7bee）仍存活，本地无同名分支 — 疑似已合并未删，待确认。

判定：三端全绿、ERROR 全属 #374 可预测复现、GH 无变化 → 不推送用户，仅记录。

Blocker（未变）：capabilities=none，环境仅 main、allowAny=false → 无法 spawn DEV/QA/DEVOPS。

Needs your input（5 项）：
① #374 上线（回复「批准上线」）
② #374 migration 需含 `attendance_daily_reports.school_id`（及午膳相关字段）
③ 午膳自动拒绝/提醒 SQL 随 #374 一并修
④ PR #369 处置（139 天）
⑤ P0 存量 29 个分批派工
