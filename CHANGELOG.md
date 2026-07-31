# Changelog

## v1.6.1 (2026-07-31)

### Changes
fix(#267): AssetController route ordering conflict — GET rentals matched by :id wildcard
fix(#268-#273): User/Asset/Leave management — 7 P0 defects closed (delete alert, status toggle, modal reset, leave teachers fetch, UUID validation, parent links data corruption, inquiry_create enum)
fix(#220): Student edit form date fields blank — ISO datetime incompatible with HTML5 date input
fix(#280): UpdateStudentDto missing admission_date field
fix(#290): RoleService DI conflict — duplicate service definitions causing permission save failures
fix(#291): i18n build error 't is not defined' — module-level t() usage in Attendance/Scholarship/Lunch/Notification pages
fix(#294): Exam API undefined params filter + merge conflict in FinanceScholarshipPage
fix(#235): Missing PATCH /api/roles/:id endpoint for role permission update
fix: QR scan page — camera init, jsQR ESM import, backend 401 JWT guard conflict
fix: Scholarship API path duplicate directory
fix: System settings API path — .env.production overwriting VITE_API_BASE_URL
fix: Missing userService.ts — imported by Layout and Login but never created
fix: pnpm-lock.yaml regeneration for CI frozen-lockfile
infra: Three-layer context architecture to prevent bootstrap truncation

### Technical Details
- Git Commit: `6816155`
- Branch: `main`

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0-draft.1] — 2026-07-18

### Added

**新模块: QR签到考勤 (CR-20260714-001 Phase 1~4)**
- QR码签到系统: 学生展示QR码 → 教职工扫码 → 签到记录
- POST /api/attendance/qr/scan 公开API端点
- CameraScanBox 摄像头组件 + jsQR解码
- 离线签到批量同步
- 签到记录查询与报表

**新模块: 学生门户**
- 个人档案管理
- 电子请假申请

**新模块: 家长门户**
- 多孩子切换
- 权限只读视图

### Fixed

**P0缺陷修复**
- Fix #266: QR扫码提交后端500 — scanner_id UUID类型不匹配
- Fix #256/#265: QR扫码页面摄像头无画面 + jsQR解码失败 + 后端401拦截
- Fix #235: student角色保存权限配置失败 — 后端添加PATCH /api/roles/:id

### Technical Details
- Git Commit: `68e28b9` (latest), `adbbf28` (#235 fix), `cc0db46` (QR fixes)
- Branch: `main`
- QA验证: #256 PASSED, #259 全系统回归 PASSED (12/12模块)
- 测试环境: http://localhost:8080 (admin-app) / http://localhost:8081 (portal-app)
- Coze入口: https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/

---

## [1.6.0] — 2026-07-13

### Fixed

**Bug清零版本 — 所有已知Bug修复**
- Fix #222: 新增学生返回500错误
- Fix #223: 编辑学生班级不保存
- Fix #224: 出勤概览人工录入按钮无响应
- Fix #225: 搜索与下拉筛选不工作
- Fix #229: 人工录入出勤日期选择无效果
- Fix #213~#216: 环境清理 Phase 1-4

### Technical Details
- Git Commit: `d81c25e`
- Branch: `main`
- Status: Bug清零发布

---

## [1.5.7] — 2026-07-10

### Fixed

**Core Bug Fixes**
- Fix #210: 修复登录路径重复 `/api/api/auth/login` 问题
- Fix #211: 修复 notification endpoint `/api` prefix 问题
- Fix nginx proxy routes for `/students` and `/classes` endpoints
- Fix baseURL 设为 `/api/` 生产环境配置

**UI/UX Fixes**
- Fix #206: 新增学生页面所属班级下拉框无数据
- Fix #207: 新增学生保存返回400错误

**Authentication**
- Fix #209: 移除 UserPage, LeavePage, StudentProfilePage 中的重复 Authorization header
- Fix #208: 移除 StudentPage 中的重复 Authorization header

### Changed

**Testing & Credentials**
- 添加 staff1 测试账号
- 更新测试凭证文档
- 验证 superuser 账号可用

**Documentation**
- 更新 PROJECT-WIKI 测试环境说明
- 添加 Coze 环境警告（Coze非我们管理）
- 添加测试环境刷新流程文档

**AI Team**
- 完善 OPS 角色定义
- 增强 PM-WORKFLOW 独立验收体系
- 添加新项目设置流程文档

### Technical Details
- Git Commit: `3788682`
- Branch: `main`

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