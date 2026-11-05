# PM 每日状态汇报 — 2026-10-27 18:00 (Tue, 晚间) — 已发送

## 数据来源
- gh issue list: 55 open / 0 assigned / 今日 closed=0 / 今日 updated=0（与 09:00 完全一致）
- PR: #369 CONFLICTING, updated 2026-08-23（停滞 65 天）
- 实时: backend 200(19ms) / admin 200(4.3ms) / portal 200(0.8ms) / gateway 200
- Docker: 14 Up / 0 unhealthy；cloudflared Exited 2 months（非新故障）
- backend `--since 6h` ERROR = **4**（全部 #374 同源）
- 镜像: school-admin-backend:v1.5.9（2026-08-14）
- 系统: 内存 avail 593M（早 714M，−121M，观察项）；磁盘 75% (9.4G)

## 今日新证据（重要）
18:00 整点再次复现两类错误：
1. `DailyReportService 生成班级日报失败: class=中一A班(...): column AttendanceDailyReport.school_id does not exist`
2. `DailyReportService 签到日报生成失败: column "school_id" of relation "attendance_daily_reports" does not exist`
→ 结论：**日报每天 18:00 都在失败，属持续数据丢失**，不是间歇性噪音。影响面已从「提醒调度」扩展到「日报生成」并每日复现。

## 1. 已完成
- 无

## 2. 进行中
- 无 in-progress（assigned=0）
- PR #369 停滞 65 天
- ready-for-review 未认领: #365 #274 #262 #261 #140

## 3. Blockers
- B1 🔴 镜像 v1.5.9 → #374 第 21 天（日报每日失败）
- B2 🔴 spawn 不可用第 21 天 — 根因级阻塞
- B3 🟡 migration 未补 attendance_daily_reports.school_id
- B4 🟡 4 个 fix 分支超期未合（i18n-lang-switch / i18n-language-switch-367-368-366 / remove-agents-menu-365 / schema-drift-lunch-notification）
- B5 🟡 内存 avail 714M→593M 走低，观察项

## 4. Needs your input（5 条）
1. #374 镜像上线 — A 授权 spawn DEVOPS（推荐）/ B 手动 / C 推迟
2. 恢复 spawn 权限 — A 全开 / B 只 devops / C 只读
3. PR #369 — A 关闭重做 / B 解冲突 / C 彻底关闭
4. 45 项需求排期 — A 自动按 M1→M4 / B 指定首批
5. 4 个陈旧分支 — A 逐支处理 / B 保留

## 5. 下一步
- 无 start condition 满足项（B2 阻塞）
- 授权后：① #374 镜像+migration → ② i18n 三连 #368/#367/#366 → ③ #365 → ④ M1 P0 #326~#331

## 备注
- PM 本轮仅执行只读检查（gh / docker logs / curl），未 spawn、未改码、未部署 — 符合白名单
- 已被同一阻塞条件（spawn 不可用）连续卡住 21 天，建议下次 cron 后若仍无输入，改为每日单次汇报以降低噪音
