# 学生管理 API 设计文档
## Smart School Admin AI System — Student Management API Design
## v1.9.0 | 2026-07-02 | Issue #194 学生管理模块根本性重构

---

> **文档版本：** v1.9.0
> **对应系统版本：** SPEC-COMPLETE v1.9.0
> **最后更新：** 2026-07-02
> **状态：** 新增
> **维护人：** 系统架构团队
> **关联Issue：** #194

---

## 1. 概述

本文档定义学生档案管理模块的 REST API 接口规范。

**设计原则：**
- 学号（`student_id`）由系统自动生成，格式 `YYYYNNNN`，不可手动输入
- 学生档案（`students` 表）与系统用户（`users` 表）完全分离
- 班级分配按学年（`academic_year`）动态管理
- 所有接口遵循 `API接口协议.md` 中的统一规范

**模块前缀：** `STU`

---

## 2. 枚举值

### 2.1 性别枚举 (gender)

| 值 | 说明 |
|----|------|
| `male` | 男 |
| `female` | 女 |
| `other` | 其他 |

### 2.2 学生状态枚举 (student_status)

| 值 | 说明 |
|----|------|
| `active` | 在校 |
| `graduated` | 毕业 |
| `withdrawn` | 退学 |
| `transferred` | 转学 |

### 2.3 分配类型枚举 (allocation_type)

| 值 | 说明 |
|----|------|
| `main` | 主班（每生每学年仅一个）|
| `elective` | 选修 |
| `temporary` | 临时 |

---

## 3. API 接口清单

### 3.1 学生档案管理

#### POST /api/students — 创建学生档案

**描述：** 创建新的学生档案，系统自动生成学号（YYYYNNNN 格式）

**权限：** SA, OFF

**请求体：**
```json
{
  "name_zh": "王小明",
  "name_en": "WONG SIU MING",
  "gender": "male",
  "birth_date": "2011-03-15",
  "address": "香港仔田灣大樓A座12樓",
  "phone": "91234567",
  "email": "parent@example.com",
  "admission_date": "2026-09-01",
  "guardian_name": "王大明",
  "guardian_phone": "91234568",
  "guardian_relationship": "父亲",
  "emergency_contact": "王小華",
  "emergency_phone": "91234569",
  "hk_id": "A123456(7)",
  "notes": "",
  "create_user_account": false
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name_zh | string | **是** | 中文姓名 |
| name_en | string | 否 | 英文姓名 |
| gender | enum | **是** | male/female/other |
| birth_date | string (date) | **是** | 出生日期，格式 YYYY-MM-DD |
| address | string | 否 | 家庭地址 |
| phone | string | 否 | 联系电话 |
| email | string | 否 | 邮箱 |
| admission_date | string (date) | **是** | 入学日期 |
| guardian_name | string | 否 | 监护人姓名 |
| guardian_phone | string | 否 | 监护人电话 |
| guardian_relationship | string | 否 | 监护人关系 |
| emergency_contact | string | 否 | 紧急联系人 |
| emergency_phone | string | 否 | 紧急联系电话 |
| hk_id | string | 否 | 香港身份证 |
| notes | string | 否 | 备注 |
| create_user_account | boolean | 否 | 是否同时创建系统账户（默认 false）|

**学号自动生成规则：**
- 从 `admission_date` 提取年份 YYYY（如 2026）
- 从 `student_id_sequences` 表获取该学年当前最大序号
- 生成新序号 NNNN（4位，不足补0）
- 完整学号：YYYYNNNN（如 2026000001）
- 如果该学年不存在序列记录，自动创建

**响应（HTTP 201）：**
```json
{
  "code": 0,
  "message": "created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "student_id": "2026000001",
    "name_zh": "王小明",
    "name_en": "WONG SIU MING",
    "gender": "male",
    "birth_date": "2011-03-15",
    "address": "香港仔田灣大樓A座12樓",
    "phone": "91234567",
    "email": "parent@example.com",
    "admission_date": "2026-09-01",
    "status": "active",
    "guardian_name": "王大明",
    "guardian_phone": "91234568",
    "guardian_relationship": "父亲",
    "emergency_contact": "王小華",
    "emergency_phone": "91234569",
    "hk_id": "A123456(7)",
    "notes": "",
    "created_at": "2026-07-02T10:00:00.000+08:00",
    "updated_at": "2026-07-02T10:00:00.000+08:00"
  },
  "timestamp": "2026-07-02T10:00:00.000+08:00"
}
```

**错误码：**

| 错误码 | 错误信息 | HTTP |
|--------|----------|------|
| `STU-001` | 必填字段缺失：{field_name} | 400 |
| `STU-002` | 性别枚举值无效 | 400 |
| `STU-003` | 学号生成失败，学年序号已达上限（9999）| 422 |
| `STU-004` | 同一香港身份证已存在 | 409 |

---

#### GET /api/students — 学生列表

**描述：** 获取学生档案列表，支持分页和筛选

**权限：** SA, OFF, T

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码 |
| pageSize | integer | 否 | 20 | 每页数量（最大100）|
| search | string | 否 | | 搜索关键词（姓名、学号）|
| class_id | UUID | 否 | | 按班级筛选 |
| academic_year | string | 否 | 当前学年 | 按学年筛选 |
| status | enum | 否 | | 按状态筛选 |
| gender | enum | 否 | | 按性别筛选 |
| sortBy | string | 否 | created_at | 排序字段 |
| sortOrder | string | 否 | desc | asc/desc |

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "student_id": "2026000001",
        "name_zh": "王小明",
        "name_en": "WONG SIU MING",
        "gender": "male",
        "birth_date": "2011-03-15",
        "admission_date": "2026-09-01",
        "status": "active",
        "current_class": {
          "class_id": "uuid",
          "class_name": "1A",
          "academic_year": "2026-2027"
        },
        "created_at": "2026-07-02T10:00:00.000+08:00"
      }
    ],
    "pagination": {
      "total": 1200,
      "page": 1,
      "pageSize": 20,
      "totalPages": 60,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2026-07-02T10:00:00.000+08:00"
}
```

---

#### GET /api/students/:id — 学生详情

**描述：** 获取单个学生档案详情

**权限：** SA, OFF, T

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "student_id": "2026000001",
    "name_zh": "王小明",
    "name_en": "WONG SIU MING",
    "gender": "male",
    "birth_date": "2011-03-15",
    "address": "香港仔田灣大樓A座12樓",
    "phone": "91234567",
    "email": "parent@example.com",
    "admission_date": "2026-09-01",
    "status": "active",
    "guardian_name": "王大明",
    "guardian_phone": "91234568",
    "guardian_relationship": "父亲",
    "emergency_contact": "王小華",
    "emergency_phone": "91234569",
    "hk_id": "A123456(7)",
    "notes": "",
    "created_at": "2026-07-02T10:00:00.000+08:00",
    "updated_at": "2026-07-02T10:00:00.000+08:00",
    "current_class": {
      "class_id": "uuid",
      "class_name": "1A",
      "academic_year": "2026-2027",
      "homeroom_teacher": "張老師"
    },
    "linked_user_account": {
      "user_id": "uuid",
      "username": "student_2026000001",
      "status": "active"
    }
  },
  "timestamp": "2026-07-02T10:00:00.000+08:00"
}
```

**错误码：**

| 错误码 | 错误信息 | HTTP |
|--------|----------|------|
| `STU-010` | 学生档案不存在 | 404 |

---

#### PUT /api/students/:id — 更新学生档案

**描述：** 更新学生档案信息。学号（student_id）不可修改。

**权限：** SA, OFF

**请求体：**
```json
{
  "name_zh": "王小明",
  "name_en": "WONG SIU MING",
  "gender": "male",
  "birth_date": "2011-03-15",
  "address": "新地址",
  "phone": "91234567",
  "email": "new@example.com",
  "guardian_name": "王大明",
  "guardian_phone": "91234568",
  "guardian_relationship": "父亲",
  "emergency_contact": "王小華",
  "emergency_phone": "91234569",
  "hk_id": "A123456(7)",
  "notes": "更新备注",
  "status": "active"
}
```

**注意：** `student_id`（学号）字段不可传入，如传入将被忽略。

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-07-02T10:05:00.000+08:00"
}
```

**错误码：**

| 错误码 | 错误信息 | HTTP |
|--------|----------|------|
| `STU-010` | 学生档案不存在 | 404 |
| `STU-005` | 学号不可修改 | 400 |

---

#### DELETE /api/students/:id — 删除学生档案（软删除）

**描述：** 软删除学生档案，保留数据

**权限：** SA

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2026-07-02T10:10:00.000+08:00"
  },
  "timestamp": "2026-07-02T10:10:00.000+08:00"
}
```

---

### 3.2 班级分配管理

#### POST /api/students/:id/classes — 分配班级

**描述：** 为学生分配班级（按学年）

**权限：** SA, OFF

**请求体：**
```json
{
  "class_id": "uuid",
  "academic_year_id": "uuid",
  "allocation_type": "main",
  "effective_date": "2026-09-01"
}
```

**业务规则：**
- 同一学生在同一学年内，`allocation_type='main'` 仅能有一个
- 如已存在主班分配，自动将旧分配标记为过期（设置 end_date）

**响应（HTTP 201）：**
```json
{
  "code": 0,
  "message": "created",
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "class_id": "uuid",
    "class_name": "1A",
    "academic_year": "2026-2027",
    "allocation_type": "main",
    "effective_date": "2026-09-01",
    "end_date": null,
    "created_at": "2026-07-02T10:15:00.000+08:00"
  },
  "timestamp": "2026-07-02T10:15:00.000+08:00"
}
```

**错误码：**

| 错误码 | 错误信息 | HTTP |
|--------|----------|------|
| `STU-011` | 班级分配不存在 | 404 |
| `STU-012` | 该学生本学年已有主班分配 | 409 |

---

#### GET /api/students/:id/classes — 学生班级分配历史

**描述：** 获取学生的班级分配历史

**权限：** SA, OFF, T

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| academic_year | string | 否 | 按学年筛选 |

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "student_id": "2026000001",
    "student_name": "王小明",
    "allocations": [
      {
        "id": "uuid",
        "class_id": "uuid",
        "class_name": "1A",
        "academic_year": "2026-2027",
        "allocation_type": "main",
        "effective_date": "2026-09-01",
        "end_date": null,
        "is_current": true
      },
      {
        "id": "uuid",
        "class_id": "uuid",
        "class_name": "2A",
        "academic_year": "2027-2028",
        "allocation_type": "main",
        "effective_date": "2027-09-01",
        "end_date": null,
        "is_current": true
      }
    ]
  },
  "timestamp": "2026-07-02T10:20:00.000+08:00"
}
```

---

#### GET /api/classes/:id/students — 班级学生列表（按学年筛选）

**描述：** 获取指定班级的学生列表

**权限：** SA, OFF, T

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| academic_year | string | 否 | 当前学年 | 学年筛选 |

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "class_id": "uuid",
    "class_name": "1A",
    "academic_year": "2026-2027",
    "homeroom_teacher": "張老師",
    "total_students": 38,
    "students": [
      {
        "id": "uuid",
        "student_id": "2026000001",
        "name_zh": "王小明",
        "name_en": "WONG SIU MING",
        "gender": "male",
        "allocation_type": "main"
      }
    ]
  },
  "timestamp": "2026-07-02T10:25:00.000+08:00"
}
```

---

### 3.3 学年管理

#### GET /api/academic-years — 学年列表

**描述：** 获取所有学年列表

**权限：** SA, OFF

**响应（HTTP 200）：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "year": "2026-2027",
      "start_date": "2026-09-01",
      "end_date": "2027-08-31",
      "is_current": true,
      "status": "active"
    },
    {
      "id": "uuid",
      "year": "2025-2026",
      "start_date": "2025-09-01",
      "end_date": "2026-08-31",
      "is_current": false,
      "status": "active"
    }
  ],
  "timestamp": "2026-07-02T10:30:00.000+08:00"
}
```

---

### 3.4 错误码汇总

| 错误码 | 错误信息 | HTTP | 级别 |
|--------|----------|------|------|
| `STU-001` | 必填字段缺失 | 400 | ERROR |
| `STU-002` | 性别枚举值无效 | 400 | ERROR |
| `STU-003` | 学号生成失败，学年序号已达上限 | 422 | ERROR |
| `STU-004` | 同一香港身份证已存在 | 409 | ERROR |
| `STU-005` | 学号不可修改 | 400 | ERROR |
| `STU-010` | 学生档案不存在 | 404 | ERROR |
| `STU-011` | 班级分配不存在 | 404 | ERROR |
| `STU-012` | 该学生本学年已有主班分配 | 409 | ERROR |

---

## 4. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.9.0 | 2026-07-02 | 新增学生管理 API（Issue #194）|
| v2.0.0-draft.1 | 2026-07-14 | CR-20260714-001: 新增QR考勤API + 学生门户API + 家长门户API |

---

## 5. QR考勤模块 API

### 5.1 QR码生成

**POST /api/attendance/qr/generate**

认证: Student JWT
说明: 学生生成当日签到QR码

**Request**
```json
{}
```

**Response 200**
```json
{
  "qr_code_data": "SCHOOL_QR|1752378000|stu-uuid-1234|a1b2c3d4e5f6a7b8|abc123...sig",
  "expires_at": "2026-07-14T08:30:30.000+08:00",
  "nonce": "a1b2c3d4e5f6a7b8"
}
```

**Error 400** — 当天已签到
```json
{ "error": "ALREADY_CHECKED_IN", "message": "今日已签到", "checked_in_at": "07:32:15" }
```

**Error 401** — 未登录
**Error 429** — 30秒内只能生成一次

### 5.2 QR码扫码签到

**POST /api/attendance/qr/scan**

认证: Staff/Teacher JWT
说明: 教职工扫码记录学生签到

**Request**
```json
{
  "qr_code_data": "SCHOOL_QR|...",
  "device_id": "device-001"
}
```

**Response 200** — 签到成功
```json
{
  "result": "success",
  "student_id": "stu-uuid-1234",
  "student_name": "张小明",
  "class_name": "三年级一班",
  "scanned_at": "2026-07-14T07:32:15.000+08:00"
}
```

**Response 409** — 重复签到
```json
{ "error": "DUPLICATE_CHECKIN", "message": "该学生已签到", "checked_in_at": "07:28:00" }
```

**Response 400** — QR过期
```json
{ "error": "QR_EXPIRED", "message": "QR码已过期，请让学生刷新" }
```

**Response 400** — 签名无效(伪造)
```json
{ "error": "INVALID_SIGNATURE", "message": "伪造QR码", "alert": true }
```

### 5.3 离线批量同步

**POST /api/attendance/qr/sync-batch**

认证: Device Token (X-Device-Token header)
说明: 离线设备网络恢复后批量同步签到数据

**Request**
```json
{
  "device_id": "device-001",
  "batch": [
    { "qr_raw": "SCHOOL_QR|...", "scanned_at": "2026-07-14T07:25:00.000+08:00" },
    { "qr_raw": "SCHOOL_QR|...", "scanned_at": "2026-07-14T07:26:30.000+08:00" }
  ]
}
```

**Response 200**
```json
{
  "synced_count": 2,
  "failed_items": [
    { "index": 0, "reason": "DUPLICATE", "message": "重复签到" }
  ]
}
```

### 5.4 日报查询

**GET /api/attendance/qr/report/daily?class_id={uuid}&date={YYYY-MM-DD}**

认证: Teacher JWT

**Response 200**
```json
{
  "class_name": "三年级一班",
  "report_date": "2026-07-14",
  "total_students": 35,
  "present_count": 33,
  "absent_list": ["王小明", "李小红"],
  "makeup_list": [
    { "student_name": "王小明", "reason": "已到校但未扫码(班主任补签)" }
  ],
  "generated_at": "2026-07-14T18:00:00.000+08:00"
}
```

### 5.5 签到记录查询

**GET /api/attendance/qr/record?student_id={uuid}&page=1&limit=20**

认证: Student JWT (仅本人) / Parent JWT (仅关联子女) / Teacher JWT (本班)

**Response 200**
```json
{
  "records": [
    { "date": "2026-07-14", "checkin_time": "07:32:15", "source": "qr_scan" },
    { "date": "2026-07-13", "checkin_time": "07:28:00", "source": "qr_scan" }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

## 6. 学生/家长门户 API

### 6.1 门户菜单列表

**GET /api/portal/menus**

认证: Student JWT / Parent JWT
说明: 根据角色返回可见菜单树

**Response 200 (Student)**
```json
{
  "role": "student",
  "menus": [
    { "id": "profile", "label": "我的档案", "icon": "user", "children": [
      { "id": "profile-info", "label": "个人信息", "path": "/portal/profile" },
      { "id": "profile-attendance", "label": "签到记录", "path": "/portal/attendance" },
      { "id": "profile-grades", "label": "我的成绩", "path": "/portal/grades" },
      { "id": "profile-timetable", "label": "我的课表", "path": "/portal/timetable" }
    ]},
    { "id": "leave", "label": "请假管理", "icon": "calendar", "children": [
      { "id": "leave-create", "label": "提交请假", "path": "/portal/leave/create" },
      { "id": "leave-records", "label": "请假记录", "path": "/portal/leave" }
    ]},
    { "id": "notifications", "label": "通知中心", "path": "/portal/notifications" },
    { "id": "settings", "label": "账户设置", "path": "/portal/settings" }
  ]
}
```

### 6.2 个人档案查看

**GET /api/portal/profile**

认证: Student JWT

**Response 200**
```json
{
  "student_id": "stu-uuid-1234",
  "name": "张小明",
  "student_code": "2024010123",
  "gender": "男",
  "birth_date": "2016-03-15",
  "class_name": "三年级一班",
  "grade": "三年级",
  "phone": "13800138000",
  "email": "xm@school.com",
  "emergency_contact": "张伟",
  "emergency_phone": "13800139000",
  "address": "XX路XX号",
  "editable_fields": ["phone", "email", "emergency_contact", "emergency_phone", "address"]
}
```

### 6.3 个人档案编辑

**PUT /api/portal/profile**

认证: Student JWT
说明: 仅可编辑 editable_fields 中的字段，锁定字段提交会被忽略

**Request**
```json
{
  "phone": "13800138001",
  "email": "xm_new@school.com"
}
```

**Response 200**
```json
{
  "updated_fields": ["phone", "email"],
  "message": "个人信息已更新"
}
```

### 6.4 提交请假

**POST /api/portal/leave**

认证: Student JWT / Parent JWT

**Request**
```json
{
  "leave_type": "SICK",
  "start_date": "2026-07-15",
  "end_date": "2026-07-15",
  "reason": "身体不适，需在家休息",
  "attachment_url": "https://..."
}
```

**Response 201**
```json
{
  "leave_id": "leave-uuid-5678",
  "status": "PENDING",
  "created_at": "2026-07-14T10:00:00.000+08:00"
}
```

### 6.5 请假记录列表

**GET /api/portal/leave?status={filter}&page=1&limit=20**

认证: Student JWT / Parent JWT

**Response 200**
```json
{
  "records": [
    {
      "leave_id": "leave-uuid-5678",
      "leave_type": "SICK",
      "start_date": "2026-07-15",
      "end_date": "2026-07-15",
      "reason": "身体不适",
      "status": "PENDING",
      "created_at": "2026-07-14T10:00:00Z",
      "can_cancel": true
    },
    {
      "leave_id": "leave-uuid-1234",
      "leave_type": "PERSONAL",
      "start_date": "2026-07-10",
      "end_date": "2026-07-11",
      "reason": "家庭事务",
      "status": "APPROVED",
      "approved_by": "王老师",
      "created_at": "2026-07-09T08:00:00Z",
      "can_cancel": false
    }
  ],
  "total": 5,
  "page": 1
}
```

### 6.6 请假详情

**GET /api/portal/leave/:id**

### 6.7 撤回请假

**DELETE /api/portal/leave/:id**

认证: Student JWT (仅本人)
说明: 仅当 status=PENDING 时可撤回

**Response 200**
```json
{ "status": "CANCELLED", "message": "请假已撤回" }
```

**Response 400** — 不能撤回
```json
{ "error": "CANNOT_CANCEL", "message": "该请假状态不允许撤回" }
```

### 6.8 审批请假

**POST /api/portal/leave/:id/approve**

认证: Teacher/Class Teacher JWT

**Request**
```json
{
  "action": "APPROVE",
  "remark": "同意请假"
}
```

**Response 200**
```json
{ "leave_id": "leave-uuid-5678", "status": "APPROVED", "approved_by": "王老师" }
```

### 6.9 错误码汇总（门户模块）

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | LEAVE_TYPE_INVALID | 请假类型无效 |
| 400 | DATE_RANGE_INVALID | 日期范围无效（结束<开始）| 
| 400 | CANNOT_CANCEL | 不能撤回（非PENDING状态）| 
| 403 | FORBIDDEN_PORTAL | 无门户访问权限 |
| 403 | NOT_YOUR_STUDENT | 非关联子女数据 |
| 409 | LEAVE_OVERLAP | 日期范围与已有请假冲突 |

### 6.10 限流规则

| API | 限制 | 窗口 |
|-----|------|------|
| /api/portal/profile PUT | 5次 | 1小时 |
| /api/portal/leave POST | 10次 | 1天 |
| /api/portal/leave/:id DELETE | 10次 | 1天 |