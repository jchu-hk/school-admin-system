# 数据库架构设计文档
## Smart School Admin AI System — Database Schema Design
## v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查
## +收生模块(Issue #358) | 2026-08-13 | 新增模块19 注册与收生管理（见文末 §19）
## +财务与学年结算模块(Issue #359) | 2026-08-13 | 新增模块20 财务与学年结算（见文末 §20）
## +资产与供应商管理模块(Issue #360) | 2026-08-13 | 新增模块21 资产与供应商管理（见文末 §21）
## +校车点名与查询模板模块(Issue #361) | 2026-08-13 | 新增模块22 校车点名与查询模板管理（见文末 §22）
## +AI自动化模块(Issue #362) | 2026-08-13 | 新增模块23 AI自动化管理（FAQ智能匹配/周期任务/智能提醒，见文末 §23）
## +增强功能模块(Issue #364) | 2026-08-13 | 新增模块25 增强功能（OCR识别/实时翻译/Locale本地化/多渠道通知模板/自定义报表+定时推送，见文末 §25）

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
| **buses** | 校车车辆主档 (F-BUS-002) | bus_status_enum |
| **bus_routes** | 校车线路 (F-BUS-002) | bus_route_status_enum |
| **bus_shifts** | 校车班次/行程 (F-BUS-002) | bus_direction_enum, bus_shift_status_enum |
| **bus_students** | 校车乘搭分配 (F-BUS-002) | bus_student_status_enum |
| **bus_checkins** | 校车点名记录 (F-BUS-002) | bus_check_type_enum, bus_loc_source_enum, bus_checkin_status_enum |
| **quick_reply_templates** | 快速回复模板 (F-INQ-002) | quick_reply_category_enum, quick_reply_status_enum |

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
leave_reject, leave_cancel, fee_create, fee_update, inquiry_create, inquiry_reply
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
| audit_action | user_create, user_update, user_delete, user_restore, user_status_change, user_password_reset, permission_change, login, logout, attendance_check_in, attendance_check_out, leave_apply, leave_approve, leave_reject, leave_cancel, fee_create, fee_update, inquiry_create, inquiry_reply |

---

## 8. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| +电子请假 enum 修复(Issue #262) | 2026-08-18 | 为 audit_logs.action 枚举补全 leave_apply/leave_approve/leave_reject/leave_cancel（幂等迁移 1787200000000）；规格同步 §4.3 / §7.6 |
| +AI自动化模块(Issue #362) | 2026-08-13 | 新增模块23 AI自动化管理：faq_knowledge_base、faq_match_logs、scheduled_tasks、scheduled_task_executions、reminder_rules、reminder_records 六张表；扩展 audit_action 枚举 |
| +校车点名与查询模板模块(Issue #361) | 2026-08-13 | 新增模块22 校车点名与查询模板管理：buses、bus_routes、bus_shifts、bus_students、bus_checkins、quick_reply_templates 六张表；扩展 audit_action 枚举 |
| v1.6.0 | 2026-06-28 | 新增 DSE 放榜成绩追踪模块：dse_releases、dse_results、dse_reviews、dse_offer_tracking 四张表；支持 HKEAA 数据对接、成绩覆核申请、JUPAS 追踪、升学去向统计分析 |
| v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查重建；更新 leaves 表字段名 (ai_verify_result→ai_verify_result, certificateUrl→certificate_url 等)；添加 AI 核验相关字段文档 |
| v1.5.0 | 2026-06-20 | 添加午膳管理、奖学金、家长查询队列模块 |
| v1.4.0 | 2026-06-03 | 初始版本（设计文档） |

---

## 表: dse_releases — DSE放榜记录

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 放榜记录ID |
| academic_year | VARCHAR(20) | NOT NULL | 学年，如 2025-2026 |
| release_date | DATE | NOT NULL | DSE放榜日期 |
| release_year | INT | NOT NULL | 放榜年份，如 2026 |
| release_status | ENUM(pending,importing,imported,reviewed,published) | DEFAULT pending | 放榜状态 |
| import_deadline | DATE | NULL | HKEAA数据导入截止日期 |
| review_deadline | DATE | NULL | 成绩覆核申请截止日期 |
| remark | TEXT | NULL | 备注 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**: (academic_year), (release_year), (release_status)

---

## 表: dse_results — DSE考试成绩

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 成绩记录ID |
| release_id | UUID | FK → dse_releases | 关联放榜记录 |
| student_id | UUID | FK → users | 学生ID |
| student_name | VARCHAR(100) | NOT NULL | 学生姓名 |
| class_name | VARCHAR(20) | NULL | 班级 |
| hkeaa_candidate_no | VARCHAR(30) | NULL | HKEAA考生编号 |
| chinese_level | VARCHAR(10) | NULL | 中國語文等级 |
| english_level | VARCHAR(10) | NULL | 英國語文等级 |
| math_compulsory_level | VARCHAR(10) | NULL | 數學必修等级 |
| math_extended_level | VARCHAR(10) | NULL | 數學延伸等级 |
| liberal_studies_level | VARCHAR(10) | NULL | 通識等级 |
| elective_1_code | VARCHAR(50) | NULL | 选修科目1代码 |
| elective_1_name | VARCHAR(100) | NULL | 选修科目1名称 |
| elective_1_level | VARCHAR(10) | NULL | 选修科目1等级 |
| elective_2_code | VARCHAR(50) | NULL | 选修科目2代码 |
| elective_2_name | VARCHAR(100) | NULL | 选修科目2名称 |
| elective_2_level | VARCHAR(10) | NULL | 选修科目2等级 |
| elective_3_code | VARCHAR(50) | NULL | 选修科目3代码 |
| elective_3_name | VARCHAR(100) | NULL | 选修科目3名称 |
| elective_3_level | VARCHAR(10) | NULL | 选修科目3等级 |
| best_five_total | INT | NULL | 最佳5科总分（统计用） |
| raw_data | JSONB | NULL | HKEAA原始数据备份 |
| result_status | ENUM | DEFAULT pending | 成绩状态 |
| published_to_parent | BOOLEAN | DEFAULT false | 是否已向家长公布 |
| remark | TEXT | NULL | 备注 |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**索引**: (release_id), (student_id), (class_name), (result_status), UNIQUE(release_id, student_id)

---

## 表: dse_reviews — DSE成绩覆核申请

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 覆核申请ID |
| dse_result_id | UUID | FK → dse_results | 关联DSE成绩 |
| applicant_id | UUID | FK → users | 申请人 |
| review_type | ENUM(mark_recheck, scrutiny) | NOT NULL | 覆核类型 |
| subject_name | VARCHAR(100) | NOT NULL | 申请科目 |
| reason | TEXT | NOT NULL | 申请理由 |
| status | ENUM | DEFAULT pending | 覆核状态 |
| hkeaa_fee | DECIMAL(10,2) | NULL | HKEAA覆核费用 |
| hkeaa_new_level | VARCHAR(10) | NULL | HKEAA更正后等级 |
| hkeaa_result_remark | TEXT | NULL | HKEAA结果说明 |
| approver_id | UUID | NULL | 审批人 |
| approval_remark | TEXT | NULL | 审批备注 |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**索引**: (dse_result_id), (status), (review_type)

---

## 表: dse_offer_tracking — 升学去向追踪

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 记录ID |
| dse_result_id | UUID | FK → dse_results | 关联DSE成绩 |
| student_id | UUID | FK → users | 学生ID |
| student_name_anonymized | VARCHAR(50) | NOT NULL | 匿名姓名（如：陈同学）|
| class_name | VARCHAR(20) | NULL | 班级 |
| jupas_status | ENUM | DEFAULT not_applied | JUPAS申请状态 |
| jupas_application_no | VARCHAR(30) | NULL | JUPAS申请编号 |
| institution_anonymized | VARCHAR(100) | NULL | 就读大学（匿名）|
| program_anonymized | VARCHAR(200) | NULL | 就读课程（匿名）|
| enrollment_year | INT | NULL | 入学年份 |
| offer_date | DATE | NULL | Offer确认日期 |
| remark | TEXT | NULL | 备注 |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**索引**: (dse_result_id), (jupas_status), UNIQUE(dse_result_id)

---

## 模块 14: 教师招聘管理模块 (Module 14 - Recruitment Management)

## 表: recruitment_positions — 招聘职位

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 职位ID |
| title | VARCHAR(100) | NOT NULL | 职位名称 |
| subject | VARCHAR(50) | NOT NULL | 教授学科 |
| employment_type | ENUM | NOT NULL | 雇佣类型 (FULL_TIME/PART_TIME/CONTRACT) |
| salary_min | DECIMAL(10,2) | NOT NULL | 最低薪资 |
| salary_max | DECIMAL(10,2) | NOT NULL | 最高薪资 |
| salary_currency | VARCHAR(10) | DEFAULT 'HKD' | 薪资货币 |
| location | VARCHAR(200) | NOT NULL | 工作地点 |
| requirements | JSONB | NOT NULL | 任职要求列表 (数组) |
| responsibilities | JSONB | NOT NULL | 工作职责列表 (数组) |
| benefits | JSONB | | 福利待遇列表 (数组) |
| application_deadline | DATE | NOT NULL | 申请截止日期 |
| status | ENUM | NOT NULL, DEFAULT 'DRAFT' | 职位状态 (DRAFT/PUBLISHED/PAUSED/CLOSED) |
| published_at | TIMESTAMPTZ | | 发布时间 |
| paused_at | TIMESTAMPTZ | | 暂停时间 |
| closed_at | TIMESTAMPTZ | | 关闭时间 |
| application_count | INT | DEFAULT 0 | 申请数量 |
| school_id | UUID | FK→schools | 学校ID |
| created_by | UUID | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**索引**: PRIMARY KEY (id), (status), (subject), (application_deadline), (school_id)
**外键**: (school_id)→schools(id), (created_by)→users(id)

**枚举值 — employment_type:**
```
FULL_TIME  — 全职
PART_TIME  — 兼职
CONTRACT   — 合约
```

**枚举值 — status (position_status):**
```
DRAFT      — 草稿
PUBLISHED  — 已发布
PAUSED     — 已暂停
CLOSED     — 已关闭
```

---

## 表: recruitment_applications — 招聘申请

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 申请ID |
| application_number | VARCHAR(50) | UNIQUE, NOT NULL | 申请编号 (APP-YYYY-NNNN) |
| position_id | UUID | FK→recruitment_positions, NOT NULL | 职位ID |
| applicant_name | VARCHAR(100) | NOT NULL | 申请人姓名 |
| email | VARCHAR(255) | NOT NULL | 邮箱 |
| phone | VARCHAR(20) | NOT NULL | 联系电话 |
| cv_url | VARCHAR(500) | NOT NULL | 简历文件URL |
| cover_letter | TEXT | | 求职信 |
| education | JSONB | NOT NULL | 教育背景 (数组) |
| experience | JSONB | | 工作经历 (数组) |
| status | ENUM | NOT NULL, DEFAULT 'NEW' | 申请状态 (NEW/SCREENING/SHORTLISTED/INTERVIEW/REJECTED/OFFER) |
| screening_notes | TEXT | | 筛选备注 |
| rejection_reason | TEXT | | 拒绝原因 |
| rejected_at | TIMESTAMPTZ | | 拒绝时间 |
| rejected_by | UUID | FK→users | 拒绝人 |
| submitted_at | TIMESTAMPTZ | NOT NULL | 提交时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**索引**: PRIMARY KEY (id), UNIQUE (application_number), (position_id), (status), (email), (submitted_at)
**外键**: (position_id)→recruitment_positions(id), (rejected_by)→users(id)

**枚举值 — status (application_status):**
```
NEW         — 新申请
SCREENING   — 筛选中
SHORTLISTED — 候选
INTERVIEW   — 面试中
REJECTED    — 已淘汰
OFFER       — 已发Offer
```

**JSONB 字段结构 — education:**
```json
[
  {
    "degree": "学士",
    "school": "香港中文大学",
    "major": "中文",
    "year": "2015"
  }
]
```

**JSONB 字段结构 — experience:**
```json
[
  {
    "company": "XX中学",
    "position": "中文科教师",
    "duration": "2015-2020",
    "description": "教授中一至中三中文科"
  }
]
```

---

## 表: recruitment_interviews — 面试安排

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 面试ID |
| application_id | UUID | FK→recruitment_applications, NOT NULL | 申请ID |
| interview_date | TIMESTAMPTZ | NOT NULL | 面试时间 |
| duration_minutes | INTEGER | NOT NULL | 面试时长 (分钟) |
| interview_type | ENUM | NOT NULL | 面试形式 (ONLINE/ONSITE) |
| meeting_link | VARCHAR(500) | | 线上会议链接 |
| location | VARCHAR(200) | | 线下面试地点 |
| notes | TEXT | | 备注 |
| status | ENUM | NOT NULL, DEFAULT 'SCHEDULED' | 面试状态 (SCHEDULED/COMPLETED/CANCELLED) |
| overall_recommendation | ENUM | | 综合建议 (RECOMMEND/NOT_RECOMMEND/PENDING) |
| final_notes | TEXT | | 最终评语 |
| cancelled_at | TIMESTAMPTZ | | 取消时间 |
| cancelled_by | UUID | FK→users | 取消人 |
| cancellation_reason | TEXT | | 取消原因 |
| completed_at | TIMESTAMPTZ | | 完成时间 |
| completed_by | UUID | FK→users | 完成人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), (application_id), (interview_date), (status)
**外键**: (application_id)→recruitment_applications(id), (cancelled_by)→users(id), (completed_by)→users(id)

**枚举值 — interview_type:**
```
ONLINE  — 线上面试
ONSITE  — 线下面试
```

**枚举值 — status (interview_status):**
```
SCHEDULED  — 已安排
COMPLETED  — 已完成
CANCELLED  — 已取消
```

**枚举值 — overall_recommendation:**
```
RECOMMEND       — 推荐录用
NOT_RECOMMEND  — 不推荐录用
PENDING         — 待定
```

---

## 表: recruitment_interviewers — 面试官

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 关系ID |
| interview_id | UUID | FK→recruitment_interviews, NOT NULL | 面试ID |
| interviewer_id | UUID | FK→users, NOT NULL | 面试官ID |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), (interview_id, interviewer_id)
**外键**: (interview_id)→recruitment_interviews(id), (interviewer_id)→users(id)

---

## 表: recruitment_interview_scores — 面试评分

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 评分ID |
| interview_id | UUID | FK→recruitment_interviews, NOT NULL | 面试ID |
| interviewer_id | UUID | FK→users, NOT NULL | 面试官ID |
| criterion | VARCHAR(100) | NOT NULL | 评分维度 |
| score | INTEGER | NOT NULL, CHECK (score >= 1 AND score <= 5) | 评分 (1-5) |
| comment | TEXT | | 评语 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), (interview_id, interviewer_id, criterion)
**外键**: (interview_id)→recruitment_interviews(id), (interviewer_id)→users(id)

---

## 表: recruitment_offers — 录用Offer

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | Offer ID |
| offer_number | VARCHAR(50) | UNIQUE, NOT NULL | Offer编号 (OFF-YYYY-NNNN) |
| application_id | UUID | FK→recruitment_applications, NOT NULL | 申请ID |
| salary | DECIMAL(10,2) | NOT NULL | 薪资 |
| start_date | DATE | NOT NULL | 预计到职日期 |
| position | VARCHAR(100) | NOT NULL | 录用职位 |
| benefits_package | JSONB | | 福利套餐 |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | Offer状态 (PENDING/ACCEPTED/DECLINED/SIGNED) |
| valid_until | DATE | NOT NULL | Offer有效期 |
| sent_at | TIMESTAMPTZ | | 发送时间 |
| responded_at | TIMESTAMPTZ | | 回应时间 |
| acceptance_token | VARCHAR(255) | | 接受令牌 (用于外部链接) |
| signed_contract_url | VARCHAR(500) | | 已签约合同URL |
| signed_at | TIMESTAMPTZ | | 签约时间 |
| created_by | UUID | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), UNIQUE (offer_number), (application_id), (status), (acceptance_token)
**外键**: (application_id)→recruitment_applications(id), (created_by)→users(id)

**枚举值 — status (offer_status):**
```
PENDING    — 待回应
ACCEPTED   — 已接受
DECLINED   — 已拒绝
SIGNED     — 已签约
```

**JSONB 字段结构 — benefits_package:**
```json
{
  "mpf": true,
  "medical": true,
  "annual_leave": 14,
  "housing_allowance": false,
  "transport_allowance": false
}
```

---

## 表: recruitment_activity_logs — 招聘活动日志

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 日志ID |
| application_id | UUID | FK→recruitment_applications, NOT NULL | 申请ID |
| activity_type | ENUM | NOT NULL | 活动类型 |
| performed_by | VARCHAR(100) | | 操作人 |
| description | TEXT | NOT NULL | 描述 |
| old_value | VARCHAR(50) | | 旧值 |
| new_value | VARCHAR(50) | | 新值 |
| metadata | JSONB | | 附加数据 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), (application_id), (activity_type)
**外键**: (application_id)→recruitment_applications(id)

---

## 表: recruitment_onboarding — 入职流程

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 入职流程ID |
| offer_id | UUID | FK→recruitment_offers, NOT NULL | Offer ID |
| teacher_profile_id | UUID | FK→users | 教师档案ID (入职后关联) |
| start_date | DATE | NOT NULL | 到职日期 |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | 入职状态 (PENDING/IN_PROGRESS/COMPLETED) |
| completed_at | TIMESTAMPTZ | | 完成时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), (offer_id), (teacher_profile_id), (status)
**外键**: (offer_id)→recruitment_offers(id), (teacher_profile_id)→users(id)

**枚举值 — status (onboarding_status):**
```
PENDING      — 待开始
IN_PROGRESS  — 进行中
COMPLETED    — 已完成
```

---

## 表: recruitment_onboarding_tasks — 入职任务

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 任务ID |
| onboarding_id | UUID | FK→recruitment_onboarding, NOT NULL | 入职流程ID |
| item | VARCHAR(200) | NOT NULL | 任务项目 |
| description | TEXT | | 任务描述 |
| required | BOOLEAN | NOT NULL, DEFAULT true | 是否必填 |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | 任务状态 (PENDING/COMPLETED) |
| document_url | VARCHAR(500) | | 文档URL |
| completed_at | TIMESTAMPTZ | | 完成时间 |
| completed_by | UUID | FK→users | 完成人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), (onboarding_id), (status)
**外键**: (onboarding_id)→recruitment_onboarding(id), (completed_by)→users(id)

**枚举值 — status (task_status):**
```
PENDING    — 待完成
COMPLETED  — 已完成
```

---

## 模块 15: 学生档案管理 (Module 15 - Student Profile Management, v1.9.0 新增)

> **Issue #194 — 学生管理模块根本性重构**
> 核心变更：创建独立的 `students` 表存储学生业务档案，学号自动生成，班级分配按学年动态管理。

---

## 表: academic_years — 学年

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 学年ID |
| year | VARCHAR(9) | NOT NULL, UNIQUE | 学年，如 2026-2027 |
| start_date | DATE | NOT NULL | 学年开始日期 |
| end_date | DATE | NOT NULL | 学年结束日期 |
| is_current | BOOLEAN | DEFAULT false | 是否当前学年 |
| status | ENUM | DEFAULT 'active' | 状态 (active/archived) |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), UNIQUE (year)

---

## 表: students — 学生档案表 (v1.9.0 新增)

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 学生档案唯一标识 |
| student_id | VARCHAR(10) | UNIQUE, NOT NULL | 学号（YYYYNNNN格式，自动生成）|
| name_zh | VARCHAR(100) | NOT NULL | 中文姓名 |
| name_en | VARCHAR(100) | | 英文姓名 |
| gender | ENUM | NOT NULL | 性别 (male/female/other) |
| birth_date | DATE | NOT NULL | 出生日期 |
| address | TEXT | | 家庭地址 |
| phone | VARCHAR(20) | | 联系电话 |
| email | VARCHAR(255) | | 邮箱 |
| admission_date | DATE | NOT NULL | 入学日期 |
| status | ENUM | DEFAULT 'active' | 状态 (active/graduated/withdrawn/transferred) |
| guardian_name | VARCHAR(100) | | 监护人姓名 |
| guardian_phone | VARCHAR(20) | | 监护人电话 |
| guardian_relationship | VARCHAR(50) | | 监护人关系 |
| emergency_contact | VARCHAR(100) | | 紧急联系人 |
| emergency_phone | VARCHAR(20) | | 紧急联系电话 |
| hk_id | VARCHAR(20) | | 香港身份证 |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除时间 |
| created_by | UUID | | 创建人 |
| updated_by | UUID | | 更新人 |

**索引**: PRIMARY KEY (id), UNIQUE (student_id)
**说明**: 此表为学生业务档案，与 `users` 表（系统账户）完全分离。学号按 YYYYNNNN 格式自动生成，不可手动输入，不可修改。

**枚举值 — gender:**
```
male    — 男
female  — 女
other   — 其他
```

**枚举值 — status (student_status_enum):**
```
active     — 在校
graduated  — 毕业
withdrawn  — 退学
transferred — 转学
```

---

## 表: student_id_sequences — 学号序列表 (v1.9.0 新增)

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 序列ID |
| academic_year | VARCHAR(9) | UNIQUE, NOT NULL | 学年（如 2026-2027）|
| last_sequence | INTEGER | NOT NULL DEFAULT 0 | 上一个分配的序号 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), UNIQUE (academic_year)
**说明**: 按学年管理学号序号。创建学生时，从对应学年序列获取下一个序号，生成 YYYY + NNNN 格式学号。

---

## 表: class_allocations — 班级分配表 (v1.9.0 新增)

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 分配ID |
| student_id | UUID | FK→students, NOT NULL | 学生档案ID |
| class_id | UUID | FK→classes, NOT NULL | 班级ID |
| academic_year_id | UUID | FK→academic_years, NOT NULL | 学年ID |
| academic_year | VARCHAR(9) | NOT NULL | 学年（如 2026-2027，便于查询）|
| allocation_type | ENUM | DEFAULT 'main' | 分配类型 (main/elective/temporary) |
| effective_date | DATE | NOT NULL | 生效日期 |
| end_date | DATE | | 结束日期（为空表示当前学年有效）|
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id)
**外键**: (student_id)→students(id), (class_id)→classes(id), (academic_year_id)→academic_years(id)
**说明**: 每个学生在同一学年内只能有一个 `allocation_type='main'` 的主班分配。学年末旧分配自动过期，新学年需重新分配。

**枚举值 — allocation_type:**
```
main       — 主班（每生每学年仅一个）
elective   — 选修
temporary  — 临时
```

---

## 表: student_users — 学生-用户关联表 (v1.9.0 新增)

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 关联ID |
| student_id | UUID | FK→students, NOT NULL, UNIQUE | 学生档案ID |
| user_id | UUID | FK→users, NOT NULL, UNIQUE | 系统用户ID（role='student'）|
| is_primary_account | BOOLEAN | DEFAULT true | 是否主要账户 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引**: PRIMARY KEY (id), UNIQUE (student_id), UNIQUE (user_id)
**外键**: (student_id)→students(id), (user_id)→users(id)
**说明**: 将学生档案（`students`）与系统用户（`users`）关联。一个学生档案可关联多个用户账户（如同时有学生账户和家长关联的学生视图），但 primary 仅一个。

---

# CR-20260714-001: QR考勤 + 门户数据库表 (v2.0.0-draft.1)

> 以下表为 CR-20260714-001 新增，对应 QR Code 签到考勤和学生/家长门户模块。

## 表: qr_codes — QR码生成记录

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | QR码记录ID |
| student_id | UUID | FK→students, NOT NULL | 学生档案ID |
| nonce | VARCHAR(64) | UNIQUE, NOT NULL | 随机一次性nonce |
| key_version | INTEGER | NOT NULL | 签名密钥版本号 |
| signature | VARCHAR(128) | NOT NULL | HMAC-SHA256签名（前16字节hex）|
| generated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 生成时间 |
| expires_at | TIMESTAMPTZ | NOT NULL | 过期时间（generated_at + 30s）|
| status | VARCHAR(20) | NOT NULL DEFAULT 'active' | active/used/expired |

**索引**: PRIMARY KEY (id), UNIQUE (nonce), INDEX (student_id, generated_at), INDEX (status, expires_at)
**外键**: (student_id)→students(id)

## 表: attendance_qr_logs — 扫码签到记录

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 签到记录ID |
| qr_code_id | UUID | FK→qr_codes | 关联QR码ID |
| student_id | UUID | FK→students, NOT NULL | 签到学生 |
| staff_user_id | UUID | FK→users, NOT NULL | 扫码教职工 |
| scanned_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 扫码时间 |
| source | VARCHAR(20) | NOT NULL DEFAULT 'online' | online/offline_sync |
| device_id | VARCHAR(128) | | 扫码设备标识 |
| ip_address | INET | | 请求IP |
| result | VARCHAR(20) | NOT NULL | success/expired/duplicate/forged |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |

**索引**: PRIMARY KEY (id), INDEX (student_id, scanned_at), INDEX (staff_user_id, scanned_at), INDEX (result)
**外键**: (qr_code_id)→qr_codes(id), (student_id)→students(id), (staff_user_id)→users(id)

## 表: offline_sync_buffer — 离线同步缓冲 (2026-08-18 补录)

> ⚠️ 修复说明：历史 dev synchronize 曾在旧阶段以复数表名 `offline_sync_buffers` plus 旧 schema
> （payload/status/last_sync_at）建过遗留表，不对应任何当前实体。
> 当前 `OfflineSyncBuffer` 实体映射单数 `offline_sync_buffer`。迁移 1782530900000 已加入
> 对空遗留表 offline_sync_buffers 的清理逻辑。下表为当前实体权威 schema。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 缓冲记录ID |
| cache_id | UUID | NULL | 关联缓存ID |
| device_id | VARCHAR(128) | NOT NULL | 离线设备ID |
| device_name | VARCHAR(200) | | 设备名称 |
| scanner_location | VARCHAR(100) | | 扫码位置 |
| qr_raw | TEXT | NOT NULL | 原始QR码数据 |
| qr_raw_hash | VARCHAR(64) | | QR原始哈希 |
| qr_student_id | UUID | | 关联学生ID |
| scanned_at | TIMESTAMPTZ | NOT NULL | 本地扫描时间 |
| cached_at | TIMESTAMPTZ | | 缓存时间 |
| synced | BOOLEAN | NOT NULL DEFAULT false | 是否已同步 |
| sync_status | VARCHAR(30) | NOT NULL DEFAULT 'pending' | pending/syncing/synced/failed |
| synced_at | TIMESTAMPTZ | | 同步时间 |
| sync_result | VARCHAR(20) | | success/duplicate/expired |
| failure_reason | TEXT | | 失败原因 |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | 重试次数 |
| attendance_id | UUID | | 关联考勤ID |
| raw_request | JSONB | | 原始请求体 |
| validation_detail | JSONB | | 校验详情 |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 更新时间 |

**索引**: PRIMARY KEY (id), INDEX (device_id, synced), INDEX (synced, created_at)

## 表: attendance_daily_reports — 日报表 (当前实体 schema, 2026-08-18 补录)

> ⚠️ 修复说明：历史 dev synchronize 曾以旧 schema (`present_count/leave_count/report_data`)
> 建表，且旧表不为任何当前实体所用。迁移 1782530900000 已加入旧列检测重建逻辑。
> 下表为当前 `AttendanceDailyReport` 实体权威 schema。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 日报ID |
| school_id | UUID | NOT NULL | 学校ID |
| class_id | UUID | FK→classes, NOT NULL | 班级ID |
| report_date | DATE | NOT NULL | 日报日期 |
| class_name | VARCHAR(50) | | 班级名称 |
| grade | VARCHAR(20) | | 年级 |
| total_students | INTEGER | NOT NULL DEFAULT 0 | 应签人数 |
| checked_in | INTEGER | NOT NULL DEFAULT 0 | 已签到人数 |
| late_count | INTEGER | NOT NULL DEFAULT 0 | 迟到人数 |
| absent_count | INTEGER | NOT NULL DEFAULT 0 | 缺勤人数 |
| leave_approved | INTEGER | NOT NULL DEFAULT 0 | 请假人数 |
| unchecked_students | JSONB | | 未签到学生列表 |
| checked_in_students | JSONB | | 已签到学生列表 |
| leave_students | JSONB | | 请假学生列表 |
| status | daily_report_status_enum | NOT NULL DEFAULT 'pending' | pending/generated/failed |
| notification_sent | BOOLEAN | NOT NULL DEFAULT false | 是否已发通知 |
| notification_sent_at | TIMESTAMPTZ | | 通知发送时间 |
| teacher_ids | JSONB | | 教师ID列表 |
| notification_ids | JSONB | | 通知ID列表 |
| failure_reason | TEXT | | 失败原因 |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 更新时间 |

**索引**: PRIMARY KEY (id), UNIQUE (class_id, report_date), INDEX (report_date), INDEX (class_id)
**外键**: (class_id)→classes(id) ON DELETE CASCADE

## 表: leave_requests — 门户端请假申请 (2026-08-18 补录)

> 修复说明：该表此前缺失，迁移 1782530900000 从未执行（migrations 表无记录）。
> 前 4 张 QR/考勤表系 dev synchronize 以旧 schema 历史创建，唯独 leave_requests 从未建。
> 下表为当前 `LeaveRequest` 实体权威 schema。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 请假ID |
| student_id | UUID | FK→users, NOT NULL | 请假学生ID（users表） |
| applicant_id | UUID | FK→users, NOT NULL | 申请人ID（实际提交操作者） |
| leave_type | leave_type_enum | NOT NULL | sick/personal/family/other |
| start_date | DATE | NOT NULL | 请假开始日期 |
| end_date | DATE | NOT NULL | 请假结束日期 |
| total_days | INTEGER | NOT NULL | 请假天数 |
| reason | TEXT | NOT NULL | 请假原因 |
| attachment_url | TEXT | NULL | 附件URL |
| submitter_role | submitter_role_enum | NOT NULL | student/parent |
| status | leave_status_enum | NOT NULL DEFAULT 'pending' | pending/approved/rejected/cancelled |
| approved_by | UUID | FK→users, NULL | 审批人ID |
| approved_at | TIMESTAMP | NULL | 审批时间 |
| approval_comment | TEXT | NULL | 审批意见 |
| contact_phone | VARCHAR(20) | NULL | 请假期间联系方式 |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | 更新时间 |

**枚举**: leave_type_enum('sick','personal','family','other'), leave_status_enum('pending','approved','rejected','cancelled'), submitter_role_enum('student','parent')
**索引**: PRIMARY KEY (id), INDEX (student_id), INDEX (status)
**外键**: (student_id)→users(id) ON DELETE CASCADE, (applicant_id)→users(id), (approved_by)→users(id)

## 表: parent_student_links — 家长学生关联

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 关联ID |
| parent_user_id | UUID | FK→users, NOT NULL | 家长用户ID |
| student_id | UUID | FK→students, NOT NULL | 学生档案ID |
| relationship | VARCHAR(20) | NOT NULL | father/mother/guardian |
| is_primary | BOOLEAN | DEFAULT false | 是否主联系人 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |

**索引**: PRIMARY KEY (id), UNIQUE (parent_user_id, student_id), INDEX (student_id), INDEX (parent_user_id)
**外键**: (parent_user_id)→users(id), (student_id)→students(id)

## 表: portal_audit_logs — 门户审计日志

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 日志ID |
| event_type | VARCHAR(50) | NOT NULL | LOGIN/PROFILE_VIEW/PROFILE_UPDATE/LEAVE_CREATE/LEAVE_CANCEL/QR_GENERATE/QR_SCAN/UNAUTHORIZED_ACCESS |
| actor_id | UUID | NOT NULL | 操作人ID |
| actor_role | VARCHAR(20) | NOT NULL | student/parent/staff |
| target_id | UUID | | 目标对象ID |
| target_type | VARCHAR(50) | | students/leaves/qr_codes |
| action | VARCHAR(20) | NOT NULL | CREATE/READ/UPDATE/DELETE/ACCESS_DENIED |
| changes | JSONB | | 变更详情（脱敏后）|
| ip_address | INET | | |
| user_agent | TEXT | | |
| result | VARCHAR(10) | NOT NULL | SUCCESS/FAILURE/DENIED |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |

**索引**: PRIMARY KEY (id), INDEX (actor_id, created_at), INDEX (event_type, created_at), INDEX (result)

---

## 表: role_permissions (追加记录)

向现有 role_permissions 表追加以下权限条目：

**Student Role (10项):**
| 权限标识 | 说明 |
|---------|------|
| profile:view:self | 查看个人档案 |
| profile:update:self | 有限修改个人信息 |
| attendance:view:self | 查看本人考勤 |
| attendance:qr:generate | 生成QR签到码 |
| leave:create:self | 提交请假 |
| leave:view:self | 查看请假记录 |
| leave:cancel:self | 撤回请假（仅pending）|
| grade:view:self | 查看本人成绩 |
| timetable:view:self | 查看课表 |
| notice:view | 查看校历通告 |

**Parent Role (8项):**
| 权限标识 | 说明 |
|---------|------|
| profile:view:linked_children | 查看关联子女档案（只读）|
| attendance:view:linked_children | 查看关联子女考勤 |
| leave:view:linked_children | 查看子女请假记录 |
| leave:create:linked_children | 代子女提交请假 |
| grade:view:linked_children | 查看子女成绩 |
| payment:operate:linked_children | 校内缴费 |
| notice:view | 查看校历通告 |
| emergency:update:linked_children | 更新子女紧急联系方式 |

---

## 模块 16: 用户权限与认证模块 (Module 16 - User Permission & Authentication, v1.9.0 新增)

> 🔧 **补全说明（Issue #355）**：本节为「用户权限与认证」模块（F-USER-003~007）补全数据表设计。
> 除用户主表、sessions、otp_sessions、audit_logs 已在 §4 定义外，本节补充/固化以下权限专项表：
> `user_roles`（角色表）、`permissions`（权限表）、`role_permissions`（角色权限关联）、`user_role_assignments`（用户角色关联）、
> `abac_policies`（ABAC 策略表，新增）、`password_resets`（凭证重置记录，新增）、
> `permission_approval_requests` 与 `permission_approval_steps`（权限审批流程，新增）。
> 括号标注「扩展现有表」的表，其已有字段不重复定义，仅补充本模块相关字段。

## 表: user_roles — 角色表 (权限专项固化)

> 本节固化角色定义，与 §4 用户主表 `role`/`user_role_new` 枚举对齐；`is_system` 内置角色不可删除/改名。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 角色ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 角色名称（如 SCHOOL_ADMIN）|
| display_name | VARCHAR(100) | NOT NULL | 展示名（中文）|
| description | TEXT | | 角色说明 |
| is_system | BOOLEAN | DEFAULT false, NOT NULL | 是否系统内置（内置不可删除/改名）|
| priority | INTEGER | DEFAULT 100 | 角色优先级（越小越高，用于叠加判定）|
| created_by | UUID | | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), UNIQUE (name)
**外键：** (created_by)→users(id)

**内置角色：**
```
SYSTEM, SCHOOL_ADMIN, OFFICER, TEACHER, PARENT, STUDENT
```

## 表: permissions — 权限表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 权限ID |
| code | VARCHAR(100) | UNIQUE, NOT NULL | 权限标识（如 grade:view:self）|
| name | VARCHAR(100) | NOT NULL | 权限名称 |
| module | VARCHAR(50) | NOT NULL | 所属模块（如 grade、attendance、finance）|
| resource_type | VARCHAR(50) | NOT NULL | 资源类型（student_record、financial 等）|
| action | VARCHAR(20) | NOT NULL | 操作：view/create/update/delete/export/print/approve |
| is_sensitive | BOOLEAN | DEFAULT false, NOT NULL | 是否敏感权限（触发二次认证/审批/脱敏）|
| description | TEXT | | 说明 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), UNIQUE (code), INDEX (module), INDEX (resource_type, action)

**敏感权限示例（is_sensitive=true）：**
```
committee_escalation_tmp, cross_class_data_access, data_export_grant,
system_role_change, parent_unlink_child
```

## 表: role_permissions — 角色权限关联 (规范化关联)

> 与现有 `role_permissions` 追加条目共用同表；本表以 `permissions.code` 规范化外键，避免仅依赖 JSONB 数组，保证主从一致性。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| role_id | UUID | FK→user_roles(id), NOT NULL | 角色 |
| permission_id | UUID | FK→permissions(id), NOT NULL | 权限 |
| granted_by | UUID | | 授权人 |
| granted_at | TIMESTAMPTZ | DEFAULT now(), NOT NULL | 授权时间 |
| valid_until | TIMESTAMPTZ | | 授权有效期（到期自动回收）|

**索引：** PRIMARY KEY (id), UNIQUE (role_id, permission_id), INDEX (permission_id)
**外键：** (role_id)→user_roles(id) ON DELETE CASCADE, (permission_id)→permissions(id) ON DELETE CASCADE, (granted_by)→users(id)

## 表: user_role_assignments — 用户角色关联

> 用户-角色多对多关联；替换/兼容旧 `users.role` 单值字段（迁移期内双写，历史角色可映射到多条记录）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK→users(id), NOT NULL | 用户 |
| role_id | UUID | FK→user_roles(id), NOT NULL | 角色 |
| assigned_by | UUID | | 分配人 |
| assigned_at | TIMESTAMPTZ | DEFAULT now(), NOT NULL | 分配时间 |
| valid_from | TIMESTAMPTZ | | 生效时间 |
| valid_until | TIMESTAMPTZ | | 失效时间（临时授权到期）|
| status | assignment_status | DEFAULT 'active', NOT NULL | 状态 |

**索引：** PRIMARY KEY (id), UNIQUE (user_id, role_id), INDEX (role_id)
**外键：** (user_id)→users(id) ON DELETE CASCADE, (role_id)→user_roles(id) ON DELETE RESTRICT, (assigned_by)→users(id)

**枚举值 — assignment_status**
```
active   — 生效中
pending  — 待生效（审批通过前）
expired  — 已过期
revoked  — 已撤销
```

## 表: abac_policies — ABAC 策略表 (新增)

> 用于 OPA Rego 策略版本化管理、灰度发布与追责；运行时由 OpaGuard 加载 `status='active'` 的最高 `version`。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 策略ID |
| policy_key | VARCHAR(100) | UNIQUE, NOT NULL | 策略唯一键（如 class_scope、child_scope）|
| version | INTEGER | DEFAULT 1, NOT NULL | 版本号（同 key 自增）|
| title | VARCHAR(200) | NOT NULL | 策略标题 |
| description | TEXT | | 策略说明 |
| rego | TEXT | NOT NULL | Rego 策略原文（不可改，仅作新版本）|
| target_roles | TEXT[] | | 作用于哪些角色（空=全部）|
| status | policy_status | DEFAULT 'draft', NOT NULL | 状态 |
| created_by | UUID | | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| published_at | TIMESTAMPTZ | | 发布时间 |
| rolled_back_from | INTEGER | | 回滚来源版本（生效版本）|

**索引：** PRIMARY KEY (id), UNIQUE (policy_key, version), INDEX (status), INDEX (policy_key) WHERE status='active'
**外键：** (created_by)→users(id)

**枚举值 — policy_status**
```
draft      — 草稿
preview    — 预览（待人工审查）
active     — 已发布（运行时加载）
inactive   — 停用
rolled_back — 已回滚
```

## 表: audit_logs — 审计日志 (扩展 §4.3，本模块额外审计事件)

> 沿用 §4.3 audit_logs 表结构，不重复字段；本模块新增 `audit_action` 枚举值与源类型，服务于 F-USER-005。

**新增 audit_action 值（追加到 §7.6 枚举）：**
```
login_success, login_failed, login_locked, session_expired, session_evicted,
session_risk_alert, token_refreshed, token_revoked, mfa_enabled, mfa_disabled,
password_reset_request, password_reset_completed, admin_password_reset,
sensitive_field_view, sensitive_field_export, permission_approval_submitted,
permission_approval_approved, permission_approval_rejected,
permission_approval_expired, abac_policy_published, abac_policy_rolled_back
```

**附加元数据约定（metadata JSONB）：**
| 键 | 类型 | 说明 |
|----|------|------|
| session_id | String | 相关会话ID |
| risk_level | String | 风险等级（low/medium/high）|
| decision | String | allow/denied |
| requested_fields | String[] | 请求的敏感字段（SensitiveData）|
| permitted_fields | String[] | 实际可见字段 |
| retained | String | 保留期（3y/7y）|
| siem_synced | Boolean | 是否同步 SIEM |

## 表: password_resets — 凭证重置记录 (新增, F-USER-006)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 重置记录ID |
| user_id | UUID | FK→users(id), NOT NULL | 申请用户 |
| purpose | reset_purpose | DEFAULT 'login_password', NOT NULL | 重置用途 |
| method | reset_method | NOT NULL | 重置方式 |
| token_hash | VARCHAR(255) | | 一次性令牌哈希（不存明文）|
| otp_code_hash | VARCHAR(255) | | OTP 哈希 |
| otp_expires_at | TIMESTAMPTZ | | OTP/链接过期时间 |
| attempts | INTEGER | DEFAULT 0, NOT NULL | 验证失败次数（3 次锁定）|
| status | reset_status | DEFAULT 'pending', NOT NULL | 状态 |
| completed_by_admin | UUID | | 管理员代重置操作人 |
| ip | VARCHAR(50) | | 请求 IP |
| user_agent | TEXT | | User Agent |
| used_at | TIMESTAMPTZ | | 使用时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), INDEX (user_id), INDEX (status), UNIQUE (token_hash)
**外键：** (user_id)→users(id) ON DELETE CASCADE, (completed_by_admin)→users(id)

**枚举值 — reset_purpose**
```
login_password   — 登录密码
parent_password  — 家长密码（多子女关联验证）
api_key          — API Key 重置
otp_secret       — OTP 重绑
```

**枚举值 — reset_method**
```
email_link   — 邮箱链接
email_otp    — 邮箱 OTP
sms_otp      — 短信 OTP
admin_reset  — 管理员代重置（双验证）
onsite       — 到校人工代办
```

**枚举值 — reset_status**
```
pending    — 待验证
verified   — 已验证（待设新密码）
completed  — 已完成
failed     — 验证多次失败锁定
expired    — 已过期
```

## 表: permission_approval_requests — 权限变更审批申请 (新增, F-USER-007)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 申请ID |
| requester_id | UUID | FK→users(id), NOT NULL | 申请人 |
| target_user_id | UUID | FK→users(id), NOT NULL | 被授权目标用户 |
| change_type | change_type | NOT NULL | 变更类型（5 类敏感操作）|
| role_id | UUID | FK→user_roles(id) | 目标角色（如适用）|
| permission_ids | JSONB | | 目标权限ID列表 |
| request_reason | VARCHAR(500) | NOT NULL | 申请理由 |
| valid_from | TIMESTAMPTZ | | 授权生效时间 |
| valid_until | TIMESTAMPTZ | | 授权失效时间（到期回收）|
| status | approval_status | DEFAULT 'pending', NOT NULL | 申请状态 |
| current_step | INTEGER | DEFAULT 0, NOT NULL | 当前审批步骤 |
| total_steps | INTEGER | DEFAULT 2, NOT NULL | 总审批步骤 |
| risk_level | risk_level | DEFAULT 'medium', NOT NULL | 风险等级 |
| attachments | JSONB | | 证明文件元数据[{name,url,mime,size,uploaded_by}]（PDF/JPG/PNG ≤10MB）|
| rejection_reason | VARCHAR(500) | | 驳回原因 |
| school_id | VARCHAR | NOT NULL | 所属学校 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), INDEX (requester_id), INDEX (target_user_id), INDEX (status), INDEX (school_id)
**外键：** (requester_id)→users(id) ON DELETE CASCADE, (target_user_id)→users(id) ON DELETE CASCADE, (role_id)→user_roles(id) ON DELETE SET NULL

**枚举值 — change_type**
```
temp_committee_escalation — 临时提升为校务主任
temp_super_admin          — 临时提升系统管理员
cross_class_data_access   — 跨班级数据访问授权
data_export_grant         — 数据导出权限授予
system_role_change        — SYSTEM 角色权限变更
parent_unlink_child       — 家长账户关联学生解绑
```

**枚举值 — approval_status**
```
pending         — 待提交
pending_review  — 审批中
approved        — 已批准
rejected        — 已驳回
expired         — 超时未审失效
cancelled       — 已取消
```

## 表: permission_approval_steps — 权限变更审批步骤 (新增, F-USER-007)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 步骤ID |
| request_id | UUID | FK→permission_approval_requests(id), NOT NULL | 所属申请 |
| step_order | INTEGER | NOT NULL | 步骤顺序（1..n）|
| approver_role | VARCHAR(50) | NOT NULL | 该步审批角色（校务主任/校长/系统管理员）|
| approver_id | UUID | FK→users(id) | 实际审批人（提交二次认证后落库）|
| otp_verified | BOOLEAN | DEFAULT false, NOT NULL | 该步是否完成二次认证（短信OTP/硬件Token）|
| attachment_reviewed | BOOLEAN | DEFAULT false, NOT NULL | 是否已审查附件 |
| status | step_status | DEFAULT 'pending', NOT NULL | 该步状态 |
| comment | VARCHAR(500) | | 审批意见 |
| approved_at | TIMESTAMPTZ | | 批准时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), UNIQUE (request_id, step_order), INDEX (approver_id)
**外键：** (request_id)→permission_approval_requests(id) ON DELETE CASCADE, (approver_id)→users(id) ON DELETE SET NULL

**枚举值 — step_status**
```
pending   — 待处理
approved  — 已批准
rejected  — 已驳回
skipped   — 已跳过
```

---

## 17. 整合及合规模块 (Module 5: F-INT-001/002, F-COMP-001/002/003)

> 🔧 **补全说明（Issue #356）**：本节为「整合及合规」模块补全数据表设计。
> 审计事件目录/日志表已由 F-USER-005（§4.3 `audit_logs`）覆盖，**此处不重复建表**，仅在本节末尾扩展 `audit_action` 枚举并定义同步/合规/见证专属表：
> `compliance_checks`（合规检查记录，新增）、`witness_verifications` 与 `witness_steps`（双人见证记录，新增）、
> `sync_tasks`（同步任务，新增）、`sync_logs`（同步日志，新增）、`sync_conflicts`（同步冲突表，新增）。

## 表: compliance_checks — 合规检查记录 (新增, F-COMP-001)

> 记录每次 PDPO 合规判定的输入、决策与理由，供合规追溯与留存（保留 7 年）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 检查记录ID |
| action | VARCHAR(50) | NOT NULL | 操作类型（view/export/print/update/sync_push 等）|
| data_class | data_class | NOT NULL | 数据级别 P1/P2/P3 |
| purpose | VARCHAR(50) | NOT NULL | 使用目的（education_administration 等）|
| user_id | UUID | FK→users(id) | 请求用户 |
| user_role | VARCHAR(50) | | 请求用户角色 |
| resource_type | VARCHAR(50) | | 资源类型（student_record/health/financial 等）|
| resource_id | VARCHAR(100) | | 目标资源ID |
| requested_fields | JSONB | DEFAULT '[]' | 请求字段列表 |
| decision | check_decision | NOT NULL | allow/deny |
| reason | VARCHAR(200) | | 拒绝/放行原因（purpose_violation 等）|
| check_items | JSONB | DEFAULT '[]' | 各子检查项结果[{name, passed, detail}] |
| risk_level | risk_level | DEFAULT 'low', NOT NULL | 风险等级（low/medium/high）|
| ip | VARCHAR(50) | | 请求IP |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), INDEX (user_id), INDEX (decision), INDEX (data_class), INDEX (created_at)
**外键：** (user_id)→users(id) ON DELETE SET NULL

**枚举值 — data_class**
```
P1  — 高度敏感（健康资料、身份证号、家庭状况）
P2  — 中度敏感（成绩、奖惩记录、联络方式）
P3  — 一般资料（姓名、班别、出席率）
```

**枚举值 — check_decision**
```
allow  — 合规通过
 deny  — 合规拒绝（须记录 reason）
```

## 表: witness_verifications — 双人见证单 (新增, F-COMP-002)

> 记录一次双人见证流程的主记录与状态机状态；见证步骤落在 witness_steps。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 见证单ID |
| witness_type | witness_type | NOT NULL | 触发场景（cash_receipt/cash_payment/petty_cash/safe_open/cheque_sign）|
| amount | NUMERIC(12,2) | | 交易金额（现金场景）|
| currency | VARCHAR(3) | DEFAULT 'HKD' | 币种 |
| business_ref | VARCHAR(100) | | 关联业务单据标识（报销单/收款单/备用金ID）|
| requester_id | UUID | FK→users(id), NOT NULL | 操作发起人（员工）|
| witness_1_id | UUID | FK→users(id) | 第一见证人 |
| witness_2_id | UUID | FK→users(id) | 第二见证人（如有）|
| required_witnesses | INTEGER | DEFAULT 2, NOT NULL | 所需见证人数（现金收取=1，其余=2）|
| status | witness_status | DEFAULT 'triggered', NOT NULL | 状态机状态 |
| escalation_notified | BOOLEAN | DEFAULT false, NOT NULL | 是否已升级校务主任 |
| completed_at | TIMESTAMPTZ | | 全部见证完成时间（交易锁定）|
| rejection_reason | VARCHAR(500) | | 拒绝原因 |
| school_id | VARCHAR | NOT NULL | 所属学校 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), INDEX (status), INDEX (business_ref), INDEX (witness_1_id), INDEX (witness_2_id)
**外键：** (requester_id)→users(id) ON DELETE RESTRICT, (witness_1_id)→users(id) ON DELETE SET NULL, (witness_2_id)→users(id) ON DELETE SET NULL

**枚举值 — witness_type**
```
cash_receipt   — 现金收取（1 员工 + 1 见证人）
cash_payment   — 现金支付 >HK$500（2 授权员工）
petty_cash     — 备用金补充（2 授权员工）
safe_open      — 保险箱开启（2 授权员工）
cheque_sign    — 支票签署（2 授权签署人）
```

**枚举值 — witness_status**
```
triggered    — 已触发，待第一步
await_first  — 待第一见证人
await_second — 待第二见证人
completed    — 全部完成，交易已锁定
escalated    — 已升级校务主任
rejected     — 已拒绝
cancelled    — 已作废
```

## 表: witness_steps — 双人见证步骤 (新增, F-COMP-002)

> 记录每个见证人的确认/拒绝动作；见证人身份、时间戳、二次认证及操作信息完整留存。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 步骤ID |
| verification_id | UUID | FK→witness_verifications(id), NOT NULL | 所属见证单 |
| step_order | INTEGER | NOT NULL | 步骤顺序（1=第一见证人, 2=第二见证人）|
| witness_id | UUID | FK→users(id), NOT NULL | 见证人用户ID |
| otp_verified | BOOLEAN | DEFAULT false, NOT NULL | 是否完成本人二次认证（短信OTP）|
| status | step_status | DEFAULT 'pending', NOT NULL | 该步状态（pending/approved/rejected）|
| comment | VARCHAR(500) | | 见证意见/拒绝原因 |
| ip | VARCHAR(50) | | 操作IP |
| decided_at | TIMESTAMPTZ | | 处理时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), UNIQUE (verification_id, step_order), INDEX (witness_id)
**外键：** (verification_id)→witness_verifications(id) ON DELETE CASCADE, (witness_id)→users(id) ON DELETE SET NULL

## 表: sync_tasks — 同步任务 (新增, F-INT-001/002)

> 记录一次数据同步任务（实时/定时/批量/按需）及其状态机状态。`sync_ref` 为幂等键。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 任务ID |
| sync_ref | VARCHAR(100) | UNIQUE, NOT NULL | 幂等键（同步唯一标识）|
| provider | sync_provider | NOT NULL | 外部系统（websams/eclass）|
| sync_mode | sync_mode | NOT NULL | 触发模式（realtime/scheduled/batch/manual）|
| operation | sync_operation | NOT NULL | pull/push/dual |
| domain | VARCHAR(50) | NOT NULL | 数据域（student/enrollment/attendance/grade/health）|
| direction | VARCHAR(20) | NOT NULL | school_to_external / external_to_school / bidirectional |
| status | sync_task_status | DEFAULT 'queued', NOT NULL | 状态机状态 |
| trigger_by | UUID | FK→users(id) | 触发人（manual 时必须）|
| scheduled_at | TIMESTAMPTZ | | 计划执行时间 |
| started_at | TIMESTAMPTZ | | 开始时间 |
| finished_at | TIMESTAMPTZ | | 结束时间 |
| attempt | INTEGER | DEFAULT 0, NOT NULL | 已重试次数 |
| max_retry | INTEGER | DEFAULT 3, NOT NULL | 最大重试次数 |
| records_processed | INTEGER | DEFAULT 0 | 处理记录数 |
| records_synced | INTEGER | DEFAULT 0 | 成功同步记录数 |
| extended_meta | JSONB | DEFAULT '{}' | 扩展元数据（过滤器、分页游标等）|
| school_id | VARCHAR | NOT NULL | 所属学校 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), UNIQUE (sync_ref), INDEX (provider, status), INDEX (scheduled_at), INDEX (school_id)
**外键：** (trigger_by)→users(id) ON DELETE SET NULL

**枚举值 — sync_provider**
```
websams  — 教育局 WebSAMS
 eclass   — eClass 教育平台
```

**枚举值 — sync_mode**
```
realtime  — 实时（事件驱动）
scheduled — 定时（每日 23:00 等）
batch     — 批量（每周/每月年度处理）
manual    — 按需（手动触发）
```

**枚举值 — sync_operation**
```
pull  — 拉取
push  — 推送
dual  — 双向
```

**枚举值 — sync_task_status**
```
queued     — 已入队
running    — 执行中
retryable  — 可重试失败（指数退避）
conflict   — 数据冲突（等待 `sync_conflicts` 裁决）
succeeded  — 单次成功
done       — 完成（含审计打点）
failed     — 不可重试失败
cancelled  — 已取消
resolved   — 冲突已裁决
```

## 表: sync_logs — 同步日志 (新增, F-INT-001/002)

> 记录同步任务每次执行的明细日志（含每次重试），用于故障定位与效能审计。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 日志ID |
| task_id | UUID | FK→sync_tasks(id), NOT NULL | 所属任务 |
| attempt | INTEGER | DEFAULT 1, NOT NULL | 第几次尝试 |
| level | log_level | NOT NULL | 日志级别（info/warn/error）|
| message | TEXT | NOT NULL | 日志内容 |
| external_status_code | INTEGER | | 外部 HTTP 状态码 |
| external_ref | VARCHAR(200) | | 外部回执记录ID |
| latency_ms | INTEGER | | 本次调用耗时 |
| payload_snapshot | JSONB | | 脱敏后的请求/响应摘要 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), INDEX (task_id), INDEX (attempt), INDEX (level), INDEX (created_at)
**外键：** (task_id)→sync_tasks(id) ON DELETE CASCADE

**枚举值 — log_level**
```
info   — 常规
warn   — 告警（重试/部分失败）
error  — 错误
```

## 表: sync_conflicts — 同步冲突表 (新增, F-INT-001/002)

> 记录数据同步过程中发现的冲突，等待人工裁决（保留外部优先/保留本地/合并/拒绝）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 冲突ID |
| task_id | UUID | FK→sync_tasks(id), NOT NULL | 所属任务 |
| conflict_type | conflict_type | NOT NULL | 冲突类型 |
| entity_type | VARCHAR(50) | NOT NULL | 实体类型（student/attendance/grade 等）|
| entity_key | VARCHAR(200) | NOT NULL | 实体唯一键（外部ID/学生校号等）|
| local_value | JSONB | | 我方当前值（脱敏）|
| external_value | JSONB | | 外部值（脱敏）|
| resolution | conflict_resolution | DEFAULT 'pending', NOT NULL | 裁决结果 |
| resolved_by | UUID | FK→users(id) | 裁决人 |
| resolve_note | VARCHAR(500) | | 裁决备注 |
| resolved_at | TIMESTAMPTZ | | 裁决时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id), INDEX (task_id), INDEX (status) , UNIQUE (task_id, entity_type, entity_key, conflict_type)
**外键：** (task_id)→sync_tasks(id) ON DELETE CASCADE, (resolved_by)→users(id) ON DELETE SET NULL

**枚举值 — conflict_type**
```
version_mismatch — 版本号不一致（乐观锁）
key_conflict     — 主键/唯一键映射冲突
value_discrepancy — 同字段值不一致（无版本，默认外部优先）
link_break       — 关联记录缺失
```

**枚举值 — conflict_resolution**
```
pending          — 待裁决
keep_external     — 保留外部值
keep_local        — 保留本地值
merge             — 合并
reject            — 拒绝（丢弃变更）
```

## 表: audit_logs — 审计日志 (扩展 §4.3，本模块新增 audit_action 值)

> 沿用 §4.3 `audit_logs` 表结构，不重复建表；为 F-COMP-003（含合规/见证/同步事件）扩展 `audit_action` 枚举值（追加到 §7.6 枚举）。

**新增 audit_action 值（追加到 §7.6 枚举）：**
```
compliance_check_allowed, compliance_check_denied, witness_triggered,
witness_approved_step, witness_rejected, witness_completed, witness_escalated,
sync_task_created, sync_task_started, sync_task_succeeded, sync_task_failed,
sync_task_retried, sync_task_conflict, sync_conflict_resolved, sync_data_pushed
```

**附加元数据约定（metadata JSONB）：**
| 键 | 类型 | 说明 |
|----|------|------|
| retained | String | 保留期（5y/7y/3y）|
| sync_ref | String | 关联同步任务幂等键 |
| witness_id | String | 关联见证单ID |
| compliance_id | String | 关联合规检查记录ID |
| decision | String | allow/deny |
| data_class | String | P1/P2/P3 |


## 模块 18: 考试与成绩管理模块 (Module 18 - Exam & Grade Management, F-EXAM-001~004, v2.0.0-draft.1 新增)

> 🔧 **补全说明（Issue #357）**：为 F-EXAM-001（DSE 报考）、F-EXAM-002（试卷管理）、F-EXAM-003（特别考试安排）、F-EXAM-004（成绩单生成发布）新增表。
> 系统设计见 SPEC-SYSTEM-DESIGN §18，字段说明见 DATA-DICTIONARY §21，接口见 API-DESIGN §9。
> **边界**：本节只建考试业务专属表。校内考试排期复用既有 `exams`；校内成绩录入/发布审批复用 `grade_records`/`grade_publish_*`（GRADE-PUBLISH-DESIGN）；DSE 放榜成绩复用既有 `dse_release`/`dse_result`（Module 12）。以下表中 `exam_id` 一律指向 `exams(id)`。

### 表: dse_exam_batches — DSE 报考批次 (新增, F-EXAM-001)

> 一个学年度的 DSE 报考窗口；划定报名起止、逾期费、科数上下限与 HKEAA 提交状态。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| academic_year | VARCHAR(9) | NOT NULL | 学年度（如 2025-2026）|
| batch_code | VARCHAR(50) | NOT NULL, UNIQUE | 批次编码（如 DSEB-2026）|
| name | VARCHAR(100) | NOT NULL | 批次名称 |
| open_at | TIMESTAMPTZ | NOT NULL | 报名开放时间 |
| close_at | TIMESTAMPTZ | NOT NULL | 报名截止时间 |
| late_fee_per_subject | NUMERIC(10,2) | NOT NULL DEFAULT 560.00 | 逾期报名费（每科）|
| min_subjects | SMALLINT | NOT NULL DEFAULT 6 | 最少科数 |
| max_subjects | SMALLINT | NOT NULL DEFAULT 8 | 最多科数 |
| require_declaration | BOOLEAN | NOT NULL DEFAULT true | 是否须签声明书 |
| require_photo | BOOLEAN | NOT NULL DEFAULT true | 是否须报名照 |
| status | ENUM | NOT NULL | dse_batch_status_enum |
| submitted_at | TIMESTAMPTZ | | 提交 HKEAA 时间 |
| confirmed_at | TIMESTAMPTZ | | HKEAA 确认时间 |
| hkeaa_ref | VARCHAR(100) | | HKEAA 外部引用号 |
| created_by | UUID | FK→users | 创建人 |
| updated_by | UUID | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — dse_batch_status_enum：** `draft/open/ongoing/closed/submitted/confirmed/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (batch_code)；INDEX (academic_year)；INDEX (status)
**外键：** (created_by)→users(id), (updated_by)→users(id)

---

### 表: dse_subjects — DSE 报考科目表 (新增, F-EXAM-001)

> 科目字典；DSE 报考支持的科目及分类。种子数据按香港中学文凭考试科目初始化（Category A/B/C），后续可增。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| subject_code | VARCHAR(20) | NOT NULL, UNIQUE | 科目代码（如 CN/EN/MA/LS…）|
| subject_name_zh | VARCHAR(100) | NOT NULL | 中文名称 |
| subject_name_en | VARCHAR(100) | NOT NULL | 英文名称 |
| category | ENUM | NOT NULL | dse_subject_category_enum |
| is_core | BOOLEAN | NOT NULL DEFAULT false | 是否核心科目（A_core）|
| language | VARCHAR(10) | | 中文/英文试卷 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否可用 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — dse_subject_category_enum：** `A_core/A_elective/B/C`
**索引：** PRIMARY KEY (id)；UNIQUE (subject_code)；INDEX (category)；INDEX (is_core)

---

### 表: dse_registrations — DSE 报考记录 (新增, F-EXAM-001)

> 单个学生一次报考；subject_selections 存所选科目明细。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | FK→dse_exam_batches, NOT NULL | 报考批次 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| registration_id | VARCHAR(50) | NOT NULL, UNIQUE | 报考编号（如 DSE-2026-001234）|
| student_no | VARCHAR(50) | NOT NULL | 校号（来自 WebSAMS）|
| hkdse_no | VARCHAR(30) | | 香港中学会考/文凭试考生号（如有）|
| subject_selections | JSONB | NOT NULL DEFAULT '[]' | 所选科目数组 |
| total_subjects | SMALLINT | NOT NULL | 科目总数 |
| special_arrangements | JSONB | DEFAULT '{}' | 特别安排摘要（衔接 F-EXAM-003）|
| has_special_needs | BOOLEAN | NOT NULL DEFAULT false | 是否有特别需要/SEN |
| declaration_signed | BOOLEAN | NOT NULL DEFAULT false | 是否签署声明书 |
| photo_url | VARCHAR(255) | | 报名照 |
| is_late | BOOLEAN | NOT NULL DEFAULT false | 是否逾期报考 |
| late_fee_total | NUMERIC(10,2) | DEFAULT 0.00 | 逾期费合计 |
| status | ENUM | NOT NULL | dse_registration_status_enum |
| submitted_at | TIMESTAMPTZ | | 提交时间 |
| confirmed_at | TIMESTAMPTZ | | HKEAA 确认时间 |
| withdraw_reason | TEXT | | 退选原因（截止后需医疗证明）|
| created_by | UUID | FK→users | |
| updated_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**subject_selections 元素结构：** `{ subject_code, subject_name, category, language, is_core, status(registered/withdrawn), seat_no? }`

**枚举 — dse_registration_status_enum：** `draft/prepared/late/submitted/hkeaa_confirmed/withdrawn/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (registration_id)；INDEX (batch_id)；INDEX (student_id)；INDEX (status)；INDEX (batch_id, student_id) UNIQUE
**外键：** (batch_id)→dse_exam_batches(id), (student_id)→students(id), (created_by)→users(id), (updated_by)→users(id)

---

### 表: exam_papers — 试卷 (新增, F-EXAM-002)

> 一份具体试卷实体，覆盖印刷、密封、存储、分发、使用、回收、销毁全生命周期（F-EXAM-002b~f）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| exam_id | UUID | FK→exams | 关联校内考试（可空，DSE 官方卷可不挂本校排期）|
| paper_code | VARCHAR(50) | NOT NULL | 试卷编码 |
| subject | VARCHAR(100) | NOT NULL | 科目 |
| paper_name | VARCHAR(200) | | 试卷标题（如 卷二）|
| paper_type | ENUM | NOT NULL DEFAULT 'normal' | paper_type_enum |
| print_quantity | INTEGER | NOT NULL DEFAULT 0 | 应印/实印数量 |
| supplier | VARCHAR(100) | | 印刷供应商 |
| order_no | VARCHAR(100) | | 印刷订单号（F-EXAM-002b）|
| seal_no | VARCHAR(100) | | 密封号码（F-EXAM-002c）|
| custody_chain | JSONB | DEFAULT '[]' | 保管链记录 |
| storage_location | ENUM | | paper_storage_enum（SAFE/ROOM/OTHER）|
| status | ENUM | NOT NULL | exam_paper_status_enum |
| destroy_approved_at | TIMESTAMPTZ | | 审批销毁时间 |
| destroy_approved_by | UUID | FK→users | 审批人 |
| remark | TEXT | | |
| created_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — paper_type_enum：** `normal/braille/large_print/separate_room`
**枚举 — paper_storage_enum：** `safe/room/other`
**枚举 — exam_paper_status_enum：** `required/print_ordered/printed/sealed/in_safe/distributed/used/returned/archived/destroyed/rejected/cancelled/lost`
**索引：** PRIMARY KEY (id)；INDEX (exam_id)；INDEX (subject)；INDEX (status)；UNIQUE (paper_code)
**外键：** (exam_id)→exams(id), (destroy_approved_by)→users(id), (created_by)→users(id)

---

### 表: exam_paper_requests — 试卷印刷申请 (新增, F-EXAM-002)

> 试卷需求统计与印刷申请（F-EXAM-002a/b）。记录每科/每班的应印需求与供应商订单状态。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| exam_id | UUID | FK→exams | 关联考试 |
| request_code | VARCHAR(50) | NOT NULL | 申请单号 |
| subject | VARCHAR(100) | NOT NULL | 科目 |
| class_id | UUID | FK→classes | 班级（可按班统计）|
| required_count | INTEGER | NOT NULL | 需求数量 |
| ordered_count | INTEGER | DEFAULT 0 | 下单数量 |
| supplier | VARCHAR(100) | | 供应商 |
| order_no | VARCHAR(100) | | 印刷订单号 |
| status | ENUM | NOT NULL DEFAULT 'draft' | paper_request_status_enum |
| approved_by | UUID | FK→users | 审批人 |
| created_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — paper_request_status_enum：** `draft/approved/ordered/received/cancelled`
**索引：** PRIMARY KEY (id)；INDEX (exam_id)；INDEX (class_id)；INDEX (status)
**外键：** (exam_id)→exams(id), (class_id)→classes(id), (approved_by)→users(id), (created_by)→users(id)

---

### 表: exam_paper_distributions — 试卷分发/回收记录 (新增, F-EXAM-002)

> 考试日分发、监考员签收，及考后回收记录（F-EXAM-002e/f）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| paper_id | UUID | FK→exam_papers, NOT NULL | 试卷 |
| exam_id | UUID | FK→exams | 考试 |
| invigilator_id | UUID | FK→users | 监考员 |
| distributed_at | TIMESTAMPTZ | | 分发时间 |
| distributed_count | INTEGER | DEFAULT 0 | 分发数量 |
| signature | VARCHAR(255) | | 签收凭证（手写/电子签名引用）|
| returned_at | TIMESTAMPTZ | | 回收时间 |
| returned_count | INTEGER | DEFAULT 0 | 回收数量 |
| return_status | ENUM | | paper_return_status_enum |
| destroyed_at | TIMESTAMPTZ | | 销毁时间 |
| note | TEXT | | |
| created_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — paper_return_status_enum：** `pending/partial/complete/missing`
**索引：** PRIMARY KEY (id)；INDEX (paper_id)；INDEX (invigilator_id)；INDEX (return_status)
**外键：** (paper_id)→exam_papers(id), (exam_id)→exams(id), (invigilator_id)→users(id), (created_by)→users(id)

---

### 表: special_exam_arrangements — 特别考试安排 (新增, F-EXAM-003)

> 特殊需要考生的考试安排单（额外时间/独立考场/抄写员/读卷员/盲文/轮椅通道等）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| arrangement_id | VARCHAR(50) | NOT NULL, UNIQUE | 安排单号（如 SEA-2026-S6-CHEM-001）|
| student_id | UUID | FK→students, NOT NULL | 学生 |
| exam_id | UUID | FK→exams | 关联考试 |
| subject | VARCHAR(100) | NOT NULL | 科目 |
| paper_name | VARCHAR(100) | | 试卷（如 卷二）|
| exam_date | DATE | | 考试日期 |
| sen_type | VARCHAR(50) | | SEN 类型（ASD/ADHD…）|
| sen_severity | VARCHAR(20) | | 严重程度 |
| arrangements | JSONB | NOT NULL DEFAULT '[]' | 安排明细数组 |
| status | ENUM | NOT NULL | special_arrangement_status_enum |
| approved_by | UUID | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | |
| hkeaa_approved | BOOLEAN | NOT NULL DEFAULT false | 是否需要并已获 HKEAA 审批 |
| created_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**arrangements 元素结构：** `{ type(EXTRA_TIME/SEP_ROOM/SCRIBE/READER/BRAILLE/WHEELCHAIR), description, duration_extension?, room?, invigilator_assigned?, approval_ref?, status }`

**枚举 — special_arrangement_status_enum：** `draft/pending_approval/approved/active/completed/rejected/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (arrangement_id)；INDEX (student_id)；INDEX (exam_id)；INDEX (status)
**外键：** (student_id)→students(id), (exam_id)→exams(id), (approved_by)→users(id), (created_by)→users(id)

---

### 表: special_arrangement_approvals — 特别安排审批记录 (新增, F-EXAM-003)

> 特别安排的审批步骤，支持学校级与 HKEAA 级多级审批。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| arrangement_id | UUID | FK→special_exam_arrangements, NOT NULL | 安排单 |
| approver_type | ENUM | NOT NULL | approval_authority_enum（school/hkeaa）|
| approval_level | INTEGER | NOT NULL DEFAULT 1 | 审批级别 |
| action | ENUM(string) | NOT NULL | approve/reject |
| approval_ref | VARCHAR(100) | | 外部审批引用（HKEAA）|
| approver_id | UUID | FK→users | 校内审批人（HKEAA 可为空）|
| approved_at | TIMESTAMPTZ | NOT NULL | |
| comment | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — approval_authority_enum：** `school/hkeaa`
**索引：** PRIMARY KEY (id)；INDEX (arrangement_id)；INDEX (approver_type)
**外键：** (arrangement_id)→special_exam_arrangements(id) ON DELETE CASCADE, (approver_id)→users(id)

---

### 表: report_card_batches — 成绩单批次 (新增, F-EXAM-004)

> 一个班级/年级/学年学期的一次成绩单生成与发布批次（RC-xxx）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_code | VARCHAR(50) | NOT NULL, UNIQUE | 批次号（如 RC-2026-S1-TERM1-001）|
| academic_year | VARCHAR(9) | NOT NULL | 学年 |
| term | VARCHAR(10) | NOT NULL | 学期 |
| scope_type | ENUM | NOT NULL | report_scope_enum（class/grade_level/school）|
| class_ids | JSONB | DEFAULT '[]' | 班级ID数组（按班）|
| grade_levels | JSONB | DEFAULT '[]' | 年级数组（按年级）|
| grade_record_ids | JSONB | DEFAULT '[]' | 汇总来源的 grade_records.id 快照 |
| total_students | INTEGER | NOT NULL DEFAULT 0 | 应生成学生数 |
| ai_comment_enabled | BOOLEAN | NOT NULL DEFAULT true | 是否启用 AI 评语 |
| watermark_enabled | BOOLEAN | NOT NULL DEFAULT true | 是否 PDF 加水印 |
| status | ENUM | NOT NULL | report_card_batch_status_enum |
| approx_deadline | DATE | | 审核截止（next_deadline）|
| teacher_comments_done | INTEGER | DEFAULT 0 | 教师评语完成数 |
| principal_approved_done | INTEGER | DEFAULT 0 | 校长审核完成数 |
| pdf_ready_at | TIMESTAMPTZ | | PDF 就绪时间 |
| published_at | TIMESTAMPTZ | | 发布时间 |
| publish_request_id | UUID | FK→grade_publish_requests | 关联发布请求（复用既有发布审批）|
| created_by | UUID | FK→users | |
| updated_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — report_scope_enum：** `class/grade_level/school`
**枚举 — report_card_batch_status_enum：** `draft/generating/pending_approval/approved/pdf_ready/published/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (batch_code)；INDEX (academic_year, term)；INDEX (scope_type)；INDEX (status)
**外键：** (publish_request_id)→grade_publish_requests(id), (created_by)→users(id), (updated_by)→users(id)

---

### 表: report_cards — 成绩单 (新增, F-EXAM-004)

> 单个学生的最终成绩单（报告卡），含各科成绩、等级、排名、评语，是发布与 PDF 生成的源。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | FK→report_card_batches, NOT NULL | 批次 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| grade_record_id | UUID | FK→grade_records | 来源成绩记录 |
| subjects | JSONB | NOT NULL DEFAULT '[]' | 各科快照 |
| overall_score | NUMERIC(5,2) | NOT NULL | 加权总分 |
| class_rank | INTEGER | | 班内排名 |
| grade_rank | INTEGER | | 年级排名 |
| conduct_grade | VARCHAR(5) | | 操行等级 |
| attendance_rate | VARCHAR(10) | | 出席率 |
| comment_json | JSONB | DEFAULT '{}' | AI 生成 + 人工可修正评语 |
| status | ENUM | NOT NULL | report_card_status_enum |
| submitted_at | TIMESTAMPTZ | | 教师提交时间（进入自撤回窗口起点）|
| pdf_url | VARCHAR(255) | | 生成 PDF 地址 |
| last_rank_compare | JSONB | DEFAULT '{}' | 上次排名对比（历史批次）|
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**subjects 元素结构：** `{ subject, score, grade, class_rank, class_avg, teacher_comment?, weight? }`
**枚举 — report_card_status_enum：** `draft/submitted/pending_approval/approved/published`
**索引：** PRIMARY KEY (id)；INDEX (batch_id)；INDEX (student_id)；UNIQUE (batch_id, student_id)
**外键：** (batch_id)→report_card_batches(id) ON DELETE CASCADE, (student_id)→students(id), (grade_record_id)→grade_records(id)

---

### 表: report_card_approvals — 成绩单审核记录 (新增, F-EXAM-004)

> 成绩单批准流程记录（教研组长 L1 审核 / 校长或副校长 L2 审批）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | FK→report_card_batches, NOT NULL | 批次 |
| approver_id | UUID | FK→users, NOT NULL | 审批人 |
| approval_level | INTEGER | NOT NULL | 1=教研组长, 2=校长/副校长 |
| action | ENUM(string) | NOT NULL | approve/reject |
| comment | TEXT | | |
| previous_status | VARCHAR(30) | | 前状态 |
| new_status | VARCHAR(30) | | 后状态 |
| approved_at | TIMESTAMPTZ | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id)；INDEX (batch_id)；INDEX (approver_id)；INDEX (approval_level)
**外键：** (batch_id)→report_card_batches(id) ON DELETE CASCADE, (approver_id)→users(id)

---

### 表: report_card_revokes — 成绩单教师自撤回记录 (新增, F-EXAM-004)

> 教师提交后在 48 小时内自行撤回成绩单的审计记录；触发「成绩撤回审计告警」。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| report_card_id | UUID | FK→report_cards, NOT NULL | 被撤回成绩单 |
| batch_id | UUID | FK→report_card_batches | 批次 |
| teacher_id | UUID | FK→users, NOT NULL | 撤回教师 |
| original_score | JSONB | | 撤回前成绩快照 |
| reason | TEXT | NOT NULL | 撤回理由（必填）|
| revoked_at | TIMESTAMPTZ | NOT NULL | 撤回时间戳 |
| alert_ref | UUID | FK→grade_audit_alerts | 关联审计告警（grade_revoked）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id)；INDEX (report_card_id)；INDEX (teacher_id)；INDEX (revoked_at)
**外键：** (report_card_id)→report_cards(id) ON DELETE CASCADE, (batch_id)→report_card_batches(id), (teacher_id)→users(id), (alert_ref)→grade_audit_alerts(id)

---

### 表: audit_logs — 审计日志 (扩展 §4.3，本模块新增 audit_action 值)

> 沿用 §4.3 `audit_logs` 表结构，不重复建表；为 F-EXAM-001~004 扩展 `audit_action` 枚举值（追加到 §7.6 / 既有 audit_action 集合）。

**新增 audit_action 值：**
```
dse_batch_created, dse_batch_opened, dse_batch_closed, dse_batch_submitted, dse_batch_confirmed,
dse_registration_created, dse_registration_submitted, dse_registration_withdrawn, dse_registration_cancelled,
paper_request_created, paper_request_approved, paper_sealed, paper_distributed, paper_returned, paper_destroyed, paper_lost,
special_arrangement_created, special_arrangement_approved, special_arrangement_rejected,
report_card_batch_generated, report_card_submitted, report_card_revoked, report_card_approved, report_card_published
```

**附加 metadata 约定：** batch_type（dse/exam/paper/special/report_card）, entity_id, entity_type, revoke_reason（成绩自撤回，必填）, hkeaa_ref（报考确认）


---

## 模块 19: 注册与收生管理模块 (Module 19 - Enrollment & Admissions, F-ENRL-001~003, F-ADM-001~002, Issue #358)

> 🔧 **补全说明（Issue #358）**：为 F-ENRL-001（新生注册）、F-ENRL-002（AI 编班）、F-ENRL-003（课本分发）、F-ADM-001（SSPA 中一自行分配）、F-ADM-002（JUPAS 联招）新增表。
> 系统设计见 SPEC-SYSTEM-DESIGN §19，字段说明见 DATA-DICTIONARY §22，接口见 API-DESIGN §10。
> **边界**：本节只建收生业务专属表。既有 `students`/`academic_years`/`classes`/`class_allocations`/`student_id_sequences`（学生档案模块）复用，注册完成回写它们；既有 `users`/`audit_logs`（Module 16）复用鉴权与审计；既有 `dse_offer_tracking`/`dse_releases`（Module 12）承载放榜后 JUPAS 状态；既有 recruitment(教师招聘, DATA-DICTIONARY §16) 与本模块（学生收生）不交叉。以下表 `student_id`→`students(id)`，`class_id`→`classes(id)`，`academic_year_id`→`academic_years(id)`。

### 表: student_applications — 新生申请/注册 (新增, F-ENRL-001)

> 中一新生及转学生的报名申请与注册原始数据（含文件核验、SEN 披露、状态机）。注册完成后由 `enrolled_student_id` 关联写入 `students`。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| application_no | VARCHAR(30) | NOT NULL, UNIQUE | 申请编号（ENRL-YYYY-{S1|TR}-NNNN）|
| application_type | ENUM | NOT NULL | student_app_type_enum (s1_new / transfer) |
| academic_year_id | UUID | FK→academic_years, NOT NULL | 目标学年 |
| student_name_zh | VARCHAR(100) | NOT NULL | 中文姓名 |
| student_name_en | VARCHAR(100) | | 英文姓名 |
| date_of_birth | DATE | NOT NULL | 出生日期 |
| gender | ENUM | NOT NULL | student_gender_enum (male/female/other) |
| hk_id | VARCHAR(20) | | 香港身份证 |
| school_of_origin | VARCHAR(100) | | 原校（仅转学生）|
| parent_name | VARCHAR(100) | NOT NULL | 家长姓名 |
| parent_hkid | VARCHAR(20) | NOT NULL | 家长香港身份证 |
| parent_phone | VARCHAR(20) | NOT NULL | 联系电话 |
| parent_email | VARCHAR(255) | | 家长邮箱 |
| special_education_needs | BOOLEAN | NOT NULL DEFAULT false | 是否 SEN（自愿披露）|
| sen_details | TEXT | | SEN 详情（披露时）|
| documents | JSONB | NOT NULL DEFAULT '[]' | 文件清单（OCR 扫描件引用数组）|
| document_checklist | JSONB | NOT NULL DEFAULT '{}' | 文件核验清单（birth_certificate/hkid_copy/report_card/consent_form，各含 submitted/verified/missing）|
| application_deadline | DATE | NOT NULL | 注册截止日期 |
| application_date | DATE | NOT NULL | 申请日期 |
| status | ENUM | NOT NULL | student_app_status_enum (applied/screening/documents_verified/class_assigned/enrolled/rejected/withdrawn) |
| enrolled_student_id | UUID | FK→students | 注册完成后的学生主档 ID |
| registered_at | TIMESTAMPTZ | | 注册完成时间 |
| registered_by | UUID | FK→users | 注册经办人 |
| webSAMS_synced | BOOLEAN | NOT NULL DEFAULT false | 是否同步 WebSAMS |
| rejected_by | UUID | FK→users | 拒录人 |
| rejected_reason | TEXT | | 拒录原因 |
| rejected_at | TIMESTAMPTZ | | 拒录时间 |
| notes | TEXT | | 备注 |
| created_by | UUID | FK→users | 创建人 |
| updated_by | UUID | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — student_app_type_enum：** `s1_new/transfer`
**枚举 — student_app_status_enum：** `applied/screening/documents_verified/class_assigned/enrolled/rejected/withdrawn`
**索引：** PRIMARY KEY (id)；UNIQUE (application_no)；INDEX (academic_year_id)；INDEX (status)；INDEX (parent_hkid)
**外键：** (academic_year_id)→academic_years(id), (enrolled_student_id)→students(id), (registered_by)→users(id), (rejected_by)→users(id), (created_by)→users(id), (updated_by)→users(id)

---

### 表: student_application_links — 家长申请只读授权 (新增, F-ENRL-001)

> 家长门户只读查看孩子入学申请进度；单向授权，不开放修改。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| application_id | UUID | FK→student_applications, NOT NULL | 申请 ID |
| parent_user_id | UUID | FK→users, NOT NULL | 家长用户 ID |
| relation | VARCHAR(50) | NOT NULL | 与申请人关系（父亲/母亲/监护人）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id)；INDEX (application_id)；INDEX (parent_user_id)
**外键：** (application_id)→student_applications(id), (parent_user_id)→users(id)

---

### 表: class_allocation_batches — 编班批次 (新增, F-ENRL-002)

> 一次 AI 编班运行批次；固化权重配置、范围、状态与审批。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_code | VARCHAR(50) | NOT NULL, UNIQUE | 批次编码（ALLOC-YYYY-S1-NNN）|
| academic_year_id | UUID | FK→academic_years, NOT NULL | 学年 |
| grade_level | VARCHAR(20) | NOT NULL | 年级（如 S1）|
| num_classes | SMALLINT | NOT NULL | 班级数 |
| weights | JSONB | NOT NULL | 因子权重快照（gender_ratio/academic_ability/sen_students/sibling_conflict/school_origin/special_talent）|
| candidate_student_ids | UUID[] | NOT NULL DEFAULT '{}' | 候选学生 ID 集合 |
| status | ENUM | NOT NULL | alloc_batch_status_enum (draft/computed/reviewing/approved/effective/archived) |
| balance_score | NUMERIC(5,2) | | 平衡度得分 0-100 |
| approved_by | UUID | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | 审批时间 |
| effective_at | TIMESTAMPTZ | | 生效（回写 class_allocations）时间 |
| created_by | UUID | FK→users | 创建人 |
| updated_by | UUID | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — alloc_batch_status_enum：** `draft/computed/reviewing/approved/effective/archived`
**索引：** PRIMARY KEY (id)；UNIQUE (batch_code)；INDEX (academic_year_id)；INDEX (status)
**外键：** (academic_year_id)→academic_years(id), (approved_by)→users(id), (created_by)→users(id), (updated_by)→users(id)

---

### 表: class_allocation_results — 编班结果明细 (新增, F-ENRL-002)

> 批次内每位学生的建议班级与触发条件；AI 建议阶段 CRUD，审批后由系统回写 `class_allocations`。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | FK→class_allocation_batches, NOT NULL | 批次 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| suggested_class_id | UUID | FK→classes, NOT NULL | 建议班级 |
| final_class_id | UUID | FK→classes | 生效班级（审批后回写）|
| ai_rationale | JSONB | | AI 说明（gender_ratio/sen_count/academic_ability_score 等）|
| adjusted_by | UUID | FK→users | 人工微调操作人 |
| adjusted_at | TIMESTAMPTZ | | 人工微调时间 |
| adjustment_note | TEXT | | 微调说明 |
| applied | BOOLEAN | NOT NULL DEFAULT false | 是否已回写 class_allocations |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id)；UNIQUE (batch_id, student_id)；INDEX (suggested_class_id)；INDEX (applied)
**外键：** (batch_id)→class_allocation_batches(id), (student_id)→students(id), (suggested_class_id)→classes(id), (final_class_id)→classes(id), (adjusted_by)→users(id)

---

### 表: textbook_catalog — 课本目录 (新增, F-ENRL-003)

> 课堂用书目录，价格与书目字典；供分发批次同步单价。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| subject | VARCHAR(50) | NOT NULL | 科目（中文/英文/数学…）|
| title | VARCHAR(255) | NOT NULL | 完整书名 |
| isbn | VARCHAR(20) | | 国际标准书号 |
| edition | VARCHAR(50) | | 版本（含适用学年）|
| unit_price | NUMERIC(10,2) | NOT NULL | 单价（港币，2 位小数）|
| publisher | VARCHAR(100) | | 出版社 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否可用 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id)；INDEX (subject)；INDEX (isbn)；INDEX (is_active)

---

### 表: textbook_batches — 课本批次 (新增, F-ENRL-003)

> 每学年采购批次（对应 SPEC TXTBK-BATCH-YYYY-NNN），关联供应商便于退换追溯。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_code | VARCHAR(50) | NOT NULL, UNIQUE | 批次编码（TXTBK-BATCH-YYYY-NNN）|
| academic_year | VARCHAR(9) | NOT NULL | 学年度（如 2026-2027）|
| supplier_name | VARCHAR(100) | | 供应商（如 永锋书局）|
| status | ENUM | NOT NULL | textbook_batch_status_enum (draft/ordered/arrived/distributing/archived) |
| ordered_at | TIMESTAMPTZ | | 下单时间 |
| arrived_at | TIMESTAMPTZ | | 到货时间 |
| created_by | UUID | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — textbook_batch_status_enum：** `draft/ordered/arrived/distributing/archived`
**索引：** PRIMARY KEY (id)；UNIQUE (batch_code)；INDEX (academic_year)；INDEX (status)
**外键：** (created_by)→users(id)

---

### 表: textbook_inventory_items — 课本批次库存 (新增, F-ENRL-003)

> 批次-书目库存；分发扣减、退回回补、报废核减。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | FK→textbook_batches, NOT NULL | 批次 |
| catalog_id | UUID | FK→textbook_catalog, NOT NULL | 书目 |
| barcode | VARCHAR(50) | | 课本条码（可扫描录入）|
| quantity_in | INTEGER | NOT NULL DEFAULT 0 | 入库数量 |
| quantity_out | INTEGER | NOT NULL DEFAULT 0 | 已分发数量 |
| quantity_returned | INTEGER | NOT NULL DEFAULT 0 | 退回数量 |
| quantity_scrapped | INTEGER | NOT NULL DEFAULT 0 | 报废数量 |
| unit_price | NUMERIC(10,2) | NOT NULL | 单价（从目录同步快照）|
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引：** PRIMARY KEY (id)；UNIQUE (batch_id, catalog_id)
**外键：** (batch_id)→textbook_batches(id), (catalog_id)→textbook_catalog(id)

---

### 表: textbook_distributions — 课本分发记录 (新增, F-ENRL-003)

> 单生单科分发/退换记录，是课本全流程核心。费用独立结算，不复用学费表。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| distribution_id | VARCHAR(50) | NOT NULL, UNIQUE | 分发编号（TXTBK-{学年}-{班级}-{序号}）|
| batch_id | UUID | FK→textbook_batches, NOT NULL | 课本批次 |
| academic_year | VARCHAR(9) | NOT NULL | 学年 |
| class_id | UUID | FK→classes, NOT NULL | 班级 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| catalog_id | UUID | FK→textbook_catalog, NOT NULL | 书目 |
| subject | VARCHAR(50) | NOT NULL | 科目 |
| isbn | VARCHAR(20) | | ISBN（冗余）|
| unit_price | NUMERIC(10,2) | NOT NULL | 单价 |
| quantity | INTEGER | NOT NULL DEFAULT 1 | 数量 |
| discount_percent | NUMERIC(5,2) | NOT NULL DEFAULT 0 | 折扣百分比（0-100）|
| distribution_status | ENUM | NOT NULL | txtbk_dist_status_enum (pending/distributed/replaced/returned) |
| distributed_at | TIMESTAMPTZ | | 分发时间 |
| distributed_by | UUID | FK→users | 分发员工 |
| payment_status | ENUM | NOT NULL | payment_status_enum (paid/unpaid/waived) |
| payment_method | ENUM | | payment_method_enum (cash/fps/octopus/e_payment/school_award) |
| amount_due | NUMERIC(10,2) | NOT NULL DEFAULT 0.00 | 应付金额（数量×单价×折扣）|
| amount_paid | NUMERIC(10,2) | NOT NULL DEFAULT 0.00 | 已付金额 |
| barcode | VARCHAR(50) | | 课本条码 |
| invoice_id | UUID | FK→fee_records | 关联收款记录（F-FEE-001 联动，可空）|
| approval_required | BOOLEAN | NOT NULL DEFAULT false | 是否需特殊审批（>30 天等）|
| approved_by | UUID | FK→users | 特批人 |
| return_reason | TEXT | | 退换原因（returned/replaced 时）|
| return_refund_amount | NUMERIC(10,2) | | 退货退款金额（原价 80%）|
| notes | TEXT | | 备注 |
| created_by | UUID | FK→users | 创建人 |
| updated_by | UUID | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — txtbk_dist_status_enum：** `pending/distributed/replaced/returned`（关联历史：原记录 marked replaced/returned，新记录 distributed，不重复收费）
**枚举 — payment_status_enum：** `paid/unpaid/waived`
**枚举 — payment_method_enum：** `cash/fps/octopus/e_payment/school_award`
**索引：** PRIMARY KEY (id)；UNIQUE (distribution_id)；INDEX (student_id, academic_year)；INDEX (class_id, academic_year)；INDEX (batch_id)；INDEX (distribution_status)；INDEX (payment_status)
**外键：** (batch_id)→textbook_batches(id), (class_id)→classes(id), (student_id)→students(id), (catalog_id)→textbook_catalog(id), (distributed_by)→users(id), (invoice_id)→fee_records(id), (approved_by)→users(id), (created_by)→users(id), (updated_by)→users(id)

---

### 表: sspa_batches — SSPA 自行分配批次 (新增, F-ADM-001)

> 每年度中一自行分配窗口；固化评分权重与阶段状态。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| year | VARCHAR(9) | NOT NULL, UNIQUE | 年度（如 2026-2027）|
| name | VARCHAR(100) | NOT NULL | 批次名称 |
| scoring_weights | JSONB | NOT NULL | 评分权重（学业30/面试30/兄弟10/校友5/成就10/酌情15）|
| seats | SMALLINT | NOT NULL | 学额 |
| open_at | DATE | | 申请表开放日 |
| interview_date | DATE | | 面试日 |
| announcement_date | DATE | | 公布日期 |
| status | ENUM | NOT NULL | sspa_batch_status_enum (draft/open/scoring/announced/registered/archived) |
| created_by | UUID | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — sspa_batch_status_enum：** `draft/open/scoring/announced/registered/archived`
**索引：** PRIMARY KEY (id)；UNIQUE (year)；INDEX (status)
**外键：** (created_by)→users(id)

---

### 表: sspa_applications — SSPA 申请 (新增, F-ADM-001)

> 自行分配学位申请主表；计分定序、正取/备取、EDB 结果、注册确认。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | FK→sspa_batches, NOT NULL | 批次 |
| application_no | VARCHAR(30) | NOT NULL, UNIQUE | 申请编号（SSPA-YYYY-NNNN）|
| application_id | UUID | FK→student_applications | 关联新生申请（可空，转正后回填）|
| student_name_zh | VARCHAR(100) | NOT NULL | 学生名 |
| date_of_birth | DATE | NOT NULL | 出生日期 |
| hk_id | VARCHAR(20) | | 学生身份证 |
| parent_name | VARCHAR(100) | NOT NULL | 家长名 |
| parent_phone | VARCHAR(20) | NOT NULL | 联系电话 |
| school_of_origin | VARCHAR(100) | | 原学校 |
| sibling_enrolled | BOOLEAN | NOT NULL DEFAULT false | 兄弟姐妹在校 |
| parent_alumni | BOOLEAN | NOT NULL DEFAULT false | 家长校友 |
| other_achievements | TEXT | | 其他成就说明 |
| total_score | NUMERIC(6,2) | | 总分（自动汇总）|
| rank | INTEGER | | 排序名次 |
| result | ENUM | | sspa_result_enum (accepted/waitlist/rejected) |
| edb_result | ENUM | | sspa_edb_enum (offered/not_offered/pending) |
| offer_confirmed | BOOLEAN | NOT NULL DEFAULT false | 正取是否确认 |
| confirmed_at | TIMESTAMPTZ | | 确认时间 |
| status | ENUM | NOT NULL | sspa_app_status_enum (applied/screened/scored/offered/confirmed/registered/withdrawn) |
| created_by | UUID | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — sspa_result_enum：** `accepted/waitlist/rejected`
**枚举 — sspa_edb_enum：** `offered/not_offered/pending`
**枚举 — sspa_app_status_enum：** `applied/screened/scored/offered/confirmed/registered/withdrawn`
**索引：** PRIMARY KEY (id)；UNIQUE (application_no)；INDEX (batch_id)；INDEX (result)；INDEX (status)
**外键：** (batch_id)→sspa_batches(id), (application_id)→student_applications(id), (created_by)→users(id)

---

### 表: sspa_scores — SSPA 评分明细 (新增, F-ADM-001)

> 每位申请在各评分准则下的分项分数与评分人。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| application_id | UUID | FK→sspa_applications, NOT NULL | 申请 |
| criterion | ENUM | NOT NULL | sspa_criterion_enum (academic/interview/sibling/alumni/achievement/principal_discretion) |
| score | NUMERIC(5,2) | NOT NULL | 分项得分 |
| max_score | NUMERIC(5,2) | NOT NULL | 该准则最高分 |
| scored_by | UUID | FK→users | 评分人 |
| note | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — sspa_criterion_enum：** `academic/interview/sibling/alumni/achievement/principal_discretion`（默认最高 30/30/10/5/10/15）
**索引：** PRIMARY KEY (id)；UNIQUE (application_id, criterion)；INDEX (scored_by)
**外键：** (application_id)→sspa_applications(id), (scored_by)→users(id)

---

### 表: jupas_applications — JUPAS 申请 (新增, F-ADM-002)

> 中六学生 JUPAS 联招申请主表（申请期数据）。放榜后状态由 `dse_offer_tracking.jupas_status` 承载。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| jupas_id | VARCHAR(50) | NOT NULL, UNIQUE | 记录编号（JUPAS-YYYY-S6-NNNNN）|
| academic_year | VARCHAR(9) | NOT NULL | 学年 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| jupas_application_no | VARCHAR(30) | NOT NULL | JUPAS 申请编号 |
| choices_count | SMALLINT | NOT NULL DEFAULT 0 | 志愿数 |
| school_reference_status | ENUM | NOT NULL | jupas_ref_status_enum (pending/in_progress/submitted) |
| submission_deadline | DATE | | 学校推荐提交截止 |
| status | ENUM | NOT NULL | jupas_app_status_enum (collecting/draft/submitted/announced/archived) |
| created_by | UUID | FK→users | 创建人 |
| updated_by | UUID | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — jupas_ref_status_enum：** `pending/in_progress/submitted`
**枚举 — jupas_app_status_enum：** `collecting/draft/submitted/announced/archived`
**索引：** PRIMARY KEY (id)；UNIQUE (jupas_id)；INDEX (academic_year)；INDEX (student_id)；INDEX (status)
**外键：** (student_id)→students(id), (created_by)→users(id), (updated_by)→users(id)

---

### 表: jupas_choices — JUPAS 志愿 (新增, F-ADM-002)

> 学生 JUPAS 志愿选择（优先级、院校、课程）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| application_id | UUID | FK→jupas_applications, NOT NULL | 申请 |
| priority | SMALLINT | NOT NULL | 志愿优先级（1 最高）|
| institution | VARCHAR(100) | NOT NULL | 院校（香港大學…）|
| program | VARCHAR(150) | NOT NULL | 课程名称 |
| program_code | VARCHAR(30) | NOT NULL | 课程代码（JS4013…）|
| status | ENUM | NOT NULL | jupas_choice_status_enum (draft/confirmed/applied/offered/declined) |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — jupas_choice_status_enum：** `draft/confirmed/applied/offered/declined`
**索引：** PRIMARY KEY (id)；UNIQUE (application_id, priority)；INDEX (program_code)
**外键：** (application_id)→jupas_applications(id)

---

### 表: jupas_reference_letters — JUPAS 推荐信 (新增, F-ADM-002)

> 教师/校长推荐信，含 AI 辅助写作元数据与审批状态。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| application_id | UUID | FK→jupas_applications, NOT NULL | 申请 |
| letter_type | ENUM | NOT NULL | jupas_letter_type_enum (teacher/principal/school) |
| teacher_id | UUID | FK→users, NOT NULL | 撰写教师/校长 |
| subject | VARCHAR(50) | | 任教科目（教师信）|
| content | TEXT | | 推荐信正文 |
| word_count | INTEGER | | 字数 |
| status | ENUM | NOT NULL | jupas_letter_status_enum (draft/in_review/submitted/returned) |
| ai_suggestion | JSONB | | AI 写作大纲建议（三段，脱敏参考）|
| letter_stats | JSONB | | 字数/最低字数提示/术语一致性结果 |
| deadline | DATE | | 截止日期 |
| submitted_at | TIMESTAMPTZ | | 提交时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — jupas_letter_type_enum：** `teacher/principal/school`
**枚举 — jupas_letter_status_enum：** `draft/in_review/submitted/returned`
**索引：** PRIMARY KEY (id)；INDEX (application_id)；INDEX (teacher_id)；INDEX (status)
**外键：** (application_id)→jupas_applications(id), (teacher_id)→users(id)

---

### 表: jupas_appeals — JUPAS 上诉 (新增, F-ADM-002)

> 学生对 JUPAS 申请/结果的上诉处理。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| application_id | UUID | FK→jupas_applications, NOT NULL | 申请 |
| reason | TEXT | NOT NULL | 上诉理由 |
| evidence | JSONB | DEFAULT '[]' | 证据文件引用数组 |
| status | ENUM | NOT NULL | jupas_appeal_status_enum (received/under_review/resolved/dismissed) |
| reviewed_by | UUID | FK→users | 复核人 |
| resolution | TEXT | | 处理结果 |
| resolved_at | TIMESTAMPTZ | | 处理时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — jupas_appeal_status_enum：** `received/under_review/resolved/dismissed`
**索引：** PRIMARY KEY (id)；INDEX (application_id)；INDEX (status)
**外键：** (application_id)→jupas_applications(id), (reviewed_by)→users(id)

---

### 审计日志扩展（F-ENRL-001~003, F-ADM-001~002）

> 沿用 §4.3 `audit_logs` 表结构；为收生模块扩展 `audit_action` 枚举值。

**新增 audit_action 值：**
```
enrl_application_created, enrl_application_verified, enrl_application_rejected, enrl_application_withdrawn, enrl_registration_completed,
alloc_batch_created, alloc_ai_computed, alloc_adjusted, alloc_approved, alloc_effective,
txtbk_batch_created, txtbk_arrived, txtbk_distributed, txtbk_replaced, txtbk_returned, txtbk_refunded, txtbk_archived,
sspa_batch_created, sspa_score_added, sspa_result_announced, sspa_offer_confirmed,
jupas_app_created, jupas_choice_updated, jupas_letter_submitted, jupas_appeal_filed, jupas_appeal_resolved
```

**附加 metadata 约定：** entity_type（student_application/alloc_batch/txtbk/sspa/jupas）, entity_id, batch_code, approval_required, principal_discretion_used

---

## 模块 20: 财务与学年结算管理模块 (Module 20 - Fee & Year-End Settlement, F-FEE-001, F-FIN-002, F-YREND-001/002, Issue #359)

> 🔧 **补全说明（Issue #359）**：为 F-FEE-001（每日收费追踪）、F-FIN-002（零用现金报销）、F-YREND-001（档案清理与销毁）、F-YREND-002（学年财务结算）新增表。
> 系统设计见 SPEC-SYSTEM-DESIGN §20，字段说明见 DATA-DICTIONARY §23，接口见 API-DESIGN §11。
> **边界**：本节只建财务/学年结算业务专属表。既有 `fees`/`fee_types`/`fee_records`（§4.7）承载 F-FIN-001 学费/堂费长期账户；`tuition_payments`/`installment_plans` 承载分期/欠费；`textbook_distributions`（§19）课本收款独立；`witness_verifications`/`witness_steps`（§17）双人见证复用；`users`/`audit_logs`（Module 16）复用鉴权与审计。以下表 `student_id`→`students(id)`，`academic_year_id`→`academic_years(id)`，`witness_verification_id`→`witness_verifications(id)`，`created_by/updated_by`→`users(id)`。

### 表: fee_types — 收费项目（增强既有，衔接 F-FEE-001）

> 既有 §4.7 `fees` 承载学费/堂费长周期费用；本节 `fee_types` 承载 F-FEE-001 日常一次性收费项目（冷气/活动/物料/其他）。若 DEV 选择扩展既有 `fees` 而非新建 `fee_types`，则以既有表 + `category`(air_con/activity/material/other) 落地，本节字段并入。字段命名沿用既有 `fees` 约定。以下为推荐字段（新建或并入既有表）：

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| code | VARCHAR(30) | NOT NULL, UNIQUE | 项目代码（air_con/activity/material/other，或自定义） |
| name | VARCHAR(100) | NOT NULL | 项目名称 |
| description | TEXT | | 说明 |
| default_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 默认单价 |
| category | ENUM | NOT NULL | fee_category_enum (daily/tuition/subsidy/textbook) |
| academic_year_id | UUID | FK→academic_years, NOT NULL | 所属学年 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — fee_category_enum：** `daily/tuition/subsidy/textbook`
**索引：** PRIMARY KEY (id)；UNIQUE (code)；INDEX (category)；INDEX (academic_year_id)
**外键：** (academic_year_id)→academic_years(id)

---

### 表: fee_records — 每日收费交易流水（增强既有，衔接 F-FEE-001）

> 既有 §4.7 `fee_records` 已存缴费记录；本节补充 F-FEE-001 交易所需字段（收据号、见证、第三方处理中间态、电子收据推送）。推荐在既有 `fee_records` 上扩展字段而非新建表：

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| fee_type_id | UUID | FK→fee_types, NOT NULL | 收费项目 |
| amount | NUMERIC(12,2) | NOT NULL | 应缴金额 |
| paid_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 已缴金额 |
| payment_method | ENUM | NOT NULL | payment_method_enum (cash/cheque/fps/octopus/e_payment) |
| payment_status | ENUM | NOT NULL DEFAULT 'paid' | fee_payment_status_enum (paid/submitted/pending/refunded) |
| status_stale | BOOLEAN | NOT NULL DEFAULT false | 第三方支付>10min未更新标记 |
| receipt_no | VARCHAR(30) | UNIQUE | 收据号（RCPT-YYYYMMDD-NNNN） |
| witness_verification_id | UUID | FK→witness_verifications | 现金双人见证单（现金交易必填） |
| collected_by | UUID | FK→users, NOT NULL | 经办人 |
| academic_year_id | UUID | FK→academic_years | 学年 |
| collected_at | TIMESTAMPTZ | NOT NULL | 收取时间 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — fee_payment_status_enum：** `paid/submitted/pending/refunded`（submitted=第三方处理中）
**索引：** PRIMARY KEY (id)；UNIQUE (receipt_no)；INDEX (student_id)；INDEX (fee_type_id)；INDEX (payment_status)；INDEX (collected_at)
**外键：** (student_id)→students(id), (fee_type_id)→fee_types(id), (witness_verification_id)→witness_verifications(id), (collected_by)→users(id), (academic_year_id)→academic_years(id)

---

### 表: receipts — 收据（新增, F-FEE-001）

> 每笔收费出具收据；电子收据自动推送（App/邮件，短信备用）记录推送状态。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| receipt_no | VARCHAR(30) | NOT NULL, UNIQUE | 收据号（RCPT-YYYYMMDD-NNNN） |
| fee_record_id | UUID | FK→fee_records, NOT NULL | 关联收费流水 |
| student_id | UUID | FK→students, NOT NULL | 学生 |
| amount | NUMERIC(12,2) | NOT NULL | 金额 |
| payment_method | ENUM | NOT NULL | payment_method_enum |
| pdf_url | VARCHAR(500) | | 电子收据 PDF 引用 |
| push_status | ENUM | NOT NULL DEFAULT 'pending' | receipt_push_status_enum (pending/sent/failed/skipped) |
| push_channels | JSONB | NOT NULL DEFAULT '{}' | 各渠道状态（app/email/sms 含 timestamp/status） |
| issued_by | UUID | FK→users, NOT NULL | 出据人 |
| issued_at | TIMESTAMPTZ | NOT NULL | 出据时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — receipt_push_status_enum：** `pending/sent/failed/skipped`
**索引：** PRIMARY KEY (id)；UNIQUE (receipt_no)；INDEX (fee_record_id)；INDEX (student_id)
**外键：** (fee_record_id)→fee_records(id), (student_id)→students(id), (issued_by)→users(id)

---

### 表: daily_reconciliations — 每日对账（新增, F-FEE-001）

> 每日营业结束日结对账；现金双人见证核实；差异>HK$50 调查。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| reconciliation_date | DATE | NOT NULL, UNIQUE | 对账日期 |
| academic_year_id | UUID | FK→academic_years | 学年 |
| total_collected | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 实收合计 |
| transaction_count | INTEGER | NOT NULL DEFAULT 0 | 交易笔数 |
| by_type | JSONB | NOT NULL DEFAULT '{}' | 按 fee_type 汇总 |
| by_method | JSONB | NOT NULL DEFAULT '{}' | 按 payment_method 汇总 |
| expected_total | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 账面应收 |
| discrepancy | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 差异金额 |
| cash_verified | BOOLEAN | NOT NULL DEFAULT false | 现金是否双人核实 |
| witness_1_id | UUID | FK→users | 见证人1 |
| witness_2_id | UUID | FK→users | 见证人2 |
| receipts_issued | INTEGER | NOT NULL DEFAULT 0 | 出具收据数 |
| status | ENUM | NOT NULL DEFAULT 'open' | reconciliation_status_enum (open/reviewing/balanced/investigating/reopened) |
| closed_by | UUID | FK→users | 关账人 |
| closed_at | TIMESTAMPTZ | | 关账时间 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — reconciliation_status_enum：** `open/reviewing/balanced/investigating/reopened`
**索引：** PRIMARY KEY (id)；UNIQUE (reconciliation_date)；INDEX (status)
**外键：** (academic_year_id)→academic_years(id), (witness_1_id)→users(id), (witness_2_id)→users(id), (closed_by)→users(id)

---

### 表: petty_cash_configs — 备用金配置（新增, F-FIN-002）

> 零用现金限额、备用金上限与 CPI 动态限额快照；调整经校务主任确认生效。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| academic_year_id | UUID | FK→academic_years, NOT NULL | 学年 |
| base_single_limit | NUMERIC(12,2) | NOT NULL DEFAULT 3000 | 单笔基础限额 HK$3,000 |
| cpi_current | NUMERIC(10,2) | NOT NULL DEFAULT 1.00 | 当年 CPI 指数 |
| cpi_base | NUMERIC(10,2) | NOT NULL DEFAULT 1.00 | 基准 CPI 指数 |
| effective_single_limit | NUMERIC(12,2) | NOT NULL | 实际限额=base×(cpi_current/cpi_base) |
| float_cap | NUMERIC(12,2) | NOT NULL DEFAULT 5000 | 备用金上限 HK$5,000 |
| float_low_threshold | NUMERIC(12,2) | NOT NULL DEFAULT 500 | 备用金低额警示线 |
| config_status | ENUM | NOT NULL DEFAULT 'pending' | petty_cash_config_status_enum (pending/confirmed/archived) |
| confirmed_by | UUID | FK→users | 确认人（校务主任） |
| confirmed_at | TIMESTAMPTZ | | 确认时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — petty_cash_config_status_enum：** `pending/confirmed/archived`
**索引：** PRIMARY KEY (id)；INDEX (academic_year_id)；UNIQUE (academic_year_id)
**外键：** (academic_year_id)→academic_years(id), (confirmed_by)→users(id)

---

### 表: petty_cash_reimbursements — 零用现金报销申请（新增, F-FIN-002）

> 报销审批状态机；OCR 结果、见证、审批、出账全记录。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| transaction_no | VARCHAR(30) | NOT NULL, UNIQUE | 交易编号（PC-YYYYMMDD-NNNN） |
| applicant_id | UUID | FK→users, NOT NULL | 申请人（校务处同工） |
| amount | NUMERIC(12,2) | NOT NULL | 报销金额 |
| payee | VARCHAR(200) | NOT NULL | 收款方 |
| description | TEXT | | 支出说明 |
| category | VARCHAR(50) | | 支出类别（printing/stationery/transport/other） |
| receipt_url | VARCHAR(500) | | 收据图片 URL |
| ocr_result | JSONB | NOT NULL DEFAULT '{}' | OCR 结果（ocr_amount/ocr_status:match,mismatch,not_found/original_text） |
| ocr_status | ENUM | NOT NULL DEFAULT 'not_performed' | ocr_status_enum (not_performed/ok/failed/match/mismatch) |
| single_limit | NUMERIC(12,2) | NOT NULL | 提交时生效的单笔限额快照 |
| float_balance_before | NUMERIC(12,2) | | 提交时备用金余额 |
| witness_level | ENUM | NOT NULL DEFAULT 'single' | witness_level_enum (single/double/none) 依据金额与限额 |
| witness_verification_id | UUID | FK→witness_verifications | 见证单（金额>500 双人） |
| status | ENUM | NOT NULL DEFAULT 'draft' | petty_cash_status_enum |
| workflow_status | ENUM | NOT NULL DEFAULT 'draft' | petty_cash_workflow_status_enum (draft/ocra_pending/manual_amount/witness_required/witness_in_progress/pending_approval/approved/paid/rejected/cancelled/blocked) |
| approved_by | UUID | FK→users | 审批人（校务主任） |
| approved_at | TIMESTAMPTZ | | 审批时间 |
| rejection_reason | TEXT | | 拒绝原因 |
| paid_at | TIMESTAMPTZ | | 出账时间 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — ocr_status_enum：** `not_performed/ok/failed/match/mismatch`
**枚举 — witness_level_enum：** `single/double/none`
**枚举 — petty_cash_status_enum（兼容保留）：** `draft/ocra_pending/manual_amount/witness_required/witness_in_progress/pending_approval/approved/paid/rejected/cancelled/blocked`
**索引：** PRIMARY KEY (id)；UNIQUE (transaction_no)；INDEX (applicant_id)；INDEX (status)；INDEX (created_at)
**外键：** (applicant_id)→users(id), (witness_verification_id)→witness_verifications(id), (approved_by)→users(id)

---

### 表: petty_cash_transactions — 备用金流水（新增, F-FIN-002）

> 备用金余额 = Σ(补充 +) − Σ(报销支出 −)。承载备用金补充与报销出账。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| academic_year_id | UUID | FK→academic_years, NOT NULL | 学年 |
| tx_type | ENUM | NOT NULL | pq_tx_type_enum (top_up/expense) |
| amount | NUMERIC(12,2) | NOT NULL | 金额（top_up 正，expense 负） |
| reimbursement_id | UUID | FK→petty_cash_reimbursements | 关联报销（expense 时必填） |
| float_balance_after | NUMERIC(12,2) | NOT NULL | 交易后余额 |
| reference_no | VARCHAR(30) | | 备用金补充单号（衔接 F-FIN-001） |
| created_by | UUID | FK→users, NOT NULL | 经办人 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — pq_tx_type_enum：** `top_up/expense`
**索引：** PRIMARY KEY (id)；INDEX (academic_year_id)；INDEX (reimbursement_id)
**外键：** (academic_year_id)→academic_years(id), (reimbursement_id)→petty_cash_reimbursements(id), (created_by)→users(id)

---

### 表: year_end_settlements — 学年财务结算批次（新增, F-YREND-002）

> 年度财务结算批次；汇总各账源快照；只读冻结当年度账目。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| reconciliation_no | VARCHAR(30) | NOT NULL, UNIQUE | 结算编号（YREC-YYYY-YYYY） |
| fiscal_year | VARCHAR(9) | NOT NULL | 财政年度（2025-2026） |
| academic_year_id | UUID | FK→academic_years, NOT NULL | 学年 |
| summary | JSONB | NOT NULL DEFAULT '{}' | 汇总（total_fees_collected/total_expenses/net_balance/budget_variance） |
| by_category | JSONB | NOT NULL DEFAULT '[]' | 分项聚合（[category,budget,collected,outstanding]） |
| outstanding_fees | JSONB | NOT NULL DEFAULT '[]' | 挂账/欠费明细（含 sub_status） |
| total_fees_collected | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 费用实收合计 |
| total_expenses | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 支出合计 |
| net_balance | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 净结余 |
| budget_variance | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 预算差异 |
| report_pdf_url | VARCHAR(500) | | 结算 PDF 报表 |
| status | ENUM | NOT NULL DEFAULT 'draft' | yre_settlement_status_enum (draft/computing/ready_for_audit/locked/archived/suspended) |
| audited_by | UUID | FK→users | 审计确认人 |
| audited_at | TIMESTAMPTZ | | 审计确认时间 |
| locked_at | TIMESTAMPTZ | | 锁定时间 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — yre_settlement_status_enum：** `draft/computing/ready_for_audit/locked/archived/suspended`
**索引：** PRIMARY KEY (id)；UNIQUE (reconciliation_no)；UNIQUE (fiscal_year)；INDEX (status)
**外键：** (academic_year_id)→academic_years(id), (audited_by)→users(id), (created_by)→users(id)

---

### 表: archive_retention_policies — 档案保存期限策略（新增, F-YREND-001）

> EDB 保存期限配置化；归档扫描据此判定到期。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| retention_code | VARCHAR(50) | NOT NULL, UNIQUE | 策略代码（student_registration/transcripts/discipline/health/financial_receipts/meeting_minutes/employee_contract/graduation_photos） |
| doc_type | VARCHAR(100) | NOT NULL | 文档类型名 |
| retention_period_years | INTEGER | | 保存期限（年），NULL=永久 |
| retention_basis | VARCHAR(50) | NOT NULL | 起算基准（graduation/leave_school/termination/creation） |
| disposition | ENUM | NOT NULL | archive_disposition_enum (destroy/hand_over/keep) |
| hand_over_target | VARCHAR(100) | | 移交对象（如 校监，disposition=hand_over） |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — archive_disposition_enum：** `destroy/hand_over/keep`
**索引：** PRIMARY KEY (id)；UNIQUE (retention_code)
**外键：** 无

---

### 表: archive_cleanup_records — 档案归档/清理记录（新增, F-YREND-001）

> 档案到期处置记录；状态机 PENDING→REVIEW→APPROVED→DESTROYING/HANDING_OVER→DESTROYED/HANDED_OVER 或 HELD/REJECTED。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| retention_policy_id | UUID | FK→archive_retention_policies, NOT NULL | 策略 |
| source_entity_type | VARCHAR(100) | NOT NULL | 处置对象类型（students/transcripts/health_records/financial_records/contracts 等既有表引用） |
| source_entity_id | VARCHAR(64) | NOT NULL | 处置对象主键（引用既有表） |
| academic_year_id | UUID | FK→academic_years | 关联学年 |
| retention_due_date | DATE | NOT NULL | 到期日（按策略起算） |
| storage_url | VARCHAR(500) | | 文件存储引用（对象存储 URL） |
| disposition | ENUM | NOT NULL | archive_disposition_enum |
| status | ENUM | NOT NULL DEFAULT 'pending' | archive_cleanup_status_enum |
| reviewed_by | UUID | FK→users | 复核人 |
| reviewed_at | TIMESTAMPTZ | | 复核时间 |
| approved_by | UUID | FK→users | 审批人（校长/校务主任） |
| approved_at | TIMESTAMPTZ | | 审批时间 |
| witness_verification_id | UUID | FK→witness_verifications | 销毁双人见证单（destroy 时必填） |
| destroy_cert_no | VARCHAR(30) | | 销毁证书号（DSTR-YYYYMMDD-NNNN） |
| destroyed_at | TIMESTAMPTZ | | 销毁时间 |
| hand_over_target | VARCHAR(100) | | 移交对象 |
| hand_over_recipient | VARCHAR(100) | | 接收方/经办 |
| handed_over_at | TIMESTAMPTZ | | 移交时间 |
| hold_reason | TEXT | | 暂缓/保留原因 |
| rejected_reason | TEXT | | 否决原因 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 创建人（扫描任务/人工） |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — archive_cleanup_status_enum：** `pending/review/approved/destroying/destroyed/handing_over/handed_over/held/rejected`
**索引：** PRIMARY KEY (id)；INDEX (retention_policy_id)；INDEX (status)；INDEX (retention_due_date)；UNIQUE (source_entity_type, source_entity_id, retention_policy_id)
**外键：** (retention_policy_id)→archive_retention_policies(id), (academic_year_id)→academic_years(id), (reviewed_by)→users(id), (approved_by)→users(id), (witness_verification_id)→witness_verifications(id), (created_by)→users(id)

---

### 审计日志扩展（F-FEE-001, F-FIN-002, F-YREND-001/002）

> 沿用 §4.3 `audit_logs` 表结构；为财务与学年结算模块扩展 `audit_action` 枚举值。

**新增 audit_action 值：**
```
fee_record_created, fee_receipt_issued, fee_receipt_pushed, fee_transaction_stale,
recon_opened, recon_cash_verified, recon_balanced, recon_investigating, recon_reopened,
pc_config_confirmed, pc_claim_submitted, pc_ocr_done, pc_witness_completed, pc_approved, pc_rejected, pc_paid, pc_blocked, pc_float_top_up,
yre_batch_created, yre_computed, yre_audited, yre_locked, yre_archived, yre_suspended,
archive_scan_generated, archive_reviewed, archive_approved, archive_destroying, archive_destroyed, archive_handed_over, archive_held, archive_rejected
```

**附加 metadata 约定：** entity_type（fee_record/receipt/reconciliation/petty_cash/year_end_settlement/archive_cleanup）, entity_id, reconciliation_no, transaction_no, fiscal_year, destroy_cert_no, witness_required

## 模块 21: 资产与供应商管理模块 (Module 21 - Asset & Vendor Management, F-ASSET-001/002/003, F-VEND-001, Issue #360)

> 🔧 **补全说明（Issue #360）**：校产条码盘点（F-ASSET-001）、场地租借管理（F-ASSET-002）、设备保养管理（F-ASSET-003）、供应商注册与评估（F-VEND-001）。系统设计见 SPEC-SYSTEM-DESIGN §21，字段说明见 DATA-DICTIONARY §24，接口见 API-DESIGN §12。
> **边界**：既有 `assets`/`asset_rentals`（§4.x）已覆盖一般资产 CRUD 与按件借用归还；本节 **不重复** 一般资产借用，专注固定资产条码盘点、场地（venue）租借、设备保养计划/工单、供应商注册与评估四子域。以下表 `created_by`/`created_by_id`→`users(id)`，`academic_year_id`→`academic_years(id)`，`vendor_id`→`vendors(id)`，审计沿用 Module 16 `audit_logs`，双人见证沿用 §17 `witness_verifications`。
> 固定资产主档两种落地方式由 DEV 择一：① 新建 `fixed_assets`（下表）；② 扩展既有 `assets` 表加入 `is_fixed + barcode + location + responsible_person` 字段（字段并入下表固定部分）。场地租借（按时长+按金+保险）与既有 `asset_rentals`（按件借用）语义不同，独立 `venues`/`venue_rentals`。

---

### 表: fixed_assets — 固定资产主档（新增，F-ASSET-001）

> 条码级固定资产主档；承载校产类别/序列号/存放位置/责任人/价值/购入日期/供应商。若 DEV 选择扩展既有 `assets`，本表字段并入既有表（`code` 复用 `assets.code`）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| code | VARCHAR(30) | NOT NULL, UNIQUE | 资产条码（ASSET-YYYY-<类别>-<NNNN>）|
| name | VARCHAR(100) | NOT NULL | 资产名称 |
| category | ENUM | NOT NULL | fixed_asset_category_enum（10类，见枚举）|
| brand | VARCHAR(100) | | 品牌 |
| model | VARCHAR(100) | | 型号 |
| serial_no | VARCHAR(100) | | 序列号 |
| location | VARCHAR(200) | | 存放位置 |
| responsible_person_id | UUID | FK→users | 责任人 |
| purchase_value | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 购置价值（HKD）|
| purchase_date | DATE | | 购入日期 |
| vendor_id | UUID | FK→vendors | 供应商（衔接 F-VEND-001）|
| condition | ENUM | NOT NULL DEFAULT 'good' | fixed_asset_condition_enum (excellent/good/fair/poor) |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否在用 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 登记人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — fixed_asset_category_enum：** `fixed/electronics/furniture/musical_instrument/sports/laboratory/library/audio_visual/computer/network`
**枚举 — fixed_asset_condition_enum：** `excellent/good/fair/poor`
**索引：** PRIMARY KEY (id)；UNIQUE (code)；INDEX (category)；INDEX (location)；INDEX (responsible_person_id)；INDEX (vendor_id)
**外键：** (responsible_person_id)→users(id), (vendor_id)→vendors(id), (created_by)→users(id)

---

### 表: inventory_sessions — 盘点批次（新增，F-ASSET-001）

> 按年度/学期创建的盘点任务批次；圈定盘点范围并汇总盘点结果。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| session_no | VARCHAR(30) | NOT NULL, UNIQUE | 盘点批次号（INV-YYYY-ANNUAL-001）|
| name | VARCHAR(100) | NOT NULL | 批次名称 |
| academic_year_id | UUID | FK→academic_years | 学年 |
| scope | JSONB | NOT NULL DEFAULT '{}' | 盘点范围（category[]/location[]/responsible_person_id[]）|
| total_registered | INTEGER | NOT NULL DEFAULT 0 | 应盘资产数 |
| assets_verified | INTEGER | NOT NULL DEFAULT 0 | 实盘核对资产数 |
| verification_rate | NUMERIC(5,2) | NOT NULL DEFAULT 0 | 盘点率（%）|
| discrepancies | JSONB | NOT NULL DEFAULT '[]' | 差异清单汇总（missing/location_discrepancy/unknown）|
| condition_summary | JSONB | NOT NULL DEFAULT '{}' | 资产状况汇总（excellent/good/fair/poor count）|
| status | ENUM | NOT NULL DEFAULT 'draft' | inv_session_status_enum (draft/planning/in_progress/verifying/closed/cancelled)|
| planned_by | UUID | FK→users, NOT NULL | 规划人 |
| closed_by | UUID | FK→users | 结题人 |
| closed_at | TIMESTAMPTZ | | 结题时间 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — inv_session_status_enum：** `draft/planning/in_progress/verifying/closed/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (session_no)；INDEX (status)；INDEX (academic_year_id)
**外键：** (academic_year_id)→academic_years(id), (planned_by)→users(id), (closed_by)→users(id)

---

### 表: inventory_items — 盘点明细（新增，F-ASSET-001）

> 逐件资产盘点记录；圈定应盘资产，记录实盘结果与差异状态。`closed` 后明细只读。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| session_id | UUID | FK→inventory_sessions, NOT NULL | 盘点批次 |
| fixed_asset_id | UUID | FK→fixed_assets, NOT NULL | 应盘固定资产 |
| expected_location | VARCHAR(200) | | 登记存放位置（快照）|
| scan_code | VARCHAR(30) | | 实扫条码（条码不识别时为 null）|
| actual_location | VARCHAR(200) | | 实盘地点 |
| scan_result | ENUM | NOT NULL | inv_scanned_enum (scanned_matched/scanned_mismatch/missing/unknown) |
| condition | ENUM | | fixed_asset_condition_enum |
| investigation_status | ENUM | NOT NULL DEFAULT 'pending' | inv_investigation_enum (pending/resolved/closed) |
| investigated_by | UUID | FK→users | 调查人 |
| investigated_at | TIMESTAMPTZ | | 调查时间 |
| investigation_note | TEXT | | 调查结论 |
| scanned_by | UUID | FK→users | 扫码人 |
| scanned_at | TIMESTAMPTZ | | 扫码时间 |
| imported_from_batch | BOOLEAN | NOT NULL DEFAULT false | 是否离线批量导入 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — inv_scanned_enum：** `scanned_matched/scanned_mismatch/missing/unknown`
**枚举 — inv_investigation_enum：** `pending/resolved/closed`
**索引：** PRIMARY KEY (id)；UNIQUE (session_id, fixed_asset_id)；INDEX (session_id)；INDEX (fixed_asset_id)；INDEX (scan_result)
**外键：** (session_id)→inventory_sessions(id), (fixed_asset_id)→fixed_assets(id), (investigated_by)→users(id), (scanned_by)→users(id)

---

### 表: venues — 场地档案（新增，F-ASSET-002）

> 校内可租借场地档案；含容量、小时租金、按金、保险要求参数化配置。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(100) | NOT NULL, UNIQUE | 场地名称（礼堂/篮球场/课室/活动室/游泳池…）|
| capacity | INTEGER | | 容量（人）|
| hourly_rate | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 每小时租金（HKD）|
| deposit_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 按金（HKD）|
| insurance_required | BOOLEAN | NOT NULL DEFAULT false | 是否需投保 |
| address | VARCHAR(200) | | 地址/位置 |
| available_hours | JSONB | NOT NULL DEFAULT '{}' | 可用时段（如 {weekday:"09:00-22:00", weekend:"09:00-18:00"}）|
| status | ENUM | NOT NULL DEFAULT 'active' | venue_status_enum (active/inactive/maintenance)|
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 建档人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — venue_status_enum：** `active/inactive/maintenance`
**索引：** PRIMARY KEY (id)；UNIQUE (name)；INDEX (status)
**外键：** (created_by)→users(id)

---

### 表: venue_rentals — 场地租借（新增，F-ASSET-002）

> 场地租借用时记录；含租金自动计算、按金、保险要求、审批与结算。防冲突由应用层 + 排他约束双重保障。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| request_no | VARCHAR(30) | NOT NULL, UNIQUE | 租借单号（VR-YYYYMMDD-NNNN）|
| venue_id | UUID | FK→venues, NOT NULL | 场地 |
| renter_type | ENUM | NOT NULL | renter_type_enum (internal/external)|
| renter_name | VARCHAR(100) | NOT NULL | 租借方名称 |
| renter_contact | VARCHAR(100) | | 租借方联系方式 |
| start_at | TIMESTAMPTZ | NOT NULL | 开始时间 |
| end_at | TIMESTAMPTZ | NOT NULL | 结束时间 |
| duration_hours | NUMERIC(5,2) | NOT NULL DEFAULT 0 | 租用时长（小时，事务计算）|
| total_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 租金合计（时长×小时单价）|
| deposit_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 按金（快照，退回时扣损）|
| insurance_required | BOOLEAN | NOT NULL DEFAULT false | 需投保 |
| insurance_provided | BOOLEAN | NOT NULL DEFAULT false | 是否已提供保险单 |
| status | ENUM | NOT NULL DEFAULT 'draft' | venue_rental_status_enum（见状态机）|
| applied_by | UUID | FK→users | 申请人（内部）|
| approved_by | UUID | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | 审批时间 |
| deposit_collected | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 已收按金 |
| deposit_refunded | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 已退按金 |
| damage_deducted | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 扣损金额 |
| settled_at | TIMESTAMPTZ | | 结算时间 |
| receipt_no | VARCHAR(30) | | 收据号（衔接财务）|
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — venue_rental_status_enum：** `draft/pending_approval/approved/confirmed/in_progress/completed/closed/rejected/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (request_no)；INDEX (venue_id)；INDEX (status)；INDEX (start_at, end_at)
**外键：** (venue_id)→venues(id), (applied_by)→users(id), (approved_by)→users(id)
**防冲突（排他约束）：** `EXCLUDE USING gist (venue_id WITH =, tsrange(start_at, end_at) WITH &&)`（启用 btree_gist 扩展）；应用层同等校验，冲突返回 409。

---

### 表: maintenance_plans — 保养计划（新增，F-ASSET-003）

> 为设备/资产建档的保养计划；按频率（月/季/年）调度生成工单。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| plan_no | VARCHAR(30) | NOT NULL, UNIQUE | 计划编号（MP-YYYY-NNNN）|
| asset_id | UUID | FK→assets | 关联资产（通用资产或 fixed_assets）|
| fixed_asset_id | UUID | FK→fixed_assets | 关联固定资产（二选一）|
| name | VARCHAR(100) | NOT NULL | 计划名称 |
| maintenance_type | ENUM | NOT NULL | mnt_type_enum (regular/preventive/repair/safety_check)|
| frequency | ENUM | NOT NULL | mnt_frequency_enum (monthly/quarterly/yearly/on_demand)|
| next_due_date | DATE | NOT NULL | 下次到期日 |
| vendor_id | UUID | FK→vendors | 责任供应商（衔接 F-VEND-001，可选）|
| description | TEXT | | 说明 |
| status | ENUM | NOT NULL DEFAULT 'active' | mnt_plan_status_enum (active/suspended/retired)|
| safety_cert_required | BOOLEAN | NOT NULL DEFAULT false | 安全检测类是否需资质证书 |
| created_by | UUID | FK→users, NOT NULL | 建档人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — mnt_type_enum：** `regular/preventive/repair/safety_check`
**枚举 — mnt_frequency_enum：** `monthly/quarterly/yearly/on_demand`
**枚举 — mnt_plan_status_enum：** `active/suspended/retired`
**索引：** PRIMARY KEY (id)；UNIQUE (plan_no)；INDEX (asset_id)；INDEX (fixed_asset_id)；INDEX (next_due_date)；INDEX (status)；INDEX (vendor_id)
**外键：** (asset_id)→assets(id), (fixed_asset_id)→fixed_assets(id), (vendor_id)→vendors(id), (created_by)→users(id)

---

### 表: maintenance_work_orders — 保养工单（新增，F-ASSET-003）

> 保养执行工单；由计划 cron 自动生成或故障维修手动建单；含执行结果、费用、验收与关闭。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| work_order_no | VARCHAR(30) | NOT NULL, UNIQUE | 工单号（MWO-YYYYMMDD-NNNN）|
| plan_id | UUID | FK→maintenance_plans | 来源计划（故障维修可空）|
| asset_id | UUID | FK→assets | 关联资产 |
| fixed_asset_id | UUID | FK→fixed_assets | 关联固定资产（二选一）|
| maintenance_type | ENUM | NOT NULL | mnt_type_enum |
| status | ENUM | NOT NULL DEFAULT 'scheduled' | mnt_work_order_status_enum（见状态机）|
| assignee_type | ENUM | | assignee_type_enum (internal/outsourced)|
| assignee_id | UUID | FK→users | 校内执行人 |
| vendor_id | UUID | FK→vendors | 外判供应商（assignee_type=outsourced）|
| scheduled_date | DATE | | 计划执行日期 |
| executed_at | TIMESTAMPTZ | | 执行时间 |
| result | TEXT | | 执行结果/说明 |
| cost | NUMERIC(12,2) | NOT NULL DEFAULT 0 | 费用（HKD）|
| safety_cert_no | VARCHAR(100) | | 安全检测资质证书号（safety_check 必填）|
| attachment_url | VARCHAR(500) | | 附件（图片/报告）|
| verified_by | UUID | FK→users | 验收人（校务处）|
| verified_at | TIMESTAMPTZ | | 验收时间 |
| closed_by | UUID | FK→users | 关闭人 |
| closed_at | TIMESTAMPTZ | | 关闭时间 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — mnt_work_order_status_enum：** `scheduled/assigned/in_progress/submitted/verified/closed/cancelled`
**枚举 — assignee_type_enum：** `internal/outsourced`
**索引：** PRIMARY KEY (id)；UNIQUE (work_order_no)；INDEX (plan_id)；INDEX (asset_id)；INDEX (fixed_asset_id)；INDEX (status)；INDEX (vendor_id)；INDEX (scheduled_date)
**外键：** (plan_id)→maintenance_plans(id), (asset_id)→assets(id), (fixed_asset_id)→fixed_assets(id), (assignee_id)→users(id), (vendor_id)→vendors(id), (verified_by)→users(id), (closed_by)→users(id)

---

### 表: vendors — 供应商档案（新增，F-VEND-001）

> 外部供应商注册档案；含类别、联系人、证照有效期；注册状态机审核。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| vendor_code | VARCHAR(30) | NOT NULL, UNIQUE | 统一编号（VEND-YYYY-NNNN）|
| name | VARCHAR(100) | NOT NULL | 供应商名称 |
| category | ENUM | NOT NULL | vendor_category_enum（10类，见枚举）|
| contact_person | VARCHAR(100) | | 联系人 |
| contact_phone | VARCHAR(50) | | 联系电话 |
| contact_email | VARCHAR(100) | | 联系邮箱（P1）|
| bank_account | VARCHAR(200) | | 银行账户（P1，加密存储）|
| address | VARCHAR(200) | | 注册地址 |
| license_no | VARCHAR(100) | | 营业执照/注册证号 |
| certificate_expiry | DATE | | 证照有效期（到期提醒）|
| certificate_url | VARCHAR(500) | | 证照文件对象存储 URL |
| status | ENUM | NOT NULL DEFAULT 'draft' | vendor_reg_status_enum（见状态机）|
| reviewed_by | UUID | FK→users | 审核人（校务处）|
| reviewed_at | TIMESTAMPTZ | | 审核时间 |
| rejection_reason | TEXT | | 拒绝原因 |
| is_qualified | BOOLEAN | NOT NULL DEFAULT false | 是否合格供应商（名录）|
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 登记人（外部提交=系统注册人）|
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — vendor_category_enum：** `book/stationery/food_service/school_bus/equipment_maintenance/printing/cleaning/insurance/network/activity_supplies`
**枚举 — vendor_reg_status_enum：** `draft/pending_review/approved/rejected/suspended`
**索引：** PRIMARY KEY (id)；UNIQUE (vendor_code)；INDEX (category)；INDEX (status)；INDEX (certificate_expiry)
**外键：** (reviewed_by)→users(id), (created_by)→users(id)

---

### 表: vendor_evaluations — 供应商评估（新增，F-VEND-001）

> 周期性供应商评估；多评审人维度打分，汇总加权分级（A/B/C）与结论（续用/观察/淘汰）。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| evaluation_no | VARCHAR(30) | NOT NULL, UNIQUE | 评估编号（VE-YYYY-NNNN）|
| vendor_id | UUID | FK→vendors, NOT NULL | 被评估供应商 |
| evaluator_id | UUID | FK→users, NOT NULL | 评审人（多名评审各一条）|
| evaluation_year | VARCHAR(9) | NOT NULL | 评估年度 |
| scores | JSONB | NOT NULL DEFAULT '{}' | 各维度得分（quality/price/delivery/service/compliance 0-100）|
| weighted_score | NUMERIC(5,2) | NOT NULL DEFAULT 0 | 加权总分 |
| grade | ENUM | | vendor_grade_enum (A/B/C) |
| conclusion | ENUM | | vendor_conclusion_enum (renew/watching/eliminate) |
| status | ENUM | NOT NULL DEFAULT 'draft' | vendor_eval_status_enum（见状态机）|
| concluded_by | UUID | FK→users | 定级人（校务处/校务主任）|
| concluded_at | TIMESTAMPTZ | | 定级时间 |
| remarks | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — vendor_grade_enum：** `A/B/C`
**枚举 — vendor_conclusion_enum：** `renew/watching/eliminate`
**枚举 — vendor_eval_status_enum：** `draft/in_progress/scored/concluded/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (evaluation_no)；INDEX (vendor_id)；INDEX (evaluator_id)；INDEX (evaluation_year)；INDEX (status)
**外键：** (vendor_id)→vendors(id), (evaluator_id)→users(id), (concluded_by)→users(id)

---

### 审计日志扩展（F-ASSET-001/002/003, F-VEND-001）

> 沿用 §4.3 `audit_logs` 表结构；为资产与供应商管理模块扩展 `audit_action` 枚举值。

**新增 audit_action 值：**
```
fixed_asset_created, fixed_asset_updated,
inv_session_created, inv_session_planned, inv_session_in_progress, inv_session_verified, inv_session_closed, inv_session_cancelled,
inv_item_scanned, inv_item_investigated, inv_item_resolved,
venue_created, venue_updated,
venue_rental_submitted, venue_rental_approved, venue_rental_rejected, venue_rental_confirmed, venue_rental_completed, venue_rental_settled, venue_rental_cancelled,
mnt_plan_created, mnt_plan_suspended, mnt_plan_retired,
mnt_work_order_generated, mnt_work_order_assigned, mnt_work_order_submitted, mnt_work_order_verified, mnt_work_order_closed, mnt_work_order_cancelled,
vendor_registered, vendor_reviewed, vendor_approved, vendor_rejected, vendor_suspended,
vendor_evaluation_created, vendor_evaluation_scored, vendor_evaluation_concluded, vendor_evaluation_cancelled
```

**附加 metadata 约定：** entity_type（fixed_asset/inventory_session/inventory_item/venue/venue_rental/maintenance_plan/maintenance_work_order/vendor/vendor_evaluation）, entity_id, session_no, work_order_no, request_no, evaluation_no, vendor_code, witness_required

## 模块 22: 校车点名与查询模板管理模块 (Module 22 - Bus Check-in & Quick-Reply Templates, F-BUS-002, F-INQ-002, Issue #361)

> 🔧 **补全说明（Issue #361）**：为校车点大名记录（F-BUS-002）与家长查询快速回复模板（F-INQ-002）提供表设计。边界见 SPEC-SYSTEM-DESIGN §22；字段细节见 DATA-DICTIONARY §25；接口见 API-DESIGN §13。

### 表: buses — 校车车辆主档（新增，F-BUS-002）

> 校车车辆实体；供点名与 F-BUS-001 追踪引用。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| bus_code | VARCHAR(30) | NOT NULL, UNIQUE | 校车编号（如 BUS-A1）|
| plate_no | VARCHAR(20) | | 车牌号 |
| capacity | INTEGER | NOT NULL DEFAULT 0 | 座位数 |
| vendor_id | UUID | FK→vendors | 校车服务供应商（衔接 F-VEND-001，可选）|
| status | ENUM | NOT NULL DEFAULT 'active' | bus_status_enum (active/inactive/maintenance)|
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — bus_status_enum：** `active/inactive/maintenance`
**索引：** PRIMARY KEY (id)；UNIQUE (bus_code)；INDEX (vendor_id)
**外键：** (vendor_id)→vendors(id), (created_by)→users(id)

---

### 表: bus_routes — 校车线路（新增，F-BUS-002）

> 校车线路主档；含停靠站点序列与延误通知阈值配置（衔接 F-BUS-001）。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| route_code | VARCHAR(30) | NOT NULL, UNIQUE | 线路号（如 ROUTE-TKO）|
| name | VARCHAR(100) | NOT NULL | 线路名称（如 將軍澳線）|
| origin | VARCHAR(100) | NOT NULL | 起点站 |
| destination | VARCHAR(100) | NOT NULL | 终点站 |
| stops | JSONB | NOT NULL DEFAULT '[]' | 停靠站点序列 [{name, order, eta_minutes}] |
| delay_notify_threshold_minutes | INTEGER | NOT NULL DEFAULT 10 | 延误通知阈值（分钟，>10 微信，>20 短信）|
| status | ENUM | NOT NULL DEFAULT 'active' | bus_route_status_enum (active/inactive)|
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — bus_route_status_enum：** `active/inactive`
**索引：** PRIMARY KEY (id)；UNIQUE (route_code)
**外键：** (created_by)→users(id)

---

### 表: bus_shifts — 校车班次/行程（新增，F-BUS-002）

> 一次校车行程（线路 × 校车 × 日期 × 方向），校车点名的粒度容器。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| shift_no | VARCHAR(30) | NOT NULL, UNIQUE | 行程号（BS-YYYYMMDD-001）|
| route_id | UUID | FK→bus_routes, NOT NULL | 线路 |
| bus_id | UUID | FK→buses, NOT NULL | 校车 |
| shift_date | DATE | NOT NULL | 行程日期 |
| direction | ENUM | NOT NULL | bus_direction_enum (morning/afternoon) |
| plan_depart_at | TIMESTAMPTZ | | 计划发车时间 |
| plan_arrive_at | TIMESTAMPTZ | | 计划到站时间 |
| actual_depart_at | TIMESTAMPTZ | | 实际发车时间 |
| actual_arrive_at | TIMESTAMPTZ | | 实际到站时间 |
| delay_minutes | INTEGER | NOT NULL DEFAULT 0 | 延误分钟（实际-计划）|
| status | ENUM | NOT NULL DEFAULT 'draft' | bus_shift_status_enum（见状态机）|
| closed_by | UUID | FK→users | 关闭人 |
| closed_at | TIMESTAMPTZ | | 关闭时间 |
| remarks | TEXT | | 备注 |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — bus_direction_enum：** `morning/afternoon`
**枚举 — bus_shift_status_enum：** `draft/active/closed/cancelled`
**索引：** PRIMARY KEY (id)；UNIQUE (shift_no)；INDEX (route_id)；INDEX (bus_id)；INDEX (shift_date)；INDEX (direction)；INDEX (status)
**外键：** (route_id)→bus_routes(id), (bus_id)→buses(id), (closed_by)→users(id), (created_by)→users(id)

---

### 表: bus_students — 校车乘搭分配（新增，F-BUS-002）

> 学生乘搭线路/班次的分配名单；衔接 F-BUS-001 乘搭学生列表与家长通知状态。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| student_id | UUID | FK→students, NOT NULL | 乘搭学生 |
| route_id | UUID | FK→bus_routes, NOT NULL | 所属线路 |
| shift_date | DATE | NOT NULL | 生效日期（按日分配；可支持按班次）|
| direction | ENUM | NOT NULL | bus_direction_enum (morning/afternoon) |
| board_stop | VARCHAR(100) | | 上车点 |
| alight_stop | VARCHAR(100) | | 下车点 |
| pickup_order | INTEGER | | 上车顺序 |
| status | ENUM | NOT NULL DEFAULT 'active' | bus_student_status_enum (active/suspended)|
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — bus_student_status_enum：** `active/suspended`
**索引：** PRIMARY KEY (id)；INDEX (student_id)；INDEX (route_id)；UNIQUE (student_id, route_id, shift_date, direction)
**外键：** (student_id)→students(id), (route_id)→bus_routes(id), (created_by)→users(id)
> `UNIQUE(student_id, route_id, shift_date, direction)` 保证同学生同线路同日期同方向仅一条分配；跨日乘搭由 `shift_date` 区隔，DEV 可设计「默认分配」+「按日覆盖」。

---

### 表: bus_checkins — 校车点名记录（新增，F-BUS-002）

> 校车行程上学生上车/下车点名记录；F-BUS-002 核心输出。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| checkin_no | VARCHAR(40) | NOT NULL, UNIQUE | 点名单号（CHK-YYYYMMDD-NNNN）|
| shift_id | UUID | FK→bus_shifts, NOT NULL | 所属行程 |
| student_id | UUID | FK→students, NOT NULL | 点名学生 |
| bus_student_id | UUID | FK→bus_students | 乘搭分配（可选，未分配时 null）|
| check_type | ENUM | NOT NULL | bus_check_type_enum (onboard/alight) |
| checked_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 点名时间 |
| location | VARCHAR(200) | | 点名地点（GPS 或手动）|
| location_source | ENUM | NOT NULL DEFAULT 'manual' | bus_loc_source_enum (gps/manual) |
| device_id | VARCHAR(128) | | 点名设备标识 |
| scanned_by | UUID | FK→users | 执行点名人（司机/跟车员/校务处）|
| status | ENUM | NOT NULL | bus_checkin_status_enum（外发状态）|
| parent_notification_sent | BOOLEAN | NOT NULL DEFAULT false | 是否已发送家长通知 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — bus_check_type_enum：** `onboard/alight`
**枚举 — bus_loc_source_enum：** `gps/manual`
**枚举 — bus_checkin_status_enum：** `onboard/alight/arrived_safely/missed/absent`
**索引：** PRIMARY KEY (id)；UNIQUE (checkin_no)；INDEX (shift_id)；INDEX (student_id)；UNIQUE (shift_id, student_id, check_type)；INDEX (checked_at)；INDEX (status)
**外键：** (shift_id)→bus_shifts(id), (student_id)→students(id), (bus_student_id)→bus_students(id), (scanned_by)→users(id)
> `UNIQUE(shift_id, student_id, check_type)` 保证同行程同学生同类型仅一条有效点名（幂等）；`status` 派生规则见 SPEC-SYSTEM-DESIGN §22.5（alight 到校=arrived_safely；仅 onboard=onboard；应乘未点名=missed；请假=absent）。

---

### 表: quick_reply_templates — 快速回复模板（新增，F-INQ-002）

> 校务处回复家长查询的快速回复模板主档；5 类 41 个内置模板 + 自定义。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| template_code | VARCHAR(30) | NOT NULL, UNIQUE | 模板编号（QRT-BUS-001）|
| category | ENUM | NOT NULL | quick_reply_category_enum (bus/lunch/fee/leave/general) |
| name | VARCHAR(100) | NOT NULL | 模板名称（如 校車延誤通知）|
| title | VARCHAR(200) | | 回复标题（可选）|
| content | TEXT | NOT NULL | 回复正文（含变量占位符 {{var}}）|
| variables | JSONB | NOT NULL DEFAULT '[]' | 变量名列表（如 delay_minutes/estimated_arrival/student_name）|
| intent_tags | JSONB | NOT NULL DEFAULT '[]' | 关联意图标签（衔接 F-INQ-001 intent，如 bus_schedule/launch_menu）|
| channels | JSONB | NOT NULL DEFAULT '["wechat","sms","email"]' | 适用推送渠道 |
| is_default | BOOLEAN | NOT NULL DEFAULT false | 是否内置模板（只读）|
| status | ENUM | NOT NULL DEFAULT 'active' | quick_reply_status_enum (active/inactive)|
| applicable_roles | JSONB | NOT NULL DEFAULT '[]' | 适用范围角色限制（空=不限）|
| sort_order | INTEGER | NOT NULL DEFAULT 0 | 排序 |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除时间（自定义模板删除用）|

**枚举 — quick_reply_category_enum：** `bus/lunch/fee/leave/general`
**枚举 — quick_reply_status_enum：** `active/inactive`
**索引：** PRIMARY KEY (id)；UNIQUE (template_code)；INDEX (category)；INDEX (status)；INDEX (is_default)
**外键：** (created_by)→users(id)
> 内置模板（`is_default=true`）仅可停用不可物理删除；自定义模板软删除（`deleted_at`）。

---

### 审计日志扩展（F-BUS-002, F-INQ-002）

> 沿用 §4.3 `audit_logs` 表结构；为校车点名与查询模板模块扩展 `audit_action` 枚举值。

```text
bus_created, bus_updated,
bus_route_created, bus_route_updated,
bus_shift_created, bus_shift_activated, bus_shift_closed, bus_shift_cancelled,
bus_student_assigned, bus_student_suspended,
bus_checkin_created, bus_checkin_parent_notified,
quick_reply_template_created, quick_reply_template_updated, quick_reply_template_deactivated, quick_reply_template_restored,
quick_reply_rendered, quick_reply_sent
```

**附加 metadata 约定：** entity_type（bus/bus_route/bus_shift/bus_student/bus_checkin/quick_reply_template）, entity_id, shift_no, checkin_no, template_code, bus_code, route_code, student_id, parent_notification_sent


---

## §23. AI 自动化模块（Issue #362）

> 🔧 **补全说明（Issue #362）**：为「AI 自动化」模块补齐表结构，作为 DEV 实现 **F-AI-002（FAQ 智能匹配）、F-AUTO-001（周期性任务触发器）、F-AUTO-002（智能提醒系统）** 的输入。
> **边界**：本节只建 AI 自动化业务专属表。既有表承载相字段：`users`（Module 16，鉴权与审计）、`students`（学生主档）、`notifications`/`notification_deliveries`/`notification_templates`（§7.3 多渠道通知，承载 F-AUTO-002 消息发送与送达回执）、`audit_logs`（§4.3 审计）、`inquiries`（家长查询，F-AI-002 FAQ 可服务查询队列）。以下表 `school_id`→`schools(id)`，`created_by/updated_by`→`users(id)`，`notification_id`→`notifications(id)`。
> 系统设计见 SPEC-SYSTEM-DESIGN §23，字段说明见 DATA-DICTIONARY §26，接口见 API-DESIGN §14。

### 表: faq_knowledge_base — FAQ 知识条目（新增，F-AI-002）

> FAQ 主档：问题（繁/英）、答案、关键词、意图标签、嵌入向量。语义检索经 pgvector（PostgreSQL 16）实现，无需额外向量库。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| faq_code | VARCHAR(40) | NOT NULL, UNIQUE | FAQ 编号（FAQ-YYYYMMDD-NNNN）|
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| category | ENUM | NOT NULL | faq_category_enum (general/admission/fee/attendance/bus/lunch/academic/leave) |
| question_zh | TEXT | NOT NULL | 繁体中文问题 |
| question_en | TEXT | | 英文问题（可选）|
| answer | JSONB | NOT NULL | 多格式答案（{plain, html?, quick_reply_template_code?}）|
| keywords | JSONB | NOT NULL DEFAULT '[]' | 搜索关键词数组 |
| trigger_intents | JSONB | NOT NULL DEFAULT '[]' | 关联意图代码（衔接 F-INQ-001 intent / Coze 意图）|
| embedding | VECTOR(1536) | | OpenAI text-embedding-3 嵌入向量（pgvector）|
| tfidf_terms | JSONB | NOT NULL DEFAULT '[]' | TF-IDF 项（词=权重）缓存 |
| view_count | INTEGER | NOT NULL DEFAULT 0 | 浏览次数 |
| helpful_count | INTEGER | NOT NULL DEFAULT 0 | 反馈「有用」次数 |
| not_helpful_count | INTEGER | NOT NULL DEFAULT 0 | 反馈「无用」次数 |
| status | ENUM | NOT NULL DEFAULT 'active' | faq_status_enum (active/inactive) |
| created_by | UUID | FK→users, NOT NULL | 维护人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除时间 |

**枚举 — faq_category_enum：** `general/admission/fee/attendance/bus/lunch/academic/leave`
**枚举 — faq_status_enum：** `active/inactive`
**索引：** PRIMARY KEY (id)；UNIQUE (faq_code)；INDEX (school_id)；INDEX (category)；INDEX (status)；INDEX USING hnsw (embedding vector_cosine_ops)
**外键：** (school_id)→schools(id), (created_by)→users(id)
> `embedding` 向量列启用 pgvector HNSW 索引以支持近似最近邻（ANN）语义检索；无嵌入条目降级为关键词+TF-IDF 匹配。

---

### 表: faq_match_logs — FAQ 匹配记录（新增，F-AI-002）

> 每次 FAQ 匹配请求的日志：记录查询、命中的候选及其分数、最终返回、反馈，用于效果分析与模型迭代。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| session_id | VARCHAR(64) | NOT NULL | 查询会话标识（衔接 F-INQ-001 查询会话）|
| query_text | TEXT | NOT NULL | 原始查询 |
| normalized_text | TEXT | | 规范化后查询（繁简归一/小写/分词）|
| query_intent | VARCHAR(100) | | 意图识别结果（可空）|
| top_faq_id | UUID | FK→faq_knowledge_base | 最终回答的 FAQ（可空=未命中）|
| top_score | NUMERIC(5,4) | | 最终分数（0~1）|
| candidates | JSONB | NOT NULL DEFAULT '[]' | 候选列表 [{faq_id, score, matched_by}] |
| used_vector | BOOLEAN | NOT NULL DEFAULT false | 是否使用了向量语义匹配 |
| latency_ms | INTEGER | NOT NULL | 匹配耗时（毫秒）|
| source_channel | ENUM | NOT NULL | faq_source_enum (web/app/inquiry/coze/api) |
| feedback | ENUM | | faq_feedback_enum (helpful/not_helpful/none) |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — faq_source_enum：** `web/app/inquiry/coze/api`
**枚举 — faq_feedback_enum：** `helpful/not_helpful/none`
**索引：** PRIMARY KEY (id)；INDEX (school_id)；INDEX (session_id)；INDEX (created_at)；INDEX (top_faq_id)；INDEX (feedback)
**外键：** (school_id)→schools(id), (top_faq_id)→faq_knowledge_base(id)
> 匹配采用多路打分融合（关键词/ TF-IDF / 语义 / 意图），权重见 SPEC-SYSTEM-DESIGN §23.1。`candidates` 保留 top-N 用于日志审计与调优。

---

### 表: scheduled_tasks — 周期任务定义（新增，F-AUTO-001）

> 周期性任务定义主档：触发表达式（cron）、执行动作类型与参数、启用状态、下次/上次执行时间。由 `SchedulerRegistry`（@nestjs/schedule）调度。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| task_code | VARCHAR(40) | NOT NULL, UNIQUE | 任务编号（CRON-YYYYMMDD-XXXX）|
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| name | VARCHAR(128) | NOT NULL | 任务名称（如 晨检仪表板刷新）|
| description | TEXT | | 任务说明 |
| trigger_type | ENUM | NOT NULL | task_trigger_type_enum (daily/weekly/monthly/cron) |
| cron_expression | VARCHAR(64) | NOT NULL | 标准 cron 表达式（5 段）|
| action_type | ENUM | NOT NULL | task_action_enum（动作类型，见枚举）|
| action_params | JSONB | NOT NULL DEFAULT '{}' | 动作参数（如 {reportType, recipients}）|
| priority | ENUM | NOT NULL DEFAULT 'normal' | task_priority_enum (info/normal/high/critical) |
| status | ENUM | NOT NULL DEFAULT 'active' | task_status_enum (active/paused/disabled) |
| max_retries | INTEGER | NOT NULL DEFAULT 3 | 失败最大重试次数 |
| timeout_seconds | INTEGER | NOT NULL DEFAULT 300 | 单次执行超时（秒）|
| last_run_at | TIMESTAMPTZ | | 上次执行时间 |
| next_run_at | TIMESTAMPTZ | NOT NULL | 下次执行时间 |
| consecutive_failures | INTEGER | NOT NULL DEFAULT 0 | 连续失败次数 |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除时间 |

**枚举 — task_trigger_type_enum：** `daily/weekly/monthly/cron`
**枚举 — task_action_enum：** `refresh_dashboard_data/generate_inquiry_summary/generate_absence_report/send_fee_reminder/send_custom_notification/send_token_health_check/webhook`
**枚举 — task_priority_enum：** `info/normal/high/critical`
**枚举 — task_status_enum：** `active/paused/disabled`
**索引：** PRIMARY KEY (id)；UNIQUE (task_code)；INDEX (school_id)；INDEX (status)；INDEX (next_run_at)
**外键：** (school_id)→schools(id), (created_by)→users(id)
> `cron_expression` 依 `trigger_type` 生成：daily `0 HH MM * *`、weekly `0 MM HH * DOW`、monthly `0 MM HH DD *`、cron 自定义表达式。`next_run_at` 供调度器取到点任务。

---

### 表: scheduled_task_executions — 周期任务执行日志（新增，F-AUTO-001）

> 单次任务执行记录：触发时间、状态、耗时、重试、错误信息。审计与可观测。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| task_id | UUID | FK→scheduled_tasks, NOT NULL | 所属任务 |
| execution_no | VARCHAR(40) | NOT NULL, UNIQUE | 执行编号（EXE-YYYYMMDDHHMMSS-XXXX）|
| triggered_at | TIMESTAMPTZ | NOT NULL | 触发时间 |
| status | ENUM | NOT NULL | exec_status_enum (pending/running/success/failed/retrying/skipped) |
| attempt | INTEGER | NOT NULL DEFAULT 1 | 重试次数（1=首次）|
| started_at | TIMESTAMPTZ | | 开始执行时间 |
| finished_at | TIMESTAMPTZ | | 结束执行时间 |
| duration_ms | INTEGER | | 执行耗时（毫秒）|
| result_summary | TEXT | | 执行结果摘要 |
| output | JSONB | NOT NULL DEFAULT '{}' | 结构化输出（如 {notified:N, reportUrl}）|
| error_message | TEXT | | 错误信息 |
| error_stack | TEXT | | 错误堆栈（可选）|
| next_retry_at | TIMESTAMPTZ | | 下次重试时间（retrying 时）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — exec_status_enum：** `pending/running/success/failed/retrying/skipped`
**索引：** PRIMARY KEY (id)；UNIQUE (execution_no)；INDEX (task_id)；INDEX (status)；INDEX (triggered_at)；INDEX (created_at)
**外键：** (task_id)→scheduled_tasks(id)
> 执行完成后更新 `scheduled_tasks.last_run_at/next_run_at/consecutive_failures`；连续失败达阈值触发告警（经 §7.3 通知）。

---

### 表: reminder_rules — 提醒规则定义（新增，F-AUTO-002）

> 智能提醒规则：提醒级别、渠道、时机、升级策略、适用业务与接收者。对应 F-AUTO-002 提醒级别（INFO/NORMAL/URGENT/CRITICAL）与升级机制。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| rule_code | VARCHAR(40) | NOT NULL, UNIQUE | 规则编号（RMD-YYYYMMDD-XXXX）|
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| name | VARCHAR(128) | NOT NULL | 规则名称（如 校車延誤提醒）|
| business_type | ENUM | NOT NULL | reminder_biz_enum (bus/attendance/fee/academic/emergency/daily/etc) |
| level | ENUM | NOT NULL | reminder_level_enum (info/normal/urgent/critical) |
| channels | JSONB | NOT NULL DEFAULT '["app_push"]' | 发送渠道（app_push/sms/email/whatsapp/phone）|
| sms_backup | BOOLEAN | NOT NULL DEFAULT false | 高优先级是否短信备用（bus/attendance/emergency=true）|
| delay_minutes | INTEGER | NOT NULL DEFAULT 0 | 触发后延迟发送（分钟）|
| escalation_enabled | BOOLEAN | NOT NULL DEFAULT false | 是否启用升级 |
| escalation_delay_minutes | INTEGER | | 升级延迟（NORMAL +24h / URGENT +2h；见枚举级别表）|
| escalate_to_roles | JSONB | NOT NULL DEFAULT '[]' | 升级接收角色（如 school_head/office）|
| notify_roles | JSONB | NOT NULL DEFAULT '[]' | 直接接收角色（空=策略决定）|
| template_id | UUID | FK→notification_templates | 关联通知模板（可空，用于渲染消息体）|
| filter_condition | JSONB | NOT NULL DEFAULT '{}' | 触发条件过滤（如 {studentIds, classIds, thresholds}）|
| status | ENUM | NOT NULL DEFAULT 'active' | reminder_rule_status_enum (active/paused/disabled) |
| created_by | UUID | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除时间 |

**枚举 — reminder_biz_enum：** `bus/attendance/fee/academic/emergency/daily/other`
**枚举 — reminder_level_enum：** `info/normal/urgent/critical`
**枚举 — reminder_rule_status_enum：** `active/paused/disabled`
**索引：** PRIMARY KEY (id)；UNIQUE (rule_code)；INDEX (school_id)；INDEX (level)；INDEX (business_type)；INDEX (status)
**外键：** (school_id)→schools(id), (template_id)→notification_templates(id), (created_by)→users(id)
> 渠道策略与升级时机编码在规则内，DEV 按 `level` 决定默认渠道（INFO=App+短信可选、NORMAL=App+Email+SMS+24h、URGENT=App+SMS+电话+2h、CRITICAL=全渠道+校领导+立即）。

---

### 表: reminder_records — 提醒记录（新增，F-AUTO-002）

> 每次提醒触发产生的记录：关联通知、送达/已读响应、升级状态与历史。承载 F-AUTO-002 消息送达回执与未读跟进机制。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| reminder_no | VARCHAR(40) | NOT NULL, UNIQUE | 提醒编号（REM-YYYYMMDD-XXXX）|
| rule_id | UUID | FK→reminder_rules, NOT NULL | 触发规则 |
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| recipient_id | UUID | FK→users, NOT NULL | 接收者用户 |
| related_entity_type | VARCHAR(50) | | 关联业务类型（bus/attendance/fee/...）|
| related_entity_id | UUID | | 关联业务ID |
| notification_id | UUID | FK→notifications | 关联主通知（§7.3 生成）|
| deliver_status | ENUM | NOT NULL DEFAULT 'pending' | reminder_deliver_status_enum (pending/sent/delivered/failed) |
| read_status | ENUM | NOT NULL DEFAULT 'unread' | reminder_read_status_enum (unread/read) |
| read_at | TIMESTAMPTZ | | 已读时间 |
| level | ENUM | NOT NULL | reminder_level_enum (info/normal/urgent/critical)，触发时刻快照 |
| channel | ENUM | NOT NULL | NotificationChannel（§7.3，发送渠道快照）|
| sms_fallback_sent | BOOLEAN | NOT NULL DEFAULT false | 是否已发短信备用 |
| escalation_level | ENUM | NOT NULL DEFAULT 'info' | 当前升级层次（info/normal/urgent/critical）|
| escalation_history | JSONB | NOT NULL DEFAULT '[]' | 升级历史 [{at, fromLevel, toLevel, via}] |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | 未读/失败重发次数（F-AUTO-002：24h 三条件最重发一次+短信）|
| next_followup_at | TIMESTAMPTZ | | 下次未读跟进时间（24h 或 2h 升级窗口）|
| is_read | BOOLEAN | NOT NULL DEFAULT false | 快速判断已读（冗余，与 read_status 同步）|
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — reminder_deliver_status_enum：** `pending/sent/delivered/failed`
**枚举 — reminder_read_status_enum：** `unread/read`
**索引：** PRIMARY KEY (id)；UNIQUE (reminder_no)；INDEX (rule_id)；INDEX (recipient_id)；INDEX (school_id)；INDEX (next_followup_at)；INDEX (read_status)；INDEX (deliver_status)
**外键：** (rule_id)→reminder_rules(id), (school_id)→schools(id), (recipient_id)→users(id), (notification_id)→notifications(id)
> **送达回执**：家长打开通知 → `read_status=read` 且 `read_at` 写入，家长端显示「家长已读」。**未读跟进**：`next_followup_at` 到点未读 → 重发一次+短信备用（`sms_fallback_sent=true`），`retry_count` 递增。**失败告警**：`deliver_status=failed` 持续 → 告警校务处，显示「通知发送失败」。

---

### 审计日志扩展（F-AI-002, F-AUTO-001, F-AUTO-002）

> 沿用 §4.3 `audit_logs` 表结构；为 AI 自动化模块扩展 `audit_action` 枚举值。

```text
faq_created, faq_updated, faq_deactivated, faq_restored, faq_embedded, faq_feedback,
task_created, task_updated, task_paused, task_resumed, task_disabled, task_triggered, task_executed,
reminder_rule_created, reminder_rule_updated, reminder_rule_paused, reminder_rule_disabled,
reminder_record_created, reminder_escalated, reminder_followup_sent
```

**附加 metadata 约定：** entity_type（faq_knowledge_base/faq_match_log/scheduled_task/scheduled_task_execution/reminder_rule/reminder_record）, entity_id, faq_code, task_code, execution_no, rule_code, reminder_no, notification_id, escalation_level

---

## §24. 运维自动化与监控模块（Module 11: F-OPS-002/003/006/007/008/009, Issue #363）

> 🔧 **补全说明（Issue #363）**：为「运维自动化」补齐持久化表，作为 DEV 实现 **F-OPS-002（SSL 续期）、F-OPS-003（WebSAMS Token 刷新）、F-OPS-006（Coze 配额监控）、F-OPS-007（敏感字段访问告警）、F-OPS-008（DDL 审计）、F-OPS-009（运维健康仪表板）** 的输入。
> **边界（衔接已有设计，不重复建表）**：系统设计见 SPEC-SYSTEM-DESIGN §24；`ddl_audit_log` 沿用系统设计 §9.9.2 结构并在本节固化；`audit_logs` 沿用 §4.3（F-USER-005 §16.3）不重复建，本节仅新增 `audit_action` 枚举值。Prometheus 指标与 Grafana 由 §7/§9 承载，不进 DB。
> 以下表 `school_id`→`schools(id)`（全局运维表 `school_id` 可空，表示跨校告警/平台级）。

### 表: ssl_cert_status — SSL 证书状态快照（新增，F-OPS-002）

> 每域名一张最新状态 + 续期历史；承接 cert_manager/certbot 续期结果（系统设计 §9.3/§24.3.1）。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| domain | VARCHAR(190) | NOT NULL, UNIQUE | 证书域名（school-admin.internal 等）|
| school_id | UUID | FK→schools | 所属学校（平台级证书可空）|
| issuer | VARCHAR(100) | | 签发机构（Let's Encrypt / 自签）|
| not_before | TIMESTAMPTZ | | 证书生效时间 |
| not_after | TIMESTAMPTZ | NOT NULL | 证书到期时间 |
| days_until_expiry | INTEGER | NOT NULL | 到期剩余天数（采集时）|
| alert_level | ENUM | NOT NULL DEFAULT 'info' | cert_alert_enum(info/warning/critical/error)（30/7/1/过期 对齐）|
| auto_renew_enabled | BOOLEAN | NOT NULL DEFAULT true | 是否启用自动续期 |
| renewal_result | ENUM | | cert_renew_result_enum(success/failure/not_run) |
| last_renewed_at | TIMESTAMPTZ | | 上次续期成功时间 |
| renewal_attempts | INTEGER | NOT NULL DEFAULT 0 | 累计续期尝试次数 |
| last_renewal_detail | JSONB | | 续期细节（{result, error?, reloaded?:bool}）|
| vault_path | VARCHAR(255) | | Vault 密钥路径（secret/certs/...）|
| updated_at | TIMESTAMPTZ | NOT NULL | 最近采集更新时间 |

**枚举 — cert_alert_enum：** `info/warning/critical/error`
**枚举 — cert_renew_result_enum：** `success/failure/not_run`
**索引：** PRIMARY KEY (id)；UNIQUE (domain)；INDEX (not_after)；INDEX (alert_level)；INDEX (days_until_expiry)
**外键：** (school_id)→schools(id)
> 每行代表一个域名的最新状态；续期历史事件另写 `ops_events`（event_type=`ssl_cert_expiry_alert` / `ssl_cert_renewed`）。

---

### 表: token_refresh_status — WebSAMS Token 刷新状态（新增，F-OPS-003）

> 每次 Token 检查/刷新一条记录（分布式锁下，系统设计 §9.4/§24.3.2）。快照当前有效 Token 与每次刷新行为。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| refresh_no | VARCHAR(40) | NOT NULL, UNIQUE | 刷新编号（TOK-YYYYMMDDHHMMSS-XXXX）|
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| grant_type | VARCHAR(20) | NOT NULL DEFAULT 'client_credentials' | OAuth2 grant 类型 |
| token_status | ENUM | NOT NULL | token_status_enum(valid/expiring/refresh_triggered/refresh_failed/degraded) |
| remaining_hours | NUMERIC(6,2) | | 检查时剩余有效小时数 |
| refreshed_at | TIMESTAMPTZ | | 本次刷新时间 |
| expires_at | TIMESTAMPTZ | | 刷新后 Token 到期时间 |
| refresh_reason | VARCHAR(40) | | 触发原因（scheduled_check/<24h/manual/max_age）|
| refresh_result | ENUM | | refresh_result_enum(success/failure/skipped) |
| failure_detail | TEXT | | 失败原因（网络/认证/超时，可选）|
| degraded_mode | ENUM | | degrade_enum(none/readonly/cached)（§9.4.2 降级方案）|
| redeploy_app | BOOLEAN | NOT NULL DEFAULT false | 是否触发依赖服务 Token 刷新 |
| ref_event_no | VARCHAR(40) | | 关联 ops_events.event_no（幂等双写）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — token_status_enum：** `valid/expiring/refresh_triggered/refresh_failed/degraded`
**枚举 — refresh_result_enum：** `success/failure/skipped`
**枚举 — degrade_enum：** `none/readonly/cached`
**索引：** PRIMARY KEY (id)；UNIQUE (refresh_no)；INDEX (school_id)；INDEX (created_at)；INDEX (refresh_result)
**外键：** (school_id)→schools(id)
> 审计：成功/失败刷新同时写 `audit_logs`（audit_action=`websams_token_refreshed`，见本节「审计日志扩展」）。

---

### 表: coze_quota_records — Coze API 配额监控记录（新增，F-OPS-006）

> 每 5 分钟一条 Coze 配额快照（系统设计 §9.7/§24.3.3），含使用率与限流动。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| sample_at | TIMESTAMPTZ | NOT NULL | 采样时间（每 5 分钟粒度）|
| metric_name | VARCHAR(40) | NOT NULL | rpm/tpm/daily_limit |
| quota_used | NUMERIC(16,2) | NOT NULL | 已使用配额 |
| quota_limit | NUMERIC(16,2) | NOT NULL | 配额上限 |
| usage_percent | NUMERIC(6,2) | NOT NULL | 使用率（%）|
| alert_level | ENUM | NOT NULL DEFAULT 'info' | quota_alert_enum(info/warning/error/critical)（80/95/100 对齐）|
| rate_limited | BOOLEAN | NOT NULL DEFAULT false | 是否已触发限流保护 |
| rate_limit_action | ENUM | | rate_action_enum(none/low_pause/medium_throttle/off)（§9.7.3）|
| provider_active | ENUM | NOT NULL DEFAULT 'coze' | ai_provider_enum(coze/openai/local)（备用方案切换）|
| note | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — quota_alert_enum：** `info/warning/error/critical`
**枚举 — rate_action_enum：** `none/low_pause/medium_throttle/off`
**枚举 — ai_provider_enum：** `coze/openai/local`
**索引：** PRIMARY KEY (id)；UNIQUE (sample_at, metric_name)；INDEX (school_id)；INDEX (usage_percent)；INDEX (alert_level)
**外键：** (school_id)→schools(id)
> 告警事件写 `ops_events`（event_type=`coze_quota_alert`）；限流切换写审计（audit_action=`coze_quota_rate_limited`）。

---

### 表: sensitive_field_access_log — 敏感字段访问日志（新增，F-OPS-007）

> 记录每次敏感字段查看/导出明细与阈值命中告警标记（系统设计 §9.8/§24.3.4）。**只追加不可更新/删除**（DB 触发器拒绝 UPDATE/DELETE）。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| user_id | UUID | FK→users, NOT NULL | 访问用户 |
| field_type | ENUM | NOT NULL | sensitive_field_type_enum(hkid/phone/address/medical) |
| target_type | VARCHAR(40) | NOT NULL | 目标实体类型（student/parent）|
| target_id | UUID | NOT NULL | 目标实体 ID |
| action | ENUM | NOT NULL DEFAULT 'view' | sensitive_action_enum(view/export) |
| accessed_at | TIMESTAMPTZ | NOT NULL | 访问时间 |
| window_alerts | JSONB | | 5 分钟窗口聚合（{count, threshold, alertLevel, windowStart, windowEnd}）|
| alert_level | ENUM | | alert_level_enum(none/warning/error/critical)（阈值命中标记）|
| paused | BOOLEAN | NOT NULL DEFAULT false | 持续异常触发的临时权限暂停标记 |
| sanctioned_by | UUID | FK→users | 触发暂停的执行人（系统自动时为空）|
| event_no | VARCHAR(40) | | 关联 ops_events.event_no（幂等双写）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — sensitive_field_type_enum：** `hkid/phone/address/medical`
**枚举 — sensitive_action_enum：** `view/export`
**枚举 — alert_level_enum（运维用告警级别）：** `none/warning/error/critical`
**索引：** PRIMARY KEY (id)；INDEX (user_id)；INDEX (field_type)；INDEX (accessed_at)；INDEX (alert_level)；INDEX (target_id)
**外键：** (school_id)→schools(id), (user_id)→users(id), (sanctioned_by)→users(id)
> 审计联动：audit_action=`sensitive_field_view`（既有 §16.3）+ `sensitive_field_excessive_access`（新，见本节审计扩展）。

---

### 表: ddl_audit_log — 数据库 DDL 操作审计（固化 §9.9.2，F-OPS-008）

> 沿用系统设计 §9.9.2 结构与 pgaudit 配置；本研究文档固化落库。**只追加，不可 UPDATE/DELETE**（pgaudit + 触发器保证审计不可抵赖）。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK DEFAULT gen_random_uuid() | 主键 |
| event_type | VARCHAR(50) | NOT NULL | DDL 事件类型 |
| object_type | VARCHAR(50) | NOT NULL | 对象类型（TABLE/INDEX/...)|
| object_name | TEXT | NOT NULL | 对象名称 |
| command_tag | VARCHAR(50) | NOT NULL | DROP TABLE/ALTER TABLE/等 |
| ddl_statement | TEXT | NOT NULL | 完整 DDL 语句 |
| executed_by | VARCHAR(100) | NOT NULL | 执行人 / 角色 |
| executed_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 执行时间 |
| client_addr | VARCHAR(45) | | 客户端 IP |
| schema_name | TEXT | | 所属 schema |
| school_id | UUID | FK→schools | 所属学校（由语句上下文推断，可空）|

**索引：** PRIMARY KEY (id)；INDEX (executed_at)；INDEX (executed_by)；INDEX (object_type, object_name)；INDEX (command_tag)
**外键：** (school_id)→schools(id)
> 告警：DROP/TRUNCATE 实时写 `ops_events`（event_type=`ddl_critical`）；审批流程复用系统设计 §9.9.4。保留 7 年，冷存见 §17.6。

---

### 表: ops_health_metrics — 运维健康指标时间序列（新增，F-OPS-009）

> 仪表板 9 维度 + 总体健康分的历史评分（系统设计 §9.10/§24.3.6），每 1 分钟采样对齐 Prometheus 拉取间隔。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| school_id | UUID | FK→schools | 所属学校（平台级留空）|
| sample_at | TIMESTAMPTZ | NOT NULL | 采样时间（每 1 分钟）|
| dimension | VARCHAR(40) | NOT NULL | health_dimension_enum（9 维度 + overall）|
| score | NUMERIC(5,2) | NOT NULL | 维度得分（0-100）|
| status | ENUM | NOT NULL | health_status_enum(healthy/warning/critical) |
| weight | NUMERIC(4,2) | NOT NULL | 维度权重（%）（§9.10.2）|
| detail | JSONB | | 维度明细（关键指标值）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — health_dimension_enum：** `infra/db/ssl/websams/ai/audit/notification/dr/sensitive_ops/overall`
**枚举 — health_status_enum：** `healthy/warning/critical`
**索引：** PRIMARY KEY (id)；INDEX (sample_at)；INDEX (dimension)；INDEX (school_id, sample_at)；UNIQUE (sample_at, dimension, school_id)
**外键：** (school_id)→schools(id)
> 每 1 分钟一条快照；保留 13 个月，历史按月度聚合归档。总体健康分 `dimension=overall` 对应 §9.10.4 `ops_health_score`。

---

### 表: ops_events — 运维事件流（新增，全局统一）

> 统一运维事件流：证书/Token/配额/DDL/敏感访问等告警事件的统一入账（系统设计 §24.2）。供仪表板「近期事件流」面板与运维 API 查询。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| event_no | VARCHAR(40) | NOT NULL, UNIQUE | 事件编号（OPS-YYYYMMDDHHMMSS-XXXX）|
| event_type | ENUM | NOT NULL | ops_event_type_enum（见枚举）|
| school_id | UUID | FK→schools | 所属学校（平台级告警可空）|
| severity | ENUM | NOT NULL | ops_severity_enum(info/warning/error/critical) |
| source | VARCHAR(40) | NOT NULL | 来源功能（cert/websams/coze/sensitive/ddl/health/manual）|
| title | VARCHAR(200) | NOT NULL | 事件标题 |
| detail | JSONB | NOT NULL DEFAULT '{}' | 事件详情（结构化）|
| ref_id | VARCHAR(40) | | 关联业务主键（domain/refresh_no/metric/access_log_id/ddl id）|
| status | ENUM | NOT NULL DEFAULT 'open' | ops_event_status_enum(open/acknowledged/resolved/expired) |
| acknowledged_by | UUID | FK→users | 确认人 |
| acknowledged_at | TIMESTAMPTZ | | 确认时间 |
| resolved_at | TIMESTAMPTZ | | 解决时间 |
| audit_synced | BOOLEAN | NOT NULL DEFAULT false | 是否已同步 audit_logs（幂等双写标记）|
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — ops_event_type_enum：** `ssl_cert_expiry_alert/ssl_cert_renewed/websams_token_refresh/coze_quota_alert/coze_quota_rate_limited/sensitive_field_excessive_access/ddl_critical/ddl_approval_pending/health_status_change/manual_action`
**枚举 — ops_severity_enum：** `info/warning/error/critical`
**枚举 — ops_event_status_enum：** `open/acknowledged/resolved/expired`
**索引：** PRIMARY KEY (id)；UNIQUE (event_no)；INDEX (event_type)；INDEX (severity)；INDEX (status)；INDEX (created_at)；INDEX (school_id, created_at)
**外键：** (school_id)→schools(id), (acknowledged_by)→users(id)
> 与 `audit_logs` 以 `event_no` 幂等双写（`audit_synced` 标记），避免重复审计。保留 7 年，冷存 §17.6。

---

### 审计日志扩展（F-OPS-002/003/006/007/008/009）

> 沿用 §4.3 `audit_logs` 表；为运维自动化模块扩展 `audit_action` 枚举值。

```text
websams_token_refreshed, websams_token_refresh_failed, ssl_cert_auto_renewed,
ssl_cert_expiry_alert, coze_quota_rate_limited, sensitive_field_excessive_access,
ddl_operation_captured, ops_event_acknowledged, ops_event_resolved, ops_manual_action
```

**附加 metadata 约定：** event_no, entity_type（ssl_cert/token/coze_quota/sensitive_field/ddl/ops_event）, entity_id, domain, refresh_no, metric_name, field_type, command_tag, severity

---

> 文档一致性：表结构→DB-SCHEMA §25，字段→DATA-DICTIONARY §28，接口→API-DESIGN §16，规格→SPEC-COMPLETE F-AI-003 / F-I18N-003 / F-I18N-004 / F-NEW-002 / F-NEW-005。

---

## 25. 增强功能模块数据表（Issue #364，F-AI-003 / F-I18N-003 / F-I18N-004 / F-NEW-002 / F-NEW-005）

> **边界**：本节只建增强功能专属新增表。既有表承载相关能力：`notification_templates`（F-NEW-002 多渠道通知模板主档，见 §25.4 表定义，复用不重复建表）、`notifications` / `notification_deliveries`（§7.3 通知发送与送达回执，复用）、`scheduled_tasks` / `scheduled_task_executions`（§23 周期任务，F-NEW-005 定时推送可注册为 cron，复用调度基建）、`translation` 静态 i18n 在前端资源（不建表）。以下表 `school_id`→`schools(id)`，`created_by`→`users(id)`，`template_id`→`notification_templates(id)`。

### 表: ocr_tasks — OCR 识别任务（F-AI-003）

> 集中式 OCR 服务任务主档，统一对接 Azure Computer Vision，供各业务模块复用。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| task_no | VARCHAR(40) | NOT NULL, UNIQUE | 任务编号（OCR-YYYYMMDDHHMMSS-XXXX）|
| school_id | UUID | FK→schools | 所属学校（租户隔离/统计用）|
| doc_type | ENUM | NOT NULL | ocr_doc_type_enum（见枚举）|
| source_entity_type | VARCHAR(50) | NOT NULL | 业务源类型（leave_case/reimbursement/enrollment/application 等）|
| source_entity_id | UUID | NOT NULL | 业务源主键 |
| file_url | VARCHAR(500) | NOT NULL | 文件对象存储 URL |
| raw_text | TEXT | | 全量识别原始文本 |
| parse_schema | JSONB | NOT NULL DEFAULT '{}' | 应用字段解析模板（版本+字段映射）|
| engine | ENUM | NOT NULL DEFAULT 'azure' | ocr_engine_enum（见枚举）|
| status | ENUM | NOT NULL DEFAULT 'queued' | ocr_task_status_enum（见枚举）|
| error_code | VARCHAR(60) | | 失败错误码 |
| error_message | TEXT | | 失败错误信息 |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | 重试次数（≤3）|
| confidence | DECIMAL(5,4) | | 整体置信度（0~1）|
| superseded_task_id | UUID | FK→ocr_tasks | 被本任务覆盖/替代的旧任务（可空）|
| result_id | UUID | FK→ocr_results | 关联结果主档（可空，成功后写）|
| started_at | TIMESTAMPTZ | | 开始识别时间 |
| finished_at | TIMESTAMPTZ | | 结束时间 |
| created_by | UUID | FK→users | 提交人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — ocr_doc_type_enum：** `birth_certificate/hk_id/school_report/medical_certificate/insurance_cert`
**枚举 — ocr_engine_enum：** `azure/tesseract/manual`
**枚举 — ocr_task_status_enum：** `queued/running/succeeded/failed/manual_review`
**索引：** PRIMARY KEY (id)；UNIQUE (task_no)；UNIQUE (source_entity_type, source_entity_id, doc_type)；INDEX (doc_type)；INDEX (status)；INDEX (created_at)；INDEX (school_id, created_at)
**外键：** (school_id)→schools(id), (created_by)→users(id), (superseded_task_id)→ocr_tasks(id), (result_id)→ocr_results(id)
> 业务键 `(source_entity_type, source_entity_id, doc_type)` 幂等防重；重识别新建任务并以 `superseded_task_id` 标记旧任务。

---

### 表: ocr_results — OCR 识别结果字段（F-AI-003）

> OCR 任务抽取出的字段级识别结果，承接 F-AI-003 各文档类型的字段模板。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| task_id | UUID | FK→ocr_tasks, NOT NULL | 所属识别任务 |
| field | VARCHAR(60) | NOT NULL | 字段名（name/gender/birth_date/policy_no…）|
| value | TEXT | | 识别字段值 |
| confidence | DECIMAL(5,4) | | 该字段置信度（0~1）|
| matched | BOOLEAN | NOT NULL DEFAULT false | 是否与既有业务数据比对匹配（供人工核对）|
| matched_entity_id | UUID | | 比对命中业务实体（如匹配到学生）|
| review_status | ENUM | NOT NULL DEFAULT 'auto' | ocr_review_status_enum（见枚举）|
| reviewed_by | UUID | FK→users | 人工校正人 |
| reviewed_at | TIMESTAMPTZ | | 校正时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — ocr_review_status_enum：** `auto/confirmed/corrected/rejected`
**索引：** PRIMARY KEY (id)；INDEX (task_id)；INDEX (field)
**外键：** (task_id)→ocr_tasks(id), (reviewed_by)→users(id)
> `matched` 支持「OCR 比对 + 人工复核」（衔接 F-ENRL/收生 `documents_verified` 与零用现金 `ocr_status`）。

---

### 表: translation_cache — 翻译结果缓存（F-I18N-003）

> LLM 实时翻译结果缓存，同内容同语言对仅翻译一次，缓存有效期 24 小时。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| hash | VARCHAR(64) | NOT NULL, UNIQUE | SHA256(original_text + source_locale + target_locale) |
| original_text | TEXT | NOT NULL | 原文 |
| translated_text | TEXT | NOT NULL | 译文 |
| source_locale | VARCHAR(16) | NOT NULL | zh-HK/zh-CN/en |
| target_locale | VARCHAR(16) | NOT NULL | zh-HK/zh-CN/en |
| provider | ENUM | NOT NULL DEFAULT 'coze' | translation_provider_enum（见枚举）|
| confidence | DECIMAL(5,4) | | 翻译置信度（0~1）|
| glossary_applied | INTEGER | NOT NULL DEFAULT 0 | 应用的术语表条目数 |
| context | VARCHAR(100) | NOT NULL DEFAULT 'school_admin_hk' | 翻译场景上下文 |
| meta | JSONB | NOT NULL DEFAULT '{}' | 扩展（含 glossary_version）|
| cached | BOOLEAN | NOT NULL DEFAULT true | 是否缓存命中返回 |
| hit_count | INTEGER | NOT NULL DEFAULT 1 | 命中次数（统计用）|
| expires_at | TIMESTAMPTZ | NOT NULL | 过期时间（created_at + 24h）|
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — translation_provider_enum：** `coze/openai`
**索引：** PRIMARY KEY (id)；UNIQUE (hash)；INDEX (source_locale, target_locale)；INDEX (expires_at)
**业务规则：** `ON CONFLICT(hash) DO UPDATE` 幂等更新；`expires_at < now()` 视为过期可用新结果覆盖；`hit_count` 递增供统计。术语表更新时以 `meta.glossary_version` 使缓存失效。

---

### 表: locale_configs — Locale 格式本地化配置（F-I18N-004）

> 统一数字/货币/日期/时间/文件大小格式配置，支持 global/school/user 多粒度覆盖。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| scope | ENUM | NOT NULL | locale_scope_enum（global/school/user）|
| school_id | UUID | FK→schools | scope=school 时引用（可空）|
| user_id | UUID | FK→users | scope=user 时引用（可空）|
| locale | VARCHAR(16) | NOT NULL | zh-HK/zh-CN/en |
| is_default | BOOLEAN | NOT NULL DEFAULT false | scope=global 且 is_default=true 为默认行 |
| date_format | VARCHAR(40) | NOT NULL | 日期格式 |
| time_format | VARCHAR(40) | NOT NULL | 时间格式 |
| currency_code | VARCHAR(10) | NOT NULL DEFAULT 'HKD' | 货币码 |
| currency_symbol | VARCHAR(10) | NOT NULL DEFAULT 'HK$' | 货币符号 |
| number_locale | VARCHAR(30) | NOT NULL | 数字格式化 locale（如 zh-HK/en）|
| percent_format | VARCHAR(30) | NOT NULL DEFAULT '{0}%' | 百分比格式 |
| file_size_unit | VARCHAR(10) | NOT NULL DEFAULT 'mb' | 文件大小单位（mb/gb）|
| json_config | JSONB | NOT NULL DEFAULT '{}' | 扩展格式配置 |
| enabled | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| created_by | UUID | FK→users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — locale_scope_enum：** `global/school/user`
**索引：** PRIMARY KEY (id)；UNIQUE (scope, school_id, user_id, locale)
**外键：** (school_id)→schools(id), (user_id)→users(id), (created_by)→users(id)
> 每种 locale 恒有 `scope=global, is_default=true, school_id=NULL` 默认行；school/user 覆盖按 scope 递增优先级（user > school > global）。

---

### 表: notification_templates — 多渠道通知模板（F-NEW-002，既有表补全定义）

> 既有 `apps/backend/src/modules/notification/template.entity.ts` 已实现；此处记录完整表结构，DEV 复用不重复建表。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| template_code | VARCHAR(30) | UNIQUE, NOT NULL | 模板编号（TPL-…）|
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| category | ENUM | NOT NULL DEFAULT 'daily' | notification_category（bus/attendance/academic/fee/activity/emergency/daily）|
| urgency | ENUM | NOT NULL DEFAULT 'normal' | notification_urgency（info/normal/high/critical）|
| channels | JSONB | NOT NULL DEFAULT '["app_push"]' | 支持渠道（app_push/sms/email/feishu/whatsapp）|
| fallback_channel | VARCHAR(20) | | 备用渠道（主渠道失败自动切换）|
| wechat_template_id | VARCHAR(100) | | 微信模板 ID |
| app_push_title | VARCHAR(200) | | APP 推送标题 |
| app_push_content | TEXT | | APP 推送内容 |
| sms_content | TEXT | | 短信内容 |
| email_subject | VARCHAR(200) | | 邮件标题 |
| email_body | TEXT | | 邮件正文 |
| whatsapp_content | TEXT | | WhatsApp 内容 |
| variables | JSONB | NOT NULL DEFAULT '[]' | 变量列表 |
| min_interval_minutes | INTEGER | NOT NULL DEFAULT 30 | 最小发送间隔（分钟）|
| max_daily_per_parent | INTEGER | NOT NULL DEFAULT 5 | 每家长每日最大发送次数 |
| quiet_hours_start | VARCHAR(5) | | 免打扰开始（HH:mm）|
| quiet_hours_end | VARCHAR(5) | | 免打扰结束（HH:mm）|
| version | INTEGER | NOT NULL DEFAULT 1 | 模板版本 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| created_by | UUID | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**外键：** (school_id)→schools(id), (created_by)→users(id)
> 表为既有生产表（见 §1 说明基于实际 DB 审查），此处补全定义，不重复建表。

---

### 表: notification_delivery_rules — 通知交付规则（F-NEW-002 新增）

> 将 SPEC F-NEW-002 `delivery_rules`（频控/免打扰/备用/角色/灰度）规范化为与模板一对一的可维护规则。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| template_id | UUID | FK→notification_templates, NOT NULL, UNIQUE | 关联模板（一对一）|
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| min_interval_minutes | INTEGER | NOT NULL DEFAULT 30 | 同接收人最小发送间隔（分钟）|
| max_daily_per_recipient | INTEGER | NOT NULL DEFAULT 5 | 同接收人每日最大发送次数 |
| quiet_hours_start | VARCHAR(5) | | 免打扰开始（HH:mm；21:00-07:00）|
| quiet_hours_end | VARCHAR(5) | | 免打扰结束（HH:mm）|
| quiet_hours_sms_allowed | BOOLEAN | NOT NULL DEFAULT false | 免打扰期间是否允许紧急短信 |
| fallback_channel | VARCHAR(20) | | 备用渠道（紧急自动切换）|
| recipient_roles | JSONB | NOT NULL DEFAULT '[]' | 接收角色白名单（school_head/office/teacher/parents）|
| rollout_percent | INTEGER | NOT NULL DEFAULT 100 | 灰度发送比例（0-100）|
| enabled | BOOLEAN | NOT NULL DEFAULT true | 规则是否启用 |
| created_by | UUID | FK→users, NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**外键：** (template_id)→notification_templates(id), (school_id)→schools(id), (created_by)→users(id)
> `template_id UNIQUE` 保证与模板一对一；DEV 发送前先查该规则做频控/免打扰/备用判定。

---

### 表: report_definitions — 自定义报表定义（F-NEW-005）

> 拖拽式报表生成器配置主档，存储数据源/筛选/排序/分组聚合/图表/导出格式。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| report_no | VARCHAR(40) | NOT NULL, UNIQUE | 报表编号（RPT-YYYYMMDD-XXXX）|
| school_id | UUID | FK→schools, NOT NULL | 所属学校 |
| name | VARCHAR(128) | NOT NULL | 报表名称 |
| type | ENUM | NOT NULL | report_type_enum（见枚举）|
| data_source | JSONB | NOT NULL | 数据源配置（表关联 + 字段映射）|
| filters | JSONB | NOT NULL DEFAULT '[]' | 筛选条件（等值/范围/模糊，AND/OR）|
| sorts | JSONB | NOT NULL DEFAULT '[]' | 排序规则（多字段）|
| group_by | JSONB | NOT NULL DEFAULT '[]' | 分组聚合维度 |
| aggregations | JSONB | NOT NULL DEFAULT '[]' | 聚合（count/sum/avg/min/max）|
| chart_type | ENUM | NOT NULL DEFAULT 'numeric' | report_chart_type_enum（bar/pie/line/numeric）|
| export_formats | JSONB | NOT NULL DEFAULT '["pdf"]' | 导出格式（pdf/excel/csv）|
| sql_template | TEXT | | 生成的只读查询 SQL（DSL 白名单）|
| result_snapshot | JSONB | | 最近一次生成结果快照（数据一致比对）|
| owner_id | UUID | FK→users, NOT NULL | 创建人/负责人 |
| status | ENUM | NOT NULL DEFAULT 'active' | report_status_enum（见枚举）|
| last_generated_at | TIMESTAMPTZ | | 最近生成时间 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**枚举 — report_type_enum：** `daily_attendance/weekly_attendance/fee_report/semester_grade/annual_finance/dse_analysis/custom`
**枚举 — report_chart_type_enum：** `bar/pie/line/numeric`
**枚举 — report_status_enum：** `draft/active/paused/archived`
**索引：** PRIMARY KEY (id)；UNIQUE (report_no)；INDEX (school_id)；INDEX (owner_id)；INDEX (status)
**外键：** (school_id)→schools(id), (owner_id)→users(id)
> `sql_template` 仅允许只读白名单 DSL（防注入），DEV 以参数化 + read-only 事务执行。

---

### 表: report_schedules — 报表定时推送配置（F-NEW-005）

> 报表定时推送配置，DEV 以 `@nestjs/schedule` 注册为 cron 任务。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| report_id | UUID | FK→report_definitions, NOT NULL | 关联报表 |
| cron_expression | VARCHAR(64) | NOT NULL | cron 表达式（5 段）|
| recurrence_type | ENUM | NOT NULL | report_recurrence_enum（daily/weekly/monthly/semester）|
| push_format | ENUM | NOT NULL DEFAULT 'pdf' | report_push_format_enum（pdf/excel/csv）|
| push_channels | JSONB | NOT NULL DEFAULT '["app_push","email"]' | 推送渠道（app_push/email）|
| include_summary | BOOLEAN | NOT NULL DEFAULT true | 是否附正文摘要 |
| summary_locale | VARCHAR(16) | NOT NULL DEFAULT 'zh-HK' | 摘要语言 |
| active | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| last_run_at | TIMESTAMPTZ | | 最近执行时间 |
| next_run_at | TIMESTAMPTZ | NOT NULL | 下次执行时间 |
| created_by | UUID | FK→users, NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | 软删除 |

**枚举 — report_recurrence_enum：** `daily/weekly/monthly/semester`
**枚举 — report_push_format_enum：** `pdf/excel/csv`
**外键：** (report_id)→report_definitions(id), (created_by)→users(id)
> 预置报表（SPEC 六类：每日出勤摘要 Daily 08:00、每周出勤周报、每月收费报告、学期成绩汇总、年度财务摘要、DSE 成绩分析）由 seed 迁移建 `report_definitions` + `report_schedules`。

---

### 表: report_subscriptions — 报表订阅记录（F-NEW-005）

> 用户对报表的订阅/退订，推送接收人 = 报表 owner + 订阅者。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| report_id | UUID | FK→report_definitions, NOT NULL | 订阅的报表 |
| user_id | UUID | FK→users, NOT NULL | 订阅用户 |
| push_channels | JSONB | NOT NULL DEFAULT '["app_push","email"]' | 订阅用户的推送渠道 |
| delivery_format | ENUM | NOT NULL DEFAULT 'pdf' | report_push_format_enum |
| subscribed_at | TIMESTAMPTZ | NOT NULL | 订阅时间 |
| unsubscribed_at | TIMESTAMPTZ | | 退订时间 |
| active | BOOLEAN | NOT NULL DEFAULT true | 是否处于订阅中 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**外键：** (report_id)→report_definitions(id), (user_id)→users(id)
**索引：** PRIMARY KEY (id)；UNIQUE (report_id, user_id)
> `UNIQUE(report_id, user_id)` 防重复订阅；退订置 `active=false` + `unsubscribed_at`。

---

### 表: report_deliveries — 报表推送记录（F-NEW-005）

> 定时报表推送的每次执行记录，关联已发送通知，幂等防重。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| schedule_id | UUID | FK→report_schedules, NOT NULL | 所属定时配置 |
| report_id | UUID | FK→report_definitions, NOT NULL | 关联报表 |
| execution_no | VARCHAR(40) | NOT NULL, UNIQUE | 执行编号（RPTD-20260813-…）|
| scheduled_at | TIMESTAMPTZ | NOT NULL | 计划执行时间 |
| status | ENUM | NOT NULL | report_delivery_status_enum（pending/running/success/failed）|
| file_url | VARCHAR(500) | | 导出的 PDF/Excel/CSV 附件 URL |
| notification_id | UUID | FK→notifications | 关联 §7.3 已发送通知（可空）|
| summary_text | TEXT | | 正文摘要 |
| recipient_count | INTEGER | NOT NULL DEFAULT 0 | 接收人数 |
| error_message | TEXT | | 错误信息 |
| started_at | TIMESTAMPTZ | | |
| finished_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — report_delivery_status_enum：** `pending/running/success/failed`
**索引：** PRIMARY KEY (id)；UNIQUE (execution_no)；UNIQUE (schedule_id, scheduled_at)；INDEX (report_id, created_at)
**外键：** (schedule_id)→report_schedules(id), (report_id)→report_definitions(id), (notification_id)→notifications(id)
> `UNIQUE(schedule_id, scheduled_at)` 幂等防重复推送；发送复用 §7.3 通知架构（App + 邮件）。

---

### 审计日志扩展（F-AI-003, F-I18N-003, F-NEW-002, F-NEW-005）

> 沿用 §4.3 `audit_logs` 表；为增强功能模块扩展 `audit_action` 枚举值。

```text
ocr_task_submitted, ocr_task_completed, ocr_task_failed, ocr_result_corrected,
translation_requested, translation_cache_invalidated, locale_config_changed,
notification_delivery_rule_changed, report_definition_created, report_schedule_changed,
report_exported, report_delivered
```

**附加 metadata 约定：** task_no, entity_type（ocr_task/translation_cache/locale_config/notification_delivery_rule/report_definition/report_schedule/report_delivery）, entity_id, doc_type, engine, source_locale, target_locale, report_no
