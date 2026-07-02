# 数据字典 (Data Dictionary)
## Smart School Admin AI System — Data Dictionary
## v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查

---

> ⚠️ **重要说明**: 本文档 v1.5.1 起基于实际数据库架构审查，所有字段名、数据类型、枚举值均与生产环境 1:1 对应。

---

## 1. 概述

本数据字典定义智能校务助理系统中所有数据元素的详细说明。

---

## 2. 用户管理 (users)

### 2.1 用户主表 (users)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 用户唯一标识 |
| username | VARCHAR | 100 | UNIQUE, NOT NULL | 用户名/登录账号 |
| password | VARCHAR | 255 | NOT NULL | bcrypt哈希密码 |
| email | VARCHAR | 255 | UNIQUE | 邮箱 |
| phone | VARCHAR | 20 | | 电话 |
| name | VARCHAR | 100 | | 姓名 |
| role | ENUM | | | 角色 |
| status | ENUM | | | 状态 |
| hk_id | VARCHAR | 20 | UNIQUE | 香港身份证 |
| whatsapp | VARCHAR | 20 | | WhatsApp |
| class_name | VARCHAR | 50 | | 所属班级 |
| otp_secret | VARCHAR | 255 | | OTP密钥 |
| otp_enabled | BOOLEAN | | DEFAULT false | 是否启用OTP |
| failed_attempts | INTEGER | | DEFAULT 0 | 失败尝试次数 |
| lockout_until | TIMESTAMPTZ | | | 账户锁定截止时间 |
| password_history | ARRAY | | | 密码历史 |
| must_change_password | BOOLEAN | | DEFAULT false | 必须修改密码 |
| password_expires_at | TIMESTAMPTZ | | | 密码过期时间 |
| last_login_at | TIMESTAMPTZ | | | 最后登录时间 |
| last_login_ip | VARCHAR | 50 | | 最后登录IP |
| subsidy_eligibility | ENUM | | DEFAULT 'none' | 资助资格 |
| subsidy_start_date | DATE | | | 资助开始日期 |
| subsidy_end_date | DATE | | | 资助结束日期 |
| subsidy_certificate_no | VARCHAR | 50 | | 资助证明编号 |
| related_student_id | UUID | | | 关联学生ID（家长使用）|
| student_id | UUID | | | 学生ID |
| enrollment_date | DATE | | | 入学日期 |
| graduation_date | DATE | | | 毕业日期 |
| previous_school | VARCHAR | 200 | | 原学校 |
| home_address | TEXT | | | 家庭地址 |
| date_of_birth | DATE | | | 出生日期 |
| gender | VARCHAR | 10 | | 性别 |
| emergency_contact | VARCHAR | 100 | | 紧急联系人 |
| emergency_phone | VARCHAR | 20 | | 紧急联系电话 |
| is_first_login | BOOLEAN | | DEFAULT true | 首次登录 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| created_by | UUID | | | 创建人 |
| updated_by | UUID | | | 更新人 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**枚举值 — role (user_role_new):**
| 值 | 说明 |
|----|------|
| system_admin | 系统管理员 |
| school_director | 校务主任 |
| school_staff | 校务人员 |
| teacher | 教师 |
| parent | 家长 |
| student | 学生 |

**枚举值 — status (user_status_new):**
| 值 | 说明 |
|----|------|
| active | 启用 |
| inactive | 未激活 |
| disabled | 已禁用 |

**枚举值 — subsidy_eligibility:**
| 值 | 说明 |
|----|------|
| full_subsidy | 全额资助 |
| half_subsidy | 半额资助 |
| none | 无资助 |
| pending | 待审核 |

---

## 3. 角色与权限 (user_roles, permissions)

### 3.1 角色定义 (user_roles)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 角色ID |
| name | VARCHAR | 50 | NOT NULL | 角色名称 |
| description | TEXT | | | 说明 |
| permissions | JSONB | | DEFAULT '[]' | 权限数组 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

### 3.2 角色分配 (user_role_assignments)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 记录ID |
| user_id | UUID | | FK→users, NOT NULL | 用户 |
| role_id | UUID | | FK→user_roles | 角色 |
| school_id | UUID | | | 学校 |
| assigned_by | UUID | | | 分配人 |
| assigned_at | TIMESTAMPTZ | | NOT NULL | 分配时间 |

### 3.3 权限定义 (permissions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 权限ID |
| module | VARCHAR | 50 | NOT NULL | 所属模块 |
| code | VARCHAR | 100 | NOT NULL | 权限代码 |
| name_zh | VARCHAR | 100 | NOT NULL | 中文名称 |
| name_en | VARCHAR | 100 | | 英文名称 |
| description | TEXT | | | 说明 |
| resource_type | VARCHAR | 50 | | 资源类型 |
| action | VARCHAR | 20 | | 操作(create/read/update/delete/approve) |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

---

## 4. 会话与认证 (sessions, otp_sessions)

### 4.1 会话 (sessions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 会话ID |
| user_id | UUID | | FK→users, NOT NULL | 用户 |
| token | TEXT | | | JWT token |
| ip | VARCHAR | 50 | | IP地址 |
| user_agent | TEXT | | | User Agent |
| expires_at | TIMESTAMPTZ | | | 过期时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

### 4.2 OTP会话 (otp_sessions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | OTP会话ID |
| user_id | UUID | | FK→users | 用户 |
| otp_code | VARCHAR | 10 | | OTP验证码 |
| otp_type | ENUM | | | OTP类型 |
| status | ENUM | | DEFAULT 'active' | 状态 |
| expires_at | TIMESTAMPTZ | | NOT NULL | 过期时间 |
| failed_attempts | INTEGER | | DEFAULT 0 | 失败次数 |
| operation_type | VARCHAR | 50 | NOT NULL | 操作类型 |
| operation_details | JSONB | | | 操作详情 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — otp_type:**
| 值 | 说明 |
|----|------|
| sms | 短信OTP |
| email | 邮箱OTP |
| google_authenticator | Google验证器 |
| ukey | U盾 |

**枚举值 — otp_session_status:**
| 值 | 说明 |
|----|------|
| active | 有效 |
| expired | 已过期 |
| used | 已使用 |

---

## 5. 审计日志 (audit_logs)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 日志ID |
| operatorid | UUID | | | 操作者ID |
| action | ENUM | | NOT NULL | 操作类型 |
| description | TEXT | | | 描述 |
| ip | VARCHAR | 50 | | IP地址 |
| user_agent | TEXT | | | User Agent |
| metadata | JSONB | | DEFAULT '{}' | 附加数据 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**枚举值 — audit_action (部分):**
| 值 | 说明 |
|----|------|
| user_create | 创建用户 |
| user_update | 更新用户 |
| user_delete | 删除用户 |
| user_restore | 恢复用户 |
| user_status_change | 用户状态变更 |
| user_password_reset | 重置密码 |
| permission_change | 权限变更 |
| login | 登录 |
| logout | 登出 |
| attendance_check_in | 签到 |
| attendance_check_out | 签退 |
| leave_apply | 申请请假 |
| leave_approve | 批准请假 |
| leave_reject | 拒绝请假 |
| fee_create | 创建费用 |
| fee_update | 更新费用 |
| inquiry_create | 创建查询 |
| inquiry_reply | 回复查询 |

---

## 6. 班级管理 (classes)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 班级ID |
| name | VARCHAR | 50 | NOT NULL | 班级名称 |
| academic_year | VARCHAR | 9 | | 学年 |
| grade_level | VARCHAR | 20 | | 年级 |
| homeroom_teacher_id | UUID | | FK→users | 班主任 |
| assistant_teacher_id | UUID | | FK→users | 副班主任 |
| max_students | INTEGER | | DEFAULT 40 | 最大人数 |
| current_student_count | INTEGER | | DEFAULT 0 | 当前人数 |
| status | VARCHAR | 20 | DEFAULT 'active' | 状态 |
| school_id | UUID | | | 学校 |
| department_id | UUID | | | 部门 |
| room | VARCHAR | 50 | | 教室 |
| year | VARCHAR | 9 | | 学年 |
| description | TEXT | | | 描述 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

---

## 7. 出勤管理 (attendances)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 出勤记录ID |
| student_id | UUID | | FK→users | 学生 |
| teacher_id | UUID | | FK→users | 记录教师 |
| class_id | VARCHAR | 100 | | 班级 |
| attendance_date | DATE | | NOT NULL | 出勤日期 |
| check_in_time | TIME | | | 签到时间 |
| check_out_time | TIME | | | 签退时间 |
| status | ENUM | | NOT NULL | 出勤状态 |
| attendance_type | ENUM | | NOT NULL | 出勤类型 |
| remark | TEXT | | | 备注 |
| approver_id | UUID | | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | | 审批时间 |
| reminder_sent | BOOLEAN | | DEFAULT false | 提醒已发送 |
| reminder_sent_at | TIMESTAMPTZ | | | 提醒时间 |
| created_by | VARCHAR | 100 | NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_by | VARCHAR | 100 | | 更新人 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除 |
| sync_source | VARCHAR | 50 | DEFAULT 'MANUAL' | 同步来源 |
| sync_status | VARCHAR | 50 | DEFAULT 'SUCCESS' | 同步状态 |
| device_id | VARCHAR | 100 | | 设备ID |
| device_name | VARCHAR | 200 | | 设备名称 |
| batch_id | UUID | | | 批次ID |
| can_revoke_until | TIMESTAMPTZ | | | 可撤销截止时间 |

**枚举值 — status:**
| 值 | 说明 |
|----|------|
| present | 出勤 |
| absent | 缺勤 |
| late | 迟到 |
| leave_early | 早退 |
| sick_leave | 病假 |
| personal_leave | 事假 |
| official_leave | 公假 |

**枚举值 — attendance_type:**
| 值 | 说明 |
|----|------|
| check_in | 签到 |
| check_out | 签退 |
| manual | 手动 |

---

## 8. 请假管理 (leaves)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 请假记录ID |
| applicant_id | UUID | | FK→users, NOT NULL | 申请人 |
| leave_type | ENUM | | NOT NULL | 请假类型 |
| start_date | DATE | | NOT NULL | 开始日期 |
| end_date | DATE | | NOT NULL | 结束日期 |
| start_time | TIME | | | 开始时间 |
| end_time | TIME | | | 结束时间 |
| total_days | INTEGER | | NOT NULL | 总天数 |
| total_hours | INTEGER | | | 总小时数 |
| reason | TEXT | | NOT NULL | 原因 |
| status | ENUM | | DEFAULT 'pending' | 状态 |
| substitute_teacher_id | UUID | | FK→users | 代理教师 |
| substitute_teacher_class_hours | INTEGER | | | 代理课时数 |
| approver_id | UUID | | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | | 审批时间 |
| approval_comment | TEXT | | | 审批意见 |
| attachment_url | VARCHAR | 255 | | 附件URL |
| school_id | UUID | | | 学校 |
| student_id | UUID | | FK→users | 学生 |
| class_id | UUID | | | 班级 |
| ocr_status | VARCHAR | 30 | | OCR状态 |
| medical_cert_required | BOOLEAN | | DEFAULT false | 需医疗证明 |
| parent_submitted_at | TIMESTAMPTZ | | | 家长提交时间 |
| created_by | UUID | | | 创建人 |
| updated_by | UUID | | | 更新人 |
| deleted_at | TIMESTAMPTZ | | | 软删除 |
| director_comment | TEXT | | | 主任意见 |
| admin_recorded_by | UUID | | | 备案人 |
| admin_recorded_at | TIMESTAMPTZ | | | 备案时间 |
| ai_review_flagged | BOOLEAN | | DEFAULT false | AI审核标记 |
| ai_review_note | TEXT | | | AI审核说明 |
| ai_verify_result | VARCHAR | 30 | | AI核验结果 |
| certificate_verify_result | VARCHAR | 30 | | 证明文件核验结果 |
| certificate_url | TEXT | | | 证明文件URL |
| verified_at | TIMESTAMPTZ | | | 核验时间 |
| follow_up_date | DATE | | | 跟进日期 |
| follow_up_content | TEXT | | | 跟进内容 |
| checked_in_at | TIMESTAMPTZ | | | 销假时间 |
| checked_in_by | UUID | | | 销假操作人 |
| parent_notified | BOOLEAN | | DEFAULT false | 家长已通知 |
| class_teacher_notified | BOOLEAN | | DEFAULT false | 班主任已通知 |
| bus_admin_notified | BOOLEAN | | DEFAULT false | 校车管理员已通知 |
| current_approval_level | VARCHAR | 30 | | 当前审批级别 |
| application_no | VARCHAR | 20 | UNIQUE | 申请编号 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — leave_type:**
| 值 | 说明 |
|----|------|
| sick_leave | 病假 |
| personal_leave | 事假 |
| official_leave | 公假 |
| annual_leave | 年假 |
| other | 其他 |

**枚举值 — status:**
| 值 | 说明 |
|----|------|
| pending | 待审批 |
| approved | 已批准 |
| rejected | 已拒绝 |
| cancelled | 已取消 |

---

## 9. 财务管理 (fees, fee_records, scholarship_applications)

### 9.1 费用定义 (fees)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 费用ID |
| fee_name | VARCHAR | 200 | NOT NULL | 费用名称 |
| description | TEXT | | | 说明 |
| amount | NUMERIC | | NOT NULL | 金额 |
| due_date | DATE | | | 截止日期 |
| academic_year | VARCHAR | 9 | | 学年 |
| category | VARCHAR | 50 | | 类别 |
| is_active | BOOLEAN | | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

### 9.2 缴费记录 (fee_records)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 记录ID |
| student_id | UUID | | FK→users, NOT NULL | 学生 |
| fee_id | UUID | | FK→fees, NOT NULL | 费用项目 |
| amount | NUMERIC | | NOT NULL | 应缴金额 |
| paid_amount | NUMERIC | | DEFAULT 0 | 已缴金额 |
| payment_date | DATE | | | 缴费日期 |
| payment_method | VARCHAR | 50 | | 缴费方式 |
| status | VARCHAR | 20 | DEFAULT 'unpaid' | 状态 |
| academic_year | VARCHAR | 9 | | 学年 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

### 9.3 奖学金申请 (scholarship_applications)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 申请ID |
| student_id | UUID | | FK→users, NOT NULL | 学生 |
| scholarship_name | VARCHAR | 200 | NOT NULL | 奖学金名称 |
| application_date | DATE | | NOT NULL | 申请日期 |
| amount | NUMERIC | | | 金额 |
| status | VARCHAR | 20 | DEFAULT 'pending' | 状态 |
| academic_year | VARCHAR | 9 | | 学年 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

---

## 10. 家长查询 (inquiries, inquiry_replies)

### 10.1 家长查询 (inquiries)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 查询ID |
| inquiry_type | VARCHAR | 50 | | 查询类型 |
| subject | VARCHAR | 255 | | 主题 |
| content | TEXT | | NOT NULL | 内容 |
| parent_id | UUID | | FK→users | 家长 |
| student_id | UUID | | | 学生 |
| status | ENUM | | DEFAULT 'pending' | 状态 |
| priority | ENUM | | DEFAULT 'medium' | 优先级 |
| assigned_to | UUID | | | 分配给 |
| school_id | UUID | | | 学校 |
| is_ai_processed | BOOLEAN | | DEFAULT false | AI已处理 |
| ai_intent | VARCHAR | 100 | | AI意图 |
| is_escalated | BOOLEAN | | DEFAULT false | 是否升级 |
| escalation_reason | TEXT | | | 升级原因 |
| resolved_at | TIMESTAMPTZ | | | 解决时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除 |

**枚举值 — status:**
| 值 | 说明 |
|----|------|
| pending | 待处理 |
| in_progress | 处理中 |
| resolved | 已解决 |
| escalated | 已升级 |
| closed | 已关闭 |

**枚举值 — priority:**
| 值 | 说明 |
|----|------|
| low | 低 |
| medium | 中 |
| high | 高 |
| urgent | 紧急 |

### 10.2 查询回复 (inquiry_replies)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 回复ID |
| inquiry_id | UUID | | FK→inquiries, NOT NULL | 查询 |
| content | TEXT | | NOT NULL | 回复内容 |
| replier_id | UUID | | | 回复人 |
| is_official_reply | BOOLEAN | | DEFAULT false | 是否官方回复 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

---

## 11. 家长学生关联 (parent_student_links)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 关联ID |
| parent_id | UUID | | FK→users, NOT NULL | 家长 |
| student_id | UUID | | FK→users, NOT NULL | 学生 |
| relationship | VARCHAR | 50 | | 关系 |
| is_primary | BOOLEAN | | DEFAULT false | 是否主要联系人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

---

## 12. 午膳管理 (lunch_orders)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 订单ID |
| student_id | UUID | | FK→users, NOT NULL | 学生 |
| class_id | VARCHAR | 100 | | 班级 |
| order_date | DATE | | NOT NULL | 订餐日期 |
| meal_type | VARCHAR | 20 | DEFAULT 'regular' | 餐食类型 |
| menu_item_id | UUID | | | 菜单项 |
| notes | TEXT | | | 备注 |
| status | VARCHAR | 20 | DEFAULT 'confirmed' | 状态 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

---

## 13. 学校 (schools)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 学校ID |
| school_code | VARCHAR | 20 | UNIQUE, NOT NULL | 学校代码 |
| name_zh | VARCHAR | 200 | NOT NULL | 中文名称 |
| name_en | VARCHAR | 200 | | 英文名称 |
| address | TEXT | | | 地址 |
| is_active | BOOLEAN | | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

---

## 14. 枚举值汇总

### 14.1 用户相关

| 枚举名 | 值 |
|--------|-----|
| user_role_new | system_admin, school_director, school_staff, teacher, parent, student |
| user_status_new | active, inactive, disabled |
| subsidy_eligibility_enum | full_subsidy, half_subsidy, none, pending |

### 14.2 出勤相关

| 枚举名 | 值 |
|--------|-----|
| attendances_status_enum | present, absent, late, leave_early, sick_leave, personal_leave, official_leave |
| attendances_attendance_type_enum | check_in, check_out, manual |

### 14.3 请假相关

| 枚举名 | 值 |
|--------|-----|
| leaves_leave_type_enum | sick_leave, personal_leave, official_leave, annual_leave, other |
| leaves_status_enum | pending, approved, rejected, cancelled |

### 14.4 查询相关

| 枚举名 | 值 |
|--------|-----|
| inquiry_status_enum | pending, in_progress, resolved, escalated, closed |
| inquiry_priority_enum | low, medium, high, urgent |

### 14.5 OTP相关

| 枚举名 | 值 |
|--------|-----|
| otp_type | sms, email, google_authenticator, ukey |
| otp_session_status | active, expired, used |

### 14.6 审计相关

| 枚举名 | 值 |
|--------|-----|
| audit_action | user_create, user_update, user_delete, user_restore, user_status_change, user_password_reset, permission_change, login, logout, attendance_check_in, attendance_check_out, leave_apply, leave_approve, leave_reject, fee_create, fee_update, inquiry_create, inquiry_reply |

---

## 15. 数据质量规则

| 规则类别 | 规则描述 | 适用字段 |
|----------|----------|----------|
| **唯一性** | 用户名全校唯一 | users.username |
| **唯一性** | 邮箱全校唯一 | users.email |
| **唯一性** | 申请编号唯一 | leaves.application_no |
| **引用完整性** | 外键必须存在对应主键 | 所有外键字段 |
| **范围校验** | 结束日期 >= 开始日期 | leaves.start_date, leaves.end_date |
| **范围校验** | 金额 >= 0 | fees.amount, fee_records.amount |
| **格式校验** | 香港身份证格式 | users.hk_id |
| **状态约束** | 锁定时间必须在未来 | users.lockout_until |
| **业务逻辑** | OTP过期时间必须在未来 | otp_sessions.expires_at |

---

## 16. 招聘管理 (recruitment_positions, recruitment_applications, recruitment_interviews, recruitment_offers, recruitment_onboarding)

### 16.1 招聘职位 (recruitment_positions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 职位ID |
| title | VARCHAR | 100 | NOT NULL | 职位名称 |
| subject | VARCHAR | 50 | NOT NULL | 教授学科 |
| employment_type | ENUM | | NOT NULL | 零佣类型 (FULL_TIME/PART_TIME/CONTRACT) |
| salary_min | DECIMAL | 10,2 | NOT NULL | 最低薪资 |
| salary_max | DECIMAL | 10,2 | NOT NULL | 最高薪资 |
| salary_currency | VARCHAR | 10 | DEFAULT 'HKD' | 薪资货币 |
| location | VARCHAR | 200 | NOT NULL | 工作地点 |
| requirements | JSONB | | NOT NULL | 任职要求列表 (数组) |
| responsibilities | JSONB | | NOT NULL | 工作职责列表 (数组) |
| benefits | JSONB | | | 福利待遇列表 (数组) |
| application_deadline | DATE | | NOT NULL | 申请截止日期 |
| status | ENUM | | NOT NULL, DEFAULT 'DRAFT' | 职位状态 (DRAFT/PUBLISHED/PAUSED/CLOSED) |
| published_at | TIMESTAMPTZ | | | 发布时间 |
| paused_at | TIMESTAMPTZ | | | 暂停时间 |
| closed_at | TIMESTAMPTZ | | | 关闭时间 |
| school_id | UUID | | FK | 学校ID |
| created_by | UUID | | FK | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**枚举值 — employment_type:**
| 值 | 说明 |
|----|------|
| FULL_TIME | 全职 |
| PART_TIME | 兼职 |
| CONTRACT | 合约 |

**枚举值 — status (position_status):**
| 值 | 说明 |
|----|------|
| DRAFT | 草稿 |
| PUBLISHED | 已发布 |
| PAUSED | 已暂停 |
| CLOSED | 已关闭 |

**JSONB 字段结构 — requirements:**
```json
[
  "具香港教育局注册教师资格",
  "本科以上学历，中文相关学科优先",
  "至少3年教学经验"
]
```

**JSONB 字段结构 — responsibilities:**
```json
[
  "教授中一至中六中文科",
  "设计及执行教学计划",
  "参与课程发展工作"
]
```

**JSONB 字段结构 — benefits:**
```json
[
  "公积金",
  "医疗福利",
  "带薪年假"
]
```

---

### 16.2 招聘申请 (recruitment_applications)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 申请ID |
| application_number | VARCHAR | 50 | UNIQUE, NOT NULL | 申请编号 (APP-YYYY-NNNN) |
| position_id | UUID | | FK, NOT NULL | 职位ID |
| applicant_name | VARCHAR | 100 | NOT NULL | 申请人姓名 |
| email | VARCHAR | 255 | NOT NULL | 邮箱 |
| phone | VARCHAR | 20 | NOT NULL | 联系电话 |
| cv_url | VARCHAR | 500 | NOT NULL | 简历文件URL |
| cover_letter | TEXT | | | 求职信 |
| education | JSONB | | NOT NULL | 教育背景 (数组) |
| experience | JSONB | | | 工作经历 (数组) |
| status | ENUM | | NOT NULL, DEFAULT 'NEW' | 申请状态 (NEW/SCREENING/SHORTLISTED/INTERVIEW/REJECTED/OFFER) |
| screening_notes | TEXT | | | 筛选备注 |
| rejection_reason | TEXT | | | 拒绝原因 |
| rejected_at | TIMESTAMPTZ | | | 拒绝时间 |
| rejected_by | UUID | | FK | 拒绝人 |
| submitted_at | TIMESTAMPTZ | | NOT NULL | 提交时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**枚举值 — status (application_status):**
| 值 | 说明 |
|----|------|
| NEW | 新申请 |
| SCREENING | 筛选中 |
| SHORTLISTED | 候选 |
| INTERVIEW | 面试中 |
| REJECTED | 已淘汰 |
| OFFER | 已发Offer |

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

### 16.3 面试安排 (recruitment_interviews)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 面试ID |
| application_id | UUID | | FK, NOT NULL | 申请ID |
| interview_date | TIMESTAMPTZ | | NOT NULL | 面试时间 |
| duration_minutes | INTEGER | | NOT NULL | 面试时长 (分钟) |
| interview_type | ENUM | | NOT NULL | 面试形式 (ONLINE/ONSITE) |
| meeting_link | VARCHAR | 500 | | 线上会议链接 |
| location | VARCHAR | 200 | | 线下面试地点 |
| notes | TEXT | | | 备注 |
| status | ENUM | | NOT NULL, DEFAULT 'SCHEDULED' | 面试状态 (SCHEDULED/COMPLETED/CANCELLED) |
| overall_recommendation | ENUM | | | 综合建议 (RECOMMEND/NOT_RECOMMEND/PENDING) |
| final_notes | TEXT | | | 最终评语 |
| cancelled_at | TIMESTAMPTZ | | | 取消时间 |
| cancelled_by | UUID | | FK | 取消人 |
| cancellation_reason | TEXT | | | 取消原因 |
| completed_at | TIMESTAMPTZ | | | 完成时间 |
| completed_by | UUID | | FK | 完成人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — interview_type:**
| 值 | 说明 |
|----|------|
| ONLINE | 线上面试 |
| ONSITE | 线下面试 |

**枚举值 — status (interview_status):**
| 值 | 说明 |
|----|------|
| SCHEDULED | 已安排 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

**枚举值 — overall_recommendation:**
| 值 | 说明 |
|----|------|
| RECOMMEND | 推荐录用 |
| NOT_RECOMMEND | 不推荐录用 |
| PENDING | 待定 |

---

### 16.4 面试官 (recruitment_interviewers)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 关系ID |
| interview_id | UUID | | FK, NOT NULL | 面试ID |
| interviewer_id | UUID | | FK, NOT NULL | 面试官ID |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

---

### 16.5 面试评分 (recruitment_interview_scores)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 评分ID |
| interview_id | UUID | | FK, NOT NULL | 面试ID |
| interviewer_id | UUID | | FK, NOT NULL | 面试官ID |
| criterion | VARCHAR | 100 | NOT NULL | 评分维度 |
| score | INTEGER | | NOT NULL, CHECK (score >= 1 AND score <= 5) | 评分 (1-5) |
| comment | TEXT | | | 评语 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**评分维度预设值:**
| 值 | 说明 |
|----|------|
| 教学能力 | 教学思路、方法、效果 |
| 沟通表达 | 语言表达、逻辑性、互动能力 |
| 专业素养 | 学科知识、教学理念 |
| 综合素质 | 责任心、团队协作、学习能力 |

---

### 16.6 录用Offer (recruitment_offers)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | Offer ID |
| offer_number | VARCHAR | 50 | UNIQUE, NOT NULL | Offer编号 (OFF-YYYY-NNNN) |
| application_id | UUID | | FK, NOT NULL | 申请ID |
| salary | DECIMAL | 10,2 | NOT NULL | 薪资 |
| start_date | DATE | | NOT NULL | 预计到职日期 |
| position | VARCHAR | 100 | NOT NULL | 录用职位 |
| benefits_package | JSONB | | | 福利套餐 |
| status | ENUM | | NOT NULL, DEFAULT 'PENDING' | Offer状态 (PENDING/ACCEPTED/DECLINED/SIGNED) |
| valid_until | DATE | | NOT NULL | Offer有效期 |
| sent_at | TIMESTAMPTZ | | | 发送时间 |
| responded_at | TIMESTAMPTZ | | | 回应时间 |
| acceptance_token | VARCHAR | 255 | | 接受令牌 (用于外部链接) |
| signed_contract_url | VARCHAR | 500 | | 已签约合同URL |
| signed_at | TIMESTAMPTZ | | | 签约时间 |
| created_by | UUID | | FK | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — status (offer_status):**
| 值 | 说明 |
|----|------|
| PENDING | 待回应 |
| ACCEPTED | 已接受 |
| DECLINED | 已拒绝 |
| SIGNED | 已签约 |

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

### 16.7 入职流程 (recruitment_onboarding)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 入职流程ID |
| offer_id | UUID | | FK, NOT NULL | Offer ID |
| teacher_profile_id | UUID | | FK | 教师档案ID (入职后关联) |
| start_date | DATE | | NOT NULL | 到职日期 |
| status | ENUM | | NOT NULL, DEFAULT 'PENDING' | 入职状态 (PENDING/IN_PROGRESS/COMPLETED) |
| completed_at | TIMESTAMPTZ | | | 完成时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — status (onboarding_status):**
| 值 | 说明 |
|----|------|
| PENDING | 待开始 |
| IN_PROGRESS | 进行中 |
| COMPLETED | 已完成 |

---

### 16.8 入职任务 (recruitment_onboarding_tasks)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 任务ID |
| onboarding_id | UUID | | FK, NOT NULL | 入职流程ID |
| item | VARCHAR | 200 | NOT NULL | 任务项目 |
| description | TEXT | | | 任务描述 |
| required | BOOLEAN | | NOT NULL, DEFAULT true | 是否必填 |
| status | ENUM | | NOT NULL, DEFAULT 'PENDING' | 任务状态 (PENDING/COMPLETED) |
| document_url | VARCHAR | 500 | | | 文档URL |
| completed_at | TIMESTAMPTZ | | | 完成时间 |
| completed_by | UUID | | FK | 完成人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — status (task_status):**
| 值 | 说明 |
|----|------|
| PENDING | 待完成 |
| COMPLETED | 已完成 |

**预设任务项目:**
| 项目 | 描述 | 必填 |
|------|------|------|
| 收集个人资料 | 身份证、学历证明、履历 | 是 |
| 开设系统账户 | 创建教师系统账户 | 是 |
| 分配权限 | 分配教师权限 | 是 |
| 安排入职培训 | 新教师入职培训 | 否 |

---

## 17. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.9.0 | 2026-07-02 | 新增 Module 15 — 学生档案管理：新增 students、student_id_sequences、class_allocations、student_users、academic_years 五个表；学生档案与系统用户分离 |
| v1.6.0 | 2026-06-30 | 新增 Module 14 — 教师招聘管理模块：8个表 |
| v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查重建 |
| v1.5.0 | 2026-06-20 | 添加午膳管理、奖学金、家长查询队列模块 |
| v1.4.0 | 2026-06-03 | 初始版本 |

---

## 18. 学生档案管理 (students, academic_years, student_id_sequences, class_allocations, student_users)

### 18.1 学年 (academic_years)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 学年ID |
| year | VARCHAR | 9 | UNIQUE, NOT NULL | 学年，如 2026-2027 |
| start_date | DATE | | NOT NULL | 学年开始日期 |
| end_date | DATE | | NOT NULL | 学年结束日期 |
| is_current | BOOLEAN | | DEFAULT false | 是否当前学年 |
| status | ENUM | | DEFAULT 'active' | 状态 (active/archived) |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — status:**
| 值 | 说明 |
|----|------|
| active | 启用 |
| archived | 已归档 |

### 18.2 学生档案 (students)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 学生档案唯一标识 |
| student_id | VARCHAR | 10 | UNIQUE, NOT NULL | 学号（YYYYNNNN格式，自动生成）|
| name_zh | VARCHAR | 100 | NOT NULL | 中文姓名 |
| name_en | VARCHAR | 100 | | 英文姓名 |
| gender | ENUM | | NOT NULL | 性别 (male/female/other) |
| birth_date | DATE | | NOT NULL | 出生日期 |
| address | TEXT | | | 家庭地址 |
| phone | VARCHAR | 20 | | 联系电话 |
| email | VARCHAR | 255 | | 邮箱 |
| admission_date | DATE | | NOT NULL | 入学日期 |
| status | ENUM | | DEFAULT 'active' | 状态 |
| guardian_name | VARCHAR | 100 | | 监护人姓名 |
| guardian_phone | VARCHAR | 20 | | 监护人电话 |
| guardian_relationship | VARCHAR | 50 | | 监护人关系 |
| emergency_contact | VARCHAR | 100 | | 紧急联系人 |
| emergency_phone | VARCHAR | 20 | | 紧急联系电话 |
| hk_id | VARCHAR | 20 | | 香港身份证 |
| notes | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |
| created_by | UUID | | | 创建人 |
| updated_by | UUID | | | 更新人 |

**枚举值 — gender:**
| 值 | 说明 |
|----|------|
| male | 男 |
| female | 女 |
| other | 其他 |

**枚举值 — status:**
| 值 | 说明 |
|----|------|
| active | 在校 |
| graduated | 毕业 |
| withdrawn | 退学 |
| transferred | 转学 |

### 18.3 学号序列 (student_id_sequences)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 序列ID |
| academic_year | VARCHAR | 9 | UNIQUE, NOT NULL | 学年 |
| last_sequence | INTEGER | | NOT NULL DEFAULT 0 | 上一个分配的序号 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

### 18.4 班级分配 (class_allocations)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 分配ID |
| student_id | UUID | | FK→students, NOT NULL | 学生档案ID |
| class_id | UUID | | FK→classes, NOT NULL | 班级ID |
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 学年ID |
| academic_year | VARCHAR | 9 | NOT NULL | 学年（冗余字段，便于查询）|
| allocation_type | ENUM | | DEFAULT 'main' | 分配类型 |
| effective_date | DATE | | NOT NULL | 生效日期 |
| end_date | DATE | | | 结束日期 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — allocation_type:**
| 值 | 说明 |
|----|------|
| main | 主班 |
| elective | 选修 |
| temporary | 临时 |

### 18.5 学生-用户关联 (student_users)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 关联ID |
| student_id | UUID | | FK→students, UNIQUE, NOT NULL | 学生档案ID |
| user_id | UUID | | FK→users, UNIQUE, NOT NULL | 系统用户ID |
| is_primary_account | BOOLEAN | | DEFAULT true | 是否主要账户 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

