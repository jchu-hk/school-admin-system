# 2026-07-02 学生管理模块根本性设计缺陷报告

## 用户反馈

**来源**: 用户测试反馈 (2026-07-02 07:49 GMT+8)  
**模块**: Student Management → Add New Student  
**严重程度**: P0 - 根本性设计错误

---

## 缺陷清单

### #1: 学生档案与系统用户混淆 ❌ CRITICAL

**问题**: 
- 添加学生页面包含 `username` 和 `password` 字段
- 学生记录实际上是 `users` 表中 `role='student'` 的记录
- 没有独立的 `students` 表

**根本性错误**:
- **学生档案 ≠ 系统用户**
- 学生档案是**业务数据**（姓名、性别、地址、学号等）
- 系统用户是**技术数据**（登录账号、密码、权限）
- 两者概念完全不同，不应混淆

**正确设计**:
```
students (学生档案表)
├── id (UUID)
├── student_id (学号，格式：2026000123) ← 自动生成
├── name_zh (中文名)
├── name_en (英文名)
├── gender (性别)
├── birth_date (出生日期)
├── address (地址)
├── phone (联系电话)
├── email (邮箱)
├── admission_date (入学日期)
├── status (在校/毕业/退学)
└── created_at/updated_at

users (系统用户表，可选关联)
├── id (UUID)
├── student_profile_id (FK→students.id，可选)
├── username
├── password
├── role
└ ...
```

---

### #2: 班级下拉框无数据 ❌ P0

**问题**: 
- Class dropdown 没有显示任何班级选项
- 班级数据可能未正确加载

**根因分析**:
- `/api/classes` API 可能返回空数据
- 或前端未正确调用班级 API

**正确设计**:
- **学生-班级关系应该是按学年的动态关系**
- 不应该在学生创建时绑定固定班级
- 需要独立的 `class_allocations` 表：

```
class_allocations (班级分配表)
├── id (UUID)
├── student_id (FK→students.id)
├── class_id (FK→classes.id)
├── academic_year_id (FK→academic_years.id)
├── allocation_type (主班/选修/临时)
├── effective_date
├── end_date (可为空，表示当前学年)
└── created_at/updated_at
```

---

### #3: 学生基本信息缺失 ❌ P0

**缺失字段**:
| 字段 | 说明 | 必要性 |
|------|------|--------|
| student_id | 学号（自动生成） | **必须** |
| gender | 性别 | **必须** |
| birth_date | 出生日期 | **必须** |
| address | 家庭地址 | **必须** |
| name_en | 英文名 | 推荐 |
| admission_date | 入学日期 | 推荐 |
| guardian_name | 监护人姓名 | 推荐 |
| guardian_phone | 监护人电话 | 推荐 |
| emergency_contact | 紧急联系人 | 推荐 |

---

### #4: 学号未自动生成 ❌ P0

**问题**: 
- 当前没有学号字段
- 学号应该系统自动生成，不应手动输入

**学号格式建议**:
```
格式: YYYYNNNN
- YYYY: 入学年份 (2026)
- NNNN: 该年入学序号 (0001-9999)

示例:
- 2026000001 → 2026年第1个入学学生
- 2026000123 → 2026年第123个入学学生
- 2025000045 → 2025年第45个入学学生
```

**生成规则**:
- 按入学年份分组
- 每年从 0001 开始递增
- 自动分配，不可修改

---

### #5: 新建记录不显示在列表 ❌ P1

**问题**: 
- 保存学生后，列表页面不显示新创建的记录

**可能原因**:
- API 返回数据后前端未刷新
- 或数据保存失败但未提示
- 或分页/筛选导致看不到新记录

---

## 影响范围分析

| 文档 | 影响级别 | 需要更新 |
|------|----------|----------|
| SPEC-COMPLETE.md | **CRITICAL** | 学生管理模块 F-DAILY-001 需重新定义 |
| SPEC-SYSTEM-DESIGN.md | **CRITICAL** | 数据模型需重新设计 |
| DB-SCHEMA.md | **CRITICAL** | 需创建 students 表和相关表 |
| DATA-DICTIONARY.md | **CRITICAL** | 学生字段需重新定义 |
| API-DESIGN.md | **HIGH** | 学生 API 需重新设计 |
| 前端 StudentPage.tsx | **CRITICAL** | 需完全重写 |
| 后端 user.entity.ts | **HIGH** | 需分离学生逻辑 |

---

## 正确设计建议

### 1. 数据模型重构

```sql
-- 学生档案表 (独立于用户)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(10) UNIQUE NOT NULL,  -- 学号 2026000123
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  gender gender_enum NOT NULL,  -- male/female/other
  birth_date DATE NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  admission_date DATE NOT NULL,
  status student_status_enum DEFAULT 'active',
  graduation_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 班级分配表 (按学年)
CREATE TABLE class_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  allocation_type allocation_type_enum DEFAULT 'main',
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 学号序列表 (按年份)
CREATE TABLE student_id_sequences (
  academic_year_id UUID PRIMARY KEY REFERENCES academic_years(id),
  last_sequence INTEGER NOT NULL DEFAULT 0
);
```

### 2. API 设计

```
POST /api/students           - 创建学生档案（自动生成学号）
GET  /api/students           - 学生列表
GET  /api/students/:id       - 学生详情
PUT  /api/students/:id       - 更新学生档案
DELETE /api/students/:id     - 删除学生档案（软删除）

GET  /api/students/:id/classes - 学生班级分配历史
POST /api/students/:id/classes  - 分配班级（按学年）

GET  /api/classes/:id/students - 班级学生列表（按学年筛选）
```

### 3. 前端设计

```
学生管理页面
├── 学生列表（显示：学号、姓名、性别、当前班级、状态）
├── 添加学生按钮
├── 搜索/筛选（按姓名、学号、班级）
└── 批量操作

添加学生表单
├── 基本信息
│   ├── 姓名（中/英文）
│   ├── 性别（下拉）
│   ├── 出生日期（日期选择）
│   ├── 地址（文本）
│   ├── 联系电话
│   ├── 邮箱
│   └── 入学日期
├── 学号：自动显示（如 2026000001）
├── 监护人信息（可选）
│   ├── 监护人姓名
│   ├── 监护人电话
│   └── 紧急联系人
└── 保存按钮

注意：不显示 username/password！
```

---

## PM决策

**优先级**: P0 - 根本性设计错误，必须立即修复  
**影响**: 涉及 5 个核心文档 + 前后端代码  
**工作量**: 估计 3-5 天完整重构

**建议行动**:
1. 立即创建 GitHub Issue 跟踪
2. 停止当前学生管理功能使用
3. 设计文档先行更新（遵循 AGENTS.md Section 9）
4. DEV 团队重构学生模块

---

## GitHub Issue 创建

需要创建以下 Issues：

| Issue | 标题 | 优先级 |
|-------|------|--------|
| #NEW-1 | 学生档案与系统用户分离 - 数据模型重构 | P0 |
| #NEW-2 | 学号自动生成机制 | P0 |
| #NEW-3 | 学生基本信息字段补全 | P0 |
| #NEW-4 | 班级分配按学年管理 | P0 |
| #NEW-5 | 新建学生后列表不显示 | P1 |

---

**报告人**: PM  
**日期**: 2026-07-02  
**状态**: 待用户确认后创建 Issue
---

## 心跳检查 12:10 (GMT+8)

### 发现的问题
1. **Issue #194 (P0学生管理重构)**: 已关闭 ✅ - 之前已完成
2. **Project Status Workflow**: 缺少 GH_TOKEN → 已修复 (commit `43177bf`)
3. **QA Checker & Agent Comm Workflow**: 缺少 `permissions` 块 → 已修复 (commit `0819212`)

### Git状态
- ✅ main分支正常，无冲突
- 最新提交:
  - `0819212` - fix(ci): add write permissions to agent-comm and qa-checker workflows
  - `43177bf` - fix(ci): add GH_TOKEN to project-status workflow
  - `97dee59` - pm: heartbeat record

### 开放Issues (16个, 无P0/P1)
- #184: 教师招聘模块补充 (P4)
- #182: 会议管理模块补充 (P4)
- #140: TypeORM实体元数据警告 (P3, ready-for-review)
- #50/#51: 资产管理 (P2)
- #53-56: AI/自动化功能 (P3)
- 其他P2/P3模块: 考试/课程/成绩/文档/学校信息/通讯录/校车

### PM工作
- ✅ CI/CD Workflow修复完成
- ⚠️ Issue #194 (学生管理P0) 已关闭，但本地memory文件仍记录为未完成
  - 实际完成状态需确认最终用户验收结果
