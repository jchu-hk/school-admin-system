# 学生/家长门户 功能规格说明书

## Student & Parent Portal — Functional Specification Document (FSD)

---

### 📋 文档版本信息

| 字段 | 内容 |
|------|------|
| 文档名称 | 学生/家长门户功能规格说明书 |
| 文档编号 | FSD-PORTAL-001 |
| 当前版本 | **v2.0.0-draft.1** |
| 文档状态 | 变更中 (Change in Progress) |
| 存放位置 | `/docs/school-admin-system/FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md` |
| 主维护人 | 系统架构团队 |
| 审批人 | 校务主任 / 项目经理 |
| 评审依据 | CR-20260714-001 需求规格新增 |

### 📌 版本修订记录

| 版本 | 日期 | 作者 | 状态 | 说明 |
|------|------|------|------|------|
| v2.0.0-draft.1 | 2026-07-14 | 系统架构团队 | Draft | 初始版本：新增 Module 17 学生&家长门户权限与菜单访问控制模块（3项功能函数） |

---

## 1. 模块概述

| 属性 | 描述 |
|------|------|
| 模块名称 | Student & Parent Portal Access Control — 学生&家长门户权限与菜单访问控制模块 |
| 模块ID | MOD-PORTAL-AC-001 |
| 优先级 | **P1（核心补充功能，预计 v2.0.0 发布）** |
| 用户 | 学生（Student）、家长（Parent）、校务处（后台管理） |
| 功能函数数量 | 3 (F-PORTAL-001 ~ F-PORTAL-003) |
| 关联模块 | MOD-STU-001（学生档案），MOD-USER-001（用户管理），MOD-ATT-QR-001（QR签到），MOD-ATT-001（考勤管理） |

> **Module 17 (Student & Parent Portal Access Control / v2.0.0-draft.1)** 是基于自主门户场景新增的权限与菜单控制模块，为 Student/Parent 角色提供差异化的 Web 门户体验。
> **核心目标：** 学生和家长可通过门户查看个人信息、提交电子请假、管理联系信息，并确保严格的数据隔离与权限控制。

---

## 2. 设计背景与目标

### 2.1 现状问题

- 当前系统仅支持校务处和教师角色，无学生/家长自主门户
- 纸质请假条流程效率低，审批状态不可追溯
- 家长无法在线查看子女信息（成绩、考勤、作业等）
- 学生档案联系方式变更需线下提交申请

### 2.2 核心目标

1. 建立 Student/Parent 角色分离的自主门户
2. 实现角色差异化菜单与功能权限控制
3. 提供个人档案查看 + 有限自修改能力
4. 提供电子请假全流程（提交→审批→历史追溯）
5. 严格数据隔离：家长只能查看自己关联的孩子信息

---

## 3. 角色差异化菜单与权限集

### 3.1 授权菜单模块一览

| 菜单模块 | Student | Parent | 管理员 | 说明 |
|---------|:-------:|:------:|:------:|------|
| 个人档案 | ✅ 查看 | ✅ 查看 | ✅ 管理 | Student 可修改联系方式等；Parent 仅读 |
| 我的QR码签入 | ✅ 使用 | ❌ | ❌ | Student-only：生成入校QR码 |
| 电子请假 | ✅ 提交+查看 | ✅ 查看+代提交 | ✅ 审批 | 双方均可查看，Student 主提交 |
| 考勤记录 | ✅ 查看本人 | ✅ 查看关联子女 | ✅ 管理 | Parent 只能看自己孩子的 |
| 成绩查询 | ✅ 查看本人 | ✅ 查看关联子女 | ✅ 管理 | 数据隔离同考勤规则 |
| 课表查询 | ✅ 查看 | ❌ | ✅ 管理 | Student-only 课表 |
| 校历/通告 | ✅ 查看 | ✅ 查看 | ✅ 管理 | 全校通告，双方共享 |
| 校内缴费 | ❌ | ✅ 操作 | ✅ 管理 | Parent 负责缴费操作 |
| 请假审批 | ❌ | ❌ | ✅ 操作 | 管理员/班主任权限 |
| 系统用户管理 | ❌ | ❌ | ✅ 管理 | 管理员禁止菜单 |
| 班级管理 | ❌ | ❌ | ✅ 管理 | 管理员禁止菜单 |
| 财务审计 | ❌ | ❌ | ✅ 管理 | 管理员禁止菜单 |

### 3.2 菜单分类规则

- **Student-only 菜单**：我的QR码签入、课表查询（与学生身份强相关）
- **Parent shared 菜单**：个人档案查看、考勤记录、成绩查询、校历/通告
- **Parent exclusive 菜单**：校内缴费（家长负责缴费）
- **管理员禁止菜单**：系统用户管理、班级管理、财务审计等后台管理功能不对学生/家长开放

---

## 4. RBAC 权限设计

### 4.1 Role: Student (student)

| 权限标识 | 权限名称 | 范围 | 说明 |
|---------|---------|------|------|
| `profile:view:self` | 查看个人档案 | Self | 查看自己的学生档案 |
| `profile:update:self` | 有限修改个人信息 | Self | 仅可修改联系方式、紧急联系人、地址 |
| `attendance:view:self` | 查看本人考勤 | Self | 查看个人考勤记录 |
| `attendance:qr:generate` | 生成QR签到码 | Self | 使用 QR Code 功能 |
| `leave:create:self` | 提交请假 | Self | 创建请假申请 |
| `leave:view:self` | 查看请假记录 | Self | 查看自己的请假历史和审批状态 |
| `leave:cancel:self` | 撤回请假 | Self | 在审批完成前可撤回 |
| `grade:view:self` | 查看本人成绩 | Self | 查看个人成绩 |
| `timetable:view:self` | 查看课表 | Self | 查看个人课表 |
| `notice:view` | 查看校历/通告 | Global | 查看学校发布的通告 |

### 4.2 Role: Parent (parent)

| 权限标识 | 权限名称 | 范围 | 说明 |
|---------|---------|------|------|
| `profile:view:linked_children` | 查看关联子女档案 | Children | 查看关联的学生档案（只读） |
| `attendance:view:linked_children` | 查看关联子女考勤 | Children | 查看签到考勤记录 |
| `leave:view:linked_children` | 查看子女请假记录 | Children | 查看请假审批状态 |
| `leave:create:linked_children` | 代子女提交请假 | Children | 为低龄子女代操作 |
| `grade:view:linked_children` | 查看子女成绩 | Children | 查看成绩 |
| `payment:operate:linked_children` | 校内缴费 | Children | Parent 专属缴费权限 |
| `notice:view` | 查看校历/通告 | Global | 与 student 共享 |
| `emergency:update:linked_children` | 更新子女紧急联系方式 | Children | 紧急情况下可更新联系方式 |

---

## 5. 功能规格

### 5.1 Function F-PORTAL-001: 个人档案查看与有限自修改

**目的：** 学生和家长可以查看个人/子女档案，学生可有限修改部分字段

#### 输入

| 字段 | 类型 | 必填 | 来源 | 描述 |
|------|------|------|------|------|
| action | Enum | 是 | 用户操作 | `view` / `update` |
| field_name | String | 条件 | 用户输入 | 修改的字段名（仅 update 时必填）|
| field_value | String | 条件 | 用户输入 | 修改后的字段值（仅 update 时必填）|
| target_student_id | UUID | 条件 | 系统/用户 | 目标学生ID（仅家长查看时传递）|

#### 处理流程

```
学生登录 → 访问「个人档案」页面
   ├─ 查看模式：加载完整档案信息，不可编辑字段灰显
   └─ 编辑模式：
       Step 1: 用户修改可编辑字段
       Step 2: 前端验证格式
       Step 3: 提交至后端 → 后端二次验证
       Step 4: 保存变更 → 记录审计日志
       Step 5: 返回更新后的档案
```

#### 允许学生修改的字段（可编辑）

| 字段 | 类型 | 验证规则 |
|------|------|---------|
| phone | String | 香港手机号格式 (8位数字) |
| email | String | 标准邮箱格式 |
| address | Text | 最多 200 字符 |
| emergency_contact | String | 必填，中文姓名 |
| emergency_phone | String | 香港手机号格式 (8位数字) |
| guardian_phone | String | 香港手机号格式 |

#### 锁定不可编辑字段

| 字段 | 原因 |
|------|------|
| student_id (学号) | 入学自动生成，不可修改 |
| name_zh / name_en (姓名) | 身份标识，修改需校务处审核 |
| gender (性别) | 核心身份信息 |
| birth_date (出生日期) | 核心身份信息 |
| class / grade (班级/年级) | 由校务处统一管理 |
| admission_date (入学日期) | 系统记录不可修改 |
| admission_number (入学编号) | 系统唯一编号 |

#### 业务规则

- 学生修改可编辑字段后，系统自动记录变更历史（见审计日志要求）
- 修改即时生效，无需审批
- 家长端为只读视图，不可编辑子女档案字段（`emergency:update` 权限除外）

#### 输出

```json
{
  "profile": {
    "student_id": "2026S10001",
    "name_zh": "陳小明",
    "name_en": "Chan Siu Ming",
    "gender": "M",
    "birth_date": "2010-05-15",
    "class": "S2A",
    "grade": "S2",
    "admission_date": "2020-09-01",
    "admission_number": "ADM-2020-0123",
    "phone": "****4567",
    "email": "c***@school.edu.hk",
    "address": "香港仔田灣大樓A座****",
    "emergency_contact": "陳大文",
    "emergency_phone": "****4568",
    "guardian_phone": "****7890"
  },
  "editable_fields": ["phone", "email", "address", "emergency_contact", "emergency_phone", "guardian_phone"],
  "locked_fields": ["student_id", "name_zh", "name_en", "gender", "birth_date", "class", "grade", "admission_date", "admission_number"],
  "role": "student",
  "last_updated": "2026-07-14T10:00:00+08:00"
}
```

#### 验收标准 (AC)

| # | Given（前置条件） | When（操作） | Then（预期结果） |
|---|----------------|------------|----------------|
| AC-01 | 学生登录门户 | 访问「个人档案」页面 | 显示完整档案信息，学号、姓名、班级等字段为灰色只读状态 |
| AC-02 | 学生「个人档案」页面 | 尝试编辑学号字段 | 编辑框不可操作（disabled），鼠标悬停提示「此字段不可修改」 |
| AC-03 | 学生「个人档案」页面 | 编辑手机号并保存 | 保存成功，档案更新，记录审计日志 |
| AC-04 | 家长登录门户 | 访问「子女档案」页面 | 全部字段为只读，无编辑按钮 |

---

### 5.2 Function F-PORTAL-002: 电子请假

**目的：** 学生/家长在线提交请假申请，查看审批状态与历史记录

#### 输入（请假申请）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_id | UUID | 是 | 请假学生 |
| leave_type | Enum | 是 | sick（病假）/ personal（事假）/ family（家庭假）/ other（其他）|
| start_date | Date | 是 | 请假起始日期 |
| end_date | Date | 是 | 请假结束日期 |
| reason | Text | 是 | 请假原因 |
| attachments | File[] | 可选 | 证明文件（医生证明等）|
| contact_phone | String | 可选 | 请假期间联系方式 |
| submitter_role | Enum | 是 | student / parent（标识提交人角色）|

#### 处理流程

```
学生/家长 → 填写请假信息 → 前端验证 → 提交后端
    ↓
Step 1: 创建请假记录，状态 pending
Step 2: 根据请假天数路由审批流程
    ├─ ≤3天 → 推送给班主任审批
    └─ >3天 → 班主任初审 → pending_principal → 校务主任终审
Step 3: 审批完成后 → 通知提交人
Step 4: 学生/家长可在「请假记录」页面查看历史
```

#### 业务规则

| 规则 | 说明 |
|------|------|
| 请假天数 ≤ 3 天 | 班主任审批，自动通知 |
| 请假天数 > 3 天 | 班主任初审 → 校务主任终审 |
| 审批状态流转 | `pending` → `approved` / `rejected` / `cancelled` |
| 撤回条件 | 状态为 `pending` 时学生/家长可撤回（`cancelled`）|
| 已审批不可撤回 | 已审批的请假不可撤回，需联系校务处 |

#### 学生端操作流程

1. 学生登录门户 → 点击「电子请假」→ 填写请假信息 → 提交
2. 系统展示提交成功提示，请假状态为 `pending`
3. 班主任/校务主任审批后，学生收到系统通知
4. 学生可在「请假记录」页面查看所有历史申请及当前状态

#### 输出

```json
{
  "leave_id": "uuid",
  "student": { "id": "2026S10001", "name": "陳小明", "class": "S2A" },
  "leave_details": {
    "type": "sick",
    "start_date": "2026-09-15",
    "end_date": "2026-09-16",
    "days": 2,
    "reason": "發燒及感冒",
    "attachments_count": 1,
    "contact_phone": "91234567"
  },
  "status": "pending",
  "status_history": [
    {
      "status": "pending",
      "timestamp": "2026-09-15T08:00:00+08:00",
      "actor_role": "student",
      "comment": "提交请假申请"
    }
  ],
  "submitter_role": "student",
  "created_at": "2026-09-15T08:00:00+08:00"
}
```

#### 验收标准 (AC)

| # | Given（前置条件） | When（操作） | Then（预期结果） |
|---|----------------|------------|----------------|
| AC-01 | 学生填写完整请假信息（病假 2 天）| 点击提交 | 系统创建 leave 记录，状态 pending，发送通知给班主任 |
| AC-02 | 班主任批准请假 | 审批通过 | 系统更新状态为 approved，通知学生/家长 |
| AC-03 | 学生提交的病假单仍在 pending | 学生点击撤回 | 状态变为 cancelled，通知班主任 |
| AC-04 | 学生提交的病假单已被 approved | 学生尝试撤回 | 按钮不可用，提示「已审批不可撤回，请联系校务处」| 
| AC-05 | 请假超过 3 天（5 天事假）| 班主任初审通过 | 状态变为 pending_principal，触发校务主任二审 |
| AC-06 | 家长代子女提交请假 | 家长操作提交 | 系统记录 submitter_role=parent，与 student 提交的同样处理流程 |

---

### 5.3 Function F-PORTAL-003: 数据隔离规则

**目的：** 确保家长只能查看自己关联子女的数据，不能越权访问其他学生信息

#### 隔离实现机制

| 机制层 | 说明 |
|--------|------|
| 数据层 | 基于 `parent_student_links` 表建立家长-学生关联 |
| 服务层 | 所有查询必须 JOIN 该关联表进行权限过滤 |
| API 层 | Repository/Service 层自动追加 `WHERE student_id IN (parent_student_links.children_ids)` |
| 安全策略 | 后端二次验证为强制防线，不依赖前端路由隐藏 |

#### 后端查询示例

```sql
-- 家长查询子女考勤记录
SELECT a.* FROM attendance a
JOIN parent_student_links psl 
  ON a.student_id = psl.student_id 
  AND psl.parent_user_id = :current_user_id
WHERE a.created_at >= :start_date AND a.created_at <= :end_date;

-- 家长查询子女成绩
SELECT g.* FROM grades g
JOIN parent_student_links psl 
  ON g.student_id = psl.student_id 
  AND psl.parent_user_id = :current_user_id
WHERE g.academic_year = :year;
```

#### 验收标准 (AC)

| # | Given（前置条件） | When（操作） | Then（预期结果） |
|---|----------------|------------|----------------|
| AC-01 | 家长 A 关联学生 X、Y | 登录门户后查看「考勤记录」| 仅显示学生 X 和 Y 的记录，无其他学生信息 |
| AC-02 | 家长尝试直接调用 API 查询学生 Z 的考勤 | 发送 GET /api/attendance?student_id=Z-ID | 返回 403 Forbidden，日志记录越权尝试 |
| AC-03 | 前端通过 URL 参数尝试访问非关联学生页面 | 发起请求 | 后端拦截返回 403，前端提示「无权访问」|

---

## 6. 数据安全需求

### 6.1 敏感字段掩码规则

| 字段 | 掩码规则 | 示例（原始→掩码） |
|------|---------|----------------|
| 手机号 | 显示后 4 位，前 4 位掩码 | `91234567` → `****4567` |
| 邮箱 | 显示域名 + 用户名首字符 | `wong.siu.ming@example.com` → `w***@example.com` |
| 地址 | 显示到街道，门牌号掩码 | `香港仔田灣大樓A座12樓` → `香港仔田灣大樓A座****` |
| 紧急联系人电话 | 显示后 4 位 | `91234568` → `****4568` |
| 学生身份证号 | 显示前 6 位+后 2 位 | `A123456(7)` → `A1234***(7)` |

### 6.2 掩码规则适用范围

| 角色 | 掩码策略 |
|------|---------|
| Student 查看本人档案 | 基本掩码（地址、电话部分掩码）|
| Parent 查看子女档案 | 完整掩码（所有敏感字段掩码显示）|
| 校务处/教师 | 完整显示（内部操作权限）|
| 系统日志中的敏感字段 | 脱敏后再记录 |

### 6.3 审计日志

#### 所有学生/家长操作必须记录

| 审计事件 | 记录内容 | 保存期限 |
|---------|---------|---------|
| 学生修改联系方式 | 修改人、修改时间、旧值→新值（脱敏） | ≥ 2 年 |
| 学生/家长提交请假 | 提交人、学生、请假类型、时间 | ≥ 3 年 |
| 请假审批操作 | 审批人、审批结果、审批意见、时间 | ≥ 3 年 |
| 家长查看子女敏感数据 | 查看人、查看的学生ID、查看时间 | ≥ 1 年 |
| 越权访问尝试 | 尝试者、目标资源、时间、来源 IP | ≥ 1 年 |
| QR 码签到失败（安全相关） | 学生ID、失败原因、时间 | ≥ 6 个月 |

#### 审计日志格式规范

```json
{
  "audit_id": "uuid",
  "event_type": "PROFILE_UPDATE",
  "actor_id": "uuid",
  "actor_role": "student",
  "target_id": "uuid",
  "target_type": "students",
  "action": "UPDATE",
  "changes": [
    {"field": "phone", "old": "****4567", "new": "****7890"},
    {"field": "address", "old": "香港仔田灣****", "new": "灣仔軒尼詩道****"}
  ],
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-07-14T10:00:00+08:00",
  "result": "SUCCESS"
}
```

---

## 7. 门户访问与认证

| 需求 | 说明 |
|------|------|
| 登录方式 | 学号/家长账号 + 密码（支持飞书 SSO 可选集成） |
| 首次登录 | 强制修改初始密码 |
| 密码策略 | 最少 8 位，含大小写字母 + 数字，90 天过期 |
| Session 管理 | JWT Token，有效期 24 小时，支持多设备登录 |
| 退出机制 | 主动退出后 Token 立即失效，同一账号可在「已登录设备」管理页面下线其他设备 |
| 家长多重关联 | 一个家长账号可关联多个子女（同一家庭的多名孩子）|

---

## 8. 全局业务规则汇总

| 规则编号 | 规则内容 | 来源 |
|---------|---------|------|
| RULE-001 | 学生个人档案修改即时生效，无需审批 | F-PORTAL-001 |
| RULE-002 | 家长端为只读视图，不可编辑子女档案（紧急联系方式更新除外）| F-PORTAL-001 |
| RULE-003 | 请假 ≤3 天仅班主任审批；>3 天需班主任初审 + 校务主任终审 | F-PORTAL-002 |
| RULE-004 | 请假状态为 pending 时可撤回；已审批不可撤回 | F-PORTAL-002 |
| RULE-005 | 学生数据查询必须 JOIN parent_student_links 表进行权限过滤 | F-PORTAL-003 |
| RULE-006 | 越权访问返回 403 Forbidden，所有尝试记录审计日志 | F-PORTAL-003 |
| RULE-007 | 敏感字段按角色分层掩码展示，不可绕过 | §6.1 |
| RULE-008 | 所有 Portal 敏感操作必须记录审计日志 | §6.3 |

---

*— 文档结束 —*
