# 数据库架构设计文档
## Smart School Admin AI System — Database Schema Design
## v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查

---

> ⚠️ **重要说明**: 本文档 v1.5.0 起基于实际数据库架构审查 (通过 `information_schema.columns` 和 `pg_enum` 直接查询)，不再基于设计假设。所有表结构、列名、枚举值均与生产环境 1:1 对应。

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **规范化** | 至少 3NF，消除冗余更新异常 |
| **审计字段** | 所有表含 `created_at` / `updated_at` |
| **软删除** | 关键表含 `deleted_at`，使用 NULL 而非物理删除 |
| **UUID 主键** | 全局唯一、可安全暴露 |
| **枚举类型** | PostgreSQL ENUM 确保取值一致性 |
| **JSONB** | 灵活字段存扩展属性，避免 schema 膨胀 |

## 2. 命名规范

| 对象 | 规则 | 示例 |
|------|------|------|
| 表 | snake_case，复数 | users, attendances |
| 主键 | `id` (UUID) | id |
| 外键 | `{entity}_id` | student_id, user_id |
| 唯一约束 | `{table}_{column}_key` | users_username_key |
| 时间戳 | `_at` | created_at, updated_at |
| 枚举 | `snake_case` | user_role_new, attendance_status_enum |

## 3. 表清单 (22 Tables)

| 表名 | 说明 | 关键枚举 |
|------|------|---------|
| **schools** | 学校 | - |
| **users** | 用户主表 | user_role_new, user_status_new, subsidy_eligibility_enum |
| **user_roles** | 角色定义 | - |
| **user_role_assignments** | 角色分配 | - |
| **permissions** | 权限定义 | - |
| **sessions** | 会话 | - |
| **otp_sessions** | OTP会话 | otp_type, otp_session_status |
| **audit_logs** | 审计日志 | audit_action |
| **classes** | 班级 | - |
| **attendances** | 出勤记录 | attendances_status_enum, attendances_attendance_type_enum |
| **leaves** | 请假申请 | leaves_leave_type_enum, leaves_status_enum |
| **fees** | 费用定义 | - |
| **fee_records** | 缴费记录 | - |
| **scholarship_applications** | 奖学金申请 | - |
| **inquiries** | 家长查询 | inquiry_status_enum, inquiry_priority_enum |
| **inquiry_replies** | 查询回复 | - |
| **parent_student_links** | 家长学生关联 | - |
| **lunch_orders** | 午膳订单 | - |

---

## 4. 详细表结构

### 4.1 核心表 (Core)

#### schools — 学校

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 学校唯一标识 |
| school_code | VARCHAR(20) | UNIQUE, NOT NULL | 学校代码 |
| name_zh | VARCHAR(200) | NOT NULL | 中文名称 |
| name_en | VARCHAR(200) | | 英文名称 |
| address | TEXT | | 地址 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引:** PRIMARY KEY (id), UNIQUE (school_code)

---

#### user_roles — 角色定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | 角色名称 |
| description | TEXT | | 说明 |
| permissions | JSONB | DEFAULT '[]' | 权限数组 |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### permissions — 权限定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| module | VARCHAR(50) | NOT NULL | 所属模块 |
| code | VARCHAR(100) | NOT NULL | 权限代码，如 F-ATT-001.read |
| name_zh | VARCHAR(100) | NOT NULL | 中文名称 |
| name_en | VARCHAR(100) | | 英文名称 |
| description | TEXT | | 说明 |
| resource_type | VARCHAR(50) | | 资源类型 |
| action | VARCHAR(20) | | create/read/update/delete/approve |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### user_role_assignments — 角色分配

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK→users, NOT NULL | 用户 |
| role_id | UUID | FK→user_roles | 角色 |
| school_id | UUID | | 学校 |
| assigned_by | UUID | | 分配人 |
| assigned_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.2 用户管理 (Users)

#### users — 用户主表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| username | VARCHAR(100) | UNIQUE, NOT NULL | 用户名/登录账号 |
| password | VARCHAR(255) | NOT NULL | bcrypt哈希 |
| email | VARCHAR(255) | UNIQUE | 邮箱 |
| phone | VARCHAR(20) | | 电话 |
| name | VARCHAR(100) | | 姓名 |
| role | user_role_new | DEFAULT 'student' | 角色 |
| status | user_status_new | DEFAULT 'active' | 状态 |
| hk_id | VARCHAR(20) | UNIQUE | 香港身份证 |
| whatsapp | VARCHAR(20) | | WhatsApp |
| class_name | VARCHAR(50) | | 所属班级（教师/学生）|
| otp_secret | VARCHAR(255) | | OTP密钥 |
| otp_enabled | BOOLEAN | DEFAULT false | 是否启用OTP |
| failed_attempts | INTEGER | DEFAULT 0 | 失败尝试次数 |
| lockout_until | TIMESTAMPTZ | | 锁定截止时间 |
| password_history | ARRAY | | 密码历史 |
| must_change_password | BOOLEAN | DEFAULT false | 必须修改密码 |
| password_expires_at | TIMESTAMPTZ | | 密码过期时间 |
| last_login_at | TIMESTAMPTZ | | 最后登录时间 |
| last_login_ip | VARCHAR(50) | | 最后登录IP |
| subsidy_eligibility | subsidy_eligibility_enum | DEFAULT 'none' | 资助资格 |
| subsidy_start_date | DATE | | 资助开始日期 |
| subsidy_end_date | DATE | | 资助结束日期 |
| subsidy_certificate_no | VARCHAR(50) | | 资助证明编号 |
| related_student_id | UUID | | 关联学生ID（家长）|
| student_id | UUID | | 学生ID |
| enrollment_date | DATE | | 入学日期 |
| graduation_date | DATE | | 毕业日期 |
| previous_school | VARCHAR(200) | | 原学校 |
| home_address | TEXT | | 家庭地址 |
| date_of_birth | DATE | | 出生日期 |
| gender | VARCHAR(10) | | 性别 |
| emergency_contact | VARCHAR(100) | | 紧急联系人 |
| emergency_phone | VARCHAR(20) | | 紧急联系电话 |
| is_first_login | BOOLEAN | DEFAULT true | 首次登录 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| created_by | UUID | | 创建人 |
| updated_by | UUID | | 更新人 |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**索引:** PRIMARY KEY (id), UNIQUE (username), UNIQUE (email), UNIQUE (hk_id)
**外键:** (student_id)→users(id), (related_student_id)→users(id)

**枚举值 — user_role_new:**
```
system_admin   — 系统管理员
school_director — 校务主任
school_staff   — 校务人员
teacher        — 教师
parent         — 家长
student        — 学生
```

**枚举值 — user_status_new:**
```
active    — 启用
inactive  — 未激活
disabled  — 已禁用
```

**枚举值 — subsidy_eligibility_enum:**
```
full_subsidy  — 全额资助
half_subsidy  — 半额资助
none         — 无资助
pending      — 待审核
```

---

#### sessions — 会话

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK→users, NOT NULL | 用户 |
| token | TEXT | | JWT token |
| ip | VARCHAR(50) | | IP地址 |
| user_agent | TEXT | | User Agent |
| expires_at | TIMESTAMPTZ | | 过期时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### otp_sessions — OTP会话

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK→users | 用户 |
| otp_code | VARCHAR(10) | | OTP验证码 |
| otp_type | otp_type | | OTP类型 |
| status | otp_session_status | DEFAULT 'active' | 状态 |
| expires_at | TIMESTAMPTZ | NOT NULL | 过期时间 |
| failed_attempts | INTEGER | DEFAULT 0 | 失败次数 |
| operation_type | VARCHAR(50) | NOT NULL | 操作类型 |
| operation_details | JSONB | | 操作详情 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举值 — otp_type:**
```
sms                  — 短信
email                — 邮箱
google_authenticator — Google验证器
ukey                — U盾
```

**枚举值 — otp_session_status:**
```
active  — 有效
expired — 已过期
used    — 已使用
```

---

### 4.3 审计 (Audit)

#### audit_logs — 审计日志

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| operatorid | UUID | | 操作者ID |
| action | audit_action | NOT NULL | 操作类型 |
| description | TEXT | | 描述 |
| ip | VARCHAR(50) | | IP地址 |
| user_agent | TEXT | | User Agent |
| metadata | JSONB | DEFAULT '{}' | 附加数据 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举值 — audit_action (部分):**
```
user_create, user_update, user_delete, user_restore, user_status_change,
user_password_reset, permission_change, login, logout,
attendance_check_in, attendance_check_out, leave_apply, leave_approve,
leave_reject, fee_create, fee_update, inquiry_create, inquiry_reply
```

---

### 4.4 班级管理 (Classes)

#### classes — 班级

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | 班级名称 |
| academic_year | VARCHAR(9) | | 学年，如 2025-2026 |
| grade_level | VARCHAR(20) | | 年级 |
| homeroom_teacher_id | UUID | FK→users | 班主任 |
| assistant_teacher_id | UUID | FK→users | 副班主任 |
| max_students | INTEGER | DEFAULT 40 | 最大人数 |
| current_student_count | INTEGER | DEFAULT 0 | 当前人数 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| school_id | UUID | | 学校 |
| department_id | UUID | | 部门 |
| room | VARCHAR(50) | | 教室 |
| year | VARCHAR(9) | | 学年 |
| description | TEXT | | 描述 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**外键:** (homeroom_teacher_id)→users(id), (assistant_teacher_id)→users(id)

---

### 4.5 出勤管理 (Attendance)

#### attendances — 出勤记录

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| student_id | UUID | FK→users | 学生 |
| teacher_id | UUID | FK→users | 记录教师 |
| class_id | VARCHAR(100) | | 班级 |
| attendance_date | DATE | NOT NULL | 出勤日期 |
| check_in_time | TIME | | 签到时间 |
| check_out_time | TIME | | 签退时间 |
| status | attendances_status_enum | NOT NULL | 出勤状态 |
| attendance_type | attendances_attendance_type_enum | NOT NULL | 出勤类型 |
| remark | TEXT | | 备注 |
| approver_id | UUID | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | 审批时间 |
| reminder_sent | BOOLEAN | DEFAULT false | 提醒已发送 |
| reminder_sent_at | TIMESTAMPTZ | | 提醒时间 |
| created_by | VARCHAR(100) | NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_by | VARCHAR(100) | | 更新人 |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |
| sync_source | VARCHAR(50) | DEFAULT 'MANUAL' | 同步来源 |
| sync_status | VARCHAR(50) | DEFAULT 'SUCCESS' | 同步状态 |
| device_id | VARCHAR(100) | | 设备ID |
| device_name | VARCHAR(200) | | 设备名称 |
| batch_id | UUID | | 批次ID |
| can_revoke_until | TIMESTAMPTZ | | 可撤销截止时间 |

**索引:** PRIMARY KEY (id)
**外键:** (student_id)→users(id), (teacher_id)→users(id), (approver_id)→users(id)

**枚举值 — attendances_status_enum:**
```
present      — 出勤
absent       — 缺勤
late         — 迟到
leave_early  — 早退
sick_leave   — 病假
personal_leave — 事假
official_leave — 公假
```

**枚举值 — attendances_attendance_type_enum:**
```
check_in  — 签到
check_out — 签退
manual    — 手动
```

---

### 4.6 请假管理 (Leave)

#### leaves — 请假申请

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| applicant_id | UUID | FK→users, NOT NULL | 申请人 |
| leave_type | leaves_leave_type_enum | NOT NULL | 请假类型 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | NOT NULL | 结束日期 |
| start_time | TIME | | 开始时间 |
| end_time | TIME | | 结束时间 |
| total_days | INTEGER | NOT NULL | 总天数 |
| total_hours | INTEGER | | 总小时数 |
| reason | TEXT | NOT NULL | 原因 |
| status | leaves_status_enum | DEFAULT 'pending' | 状态 |
| substitute_teacher_id | UUID | FK→users | 代理教师 |
| substitute_teacher_class_hours | INTEGER | | 代理课时数 |
| approver_id | UUID | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | 审批时间 |
| approval_comment | TEXT | | 审批意见 |
| attachment_url | VARCHAR(255) | | 附件URL |
| school_id | UUID | | 学校 |
| student_id | UUID | | 学生 |
| class_id | UUID | | 班级 |
| ocr_status | VARCHAR(30) | | OCR状态 |
| medical_cert_required | BOOLEAN | DEFAULT false | 需医疗证明 |
| parent_submitted_at | TIMESTAMPTZ | | 家长提交时间 |
| created_by | UUID | | 创建人 |
| updated_by | UUID | | 更新人 |
| deleted_at | TIMESTAMPTZ | | 软删除 |
| director_comment | TEXT | | 主任意见 |
| admin_recorded_by | UUID | | 备案人 |
| admin_recorded_at | TIMESTAMPTZ | | 备案时间 |
| ai_review_flagged | BOOLEAN | DEFAULT false | AI审核标记 |
| ai_review_note | TEXT | | AI审核说明 |
| ai_verify_result | VARCHAR(30) | | AI核验结果 |
| certificate_verify_result | VARCHAR(30) | | 证明文件核验结果 |
| certificate_url | TEXT | | 证明文件URL |
| verified_at | TIMESTAMPTZ | | 核验时间 |
| follow_up_date | DATE | | 跟进日期 |
| follow_up_content | TEXT | | 跟进内容 |
| checked_in_at | TIMESTAMPTZ | | 销假时间 |
| checked_in_by | UUID | | 销假操作人 |
| parent_notified | BOOLEAN | DEFAULT false | 家长已通知 |
| class_teacher_notified | BOOLEAN | DEFAULT false | 班主任已通知 |
| bus_admin_notified | BOOLEAN | DEFAULT false | 校车管理员已通知 |
| current_approval_level | VARCHAR(30) | | 当前审批级别 |
| application_no | VARCHAR(20) | UNIQUE | 申请编号 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引:** PRIMARY KEY (id), UNIQUE (application_no)
**外键:** (applicant_id)→users(id), (student_id)→users(id), (approver_id)→users(id), (substitute_teacher_id)→users(id)

**枚举值 — leaves_leave_type_enum:**
```
sick_leave     — 病假
personal_leave — 事假
official_leave — 公假
annual_leave   — 年假
other          — 其他
```

**枚举值 — leaves_status_enum:**
```
pending    — 待审批
approved   — 已批准
rejected   — 已拒绝
cancelled  — 已取消
```

---

### 4.7 财务管理 (Finance)

#### fees — 费用定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| fee_name | VARCHAR(200) | NOT NULL | 费用名称 |
| description | TEXT | | 说明 |
| amount | NUMERIC | NOT NULL | 金额 |
| due_date | DATE | | 截止日期 |
| academic_year | VARCHAR(9) | | 学年 |
| category | VARCHAR(50) | | 类别 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### fee_records — 缴费记录

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| student_id | UUID | FK→users, NOT NULL | 学生 |
| fee_id | UUID | FK→fees, NOT NULL | 费用项目 |
| amount | NUMERIC | NOT NULL | 应缴金额 |
| paid_amount | NUMERIC | DEFAULT 0 | 已缴金额 |
| payment_date | DATE | | 缴费日期 |
| payment_method | VARCHAR(50) | | 缴费方式 |
| status | VARCHAR(20) | DEFAULT 'unpaid' | 状态 |
| academic_year | VARCHAR(9) | | 学年 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### scholarship_applications — 奖学金申请

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| student_id | UUID | FK→users, NOT NULL | 学生 |
| scholarship_name | VARCHAR(200) | NOT NULL | 奖学金名称 |
| application_date | DATE | NOT NULL | 申请日期 |
| amount | NUMERIC | | 金额 |
| status | VARCHAR(20) | DEFAULT 'pending' | 状态 |
| academic_year | VARCHAR(9) | | 学年 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.8 家长查询 (Inquiries)

#### inquiries — 家长查询

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| inquiry_type | VARCHAR(50) | | 查询类型 |
| subject | VARCHAR(255) | | 主题 |
| content | TEXT | NOT NULL | 内容 |
| parent_id | UUID | FK→users | 家长 |
| student_id | UUID | | 学生 |
| status | inquiry_status_enum | DEFAULT 'pending' | 状态 |
| priority | inquiry_priority_enum | DEFAULT 'medium' | 优先级 |
| assigned_to | UUID | | 分配给 |
| school_id | UUID | | 学校 |
| is_ai_processed | BOOLEAN | DEFAULT false | AI已处理 |
| ai_intent | VARCHAR(100) | | AI意图 |
| is_escalated | BOOLEAN | DEFAULT false | 是否升级 |
| escalation_reason | TEXT | | 升级原因 |
| resolved_at | TIMESTAMPTZ | | 解决时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**枚举值 — inquiry_status_enum:**
```
pending     — 待处理
in_progress — 处理中
resolved    — 已解决
escalated   — 已升级
closed      — 已关闭
```

**枚举值 — inquiry_priority_enum:**
```
low    — 低
medium — 中
high   — 高
urgent — 紧急
```

---

#### inquiry_replies — 查询回复

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| inquiry_id | UUID | FK→inquiries, NOT NULL | 查询 |
| content | TEXT | NOT NULL | 回复内容 |
| replier_id | UUID | | 回复人 |
| is_official_reply | BOOLEAN | DEFAULT false | 是否官方回复 |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.9 家长学生关联 (Parent-Student Links)

#### parent_student_links — 家长学生关联

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| parent_id | UUID | FK→users, NOT NULL | 家长 |
| student_id | UUID | FK→users, NOT NULL | 学生 |
| relationship | VARCHAR(50) | | 关系 |
| is_primary | BOOLEAN | DEFAULT false | 是否主要联系人 |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.10 午膳管理 (Lunch)

#### lunch_orders — 午膳订单

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| student_id | UUID | FK→users, NOT NULL | 学生 |
| class_id | VARCHAR(100) | | 班级 |
| order_date | DATE | NOT NULL | 订餐日期 |
| meal_type | VARCHAR(20) | DEFAULT 'regular' | 餐食类型 |
| menu_item_id | UUID | | 菜单项 |
| notes | TEXT | | 备注 |
| status | VARCHAR(20) | DEFAULT 'confirmed' | 状态 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

## 5. 索引汇总

| 表名 | 索引类型 | 字段 | 说明 |
|------|----------|------|------|
| users | PRIMARY KEY | id | 主键 |
| users | UNIQUE | username | 用户名唯一 |
| users | UNIQUE | email | 邮箱唯一 |
| users | UNIQUE | hk_id | 身份证唯一 |
| leaves | PRIMARY KEY | id | 主键 |
| leaves | UNIQUE | application_no | 申请编号唯一 |
| attendances | PRIMARY KEY | id | 主键 |
| classes | PRIMARY KEY | id | 主键 |
| schools | PRIMARY KEY | id | 主键 |
| schools | UNIQUE | school_code | 学校代码唯一 |
| fees | PRIMARY KEY | id | 主键 |
| fee_records | PRIMARY KEY | id | 主键 |
| inquiries | PRIMARY KEY | id | 主键 |
| inquiry_replies | PRIMARY KEY | id | 主键 |
| audit_logs | PRIMARY KEY | id | 主键 |
| sessions | PRIMARY KEY | id | 主键 |
| otp_sessions | PRIMARY KEY | id | 主键 |
| user_roles | PRIMARY KEY | id | 主键 |
| user_role_assignments | PRIMARY KEY | id | 主键 |
| permissions | PRIMARY KEY | id | 主键 |
| scholarship_applications | PRIMARY KEY | id | 主键 |
| parent_student_links | PRIMARY KEY | id | 主键 |
| lunch_orders | PRIMARY KEY | id | 主键 |

---

## 6. 外键关系汇总

```
users (id)
  ← attendances.student_id
  ← attendances.teacher_id
  ← attendances.approver_id
  ← classes.homeroom_teacher_id
  ← classes.assistant_teacher_id
  ← leaves.applicant_id
  ← leaves.student_id
  ← leaves.approver_id
  ← leaves.substitute_teacher_id
  ← sessions.user_id
  ← otp_sessions.user_id
  ← fee_records.student_id
  ← scholarship_applications.student_id
  ← inquiries.parent_id
  ← parent_student_links.parent_id
  ← parent_student_links.student_id

users.id (作为related_student_id)
  ← users.related_student_id (家长关联学生)

fees (id)
  ← fee_records.fee_id

inquiries (id)
  ← inquiry_replies.inquiry_id
```

---

## 7. 枚举类型汇总

### 7.1 用户相关

| 枚举名 | 值 |
|--------|-----|
| user_role_new | system_admin, school_director, school_staff, teacher, parent, student |
| user_status_new | active, inactive, disabled |
| subsidy_eligibility_enum | full_subsidy, half_subsidy, none, pending |

### 7.2 出勤相关

| 枚举名 | 值 |
|--------|-----|
| attendances_status_enum | present, absent, late, leave_early, sick_leave, personal_leave, official_leave |
| attendances_attendance_type_enum | check_in, check_out, manual |

### 7.3 请假相关

| 枚举名 | 值 |
|--------|-----|
| leaves_leave_type_enum | sick_leave, personal_leave, official_leave, annual_leave, other |
| leaves_status_enum | pending, approved, rejected, cancelled |

### 7.4 查询相关

| 枚举名 | 值 |
|--------|-----|
| inquiry_status_enum | pending, in_progress, resolved, escalated, closed |
| inquiry_priority_enum | low, medium, high, urgent |

### 7.5 OTP相关

| 枚举名 | 值 |
|--------|-----|
| otp_type | sms, email, google_authenticator, ukey |
| otp_session_status | active, expired, used |

### 7.6 审计相关

| 枚举名 | 值 |
|--------|-----|
| audit_action | user_create, user_update, user_delete, user_restore, user_status_change, user_password_reset, permission_change, login, logout, attendance_check_in, attendance_check_out, leave_apply, leave_approve, leave_reject, fee_create, fee_update, inquiry_create, inquiry_reply |

---

## 8. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查重建；更新 leaves 表字段名 (ai_verify_result→ai_verify_result, certificateUrl→certificate_url 等)；添加 AI 核验相关字段文档 |
| v1.5.0 | 2026-06-20 | 添加午膳管理、奖学金、家长查询队列模块 |
| v1.4.0 | 2026-06-03 | 初始版本（设计文档） |
