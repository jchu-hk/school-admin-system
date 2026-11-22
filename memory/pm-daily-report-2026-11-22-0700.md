# PM Patrol — 2026-11-22 07:00 (Asia/Shanghai)

- 三端：backend 200 (status=ok)、admin 8080 200、portal 8081 200
- 容器：14 Up 2 days，无异常；内存 avail 924M；磁盘 75% (9.4G)
- 日志：近 60m ERROR/FATAL = 0
- GH：open 55（p0 29 / p1 16 / p2 7 / p3 2），assigned 0，无新 P0/P1（最新更新仍 #374 @10-04）
- PR：#369 仍开，mergeable=UNKNOWN（前次 CONFLICTING），逾期 ~92 天
- 结论：全绿，无实质变化 → 不打扰
- Blocker：capabilities=none / 仅 main / allowAny=false → 无法 spawn DEV/QA/DEVOPS
- Needs input：① #374 migration 授权 ② PR #369 处置 ③ 代理 spawn 策略

## 14:00 巡检（补充）
- 🟢 三端全绿：backend :3000/api/health=200、admin :8080/school-admin/=200、portal :8081/portal/student=200
- 🟢 14 容器 running；Exited 仅 school-admin-cloudflared（历史遗留）；zen_kowalevski Created（非本系统）
- 🟢 内存 available 793M（12:00 694M → 回升）；磁盘 76%（剩 9.4G）
- 🟡 近 60m backend ERROR=1：LunchReminderScheduler「午膳变更自动拒绝任务失败: missing FROM-clause entry for table "change"」→ 即 #374 schema 漂移，每小时定时触发，非新增
- 🟢 GH open 55（p0=29/p1=16/p2=7/p3=2），全部 unassigned；最新更新仍 #374（10-04）→ 无新 P0/P1
- 🔴 PR #369 CONFLICTING（逾期 ~92 天）
- Blocker：capabilities=none、仅 main、allowAny=false → 无法 spawn DEV/QA/DEVOPS
