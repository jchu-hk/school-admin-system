# PM 待办任务池 (PM Task Pool)
## Smart School Admin AI System
## Mode: 全天候待命 (All-time Standby)
## Last Updated: 2026-06-23 08:47

---

## 📋 任务队列 (Task Queue)

### 当前任务 (CURRENT)

| # | 任务 | 状态 | 负责角色 | 阻塞 |
|---|------|------|---------|------|
| 1 | 验收 #110, #111, #115 (double-wrapping bugs) | ✅ 已完成 | QA | - |

### 下一个任务 (NEXT)

| # | 任务 | 优先级 | 前置条件 | 负责角色 |
|---|------|--------|---------|---------|
| 2 | 修复 #112 (角色权限弹窗无法编辑) | P1 | 无 | DEV |
| 3 | 修复 #115 (关于页面空白) | P1 | 无 | DEV |
| 4 | 修复 #103 (TC3分期API UUID校验) | P1 | 无 | DEV |
| 5 | 清理10个abandoned branches | P2 | 无 | DEVOPS |

---

## 🔴 GitHub 待修复缺陷 (P0/P1)

| # | 缺陷 | 严重程度 | 状态 | 备注 |
|---|------|----------|------|------|
| #103 | TC3 分期API studentId UUID校验缺失 | P1 | 🔴 待修复 | 后端API校验 |
| #112 | 角色权限配置弹窗无法编辑 | P1 | 🔴 待修复 | 前端弹窗逻辑 |
| #115 | 关于页面空白 | P1 | 🔴 待修复 | 前端About组件 |

## 🟢 已关闭缺陷 (2026-06-22 验证通过)

| # | 缺陷 | 关闭时间 |
|---|------|---------|
| #123 | 后端DB列名与Entity不匹配(根因) | 2026-06-22 17:04 |
| #122 | 英文模式分期付款仍显示中文 | 2026-06-22 17:08 |
| #120 | 家长查询队列筛选器不工作 | 2026-06-22 17:04 |
| #119 | 家长查询提交失败 | 2026-06-22 17:04 |
| #118 | 请假申请 TypeError: y.map | 2026-06-22 17:04 |
| #117 | 用户管理无数据显示 | 2026-06-22 17:04 |
| #116 | 学生管理 TypeError: e.map | 2026-06-22 17:03 |
| #111 | 用户管理无数据显示 | 2026-06-22 17:14 |
| #110 | 考勤管理页面报错 | 2026-06-22 17:14 |

---

## 🗑️ 待清理 Abandoned Branches

| 分支 | 状态 | 建议操作 |
|------|------|---------|
| origin/feature/dev-fai001-ai-suggestion | ❌ 已废弃 | 删除 |
| origin/feature/phase-1-infrastructure | ❌ 已废弃 | 删除 |
| origin/feature/phase-2-core-modules | ❌ 已废弃 | 删除 |
| origin/feature/phase-2-qa2-automation | ❌ 已废弃 | 删除 |
| origin/feature/phase-3-abac | ❌ 已废弃 | 删除 |
| origin/feature/phase-3-frontend | ❌ 已废弃 | 删除 |
| origin/feature/phase-3-frontend-dev1 | ❌ 已废弃 | 删除 |
| origin/feature/phase-3-frontend-dev3 | ❌ 已废弃 | 删除 |
| origin/feature/phase-4-deployment-v2 | ❌ 已废弃 | 删除 |
| origin/feature/tuition-management-#33 | ❌ 已废弃 | 删除 |

**总计**: 10个废弃分支需清理

---

## 📊 任务统计

| 状态 | 数量 |
|------|------|
| 🔴 待修复 P0/P1 | 3 |
| 🟢 已关闭 | 9 |
| 🗑️ 待清理分支 | 10 |
| **总计** | 22 |

---

**Last Updated**: 2026-06-23 08:47
**Mode**: 全天候待命 (All-time Standby)
