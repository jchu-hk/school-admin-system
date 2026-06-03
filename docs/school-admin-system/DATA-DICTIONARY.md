# 数据字典 (Data Dictionary)
## Smart School Admin AI System — Data Dictionary
## v1.4.0 | 2026-06-03

---

## 1. 概述

本数据字典定义了智能校务助理系统中所有数据元素的详细说明，包括：
- 数据项名称及定义
- 数据类型和格式
- 取值范围/枚举值
- 业务规则
- 数据来源

---

## 2. 核心实体数据字典

### 2.1 学校 (School)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| school_code | VARCHAR | 20 | Y | SCH-XXX | 唯一标识学校 |
| name_zh | VARCHAR | 200 | Y | | 学校中文全名 |
| name_en | VARCHAR | 200 | | | 学校英文名称 |
| edb_school_code | VARCHAR | 20 | | | EDB分配的学校编号 |
| academic_year_start | DATE | | | YYYY-MM-DD | 学年起始日期 |
| settings | JSONB | | | | 扩展配置JSON |

---

### 2.2 用户 (User)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| user_type | VARCHAR | 20 | Y | 见枚举 | 用户类型分类 |
| user_code | VARCHAR | 50 | Y | | 工号/学号，全校唯一 |
| name_zh | VARCHAR | 100 | Y | | 中文姓名 |
| hkid | VARCHAR | 20 | | X123456(X) | 香港身份证，加密存储 |
| email | VARCHAR | 255 | | a@b.c | 联系邮箱 |
| phone | VARCHAR | 20 | | | 联系电话 |
| gender | VARCHAR | 1 | | M/F | 性别 |
| employment_type | VARCHAR | 20 | | 见枚举 | 雇佣类型 |
| account_expiry_date | DATE | | | YYYY-MM-DD | 账户到期日 |
| language_preference | VARCHAR | 10 | Y | zh-HK | 界面语言偏好 |
| deleted_at | TIMESTAMPTZ | | | | 软删除时间戳 |

**枚举值 - user_type:**
- `SCHOOL_ADMIN` — 校务主任（全权限）
- `OFFICER` — 校务处同工（日常操作）
- `TEACHER` — 教师（查询与填报）
- `PARENT` — 家长（门户查询）
- `STUDENT` — 学生（自主查询）
- `SYSTEM` — 系统管理员（技术运维）

**枚举值 - employment_type:**
- `permanent` — 常额
- `contract` — 合约
- `supply` — 代课
- `relief` — 替假

---

### 2.3 学生 (Student)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| student_id | VARCHAR | 20 | Y | YYYYSXXXXX | 学号格式：年份+S+班级+序号 |
| name_zh | VARCHAR | 100 | Y | | 学生中文姓名 |
| date_of_birth | DATE | | Y | YYYY-MM-DD | 出生日期 |
| gender | VARCHAR | 1 | Y | M/F | 性别 |
| birth_place | VARCHAR | 50 | | HK/MO/CN/Other | 出生地点 |
| is_sen | BOOLEAN | | Y | true/false | 是否有特殊教育需要 |
| sen_type | VARCHAR | 50 | | | SEN类型分类 |
| sen_details | JSONB | | | | SEN详细信息 |
| enrollment_date | DATE | | | YYYY-MM-DD | 正式入学日期 |
| graduation_date | DATE | | | YYYY-MM-DD | 毕业/离校日期 |

**SEN类型 (sen_type):**
- `ADHD` — 专注力不足/过度活跃症
- `ASD` — 自闭症谱系障碍
- `SLD` — 特殊学习困难
- `HI` — 听力障碍
- `VI` — 视觉障碍
- `PD` — 肢体伤残
- `ID` — 智力障碍
- `SpLD` — 言语及语言障碍
- `Others` — 其他

---

### 2.4 班级 (Class)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| class_code | VARCHAR | 10 | Y | 1A / S2C | 班级代码 |
| grade | VARCHAR | 3 | Y | S1-S6 | 年级 |
| class_type | VARCHAR | 20 | Y | 见枚举 | 班级类型 |
| max_capacity | INT | | Y | 40 | 最大容量 |
| current_enrollment | INT | | Y | | 当前人数 |

**枚举值 - class_type:**
- `regular` — 普通班
- `intensive` — 加强班
- `elective` — 选修班

---

## 3. 日常操作数据字典

### 3.1 出勤记录 (Attendance Record)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| date | DATE | | Y | YYYY-MM-DD | 考勤日期 |
| status | VARCHAR | 20 | Y | 见枚举 | 出勤状态 |
| source | VARCHAR | 20 | | 见枚举 | 数据来源 |
| consecutive_days | INT | | Y | 0-999 | 连续缺席天数 |
| alert_level | VARCHAR | 20 | | 见枚举 | 预警级别 |

**枚举值 - status:**
- `present` — 出席
- `absent` — 缺席
- `late` — 迟到
- `early` — 早退
- `excused` — 有理由缺席

**枚举值 - source:**
- `eclass` — eClass系统
- `manual` — 人工录入
- `biometric` — 生物识别
- `websams` — WebSAMS同步

**枚举值 - alert_level:**
- `none` — 无预警
- `low` — 低级别（连续2天缺席）
- `medium` — 中级别（连续3天缺席）
- `high` — 高级别（连续5天+或异常模式）

---

### 3.2 迟到/早退记录 (Late/Early Record)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| type | VARCHAR | 20 | Y | 见枚举 | 记录类型 |
| recorded_time | TIMESTAMPTZ | | Y | ISO8601 | 实际记录时间 |
| threshold_time | TIME | | Y | HH:MM | 规定时间 |
| duration_minutes | INT | | | 0-999 | 迟到/早退分钟数 |
| pattern_triggered | BOOLEAN | | Y | true/false | 是否触发模式预警 |

**枚举值 - type:**
- `late_arrival` — 迟到
- `early_departure` — 早退

---

### 3.3 请假申请 (Leave Application)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| application_no | VARCHAR | 20 | Y | LV-YYYYMMDD-XXX | 申请编号 |
| leave_type | VARCHAR | 20 | Y | 见枚举 | 请假类型 |
| start_date | DATE | | Y | YYYY-MM-DD | 开始日期 |
| end_date | DATE | | Y | YYYY-MM-DD | 结束日期 |
| total_days | DECIMAL | 4,1 | | 0.5-365 | 总天数（支持半天）|
| status | VARCHAR | 20 | Y | 见枚举 | 申请状态 |

**枚举值 - leave_type:**
- `sick` — 病假
- `personal` — 事假
- `compassionate` — 恩恤假
- `other` — 其他

**枚举值 - status:**
- `pending` — 待审批
- `approved` — 已批准
- `rejected` — 已拒绝
- `cancelled` — 已取消

---

## 4. 财务数据字典

### 4.1 学费项目 (Fee Item)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| fee_type | VARCHAR | 20 | Y | 见枚举 | 费用类型 |
| annual_amount | DECIMAL | 10,2 | Y | 0.00-999999.99 | 年度金额 |
| edb_subsidy | DECIMAL | 10,2 | Y | 0.00-999999.99 | 教育局津贴 |
| net_payable | DECIMAL | 10,2 | Y | 0.00-999999.99 | 实付金额 |
| status | VARCHAR | 20 | Y | 见枚举 | 状态 |

**枚举值 - fee_type:**
- `tuition` — 学费
- `subsidy` — 堂费
- `aircon` — 冷气费
- `activity` — 活动费
- `bus` — 校车费
- `insurance` — 学生保险
- `scholarship` — 奖学金（负数）

---

### 4.2 零用现金交易 (Petty Cash)

| 数据项 | 数据类型 | 长度 | 必填 | 取值/格式 | 业务规则 |
|--------|----------|------|------|-----------|----------|
| transaction_no | VARCHAR | 20 | Y | PC-YYYYMMDD-XXX | 交易编号 |
| transaction_type | VARCHAR | 10 | Y | payment/receipt | 交易类型 |
| amount | DECIMAL | 10,2 | Y | 0.00-3000.00 | 金额（上限3000）|
| category | VARCHAR | 50 | | 见枚举 | 支出类别 |
| dual_authorized | BOOLEAN | | Y | true/false | 是否双重授权 |

**枚举值 - category:**
- `printing` — 印刷
- `stationery` — 文具
- `transport` — 交通
- `refreshment` — 茶点
- `minor_repairs` — 小额维修
- `other` — 其他

**业务规则:**
- 单笔交易限额：HK$3,000
- 现金交易>HK$500需双重授权
- 备用金上限：HK$5,000

---

## 5. 枚举值汇总

### 5.1 通用状态枚举

| 枚举名称 | 取值 | 说明 |
|----------|------|------|
| status_active | active | 启用/进行中 |
| status_active | inactive | 停用 |
| status_active | deleted | 已删除（软删）|
| status_pending | pending | 待处理 |
| status_pending | processing | 处理中 |
| status_pending | completed | 已完成 |
| status_pending | cancelled | 已取消 |

### 5.2 优先级枚举

| 枚举值 | 说明 |
|--------|------|
| low | 低优先级 |
| normal | 普通优先级 |
| high | 高优先级 |
| urgent | 紧急 |

### 5.3 性别枚举

| 枚举值 | 说明 |
|--------|------|
| M | 男性 |
| F | 女性 |

---

## 6. 数据质量规则

| 规则类别 | 规则描述 | 适用字段 |
|----------|----------|----------|
| **格式校验** | 香港身份证格式：X123456(X) | users.hkid, students.hkid, parents.hkid |
| **格式校验** | 邮箱格式：xxx@xxx.xxx | users.email, parents.email |
| **格式校验** | 电话格式：8位数字 | users.phone, parents.phone |
| **范围校验** | 日期不得晚于当前日期 | date_of_birth, enrollment_date |
| **范围校验** | 结束日期 >= 开始日期 | start_date, end_date |
| **范围校验** | 金额 >= 0 | 所有金额字段 |
| **唯一性** | 学号全校唯一 | students.student_id |
| **唯一性** | 工号全校唯一 | users.user_code |
| **引用完整性** | 外键必须存在对应主键 | 所有外键字段 |
| **业务逻辑** | 离校日期 >= 入学日期 | enrollment_date, graduation_date |

---

## 7. 敏感数据处理

| 数据项 | 敏感度 | 处理方式 |
|--------|--------|----------|
| hkid (香港身份证) | 高 | AES-256加密存储 |
| email | 中 | 常规存储，传输加密 |
| phone | 中 | 常规存储，传输加密 |
| home_address | 中 | 常规存储，访问控制 |
| bank_account | 高 | AES-256加密存储 |
| password_hash | 高 | bcrypt/argon2哈希 |
| audit_logs | 高 | 只增不改，定期归档 |

---

## 8. 数据保留政策

| 数据类型 | 保留期限 | 处理方式 |
|----------|----------|----------|
| 审计日志 | 7年 | 归档后删除 |
| 学生记录 | 学生离校后7年 | 软删除，归档保留 |
| 财务记录 | 7年 | 归档保留 |
| 考勤记录 | 当前学年+2年 | 删除 |
| 会话记录 | 30天 | 自动清理 |
| 系统日志 | 90天 | 自动清理 |

