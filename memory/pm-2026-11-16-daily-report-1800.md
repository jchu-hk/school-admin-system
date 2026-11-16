# PM 每日状态汇报 — 2026-11-16 18:00 (Mon)

## 数据快照
- GH open = 55（p0=29 / p1=16 / p2=7 / p3=2）；0 assignee、0 in-progress
- 近 3 天 closed = 0；近 7 天新增 = 0
- PR #369 OPEN / CONFLICTING（last update 2026-08-23，第 129 天）
- 三端全部 200；容器 14 全 Up / 0 unhealthy
- 内存 available 478M（09:00 = 615M，-137M）；磁盘 76%（剩 9.4G）

## 今日新增事实（相对 09:00 汇报）
- 18:00 DailyReportService 日报生成失败 ×2：
  - 班级日报：column AttendanceDailyReport.school_id does not exist
  - 签到日报：column "school_id" of relation "attendance_daily_reports" does not exist
- 近 24h backend ERROR = 4：LunchReminderScheduler ×2（13:00 提醒 + 14:00 自动拒绝）、DailyReportService ×2（18:00）
- 判定：同一 #374 schema 漂移根因；失败业务功能从 2 个（午膳）扩大到 3 个（午膳 + 日报）

## 汇报内容（5 段式，已发送）
1. 已完成：无 Issue 关闭；巡检完成；但 3 个定时任务按时触发却执行失败
2. 进行中：0 in-progress；PR #369 搁置
3. Blockers：capabilities=none 无法 spawn；#374 未获批；29 P0 零指派
4. Needs input（5 项）：#374 上线（标为最紧急）/ 日报 school_id 并入 migration / 午膳 SQL 随修 / PR #369 / P0 分批派工
5. 下一步：①批准即上线 #374 + QA 回归两条链路；④解锁 i18n；⑤启动 P0 第一批；明早核对午膳+日报是否再失败

## 结论
失败面在扩大（1 → 3 个业务功能）。#374 上线是当前性价比最高的单点动作。
