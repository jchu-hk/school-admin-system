# PM 自动化检查计划 (PM Automation Plan)

## Cron任务

### 每日检查 (Daily Check)
- **时间**: 每天09:00
- **脚本**: `/workspace/projects/workspace/scripts/pm-daily-check.sh`
- **日志**: `/var/log/pm-daily-check.log`
- **内容**: 
  - Feature分支积压 (>3天)
  - P0/P1 Issues状态
  - 容器健康状态
  - 最近24小时提交
  - 模块完成度

### 周报生成 (Weekly Report)
- **时间**: 每周五17:00
- **脚本**: `/workspace/projects/workspace/scripts/pm-weekly-report.sh`
- **日志**: `/var/log/pm-weekly-report.log`
- **内容**:
  - Issue统计 (打开/关闭)
  - 提交统计
  - 分支统计
  - 模块完成度

## 手动脚本

### 分支清理
- **脚本**: `/workspace/projects/workspace/scripts/pm-cleanup-branches.sh`
- **用途**: 清理abandoned branches (>3天, 0待提交)
- **模式**: DRY_RUN=true 只显示不删除

---

## PM Proactive Planning原则

### 1. 不等待被动反馈
- 每天早上9点自动检查
- 主动发现问题，不要等用户报告

### 2. 按优先级驱动
- P0 > P1 > P2 > P3
- P0/P1优先处理

### 3. 短周期交付
- Feature分支生命周期不超过3天
- 完成立即合并，不留积压

### 4. 文档同步
- 任何变更先更新文档（AGENTS.md Section 9）
- 数据库/接口/功能规格同步更新

### 5. 主动合并
- 不等待review周期
- 完成功能立即合并到main

---

## Created: 2026-06-22 13:22
## Last Updated: 2026-06-22 13:35