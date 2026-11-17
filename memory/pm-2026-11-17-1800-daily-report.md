# PM 每日状态汇报 — Tue 2026-11-17 18:00

## 系统健康 🟢
- backend 200 (32ms) / admin 200 (9.8ms) / portal 200 (2.8ms) / gateway 200 (5.6ms)
- 14 容器全 Up / 0 unhealthy；磁盘 76%（剩 9.3G）
- 内存 available 433M（09:00 轮 620M → 433M，-187M，仍 >300M 安全线）；free 117M + cache 631M
- backend 近 3h ERROR = 2，近 9h ERROR = 4

## 今日已实报缺陷（同源 #374 schema 漂移，三个时点全部复现）
- 13:00 午膳变更提醒：column LunchChange.created_by does not exist
- 14:00 午膳自动拒绝：missing FROM-clause entry for table "change"
- 18:00 班级日报 + 签到日报：column AttendanceDailyReport.school_id does not exist ×2
→ 与 09:00 预计完全一致，无新增缺陷类型。业务影响：日报/签到日报未生成、午膳提醒与自动拒绝未执行。

## GitHub
- open 55（p0=29 / p1=16 / p2=7 / p3=2 / 无标签 1）；今日 0 关闭、0 新增、0 指派、0 in-progress
- 最新更新仍 #374 (10-04)
- PR #369 OPEN / CONFLICTING（updated 08-23）— 第 132 天，阻塞 #367/#368/#366

## Blocker
- capabilities=none / allowAny=false / 仅 main → 无法 spawn DEV/QA/DEVOPS
- #374 未上线（需用户批准）；PR #369 挂死

## 判定
日报已推送用户。核心诉求：#374 批准上线 + P0 派工授权。
