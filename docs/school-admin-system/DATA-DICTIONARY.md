# 数据字典 (Data Dictionary)
## Smart School Admin AI System — Data Dictionary
## v1.5.1 | 2026-06-22 | 基于生产环境数据库实际审查
## +收生模块(Issue #358) | 2026-08-13 | 新增 §22 注册与收生管理模块字段字典
## +财务与学年结算模块(Issue #359) | 2026-08-13 | 新增 §23 财务与学年结算管理模块字段字典
## +资产与供应商管理模块(Issue #360) | 2026-08-13 | 新增 §24 资产与供应商管理模块字段字典
## +校车点名与查询模板模块(Issue #361) | 2026-08-13 | 新增 §25 校车点名与查询模板管理模块字段字典
## +AI自动化模块(Issue #362) | 2026-08-13 | 新增 §26 AI自动化管理模块字段字典
## +增强功能模块(Issue #364) | 2026-08-13 | 新增 §28 增强功能模块字段字典（OCR识别/实时翻译/Locale本地化/多渠道通知模板/自定义报表+定时推送）

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
| +校车点名与查询模板模块(Issue #361) | 2026-08-13 | 新增 §25 校车点名与查询模板管理模块字段字典与枚举（F-BUS-002, F-INQ-002）|
| +收生模块(Issue #358) | 2026-08-13 | 新增 §22 注册与收生管理模块字段字典与枚举（F-ENRL-001~003, F-ADM-001~002）|
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

---

## 19. 用户权限与认证模块 (user_roles, permissions, role_permissions, user_role_assignments, abac_policies, password_resets, permission_approval_requests, permission_approval_steps)

> 🔧 **补全说明（Issue #355）**：对应 F-USER-003~007，数据字典固化为 DEV 输入。
> `users`/`sessions`/`otp_sessions`/`audit_logs` 已在 §3~§5 定义，此处不重复；仅新增权限专项表字段字典与枚举汇总。

### 19.1 角色表 (user_roles)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 角色ID |
| name | VARCHAR | 50 | UNIQUE, NOT NULL | 角色标识（SCHOOL_ADMIN 等）|
| display_name | VARCHAR | 100 | NOT NULL | 角色中文名 |
| description | TEXT | | | 角色说明 |
| is_system | BOOLEAN | | DEFAULT false, NOT NULL | 是否系统内置（不可删/改名）|
| priority | INTEGER | | DEFAULT 100 | 角色优先级（小者高）|
| created_by | UUID | | | 创建人 (FK→users) |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**内置角色：** SYSTEM, SCHOOL_ADMIN, OFFICER, TEACHER, PARENT, STUDENT

### 19.2 权限表 (permissions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 权限ID |
| code | VARCHAR | 100 | UNIQUE, NOT NULL | 权限标识（grade:view:self）|
| name | VARCHAR | 100 | NOT NULL | 权限名称 |
| module | VARCHAR | 50 | NOT NULL | 所属模块 |
| resource_type | VARCHAR | 50 | NOT NULL | 资源类型 |
| action | VARCHAR | 20 | NOT NULL | view/create/update/delete/export/print/approve |
| is_sensitive | BOOLEAN | | DEFAULT false, NOT NULL | 是否敏感（触发二次认证/审批/脱敏）|
| description | TEXT | | | 说明 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**敏感权限（is_sensitive=true）：** committee_escalation_tmp, cross_class_data_access, data_export_grant, system_role_change, parent_unlink_child

### 19.3 角色权限关联 (role_permissions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 关联ID |
| role_id | UUID | | FK→user_roles, NOT NULL | 角色 |
| permission_id | UUID | | FK→permissions, NOT NULL | 权限 |
| granted_by | UUID | | | 授权人 (FK→users) |
| granted_at | TIMESTAMPTZ | | DEFAULT now(), NOT NULL | 授权时间 |
| valid_until | TIMESTAMPTZ | | | 授权有效期 |

**约束：** UNIQUE (role_id, permission_id)

### 19.4 用户角色关联 (user_role_assignments)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 关联ID |
| user_id | UUID | | FK→users, NOT NULL | 用户 |
| role_id | UUID | | FK→user_roles, NOT NULL | 角色 |
| assigned_by | UUID | | | 分配人 (FK→users) |
| assigned_at | TIMESTAMPTZ | | DEFAULT now(), NOT NULL | 分配时间 |
| valid_from | TIMESTAMPTZ | | | 生效时间 |
| valid_until | TIMESTAMPTZ | | | 失效时间 |
| status | ENUM | | DEFAULT 'active', NOT NULL | assignment_status |

**约束：** UNIQUE (user_id, role_id)
**枚举值 — assignment_status：** active/pending/expired/revoked

### 19.5 ABAC 策略表 (abac_policies)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 策略ID |
| policy_key | VARCHAR | 100 | UNIQUE, NOT NULL | 策略键（class_scope 等）|
| version | INTEGER | | DEFAULT 1, NOT NULL | 版本号 |
| title | VARCHAR | 200 | NOT NULL | 策略标题 |
| description | TEXT | | | 策略说明 |
| rego | TEXT | | NOT NULL | Rego 原文（不可改，仅存新版本）|
| target_roles | TEXT[] | | | 目标角色（空=全部）|
| status | ENUM | | DEFAULT 'draft', NOT NULL | policy_status |
| created_by | UUID | | | 创建人 (FK→users) |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| published_at | TIMESTAMPTZ | | | 发布时间 |
| rolled_back_from | INTEGER | | | 回滚来源版本 |

**约束：** UNIQUE (policy_key, version)
**枚举值 — policy_status：** draft/preview/active/inactive/rolled_back
**运行时加载：** status='active' 且 version 最高

### 19.6 凭证重置记录 (password_resets)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 记录ID |
| user_id | UUID | | FK→users, NOT NULL | 申请用户 |
| purpose | ENUM | | DEFAULT 'login_password', NOT NULL | reset_purpose |
| method | ENUM | | NOT NULL | reset_method |
| token_hash | VARCHAR | 255 | UNIQUE | 一次性令牌哈希 |
| otp_code_hash | VARCHAR | 255 | | OTP 哈希 |
| otp_expires_at | TIMESTAMPTZ | | | 过期时间 |
| attempts | INTEGER | | DEFAULT 0, NOT NULL | 失败次数（3 次锁）|
| status | ENUM | | DEFAULT 'pending', NOT NULL | reset_status |
| completed_by_admin | UUID | | | 管理员代重置人 (FK→users) |
| ip | VARCHAR | 50 | | 请求 IP |
| user_agent | TEXT | | | UA |
| used_at | TIMESTAMPTZ | | | 使用时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**枚举值 — reset_purpose：** login_password/parent_password/api_key/otp_secret
**枚举值 — reset_method：** email_link/email_otp/sms_otp/admin_reset/onsite
**枚举值 — reset_status：** pending/verified/completed/failed/expired

### 19.7 权限变更审批申请 (permission_approval_requests)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 申请ID |
| requester_id | UUID | | FK→users, NOT NULL | 申请人 |
| target_user_id | UUID | | FK→users, NOT NULL | 目标用户 |
| change_type | ENUM | | NOT NULL | change_type |
| role_id | UUID | | FK→user_roles | 目标角色 |
| permission_ids | JSONB | | | 目标权限ID列表 |
| request_reason | VARCHAR | 500 | NOT NULL | 申请理由 |
| valid_from | TIMESTAMPTZ | | | 生效时间 |
| valid_until | TIMESTAMPTZ | | | 失效时间 |
| status | ENUM | | DEFAULT 'pending', NOT NULL | approval_status |
| current_step | INTEGER | | DEFAULT 0, NOT NULL | 当前步骤 |
| total_steps | INTEGER | | DEFAULT 2, NOT NULL | 总步骤 |
| risk_level | ENUM | | DEFAULT 'medium', NOT NULL | risk_level |
| attachments | JSONB | | | 证明文件元数据（≤10MB）|
| rejection_reason | VARCHAR | 500 | | 驳回原因 |
| school_id | VARCHAR | | NOT NULL | 所属学校 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — change_type：** temp_committee_escalation/temp_super_admin/cross_class_data_access/data_export_grant/system_role_change/parent_unlink_child
**枚举值 — approval_status：** pending/pending_review/approved/rejected/expired/cancelled
**枚举值 — risk_level：** low/medium/high

### 19.8 权限变更审批步骤 (permission_approval_steps)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 步骤ID |
| request_id | UUID | | FK→permission_approval_requests, NOT NULL | 所属申请 |
| step_order | INTEGER | | NOT NULL | 步骤顺序 |
| approver_role | VARCHAR | 50 | NOT NULL | 该步审批角色 |
| approver_id | UUID | | FK→users | 实际审批人 |
| otp_verified | BOOLEAN | | DEFAULT false, NOT NULL | 是否完成二次认证 |
| attachment_reviewed | BOOLEAN | | DEFAULT false, NOT NULL | 是否审查附件 |
| status | ENUM | | DEFAULT 'pending', NOT NULL | step_status |
| comment | VARCHAR | 500 | | 审批意见 |
| approved_at | TIMESTAMPTZ | | | 批准时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**约束：** UNIQUE (request_id, step_order)
**枚举值 — step_status：** pending/approved/rejected/skipped

---

## 20. 整合及合规模块 (compliance_checks, witness_verifications, witness_steps, sync_tasks, sync_logs, sync_conflicts)

> 🔧 **补全说明（Issue #356）**：对应 F-INT-001/002 + F-COMP-001/002/003，数据字典固化为 DEV 输入。
> `audit_logs` 已在 §5 定义，此处不重复；本模块仅扩展 `audit_action` 枚举值（见下方 20.7），并新增合规/见证/同步专属表字段字典与枚举汇总。

### 20.1 合规检查记录 (compliance_checks)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 检查记录ID |
| action | VARCHAR | 50 | NOT NULL | 操作类型（view/export/print/update/sync_push 等）|
| data_class | ENUM | | NOT NULL | 数据级别 P1/P2/P3 |
| purpose | VARCHAR | 50 | NOT NULL | 使用目的（education_administration 等）|
| user_id | UUID | | FK→users | 请求用户 |
| user_role | VARCHAR | 50 | | 请求用户角色 |
| resource_type | VARCHAR | 50 | | 资源类型（student_record/health/financial 等）|
| resource_id | VARCHAR | 100 | | 目标资源ID |
| requested_fields | JSONB | | DEFAULT '[]' | 请求字段列表 |
| decision | ENUM | | NOT NULL | check_decision：allow/deny |
| reason | VARCHAR | 200 | | 拒绝/放行原因（purpose_violation 等）|
| check_items | JSONB | | DEFAULT '[]' | 各子检查项结果[{name,passed,detail}] |
| risk_level | ENUM | | DEFAULT 'low', NOT NULL | low/medium/high |
| ip | VARCHAR | 50 | | 请求 IP |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**枚举值 — data_class：** P1（高度敏感）/P2（中度敏感）/P3（一般）
**枚举值 — check_decision：** allow/deny
**枚举值 — risk_level：** low/medium/high

### 20.2 双人见证单 (witness_verifications)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 见证单ID |
| witness_type | ENUM | | NOT NULL | 触发场景（cash_receipt 等）|
| amount | NUMERIC | 12,2 | | 交易金额（现金场景）|
| currency | VARCHAR | 3 | DEFAULT 'HKD' | 币种 |
| business_ref | VARCHAR | 100 | | 关联业务单据标识（报销单等）|
| requester_id | UUID | | FK→users, NOT NULL | 操作发起人（员工）|
| witness_1_id | UUID | | FK→users | 第一见证人 |
| witness_2_id | UUID | | FK→users | 第二见证人（如有）|
| required_witnesses | INTEGER | | DEFAULT 2, NOT NULL | 所需见证人数（现金收取=1，其余=2）|
| status | ENUM | | DEFAULT 'triggered', NOT NULL | witness_status |
| escalation_notified | BOOLEAN | | DEFAULT false, NOT NULL | 是否已升级校务主任 |
| completed_at | TIMESTAMPTZ | | | 全部见证完成时间（交易锁定）|
| rejection_reason | VARCHAR | 500 | | 拒绝原因 |
| school_id | VARCHAR | | NOT NULL | 所属学校 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — witness_type：** cash_receipt/cash_payment/petty_cash/safe_open/cheque_sign
**枚举值 — witness_status：** triggered/await_first/await_second/completed/escalated/rejected/cancelled

### 20.3 双人见证步骤 (witness_steps)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 步骤ID |
| verification_id | UUID | | FK→witness_verifications, NOT NULL | 所属见证单 |
| step_order | INTEGER | | NOT NULL | 步骤顺序（1=第一见证人, 2=第二见证人）|
| witness_id | UUID | | FK→users, NOT NULL | 见证人用户ID |
| otp_verified | BOOLEAN | | DEFAULT false, NOT NULL | 是否完成本人二次认证（短信OTP）|
| status | ENUM | | DEFAULT 'pending', NOT NULL | step_status |
| comment | VARCHAR | 500 | | 见证意见/拒绝原因 |
| ip | VARCHAR | 50 | | 操作 IP |
| decided_at | TIMESTAMPTZ | | | 处理时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**约束：** UNIQUE (verification_id, step_order)
**枚举值 — step_status：** pending/approved/rejected

### 20.4 同步任务 (sync_tasks)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 任务ID |
| sync_ref | VARCHAR | 100 | UNIQUE, NOT NULL | 幂等键（同步唯一标识）|
| provider | ENUM | | NOT NULL | sync_provider：websams/eclass |
| sync_mode | ENUM | | NOT NULL | sync_mode：realtime/scheduled/batch/manual |
| operation | ENUM | | NOT NULL | sync_operation：pull/push/dual |
| domain | VARCHAR | 50 | NOT NULL | 数据域（student/enrollment/attendance/grade/health）|
| direction | VARCHAR | 20 | NOT NULL | school_to_external/external_to_school/bidirectional |
| status | ENUM | | DEFAULT 'queued', NOT NULL | sync_task_status |
| trigger_by | UUID | | FK→users | 触发人（manual 时必须）|
| scheduled_at | TIMESTAMPTZ | | | 计划执行时间 |
| started_at | TIMESTAMPTZ | | | 开始时间 |
| finished_at | TIMESTAMPTZ | | | 结束时间 |
| attempt | INTEGER | | DEFAULT 0, NOT NULL | 已重试次数 |
| max_retry | INTEGER | | DEFAULT 3, NOT NULL | 最大重试次数 |
| records_processed | INTEGER | | DEFAULT 0 | 处理记录数 |
| records_synced | INTEGER | | DEFAULT 0 | 成功同步记录数 |
| extended_meta | JSONB | | DEFAULT '{}' | 扩展元数据（过滤器、分页游标等）|
| school_id | VARCHAR | | NOT NULL | 所属学校 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — sync_provider：** websams/eclass
**枚举值 — sync_mode：** realtime/scheduled/batch/manual
**枚举值 — sync_operation：** pull/push/dual
**枚举值 — sync_task_status：** queued/running/retryable/conflict/succeeded/done/failed/cancelled/resolved

### 20.5 同步日志 (sync_logs)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 日志ID |
| task_id | UUID | | FK→sync_tasks, NOT NULL | 所属任务 |
| attempt | INTEGER | | DEFAULT 1, NOT NULL | 第几次尝试 |
| level | ENUM | | NOT NULL | log_level：info/warn/error |
| message | TEXT | | NOT NULL | 日志内容 |
| external_status_code | INTEGER | | | 外部 HTTP 状态码 |
| external_ref | VARCHAR | 200 | | 外部回执记录ID |
| latency_ms | INTEGER | | | 本次调用耗时 |
| payload_snapshot | JSONB | | | 脱敏后的请求/响应摘要 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**枚举值 — log_level：** info/warn/error

### 20.6 同步冲突表 (sync_conflicts)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 冲突ID |
| task_id | UUID | | FK→sync_tasks, NOT NULL | 所属任务 |
| conflict_type | ENUM | | NOT NULL | conflict_type |
| entity_type | VARCHAR | 50 | NOT NULL | 实体类型（student/attendance/grade 等）|
| entity_key | VARCHAR | 200 | NOT NULL | 实体唯一键（外部ID/学生校号等）|
| local_value | JSONB | | | 我方当前值（脱敏）|
| external_value | JSONB | | | 外部值（脱敏）|
| resolution | ENUM | | DEFAULT 'pending', NOT NULL | conflict_resolution |
| resolved_by | UUID | | FK→users | 裁决人 |
| resolve_note | VARCHAR | 500 | | 裁决备注 |
| resolved_at | TIMESTAMPTZ | | | 裁决时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**约束：** UNIQUE (task_id, entity_type, entity_key, conflict_type)
**枚举值 — conflict_type：** version_mismatch/key_conflict/value_discrepancy/link_break
**枚举值 — conflict_resolution：** pending/keep_external/keep_local/merge/reject

### 20.7 审计日志扩展 (audit_logs, 引用 §5，不外建表)

> 沿用 §5 audit_logs 表结构，不重复字段；为 F-COMP-003 扩展 `audit_action` 枚举值（并入 §7 已有 audit_action 集合）。

**新增 audit_action 值：** compliance_check_allowed, compliance_check_denied, witness_triggered, witness_approved_step, witness_rejected, witness_completed, witness_escalated, sync_task_created, sync_task_started, sync_task_succeeded, sync_task_failed, sync_task_retried, sync_task_conflict, sync_conflict_resolved, sync_data_pushed

**附加 metadata 约定：** retained（5y/7y/3y）, sync_ref, witness_id, compliance_id, decision（allow/deny）, data_class（P1/P2/P3）

## 21. 考试与成绩管理模块 (dse_exam_batches, dse_subjects, dse_registrations, exam_papers, exam_paper_requests, exam_paper_distributions, special_exam_arrangements, special_arrangement_approvals, report_card_batches, report_cards, report_card_approvals, report_card_revokes)

> 🔧 **补全说明（Issue #357）**：对应 F-EXAM-001~004 的表字段字典。表结构见 DB-SCHEMA 「模块 18: 考试与成绩管理模块」，系统设计见 SPEC-SYSTEM-DESIGN §18，接口见 API-DESIGN §9。
> 校外考试实例关联既有 `exams`，成绩发布审批复用 `grade_publish_*`，DSE 放榜成绩复用 `dse_release/dse_result`。

### 21.1 DSE 报考批次 (dse_exam_batches)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| academic_year | VARCHAR | 9 | NOT NULL | 学年度（2025-2026）|
| batch_code | VARCHAR | 50 | NOT NULL, UNIQUE | 批次编码（DSEB-2026）|
| name | VARCHAR | 100 | NOT NULL | 批次名称 |
| open_at | TIMESTAMPTZ | | NOT NULL | 报名开放时间 |
| close_at | TIMESTAMPTZ | | NOT NULL | 报名截止时间 |
| late_fee_per_subject | NUMERIC | 10,2 | NOT NULL DEFAULT 560.00 | 逾期报名费/科 |
| min_subjects | SMALLINT | | NOT NULL DEFAULT 6 | 最少科数 |
| max_subjects | SMALLINT | | NOT NULL DEFAULT 8 | 最多科数 |
| require_declaration | BOOLEAN | | NOT NULL DEFAULT true | 须签声明书 |
| require_photo | BOOLEAN | | NOT NULL DEFAULT true | 须报名照 |
| status | ENUM | | NOT NULL | dse_batch_status_enum |
| submitted_at | TIMESTAMPTZ | | | 提交 HKEAA 时间 |
| confirmed_at | TIMESTAMPTZ | | | HKEAA 确认时间 |
| hkeaa_ref | VARCHAR | 100 | | HKEAA 外部引用号 |
| created_by | UUID | | FK→users | 创建人 |
| updated_by | UUID | | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — dse_batch_status_enum：** draft/open/ongoing/closed/submitted/confirmed/cancelled

### 21.2 DSE 报考科目 (dse_subjects)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| subject_code | VARCHAR | 20 | NOT NULL, UNIQUE | 科目代码 |
| subject_name_zh | VARCHAR | 100 | NOT NULL | 中文名称 |
| subject_name_en | VARCHAR | 100 | NOT NULL | 英文名称 |
| category | ENUM | | NOT NULL | dse_subject_category_enum |
| is_core | BOOLEAN | | NOT NULL DEFAULT false | 是否核心 |
| language | VARCHAR | 10 | | 试卷语言 |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 可用 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**枚举值 — dse_subject_category_enum：** A_core/A_elective/B/C

### 21.3 DSE 报考记录 (dse_registrations)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_id | UUID | | FK→dse_exam_batches, NOT NULL | 报考批次 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| registration_id | VARCHAR | 50 | NOT NULL, UNIQUE | 报考编号（DSE-2026-001234）|
| student_no | VARCHAR | 50 | NOT NULL | 校号 |
| hkdse_no | VARCHAR | 30 | | 考生号 |
| subject_selections | JSONB | | NOT NULL DEFAULT '[]' | 所选科目数组 |
| total_subjects | SMALLINT | | NOT NULL | 科目总数 |
| special_arrangements | JSONB | | DEFAULT '{}' | 特别安排摘要 |
| has_special_needs | BOOLEAN | | NOT NULL DEFAULT false | 是否 SEN |
| declaration_signed | BOOLEAN | | NOT NULL DEFAULT false | 是否签声明 |
| photo_url | VARCHAR | 255 | | 报名照 |
| is_late | BOOLEAN | | NOT NULL DEFAULT false | 逾期报考 |
| late_fee_total | NUMERIC | 10,2 | DEFAULT 0.00 | 逾期费合计 |
| status | ENUM | | NOT NULL | dse_registration_status_enum |
| submitted_at | TIMESTAMPTZ | | | 提交时间 |
| confirmed_at | TIMESTAMPTZ | | | 确认时间 |
| withdraw_reason | TEXT | | | 退选原因 |
| created_by | UUID | | FK→users | |
| updated_by | UUID | | FK→users | |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**subject_selections 元素：** { subject_code, subject_name, category, language, is_core, status, seat_no }
**枚举值 — dse_registration_status_enum：** draft/prepared/late/submitted/hkeaa_confirmed/withdrawn/cancelled

### 21.4 试卷 (exam_papers)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| exam_id | UUID | | FK→exams | 关联考试 |
| paper_code | VARCHAR | 50 | NOT NULL | 试卷编码 |
| subject | VARCHAR | 100 | NOT NULL | 科目 |
| paper_name | VARCHAR | 200 | | 试卷标题 |
| paper_type | ENUM | | NOT NULL DEFAULT 'normal' | paper_type_enum |
| print_quantity | INTEGER | | NOT NULL DEFAULT 0 | 应印/实印数量 |
| supplier | VARCHAR | 100 | | 供应商 |
| order_no | VARCHAR | 100 | | 印刷订单号 |
| seal_no | VARCHAR | 100 | | 密封号码 |
| custody_chain | JSONB | | DEFAULT '[]' | 保管链 |
| storage_location | ENUM | | | paper_storage_enum |
| status | ENUM | | NOT NULL | exam_paper_status_enum |
| destroy_approved_at | TIMESTAMPTZ | | | 审批销毁时间 |
| destroy_approved_by | UUID | | FK→users | 审批人 |
| retention_until | DATE | | | 保存期限（归档时设置保留至日期）|
| remark | TEXT | | | |
| created_by | UUID | | FK→users | |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**枚举值 — paper_type_enum：** normal/braille/large_print/separate_room
**枚举值 — paper_storage_enum：** safe/room/other
**枚举值 — exam_paper_status_enum：** required/print_ordered/printed/sealed/in_safe/distributed/used/returned/archived/destroyed/rejected/cancelled/lost

### 21.5 试卷印刷申请 (exam_paper_requests)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| exam_id | UUID | | FK→exams | 关联考试 |
| request_code | VARCHAR | 50 | NOT NULL | 申请单号 |
| subject | VARCHAR | 100 | NOT NULL | 科目 |
| class_id | UUID | | FK→classes | 班级 |
| required_count | INTEGER | | NOT NULL | 需求数量 |
| ordered_count | INTEGER | | DEFAULT 0 | 下单数量 |
| supplier | VARCHAR | 100 | | 供应商 |
| order_no | VARCHAR | 100 | | 印刷订单号 |
| status | ENUM | | NOT NULL DEFAULT 'draft' | paper_request_status_enum |
| approved_by | UUID | | FK→users | 审批人 |
| created_by | UUID | | FK→users | |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**枚举值 — paper_request_status_enum：** draft/approved/ordered/received/cancelled

### 21.6 试卷分发/回收 (exam_paper_distributions)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| paper_id | UUID | | FK→exam_papers, NOT NULL | 试卷 |
| exam_id | UUID | | FK→exams | 考试 |
| invigilator_id | UUID | | FK→users | 监考员 |
| distributed_at | TIMESTAMPTZ | | | 分发时间 |
| distributed_count | INTEGER | | DEFAULT 0 | 分发数量 |
| signature | VARCHAR | 255 | | 签收凭证 |
| returned_at | TIMESTAMPTZ | | | 回收时间 |
| returned_count | INTEGER | | DEFAULT 0 | 回收数量 |
| return_status | ENUM | | | paper_return_status_enum |
| destroyed_at | TIMESTAMPTZ | | | 销毁时间 |
| note | TEXT | | | |
| created_by | UUID | | FK→users | |
| created_at | TIMESTAMPTZ | | NOT NULL | |

**枚举值 — paper_return_status_enum：** pending/partial/complete/missing

### 21.7 特别考试安排 (special_exam_arrangements)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| arrangement_id | VARCHAR | 50 | NOT NULL, UNIQUE | 安排单号 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| exam_id | UUID | | FK→exams | 考试 |
| subject | VARCHAR | 100 | NOT NULL | 科目 |
| paper_name | VARCHAR | 100 | | 试卷 |
| exam_date | DATE | | | 考试日期 |
| sen_type | VARCHAR | 50 | | SEN 类型 |
| sen_severity | VARCHAR | 20 | | 严重程度 |
| arrangements | JSONB | | NOT NULL DEFAULT '[]' | 安排明细 |
| status | ENUM | | NOT NULL | special_arrangement_status_enum |
| approved_by | UUID | | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | | |
| hkeaa_approved | BOOLEAN | | NOT NULL DEFAULT false | HKEAA 审批 |
| created_by | UUID | | FK→users | |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**arrangements 元素：** { type, description, duration_extension, room, invigilator_assigned, approval_ref, status }
**枚举值 — special_arrangement_status_enum：** draft/pending_approval/approved/active/completed/rejected/cancelled
**type 枚举（special_arrangement_type_enum）：** EXTRA_TIME/SEP_ROOM/SCRIBE/READER/BRAILLE/WHEELCHAIR

### 21.8 特别安排审批 (special_arrangement_approvals)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| arrangement_id | UUID | | FK→special_exam_arrangements, NOT NULL | 安排单 |
| approver_type | ENUM | | NOT NULL | approval_authority_enum |
| approval_level | INTEGER | | NOT NULL DEFAULT 1 | 审批级别 |
| action | VARCHAR | 20 | NOT NULL | approve/reject |
| approval_ref | VARCHAR | 100 | | 外部审批引用 |
| approver_id | UUID | | FK→users | 校内审批人 |
| approved_at | TIMESTAMPTZ | | NOT NULL | |
| comment | TEXT | | | |
| created_at | TIMESTAMPTZ | | NOT NULL | |

**枚举值 — approval_authority_enum：** school/hkeaa

### 21.9 成绩单批次 (report_card_batches)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_code | VARCHAR | 50 | NOT NULL, UNIQUE | 批次号 |
| academic_year | VARCHAR | 9 | NOT NULL | 学年 |
| term | VARCHAR | 10 | NOT NULL | 学期 |
| scope_type | ENUM | | NOT NULL | report_scope_enum |
| class_ids | JSONB | | DEFAULT '[]' | 班级ID数组 |
| grade_levels | JSONB | | DEFAULT '[]' | 年级数组 |
| grade_record_ids | JSONB | | DEFAULT '[]' | 来源 grade_records 快照 |
| total_students | INTEGER | | NOT NULL DEFAULT 0 | 应生成学生数 |
| ai_comment_enabled | BOOLEAN | | NOT NULL DEFAULT true | AI 评语 |
| watermark_enabled | BOOLEAN | | NOT NULL DEFAULT true | PDF 水印 |
| status | ENUM | | NOT NULL | report_card_batch_status_enum |
| approx_deadline | DATE | | | 审核截止 |
| teacher_comments_done | INTEGER | | DEFAULT 0 | 教师评语完成数 |
| principal_approved_done | INTEGER | | DEFAULT 0 | 校长审核完成数 |
| pdf_ready_at | TIMESTAMPTZ | | | PDF 就绪时间 |
| published_at | TIMESTAMPTZ | | | 发布时间 |
| publish_request_id | UUID | | FK→grade_publish_requests | 关联发布请求 |
| created_by | UUID | | FK→users | |
| updated_by | UUID | | FK→users | |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**枚举值 — report_scope_enum：** class/grade_level/school
**枚举值 — report_card_batch_status_enum：** draft/generating/pending_approval/approved/pdf_ready/published/cancelled

### 21.10 成绩单 (report_cards)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_id | UUID | | FK→report_card_batches, NOT NULL | 批次 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| grade_record_id | UUID | | FK→grade_records | 来源成绩记录 |
| subjects | JSONB | | NOT NULL DEFAULT '[]' | 各科快照 |
| overall_score | NUMERIC | 5,2 | NOT NULL | 加权总分 |
| class_rank | INTEGER | | | 班内排名 |
| grade_rank | INTEGER | | | 年级排名 |
| conduct_grade | VARCHAR | 5 | | 操行等级 |
| attendance_rate | VARCHAR | 10 | | 出席率 |
| comment_json | JSONB | | DEFAULT '{}' | AI+人工评语 |
| status | ENUM | | NOT NULL | report_card_status_enum |
| submitted_at | TIMESTAMPTZ | | | 教师提交时间 |
| pdf_url | VARCHAR | 255 | | PDF 地址 |
| last_rank_compare | JSONB | | DEFAULT '{}' | 上次排名对比 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**subjects 元素：** { subject, score, grade, class_rank, class_avg, teacher_comment, weight }
**枚举值 — report_card_status_enum：** draft/submitted/pending_approval/approved/published

### 21.11 成绩单审核 (report_card_approvals)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_id | UUID | | FK→report_card_batches, NOT NULL | 批次 |
| approver_id | UUID | | FK→users, NOT NULL | 审批人 |
| approval_level | INTEGER | | NOT NULL | 1=教研组长, 2=校长/副校长 |
| action | VARCHAR | 20 | NOT NULL | approve/reject |
| comment | TEXT | | | |
| previous_status | VARCHAR | 30 | | 前状态 |
| new_status | VARCHAR | 30 | | 后状态 |
| approved_at | TIMESTAMPTZ | | NOT NULL | |
| created_at | TIMESTAMPTZ | | NOT NULL | |

### 21.12 成绩单教师自撤回 (report_card_revokes)

| 字段 | 类型 | 长度 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | | PK | 主键 |
| report_card_id | UUID | | FK→report_cards, NOT NULL | 被撤回成绩单 |
| batch_id | UUID | | FK→report_card_batches | 批次 |
| teacher_id | UUID | | FK→users, NOT NULL | 撤回教师 |
| original_score | JSONB | | | 撤回前成绩快照 |
| reason | TEXT | | NOT NULL | 撤回理由（必填）|
| revoked_at | TIMESTAMPTZ | | NOT NULL | 撤回时间戳 |
| alert_ref | UUID | | FK→grade_audit_alerts | 关联审计告警 |
| created_at | TIMESTAMPTZ | | NOT NULL | |

**撤回约束（business）：** 提交后 48 小时内且批次未进入审批（PENDING_APPROVAL）时可撤回；次数不限；每次触发 `grade_revoked` 审计告警推送给校务主任。


---

## 22. 注册与收生管理模块 (student_applications, student_application_links, class_allocation_batches, class_allocation_results, textbook_catalog, textbook_batches, textbook_inventory_items, textbook_distributions, sspa_batches, sspa_applications, sspa_scores, jupas_applications, jupas_choices, jupas_reference_letters, jupas_appeals)

> 🔧 **补全说明（Issue #358）**：对应 F-ENRL-001~003、F-ADM-001~002，为 DEV 固化字段字典与枚举汇总。
> 既有复用表（`students`/`classes`/`class_allocations`/`academic_years`/`student_id_sequences`/`users`/`audit_logs`/`dse_offer_tracking`/`fee_records`）见前述章节，此处不重复；仅新增收生业务专属表与枚举。
> **边界**：教师招聘（recruitment, §16）与收生（学生入学）不交叉；课本费独立结算不复用学费表；JUPAS 申请期数据在本节，放榜后状态在 `dse_offer_tracking`。

### 22.1 新生申请/注册 (student_applications)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| application_no | VARCHAR | 30 | UNIQUE, NOT NULL | 申请编号（ENRL-YYYY-{S1&#124;TR}-NNNN）|
| application_type | ENUM | | NOT NULL | s1_new 中一新生 / transfer 转学生 |
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 目标学年 |
| student_name_zh | VARCHAR | 100 | NOT NULL | 中文姓名 |
| student_name_en | VARCHAR | 100 | | 英文姓名 |
| date_of_birth | DATE | | NOT NULL | 出生日期 |
| gender | ENUM | | NOT NULL | male/female/other |
| hk_id | VARCHAR | 20 | | 学生香港身份证 |
| school_of_origin | VARCHAR | 100 | | 原校（仅转学生）|
| parent_name | VARCHAR | 100 | NOT NULL | 家长姓名 |
| parent_hkid | VARCHAR | 20 | NOT NULL | 家长香港身份证 |
| parent_phone | VARCHAR | 20 | NOT NULL | 联系电话 |
| parent_email | VARCHAR | 255 | | 家长邮箱 |
| special_education_needs | BOOLEAN | | NOT NULL DEFAULT false | 是否 SEN（自愿披露）|
| sen_details | TEXT | | | SEN 详情（披露时）|
| documents | JSONB | | NOT NULL DEFAULT '[]' | OCR 文件引用数组 |
| document_checklist | JSONB | | NOT NULL DEFAULT '{}' | 文件核验清单（birth_certificate/hkid_copy/report_card/consent_form，各含 submitted/verified/missing）|
| application_deadline | DATE | | NOT NULL | 注册截止日期 |
| application_date | DATE | | NOT NULL | 申请日期 |
| status | ENUM | | NOT NULL | applied/screening/documents_verified/class_assigned/enrolled/rejected/withdrawn |
| enrolled_student_id | UUID | | FK→students | 注册完成后的学生主档 ID |
| registered_at | TIMESTAMPTZ | | | 注册完成时间 |
| registered_by | UUID | | FK→users | 注册经办人 |
| webSAMS_synced | BOOLEAN | | NOT NULL DEFAULT false | 是否同步 WebSAMS |
| rejected_by | UUID | | FK→users | 拒录人 |
| rejected_reason | TEXT | | | 拒录原因 |
| rejected_at | TIMESTAMPTZ | | | 拒录时间 |
| notes | TEXT | | | 备注 |
| created_by | UUID | | FK→users | 创建人 |
| updated_by | UUID | | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：**
- 中一注册截止 8 月 31 日（EDB 要求）；转学生到校后 14 天内。系统校验 `application_deadline`，超期须特殊审批。
- SEN 披露自愿，不因未披露影响录取。
- 注册完成（status=enrolled）时创建 `students` + 学号（`student_id_sequences`）+ 写 `class_allocations`；`enrolled_student_id` 关联回填。

### 22.2 家长申请只读授权 (student_application_links)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| application_id | UUID | | FK→student_applications, NOT NULL | 申请 |
| parent_user_id | UUID | | FK→users, NOT NULL | 家长用户 |
| relation | VARCHAR | 50 | NOT NULL | 关系（父亲/母亲/监护人）|
| created_at | TIMESTAMPTZ | | NOT NULL | |

**业务规则：** 只读授权，家长门户仅查看进度，不开放修改。

### 22.3 编班批次 (class_allocation_batches)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_code | VARCHAR | 50 | UNIQUE, NOT NULL | 批次编码（ALLOC-YYYY-S1-NNN）|
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 学年 |
| grade_level | VARCHAR | 20 | NOT NULL | 年级（如 S1）|
| num_classes | SMALLINT | | NOT NULL | 班级数 |
| weights | JSONB | | NOT NULL | 因子权重快照（6 因子）|
| candidate_student_ids | UUID[] | | NOT NULL DEFAULT '{}' | 候选学生 ID 集合 |
| status | ENUM | | NOT NULL | draft/computed/reviewing/approved/effective/archived |
| balance_score | NUMERIC | 5,2 | | 平衡度 0-100 |
| approved_by | UUID | | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | | 审批时间 |
| effective_at | TIMESTAMPTZ | | | 生效（回写）时间 |
| created_by | UUID | | FK→users | 创建人 |
| updated_by | UUID | | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**默认权重：** gender_ratio=25, academic_ability=25, sen_students=20, sibling_conflict=15, school_origin=10, special_talent=5

### 22.4 编班结果明细 (class_allocation_results)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_id | UUID | | FK→class_allocation_batches, NOT NULL | 批次 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| suggested_class_id | UUID | | FK→classes, NOT NULL | 建议班级 |
| final_class_id | UUID | | FK→classes | 生效班级（审批后回写）|
| ai_rationale | JSONB | | | AI 说明 |
| adjusted_by | UUID | | FK→users | 人工微调人 |
| adjusted_at | TIMESTAMPTZ | | | 微调时间 |
| adjustment_note | TEXT | | | 微调说明 |
| applied | BOOLEAN | | NOT NULL DEFAULT false | 是否已回写 class_allocations |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**业务规则：** `applied=true` 时系统写 `class_allocations`（allocation_type=main）；审批生效后不可再改数据源一致性。

### 22.5 课本目录 (textbook_catalog)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| subject | VARCHAR | 50 | NOT NULL | 科目 |
| title | VARCHAR | 255 | NOT NULL | 完整书名 |
| isbn | VARCHAR | 20 | | ISBN |
| edition | VARCHAR | 50 | | 版本 |
| unit_price | NUMERIC | 10,2 | NOT NULL | 单价（港币）|
| publisher | VARCHAR | 100 | | 出版社 |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否可用 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

### 22.6 课本批次 (textbook_batches)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_code | VARCHAR | 50 | UNIQUE, NOT NULL | TXTBK-BATCH-YYYY-NNN |
| academic_year | VARCHAR | 9 | NOT NULL | 学年度 |
| supplier_name | VARCHAR | 100 | | 供应商 |
| status | ENUM | | NOT NULL | draft/ordered/arrived/distributing/archived |
| ordered_at | TIMESTAMPTZ | | | 下单时间 |
| arrived_at | TIMESTAMPTZ | | | 到货时间 |
| created_by | UUID | | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | |

### 22.7 课本批次库存 (textbook_inventory_items)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_id | UUID | | FK→textbook_batches, NOT NULL | 批次 |
| catalog_id | UUID | | FK→textbook_catalog, NOT NULL | 书目 |
| barcode | VARCHAR | 50 | | 条码 |
| quantity_in | INTEGER | | NOT NULL DEFAULT 0 | 入库 |
| quantity_out | INTEGER | | NOT NULL DEFAULT 0 | 已分发 |
| quantity_returned | INTEGER | | NOT NULL DEFAULT 0 | 退回 |
| quantity_scrapped | INTEGER | | NOT NULL DEFAULT 0 | 报废 |
| unit_price | NUMERIC | 10,2 | NOT NULL | 单价快照 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**业务规则：** 分发扣减 quantity_out，退回回补 quantity_returned，报废核减 quantity_scrapped；有效库存 = in − out − returned(已退实书回补则相应调整) − scrapped。

### 22.8 课本分发记录 (textbook_distributions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| distribution_id | VARCHAR | 50 | UNIQUE, NOT NULL | TXTBK-{学年}-{班级}-{序号} |
| batch_id | UUID | | FK→textbook_batches, NOT NULL | 课本批次 |
| academic_year | VARCHAR | 9 | NOT NULL | 学年 |
| class_id | UUID | | FK→classes, NOT NULL | 班级 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| catalog_id | UUID | | FK→textbook_catalog, NOT NULL | 书目 |
| subject | VARCHAR | 50 | NOT NULL | 科目 |
| isbn | VARCHAR | 20 | | ISBN |
| unit_price | NUMERIC | 10,2 | NOT NULL | 单价 |
| quantity | INTEGER | | NOT NULL DEFAULT 1 | 数量 |
| discount_percent | NUMERIC | 5,2 | | NOT NULL DEFAULT 0 | 折扣（0-100）|
| distribution_status | ENUM | | NOT NULL | pending/distributed/replaced/returned |
| distributed_at | TIMESTAMPTZ | | | 分发时间 |
| distributed_by | UUID | | FK→users | 分发员工 |
| payment_status | ENUM | | NOT NULL | paid/unpaid/waived |
| payment_method | ENUM | | | cash/fps/octopus/e_payment/school_award |
| amount_due | NUMERIC | 10,2 | | NOT NULL DEFAULT 0.00 | 应付（数量×单价×折扣）|
| amount_paid | NUMERIC | 10,2 | | NOT NULL DEFAULT 0.00 | 已付 |
| barcode | VARCHAR | 50 | | 条码 |
| invoice_id | UUID | | FK→fee_records | 关联收款记录 |
| approval_required | BOOLEAN | | NOT NULL DEFAULT false | 是否需特批 |
| approved_by | UUID | | FK→users | 特批人 |
| return_reason | TEXT | | | 退换原因 |
| return_refund_amount | NUMERIC | 10,2 | | 退款（原价 80%）|
| notes | TEXT | | | 备注 |
| created_by | UUID | | FK→users | 创建人 |
| updated_by | UUID | | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**业务规则：**
- `subsidy_eligibility=full_subsidy`（读 `students`）→ `payment_status=waived`；`half_subsidy` → 系统自动计算 50% 应付。
- 退换：旧记录 `replaced`/`returned`，新记录 `distributed`，不重复收费；退货退款 = 原价 × 80%。
- 开学 30 天内可退换，超 30 天置 `approval_required=true`。
- 供应商退换货周期 10 个工作日。

### 22.9 SSPA 批次 (sspa_batches)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| year | VARCHAR | 9 | UNIQUE, NOT NULL | 年度 |
| name | VARCHAR | 100 | NOT NULL | 批次名称 |
| scoring_weights | JSONB | | NOT NULL | 评分权重 |
| seats | SMALLINT | | NOT NULL | 学额 |
| open_at | DATE | | | 开放日 |
| interview_date | DATE | | | 面试日 |
| announcement_date | DATE | | | 公布日 |
| status | ENUM | | NOT NULL | draft/open/scoring/announced/registered/archived |
| created_by | UUID | | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

### 22.10 SSPA 申请 (sspa_applications)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| batch_id | UUID | | FK→sspa_batches, NOT NULL | 批次 |
| application_no | VARCHAR | 30 | UNIQUE, NOT NULL | SSPA-YYYY-NNNN |
| application_id | UUID | | FK→student_applications | 关联新生申请 |
| student_name_zh | VARCHAR | 100 | NOT NULL | 学生名 |
| date_of_birth | DATE | | NOT NULL | 出生日期 |
| hk_id | VARCHAR | 20 | | 学生身份证 |
| parent_name | VARCHAR | 100 | NOT NULL | 家长名 |
| parent_phone | VARCHAR | 20 | NOT NULL | 联系电话 |
| school_of_origin | VARCHAR | 100 | | 原学校 |
| sibling_enrolled | BOOLEAN | | NOT NULL DEFAULT false | 兄弟姐妹在校 |
| parent_alumni | BOOLEAN | | NOT NULL DEFAULT false | 家长校友 |
| other_achievements | TEXT | | | 其他成就 |
| total_score | NUMERIC | 6,2 | | 总分 |
| rank | INTEGER | | | 排序 |
| result | ENUM | | | accepted/waitlist/rejected |
| edb_result | ENUM | | | offered/not_offered/pending |
| offer_confirmed | BOOLEAN | | NOT NULL DEFAULT false | 正取确认 |
| confirmed_at | TIMESTAMPTZ | | | 确认时间 |
| status | ENUM | | NOT NULL | applied/screened/scored/offered/confirmed/registered/withdrawn |
| created_by | UUID | | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**业务规则：** `total_score` = Σ `sspa_scores`；确认后进入新生注册流（关联 F-ENRL-001）。

### 22.11 SSPA 评分明细 (sspa_scores)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| application_id | UUID | | FK→sspa_applications, NOT NULL | 申请 |
| criterion | ENUM | | NOT NULL | academic/interview/sibling/alumni/achievement/principal_discretion |
| score | NUMERIC | 5,2 | NOT NULL | 分项得分 |
| max_score | NUMERIC | 5,2 | NOT NULL | 最高分 |
| scored_by | UUID | | FK→users | 评分人 |
| note | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | |

**默认最高分：** academic=30, interview=30, sibling=10, alumni=5, achievement=10, principal_discretion=15

### 22.12 JUPAS 申请 (jupas_applications)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| jupas_id | VARCHAR | 50 | UNIQUE, NOT NULL | JUPAS-YYYY-S6-NNNNN |
| academic_year | VARCHAR | 9 | NOT NULL | 学年 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| jupas_application_no | VARCHAR | 30 | NOT NULL | JUPAS 申请编号 |
| choices_count | SMALLINT | | NOT NULL DEFAULT 0 | 志愿数 |
| school_reference_status | ENUM | | NOT NULL | pending/in_progress/submitted |
| submission_deadline | DATE | | | 提交截止 |
| status | ENUM | | NOT NULL | collecting/draft/submitted/announced/archived |
| created_by | UUID | | FK→users | 创建人 |
| updated_by | UUID | | FK→users | 更新人 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

### 22.13 JUPAS 志愿 (jupas_choices)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| application_id | UUID | | FK→jupas_applications, NOT NULL | 申请 |
| priority | SMALLINT | | NOT NULL | 优先级（1 最高）|
| institution | VARCHAR | 100 | NOT NULL | 院校 |
| program | VARCHAR | 150 | NOT NULL | 课程 |
| program_code | VARCHAR | 30 | NOT NULL | 课程代码（JS4013）|
| status | ENUM | | NOT NULL | draft/confirmed/applied/offered/declined |
| created_at | TIMESTAMPTZ | | NOT NULL | |

### 22.14 JUPAS 推荐信 (jupas_reference_letters)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| application_id | UUID | | FK→jupas_applications, NOT NULL | 申请 |
| letter_type | ENUM | | NOT NULL | teacher/principal/school |
| teacher_id | UUID | | FK→users, NOT NULL | 撰写人 |
| subject | VARCHAR | 50 | | 任教科目 |
| content | TEXT | | | 正文 |
| word_count | INTEGER | | | 字数 |
| status | ENUM | | NOT NULL | draft/in_review/submitted/returned |
| ai_suggestion | JSONB | | | AI 大纲建议 |
| letter_stats | JSONB | | | 字数/术语一致性 |
| deadline | DATE | | | 截止 |
| submitted_at | TIMESTAMPTZ | | | 提交时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | |
| updated_at | TIMESTAMPTZ | | NOT NULL | |

**AI 写作辅助：** 建议 300-500 字；<200 字提示补充；自动生成三段大纲；术语一致性检查；历史参考（脱敏）。

### 22.15 JUPAS 上诉 (jupas_appeals)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| application_id | UUID | | FK→jupas_applications, NOT NULL | 申请 |
| reason | TEXT | | NOT NULL | 理由 |
| evidence | JSONB | | DEFAULT '[]' | 证据文件 |
| status | ENUM | | NOT NULL | received/under_review/resolved/dismissed |
| reviewed_by | UUID | | FK→users | 复核人 |
| resolution | TEXT | | | 处理结果 |
| resolved_at | TIMESTAMPTZ | | | 处理时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | |

### 22.16 枚举值汇总（收生模块新增）

| 枚举 | 取值 |
|------|------|
| student_app_type_enum | s1_new, transfer |
| student_app_status_enum | applied, screening, documents_verified, class_assigned, enrolled, rejected, withdrawn |
| alloc_batch_status_enum | draft, computed, reviewing, approved, effective, archived |
| textbook_batch_status_enum | draft, ordered, arrived, distributing, archived |
| txtbk_dist_status_enum | pending, distributed, replaced, returned |
| payment_status_enum | paid, unpaid, waived |
| payment_method_enum | cash, fps, octopus, e_payment, school_award |
| sspa_batch_status_enum | draft, open, scoring, announced, registered, archived |
| sspa_result_enum | accepted, waitlist, rejected |
| sspa_edb_enum | offered, not_offered, pending |
| sspa_app_status_enum | applied, screened, scored, offered, confirmed, registered, withdrawn |
| sspa_criterion_enum | academic, interview, sibling, alumni, achievement, principal_discretion |
| jupas_ref_status_enum | pending, in_progress, submitted |
| jupas_app_status_enum | collecting, draft, submitted, announced, archived |
| jupas_choice_status_enum | draft, confirmed, applied, offered, declined |
| jupas_letter_type_enum | teacher, principal, school |
| jupas_letter_status_enum | draft, in_review, submitted, returned |
| jupas_appeal_status_enum | received, under_review, resolved, dismissed |

---

## 23. 财务与学年结算管理模块 (fee_types, fee_records, receipts, daily_reconciliations, petty_cash_configs, petty_cash_reimbursements, petty_cash_transactions, year_end_settlements, archive_retention_policies, archive_cleanup_records, Issue #359)

> 🔧 **补全说明（Issue #359）**：为 F-FEE-001（每日收费追踪）、F-FIN-002（零用现金报销）、F-YREND-001（档案清理与销毁）、F-YREND-002（学年财务结算）提供字段字典。
> 边界见 DB-SCHEMA §20；系统设计见 SPEC-SYSTEM-DESIGN §20；接口见 API-DESIGN §11。

### 23.1 收费项目 (fee_types，衔接既有 fees)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| code | VARCHAR | 30 | UNIQUE, NOT NULL | 项目代码（air_con/activity/material/other 或自定义）|
| name | VARCHAR | 100 | NOT NULL | 项目名称 |
| description | TEXT | | | 说明 |
| default_amount | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 默认单价 |
| category | ENUM | | NOT NULL | daily/tuition/subsidy/textbook |
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 所属学年 |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 本表承载 F-FEE-001 日常一次性收费项目；长周期费用（学费/堂费）沿用既有 `fees`。

### 23.2 每日收费交易流水 (fee_records，衔接既有 fee_records)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| fee_type_id | UUID | | FK→fee_types, NOT NULL | 收费项目 |
| amount | NUMERIC | 12,2 | NOT NULL | 应缴金额 |
| paid_amount | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 已缴金额 |
| payment_method | ENUM | | NOT NULL | cash/cheque/fps/octopus/e_payment |
| payment_status | ENUM | | NOT NULL DEFAULT 'paid' | paid/submitted/pending/refunded（submitted=第三方处理中）|
| status_stale | BOOLEAN | | NOT NULL DEFAULT false | >10min 未更新标记 |
| receipt_no | VARCHAR | 30 | UNIQUE | 收据号（RCPT-YYYYMMDD-NNNN）|
| witness_verification_id | UUID | | FK→witness_verifications | 现金双人见证单（现金必填）|
| collected_by | UUID | | FK→users, NOT NULL | 经办人 |
| academic_year_id | UUID | | FK→academic_years | 学年 |
| collected_at | TIMESTAMPTZ | | NOT NULL | 收取时间 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 每笔交易必须出具收据；非现金缴费收款成功后触发电子收据推送（App/邮件/短信备用）；第三方支付 >10 分钟未更新标记 `status_stale` 提示联系校务处（不自动改账）。

### 23.3 收据 (receipts)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| receipt_no | VARCHAR | 30 | UNIQUE, NOT NULL | 收据号（RCPT-YYYYMMDD-NNNN）|
| fee_record_id | UUID | | FK→fee_records, NOT NULL | 关联收费流水 |
| student_id | UUID | | FK→students, NOT NULL | 学生 |
| amount | NUMERIC | 12,2 | NOT NULL | 金额 |
| payment_method | ENUM | | NOT NULL | payment_method_enum |
| pdf_url | VARCHAR | 500 | | 电子收据 PDF 引用 |
| push_status | ENUM | | NOT NULL DEFAULT 'pending' | pending/sent/failed/skipped |
| push_channels | JSONB | | NOT NULL DEFAULT '{}' | 各渠道状态（app/email/sms 含 timestamp/status）|
| issued_by | UUID | | FK→users, NOT NULL | 出据人 |
| issued_at | TIMESTAMPTZ | | NOT NULL | 出据时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** 电子收据推送失败自动重试，仍失败发短信备用并记 `push_status=failed`。

### 23.4 每日对账 (daily_reconciliations)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| reconciliation_date | DATE | | UNIQUE, NOT NULL | 对账日期 |
| academic_year_id | UUID | | FK→academic_years | 学年 |
| total_collected | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 实收合计 |
| transaction_count | INTEGER | | NOT NULL DEFAULT 0 | 交易笔数 |
| by_type | JSONB | | NOT NULL DEFAULT '{}' | 按 fee_type 汇总 |
| by_method | JSONB | | NOT NULL DEFAULT '{}' | 按 payment_method 汇总 |
| expected_total | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 账面应收 |
| discrepancy | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 差异金额 |
| cash_verified | BOOLEAN | | NOT NULL DEFAULT false | 现金是否双人核实 |
| witness_1_id | UUID | | FK→users | 见证人1 |
| witness_2_id | UUID | | FK→users | 见证人2 |
| receipts_issued | INTEGER | | NOT NULL DEFAULT 0 | 出具收据数 |
| status | ENUM | | NOT NULL DEFAULT 'open' | open/reviewing/balanced/investigating/reopened |
| closed_by | UUID | | FK→users | 关账人 |
| closed_at | TIMESTAMPTZ | | | 关账时间 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 现金金额须双人见证核实；差异 >HK$50 置 `investigating` 需调查；关账后出具日结报表。

### 23.5 备用金配置 (petty_cash_configs)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 学年 |
| base_single_limit | NUMERIC | 12,2 | NOT NULL DEFAULT 3000 | 单笔基础限额 HK$3,000 |
| cpi_current | NUMERIC | 10,2 | NOT NULL DEFAULT 1.00 | 当年 CPI 指数 |
| cpi_base | NUMERIC | 10,2 | NOT NULL DEFAULT 1.00 | 基准 CPI 指数 |
| effective_single_limit | NUMERIC | 12,2 | NOT NULL | 实际限额=base×(cpi_current/cpi_base) |
| float_cap | NUMERIC | 12,2 | NOT NULL DEFAULT 5000 | 备用金上限 HK$5,000 |
| float_low_threshold | NUMERIC | 12,2 | NOT NULL DEFAULT 500 | 备用金低额警示线 |
| config_status | ENUM | | NOT NULL DEFAULT 'pending' | pending/confirmed/archived |
| confirmed_by | UUID | | FK→users | 确认人（校务主任）|
| confirmed_at | TIMESTAMPTZ | | | 确认时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 学年切换自动计算新限额（CPI 公式）通知校务主任确认；确认后在系统公告通知（衔接 F-AUTO-002）。

### 23.6 零用现金报销申请 (petty_cash_reimbursements)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| transaction_no | VARCHAR | 30 | UNIQUE, NOT NULL | 交易编号（PC-YYYYMMDD-NNNN）|
| applicant_id | UUID | | FK→users, NOT NULL | 申请人（校务处同工）|
| amount | NUMERIC | 12,2 | NOT NULL | 报销金额 |
| payee | VARCHAR | 200 | NOT NULL | 收款方 |
| description | TEXT | | | 支出说明 |
| category | VARCHAR | 50 | | 支出类别（printing/stationery/transport/other）|
| receipt_url | VARCHAR | 500 | | 收据图片 URL |
| ocr_result | JSONB | | NOT NULL DEFAULT '{}' | OCR 结果（ocr_amount/ocr_status/original_text）|
| ocr_status | ENUM | | NOT NULL DEFAULT 'not_performed' | not_performed/ok/failed/match/mismatch |
| single_limit | NUMERIC | 12,2 | NOT NULL | 提交时生效单笔限额快照 |
| float_balance_before | NUMERIC | 12,2 | | 提交时备用金余额 |
| witness_level | ENUM | | NOT NULL DEFAULT 'single' | single/double/none |
| witness_verification_id | UUID | | FK→witness_verifications | 见证单（金额>500 双人）|
| status | ENUM | | NOT NULL DEFAULT 'draft' | 兼容保留状态 |
| workflow_status | ENUM | | NOT NULL DEFAULT 'draft' | draft/ocra_pending/manual_amount/witness_required/witness_in_progress/pending_approval/approved/paid/rejected/cancelled/blocked |
| approved_by | UUID | | FK→users | 审批人（校务主任）|
| approved_at | TIMESTAMPTZ | | | 审批时间 |
| rejection_reason | TEXT | | | 拒绝原因 |
| paid_at | TIMESTAMPTZ | | | 出账时间 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 金额 >HK$500 双人见证（第一见证人完成自动推送第二见证人）；≤HK$500 单人见证直接进审批；单笔超动态限额阻断；备用金 <HK$500 提示补充、为 0 禁止提交；OCR 金额黄色高亮+红色复核提示、OCR 失败降级手动录入。

### 23.7 备用金流水 (petty_cash_transactions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 学年 |
| tx_type | ENUM | | NOT NULL | top_up/expense |
| amount | NUMERIC | 12,2 | NOT NULL | 金额（top_up 正，expense 负）|
| reimbursement_id | UUID | | FK→petty_cash_reimbursements | 关联报销（expense 时必填）|
| float_balance_after | NUMERIC | 12,2 | NOT NULL | 交易后余额 |
| reference_no | VARCHAR | 30 | | 备用金补充单号（衔接 F-FIN-001）|
| created_by | UUID | | FK→users, NOT NULL | 经办人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** 当前备用金余额 = Σ(top_up) − Σ(expense)，以 `float_balance_after` 记录交易后快照。

### 23.8 学年财务结算批次 (year_end_settlements)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| reconciliation_no | VARCHAR | 30 | UNIQUE, NOT NULL | 结算编号（YREC-YYYY-YYYY）|
| fiscal_year | VARCHAR | 9 | UNIQUE, NOT NULL | 财政年度（2025-2026）|
| academic_year_id | UUID | | FK→academic_years, NOT NULL | 学年 |
| summary | JSONB | | NOT NULL DEFAULT '{}' | 汇总（total_fees_collected/total_expenses/net_balance/budget_variance）|
| by_category | JSONB | | NOT NULL DEFAULT '[]' | 分项聚合（[category,budget,collected,outstanding]）|
| outstanding_fees | JSONB | | NOT NULL DEFAULT '[]' | 挂账/欠费明细（含 sub_status）|
| total_fees_collected | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 费用实收合计 |
| total_expenses | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 支出合计 |
| net_balance | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 净结余 |
| budget_variance | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 预算差异 |
| report_pdf_url | VARCHAR | 500 | | 结算 PDF 报表 |
| status | ENUM | | NOT NULL DEFAULT 'draft' | draft/computing/ready_for_audit/locked/archived/suspended |
| audited_by | UUID | | FK→users | 审计确认人 |
| audited_at | TIMESTAMPTZ | | | 审计确认时间 |
| locked_at | TIMESTAMPTZ | | | 锁定时间 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 聚合范围=tuition/subsidy（既有 F-FIN-001）、daily_fees（F-FEE-001 fee_records）、textbook（textbook_distributions）、petty_cash（petty_cash_reimbursements PAID + petty_cash_transactions 支出）、budget（F-NEW-004）；全部只读汇聚；LOCKED 后当年度账目冻结，变更须开调整批次。

### 23.9 档案保存期限策略 (archive_retention_policies)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| retention_code | VARCHAR | 50 | UNIQUE, NOT NULL | 策略代码（student_registration/transcripts/discipline/health/financial_receipts/meeting_minutes/employee_contract/graduation_photos）|
| doc_type | VARCHAR | 100 | NOT NULL | 文档类型名 |
| retention_period_years | INTEGER | | | 保存期限（年），NULL=永久 |
| retention_basis | VARCHAR | 50 | NOT NULL | 起算基准（graduation/leave_school/termination/creation）|
| disposition | ENUM | | NOT NULL | destroy/hand_over/keep |
| hand_over_target | VARCHAR | 100 | | 移交对象（disposition=hand_over，如校监）|
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 永久保存（成绩表/毕业照）disposition=keep 不进入销毁队列；默认策略按 EDB 指引预置。

### 23.10 档案归档/清理记录 (archive_cleanup_records)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| retention_policy_id | UUID | | FK→archive_retention_policies, NOT NULL | 策略 |
| source_entity_type | VARCHAR | 100 | NOT NULL | 处置对象类型（引用既有表）|
| source_entity_id | VARCHAR | 64 | NOT NULL | 处置对象主键 |
| academic_year_id | UUID | | FK→academic_years | 关联学年 |
| retention_due_date | DATE | | NOT NULL | 到期日 |
| storage_url | VARCHAR | 500 | | 文件存储引用 |
| disposition | ENUM | | NOT NULL | destroy/hand_over/keep |
| status | ENUM | | NOT NULL DEFAULT 'pending' | pending/review/approved/destroying/destroyed/handing_over/handed_over/held/rejected |
| reviewed_by | UUID | | FK→users | 复核人 |
| reviewed_at | TIMESTAMPTZ | | | 复核时间 |
| approved_by | UUID | | FK→users | 审批人（校长/校务主任）|
| approved_at | TIMESTAMPTZ | | | 审批时间 |
| witness_verification_id | UUID | | FK→witness_verifications | 销毁双人见证单（destroy 时必填）|
| destroy_cert_no | VARCHAR | 30 | | 销毁证书号（DSTR-YYYYMMDD-NNNN）|
| destroyed_at | TIMESTAMPTZ | | | 销毁时间 |
| hand_over_target | VARCHAR | 100 | | 移交对象 |
| hand_over_recipient | VARCHAR | 100 | | 接收方/经办 |
| handed_over_at | TIMESTAMPTZ | | | 移交时间 |
| hold_reason | TEXT | | | 暂缓/保留原因 |
| rejected_reason | TEXT | | | 否决原因 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 销毁须双人见证（复用 witness_verifications）；争议/法律保留置 `held` 移出销毁队列；唯一键 (source_entity_type, source_entity_id, retention_policy_id) 防重复处置。

### 23.11 枚举值汇总（财务与学年结算模块新增）

| 枚举 | 取值 |
|------|------|
| fee_category_enum | daily, tuition, subsidy, textbook |
| fee_payment_status_enum | paid, submitted, pending, refunded |
| receipt_push_status_enum | pending, sent, failed, skipped |
| reconciliation_status_enum | open, reviewing, balanced, investigating, reopened |
| petty_cash_config_status_enum | pending, confirmed, archived |
| ocr_status_enum | not_performed, ok, failed, match, mismatch |
| witness_level_enum | single, double, none |
| petty_cash_workflow_status_enum | draft, ocra_pending, manual_amount, witness_required, witness_in_progress, pending_approval, approved, paid, rejected, cancelled, blocked |
| petty_cash_status_enum | 别名，同 petty_cash_workflow_status_enum |
| pq_tx_type_enum | top_up, expense |
| yre_settlement_status_enum | draft, computing, ready_for_audit, locked, archived, suspended |
| archive_disposition_enum | destroy, hand_over, keep |
| archive_cleanup_status_enum | pending, review, approved, destroying, destroyed, handing_over, handed_over, held, rejected |
| payment_method_enum（衔接既有，扩展 cheque）| cash, cheque, fps, octopus, e_payment |

## 24. 资产与供应商管理模块 (fixed_assets, inventory_sessions, inventory_items, venues, venue_rentals, maintenance_plans, maintenance_work_orders, vendors, vendor_evaluations, Issue #360)

> 🔧 **补全说明（Issue #360）**：为 F-ASSET-001（校产条码盘点）、F-ASSET-002（场地租借）、F-ASSET-003（设备保养）、F-VEND-001（供应商注册与评估）提供字段字典。
> 边界见 DB-SCHEMA §21；系统设计见 SPEC-SYSTEM-DESIGN §21；接口见 API-DESIGN §12。

### 24.1 固定资产主档 (fixed_assets)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| code | VARCHAR | 30 | UNIQUE, NOT NULL | 资产条码（ASSET-YYYY-<类别>-<NNNN>）|
| name | VARCHAR | 100 | NOT NULL | 资产名称 |
| category | ENUM | | NOT NULL | fixed/electronics/furniture/musical_instrument/sports/laboratory/library/audio_visual/computer/network |
| brand | VARCHAR | 100 | | 品牌 |
| model | VARCHAR | 100 | | 型号 |
| serial_no | VARCHAR | 100 | | 序列号 |
| location | VARCHAR | 200 | | 存放位置 |
| responsible_person_id | UUID | | FK→users | 责任人 |
| purchase_value | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 购置价值（HKD）|
| purchase_date | DATE | | | 购入日期 |
| vendor_id | UUID | | FK→vendors | 供应商（衔接 F-VEND-001）|
| condition | ENUM | | NOT NULL DEFAULT 'good' | excellent/good/fair/poor |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否在用 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 登记人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 条码 `code` 全系统唯一；`category` 为 SPEC 规定的 10 类。若 DEV 选择扩展既有 `assets` 表，上述固定部分字段并入 `assets`（`code` 复用 `assets.code`）。

### 24.2 盘点批次 (inventory_sessions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| session_no | VARCHAR | 30 | UNIQUE, NOT NULL | 盘点批次号（INV-YYYY-ANNUAL-001）|
| name | VARCHAR | 100 | NOT NULL | 批次名称 |
| academic_year_id | UUID | | FK→academic_years | 学年 |
| scope | JSONB | | NOT NULL DEFAULT '{}' | 盘点范围（category[]/location[]/responsible_person_id[]）|
| total_registered | INTEGER | | NOT NULL DEFAULT 0 | 应盘资产数 |
| assets_verified | INTEGER | | NOT NULL DEFAULT 0 | 实盘核对资产数 |
| verification_rate | NUMERIC | 5,2 | NOT NULL DEFAULT 0 | 盘点率（%）|
| discrepancies | JSONB | | NOT NULL DEFAULT '[]' | 差异清单汇总 |
| condition_summary | JSONB | | NOT NULL DEFAULT '{}' | 资产状况汇总 |
| status | ENUM | | NOT NULL DEFAULT 'draft' | draft/planning/in_progress/verifying/closed/cancelled |
| planned_by | UUID | | FK→users, NOT NULL | 规划人 |
| closed_by | UUID | | FK→users | 结题人 |
| closed_at | TIMESTAMPTZ | | | 结题时间 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 年度任务由 cron 创建（draft），负责人手动规划；`closed` 后批次只读，明细不可改动（防篡改），解锁须走重开流程。

### 24.3 盘点明细 (inventory_items)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| session_id | UUID | | FK→inventory_sessions, NOT NULL | 盘点批次 |
| fixed_asset_id | UUID | | FK→fixed_assets, NOT NULL | 应盘固定资产 |
| expected_location | VARCHAR | 200 | | 登记存放位置（快照）|
| scan_code | VARCHAR | 30 | | 实扫条码（条码不识别时为 null）|
| actual_location | VARCHAR | 200 | | 实盘地点 |
| scan_result | ENUM | | NOT NULL | scanned_matched/scanned_mismatch/missing/unknown |
| condition | ENUM | | | excellent/good/fair/poor |
| investigation_status | ENUM | | NOT NULL DEFAULT 'pending' | pending/resolved/closed |
| investigated_by | UUID | | FK→users | 调查人 |
| investigated_at | TIMESTAMPTZ | | | 调查时间 |
| investigation_note | TEXT | | | 调查结论 |
| scanned_by | UUID | | FK→users | 扫码人 |
| scanned_at | TIMESTAMPTZ | | | 扫码时间 |
| imported_from_batch | BOOLEAN | | NOT NULL DEFAULT false | 是否离线批量导入 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 同一批次同一固定资产唯一。差异判定：未扫到=missing；扫描地点≠登记地点=scanned_mismatch（location_discrepancy）；条码不识别=unknown。

### 24.4 场地档案 (venues)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| name | VARCHAR | 100 | UNIQUE, NOT NULL | 场地名称 |
| capacity | INTEGER | | | 容量（人）|
| hourly_rate | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 每小时租金（HKD）|
| deposit_amount | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 按金（HKD）|
| insurance_required | BOOLEAN | | NOT NULL DEFAULT false | 是否需投保 |
| address | VARCHAR | 200 | | 地址/位置 |
| available_hours | JSONB | | NOT NULL DEFAULT '{}' | 可用时段 |
| status | ENUM | | NOT NULL DEFAULT 'active' | active/inactive/maintenance |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 建档人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 内置定价模板（礼堂 800/2000/是、篮球场 400/1000/是、课室 200/500/否、活动室 300/500/否、游泳池 600/1500/是）可经本表参数化配置。

### 24.5 场地租借 (venue_rentals)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| request_no | VARCHAR | 30 | UNIQUE, NOT NULL | 租借单号（VR-YYYYMMDD-NNNN）|
| venue_id | UUID | | FK→venues, NOT NULL | 场地 |
| renter_type | ENUM | | NOT NULL | internal/external |
| renter_name | VARCHAR | 100 | NOT NULL | 租借方名称 |
| renter_contact | VARCHAR | 100 | | 租借方联系方式 |
| start_at | TIMESTAMPTZ | | NOT NULL | 开始时间 |
| end_at | TIMESTAMPTZ | | NOT NULL | 结束时间 |
| duration_hours | NUMERIC | 5,2 | NOT NULL DEFAULT 0 | 租用时长（小时）|
| total_amount | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 租金合计（时长×小时单价）|
| deposit_amount | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 按金（快照）|
| insurance_required | BOOLEAN | | NOT NULL DEFAULT false | 需投保 |
| insurance_provided | BOOLEAN | | NOT NULL DEFAULT false | 是否已提供保险单 |
| status | ENUM | | NOT NULL DEFAULT 'draft' | draft/pending_approval/approved/confirmed/in_progress/completed/closed/rejected/cancelled |
| applied_by | UUID | | FK→users | 申请人（内部）|
| approved_by | UUID | | FK→users | 审批人 |
| approved_at | TIMESTAMPTZ | | | 审批时间 |
| deposit_collected | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 已收按金 |
| deposit_refunded | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 已退按金 |
| damage_deducted | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 扣损金额 |
| settled_at | TIMESTAMPTZ | | | 结算时间 |
| receipt_no | VARCHAR | 30 | | 收据号（衔接财务）|
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 同一场地时间段重叠即 409；DB 排他约束兜底。租金、按金、退金/扣损在 DB 事务计算，可追溯衔接财务收据。

### 24.6 保养计划 (maintenance_plans)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| plan_no | VARCHAR | 30 | UNIQUE, NOT NULL | 计划编号（MP-YYYY-NNNN）|
| asset_id | UUID | | FK→assets | 关联资产（通用资产）|
| fixed_asset_id | UUID | | FK→fixed_assets | 关联固定资产（二选一）|
| name | VARCHAR | 100 | NOT NULL | 计划名称 |
| maintenance_type | ENUM | | NOT NULL | regular/preventive/repair/safety_check |
| frequency | ENUM | | NOT NULL | monthly/quarterly/yearly/on_demand |
| next_due_date | DATE | | NOT NULL | 下次到期日 |
| vendor_id | UUID | | FK→vendors | 责任供应商（可选）|
| description | TEXT | | | 说明 |
| status | ENUM | | NOT NULL DEFAULT 'active' | active/suspended/retired |
| safety_cert_required | BOOLEAN | | NOT NULL DEFAULT false | 安全检测类是否需资质证书 |
| created_by | UUID | | FK→users, NOT NULL | 建档人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 计划须关联设备/资产；`safety_check` 类要求资质证书号。到期（如提前 7 天）经通知模块提醒负责人。

### 24.7 保养工单 (maintenance_work_orders)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| work_order_no | VARCHAR | 30 | UNIQUE, NOT NULL | 工单号（MWO-YYYYMMDD-NNNN）|
| plan_id | UUID | | FK→maintenance_plans | 来源计划（故障维修可空）|
| asset_id | UUID | | FK→assets | 关联资产 |
| fixed_asset_id | UUID | | FK→fixed_assets | 关联固定资产（二选一）|
| maintenance_type | ENUM | | NOT NULL | regular/preventive/repair/safety_check |
| status | ENUM | | NOT NULL DEFAULT 'scheduled' | scheduled/assigned/in_progress/submitted/verified/closed/cancelled |
| assignee_type | ENUM | | | internal/outsourced |
| assignee_id | UUID | | FK→users | 校内执行人 |
| vendor_id | UUID | | FK→vendors | 外判供应商（outsourced）|
| scheduled_date | DATE | | | 计划执行日期 |
| executed_at | TIMESTAMPTZ | | | 执行时间 |
| result | TEXT | | | 执行结果/说明 |
| cost | NUMERIC | 12,2 | NOT NULL DEFAULT 0 | 费用（HKD）|
| safety_cert_no | VARCHAR | 100 | | 安全检测资质证书号 |
| attachment_url | VARCHAR | 500 | | 附件（图片/报告）|
| verified_by | UUID | | FK→users | 验收人（校务处）|
| verified_at | TIMESTAMPTZ | | | 验收时间 |
| closed_by | UUID | | FK→users | 关闭人 |
| closed_at | TIMESTAMPTZ | | | 关闭时间 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 工单由 `MaintenanceScheduleCron` 按频率自动生成（scheduled）或手动即时建单（故障维修）；外判费用可联动财务（回写 `cost`）。

### 24.8 供应商档案 (vendors)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| vendor_code | VARCHAR | 30 | UNIQUE, NOT NULL | 统一编号（VEND-YYYY-NNNN）|
| name | VARCHAR | 100 | NOT NULL | 供应商名称 |
| category | ENUM | | NOT NULL | book/stationery/food_service/school_bus/equipment_maintenance/printing/cleaning/insurance/network/activity_supplies |
| contact_person | VARCHAR | 100 | | 联系人 |
| contact_phone | VARCHAR | 50 | | 联系电话 |
| contact_email | VARCHAR | 100 | | 联系邮箱（P1）|
| bank_account | VARCHAR | 200 | | 银行账户（P1，加密存储）|
| address | VARCHAR | 200 | | 注册地址 |
| license_no | VARCHAR | 100 | | 营业执照/注册证号 |
| certificate_expiry | DATE | | | 证照有效期（到期提醒）|
| certificate_url | VARCHAR | 500 | | 证照文件对象存储 URL |
| status | ENUM | | NOT NULL DEFAULT 'draft' | draft/pending_review/approved/rejected/suspended |
| reviewed_by | UUID | | FK→users | 审核人（校务处）|
| reviewed_at | TIMESTAMPTZ | | | 审核时间 |
| rejection_reason | TEXT | | | 拒绝原因 |
| is_qualified | BOOLEAN | | NOT NULL DEFAULT false | 是否合格供应商（名录）|
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 登记人（外部提交=系统注册人）|
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** PDPO：`contact_email`/`bank_account`/证照属 P1，传输加密、最小权限授权、评估记录可审计。`category` 为 SPEC 规定的 10 类。证照到期前 cron 提醒更新。

### 24.9 供应商评估 (vendor_evaluations)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| evaluation_no | VARCHAR | 30 | UNIQUE, NOT NULL | 评估编号（VE-YYYY-NNNN）|
| vendor_id | UUID | | FK→vendors, NOT NULL | 被评估供应商 |
| evaluator_id | UUID | | FK→users, NOT NULL | 评审人（多名评审各一条）|
| evaluation_year | VARCHAR | 9 | NOT NULL | 评估年度 |
| scores | JSONB | | NOT NULL DEFAULT '{}' | 各维度得分（quality/price/delivery/service/compliance 0-100）|
| weighted_score | NUMERIC | 5,2 | NOT NULL DEFAULT 0 | 加权总分 |
| grade | ENUM | | | A/B/C |
| conclusion | ENUM | | | renew/watching/eliminate |
| status | ENUM | | NOT NULL DEFAULT 'draft' | draft/in_progress/scored/concluded/cancelled |
| concluded_by | UUID | | FK→users | 定级人（校务处/校务主任）|
| concluded_at | TIMESTAMPTZ | | | 定级时间 |
| remarks | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 多名评审人各自打分一条记录；汇总加权分后定级（A/B/C）与结论（续用/观察/淘汰）；合格供应商维护 `vendors.is_qualified` 名录状态。

### 24.10 枚举值汇总（本模块新增）

| 枚举 | 取值 |
|------|------|
| fixed_asset_category_enum | fixed, electronics, furniture, musical_instrument, sports, laboratory, library, audio_visual, computer, network |
| fixed_asset_condition_enum | excellent, good, fair, poor |
| inv_session_status_enum | draft, planning, in_progress, verifying, closed, cancelled |
| inv_scanned_enum | scanned_matched, scanned_mismatch, missing, unknown |
| inv_investigation_enum | pending, resolved, closed |
| venue_status_enum | active, inactive, maintenance |
| venue_rental_status_enum | draft, pending_approval, approved, confirmed, in_progress, completed, closed, rejected, cancelled |
| renter_type_enum | internal, external |
| mnt_type_enum | regular, preventive, repair, safety_check |
| mnt_frequency_enum | monthly, quarterly, yearly, on_demand |
| mnt_plan_status_enum | active, suspended, retired |
| mnt_work_order_status_enum | scheduled, assigned, in_progress, submitted, verified, closed, cancelled |
| assignee_type_enum | internal, outsourced |
| vendor_category_enum | book, stationery, food_service, school_bus, equipment_maintenance, printing, cleaning, insurance, network, activity_supplies |
| vendor_reg_status_enum | draft, pending_review, approved, rejected, suspended |
| vendor_grade_enum | A, B, C |
| vendor_conclusion_enum | renew, watching, eliminate |
| vendor_eval_status_enum | draft, in_progress, scored, concluded, cancelled |

## 25. 校车点名与查询模板管理模块 (buses, bus_routes, bus_shifts, bus_students, bus_checkins, quick_reply_templates, Issue #361)

> 🔧 **补全说明（Issue #361）**：为 F-BUS-002（校车点大名记录）、F-INQ-002（快速回复模板）提供字段字典。
> 边界见 SPEC-SYSTEM-DESIGN §22；表结构见 DB-SCHEMA §22；接口见 API-DESIGN §13。

### 25.1 校车车辆主档 (buses)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| bus_code | VARCHAR | 30 | UNIQUE, NOT NULL | 校车编号（BUS-A1）|
| plate_no | VARCHAR | 20 | | 车牌号 |
| capacity | INTEGER | | NOT NULL DEFAULT 0 | 座位数 |
| vendor_id | UUID | | FK→vendors | 校车服务供应商（衔接 F-VEND-001）|
| status | ENUM | | NOT NULL DEFAULT 'active' | active/inactive/maintenance |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** `bus_code` 全系统唯一；`vendor_id` 可选衔接校车服务供应商。校车车辆并非学校固定资产（可租用供应商车辆），不并入 `fixed_assets`/`assets`。

### 25.2 校车线路 (bus_routes)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| route_code | VARCHAR | 30 | UNIQUE, NOT NULL | 线路号（ROUTE-TKO）|
| name | VARCHAR | 100 | NOT NULL | 线路名称（將軍澳線）|
| origin | VARCHAR | 100 | NOT NULL | 起点站 |
| destination | VARCHAR | 100 | NOT NULL | 终点站 |
| stops | JSONB | | NOT NULL DEFAULT '[]' | 停靠站点序列 [{name, order, eta_minutes}] |
| delay_notify_threshold_minutes | INTEGER | | NOT NULL DEFAULT 10 | 延误通知阈值（>10 微信，>20 短信，衔接 F-BUS-001）|
| status | ENUM | | NOT NULL DEFAULT 'active' | active/inactive |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** `delay_notify_threshold_minutes` 可按线路配置延误通知阈值（F-BUS-001 阈值配置）;`stops` 为有序停靠站。

### 25.3 校车班次/行程 (bus_shifts)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| shift_no | VARCHAR | 30 | UNIQUE, NOT NULL | 行程号（BS-YYYYMMDD-001）|
| route_id | UUID | | FK→bus_routes, NOT NULL | 线路 |
| bus_id | UUID | | FK→buses, NOT NULL | 校车 |
| shift_date | DATE | | NOT NULL | 行程日期 |
| direction | ENUM | | NOT NULL | morning/afternoon |
| plan_depart_at | TIMESTAMPTZ | | | 计划发车时间 |
| plan_arrive_at | TIMESTAMPTZ | | | 计划到站时间 |
| actual_depart_at | TIMESTAMPTZ | | | 实际发车时间 |
| actual_arrive_at | TIMESTAMPTZ | | | 实际到站时间 |
| delay_minutes | INTEGER | | NOT NULL DEFAULT 0 | 延误分钟（实际-计划）|
| status | ENUM | | NOT NULL DEFAULT 'draft' | draft/active/closed/cancelled |
| closed_by | UUID | | FK→users | 关闭人 |
| closed_at | TIMESTAMPTZ | | | 关闭时间 |
| remarks | TEXT | | | 备注 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 行程为点名粒度容器；`draft→active→closed/cancelled`；`closed` 后点名明细只读。

### 25.4 校车乘搭分配 (bus_students)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| student_id | UUID | | FK→students, NOT NULL | 乘搭学生 |
| route_id | UUID | | FK→bus_routes, NOT NULL | 所属线路 |
| shift_date | DATE | | NOT NULL | 生效日期 |
| direction | ENUM | | NOT NULL | morning/afternoon |
| board_stop | VARCHAR | 100 | | 上车点 |
| alight_stop | VARCHAR | 100 | | 下车点 |
| pickup_order | INTEGER | | | 上车顺序 |
| status | ENUM | | NOT NULL DEFAULT 'active' | active/suspended |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** `UNIQUE(student_id, route_id, shift_date, direction)` 唯一；跨日乘搭按 `shift_date` 区隔，DEV 可设计默认分配+按日覆盖。衔接 F-BUS-001 乘搭学生列表。

### 25.5 校车点名记录 (bus_checkins)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| checkin_no | VARCHAR | 40 | UNIQUE, NOT NULL | 点名单号（CHK-YYYYMMDD-NNNN）|
| shift_id | UUID | | FK→bus_shifts, NOT NULL | 所属行程 |
| student_id | UUID | | FK→students, NOT NULL | 点名学生 |
| bus_student_id | UUID | | FK→bus_students | 乘搭分配（可选）|
| check_type | ENUM | | NOT NULL | onboard/alight |
| checked_at | TIMESTAMPTZ | | NOT NULL DEFAULT NOW() | 点名时间 |
| location | VARCHAR | 200 | | 点名地点（GPS 或手动）|
| location_source | ENUM | | NOT NULL DEFAULT 'manual' | gps/manual |
| device_id | VARCHAR | 128 | | 点名设备标识 |
| scanned_by | UUID | | FK→users | 执行点名人 |
| status | ENUM | | NOT NULL | onboard/alight/arrived_safely/missed/absent |
| parent_notification_sent | BOOLEAN | | NOT NULL DEFAULT false | 是否已发送家长通知 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** `UNIQUE(shift_id, student_id, check_type)` 幂等防重；`status` 派生（alight 到校=arrived_safely，仅 onboard=onboard，应乘未点名=missed，请假=absent）。家长通知经 §7.3 多渠道通知异步推送并置位 `parent_notification_sent`。

### 25.6 快速回复模板 (quick_reply_templates)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| template_code | VARCHAR | 30 | UNIQUE, NOT NULL | 模板编号（QRT-BUS-001）|
| category | ENUM | | NOT NULL | bus/lunch/fee/leave/general |
| name | VARCHAR | 100 | NOT NULL | 模板名称（校車延誤通知）|
| title | VARCHAR | 200 | | 回复标题（可选）|
| content | TEXT | | NOT NULL | 回复正文（含 {{var}} 占位符）|
| variables | JSONB | | NOT NULL DEFAULT '[]' | 变量名列表（delay_minutes/estimated_arrival/student_name…）|
| intent_tags | JSONB | | NOT NULL DEFAULT '[]' | 关联意图标签（衔接 F-INQ-001 intent）|
| channels | JSONB | | NOT NULL DEFAULT '["wechat","sms","email"]' | 适用推送渠道 |
| is_default | BOOLEAN | | NOT NULL DEFAULT false | 是否内置模板（只读）|
| status | ENUM | | NOT NULL DEFAULT 'active' | active/inactive |
| applicable_roles | JSONB | | NOT NULL DEFAULT '[]' | 适用范围角色限制（空=不限）|
| sort_order | INTEGER | | NOT NULL DEFAULT 0 | 排序 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间（自定义模板）|

**业务规则：** 内置模板（`is_default=true`，41 个，5 类 8/6/10/5/12）仅可停用不可物理删除；自定义模板软删除 `deleted_at`。渲染时按查询/学生/校车/延误上下文代入 `variables` 生成回复（F-INQ-001 AC-05）。

### 25.7 新增枚举值汇总

| 枚举名 | 值 |
|--------|-----|
| bus_status_enum | active, inactive, maintenance |
| bus_route_status_enum | active, inactive |
| bus_direction_enum | morning, afternoon |
| bus_shift_status_enum | draft, active, closed, cancelled |
| bus_student_status_enum | active, suspended |
| bus_check_type_enum | onboard, alight |
| bus_loc_source_enum | gps, manual |
| bus_checkin_status_enum | onboard, alight, arrived_safely, missed, absent |
| quick_reply_category_enum | bus, lunch, fee, leave, general |
| quick_reply_status_enum | active, inactive |


---

## 26. AI 自动化模块字段字典（Issue #362，F-AI-002 / F-AUTO-001 / F-AUTO-002）

> 🔧 **补全说明（Issue #362）**：AI 自动化模块六张表的字段字典。表结构见 DB-SCHEMA §23，系统设计见 SPEC-SYSTEM-DESIGN §23，接口见 API-DESIGN §14。

### 26.1 FAQ 知识条目 (faq_knowledge_base)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| faq_code | VARCHAR | 40 | UNIQUE, NOT NULL | FAQ 编号（FAQ-YYYYMMDD-NNNN）|
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| category | ENUM | | NOT NULL | general/admission/fee/attendance/bus/lunch/academic/leave |
| question_zh | TEXT | | NOT NULL | 繁体中文问题 |
| question_en | TEXT | | | 英文问题（可选）|
| answer | JSONB | | NOT NULL | 多格式答案（{plain, html?, quick_reply_template_code?}）|
| keywords | JSONB | | NOT NULL DEFAULT '[]' | 搜索关键词数组 |
| trigger_intents | JSONB | | NOT NULL DEFAULT '[]' | 关联意图代码 |
| embedding | VECTOR(1536) | | | pgvector 语义嵌入向量 |
| tfidf_terms | JSONB | | NOT NULL DEFAULT '[]' | TF-IDF 项（词=权重）缓存 |
| view_count | INTEGER | | NOT NULL DEFAULT 0 | 浏览次数 |
| helpful_count | INTEGER | | NOT NULL DEFAULT 0 | 反馈「有用」次数 |
| not_helpful_count | INTEGER | | NOT NULL DEFAULT 0 | 反馈「无用」次数 |
| status | ENUM | | NOT NULL DEFAULT 'active' | active/inactive |
| created_by | UUID | | FK→users, NOT NULL | 维护人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**业务规则：** 语义检索经 pgvector HNSW 索引（`cosine_ops`）；无嵌入条目降级为关键词+TF-IDF 匹配。`answer.quick_reply_template_code` 可联动 §25.6 快速回复模板渲染最终回复。

### 26.2 FAQ 匹配记录 (faq_match_logs)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| session_id | VARCHAR | 64 | NOT NULL | 查询会话标识 |
| query_text | TEXT | | NOT NULL | 原始查询 |
| normalized_text | TEXT | | | 规范化后查询 |
| query_intent | VARCHAR | 100 | | 意图识别结果 |
| top_faq_id | UUID | | FK→faq_knowledge_base | 最终回答 FAQ（可空）|
| top_score | NUMERIC | (5,4) | | 最终分数（0~1）|
| candidates | JSONB | | NOT NULL DEFAULT '[]' | 候选列表 [{faq_id, score, matched_by}] |
| used_vector | BOOLEAN | | NOT NULL DEFAULT false | 是否使用向量语义匹配 |
| latency_ms | INTEGER | | NOT NULL | 匹配耗时（毫秒）|
| source_channel | ENUM | | NOT NULL | web/app/inquiry/coze/api |
| feedback | ENUM | | | helpful/not_helpful/none |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 多路打分融合（关键词 0.3 + TF-IDF 0.2 + 语义 0.3 + 意图 0.2），取 top-N 写 `candidates`。反馈回写 `faq_knowledge_base.helpful_count/not_helpful_count`。

### 26.3 周期任务定义 (scheduled_tasks)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| task_code | VARCHAR | 40 | UNIQUE, NOT NULL | 任务编号（CRON-YYYYMMDD-XXXX）|
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| name | VARCHAR | 128 | NOT NULL | 任务名称（晨检仪表板刷新）|
| description | TEXT | | | 任务说明 |
| trigger_type | ENUM | | NOT NULL | daily/weekly/monthly/cron |
| cron_expression | VARCHAR | 64 | NOT NULL | 标准 cron 表达式（5 段）|
| action_type | ENUM | | NOT NULL | refresh_dashboard_data/generate_inquiry_summary/generate_absence_report/send_fee_reminder/send_custom_notification/send_token_health_check/webhook |
| action_params | JSONB | | NOT NULL DEFAULT '{}' | 动作参数 |
| priority | ENUM | | NOT NULL DEFAULT 'normal' | info/normal/high/critical |
| status | ENUM | | NOT NULL DEFAULT 'active' | active/paused/disabled |
| max_retries | INTEGER | | NOT NULL DEFAULT 3 | 失败最大重试次数 |
| timeout_seconds | INTEGER | | NOT NULL DEFAULT 300 | 单次执行超时（秒）|
| last_run_at | TIMESTAMPTZ | | | 上次执行时间 |
| next_run_at | TIMESTAMPTZ | | NOT NULL | 下次执行时间 |
| consecutive_failures | INTEGER | | NOT NULL DEFAULT 0 | 连续失败次数 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**业务规则：** `cron_expression` 依 `trigger_type` 生成；`next_run_at` 供调度器取到点任务；动作执行经 `@nestjs/schedule` SchedulerRegistry。

### 26.4 周期任务执行日志 (scheduled_task_executions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| task_id | UUID | | FK→scheduled_tasks, NOT NULL | 所属任务 |
| execution_no | VARCHAR | 40 | UNIQUE, NOT NULL | 执行编号（EXE-YYYYMMDDHHMMSS-XXXX）|
| triggered_at | TIMESTAMPTZ | | NOT NULL | 触发时间 |
| status | ENUM | | NOT NULL | pending/running/success/failed/retrying/skipped |
| attempt | INTEGER | | NOT NULL DEFAULT 1 | 重试次数（1=首次）|
| started_at | TIMESTAMPTZ | | | 开始执行时间 |
| finished_at | TIMESTAMPTZ | | | 结束执行时间 |
| duration_ms | INTEGER | | | 执行耗时（毫秒）|
| result_summary | TEXT | | | 执行结果摘要 |
| output | JSONB | | NOT NULL DEFAULT '{}' | 结构化输出 |
| error_message | TEXT | | | 错误信息 |
| error_stack | TEXT | | | 错误堆栈（可选）|
| next_retry_at | TIMESTAMPTZ | | | 下次重试时间（retrying 时）|
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** 执行完更新 `scheduled_tasks.last_run_at/next_run_at/consecutive_failures`；连续失败达阈值触发 §7.3 告警通知。

### 26.5 提醒规则定义 (reminder_rules)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| rule_code | VARCHAR | 40 | UNIQUE, NOT NULL | 规则编号（RMD-YYYYMMDD-XXXX）|
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| name | VARCHAR | 128 | NOT NULL | 规则名称（校車延誤提醒）|
| business_type | ENUM | | NOT NULL | bus/attendance/fee/academic/emergency/daily/other |
| level | ENUM | | NOT NULL | info/normal/urgent/critical |
| channels | JSONB | | NOT NULL DEFAULT '["app_push"]' | app_push/sms/email/whatsapp/phone |
| sms_backup | BOOLEAN | | NOT NULL DEFAULT false | 高优先级是否短信备用 |
| delay_minutes | INTEGER | | NOT NULL DEFAULT 0 | 触发后延迟发送（分钟）|
| escalation_enabled | BOOLEAN | | NOT NULL DEFAULT false | 是否启用升级 |
| escalation_delay_minutes | INTEGER | | | 升级延迟（NORMAL +24h / URGENT +2h）|
| escalate_to_roles | JSONB | | NOT NULL DEFAULT '[]' | 升级接收角色（school_head/office）|
| notify_roles | JSONB | | NOT NULL DEFAULT '[]' | 直接接收角色 |
| template_id | UUID | | FK→notification_templates | 关联通知模板（可空）|
| filter_condition | JSONB | | NOT NULL DEFAULT '{}' | 触发条件过滤 |
| status | ENUM | | NOT NULL DEFAULT 'active' | active/paused/disabled |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**业务规则：** 默认级别渠道策略：INFO=App+短信(可选)、NORMAL=App+Email+SMS+24h 升级、URGENT=App+SMS+电话+2h 升级、CRITICAL=全渠道+校领导+立即。短信备用场景（bus/attendance/emergency）`sms_backup=true`。

### 26.6 提醒记录 (reminder_records)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| reminder_no | VARCHAR | 40 | UNIQUE, NOT NULL | 提醒编号（REM-YYYYMMDD-XXXX）|
| rule_id | UUID | | FK→reminder_rules, NOT NULL | 触发规则 |
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| recipient_id | UUID | | FK→users, NOT NULL | 接收者用户 |
| related_entity_type | VARCHAR | 50 | | 关联业务类型 |
| related_entity_id | UUID | | | 关联业务ID |
| notification_id | UUID | | FK→notifications | 关联主通知 |
| deliver_status | ENUM | | NOT NULL DEFAULT 'pending' | pending/sent/delivered/failed |
| read_status | ENUM | | NOT NULL DEFAULT 'unread' | unread/read |
| read_at | TIMESTAMPTZ | | | 已读时间 |
| level | ENUM | | NOT NULL | info/normal/urgent/critical（触发快照）|
| channel | ENUM | | NOT NULL | NotificationChannel（发送渠道快照）|
| sms_fallback_sent | BOOLEAN | | NOT NULL DEFAULT false | 是否已发短信备用 |
| escalation_level | ENUM | | NOT NULL DEFAULT 'info' | 当前升级层次 |
| escalation_history | JSONB | | NOT NULL DEFAULT '[]' | 升级历史 |
| retry_count | INTEGER | | NOT NULL DEFAULT 0 | 未读/失败重发次数 |
| next_followup_at | TIMESTAMPTZ | | | 下次未读跟进时间（24h 或升级窗口）|
| is_read | BOOLEAN | | NOT NULL DEFAULT false | 快速判断已读（冗余）|
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 送达回执（read_status=read + read_at）、未读跟进（24h 重发一次+短信备用、retry_count 递增）、失败告警（deliver_status=failed 持续 → 校务处告警显示「通知发送失败」）。

### 26.7 新增枚举值汇总（AI 自动化模块）

| 枚举名 | 值 |
|--------|-----|
| faq_category_enum | general, admission, fee, attendance, bus, lunch, academic, leave |
| faq_status_enum | active, inactive |
| faq_source_enum | web, app, inquiry, coze, api |
| faq_feedback_enum | helpful, not_helpful, none |
| task_trigger_type_enum | daily, weekly, monthly, cron |
| task_action_enum | refresh_dashboard_data, generate_inquiry_summary, generate_absence_report, send_fee_reminder, send_custom_notification, send_token_health_check, webhook |
| task_priority_enum | info, normal, high, critical |
| task_status_enum | active, paused, disabled |
| exec_status_enum | pending, running, success, failed, retrying, skipped |
| reminder_biz_enum | bus, attendance, fee, academic, emergency, daily, other |
| reminder_level_enum | info, normal, urgent, critical |
| reminder_rule_status_enum | active, paused, disabled |
| reminder_deliver_status_enum | pending, sent, delivered, failed |
| reminder_read_status_enum | unread, read |

## 27. 运维自动化模块字段字典 (Issue #363, F-OPS-002/003/006/007/008/009)

> 对应 DB-SCHEMA §24（运维自动化与监控模块）新增 7 张表；`ddl_audit_log` 字段固化 §9.9.2 结构。系统设计见 SPEC-SYSTEM-DESIGN §24，接口见 API-DESIGN §15。约定：`school_id`→`schools(id)`（平台级运维表可空）、`user_id/acknowledged_by/sanctioned_by`→`users(id)`。

### 27.1 SSL 证书状态快照 (ssl_cert_status)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| domain | VARCHAR | 190 | UNIQUE, NOT NULL | 证书域名 |
| school_id | UUID | | FK→schools | 所属学校（平台级证书可空）|
| issuer | VARCHAR | 100 | | 签发机构 |
| not_before | TIMESTAMPTZ | | | 证书生效时间 |
| not_after | TIMESTAMPTZ | | NOT NULL | 证书到期时间 |
| days_until_expiry | INTEGER | | NOT NULL | 剩余天数 |
| alert_level | ENUM | | NOT NULL DEFAULT 'info' | info/warning/critical/error（30/7/1/过期）|
| auto_renew_enabled | BOOLEAN | | NOT NULL DEFAULT true | 是否启用自动续期 |
| renewal_result | ENUM | | | success/failure/not_run |
| last_renewed_at | TIMESTAMPTZ | | | 上次续期成功时间 |
| renewal_attempts | INTEGER | | NOT NULL DEFAULT 0 | 续期尝试次数 |
| last_renewal_detail | JSONB | | | 续期细节 |
| vault_path | VARCHAR | 255 | | Vault 密钥路径 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 最近采集更新时间 |

**业务规则：** 每域名一行最新状态；续期/到期告警写 `ops_events`。衔接系统设计 §9.3/§24.3.1。

### 27.2 WebSAMS Token 刷新状态 (token_refresh_status)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| refresh_no | VARCHAR | 40 | UNIQUE, NOT NULL | 刷新编号（TOK-...）|
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| grant_type | VARCHAR | 20 | NOT NULL DEFAULT 'client_credentials' | OAuth2 grant |
| token_status | ENUM | | NOT NULL | valid/expiring/refresh_triggered/refresh_failed/degraded |
| remaining_hours | NUMERIC | 6,2 | | 剩余有效小时数 |
| refreshed_at | TIMESTAMPTZ | | | 本次刷新时间 |
| expires_at | TIMESTAMPTZ | | | 刷新后到期时间 |
| refresh_reason | VARCHAR | 40 | | scheduled_check/<24h/manual/max_age |
| refresh_result | ENUM | | | success/failure/skipped |
| failure_detail | TEXT | | | 失败原因 |
| degraded_mode | ENUM | | | none/readonly/cached |
| redeploy_app | BOOLEAN | | NOT NULL DEFAULT false | 是否触发依赖服务刷新 |
| ref_event_no | VARCHAR | 40 | | 关联 ops_events.event_no |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** 每一次检查/刷新一条记录（分布式锁下唯一刷新）；失败按 §9.4.2 降级；审计 `websams_token_refreshed`。

### 27.3 Coze API 配额监控记录 (coze_quota_records)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| sample_at | TIMESTAMPTZ | | NOT NULL | 采样时间（每 5 分钟）|
| metric_name | VARCHAR | 40 | NOT NULL | rpm/tpm/daily_limit |
| quota_used | NUMERIC | 16,2 | NOT NULL | 已使用配额 |
| quota_limit | NUMERIC | 16,2 | NOT NULL | 配额上限 |
| usage_percent | NUMERIC | 6,2 | NOT NULL | 使用率（%）|
| alert_level | ENUM | | NOT NULL DEFAULT 'info' | info/warning/error/critical（80/95/100）|
| rate_limited | BOOLEAN | | NOT NULL DEFAULT false | 是否触发限流 |
| rate_limit_action | ENUM | | | none/low_pause/medium_throttle/off |
| provider_active | ENUM | | NOT NULL DEFAULT 'coze' | coze/openai/local |
| note | TEXT | | | 备注 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** `UNIQUE (sample_at, metric_name)`；>95% 自动限流（§9.7.3）；切换写审计 `coze_quota_rate_limited`。

### 27.4 敏感字段访问日志 (sensitive_field_access_log)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| user_id | UUID | | FK→users, NOT NULL | 访问用户 |
| field_type | ENUM | | NOT NULL | hkid/phone/address/medical |
| target_type | VARCHAR | 40 | NOT NULL | student/parent |
| target_id | UUID | | NOT NULL | 目标实体 ID |
| action | ENUM | | NOT NULL DEFAULT 'view' | view/export |
| accessed_at | TIMESTAMPTZ | | NOT NULL | 访问时间 |
| window_alerts | JSONB | | | 5 分钟窗口聚合 |
| alert_level | ENUM | | | none/warning/error/critical |
| paused | BOOLEAN | | NOT NULL DEFAULT false | 临时权限暂停标记 |
| sanctioned_by | UUID | | FK→users | 触发暂停执行人 |
| event_no | VARCHAR | 40 | | 关联 ops_events.event_no |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** **只追加不可 UPDATE/DELETE**；阈值命中（§9.8）补 `alert_level` + 写 `ops_events`；持续异常联动权限暂停。

### 27.5 数据库 DDL 操作审计 (ddl_audit_log)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK DEFAULT gen_random_uuid() | 主键 |
| event_type | VARCHAR | 50 | NOT NULL | DDL 事件类型 |
| object_type | VARCHAR | 50 | NOT NULL | 对象类型 |
| object_name | TEXT | | NOT NULL | 对象名称 |
| command_tag | VARCHAR | 50 | NOT NULL | DROP TABLE/ALTER TABLE 等 |
| ddl_statement | TEXT | | NOT NULL | 完整 DDL 语句 |
| executed_by | VARCHAR | 100 | NOT NULL | 执行人 / 角色 |
| executed_at | TIMESTAMPTZ | | NOT NULL DEFAULT NOW() | 执行时间 |
| client_addr | VARCHAR | 45 | | 客户端 IP |
| schema_name | TEXT | | | schema |
| school_id | UUID | | FK→schools | 所属学校 |

**业务规则：** 引用系统设计 §9.9.2 结构；只追加；DROP/TRUNCATE 告警写 `ops_events`；保留 7 年。

### 27.6 运维健康指标时间序列 (ops_health_metrics)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| school_id | UUID | | FK→schools | 所属学校（平台级留空）|
| sample_at | TIMESTAMPTZ | | NOT NULL | 采样时间（每 1 分钟）|
| dimension | ENUM | | NOT NULL | infra/db/ssl/websams/ai/audit/notification/dr/sensitive_ops/overall |
| score | NUMERIC | 5,2 | NOT NULL | 维度得分（0-100）|
| status | ENUM | | NOT NULL | healthy/warning/critical |
| weight | NUMERIC | 4,2 | NOT NULL | 维度权重（%）|
| detail | JSONB | | | 维度明细 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** `UNIQUE (sample_at, dimension, school_id)`；每 1 分钟一条快照；保留 13 个月后月度归档。

### 27.7 运维事件流 (ops_events)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| event_no | VARCHAR | 40 | UNIQUE, NOT NULL | 事件编号（OPS-...）|
| event_type | ENUM | | NOT NULL | ssl_cert_expiry_alert/ssl_cert_renewed/websams_token_refresh/coze_quota_alert/coze_quota_rate_limited/sensitive_field_excessive_access/ddl_critical/ddl_approval_pending/health_status_change/manual_action |
| school_id | UUID | | FK→schools | 所属学校 |
| severity | ENUM | | NOT NULL | info/warning/error/critical |
| source | VARCHAR | 40 | NOT NULL | cert/websams/coze/sensitive/ddl/health/manual |
| title | VARCHAR | 200 | NOT NULL | 事件标题 |
| detail | JSONB | | NOT NULL DEFAULT '{}' | 事件详情 |
| ref_id | VARCHAR | 40 | | 关联业务主键 |
| status | ENUM | | NOT NULL DEFAULT 'open' | open/acknowledged/resolved/expired |
| acknowledged_by | UUID | | FK→users | 确认人 |
| acknowledged_at | TIMESTAMPTZ | | | 确认时间 |
| resolved_at | TIMESTAMPTZ | | | 解决时间 |
| audit_synced | BOOLEAN | | NOT NULL DEFAULT false | 是否已同步 audit_logs |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**业务规则：** 全局统一事件流；与 `audit_logs` 以 `event_no` 幂等双写；仪表板「近期事件流」数据源；保留 7 年。

### 27.8 新增枚举值汇总（运维自动化模块）

| 枚举名 | 值 |
|--------|-----|
| cert_alert_enum | info, warning, critical, error |
| cert_renew_result_enum | success, failure, not_run |
| token_status_enum | valid, expiring, refresh_triggered, refresh_failed, degraded |
| refresh_result_enum | success, failure, skipped |
| degrade_enum | none, readonly, cached |
| quota_alert_enum | info, warning, error, critical |
| rate_action_enum | none, low_pause, medium_throttle, off |
| ai_provider_enum | coze, openai, local |
| sensitive_field_type_enum | hkid, phone, address, medical |
| sensitive_action_enum | view, export |
| alert_level_enum | none, warning, error, critical |
| health_dimension_enum | infra, db, ssl, websams, ai, audit, notification, dr, sensitive_ops, overall |
| health_status_enum | healthy, warning, critical |
| ops_event_type_enum | ssl_cert_expiry_alert, ssl_cert_renewed, websams_token_refresh, coze_quota_alert, coze_quota_rate_limited, sensitive_field_excessive_access, ddl_critical, ddl_approval_pending, health_status_change, manual_action |
| ops_severity_enum | info, warning, error, critical |
| ops_event_status_enum | open, acknowledged, resolved, expired |
---

## 28. 增强功能模块字段字典（Issue #364，F-AI-003 / F-I18N-003 / F-I18N-004 / F-NEW-002 / F-NEW-005）

> 与 DB-SCHEMA §25 表结构一一对应；`notification_templates` 沿用既有表（DB-SCHEMA §25 补全定义），业务规则见 API-DESIGN §16 / SPEC-SYSTEM-DESIGN §25。

### 28.1 OCR 识别任务 (ocr_tasks)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| task_no | VARCHAR | 40 | UNIQUE, NOT NULL | 任务编号（OCR-YYYYMMDDHHMMSS-XXXX）|
| school_id | UUID | | FK→schools | 所属学校（租户隔离/统计用）|
| doc_type | ENUM | | NOT NULL | birth_certificate/hk_id/school_report/medical_certificate/insurance_cert |
| source_entity_type | VARCHAR | 50 | NOT NULL | 业务源类型（leave_case/reimbursement/enrollment/application 等）|
| source_entity_id | UUID | | NOT NULL | 业务源主键 |
| file_url | VARCHAR | 500 | NOT NULL | 文件对象存储 URL |
| raw_text | TEXT | | | 全量识别原始文本 |
| parse_schema | JSONB | | NOT NULL DEFAULT '{}' | 应用字段解析模板（版本+字段映射）|
| engine | ENUM | | NOT NULL DEFAULT 'azure' | azure/tesseract/manual |
| status | ENUM | | NOT NULL DEFAULT 'queued' | queued/running/succeeded/failed/manual_review |
| error_code | VARCHAR | 60 | | 失败错误码 |
| error_message | TEXT | | | 失败错误信息 |
| retry_count | INTEGER | | NOT NULL DEFAULT 0 | 重试次数（≤3）|
| confidence | DECIMAL | (5,4) | | 整体置信度（0~1）|
| superseded_task_id | UUID | | FK→ocr_tasks | 被本任务覆盖/替代的旧任务（可空）|
| result_id | UUID | | FK→ocr_results | 关联结果主档（可空，成功后写）|
| started_at | TIMESTAMPTZ | | | 开始识别时间 |
| finished_at | TIMESTAMPTZ | | | 结束时间 |
| created_by | UUID | | FK→users | 提交人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** `UNIQUE(source_entity_type, source_entity_id, doc_type)` 幂等防重；重识别新建任务并以 `superseded_task_id` 标记旧任务。

**枚举值 — ocr_doc_type_enum：** birth_certificate, hk_id, school_report, medical_certificate, insurance_cert
**枚举值 — ocr_engine_enum：** azure, tesseract, manual
**枚举值 — ocr_task_status_enum：** queued, running, succeeded, failed, manual_review

### 28.2 OCR 识别结果字段 (ocr_results)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| task_id | UUID | | FK→ocr_tasks, NOT NULL | 所属识别任务 |
| field | VARCHAR | 60 | NOT NULL | 字段名（name/gender/birth_date/policy_no…）|
| value | TEXT | | | 识别字段值 |
| confidence | DECIMAL | (5,4) | | 该字段置信度（0~1）|
| matched | BOOLEAN | | NOT NULL DEFAULT false | 是否与既有业务数据比对匹配 |
| matched_entity_id | UUID | | | 比对命中业务实体 |
| review_status | ENUM | | NOT NULL DEFAULT 'auto' | auto/confirmed/corrected/rejected |
| reviewed_by | UUID | | FK→users | 人工校正人 |
| reviewed_at | TIMESTAMPTZ | | | 校正时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — ocr_review_status_enum：** auto, confirmed, corrected, rejected

### 28.3 翻译结果缓存 (translation_cache)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| hash | VARCHAR | 64 | UNIQUE, NOT NULL | SHA256(original_text+source_locale+target_locale) |
| original_text | TEXT | | NOT NULL | 原文 |
| translated_text | TEXT | | NOT NULL | 译文 |
| source_locale | VARCHAR | 16 | NOT NULL | zh-HK/zh-CN/en |
| target_locale | VARCHAR | 16 | NOT NULL | zh-HK/zh-CN/en |
| provider | ENUM | | NOT NULL DEFAULT 'coze' | coze/openai |
| confidence | DECIMAL | (5,4) | | 翻译置信度（0~1）|
| glossary_applied | INTEGER | | NOT NULL DEFAULT 0 | 应用的术语表条目数 |
| context | VARCHAR | 100 | NOT NULL DEFAULT 'school_admin_hk' | 翻译场景上下文 |
| meta | JSONB | | NOT NULL DEFAULT '{}' | 扩展（含 glossary_version）|
| cached | BOOLEAN | | NOT NULL DEFAULT true | 是否缓存命中返回 |
| hit_count | INTEGER | | NOT NULL DEFAULT 1 | 命中次数（统计用）|
| expires_at | TIMESTAMPTZ | | NOT NULL | 过期时间（created_at + 24h）|
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — translation_provider_enum：** coze, openai

### 28.4 Locale 格式配置 (locale_configs)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| scope | ENUM | | NOT NULL | global/school/user |
| school_id | UUID | | FK→schools | scope=school 时引用（可空）|
| user_id | UUID | | FK→users | scope=user 时引用（可空）|
| locale | VARCHAR | 16 | NOT NULL | zh-HK/zh-CN/en |
| is_default | BOOLEAN | | NOT NULL DEFAULT false | scope=global 且 true 为默认行 |
| date_format | VARCHAR | 40 | NOT NULL | 日期格式 |
| time_format | VARCHAR | 40 | NOT NULL | 时间格式 |
| currency_code | VARCHAR | 10 | NOT NULL DEFAULT 'HKD' | 货币码 |
| currency_symbol | VARCHAR | 10 | NOT NULL DEFAULT 'HK$' | 货币符号 |
| number_locale | VARCHAR | 30 | NOT NULL | 数字格式化 locale（如 zh-HK/en）|
| percent_format | VARCHAR | 30 | NOT NULL DEFAULT '{0}%' | 百分比格式 |
| file_size_unit | VARCHAR | 10 | NOT NULL DEFAULT 'mb' | 文件大小单位（mb/gb）|
| json_config | JSONB | | NOT NULL DEFAULT '{}' | 扩展格式配置 |
| enabled | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| created_by | UUID | | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**枚举值 — locale_scope_enum：** global, school, user

### 28.5 多渠道通知模板 (notification_templates，既有表补全)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| template_code | VARCHAR | 30 | UNIQUE, NOT NULL | 模板编号（TPL-…）|
| name | VARCHAR | 100 | NOT NULL | 模板名称 |
| category | ENUM | | NOT NULL DEFAULT 'daily' | bus/attendance/academic/fee/activity/emergency/daily |
| urgency | ENUM | | NOT NULL DEFAULT 'normal' | info/normal/high/critical |
| channels | JSONB | | NOT NULL DEFAULT '["app_push"]' | app_push/sms/email/feishu/whatsapp |
| fallback_channel | VARCHAR | 20 | | 备用渠道 |
| wechat_template_id | VARCHAR | 100 | | 微信模板 ID |
| app_push_title | VARCHAR | 200 | | APP 推送标题 |
| app_push_content | TEXT | | | APP 推送内容 |
| sms_content | TEXT | | | 短信内容 |
| email_subject | VARCHAR | 200 | | 邮件标题 |
| email_body | TEXT | | | 邮件正文 |
| whatsapp_content | TEXT | | | WhatsApp 内容 |
| variables | JSONB | | NOT NULL DEFAULT '[]' | 变量列表 |
| min_interval_minutes | INTEGER | | NOT NULL DEFAULT 30 | 最小发送间隔（分钟）|
| max_daily_per_parent | INTEGER | | NOT NULL DEFAULT 5 | 每家长每日最大发送次数 |
| quiet_hours_start | VARCHAR | 5 | | 免打扰开始（HH:mm）|
| quiet_hours_end | VARCHAR | 5 | | 免打扰结束（HH:mm）|
| version | INTEGER | | NOT NULL DEFAULT 1 | 模板版本 |
| is_active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| created_by | UUID | | FK→users | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** 沿用既有 `apps/backend/src/modules/notification/template.entity.ts` 实现，DEV 复用不重复建表。

### 28.6 通知交付规则 (notification_delivery_rules)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| template_id | UUID | | FK→notification_templates, NOT NULL, UNIQUE | 关联模板（一对一）|
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| min_interval_minutes | INTEGER | | NOT NULL DEFAULT 30 | 同接收人最小发送间隔（分钟）|
| max_daily_per_recipient | INTEGER | | NOT NULL DEFAULT 5 | 同接收人每日最大发送次数 |
| quiet_hours_start | VARCHAR | 5 | | 免打扰开始（HH:mm）|
| quiet_hours_end | VARCHAR | 5 | | 免打扰结束（HH:mm）|
| quiet_hours_sms_allowed | BOOLEAN | | NOT NULL DEFAULT false | 免打扰期间是否允许紧急短信 |
| fallback_channel | VARCHAR | 20 | | 备用渠道（紧急自动切换）|
| recipient_roles | JSONB | | NOT NULL DEFAULT '[]' | 接收角色白名单 |
| rollout_percent | INTEGER | | NOT NULL DEFAULT 100 | 灰度发送比例（0-100）|
| enabled | BOOLEAN | | NOT NULL DEFAULT true | 规则是否启用 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**业务规则：** `template_id UNIQUE` 一对一；DEV 发送前查规则做频控/免打扰/备用判定。

### 28.7 自定义报表定义 (report_definitions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| report_no | VARCHAR | 40 | UNIQUE, NOT NULL | 报表编号（RPT-YYYYMMDD-XXXX）|
| school_id | UUID | | FK→schools, NOT NULL | 所属学校 |
| name | VARCHAR | 128 | NOT NULL | 报表名称 |
| type | ENUM | | NOT NULL | daily_attendance/weekly_attendance/fee_report/semester_grade/annual_finance/dse_analysis/custom |
| data_source | JSONB | | NOT NULL | 数据源配置（表关联 + 字段映射）|
| filters | JSONB | | NOT NULL DEFAULT '[]' | 筛选条件 |
| sorts | JSONB | | NOT NULL DEFAULT '[]' | 排序规则 |
| group_by | JSONB | | NOT NULL DEFAULT '[]' | 分组聚合维度 |
| aggregations | JSONB | | NOT NULL DEFAULT '[]' | 聚合（count/sum/avg/min/max）|
| chart_type | ENUM | | NOT NULL DEFAULT 'numeric' | bar/pie/line/numeric |
| export_formats | JSONB | | NOT NULL DEFAULT '["pdf"]' | pdf/excel/csv |
| sql_template | TEXT | | | 生成的只读查询 SQL（DSL 白名单）|
| result_snapshot | JSONB | | | 最近生成结果快照 |
| owner_id | UUID | | FK→users, NOT NULL | 负责人 |
| status | ENUM | | NOT NULL DEFAULT 'active' | draft/active/paused/archived |
| last_generated_at | TIMESTAMPTZ | | | 最近生成时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**枚举值 — report_type_enum：** daily_attendance, weekly_attendance, fee_report, semester_grade, annual_finance, dse_analysis, custom
**枚举值 — report_chart_type_enum：** bar, pie, line, numeric
**枚举值 — report_status_enum：** draft, active, paused, archived

### 28.8 报表定时推送配置 (report_schedules)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| report_id | UUID | | FK→report_definitions, NOT NULL | 关联报表 |
| cron_expression | VARCHAR | 64 | NOT NULL | cron 表达式（5 段）|
| recurrence_type | ENUM | | NOT NULL | daily/weekly/monthly/semester |
| push_format | ENUM | | NOT NULL DEFAULT 'pdf' | pdf/excel/csv |
| push_channels | JSONB | | NOT NULL DEFAULT '["app_push","email"]' | 推送渠道 |
| include_summary | BOOLEAN | | NOT NULL DEFAULT true | 是否附正文摘要 |
| summary_locale | VARCHAR | 16 | NOT NULL DEFAULT 'zh-HK' | 摘要语言 |
| active | BOOLEAN | | NOT NULL DEFAULT true | 是否启用 |
| last_run_at | TIMESTAMPTZ | | | 最近执行时间 |
| next_run_at | TIMESTAMPTZ | | NOT NULL | 下次执行时间 |
| created_by | UUID | | FK→users, NOT NULL | 创建人 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMPTZ | | | 软删除时间 |

**枚举值 — report_recurrence_enum：** daily, weekly, monthly, semester
**枚举值 — report_push_format_enum：** pdf, excel, csv

### 28.9 报表订阅记录 (report_subscriptions)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| report_id | UUID | | FK→report_definitions, NOT NULL | 订阅的报表 |
| user_id | UUID | | FK→users, NOT NULL | 订阅用户 |
| push_channels | JSONB | | NOT NULL DEFAULT '["app_push","email"]' | 订阅用户的推送渠道 |
| delivery_format | ENUM | | NOT NULL DEFAULT 'pdf' | pdf/excel/csv |
| subscribed_at | TIMESTAMPTZ | | NOT NULL | 订阅时间 |
| unsubscribed_at | TIMESTAMPTZ | | | 退订时间 |
| active | BOOLEAN | | NOT NULL DEFAULT true | 是否处于订阅中 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | NOT NULL | 更新时间 |

**业务规则：** `UNIQUE(report_id, user_id)` 防重复订阅。

### 28.10 报表推送记录 (report_deliveries)

| 字段名 | 数据类型 | 长度 | 约束 | 说明 |
|--------|----------|------|------|------|
| id | UUID | | PK | 主键 |
| schedule_id | UUID | | FK→report_schedules, NOT NULL | 所属定时配置 |
| report_id | UUID | | FK→report_definitions, NOT NULL | 关联报表 |
| execution_no | VARCHAR | 40 | UNIQUE, NOT NULL | 执行编号（RPTD-YYYYMMDD-…）|
| scheduled_at | TIMESTAMPTZ | | NOT NULL | 计划执行时间 |
| status | ENUM | | NOT NULL | pending/running/success/failed |
| file_url | VARCHAR | 500 | | 导出附件 URL |
| notification_id | UUID | | FK→notifications | 关联 §7.3 已发送通知（可空）|
| summary_text | TEXT | | | 正文摘要 |
| recipient_count | INTEGER | | NOT NULL DEFAULT 0 | 接收人数 |
| error_message | TEXT | | | 错误信息 |
| started_at | TIMESTAMPTZ | | | 开始时间 |
| finished_at | TIMESTAMPTZ | | | 结束时间 |
| created_at | TIMESTAMPTZ | | NOT NULL | 创建时间 |

**枚举值 — report_delivery_status_enum：** pending, running, success, failed

### 28.11 新增枚举值汇总（增强功能模块）

| 枚举名 | 值 |
|--------|-----|
| ocr_doc_type_enum | birth_certificate, hk_id, school_report, medical_certificate, insurance_cert |
| ocr_engine_enum | azure, tesseract, manual |
| ocr_task_status_enum | queued, running, succeeded, failed, manual_review |
| ocr_review_status_enum | auto, confirmed, corrected, rejected |
| translation_provider_enum | coze, openai |
| locale_scope_enum | global, school, user |
| report_type_enum | daily_attendance, weekly_attendance, fee_report, semester_grade, annual_finance, dse_analysis, custom |
| report_chart_type_enum | bar, pie, line, numeric |
| report_status_enum | draft, active, paused, archived |
| report_recurrence_enum | daily, weekly, monthly, semester |
| report_push_format_enum | pdf, excel, csv |
| report_delivery_status_enum | pending, running, success, failed |
