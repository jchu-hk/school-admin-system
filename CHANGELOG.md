# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.6] - 2026-07-03

### Fixed

**Student Management Module**
- Fix #194: 学生管理模块根本性重构 - 学生档案从系统用户分离
  - 新增独立 students 表，包含 student_id（唯一标识）
  - 实现完整的 CRUD API: `/api/students`
  - 支持班级分配: `POST /api/students/:id/class`
  - 支持学号自动生成
  - 前端 StudentPage.tsx 迁移到新 API
  - Commit: 438618f, 36da8ec

- Fix #197: 修复 currentClass 返回 null
  - 添加 allocation_type = 'MAIN' 过滤
  - 确保 LEFT JOIN 正确映射班级信息
  - Commit: 019d8db

- Fix #198: 禁止软删除学生学号重用
  - 添加学号唯一性校验（含软删除记录）
  - 重复学号返回 HTTP 409 Conflict
  - Commit: 019d8db

### Changed

**Database**
- 新增 students 表
- 新增 class_allocations 表
- 新增 academic_years 表
- Migration: 1709436000000-CreateStudentTables.ts

**API Breaking Changes**
- `/api/users?role=student` → `/api/students`
- POST 创建学生 → `/api/students`（不再使用 users 表）

### Testing

- 新增测试用例文档: `docs/school-admin-system/test-cases/ISSUE-194-student-management.md`
- QA 验收通过: 8/8 测试用例（P0 5/5 ✅）

---

## [1.5.5] - 2026-06-30

### Fixed

- 修复课程管理 Failed to fetch 错误（Issue #193）
- 删除重复 subject 属性
- 前端构建成功
- Commit: d160b62

---

## [1.5.4] - 2026-06-28

### Fixed

- Fix #155: 学生编辑 Modal z-index 问题
- 屏幕不再变暗，可正常编辑保存
- Commit: e8ef417

---

## [1.5.3] - 2026-06-25

### Added

- 多 Agent 协调系统正式实施
- Agent 通信 Skill (agent-communication)
- Multi-Agent Dashboard
- PM 自动化工作流

### Changed

- PM-WORKFLOW.md: 建立标准化工作流程
- 引入开发链路（Chain of Development）
- Impact Analysis 流程

---

## [1.5.2] - 2026-06-20

### Fixed

- 修复出勤概览显示问题（Issue #157, #160）
- 修复家长查询提交问题
- Commit: e9b17da

---

## [1.5.1] - 2026-06-18

### Fixed

- 修复请假管理页面 TypeError
- Fix #159: i.map is not a function
- Commit: f865c5e

---

## [1.5.0] - 2026-06-15

### Fixed

- Fix #153: 修复 /api/users/classes 返回格式
- Fix #149, #150, #151: 多项 P2 bug 修复
- Commit: c76d3d0

---

## [1.4.0] - 2026-06-10

### Added

- 学生档案管理功能（学生与用户分离）
- student_profiles 表
- BusModule 添加到 AppModule
- Commit: 7ac2012

---

## [1.3.0] - 2026-06-05

### Added

- 教师角色请假和奖学金查看权限
- Fix #166
- Commit: 166edff

---

## [1.2.0] - 2026-05-28

### Fixed

- 修复 abac, attendance, grade-records 测试失败
- Commit: 45685ec

---

## [1.1.0] - 2026-05-20

### Added

- 版本管理
- CHANGELOG.md

---

## [1.0.0] - 2026-05-01

### Added

- 初始版本
- 核心功能模块