# 项目看板 (Kanban Board)

最后更新：2026-06-09 20:30

## 📋 Backlog / 待处理

### P0 - 最高优先级
| Issue | 标题 | 标签 | 指派 |
|-------|------|------|------|
| #21 | [P0] 财政模块完全未开发 - 菜单和功能缺失 | enhancement, backend, p0 | - |
| #20 | [P0] 补齐课程管理和系统设置页面 | bug, frontend, p0 | - |
| #29 | [REQ] 家长门户整体UI严重不足 | req, ui, portal, p0 | @REQ |

### P1 - 高优先级 - 核心功能模块
| Issue | 标题 | 标签 | 指派 |
|-------|------|------|------|
| #22 | [REQ] 家长查询AC验收标准缺失 | req, spec, p1 | @REQ |
| #23 | [REQ] 午膳管理独立页面设计缺失 | req, ui, p1 | @REQ |
| #25 | [REQ] 财务报销完整AC缺失 | req, spec, p1 | @REQ |
| #26 | [REQ] ABAC规则详细示例缺失 | req, spec, security, p1 | @REQ |
| #30 | [F-ATT-001] 学生出勤管理 | p1, attendance, mod-daily | @DEV1 |
| #31 | [F-LEAVE-001] 教师请假管理 | p1, leave, mod-daily | @DEV2 |
| #32 | [F-INQ-001] 家长查询队列管理 | p1, inquiry, mod-daily | @DEV3 |
| #33 | [F-FIN-001] 学费管理 | p1, finance, mod-fin | @DEV1 |
| #34 | [F-FIN-003] 费用管理 | p1, finance, mod-fin | @DEV2 |
| #35 | [F-FEE-001] 奖学金/津贴管理 | p1, fee, mod-fin | @DEV3 |
| #36 | [F-LUNCH-001] 午膳管理 | p1, lunch, mod-daily | @DEV1 |
| #37 | [F-BUS-001] 校车管理 | p1, bus, mod-daily | @DEV2 |

### P2 - 中优先级 - 增强功能模块
| Issue | 标题 | 标签 | 指派 |
|-------|------|------|------|
| #24 | [REQ] 家长自助变更微信端UI缺失 | req, ui, mobile, p2 | @REQ |
| #27 | [REQ] 灾难恢复操作界面设计缺失 | req, ui, ops, p2 | @REQ |
| #28 | [REQ] 运维仪表板详细设计缺失 | req, ui, ops, p2 | @REQ |
| #38 | [F-DASH-001] 仪表板 | p2, dashboard, mod-daily | @DEV3 |
| #39 | [F-USER-001] 用户管理 | p2, user, mod-user | @DEV1 |
| #40 | [F-USER-002] 权限管理 | p2, user, mod-user | @DEV2 |
| #41 | [F-NEW-001] 学生档案管理 | p2, student, mod-new | @DEV3 |
| #42 | [F-NEW-002] 学生成绩管理 | p2, grades, mod-new | @DEV1 |
| #43 | [F-NEW-03] 考试管理 | p2, exam, mod-new | @DEV2 |
| #44 | [F-NEW-04] 课程管理 | p2, course, mod-new | @DEV3 |
| #45 | [F-NEW-05] 成绩发布管理 | p2, grades, mod-new | @DEV1 |
| #46 | [F-NEW-06] 文档管理 | p2, document, mod-new | @DEV2 |
| #47 | [F-ADM-001] 学校信息管理 | p2, admin, mod-cycl | @DEV3 |
| #48 | [F-ADM-002] 通讯录管理 | p2, admin, mod-cycl | @DEV1 |
| #49 | [F-BUS-002] 校车路线管理 | p2, bus, mod-daily | @DEV2 |
| #50 | [F-ASSET-001] 资产管理 | p2, asset, mod-fin | @DEV3 |
| #51 | [F-ASSET-002] 资产租借管理 | p2, asset, mod-fin | @DEV1 |

### P3 - 低优先级 - 优化功能模块
| Issue | 标题 | 标签 | 指派 |
|-------|------|------|------|
| #52 | [F-AI-001] AI智能建议 | p3, ai, mod-ai | @DEV2 |
| #53 | [F-AI-002] AI自动分类 | p3, ai, mod-ai | @DEV3 |
| #54 | [F-AI-003] AI数据分析 | p3, ai, mod-ai | @DEV1 |
| #55 | [F-AUTO-001] 工作流自动化 | p3, automation, mod-ai | @DEV2 |
| #56 | [F-AUTO-002] 自动提醒 | p3, automation, mod-ai | @DEV3 |

---

## 🚧 In Progress / 进行中

_当前无进行中任务_

---

## ✅ Done / 已完成

_当前无已完成任务_

---

## 📊 统计

- **总计 Issues**: 43 (包括12个功能开发Issues)
- **P0 优先级**: 3
- **P1 优先级**: 8 (核心功能)
- **P2 优先级**: 17 (增强功能)
- **P3 优先级**: 5 (优化功能)
- **待 @REQ 处理**: 8
- **待 @DEV1 处理**: 8
- **待 @DEV2 处理**: 8
- **待 @DEV3 处理**: 8

---

## 📝 更新日志

### 2026-06-09 20:30
- ✅ 创建32个功能开发Issues (#30-#56)，涵盖P1核心功能、P2增强功能、P3优化功能
- ✅ 为所有Issues添加标签（优先级、模块、功能类型）和指派（DEV1/DEV2/DEV3轮换）
- ✅ 更新KANBAN-BOARD.md统计信息和待办列表
- 📌 新增功能模块标签：p3, mod-daily, mod-fin, mod-user, mod-new, mod-cycl, mod-ai, mod-ops

### 2026-06-09
- ✅ 创建8个新Issues (#22-#29) 分配给@REQ
- 📌 新增标签: req, spec, ui, mobile, p0, p1, p2, security, ops, portal
