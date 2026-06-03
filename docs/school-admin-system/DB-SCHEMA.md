# 数据库架构设计文档
## Smart School Admin AI System — Database Schema Design
## v1.4.0 | 2026-06-03

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **规范化** | 至少 3NF，消除冗余更新异常 |
| **Audit First** | 所有表含 created_at / updated_at / created_by |
| **Soft Delete** | 敏感数据用 deleted_at 而非物理删除 |
| **多租户** | 所有表含 school_id 支持多校部署 |
| **UUID 主键** | 全局唯一、可安全暴露 |
| **JSONB** | 灵活字段存扩展属性，避免 schema 膨胀 |

## 2. 命名规范

| 对象 | 命名规则 | 示例 |
|------|----------|------|
| 表 | snake_case，复数 | students, attendance_records |
| 主键 | id (UUID) | id |
| 外键 | {entity}_id | student_id, class_id |
| 索引 | idx_{table}_{columns} | idx_attendance_student_date |
| 唯一约束 | uq_{table}_{columns} | uq_users_email_school |
| 时间戳 | _at | created_at, updated_at |
| 布尔标记 | is_ / has_ 前缀 | is_active, has_sen |

## 3. 表清单 (Table List)

**Core:** schools, departments, academic_years
**Users:** users, user_roles, user_role_assignments, permissions, role_permissions, user_abac_attributes, auth_methods, sessions, audit_logs
**Students:** students, classes, class_allocations, teachers, class_teachers, parents, parent_student_links
**Daily:** attendance_records, late_early_records, lunch_orders, lunch_order_items, bus_tracking, bus_stop_records, bus_student_subscriptions, leave_applications, fee_records, parent_inquiries, inquiry_replies, quick_reply_templates
**Cyclical:** enrollment_records, enrollment_documents, textbooks, textbook_distributions, exam_registrations, exam_results, admission_applications
**Finance:** fee_assessments, fee_items, fee_installments, petty_cash_transactions, petty_cash_authorizations, scholarships, scholarship_applications, assets, asset_barcodes, asset_maintenance, venues, venue_bookings, vendors, vendor_evaluations
**System:** reminders, reminder_deliveries, ai_knowledge_base, websams_sync_logs, eclass_sync_logs, translations, translation_keys, system_configs, backup_jobs

---

## 4. 详细表结构


### 4.1 核心管理表 (Core Management)

#### schools — 学校

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 学校唯一标识 |
| school_code | VARCHAR(20) | UNIQUE, NOT NULL | 学校代码 |
| name_zh | VARCHAR(200) | NOT NULL | 中文名称 |
| name_en | VARCHAR(200) | | 英文名称 |
| address | TEXT | | |
| phone | VARCHAR(20) | | |
| fax | VARCHAR(20) | | |
| edb_school_code | VARCHAR(20) | | EDB学校编号 |
| websams_org_unit | VARCHAR(100) | | WebSAMS组织单位 |
| academic_year_start | DATE | | |
| is_active | BOOLEAN | DEFAULT true | |
| settings | JSONB | DEFAULT '{}' | 扩展配置 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| created_by | UUID | FK->users | |

---

#### departments — 部门

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| name_zh | VARCHAR(100) | NOT NULL | |
| name_en | VARCHAR(100) | | |
| code | VARCHAR(20) | | |
| parent_id | UUID | FK->departments | 上级部门 |
| is_academic | BOOLEAN | DEFAULT false | |
| display_order | INT | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (school_id, code)

---

#### academic_years — 学年

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| year_code | VARCHAR(9) | NOT NULL | 如 2026-2027 |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| term1_start | DATE | | 第一学期开始 |
| term1_end | DATE | | |
| term2_start | DATE | | 第二学期开始 |
| term2_end | DATE | | |
| term3_start | DATE | | 第三学期开始 |
| term3_end | DATE | | |
| status | VARCHAR(20) | DEFAULT 'planning' | planning / active / closed |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (school_id, year_code)

---

### 4.2 用户与权限 (Users & Access Control)

#### users — 用户主表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| user_type | VARCHAR(20) | NOT NULL | SCHOOL_ADMIN / OFFICER / TEACHER / PARENT / STUDENT / SYSTEM |
| user_code | VARCHAR(50) | UNIQUE, NOT NULL | 工号/学号 |
| name_zh | VARCHAR(100) | NOT NULL | |
| name_en | VARCHAR(100) | | |
| hkid | VARCHAR(20) | | 香港身份证（加密）|
| email | VARCHAR(255) | | |
| phone | VARCHAR(20) | | |
| date_of_birth | DATE | | |
| gender | VARCHAR(1) | | M/F |
| nationality | VARCHAR(50) | | |
| address | TEXT | | |
| department_id | UUID | FK->departments | |
| employment_type | VARCHAR(20) | | permanent / contract / supply / relief |
| account_expiry_date | DATE | | |
| profile_photo_url | VARCHAR(500) | | |
| language_preference | VARCHAR(10) | DEFAULT 'zh-HK' | |
| is_active | BOOLEAN | DEFAULT true | |
| deleted_at | TIMESTAMPTZ | | 软删除 |
| last_login_at | TIMESTAMPTZ | | |
| password_changed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| created_by | UUID | FK->users | |

**INDEX:** idx_users_school_type ON (school_id, user_type)
**INDEX:** idx_users_email ON (email)
**INDEX:** idx_users_user_code ON (user_code)

---

#### user_roles — 用户角色

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| name | VARCHAR(50) | NOT NULL | |
| code | VARCHAR(30) | NOT NULL | |
| description | TEXT | | |
| is_system | BOOLEAN | DEFAULT false | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (school_id, code)

---

#### user_role_assignments — 角色分配

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK->users, NOT NULL | |
| role_id | UUID | FK->user_roles, NOT NULL | |
| school_id | UUID | FK->schools, NOT NULL | |
| assigned_by | UUID | FK->users | |
| assigned_at | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | | |
| reason | VARCHAR(255) | | |

**UNIQUE:** (user_id, role_id)

---

#### permissions — 权限定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| module | VARCHAR(50) | NOT NULL | 所属模块 |
| code | VARCHAR(100) | NOT NULL | 如 F-ATT-001.read |
| name_zh | VARCHAR(100) | NOT NULL | |
| name_en | VARCHAR(100) | | |
| description | TEXT | | |
| resource_type | VARCHAR(50) | | |
| action | VARCHAR(20) | | create / read / update / delete / approve |
| created_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (module, code)

---

#### role_permissions — 角色权限关联

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| role_id | UUID | FK->user_roles, NOT NULL | |
| permission_id | UUID | FK->permissions, NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (role_id, permission_id)

---

#### auth_methods — 认证方式

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK->users, NOT NULL | |
| method_type | VARCHAR(20) | NOT NULL | password / sms_otp / sso / feishu_oauth / biometric |
| identifier | VARCHAR(255) | | |
| credential_hash | TEXT | | |
| is_primary | BOOLEAN | DEFAULT false | |
| is_verified | BOOLEAN | DEFAULT false | |
| issued_at | TIMESTAMPTZ | | |
| expires_at | TIMESTAMPTZ | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### sessions — 会话

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK->users, NOT NULL | |
| school_id | UUID | FK->schools, NOT NULL | |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | |
| refresh_token_hash | VARCHAR(255) | | |
| ip_address | VARCHAR(45) | | |
| user_agent | TEXT | | |
| device_fingerprint | VARCHAR(255) | | |
| auth_method | VARCHAR(20) | | |
| mfa_verified | BOOLEAN | DEFAULT false | |
| started_at | TIMESTAMPTZ | NOT NULL | |
| last_activity_at | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| terminated_at | TIMESTAMPTZ | | |
| termination_reason | VARCHAR(50) | | logout / expired / revoked / security |
| created_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_sessions_user ON (user_id)
**INDEX:** idx_sessions_token_hash ON (token_hash)

---

#### audit_logs — 审计日志

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| user_id | UUID | FK->users | 操作用户（NULL=系统）|
| session_id | UUID | FK->sessions | |
| action | VARCHAR(100) | NOT NULL | 如 user.login / fee.create |
| resource_type | VARCHAR(50) | | |
| resource_id | UUID | | |
| changes | JSONB | | 变更前后数据 |
| ip_address | VARCHAR(45) | | |
| user_agent | TEXT | | |
| status | VARCHAR(20) | DEFAULT 'success' | success / failure / denied |
| failure_reason | VARCHAR(255) | | |
| metadata | JSONB | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_audit_school_time ON (school_id, created_at DESC)
**INDEX:** idx_audit_resource ON (resource_type, resource_id)
**INDEX:** idx_audit_user ON (user_id, created_at DESC)

---


### 4.3 学生与班级 (Students & Classes)

#### students — 学生

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| student_id | VARCHAR(20) | UNIQUE, NOT NULL | 学号 |
| hkid | VARCHAR(20) | | 香港身份证（加密）|
| name_zh | VARCHAR(100) | NOT NULL | |
| name_en | VARCHAR(100) | | |
| date_of_birth | DATE | NOT NULL | |
| gender | VARCHAR(1) | NOT NULL | M/F |
| nationality | VARCHAR(50) | | |
| home_address | TEXT | | |
| birth_country | VARCHAR(50) | | |
| birth_place | VARCHAR(50) | | HK / MO / CN / Other |
| ethnicity | VARCHAR(50) | | |
| religion | VARCHAR(50) | | |
| language_home | VARCHAR(50) | | |
| photo_url | VARCHAR(500) | | |
| enrollment_date | DATE | | |
| graduation_date | DATE | | |
| academic_year_id | UUID | FK->academic_years | |
| is_sen | BOOLEAN | DEFAULT false | 有特殊教育需要 |
| sen_type | VARCHAR(50) | | |
| sen_details | JSONB | | |
| medical_conditions | JSONB | | |
| emergency_contact_name | VARCHAR(100) | | |
| emergency_contact_phone | VARCHAR(20) | | |
| emergency_contact_relation | VARCHAR(50) | | |
| is_active | BOOLEAN | DEFAULT true | |
| deleted_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| created_by | UUID | FK->users | |

**INDEX:** idx_students_school ON (school_id)
**INDEX:** idx_students_academic_year ON (school_id, academic_year_id)
**INDEX:** idx_students_sen ON (school_id, is_sen)

---

#### classes — 班级

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| class_code | VARCHAR(10) | NOT NULL | 如 1A / S2C |
| grade | VARCHAR(3) | NOT NULL | 如 S1 / 中一 |
| class_name_zh | VARCHAR(50) | | |
| class_name_en | VARCHAR(50) | | |
| class_type | VARCHAR(20) | DEFAULT 'regular' | regular / intensive / elective |
| max_capacity | INT | DEFAULT 40 | |
| current_enrollment | INT | DEFAULT 0 | |
| homeroom_teacher_id | UUID | FK->teachers | 班主任 |
| assistant_teacher_id | UUID | FK->teachers | 副班主任 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (school_id, academic_year_id, class_code)

---

#### class_allocations — 学生班级分配

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| class_id | UUID | FK->classes, NOT NULL | |
| allocation_id | VARCHAR(30) | | 编班批次 |
| allocation_factors | JSONB | | 编班因素评分 |
| balance_score | DECIMAL(5,2) | | |
| is_primary | BOOLEAN | DEFAULT true | |
| enrolled_at | TIMESTAMPTZ | NOT NULL | |
| withdrawn_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (student_id, class_id, academic_year_id, is_primary)

---

#### teachers — 教师

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK->users, NOT NULL | |
| school_id | UUID | FK->schools, NOT NULL | |
| teacher_id | VARCHAR(20) | UNIQUE, NOT NULL | |
| qualifications | JSONB | | |
| subjects | JSONB | | |
| teaching_years | INT | | |
| is_class_teacher | BOOLEAN | DEFAULT false | |
| employment_start_date | DATE | | |
| employment_end_date | DATE | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### class_teachers — 班级教师分配

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| class_id | UUID | FK->classes, NOT NULL | |
| teacher_id | UUID | FK->teachers, NOT NULL | |
| role | VARCHAR(20) | DEFAULT 'homeroom' | homeroom / assistant / relief |
| effective_from | DATE | NOT NULL | |
| effective_to | DATE | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (class_id, teacher_id, role, effective_from)

---

#### parents — 家长

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| user_id | UUID | FK->users, NOT NULL | |
| school_id | UUID | FK->schools, NOT NULL | |
| parent_id | VARCHAR(20) | UNIQUE, NOT NULL | |
| name_zh | VARCHAR(100) | NOT NULL | |
| name_en | VARCHAR(100) | | |
| hkid | VARCHAR(20) | | |
| phone | VARCHAR(20) | | |
| email | VARCHAR(255) | | |
| relation | VARCHAR(20) | | father / mother / guardian / other |
| occupation | VARCHAR(100) | | |
| employer | VARCHAR(200) | | |
| is_primary_contact | BOOLEAN | DEFAULT false | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### parent_student_links — 家长学生关联

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| parent_id | UUID | FK->parents, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| school_id | UUID | FK->schools, NOT NULL | |
| link_type | VARCHAR(20) | DEFAULT 'parent' | parent / guardian / emergency |
| is_active | BOOLEAN | DEFAULT true | |
| verified_at | TIMESTAMPTZ | | |
| verified_by | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (parent_id, student_id, link_type)

---


### 4.4 每日晨检仪表板 (Daily Operations)

#### attendance_records — 出勤记录

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| class_id | UUID | FK->classes, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| date | DATE | NOT NULL | 考勤日期 |
| status | VARCHAR(20) | NOT NULL | present / absent / late / early / excused |
| source | VARCHAR(20) | | eclass / manual / biometric / websams |
| source_id | VARCHAR(100) | | 原始记录ID |
| excused_reason | VARCHAR(100) | | |
| excused_detail | TEXT | | |
| excused_document_url | VARCHAR(500) | | |
| parent_notified | BOOLEAN | DEFAULT false | |
| notification_sent_at | TIMESTAMPTZ | | |
| consecutive_days | INT | DEFAULT 0 | |
| alert_triggered | BOOLEAN | DEFAULT false | |
| alert_level | VARCHAR(20) | | none / low / medium / high |
| recorded_by | UUID | FK->users | |
| recorded_at | TIMESTAMPTZ | | |
| verified_by | UUID | FK->users | |
| verified_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (student_id, date)
**INDEX:** idx_attendance_school_date ON (school_id, date DESC)
**INDEX:** idx_attendance_class_date ON (class_id, date DESC)

---

#### late_early_records — 迟到/早退记录

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| class_id | UUID | FK->classes, NOT NULL | |
| date | DATE | NOT NULL | |
| type | VARCHAR(20) | NOT NULL | late_arrival / early_departure |
| recorded_time | TIMESTAMPTZ | NOT NULL | |
| threshold_time | TIME | NOT NULL | |
| duration_minutes | INT | | |
| reason_category | VARCHAR(50) | | |
| reason_detail | TEXT | | |
| parent_notified | BOOLEAN | DEFAULT false | |
| notification_sent_at | TIMESTAMPTZ | | |
| pattern_triggered | BOOLEAN | DEFAULT false | |
| pattern_description | VARCHAR(100) | | |
| counselor_notified | BOOLEAN | DEFAULT false | |
| recorded_by | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (student_id, date, type)
**INDEX:** idx_late_early_student ON (student_id, date DESC)

---

#### lunch_orders — 午膳订单

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| class_id | UUID | FK->classes, NOT NULL | |
| date | DATE | NOT NULL | |
| total_orders | INT | DEFAULT 0 | |
| total_amount | DECIMAL(10,2) | DEFAULT 0 | |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / confirmed / cancelled |
| confirmed_by | UUID | FK->users | |
| confirmed_at | TIMESTAMPTZ | | |
| supplier | VARCHAR(100) | | |
| delivery_time | TIME | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (class_id, date)
**INDEX:** idx_lunch_date ON (school_id, date DESC)

---

#### lunch_order_items — 午膳订单明细

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| lunch_order_id | UUID | FK->lunch_orders, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| menu_item | VARCHAR(100) | NOT NULL | |
| quantity | INT | DEFAULT 1 | |
| unit_price | DECIMAL(8,2) | | |
| total_price | DECIMAL(8,2) | | |
| dietary_restrictions | VARCHAR(100) | | |
| status | VARCHAR(20) | DEFAULT 'ordered' | ordered / cancelled / changed |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (lunch_order_id, student_id)

---

#### bus_tracking — 校车追踪

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| bus_id | VARCHAR(20) | NOT NULL | |
| bus_plate | VARCHAR(20) | | |
| driver_name | VARCHAR(100) | | |
| driver_phone | VARCHAR(20) | | |
| route_name | VARCHAR(50) | | |
| date | DATE | NOT NULL | |
| trip_type | VARCHAR(10) | | morning / afternoon |
| scheduled_departure | TIME | | |
| actual_departure | TIMESTAMPTZ | | |
| scheduled_arrival | TIME | | |
| actual_arrival | TIMESTAMPTZ | | |
| current_latitude | DECIMAL(10,8) | | |
| current_longitude | DECIMAL(11,8) | | |
| current_location | VARCHAR(200) | | |
| status | VARCHAR(20) | | pending / in_transit / arrived / delayed / cancelled |
| delay_minutes | INT | DEFAULT 0 | |
| delay_reason | TEXT | | |
| last_updated_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_bus_date ON (school_id, date DESC, trip_type)

---

#### bus_stop_records — 校车到站记录

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| bus_tracking_id | UUID | FK->bus_tracking, NOT NULL | |
| stop_name | VARCHAR(100) | NOT NULL | |
| stop_order | INT | NOT NULL | |
| scheduled_time | TIME | | |
| actual_time | TIMESTAMPTZ | | |
| passengers_on | INT | DEFAULT 0 | |
| passengers_off | INT | DEFAULT 0 | |
| is_completed | BOOLEAN | DEFAULT false | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (bus_tracking_id, stop_order)

---

#### leave_applications — 请假申请

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| application_no | VARCHAR(20) | UNIQUE, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| class_id | UUID | FK->classes, NOT NULL | |
| leave_type | VARCHAR(20) | NOT NULL | sick / personal / compassionate / other |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| total_days | DECIMAL(4,1) | | |
| reason | TEXT | | |
| document_url | VARCHAR(500) | | |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / approved / rejected / cancelled |
| parent_submitted_at | TIMESTAMPTZ | | |
| reviewed_by | UUID | FK->users | |
| reviewed_at | TIMESTAMPTZ | | |
| reviewed_comment | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_leave_student ON (student_id, start_date DESC)
**INDEX:** idx_leave_status ON (school_id, status)

---

#### fee_records — 每日收费记录

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| record_no | VARCHAR(20) | UNIQUE, NOT NULL | |
| class_id | UUID | FK->classes, NOT NULL | |
| fee_type | VARCHAR(30) | NOT NULL | tuition / activity / bus / meal / other |
| date | DATE | NOT NULL | |
| description | VARCHAR(200) | | |
| total_students | INT | | |
| total_collected | DECIMAL(12,2) | DEFAULT 0 | |
| total_outstanding | DECIMAL(12,2) | DEFAULT 0 | |
| status | VARCHAR(20) | DEFAULT 'open' | open / closed |
| closed_by | UUID | FK->users | |
| closed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_fee_date ON (school_id, date DESC)

---

#### parent_inquiries — 家长查询

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| inquiry_no | VARCHAR(20) | UNIQUE, NOT NULL | |
| parent_id | UUID | FK->parents, NOT NULL | |
| student_id | UUID | FK->students | |
| category | VARCHAR(50) | NOT NULL | attendance / fee / academic / general |
| subject | VARCHAR(200) | | |
| content | TEXT | NOT NULL | |
| priority | VARCHAR(10) | DEFAULT 'normal' | normal / urgent |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / processing / replied / closed |
| assigned_to | UUID | FK->users | |
| parent_submitted_at | TIMESTAMPTZ | NOT NULL | |
| first_response_at | TIMESTAMPTZ | | |
| resolved_at | TIMESTAMPTZ | | |
| satisfaction_rating | INT | | 1-5 |
| satisfaction_comment | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_inquiry_status ON (school_id, status)
**INDEX:** idx_inquiry_parent ON (parent_id, created_at DESC)

---

#### inquiry_replies — 查询回复

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| inquiry_id | UUID | FK->parent_inquiries, NOT NULL | |
| author_id | UUID | FK->users, NOT NULL | |
| author_type | VARCHAR(20) | NOT NULL | officer / ai |
| content | TEXT | NOT NULL | |
| is_ai_generated | BOOLEAN | DEFAULT false | |
| parent_viewed | BOOLEAN | DEFAULT false | |
| parent_viewed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**INDEX:** idx_inquiry_reply_inquiry ON (inquiry_id, created_at ASC)

---

#### quick_reply_templates — 快速回复模板

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| title | VARCHAR(100) | NOT NULL | |
| content | TEXT | NOT NULL | |
| category | VARCHAR(50) | | attendance / fee / general |
| usage_count | INT | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---


### 4.5 周期性校务管理 (Cyclical Operations)

#### enrollment_records — 入学注册

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| application_no | VARCHAR(20) | UNIQUE, NOT NULL | |
| student_name_zh | VARCHAR(100) | NOT NULL | |
| student_name_en | VARCHAR(100) | | |
| date_of_birth | DATE | NOT NULL | |
| gender | VARCHAR(1) | NOT NULL | M/F |
| school_of_origin | VARCHAR(200) | | |
| parent_name | VARCHAR(100) | NOT NULL | |
| parent_id | VARCHAR(20) | NOT NULL | |
| contact_phone | VARCHAR(20) | NOT NULL | |
| special_education_needs | BOOLEAN | DEFAULT false | |
| enrollment_type | VARCHAR(20) | NOT NULL | new / transfer / returning |
| status | VARCHAR(20) | DEFAULT 'submitted' | |
| class_assigned_id | UUID | FK->classes | |
| assigned_at | TIMESTAMPTZ | | |
| remarks | TEXT | | |
| websams_synced | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### textbooks — 课本

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| isbn | VARCHAR(20) | | |
| title_zh | VARCHAR(200) | NOT NULL | |
| title_en | VARCHAR(200) | | |
| subject | VARCHAR(50) | NOT NULL | |
| grade | VARCHAR(10) | NOT NULL | |
| publisher | VARCHAR(100) | | |
| price | DECIMAL(8,2) | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### exam_registrations — 考试报考

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| exam_type | VARCHAR(30) | NOT NULL | DSE / HKDSE / internal |
| exam_year | INT | NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| subjects_registered | JSONB | NOT NULL | 报考科目列表 |
| special_arrangements | JSONB | | 特别考试安排 |
| registration_status | VARCHAR(20) | DEFAULT 'draft' | draft / submitted / confirmed |
| fees_paid | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (student_id, exam_type, exam_year)

---

### 4.6 财务与资产 (Finance & Assets)

#### fee_assessments — 学费评定

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| academic_year_id | UUID | FK->academic_years, NOT NULL | |
| student_id | UUID | FK->students, NOT NULL | |
| assessment_no | VARCHAR(20) | UNIQUE, NOT NULL | |
| subsidy_eligibility | VARCHAR(20) | | full_grant / half_grant / none |
| total_annual | DECIMAL(10,2) | DEFAULT 0 | |
| total_paid | DECIMAL(10,2) | DEFAULT 0 | |
| total_outstanding | DECIMAL(10,2) | DEFAULT 0 | |
| status | VARCHAR(20) | DEFAULT 'active' | active / closed / waived |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### fee_items — 学费项目

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| fee_assessment_id | UUID | FK->fee_assessments, NOT NULL | |
| fee_type | VARCHAR(20) | NOT NULL | tuition / subsidy / aircon / activity / bus / insurance |
| annual_amount | DECIMAL(10,2) | DEFAULT 0 | |
| edb_subsidy | DECIMAL(10,2) | DEFAULT 0 | |
| net_payable | DECIMAL(10,2) | DEFAULT 0 | |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / paid / exempted |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### petty_cash_transactions — 零用现金交易

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| transaction_no | VARCHAR(20) | UNIQUE, NOT NULL | |
| transaction_type | VARCHAR(10) | NOT NULL | payment / receipt |
| amount | DECIMAL(10,2) | NOT NULL | |
| payee | VARCHAR(200) | | |
| description | TEXT | NOT NULL | |
| category | VARCHAR(50) | | printing / stationery / transport / other |
| receipt_url | VARCHAR(500) | | |
| dual_authorized | BOOLEAN | DEFAULT false | |
| float_balance_after | DECIMAL(10,2) | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| created_by | UUID | FK->users | |

---

#### assets — 资产

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| asset_code | VARCHAR(30) | UNIQUE, NOT NULL | |
| name_zh | VARCHAR(200) | NOT NULL | |
| name_en | VARCHAR(200) | | |
| category | VARCHAR(50) | NOT NULL | equipment / furniture / electronics / vehicle |
| location | VARCHAR(100) | | |
| purchase_date | DATE | | |
| purchase_price | DECIMAL(10,2) | | |
| supplier_id | UUID | FK->vendors | |
| warranty_expiry | DATE | | |
| status | VARCHAR(20) | DEFAULT 'active' | active / maintenance / retired / disposed |
| responsible_person_id | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### asset_barcodes — 资产条码

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| asset_id | UUID | FK->assets, NOT NULL | |
| barcode | VARCHAR(100) | UNIQUE, NOT NULL | |
| barcode_type | VARCHAR(20) | DEFAULT 'QR' | QR / Code128 / RFID |
| generated_at | TIMESTAMPTZ | NOT NULL | |
| printed_at | TIMESTAMPTZ | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### vendors — 供应商

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| vendor_code | VARCHAR(20) | UNIQUE, NOT NULL | |
| name_zh | VARCHAR(200) | NOT NULL | |
| name_en | VARCHAR(200) | | |
| business_registration | VARCHAR(50) | | 商业登记证 |
| contact_person | VARCHAR(100) | | |
| phone | VARCHAR(20) | | |
| email | VARCHAR(255) | | |
| address | TEXT | | |
| service_categories | JSONB | | |
| bank_account | VARCHAR(50) | | |
| status | VARCHAR(20) | DEFAULT 'active' | active / suspended / blacklisted |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.7 系统表 (System Tables)

#### reminders — 提醒任务

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| reminder_type | VARCHAR(30) | NOT NULL | deadline / event / follow_up |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| related_entity_type | VARCHAR(50) | | 关联实体类型 |
| related_entity_id | UUID | | 关联实体ID |
| due_date | DATE | NOT NULL | |
| due_time | TIME | | |
| priority | VARCHAR(10) | DEFAULT 'normal' | low / normal / high / urgent |
| assigned_to | UUID | FK->users | |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / snoozed / completed / cancelled |
| created_by | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### ai_knowledge_base — AI知识库 (FAQ)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| question_zh | TEXT | NOT NULL | |
| question_en | TEXT | | |
| answer_zh | TEXT | NOT NULL | |
| answer_en | TEXT | | |
| category | VARCHAR(50) | NOT NULL | attendance / fee / academic / general |
| keywords | JSONB | | |
| hit_count | INT | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### translations — 翻译

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| key | VARCHAR(200) | NOT NULL | 翻译键 |
| module | VARCHAR(50) | NOT NULL | |
| zh_hk | TEXT | | 繁体中文 |
| zh_cn | TEXT | | 简体中文 |
| en | TEXT | | 英文 |
| source | VARCHAR(20) | DEFAULT 'manual' | manual / ai / imported |
| is_verified | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (school_id, key)

---

#### system_configs — 系统配置

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| school_id | UUID | FK->schools, NOT NULL | |
| config_key | VARCHAR(100) | NOT NULL | |
| config_value | JSONB | NOT NULL | |
| description | TEXT | | |
| updated_by | UUID | FK->users | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE:** (school_id, config_key)

---

## 5. 索引汇总

| 表名 | 索引名 | 字段 | 类型 |
|------|--------|------|------|
| users | idx_users_school_type | (school_id, user_type) | B-tree |
| users | idx_users_email | (email) | B-tree |
| users | idx_users_user_code | (user_code) | B-tree |
| sessions | idx_sessions_user | (user_id) | B-tree |
| sessions | idx_sessions_token_hash | (token_hash) | B-tree |
| audit_logs | idx_audit_school_time | (school_id, created_at DESC) | B-tree |
| audit_logs | idx_audit_resource | (resource_type, resource_id) | B-tree |
| audit_logs | idx_audit_user | (user_id, created_at DESC) | B-tree |
| students | idx_students_school | (school_id) | B-tree |
| students | idx_students_academic_year | (school_id, academic_year_id) | B-tree |
| students | idx_students_sen | (school_id, is_sen) | B-tree |
| attendance_records | idx_attendance_school_date | (school_id, date DESC) | B-tree |
| attendance_records | idx_attendance_class_date | (class_id, date DESC) | B-tree |
| late_early_records | idx_late_early_student | (student_id, date DESC) | B-tree |
| lunch_orders | idx_lunch_date | (school_id, date DESC) | B-tree |
| bus_tracking | idx_bus_date | (school_id, date DESC, trip_type) | B-tree |
| leave_applications | idx_leave_student | (student_id, start_date DESC) | B-tree |
| leave_applications | idx_leave_status | (school_id, status) | B-tree |
| fee_records | idx_fee_date | (school_id, date DESC) | B-tree |
| parent_inquiries | idx_inquiry_status | (school_id, status) | B-tree |
| parent_inquiries | idx_inquiry_parent | (parent_id, created_at DESC) | B-tree |
| inquiry_replies | idx_inquiry_reply_inquiry | (inquiry_id, created_at ASC) | B-tree |

---

## 6. 外键关系汇总

```
schools
  <- departments.school_id
  <- academic_years.school_id
  <- users.school_id
  <- user_roles.school_id
  <- students.school_id
  <- classes.school_id
  <- teachers.school_id
  <- parents.school_id
  <- attendance_records.school_id
  <- lunch_orders.school_id
  <- bus_tracking.school_id
  <- leave_applications.school_id
  <- fee_records.school_id
  <- parent_inquiries.school_id
  <- enrollment_records.school_id
  <- fee_assessments.school_id
  <- petty_cash_transactions.school_id
  <- assets.school_id
  <- vendors.school_id
  <- reminders.school_id
  <- ai_knowledge_base.school_id
  <- translations.school_id
  <- system_configs.school_id

users (as created_by)
  <- schools.created_by
  <- departments.created_by
  <- academic_years.created_by
  <- students.created_by
  <- classes.created_by
  <- attendance_records.recorded_by
  <- lunch_orders.confirmed_by
  <- leave_applications.reviewed_by
  <- fee_records.closed_by
  <- parent_inquiries.assigned_to
  <- inquiry_replies.author_id
  <- quick_reply_templates.created_by
  <- reminders.assigned_to
  <- ai_knowledge_base.created_by

users (as user_id)
  <- teachers.user_id
  <- parents.user_id
  <- auth_methods.user_id
  <- sessions.user_id
  <- audit_logs.user_id

academic_years
  <- classes.academic_year_id
  <- class_allocations.academic_year_id
  <- attendance_records.academic_year_id
  <- lunch_orders.academic_year_id
  <- enrollment_records.academic_year_id
  <- textbooks.academic_year_id
  <- fee_assessments.academic_year_id

classes
  <- attendance_records.class_id
  <- late_early_records.class_id
  <- lunch_orders.class_id
  <- leave_applications.class_id
  <- fee_records.class_id
  <- class_allocations.class_id

students
  <- attendance_records.student_id
  <- late_early_records.student_id
  <- lunch_order_items.student_id
  <- leave_applications.student_id
  <- parent_student_links.student_id
  <- class_allocations.student_id
  <- fee_assessments.student_id
  <- exam_registrations.student_id

parents
  <- parent_student_links.parent_id
  <- parent_inquiries.parent_id
```

