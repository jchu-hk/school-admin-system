# 学生管理 API 设计文档
## Smart School Admin AI System — Student Management API Design
## v1.9.0 | 2026-07-02 | Issue #194 学生管理模块根本性重构
## +收生模块(Issue #358) | 2026-08-13 | 新增 §10 注册与收生管理模块 API
## +财务与学年结算模块(Issue #359) | 2026-08-13 | 新增 §11 财务与学年结算模块 API
## +资产与供应商管理模块(Issue #360) | 2026-08-13 | 新增 §12 资产与供应商管理模块 API
## +校车点名与查询模板模块(Issue #361) | 2026-08-13 | 新增 §13 校车点名与查询模板模块 API（F-BUS-002, F-INQ-002）
## +AI自动化模块(Issue #362) | 2026-08-13 | 新增 §14 AI自动化模块 API（F-AI-002, F-AUTO-001, F-AUTO-002）
## +增强功能模块(Issue #364) | 2026-08-13 | 新增 §16 增强功能模块 API（F-AI-003, F-I18N-003, F-I18N-004, F-NEW-002, F-NEW-005）

---

> **文档版本：** v1.9.0 (+Issue #358 收生模块)
> **对应系统版本：** SPEC-COMPLETE v1.9.0
> **最后更新：** 2026-08-13
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
| +校车点名与查询模板模块(Issue #361) | 2026-08-13 | 新增 §13 校车点名与查询模板模块 API（F-BUS-002, F-INQ-002）|
| +财务与学年结算模块(Issue #359) | 2026-08-13 | 新增 §11 财务与学年结算模块 API（F-FEE-001, F-FIN-002, F-YREND-001/002）|
| +收生模块(Issue #358) | 2026-08-13 | 新增 §10 注册与收生管理模块 API（F-ENRL-001~003, F-ADM-001~002）|
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

> **模块接线说明（2026-08-18 修复 `/api/portal/leave` 404）**
> 门户 API 由两个 `PortalModule` 组成，在 `app.module.ts` 中分别 import：
> - `PortalModule from './modules/portal/portal.module'` —— 提供 `/api/portal/leave`（电子请假，映射 `leave_requests` 表）、`/api/portal/profile`（个人档案）。
> - `PortalModule as LegacyPortalModule from './portal/portal.module'` —— 提供 `/api/portal/menus`（门户菜单）+ 旧守卫/拦截器。
> 两模块导出同名类，故用别名共存。`/api/portal/leave` 此前 404 系 `app.module.ts` 第 40 行错引了旧 `./portal/portal.module`（只含 menus），新模块未接线所致，本次已修正为同时接线二者。
> 旧 `LeaveModule`（`/api/leaves`，映射旧 `leaves` 表）为独立管理端功能，与本门户电子请假（`leave_requests` 表）并存，表数据互不影响。

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

认证: Student JWT / Parent JWT / Teacher JWT / School Staff JWT / School Director JWT

> 可见范围：Student 仅本人；Parent 仅关联子女；Teacher / School Staff / School Director（审批角色）可见全校所有学生的请假记录（用于审批入口，可按 status 筛选待审批），不按学生过滤。

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

**PATCH /api/portal/leave/:id/cancel**

认证: Student JWT / Parent JWT（仅本人/关联子女，且仅 status=PENDING 可撤回）

> 语义：撤回 = `status` 置为 `cancelled`，**非物理删除记录**。
> 兼容旧路径：`DELETE /api/portal/leave/:id` 保留为软撤回别名（同样置为 `cancelled`）。

**Response 200**
```json
{ "status": "CANCELLED", "message": "请假已撤回" }
```

**Response 400** — 不能撤回
```json
{ "error": "CANNOT_CANCEL", "message": "该请假状态不允许撤回（仅 pending 可撤回）" }
```

**Response 403** — 越权
```json
{ "error": "FORBIDDEN", "message": "无权操作此请假记录" }
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
| /api/portal/leave/:id/cancel PATCH | 10次 | 1天 |
| /api/portal/leave/:id DELETE（软撤回别名）| 10次 | 1天 |

---

## 7. 用户权限与认证模块 API

> 🔧 **补全说明（Issue #355）**：对应 F-USER-003~007，作为 DEV 实现输入。
> 仅设计权限专项接口；登录、OTP、Profile 相关既有接口不在此重复。所有接口鉴权：除非特别注明，均需有效 Access Token。

### 7.1 权限管理 CRUD

**POST /api/roles/permissions**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 创建权限项（F-USER-003）

**Request**
```json
{
  "code": "grade:export:class",
  "name": "导出发年级成绩",
  "module": "grade",
  "resource_type": "grade",
  "action": "export",
  "is_sensitive": true,
  "description": "批量导出生年级成绩表"
}
```

**Response 201**
```json
{ "id": "perm-uuid", "code": "grade:export:class", "is_sensitive": true }
```

**Error 400** — `PERM_INVALID_CODE` code 已存在或格式非法
**Error 403** — 无权限

**GET /api/roles/permissions**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 分页查询权限列表，可按 module/action/is_sensitive 过滤（F-USER-003）

**Query**
```
?module=grade&action=export&is_sensitive=true&page=1&pageSize=20
```

**Response 200**
```json
{
  "items": [{ "id": "perm-uuid", "code": "grade:export:class", "module": "grade", "action": "export", "is_sensitive": true }],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

**GET /api/roles/permissions/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 权限详情
**Response 200** — 权限对象；**Error 404** — `PERM_NOT_FOUND`

**PUT /api/roles/permissions/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 更新权限（code/action 变更须评估审批；is_sensitive 变更触发审计）

**Request**
```json
{ "name": "导出发年级成绩表", "is_sensitive": true }
```

**Response 200** — 更新后权限对象

**DELETE /api/roles/permissions/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 删除权限（被角色引用时禁止，返回冲突）
**Response 204**; **Error 409** — `PERM_IN_USE`

### 7.2 角色管理

**POST /api/roles**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 创建角色（is_system 内置角色不可创建）

**Request**
```json
{
  "name": "VICE_PRINCIPAL",
  "display_name": "副校长",
  "description": "教导主任副校长",
  "priority": 20
}
```

**Response 201** — 角色对象
**Error 400** — `ROLE_NAME_EXISTS`

**GET /api/roles**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM, OFFICER)
说明: 分页角色列表
**Response 200** — `{ items, total, page, pageSize }`

**GET /api/roles/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM, OFFICER)
说明: 角色详情（含权限列表）
**Response 200** — 角色对象 + `permissions[]`

**PUT /api/roles/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 更新角色（is_system 角色仅可改 display_name/description/priority；改权限走审批）

**DELETE /api/roles/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 删除角色（is_system 或仍被用户引用时禁止）
**Error 409** — `ROLE_IN_USE`; **Error 400** — `ROLE_IS_SYSTEM`

### 7.3 角色权限绑定(角色权限关联)与角色分配

**PUT /api/roles/:id/permissions**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 批量设置角色关联权限（role_permissions）；含敏感权限时自动进入审批流 F-USER-007

**Request**
```json
{ "permission_ids": ["perm-a", "perm-b"], "valid_until": "2026-12-31T23:59:59+08:00" }
```

**Response 200**
```json
{
  "applied": ["perm-a", "perm-b"],
  "approval_required": false
}
```

**Response 202** — `approval_required: true`，返回 `approval_request_id`（进入审批流）
**Error 400** — `SENSITIVE_PERMISSION_REQUIRES_APPROVAL`

**POST /api/users/:id/roles**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 分配角色给用户（user_role_assignments）；敏感角色变更走审批

**Request**
```json
{ "role_id": "role-uuid", "valid_from": "2026-08-14T00:00:00+08:00", "valid_until": null }
```

**Response 201** — 分配记录
**Response 202** — `approval_required: true`+`approval_request_id`
**Error 400** — `ROLE_NOT_APPLICABLE`（越权分配）

**GET /api/users/:id/roles**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 查询用户角色列表
**Response 200** — `{ items:[{role_id, role_name, status, valid_until}] }`

**DELETE /api/users/:id/roles/:roleId**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 撤销用户角色（写审计，作废相关会话）
**Response 204**

### 7.4 会话 / Token 管理

**GET /api/auth/sessions**

认证: Bearer
说明: 查询当前用户全部会话（F-USER-004）

**Response 200**
```json
{
  "active_session_count": 2,
  "max_allowed_sessions": 3,
  "sessions": [
    { "session_id": "SES-...-A", "device": "Chrome on Windows", "ip_address": "203.0.113.42", "location": "Hong Kong", "created_at": "2026-05-23T08:30:00+08:00", "last_active": "2026-05-23T09:15:00+08:00", "expires_at": "2026-05-23T14:30:00+08:00", "is_current": true }
  ]
}
```

**DELETE /api/auth/sessions/:sessionId**

认证: Bearer
说明: 注销指定会话（本用户）
**Response 204**; **Error 404** — `SESSION_NOT_FOUND`; **Error 403** — `SESSION_NOT_OWNED`

**DELETE /api/auth/sessions**

认证: Bearer
说明: 注销当前用户全部会话（登出所有设备）
**Response 204**

**POST /api/auth/sessions/revoke-all**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 管理员强制登出指定用户全部会话

**Request**
```json
{ "user_id": "USR-2026-00015", "reason": "离职/权限变更" }
```

**Response 200** — `{ "invalidated_sessions": 2 }`

**POST /api/auth/token/refresh**

认证: Refresh Token (HttpOnly Cookie)
说明: 轮换 Refresh Token 并签发新 Access Token（F-USER-004）

**Response 200**
```json
{ "access_token": "eyJ...", "access_expires_in": 1800, "session_id": "SES-...-A" }
```

**Error 401** — `REFRESH_TOKEN_INVALID`（轮换失败/已用）; **Error 429** — 刷新频次超限

### 7.5 审计日志查询

**GET /api/audit/logs**

认证: Bearer + RolesGuard(SYSTEM, SCHOOL_ADMIN)
说明: 分页查询审计日志，支持多条件过滤（F-USER-005）

**Query**
```
?event_type=login_success&user_id=USR-2026-00001&start_time=2026-05-23T00:00:00%2B08:00&end_time=2026-05-23T23:59:59%2B08:00&severity=high&page=1&pageSize=20
```

**Response 200**
```json
{
  "items": [
    {
      "log_id": "AUD-2026-05-23-001234",
      "timestamp": "2026-05-23T08:35:42+08:00",
      "event_type": "UNAUTHORIZED_ACCESS",
      "severity": "medium",
      "actor": { "user_id": "USR-...", "role": "TEACHER" },
      "target": { "resource": "STUDENT_RECORD", "record_id": "STU-..." },
      "action": "export",
      "decision": "denied",
      "reason": "student_not_in_assigned_class",
      "ip_address": "203.0.113.42"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

**GET /api/audit/logs/:id**

认证: Bearer + RolesGuard(SYSTEM, SCHOOL_ADMIN)
说明: 审计日志详情
**Response 200** — 完整日志对象; **Error 404** — `AUDIT_NOT_FOUND`

### 7.6 凭证重置

**POST /api/auth/password-reset/request**

认证: 匿名
说明: 自助重置发起（邮箱/短信 OTP，F-USER-006）

**Request**
```json
{
  "username_or_email": "c***@school.edu.hk",
  "method": "email_otp",
  "purpose": "login_password"
}
```

**Response 200**
```json
{ "reset_id": "PWR-...", "sent_to_masked": "c***@school.edu.hk", "expires_in_min": 15 }
```

**Error 400** — `RESET_METHOD_UNAVAILABLE`; **Error 429** — 频繁请求

**POST /api/auth/password-reset/verify**

认证: Anonymous
说明: 校验 OTP/链接 Token

**Request**
```json
{ "reset_id": "PWR-...", "otp": "123456" }
```

**Response 200** — `{ "verified": true }`（返回一次性 verify_token）
**Error 400** — `OTP_INVALID`（可重试）; **Error 403** — `RESET_LOCKED`（3 次失败锁定）; **Error 410** — `RESET_EXPIRED`

**POST /api/auth/password-reset/complete**

认证: Anonymous + verify_token
说明: 设置新密码并作废全部会话

**Request**
```json
{ "verify_token": "...", "new_password": "New-Str0ng!" }
```

**Response 200**
```json
{
  "status": "completed",
  "sessions_invalidated": 3,
  "notification_sent": true,
  "redirect_to_login": true
}
```

**Error 400** — `WEAK_PASSWORD`; **Error 409** — `PASSWORD_REUSE`（最近 5 次内）

**POST /api/auth/admin/password-reset**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM) + 二次认证
说明: 管理员代重置（须本人密码 + 手机 OTP，F-USER-006）

**Request**
```json
{
  "target_user_id": "USR-2026-00015",
  "admin_password": "...",
  "admin_otp": "654321",
  "temporary_password": false
}
```

**Response 200** — `{ "reset_id": "PWR-...", "target_user": "USR-2026-00015", "notification_sent": true }`
**Error 401** — `ADMIN_2FA_FAILED`; **Error 403** — `ADMIN_RESET_NOT_ALLOWED`

### 7.7 权限变更审批流程

**POST /api/permission-approval/requests**

认证: Bearer
说明: 提交高风险权限变更申请（F-USER-007），须上传证明文件

**Request**
```json
{
  "target_user_id": "USR-2026-00015",
  "change_type": "cross_class_data_access",
  "role_id": null,
  "permission_ids": [],
  "request_reason": "協助處理跨境學生活動報名",
  "valid_from": "2026-05-23T00:00:00+08:00",
  "valid_until": "2026-06-30T23:59:59+08:00",
  "attachments": [
    { "name": "活動通知.pdf", "url": "oss://...", "mime": "application/pdf", "size": 204800 }
  ]
}
```

**Response 201**
```json
{
  "request_id": "ESC-2026-05-23-001",
  "status": "pending_review",
  "current_step": 1,
  "total_steps": 2,
  "next_approver_role": "校務主任"
}
```

**Error 400** — `APPROVAL_ATTACHMENT_REQUIRED`（无证明文件自动退回）; **Error 400** — `APPROVAL_ATTACHMENT_TOO_LARGE`（>10MB）; **Error 403** — `CHANGE_TYPE_NOT_ALLOWED`

**GET /api/permission-approval/requests**

认证: Bearer + 审批角色
说明: 分页查询审批列表（可按 status/change_type/requester 过滤）
**Response 200** — `{ items, total, page, pageSize }`

**GET /api/permission-approval/requests/:id**

认证: Bearer + 审批角色
说明: 审批详情（含步骤与附件）
**Response 200** — 申请对象 + `steps[]`; **Error 404** — `APPROVAL_NOT_FOUND`

**POST /api/permission-approval/requests/:id/approve**

认证: Bearer + 当前步骤审批角色 + 二次认证
说明: 提交审批决定（须本人 OTP/硬件 Token + 已审查附件）

**Request**
```json
{ "otp": "123456", "comment": "已核实任職證明，同意" }
```

**Response 200**
```json
{
  "request_id": "ESC-2026-05-23-001",
  "status": "approved",
  "granted_permissions": ["cross_class_data_access"],
  "target_session_invalidated": true
}
```

**Response 202** — `{ "approval_pending", "next_approver_role" }`（尚有后续步骤）
**Error 401** — `APPROVER_2FA_FAILED`; **Error 400** — `ATTACHMENT_NOT_REVIEWED`; **Error 403** — `NOT_YOUR_STEP`

**POST /api/permission-approval/requests/:id/reject**

认证: Bearer + 当前步骤审批角色

**Request**
```json
{ "rejection_reason": "證明不充分，退回補充" }
```

**Response 200** — `{ "status": "rejected" }`

**POST /api/permission-approval/requests/:id/cancel**

认证: Bearer + 申请人
说明: 申请人在审批完成前取消申请
**Response 200** — `{ "status": "cancelled" }`; **Error 403** — `NOT_REQUESTER`

**GET /api/permission-approval/pending-approvals**

认证: Bearer + 审批角色
说明: 当前用户待办的审批任务数（用于角标）
**Response 200** — `{ "count": 3 }`

### 7.8 错误码汇总（用户权限与认证模块）

| 错误码 | HTTP | 说明 |
|--------|------|------|
| PERM_INVALID_CODE | 400 | 权限 code 非法或重复 |
| PERM_NOT_FOUND | 404 | 权限不存在 |
| PERM_IN_USE | 409 | 权限被角色引用，禁止删除 |
| ROLE_NAME_EXISTS | 400 | 角色名已存在 |
| ROLE_IN_USE | 409 | 角色仍被引用，禁止删除 |
| ROLE_IS_SYSTEM | 400 | 系统内置角色不可修改/删除 |
| ROLE_NOT_APPLICABLE | 400 | 越权分配角色 |
| SENSITIVE_PERMISSION_REQUIRES_APPROVAL | 400 | 敏感权限须走审批流 |
| SESSION_NOT_FOUND | 404 | 会话不存在 |
| SESSION_NOT_OWNED | 403 | 非本人会话 |
| REFRESH_TOKEN_INVALID | 401 | Refresh Token 无效/已轮换 |
| AUDIT_NOT_FOUND | 404 | 审计日志不存在 |
| RESET_METHOD_UNAVAILABLE | 400 | 该重置方式不可用 |
| OTP_INVALID | 400 | OTP 错误 |
| RESET_LOCKED | 403 | 重置验证失败过多锁定 |
| RESET_EXPIRED | 410 | 重置链接/OTP 过期 |
| WEAK_PASSWORD | 400 | 密码强度不足 |
| PASSWORD_REUSE | 409 | 密码与近期历史重复 |
| ADMIN_2FA_FAILED | 401 | 管理员二次认证失败 |
| ADMIN_RESET_NOT_ALLOWED | 403 | 无权代重置 |
| APPROVAL_ATTACHMENT_REQUIRED | 400 | 缺少证明文件 |
| APPROVAL_ATTACHMENT_TOO_LARGE | 400 | 附件超过 10MB |
| CHANGE_TYPE_NOT_ALLOWED | 403 | 不支持的变更类型 |
| APPROVAL_NOT_FOUND | 404 | 审批申请不存在 |
| APPROVER_2FA_FAILED | 401 | 审批人二次认证失败 |
| ATTACHMENT_NOT_REVIEWED | 400 | 附件未审查 |
| NOT_YOUR_STEP | 403 | 非当前步骤审批人 |
| NOT_REQUESTER | 403 | 非申请人本人 |

### 7.9 限流规则

| API | 限制 | 窗口 |
|-----|------|------|
| /api/auth/password-reset/request | 3次 | 15分钟 |
| /api/auth/password-reset/verify | 5次 | 5分钟 |
| /api/auth/token/refresh | 10次 | 15分钟 |
| /api/permission-approval/requests POST | 5次 | 1小时 |
| /api/audit/logs GET | 30次 | 1分钟 |

---

## 8. 整合及合规模块 API

> 🔧 **补全说明（Issue #356）**：对应 F-INT-001/002 + F-COMP-001/002/003，作为 DEV 实现输入。
> 本模块为「我方系统」接口，对接外部系统（WebSAMS / eClass）的字段/协议见 SPEC-SYSTEM-DESIGN §17.8 对接契约，在本模块以参数/枚举形式体现。
> 审计查询复用既有 `GET /api/audit/logs`（§7.5），本模块不重复设计端点，仅补充本模块涉及的审计事件枚举与查询过滤（文档见 SPEC-SYSTEM-DESIGN §17.6）。
> 所有接口鉴权：除非特别注明，均需有效 Access Token。

### 8.1 合规检查（F-COMP-001）

**POST /api/compliance/check**

认证: Bearer
说明: PDPO 合规判定，在敏感数据访问/导出/同步推送前调用（对应 `pdpo_compliance_check`）。

**Request**
```json
{
  "action": "view",
  "data_class": "P1",
  "purpose": "healthcare",
  "resource_type": "health_record",
  "resource_id": "STU-2023-00789",
  "fields": ["hkid", "medical_allergy"]
}
```

**Response 200**
```json
{
  "check_id": "CMP-2026-08-13-0001",
  "decision": "allow",
  "reason": null,
  "risk_level": "high",
  "check_items": [
    { "name": "purpose_limitation", "passed": true },
    { "name": "data_minimization", "passed": true },
    { "name": "access_control", "passed": true },
    { "name": "retention", "passed": true }
  ]
}
```

**Error 200** — `decision: "deny"` + `reason`（如 `purpose_violation` / `excessive_field` / `access_denied` / `retention_expired`）；**Error 401** — 未认证；**Error 403** — 角色无权限调用合规判定

**GET /api/compliance/checks**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 分页查询合规检查记录

**Query**
```
?data_class=P1&decision=deny&user_id=USR-...&start_time=...&end_time=...&page=1&pageSize=20
```

**Response 200** — `{ items:[{check_id, action, data_class, decision, reason, risk_level, created_at}], total, page, pageSize }`

### 8.2 合规类错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| PURPOSE_VIOLATION | 403 | 目的限制不符 |
| EXCESSIVE_FIELD_REQUEST | 400 | 请求字段超出最小化集合 |
| ACCESS_DENIED | 403 | 无权访问敏感资源 |
| RETENTION_EXPIRED | 403 | 超出保留期限 |

### 8.3 双人见证流程（F-COMP-002）

**POST /api/witness/verifications**

认证: Bearer + 操作角色（员工/发起人）
说明: 触发双人见证（系统亦可在检测到风险场景时自动触发）。

**Request**
```json
{
  "witness_type": "petty_cash",
  "amount": 856.00,
  "business_ref": "PC-2026-00032",
  "witness_1_id": "USR-2026-00002",
  "witness_2_id": "USR-2026-00004"
}
```

**Response 201**
```json
{
  "verification_id": "WIT-2026-08-13-0001",
  "status": "await_first",
  "required_witnesses": 2,
  "witness_1_id": "USR-2026-00002"
}
```

**Error 400** — `WITNESS_SELF_SELECTED`（见证人与发起人同人）/ `WITNESS_INVALID_COUNT`; **Error 403** — `WITNESS_ROLE_NOT_ALLOWED`

**GET /api/witness/verifications/:id**

认证: Bearer + 相关见证人/审批角色
说明: 见证单详情（含步骤与状态）。
**Response 200** — 见证单 + `steps[]`; **Error 404** — `WITNESS_NOT_FOUND`

**GET /api/witness/pending**

认证: Bearer
说明: 当前用户待处理的见证任务（App/角标）。
**Response 200** — `{ count, items:[{verification_id, witness_type, amount, business_ref}] }`

**POST /api/witness/verifications/:id/confirm**

认证: Bearer + 当前步骤见证人 + 二次认证
说明: 见证人确认见证（须本人短信 OTP）。完成后系统自动推进到下一步，最后一步完成即锁定交易。

**Request**
```json
{ "otp": "123456", "comment": "已核實交易" }
```

**Response 200**
```json
{
  "verification_id": "WIT-2026-08-13-0001",
  "status": "completed",
  "completed_at": "2026-08-13T10:30:00+08:00",
  "business_locked": true
}
```

**Response 202** — `{ status: "await_second", next_witness_id }`（尚有后续见证人）
**Error 401** — `WITNESS_2FA_FAILED`; **Error 403** — `NOT_YOUR_STEP` / `WITNESS_ALREADY_DECIDED`; **Error 409** — `WITNESS_TIMEOUT_ESCALATED`

**POST /api/witness/verifications/:id/reject**

认证: Bearer + 当前步骤见证人
说明: 见证人拒绝（记录原因，退回申请人）。

**Request**
```json
{ "rejection_reason": "金額不符，退回核實" }
```

**Response 200** — `{ status: "rejected" }`; **Error 403** — `NOT_YOUR_STEP`

**POST /api/witness/verifications/:id/escalate**

认证: Bearer + 校务主任
说明: 见证超时或异常时升级校务主任处理（可指定替代见证人）。
**Response 200** — `{ status: "escalated", replacement_witness_id }`

**POST /api/witness/verifications/:id/cancel**

认证: Bearer + 发起人/审批角色
说明: 交易取消或见证单作废。
**Response 200** — `{ status: "cancelled" }`; **Error 403** — `NOT_REQUESTER`

### 8.4 审计查询（F-COMP-003）

> 复用既有 `GET /api/audit/logs`（§7.5）与 `GET /api/audit/logs/:id`，无需新增端点；本节仅补充本模块审计事件过滤值：
> `event_type` 可传 `compliance_check_* / witness_* / sync_task_* / sync_conflict_*`（见 SPEC-SYSTEM-DESIGN §17.6 枚举）。

### 8.5 同步任务管理（F-INT-001/002）

**POST /api/sync/tasks/trigger**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 手动触发同步任务（按需拉取/推送）。

**Request**
```json
{
  "provider": "websams",
  "sync_mode": "manual",
  "operation": "pull",
  "domain": "attendance",
  "filters": {
    "academic_year": "2025-2026",
    "class_id": "CLS-2025-0001"
  }
}
```

**Response 202**
```json
{
  "task_id": "SYNC-2026-08-13-0001",
  "sync_ref": "SYNC-2026-08-13-0001-2F4A",
  "status": "queued",
  "scheduled_at": null
}
```

**Error 400** — `SYNC_PROVIDER_NOT_CONFIGURED`; **Error 403** — `SYNC_NOT_ALLOWED`; **Error 409** — `SYNC_IN_PROGRESS`（同 provider+domain 进行中）

**GET /api/sync/tasks**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 分页查询同步任务，可按 provider/status/domain 过滤。

**Query**
```
?provider=websams&status=conflict&domain=attendance&page=1&pageSize=20
```

**Response 200** — `{ items:[{task_id, sync_ref, provider, sync_mode, domain, status, attempt, records_synced, finished_at}], total, page, pageSize }`

**GET /api/sync/tasks/:id**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 同步任务详情（含日志与冲突摘要）。
**Response 200** — 任务对象 + `logs[]`; **Error 404** — `SYNC_TASK_NOT_FOUND`

**POST /api/sync/tasks/:id/retry**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 手动重试失败/退避中的任务（重置 attempt 计数）。

**Request**
```json
{ "reset_attempt": true }
```

**Response 200** — `{ task_id, status: "queued" }`; **Error 400** — `SYNC_NOT_RETRYABLE`（该状态不可重试）; **Error 404** — `SYNC_TASK_NOT_FOUND`

**GET /api/sync/tasks/:id/logs**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 同步任务日志分页。
**Response 200** — `{ items:[{attempt, level, message, external_status_code, latency_ms}], total }`

**POST /api/sync/tasks/:id/cancel**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 取消 queued/retryable 中的任务。
**Response 200** — `{ status: "cancelled" }`; **Error 409** — `SYNC_NOT_CANCELLABLE`

### 8.6 同步冲突处理（F-INT-001/002）

**GET /api/sync/conflicts**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 分页查询同步冲突，可按 conflict_type/resolution 过滤。

**Query**
```
?conflict_type=version_mismatch&resolution=pending&page=1&pageSize=20
```

**Response 200** — `{ items:[{conflict_id, task_id, conflict_type, entity_type, entity_key, local_value, external_value, resolution}], total, page, pageSize }`

**POST /api/sync/conflicts/:id/resolve**

认证: Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM)
说明: 冲突裁决（保留外部/保留本地/合并/拒绝）。

**Request**
```json
{ "resolution": "keep_external", "resolve_note": "以教育局資料為準" }
```

**Response 200**
```json
{ "conflict_id": "CONF-...", "resolution": "keep_external", "task_status": "resolved" }
```

**Error 400** — `CONFLICT_ALREADY_RESOLVED`; **Error 404** — `CONFLICT_NOT_FOUND`; **Error 403** — `CONFLICT_RESOLVE_NOT_ALLOWED`

### 8.7 同步/见证错误码汇总

| 错误码 | HTTP | 说明 |
|--------|------|------|
| SYNC_PROVIDER_NOT_CONFIGURED | 400 | 外部系统未配置凭据 |
| SYNC_NOT_ALLOWED | 403 | 无权触发同步 |
| SYNC_IN_PROGRESS | 409 | 同 provider+domain 已有进行中任务 |
| SYNC_NOT_RETRYABLE | 400 | 当前状态不可重试 |
| SYNC_NOT_CANCELLABLE | 409 | 当前状态不可取消 |
| SYNC_TASK_NOT_FOUND | 404 | 同步任务不存在 |
| CONFLICT_NOT_FOUND | 404 | 冲突记录不存在 |
| CONFLICT_ALREADY_RESOLVED | 400 | 冲突已裁决 |
| CONFLICT_RESOLVE_NOT_ALLOWED | 403 | 无权裁决 |
| WITNESS_NOT_FOUND | 404 | 见证单不存在 |
| WITNESS_SELF_SELECTED | 400 | 见证人与发起人同人 |
| WITNESS_INVALID_COUNT | 400 | 见证人数不符 |
| WITNESS_ROLE_NOT_ALLOWED | 403 | 见证人角色不符 |
| WITNESS_2FA_FAILED | 401 | 见证人二次认证失败 |
| WITNESS_ALREADY_DECIDED | 409 | 该步骤已处理 |
| WITNESS_TIMEOUT_ESCALATED | 409 | 已升级校务主任 |

### 8.8 限流规则

| API | 限制 | 窗口 |
|-----|------|------|
| /api/compliance/check POST | 120次 | 1分钟 |
| /api/witness/verifications/:id/confirm POST | 5次 | 5分钟 |
| /api/sync/tasks/trigger POST | 5次 | 10分钟 |
| /api/sync/conflicts/:id/resolve POST | 10次 | 5分钟 |
| /api/audit/logs GET（复用）| 30次 | 1分钟 |

## 9. 考试与成绩管理模块 API

> 🔧 **补全说明（Issue #357）**：对应 F-EXAM-001（DSE 报考）、F-EXAM-002（试卷管理）、F-EXAM-003（特别考试安排）、F-EXAM-004（成绩单生成发布），作为 DEV 实现输入。
> **边界**：校内考试排期复用既有 `exam` 模块 API（表 `exams`）；校内成绩发布审批复用既有 `/grades/publish/*`（GRADE-PUBLISH-DESIGN §4）；DSE 放榜成绩复用既有 `/dse/*`（Module 12）。本节新增子域专属端点。
> **鉴权**：所有接口需有效 Access Token（JWT/Bearer）；除特别注明外，操作人角色约束见 SPEC-SYSTEM-DESIGN §18.5.4 权限矩阵。
> **通用错误码（§3.4 复用）**：`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT`、`422 VALIDATION_ERROR`、`500 INTERNAL_ERROR`。

### 9.1 DSE 报考批次（F-EXAM-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/exam/dse/batches | 创建报考批次 |
| GET | /api/exam/dse/batches | 查询报考批次列表 |
| GET | /api/exam/dse/batches/:id | 获取批次详情 |
| PATCH | /api/exam/dse/batches/:id | 更新批次（OPEN 前）|
| POST | /api/exam/dse/batches/:id/open | 开放报名 |
| POST | /api/exam/dse/batches/:id/close | 截止报名 |
| POST | /api/exam/dse/batches/:id/submit | 提交 HKEAA |
| POST | /api/exam/dse/batches/:id/confirm | 确认 HKEAA 结果 |

#### POST /api/exam/dse/batches
**请求体：** `{ academicYear, batchCode, name, openAt, closeAt, lateFeePerSubject=560, minSubjects=6, maxSubjects=8 }`
**响应 201：** `{ id, academicYear, batchCode, status:'draft', openAt, closeAt }`
**权限：** 教务处/校长/校务主任

#### POST /api/exam/dse/batches/:id/open
**响应：** `{ id, status:'open', message:'报考已开放' }`

### 9.2 DSE 报考记录（F-EXAM-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/exam/dse/registrations | 创建/申报报考记录 |
| GET | /api/exam/dse/registrations | 查询报考记录（按批次/学生/状态）|
| GET | /api/exam/dse/registrations/:id | 报考详情 |
| PUT | /api/exam/dse/registrations/:id | 修改报考（截止前）|
| POST | /api/exam/dse/registrations/:id/submit | 提交本人报考 |
| POST | /api/exam/dse/registrations/:id/withdraw | 退选（截止后需医疗证明）|
| DELETE | /api/exam/dse/registrations/:id | 取消报考（DRAFT 可删）|

#### POST /api/exam/dse/registrations
**请求体：** `{ batchId, studentId, subjectSelections:[{subjectCode,category}], declarationSigned, photoUrl?, specialArrangementIds?[] }`
**业务校验响应 422：** `{ code:'MIN_SUBJECTS_NOT_MET'|'MAX_SUBJECTS_EXCEEDED'|'CORE_MISSING'|'DECLARATION_REQUIRED'|'LATE_FEE_DUE' }`
**响应 201：** `{ id, registrationId:'DSE-2026-001234', status:'prepared', totalSubjects, lateFeeTotal }`

#### POST /api/exam/dse/registrations/:id/withdraw
**请求体：** `{ reason, medicalProofUrl? }`（截止后退选必填医疗证明）
**响应：** `{ id, status:'withdrawn' }`

### 9.3 试卷管理（F-EXAM-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/exam/papers/requests | 试卷需求统计/印刷申请（F-002a/b）|
| GET | /api/exam/papers/requests | 印刷申请列表 |
| GET | /api/exam/papers/requests/:id | 申请详情 |
| POST | /api/exam/papers/requests/:id/approve | 审批印刷申请 |
| POST | /api/exam/papers/requests/:id/order | 生成供应商印刷订单 |
| POST | /api/exam/papers | 录入试卷（密封追踪 F-002c）|
| GET | /api/exam/papers | 试卷列表 |
| GET | /api/exam/papers/:id | 试卷详情（含保管链 custodyChain）|
| POST | /api/exam/papers/:id/seal | 密封试卷（记 sealNo）|
| POST | /api/exam/papers/:id/status | 状态流转（in_safe/distributed/returned/lost）|
| POST | /api/exam/papers/:id/distribute | 分发（F-002e，监考签收）|
| POST | /api/exam/papers/:id/return | 回收（F-002f）|
| POST | /api/exam/papers/:id/destroy | 审批销毁 |

#### POST /api/exam/papers/requests
**请求体：** `{ examId, subject, classIds:[], requiredCounts, supplier? }`
**响应 201：** `{ id, requestCode, subject, requiredCount, status:'draft' }`

#### POST /api/exam/papers/:id/seal
**请求体：** `{ sealNo }`
**响应：** `{ id, paperCode, sealNo, status:'sealed', custodyChain:[...] }`

#### POST /api/exam/papers/:id/destroy
**请求体：** `{ approvedById, reason }`
**响应：** `{ id, status:'destroyed', destroyApprovedAt }`

#### POST /api/exam/papers/:id/distribute
**请求体：** `{ invigilatorId, distributedCount, signature }`
**响应：** `{ id, status:'distributed', distributedAt }`

#### POST /api/exam/papers/:id/status（LOST 失败告警）
**响应 409（遗失）：** `{ code:'PAPER_LOST_ALERT', message:'试卷遗失已触发告警' }`

### 9.4 特别考试安排（F-EXAM-003）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/exam/special-arrangements | 申请特别考试安排 |
| GET | /api/exam/special-arrangements | 安排单列表 |
| GET | /api/exam/special-arrangements/:id | 安排详情 |
| PUT | /api/exam/special-arrangements/:id | 修改（DRAFT/PENDING）|
| POST | /api/exam/special-arrangements/:id/submit | 提交审批 |
| POST | /api/exam/special-arrangements/:id/approve | 审批通过（学校级）|
| POST | /api/exam/special-arrangements/:id/reject | 拒绝 |
| POST | /api/exam/special-arrangements/:id/complete | 标记完成 |

#### POST /api/exam/special-arrangements
**请求体：** `{ studentId, examId?, subject, paperName?, examDate?, senType?, senSeverity?, arrangements:[{type,description,durationExtension?,room?,invigilatorAssigned?}], hkeaaApproved? }`
**响应 201：** `{ id, arrangementId:'SEA-2026-S6-CHEM-001', status:'pending_approval' }`
**错误码：** `422 { code:'HKEAA_APPROVAL_REQUIRED' }`（需 HKEAA 审批类型未标记时）

#### POST /api/exam/special-arrangements/:id/approve
**请求体：** `{ action:'approve', approvalLevel?, approvalRef?, comment? }`
**响应：** `{ id, status:'approved', approvedAt }`

### 9.5 成绩单生成与发布（F-EXAM-004）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/exam/report-cards/batches | 创建成绩单批次（汇总生成）|
| GET | /api/exam/report-cards/batches | 批次列表 |
| GET | /api/exam/report-cards/batches/:id | 批次详情（含进度）|
| POST | /api/exam/report-cards/batches/:id/generate | 生成成绩单（AI 评语）|
| POST | /api/exam/report-cards/batches/:id/submit | 教师提交（进入 48h 自撤回窗口）|
| POST | /api/exam/report-cards/batches/:id/approve | 审核/审批（L1/L2）|
| POST | /api/exam/report-cards/batches/:id/generate-pdf | 生成 PDF |
| POST | /api/exam/report-cards/batches/:id/publish | 发布（复用发布审批链路）|
| POST | /api/exam/report-cards/batches/:id/cancel | 取消批次 |
| PUT | /api/exam/report-cards/:id/comment | 教师修正评语 |
| POST | /api/exam/report-cards/:id/revoke | 教师自撤回（48h 内）|
| GET | /api/exam/report-cards/:id/pdf | 下载成绩单 PDF（带水印）|
| GET | /api/exam/report-cards/my | 家长/学生查看本人成绩单 |
| GET | /api/exam/report-cards/distribution | 班级成绩分布图数据 |

#### POST /api/exam/report-cards/batches
**请求体：** `{ academicYear, term, scopeType:'class'|'grade_level'|'school', classIds?[], gradeLevels?[], aiCommentEnabled=true, watermarkEnabled=true }`
**响应 201：** `{ id, batchCode:'RC-2026-S1-TERM1-001', totalStudents, gradeRecordIds, status:'draft' }`

#### POST /api/exam/report-cards/batches/:id/generate
**响应：** `{ status:'generating', progress }` → 完成回调 `status:'pending_approval'`
**错误码：** `422 { code:'NO_APPROVED_GRADES' }`（无 APPROVED 成绩数据）

#### POST /api/exam/report-cards/:id/revoke
**请求体：** `{ reason }`（必填）
**响应：** `{ id, status:'draft', message:'已撤回，可修改后重新提交' }`
**错误码：**
- `409 { code:'REVOKE_WINDOW_EXPIRED', message:'超过48小时不可自撤回' }`
- `409 { code:'REVOKE_APPROVED', message:'已审批，不可自撤回' }`
- `422 { code:'REASON_REQUIRED' }`（理由必填；成功撤回触发审计告警推送校务主任）

#### POST /api/exam/report-cards/batches/:id/publish
**请求体：** `{ publishScope, notifyChannels?=['wechat','app'], scheduledPublishAt? }`
**说明：** 后端创建 `grade_publish_requests`（复用既有发布审批）→ 审批通过后置 `report_card_batches.status='published'`、`published_at=now`。
**响应：** `{ id, status:'published', publishRequestId, publishedAt }`

#### GET /api/exam/report-cards/:id/pdf
**响应：** PDF 文件流（A4 竖版，可加水印）
**鉴权：** 仅本人学生/家长或相关教师/教务处/校务主任。

#### GET /api/exam/report-cards/distribution?batchId=:id&classId=:id
**响应：** `{ scoreHistogram:{subject,classScores[],gradeAvg}, gradePie:{A,B,C,D}, rankTrend:[{studentId,currentRank,prevRank,delta}] }`
**权限：** 任教班级教师 / 教务处 / 校务主任。

### 9.6 错误码汇总（考试与成绩管理模块）

| 代码 | HTTP | 说明 |
|------|------|------|
| MIN_SUBJECTS_NOT_MET | 422 | 科目数低于下限 |
| MAX_SUBJECTS_EXCEEDED | 422 | 科目数超过上限 |
| CORE_MISSING | 422 | 缺少 A 类核心科目 |
| DECLARATION_REQUIRED | 422 | 未签署声明书 |
| LATE_FEE_DUE | 422 | 逾期报考需结清逾期费 |
| BATCH_NOT_OPEN | 409 | 批次未开放 |
| REGISTRATION_EXISTS | 409 | 该学生本批次已报考 |
| WITHDRAW_NEEDS_MEDICAL | 422 | 截止后退选需医疗证明 |
| PAPER_LOST_ALERT | 409 | 试卷遗失触发告警 |
| HKEAA_APPROVAL_REQUIRED | 422 | 特殊安排需 HKEAA 审批 |
| NO_APPROVED_GRADES | 422 | 无已审批成绩可生成 |
| REVOKE_WINDOW_EXPIRED | 409 | 超过48小时不可自撤回 |
| REVOKE_APPROVED | 409 | 已审批不可自撤回 |
| REASON_REQUIRED | 422 | 撤回理由必填 |

### 9.7 限流规则

| API | 限制 | 窗口 |
|-----|------|------|
| /api/exam/dse/registrations POST | 60次 | 1分钟 |
| /api/exam/dse/registrations/:id/submit POST | 10次 | 1分钟 |
| /api/exam/papers/:id/distribute POST | 30次 | 1分钟 |
| /api/exam/report-cards/batches/:id/generate POST | 5次 | 10分钟 |
| /api/exam/report-cards/:id/revoke POST | 10次 | 10分钟 |
| /api/exam/report-cards/:id/pdf GET | 60次 | 1分钟 |


---

## 10. 注册与收生管理模块 API

> 🔧 **补全说明（Issue #358）**：对应 F-ENRL-001（新生注册）、F-ENRL-002（AI 编班）、F-ENRL-003（课本分发）、F-ADM-001（SSPA 中一自行分配）、F-ADM-002（JUPAS 联招），作为 DEV 实现输入。
> **边界**：学生档案创建/学号生成复用既有 §3.1 `/api/students`；账务收款复用既有 F-FEE-001（`/api/fees/*`）；放榜后 JUPAS 状态复用既有多项 `dse_offer_tracking`（Module 12）接口；教师招聘（recruitment，模块 14）为雇员招聘，与本节学生收生不交叉。本节新增收生业务专属端点。
> **鉴权**：所有接口需有效 Access Token（JWT/Bearer）；操作人角色约束见 SPEC-SYSTEM-DESIGN §19.8 权限矩阵。
> **通用错误码（§3.4 复用）**：`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT`、`422 VALIDATION_ERROR`、`500 INTERNAL_ERROR`。

### 10.1 新生申请/注册（F-ENRL-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/enrollment/applications | 创建新生/转学申请 |
| GET | /api/enrollment/applications | 查询申请列表（按学年/状态/类型）|
| GET | /api/enrollment/applications/:id | 申请详情（含文件核验清单）|
| PATCH | /api/enrollment/applications/:id | 更新申请（enrolled 前）|
| POST | /api/enrollment/applications/:id/verify | 文件核验（提交核验清单）|
| POST | /api/enrollment/applications/:id/reject | 拒录 |
| POST | /api/enrollment/applications/:id/withdraw | 家长撤回 |
| POST | /api/enrollment/applications/:id/register | 完成注册（写 students + 学号 + 班级归属）|
| PUT | /api/enrollment/applications/:id/documents | 上传/补传文件 |
| GET | /api/enrollment/applications/:id/progress | 家长门户只读进度查询 |

#### POST /api/enrollment/applications
**请求体：** `{ applicationType:'s1_new'|'transfer', academicYearId, studentNameZh, studentNameEn?, dateOfBirth, gender, hkId?, schoolOfOrigin?, parentName, parentHkid, parentPhone, parentEmail?, specialEducationNeeds:false, senDetails?, documents:[{type,name,ocrUrl}], applicationDeadline }`
**业务校验响应：** `{ code:'DEADLINE_PASSED'|'DUPLICATE_HKID'|'MISSING_TRANSFER_SCHOOL' }`
**响应 201：** `{ id, applicationNo:'ENRL-2026-S1-0001', status:'applied' }`

#### POST /api/enrollment/applications/:id/verify
**请求体：** `{ documentChecklist:{birthCertificate:{submitted,verified}, reportCard:{submitted,verified}}, verifiedBy }`
**响应：** `{ id, status:'documents_verified', documentChecklist }`（全部核验后状态流转）

#### POST /api/enrollment/applications/:id/register
**请求体：** `{ classId, academicYearId }`
**响应 201：** `{ id, status:'enrolled', studentId:'2026S10001', classAssigned:'1A', webSAMS_synced:true }`
**说明：** 内部调用学生创建逻辑（§3.1）生成学号并写 `class_allocations`；`enrolled_student_id` 回填。

### 10.2 AI 辅助编班（F-ENRL-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/enrollment/class-allocation/batches | 创建编班批次 |
| GET | /api/enrollment/class-allocation/batches | 批次列表 |
| GET | /api/enrollment/class-allocation/batches/:id | 批次详情（含结果）|
| PATCH | /api/enrollment/class-allocation/batches/:id | 更新批次/权重（computed 前）|
| POST | /api/enrollment/class-allocation/batches/:id/compute | 触发 AI 编班计算（异步）|
| GET | /api/enrollment/class-allocation/batches/:id/result | 获取 AI 建议结果 |
| POST | /api/enrollment/class-allocation/result/:id/adjust | 人工微调（校务主任）|
| POST | /api/enrollment/class-allocation/batches/:id/approve | 审批生效（回写 class_allocations）|
| GET | /api/enrollment/class-allocation/batches/:id/summary | 班级平衡度汇总 |

#### POST /api/enrollment/class-allocation/batches
**请求体：** `{ batchCode, academicYearId, gradeLevel:'S1', numClasses:5, weights:{genderRatio:25,academicAbility:25,senStudents:20,siblingConflict:15,schoolOrigin:10,specialTalent:5}, candidateStudentIds:[] }`
**响应 201：** `{ id, batchCode:'ALLOC-2026-S1-001', status:'draft', balanceScore:null }`

#### POST /api/enrollment/class-allocation/batches/:id/compute
**响应 202（异步）：** `{ taskId, status:'computed', message:'编班计算已提交' }`
**说明：** 完成后 `GET .../result` 返回 `{ allocations:[{class,students:[],genderRatio,senCount,avgAbilityScore}], balanceScore:87.3, conflicts:[], approvalRequired:true }`

#### POST /api/enrollment/class-allocation/result/:id/adjust
**请求体：** `{ suggestedClassId, adjustmentNote }`
**响应：** `{ id, finalClassId, adjustedBy, adjustedAt }`
**权限：** 校务主任/校长

#### POST /api/enrollment/class-allocation/batches/:id/approve
**请求体：** `{ approvedById }`
**响应：** `{ id, status:'effective', effectiveAt, appliedCount:180 }`
**说明：** 审批后写 `class_allocations`（allocation_type=main）；用乐观版本防并发。

### 10.3 课本分发管理（F-ENRL-003）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/textbook/catalog | 课本目录查询/新增 |
| PATCH | /api/textbook/catalog/:id | 更新书目/价格 |
| POST | /api/textbook/batches | 创建课本批次 |
| GET | /api/textbook/batches | 批次列表 |
| POST | /api/textbook/batches/:id/arrive | 批次到货（生成库存）|
| POST | /api/textbook/batches/:id/inventory | 入库/扣减/报废调整 |
| POST | /api/textbook/distribution-lists/generate | 生成班级分发清单（预生成记录，Step 2）|
| GET | /api/textbook/distributions | 分发记录查询（按班级/学生/状态）|
| POST | /api/textbook/distributions | 分发登记（单/批量，Step 3）|
| PATCH | /api/textbook/distributions/:id | 更新分发（付款/备注）|
| POST | /api/textbook/distributions/:id/pay | 收款结算（Step 4，可联动 /api/fees）|
| POST | /api/textbook/distributions/:id/replace | 换货（Step 5，旧记录 replaced）|
| POST | /api/textbook/distributions/:id/return | 退货退款（Step 5，80% 折旧）|
| POST | /api/textbook/distributions/:id/approve | 开学 30 天后特批 |
| GET | /api/textbook/reports/daily-summary | 每日分发汇总（Step 6）|
| POST | /api/textbook/batches/:id/archive | 学期归档 |

#### POST /api/textbook/distribution-lists/generate
**请求体：** `{ batchId, classId, academicYear }`
**响应 201：** `{ generatedCount:50, records:[{distributionId:'TXTBK-2026-1A-001', subject, catalogId, unitPrice, quantity:1, distributionStatus:'pending'}] }`
**说明：** 按 `class_subject_config` 定应领科目；`subsidy_eligibility=full_subsidy` 标 `waived`。

#### POST /api/textbook/distributions
**请求体：** `{ batchId, classId, studentId, catalogId, quantity:1, distributionStatus:'distributed', barcode? }`
**响应 201：** `{ id, distributionId:'TXTBK-2026-1A-001', amountDue:185.00, paymentStatus:'unpaid' }`

#### POST /api/textbook/distributions/:id/pay
**请求体：** `{ paymentMethod:'fps'|'cash'|'octopus'|'e_payment'|'school_award', amountPaid }`
**响应：** `{ id, paymentStatus:'paid', amountPaid:185.00, receiptPushed:true }`

#### POST /api/textbook/distributions/:id/return
**请求体：** `{ reason, returnedQuantity }`
**响应：** `{ id, distributionStatus:'returned', returnRefundAmount:148.00, paymentStatus:'refunded' }`
**说明：** 退款金额 = 原价 × 80%（常量）。

#### POST /api/textbook/distributions/:id/approve
**请求体：** `{ approvedById, reason }`
**响应：** `{ id, approvalRequired:false, approvedBy }`

### 10.4 SSPA 中一自行分配学位（F-ADM-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/sspa/batches | 创建 SSPA 批次 |
| GET | /api/sspa/batches | 批次列表 |
| GET | /api/sspa/batches/:id | 批次详情 |
| PATCH | /api/sspa/batches/:id | 更新批次/权重 |
| POST | /api/sspa/applications | 录入 SSPA 申请 |
| GET | /api/sspa/applications | 申请列表 |
| GET | /api/sspa/applications/:id | 申请详情（含评分）|
| PATCH | /api/sspa/applications/:id | 更新申请 |
| POST | /api/sspa/applications/:id/scores | 录入/更新分项评分 |
| GET | /api/sspa/applications/:id/total-score | 计算总分排序 |
| POST | /api/sspa/batches/:id/announce | 公布正取/备取结果 |
| POST | /api/sspa/applications/:id/confirm-offer | 正取学生确认学位 |
| POST | /api/sspa/applications/:id/register | 确认后进入新生注册 |

#### POST /api/sspa/applications/:id/scores
**请求体：** `{ scores:[{criterion:'academic',score:27}, {criterion:'interview',score:25}], scoredById }`
**响应：** `{ id, totalScore:67.00, status:'scored' }`
**权限：** 收生主任/校务主任；校长酌情权需审批留痕。

#### POST /api/sspa/batches/:id/announce
**请求体：** `{ result:{accepted:[...], waitlist:[...]} }`
**响应：** `{ id, batchStatus:'announced', counts:{accepted:120, waitlist:40} }`

#### POST /api/sspa/applications/:id/confirm-offer
**请求体：** `{ confirmedById }`
**响应：** `{ id, result:'accepted', offerConfirmed:true, status:'confirmed' }`

### 10.5 JUPAS 联招管理（F-ADM-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/jupas/applications | 创建 JUPAS 申请记录 |
| GET | /api/jupas/applications | 申请列表 |
| GET | /api/jupas/applications/:id | 申请详情（含志愿/推荐信/上诉）|
| PATCH | /api/jupas/applications/:id | 更新申请 |
| POST | /api/jupas/applications/:id/choices | 增/改志愿选择 |
| DELETE | /api/jupas/applications/:id/choices/:choiceId | 删除志愿 |
| POST | /api/jupas/applications/:id/submit | 提交学校推荐（更新 edu 状态）|
| GET | /api/jupas/applications/:id/letters | 推荐信列表 |
| POST | /api/jupas/letters | 创建推荐信（含 AI 辅助）|
| PATCH | /api/jupas/letters/:id | 更新推荐信正文 |
| POST | /api/jupas/letters/:id/ai-assist | 触发 AI 写作大纲/字数统计 |
| POST | /api/jupas/letters/:id/submit | 提交推荐信 |
| GET | /api/jupas/letters/:id/stats | 字数统计/术语一致性 |
| POST | /api/jupas/applications/:id/appeals | 提交上诉 |
| GET | /api/jupas/applications/:id/appeals | 上诉列表 |
| POST | /api/jupas/appeals/:id/review | 复核处理上诉 |

#### POST /api/jupas/letters/:id/ai-assist
**请求体：** `{ letterId, content? }`
**响应：** `{ wordCount:280, suggestion:{wordCountWarning:false, outline:['学业表现','个人特质','课外活动'], termConsistency:'ok'} }`

#### POST /api/jupas/letters/:id/submit
**请求体：** `{ submittedById }`
**响应：** `{ id, status:'submitted', submittedAt }`

#### POST /api/jupas/appeals/:id/review
**请求体：** `{ resolution, status:'resolved'|'dismissed', reviewedBy }`
**响应：** `{ id, status:'resolved', resolution }`

### 10.6 限流规则

| API | 限制 | 窗口 |
|-----|------|------|
| /api/enrollment/applications POST | 30次 | 1分钟 |
| /api/enrollment/class-allocation/batches/:id/compute POST | 5次 | 10分钟 |
| /api/textbook/distributions POST | 60次 | 1分钟 |
| /api/textbook/distributions/:id/pay POST | 30次 | 1分钟 |
| /api/jupas/letters/:id/ai-assist POST | 20次 | 1分钟 |
| /api/sspa/applications/:id/scores POST | 30次 | 1分钟 |

### 10.7 错误码（收生模块专属业务码）

> 除通用错误码外，收生模块新增以下业务语义响应。

| 错误码 | HTTP | 场景 |
|--------|------|------|
| DEADLINE_PASSED | 409 | 注册截止已过，需特殊审批 |
| DUPLICATE_HKID | 409 | 同 HKID 已存在申请/学生 |
| MISSING_TRANSFER_SCHOOL | 422 | 转学生缺少原校信息 |
| CLASS_FULL | 409 | 目标班级人数已满 |
| BATCH_NOT_COMPUTED | 409 | 编班批次未计算即请求结果 |
| BATCH_ALREADY_APPROVED | 409 | 批次已审批不可重复审批 |
| BATCH_LOCKED | 409 | 批次已生效，权重不可改 |
| APP_ALREADY_ENROLLED | 409 | 申请已注册，不可重复操作 |
| DOCS_NOT_VERIFIED | 422 | 文件未核验即注册 |
| REFUND_OVER_30D | 409 | 超30天退换需审批 |
| NOT_WAIVED_CANDIDATE | 422 | 非全免资格却请求 waive |
| LETTER_BELOW_MIN_WORDS | 422 | 推荐信低于最低字数不提交 |

---

## 11. 财务与学年结算模块 API

> 🔧 **补全说明（Issue #359）**：对应 F-FEE-001（每日收费追踪）、F-FIN-002（零用现金报销）、F-YREND-001（档案清理与销毁）、F-YREND-002（学年财务结算），作为 DEV 实现输入。
> **边界**：学费/堂费长周期账户（应缴/分期/欠费）沿用既有 F-FIN-001（`/api/tuition/*`、`/api/fees/*`）；课本收款沿用既有 F-ENRL-003（`/api/textbook/distributions/:id/pay`，可联动本模块收据能力）；双人见证复用既有 `/api/witness/verifications`（F-COMP-002）；本节新增收费日结、收据推送、报销、学年结算、档案清理专属端点。
> **鉴权**：所有接口需有效 Access Token（JWT/Bearer）；操作人角色约束见 SPEC-SYSTEM-DESIGN §20.7 权限矩阵。
> **通用错误码（§3.4 复用）**：`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT`、`422 VALIDATION_ERROR`、`500 INTERNAL_ERROR`。

### 11.1 收费项目与每日收费（F-FEE-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/fee-types | 收费项目查询/新增 |
| PATCH | /api/fee-types/:id | 更新收费项目（启用/金额/类别）|
| POST | /api/fee-records | 日常收费登记（单笔，出具收据）|
| GET | /api/fee-records | 收费流水查询（按学生/项目/日期/状态）|
| POST | /api/fee-records/:id/refund | 退款（冲销）|
| POST | /api/receipts/:id/push | 手动补推电子收据 |
| GET | /api/receipts | 收据查询（按学生/收据号）|
| GET | /api/receipts/:id/pdf | 收据 PDF 下载/查看 |
| POST | /api/reconciliations/daily | 生成每日对账 |
| GET | /api/reconciliations/daily | 对账记录列表 |
| GET | /api/reconciliations/daily/:date | 指定日期对账详情 |
| POST | /api/reconciliations/daily/:date/verify-cash | 现金双人见证核实 |
| POST | /api/reconciliations/daily/:date/close | 日结关账 |

#### POST /api/fee-records
**请求体：** `{ studentId, feeTypeId, amount, paymentMethod:'cash'|'cheque'|'fps'|'octopus'|'e_payment', collectedAt, remarks? }`
**响应 201：** `{ id, receiptNo:'RCPT-20260523-0001', paymentStatus:'paid'|'submitted', pushStatus:'pending' }`
**说明：** 现金交易自动触发双人见证（`witness_verifications`）；非现金缴费收款成功后自动推送电子收据（App/邮件/短信备用）。

#### POST /api/reconciliations/daily
**请求体：** `{ reconciliationDate, academicYear? }`
**响应 201：** `{ id, reconciliationDate, totalCollected:15800.00, transactionCount:45, byType:{}, byMethod:{}, expectedTotal, discrepancy:0.00, status:'open' }`

#### POST /api/reconciliations/daily/:date/verify-cash
**请求体：** `{ witness1Id, witness2Id }`
**响应：** `{ id, cashVerified:true, status:'reviewing' }`
**说明：** 现金金额双人见证核实；核实人须与经办人 DISTINCT。

#### POST /api/reconciliations/daily/:date/close
**请求体：** `{ closedBy }`
**响应：** `{ id, status:'balanced'|'investigating', discrepancy, closedAt }`
**说明：** 差异 >HK$50 置 `investigating` 需调查。

### 11.2 零用现金报销（F-FIN-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/petty-cash/reimbursements | 提交报销申请（含收据上传 → OCR）|
| GET | /api/petty-cash/reimbursements | 报销申请列表（按申请人/状态）|
| GET | /api/petty-cash/reimbursements/:id | 报销详情（含 OCR 结果、见证、审批链）|
| POST | /api/petty-cash/reimbursements/:id/ocr | 触发/重试 OCR |
| POST | /api/petty-cash/reimbursements/:id/manual-amount | OCR 失败降级手动录入金额 |
| POST | /api/petty-cash/reimbursements/:id/submit | 提交进入见证/审批流程 |
| POST | /api/petty-cash/reimbursements/:id/approve | 校务主任审批批准 |
| POST | /api/petty-cash/reimbursements/:id/reject | 拒绝（含原因）|
| POST | /api/petty-cash/reimbursements/:id/cancel | 申请人取消 |
| POST | /api/petty-cash/reimbursements/:id/pay | 出账（扣减备用金）|
| GET | /api/petty-cash/transactions | 备用金流水查询（补充/支出）|
| POST | /api/petty-cash/top-up | 备用金补充（衔接 F-FIN-001，双人见证）|
| GET/POST | /api/petty-cash/configs | 备用金配置查询/更新 |
| POST | /api/petty-cash/configs/:academicYearId/confirm | 校务主任确认动态限额 |

#### POST /api/petty-cash/reimbursements
**请求体：** `{ amount, payee, description, category?, receiptUrl }`
**响应 201：** `{ id, transactionNo:'PC-20260523-0001', ocrStatus:'ok'|'failed', amount, singleLimit:3000.00, status:'draft' }`
**说明：** 创建即触发 OCR 识别；`ocrStatus` 返回 match/mismatch/failed 供前端视觉区分（黄色高亮 OCR 金额 + 红色粗体复核提示）。

#### POST /api/petty-cash/reimbursements/:id/submit
**请求体：** `{ }`
**响应：** `{ id, status:'witness_required'|'pending_approval', witnessLevel:'double'|'single', floatBalanceBefore }`
**说明：** 金额 >HK$500 进入双人见证（复用 witness_verifications）；≤HK$500 单人见证；备用金 <HK$500 提示补充、为 0 阻断（`status=blocked`，错误码 `FLOAT_INSUFFICIENT`）；单笔超动态限额阻断（错误码 `OVER_SINGLE_LIMIT`）。

#### POST /api/petty-cash/reimbursements/:id/approve
**请求体：** `{ approvedBy }`
**响应：** `{ id, status:'approved', approvedAt }`
**权限：** 校务主任/校长
**说明：** 见证完成/锁定后待审批；批准后申请人收到通知。

#### POST /api/petty-cash/reimbursements/:id/pay
**请求体：** `{ }`
**响应：** `{ id, status:'paid', paidAt, floatBalanceAfter }`
**说明：** 出账写 `petty_cash_transactions`（tx_type=expense，负金额），更新备用金余额。

#### POST /api/petty-cash/configs/:academicYearId/confirm
**请求体：** `{ confirmedBy }`
**响应：** `{ id, effectiveSingleLimit, configStatus:'confirmed', confirmedAt }`
**说明：** 学年切换自动计算新限额（CPI 公式），校务主任确认后生效并系统公告通知。

### 11.3 学年财务结算（F-YREND-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/year-end/settlements | 创建结算批次 |
| GET | /api/year-end/settlements | 结算批次列表 |
| GET | /api/year-end/settlements/:id | 结算详情（summary/by_category/outstanding_fees）|
| POST | /api/year-end/settlements/:id/compute | 触发结算聚合（异步）|
| POST | /api/year-end/settlements/:id/audit | 审计确认 |
| POST | /api/year-end/settlements/:id/lock | 锁定当年度账目 |
| POST | /api/year-end/settlements/:id/archive | 归档（生成 PDF）|
| GET | /api/year-end/settlements/:id/report | 结算报表 PDF 下载 |

#### POST /api/year-end/settlements
**请求体：** `{ fiscalYear:'2025-2026', academicYearId }`
**响应 201：** `{ id, reconciliationNo:'YREC-2025-2026', fiscalYear, status:'draft' }`

#### POST /api/year-end/settlements/:id/compute
**响应 202（异步）：** `{ taskId, status:'computing', message:'结算聚合已提交' }`
**说明：** 完成后返回 `{ status:'ready_for_audit', summary:{totalFeesCollected, totalExpenses, netBalance, budgetVariance}, byCategory:[{category, budget, collected, outstanding}], outstandingFees:[] }`。含未决差异/欠费争议 → `suspended`。

#### POST /api/year-end/settlements/:id/lock
**请求体：** `{ auditedBy }`
**响应：** `{ id, status:'locked', lockedAt }`
**权限：** 校务主任/校长
**说明：** 锁定后当年度账目冻结，变更须开调整批次。

### 11.4 档案清理与销毁（F-YREND-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/archive/retention-policies | 保存期限策略查询/新增 |
| PATCH | /api/archive/retention-policies/:id | 更新策略 |
| GET | /api/archive/cleanup-records | 到期处置记录列表（按策略/状态/到期日）|
| POST | /api/archive/cleanup-records/scan | 触发到期扫描（生成 pending 记录）|
| GET | /api/archive/cleanup-records/:id | 处置记录详情 |
| POST | /api/archive/cleanup-records/:id/review | 复核处置方式 |
| POST | /api/archive/cleanup-records/:id/approve | 校长/校务主任批准处置 |
| POST | /api/archive/cleanup-records/:id/destroy | 执行销毁（双人见证 + 销毁证书）|
| POST | /api/archive/cleanup-records/:id/hand-over | 执行移交（含接收方/日期）|
| POST | /api/archive/cleanup-records/:id/hold | 暂缓/保留（移出销毁队列）|
| POST | /api/archive/cleanup-records/:id/reject | 否决处置 |

#### POST /api/archive/cleanup-records/scan
**请求体：** `{ academicYearId?, retentionPolicyId? }`（可选过滤）
**响应 201：** `{ generatedCount:34, records:[{id, sourceEntityType:'students', sourceEntityId, retentionPolicyCode, retentionDueDate, disposition:'destroy', status:'pending'}] }`
**说明：** `ArchiveRetentionCron` 按保存期限判定到期，默认 runbook 与手动均可。

#### POST /api/archive/cleanup-records/:id/destroy
**请求体：** `{ witness1Id, witness2Id, destroyedBy }`
**响应：** `{ id, status:'destroyed', destroyCertNo:'DSTR-20260601-0001', destroyedAt }`
**权限：** 校务处同工/会计（执行）、校长/校务主任（审批前置）
**说明：** 销毁须双人见证（复用 witness_verifications），写销毁证书号 + 审计 `archive_destroyed`。

#### POST /api/archive/cleanup-records/:id/hand-over
**请求体：** `{ handOverTarget, handOverRecipient, handedOverBy }`
**响应：** `{ id, status:'handed_over', handOverRecipient, handedOverAt }`
**说明：** 如会议记录（disposition=hand_over）移交校监。

### 11.5 限流规则

| API | 限制 | 窗口 |
|-----|------|------|
| /api/fee-records POST | 60次 | 1分钟 |
| /api/reconciliations/daily POST | 5次 | 1分钟 |
| /api/petty-cash/reimbursements POST | 30次 | 1分钟 |
| /api/petty-cash/reimbursements/:id/ocr POST | 20次 | 1分钟 |
| /api/petty-cash/top-up POST | 10次 | 1分钟 |
| /api/year-end/settlements/:id/compute POST | 5次 | 10分钟 |
| /api/archive/cleanup-records/scan POST | 5次 | 10分钟 |

### 11.6 错误码（财务与学年结算模块专属业务码）

> 除通用错误码外，本模块新增以下业务语义响应。

| 错误码 | HTTP | 场景 |
|--------|------|------|
| FLOAT_INSUFFICIENT | 422 | 备用金余额不足（<HK$500 提示补充 / =0 禁止提交）|
| OVER_SINGLE_LIMIT | 409 | 单笔报销超动态限额（需联系校务主任调整）|
| OCR_MISMATCH | 409 | OCR 金额与系统登记金额不一致，需人工核对收据 |
| DUPLICATE_RECEIPT | 409 | 同一流水重复出具收据 |
| RECON_NOT_BALANCED | 409 | 对账未对平即关账 |
| RECON_CASH_UNVERIFIED | 422 | 现金未双人见证核实即关账 |
| SETTLE_ALREADY_LOCKED | 409 | 结算批次已锁定不可再操作 |
| SETTLE_HAS_DISPUTED | 409 | 存在未决差异/欠费争议需暂缓结算 |
| ARCHIVE_ALREADY_DISPOSED | 409 | 处置对象已处理不可重复处置 |
| DISPOSE_NEEDS_WITNESS | 422 | 销毁未双人见证不可执行 |
| RETENTION_NOT_DUE | 422 | 未到保存期限不可销毁 |

## 12. 资产与供应商管理模块 API

> 🔧 **补全说明（Issue #360）**：对应 F-ASSET-001（校产条码盘点）、F-ASSET-002（场地租借管理）、F-ASSET-003（设备保养管理）、F-VEND-001（供应商注册与评估），作为 DEV 实现输入。
> **边界**：一般资产 CRUD 与按件借用归还沿用既有 `asset` 模块（`/api/asset*`，Entity `assets`/`asset_rentals`）；本节新增固定资产条码盘点、场地租借、保养计划/工单、供应商注册评估专属端点。
> **鉴权**：所有接口需有效 Access Token（JWT/Bearer）；操作人角色约束见 SPEC-SYSTEM-DESIGN §21.6 权限矩阵。
> **通用错误码（§3.4 复用）**：`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT`、`422 VALIDATION_ERROR`、`500 INTERNAL_ERROR`。
> **外部供应商**：仅通过限定公开端点（提交/更新自身注册、查看自身评估）访问，ABAC 按 `vendor_id` 范围限制，无内部后台权限。

### 12.1 校产条码盘点（F-ASSET-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/fixed-assets | 固定资产列表/登记 |
| GET | /api/fixed-assets/:id | 固定资产详情（含条码）|
| PATCH | /api/fixed-assets/:id | 更新固定资产 |
| POST | /api/fixed-assets/:id/barcode | 生成/重打印资产条码（QR）|
| GET/POST | /api/inventory/sessions | 盘点批次查询/创建 |
| POST | /api/inventory/sessions/:id/start | 开始盘点（planning→in_progress）|
| POST | /api/inventory/sessions/:id/verify | 汇总核对（in_progress→verifying）|
| POST | /api/inventory/sessions/:id/close | 结题（verifying→closed，只读）|
| POST | /api/inventory/sessions/:id/cancel | 取消盘点 |
| GET | /api/inventory/sessions/:id/report | 生成盘点报告（盘点率/差异清单/状况汇总）|
| POST | /api/inventory/sessions/:id/items/scan | 扫码录入盘点明细 |
| POST | /api/inventory/sessions/:id/items/import | 离线批量导入盘点结果 |
| GET | /api/inventory/sessions/:id/items | 盘点明细列表（按差异/状态）|
| POST | /api/inventory/items/:id/investigate | 差异调查（pending→resolved）|
| POST | /api/inventory/items/:id/resolve | 结案差异（resolved→closed）|

#### POST /api/fixed-assets
**请求体：** `{ name, category:'fixed'|'electronics'|..., brand?, model?, serialNo?, location?, responsiblePersonId?, purchaseValue, purchaseDate?, vendorId? }`
**响应 201：** `{ id, code:'ASSET-2026-COMPUTER-0001', condition:'good', isActive:true }`
**说明：** 登记时自动分配唯一条码 `code`；vendor 衔接 F-VEND-001。

#### POST /api/inventory/sessions
**请求体：** `{ name, academicYearId?, scope:{categories?[], locations?[], responsiblePersonIds?[]} }`
**响应 201：** `{ id, sessionNo:'INV-2026-ANNUAL-001', totalRegistered:0, status:'draft' }`

#### POST /api/inventory/sessions/:id/items/scan
**请求体：** `{ scanCode, actualLocation?, condition? }`
**响应 201：** `{ id, scanResult:'scanned_matched'|'scanned_mismatch'|'missing'|'unknown', investigationStatus:'pending' }`
**说明：** 未扫到或地点不符自动标记差异，可批量导入离线结果。

#### POST /api/inventory/sessions/:id/report
**响应：** `{ id, sessionNo, totalRegistered:1200, assetsVerified:1150, verificationRate:95.83, discrepancies:[], conditionSummary:{} }`

#### POST /api/inventory/items/:id/investigate
**请求体：** `{ investigatedBy, note }`
**响应：** `{ id, investigationStatus:'resolved' }`

#### POST /api/inventory/sessions/:id/close
**请求体：** `{ closedBy }`
**响应：** `{ id, status:'closed', closedAt }`
**说明：** 结题后批次与明细只读（防篡改）；解锁须走重开流程。

### 12.2 场地租借管理（F-ASSET-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/venues | 场地列表/建档 |
| GET | /api/venues/:id | 场地详情（含定价/保险/可用时段）|
| PATCH | /api/venues/:id | 更新场地（单价/按金/保险）|
| GET | /api/venues/:id/availability | 场地可用时段/冲突检查 |
| POST | /api/venue-rentals | 提交租借申请（自动计算租金/按金）|
| GET | /api/venue-rentals | 租借单列表（按场地/状态/租借方）|
| GET | /api/venue-rentals/:id | 租借单详情（含价格明细/审批链）|
| POST | /api/venue-rentals/:id/submit | 提交审批 |
| POST | /api/venue-rentals/:id/approve | 审批通过（→approved）|
| POST | /api/venue-rentals/:id/reject | 审批拒绝（含原因）|
| POST | /api/venue-rentals/:id/confirm | 确认收款（approved→confirmed(payment)）|
| POST | /api/venue-rentals/:id/start | 开始使用（→in_progress）|
| POST | /api/venue-rentals/:id/complete | 归还完成（→completed）|
| POST | /api/venue-rentals/:id/settle | 结算（completed→closed，退按金/扣损，出收据）|
| POST | /api/venue-rentals/:id/cancel | 取消租借 |

#### POST /api/venue-rentals
**请求体：** `{ venueId, renterType:'internal'|'external', renterName, renterContact?, startAt, endAt, depositCollected? }`
**响应 201：** `{ id, requestNo:'VR-20260813-0001', durationHours:3, totalAmount:2400.00, depositAmount:2000.00, insuranceRequired:true, status:'draft' }`
**说明：** 租金 = 时长 × 小时单价（DB 事务计算）；冲突时段返回 409。

#### POST /api/venues/:id/availability
**请求体：** `{ startAt, endAt }`
**响应：** `{ available:true|false, conflicts:[{rentalId, requestNo, startAt, endAt}] }`

#### POST /api/venue-rentals/:id/approve
**响应：** `{ id, status:'approved', approvedAt }`
**说明：** 审批人依权限矩阵（校务处/校务主任）；外租编号段需审批。

#### POST /api/venue-rentals/:id/settle
**请求体：** `{ damageDeducted?, receiptNo? }`
**响应：** `{ id, status:'closed', depositCollected:2000.00, depositRefunded:1800.00, damageDeducted:200.00, closedAt }`

### 12.3 设备保养管理（F-ASSET-003）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/maintenance/plans | 保养计划列表/创建 |
| GET | /api/maintenance/plans/:id | 计划详情（含下次到期/状态）|
| PATCH | /api/maintenance/plans/:id | 更新计划（频率/下次到期/供应商）|
| POST | /api/maintenance/plans/:id/suspend | 暂停计划（active→suspended）|
| POST | /api/maintenance/plans/:id/retire | 停用计划（→retired）|
| GET/POST | /api/maintenance/work-orders | 保养工单列表/手动建单（故障维修）|
| GET | /api/maintenance/work-orders/:id | 工单详情（含执行/附件/验收链）|
| POST | /api/maintenance/work-orders/:id/assign | 指派执行人（scheduled→assigned）|
| POST | /api/maintenance/work-orders/:id/start | 开始执行（assigned→in_progress）|
| POST | /api/maintenance/work-orders/:id/submit | 提交执行结果（in_progress→submitted）|
| POST | /api/maintenance/work-orders/:id/verify | 验收（submitted→verified）|
| POST | /api/maintenance/work-orders/:id/close | 关闭（verified→closed）|
| POST | /api/maintenance/work-orders/:id/cancel | 取消工单 |
| GET | /api/maintenance/work-orders/upcoming | 到期提醒列表（临期工单）|

#### POST /api/maintenance/work-orders
**请求体：** `{ planId?, assetId?, fixedAssetId?, maintenanceType:'regular'|'preventive'|'repair'|'safety_check', scheduledDate?, assigneeType?, vendorId? }`
**响应 201：** `{ id, workOrderNo:'MWO-20260813-0001', status:'scheduled', cost:0 }`
**说明：** 故障维修（repair）可无 planId 手动建单；scheduled 工单由 `MaintenanceScheduleCron` 自动生成。

#### POST /api/maintenance/work-orders/:id/submit
**请求体：** `{ result, cost?, safetyCertNo?, attachmentUrl? }`
**响应：** `{ id, status:'submitted', cost, safetyCertNo? }`
**说明：** `safety_check` 类 `safetyCertNo` 必填；外判费用联动财务回写。

#### GET /api/maintenance/work-orders/upcoming
**响应：** `{ items:[{id, workOrderNo, assetId?, fixedAssetId?, scheduledDate, maintenanceType}], dueInDays:7 }`

### 12.4 供应商注册与评估（F-VEND-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/vendors/register | 供应商自主提交注册（公开）|
| POST | /api/vendors/me/submit | 更新自身注册资料（公开，按 vendor_id 限制）|
| GET | /api/vendors | 供应商列表（后台管理）|
| GET | /api/vendors/:id | 供应商详情（后台管理）|
| POST | /api/vendors/:id/review | 校务处审核（pending_review→approved/rejected）|
| POST | /api/vendors/:id/suspend | 暂停供应商（→suspended）|
| POST | /api/vendors/:id/certificates | 上传/更新证照（含有效期）|
| GET | /api/vendors/qualified | 合格供应商名录（is_qualified=true）|
| GET | /api/vendors/:id/certificate-expiry | 证照到期提醒查询 |
| GET/POST | /api/vendor-evaluations | 评估列表/发起评估 |
| POST | /api/vendor-evaluations/:id/score | 评审人打分（in_progress→scored）|
| POST | /api/vendor-evaluations/:id/conclude | 汇总定级（scored→concluded，A/B/C+结论）|
| POST | /api/vendor-evaluations/:id/cancel | 取消评估 |
| GET | /api/vendors/me/evaluations | 供应商查看自身评估（公开，限定自身）|

#### POST /api/vendors/register
**请求体：** `{ name, category:'book'|'stationery'|..., contactPerson?, contactPhone?, contactEmail, bankAccount?, address?, licenseNo? }`
**响应 201：** `{ id, vendorCode:'VEND-2026-0001', status:'draft', contactEmail }`
**说明：** `contactEmail`/`bankAccount`/证照属 P1，加密存储、最小权限授权。

#### POST /api/vendors/:id/review
**请求体：** `{ approve:true|false, rejectionReason? }`
**响应：** `{ id, status:'approved'|'rejected', isQualified:true|false, reviewedAt }`
**说明：** 审核人须为校务处/校务主任；审批全链路写 `audit_logs`。

#### POST /api/vendor-evaluations/:id/score
**请求体：** `{ evaluatorId, scores:{quality,price,delivery,service,compliance} }`
**响应：** `{ id, weightedScore:86.5, status:'scored' }`

#### POST /api/vendor-evaluations/:id/conclude
**请求体：** `{ concludedBy }`
**响应：** `{ id, grade:'B', conclusion:'renew'|'watching'|'eliminate', status:'concluded', concludedAt }`
**说明：** 多名评审汇总加权后定级；合格供应商同步更新 `vendors.is_qualified`。

### 12.5 错误码（本模块新增业务语义）

> 除通用错误码外，本模块新增以下业务语义响应。

| 错误码 | HTTP | 场景 |
|--------|------|------|
| VENUE_TIME_CONFLICT | 409 | 同一场地时间段重叠（应用层 + DB 排他约束）|
| VENUE_INSURANCE_MISSING | 422 | 需投保场地未提供保险单不可 confirmed |
| VENUE_NOT_FINISHED | 409 | 场地未归还（completed）不可结算 |
| INV_SESSION_CLOSED | 409 | 盘点批次已 closed 只读，不可改动（走重开流程）|
| INV_FIXED_ASSET_DUP | 409 | 同一固定资产在同一批次重复盘点 |
| MNT_CERT_REQUIRED | 422 | 安全检测类工单未填资质证书号不可提交 |
| MNT_PLAN_NOT_ACTIVE | 409 | 已暂停/停用计划不可生成工单 |
| VENDOR_DUPLICATE | 409 | 供应商已存在（同名/统一编号）|
| VENDOR_CERT_EXPIRED | 422 | 证照已过期，需更新后方可续用 |
| EVAL_NOT_CONCLUDABLE | 409 | 评估未完成打分（scored）不可定级 |

## 13. 校车点名与查询模板模块 API

> 🔧 **补全说明（Issue #361）**：对应 F-BUS-002（校车点大名记录）、F-INQ-002（快速回复模板），作为 DEV 实现输入。
> **边界**：校车点名（上车/下车）独立于校园出勤与 QR 校园签到（§5）；快速回复模板服务于 F-INQ-001 家长查询队列回复流程，区别于通用通知模板。见 SPEC-SYSTEM-DESIGN §22。
> **鉴权**：所有接口需有效 Access Token（JWT/Bearer）；操作人角色约束见 SPEC-SYSTEM-DESIGN §22.6 权限矩阵。学生/家长经门户端点仅能查看本人/自己子女记录（ABAC 按 `student_id` 范围，§15 数据隔离层）。
> **通用错误码（§3.4 复用）**：`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT`、`422 VALIDATION_ERROR`、`500 INTERNAL_ERROR`。

### 13.1 校车/线路/班次主档（F-BUS-001/002）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/buses | 校车列表/登记 |
| GET | /api/buses/:id | 校车详情 |
| PATCH | /api/buses/:id | 更新校车（含停用）|
| GET/POST | /api/bus-routes | 线路列表/创建 |
| GET | /api/bus-routes/:id | 线路详情（含停靠站/阈值）|
| PATCH | /api/bus-routes/:id | 更新线路（停靠站/延误阈值）|
| GET/POST | /api/bus-shifts | 班次/行程列表（按日期/线路/方向）/创建 |
| GET | /api/bus-shifts/:id | 行程详情（含乘搭名单与点名汇总）|
| POST | /api/bus-shifts/:id/activate | 开始行程（draft→active）|
| POST | /api/bus-shifts/:id/close | 关闭行程（active→closed，只读）|
| POST | /api/bus-shifts/:id/cancel | 取消行程 |
| POST | /api/bus-shifts/generate | 批量生成次日/本周行程（cron 驱动）|
| POST | /api/bus-students | 添加乘搭分配（学生→线路/日期/方向）|
| GET | /api/bus-students | 乘搭名单列表（按线路/日期）|
| POST | /api/bus-students/:id/suspend | 暂停乘搭 |

#### POST /api/buses
**请求体：** `{ busCode:'BUS-A1', plateNo?, capacity:46, vendorId? }`
**响应 201：** `{ id, busCode, capacity, status:'active', isActive:true }`
**说明：** `busCode` 唯一；vendor 可选衔接供应商模块。

#### POST /api/bus-routes
**请求体：** `{ routeCode:'ROUTE-TKO', name:'將軍澳線', origin, destination, stops:[{name,order,etaMinutes}], delayNotifyThresholdMinutes:10 }`
**响应 201：** `{ id, routeCode, name, delayNotifyThresholdMinutes:10, status:'active' }`

#### POST /api/bus-shifts
**请求体：** `{ routeId, busId, shiftDate:'2026-08-14', direction:'morning', planDepartAt?, planArriveAt? }`
**响应 201：** `{ id, shiftNo:'BS-20260814-001', routeId, busId, date:'2026-08-14', direction:'morning', status:'draft' }`
**说明：** 行程创建为 draft，点名前需 activate。批量生成依默认乘搭表与线路时刻。

#### POST /api/bus-shifts/generate
**请求体：** `{ startDate, endDate, routeIds?, directions?:['morning','afternoon'] }`
**响应：** `{ created: 10, skipped: 2, shifts:[{id, shiftNo, date, direction}] }`
**说明：** 由 `BusShiftGeneratorCron` 或手动调用按工作日批量创建 draft 行程。

#### POST /api/bus-shifts/:id/close
**请求体：** `{ closedBy }`
**响应：** `{ id, shiftNo, status:'closed', closedAt, summary:{totalExpected, onboarded, alighted, missed} }`
**说明：** 关闭后名单与点名只读；未点名名单进入 `missed`。

### 13.2 校车点名记录（F-BUS-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/bus-shifts/:id/checkins | 录入点名（扫码/手动，onboard/alight）|
| GET | /api/bus-shifts/:id/checkins | 行程点名列表（按学生/状态/类型）|
| GET | /api/bus-shifts/:id/checkins/missing | 应乘未点名名单（待补点）|
| POST | /api/bus-checkins/:id/notify-parents | 发送点名家长通知（全/单组，置 parent_notification_sent）|
| GET | /api/bus-checkins/daily | 每日点名日报（按线路/班次汇总）|
| GET | /api/me/bus-checkins | 家长查看本人子女点名记录（门户，ABAC 限制）|

#### POST /api/bus-shifts/:id/checkins
**请求体：** `{ studentId, checkType:'onboard'|'alight', location?, locationSource:'gps'|'manual', deviceId?, scannedBy? }`
**响应 201：** `{ id, checkinNo:'CHK-20260814-0001', studentId, checkType:'alight', checkedAt, status:'arrived_safely', parentNotificationSent:false }`
**说明：** 同行程同学生同 `checkType` 重复返回 409 `DUPLICATE`；`alight` 且到校派生 `status=arrived_safely`；点名后触发异步家长通知（§7.3）。

#### GET /api/bus-shifts/:id/checkins/missing
**响应：** `{ items:[{studentId, studentName, classId, boardStop, alightStop}], total:3 }`
**说明：** 返回应乘名单中无任何点名的学生；供补点与 F-BUS-001 一键通知。

#### POST /api/bus-checkins/:id/notify-parents
**请求体：** `{ notifyType:'onboard'|'arrived'|'delay', delayMinutes?, delayReason?, incidentType? }`
**响应：** `{ id, parentNotificationSent:true, channelSummary:{wechat:true, sms:false, email:false} }`
**说明：** 通知内容经 §7.3 多渠道发送；`delay` 走 F-BUS-001 延误阈值（>10 微信，>20 短信）。

#### GET /api/me/bus-checkins
**查询参数：** `shiftDate?, studentId?`（学生为本人，家长为自己的子女，ABAC 范围限制）
**响应：** `{ items:[{shiftNo, date, direction, routeName, checkType, checkedAt, status, location}] }`

### 13.3 快速回复模板（F-INQ-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/quick-reply-templates | 模板列表（按分类/状态/关键词，含内置）|
| POST | /api/quick-reply-templates | 创建模板（自定义）|
| GET | /api/quick-reply-templates/:id | 模板详情（含变量/意图标签）|
| PATCH | /api/quick-reply-templates/:id | 更新模板（自定义可改；内置仅可停用）|
| POST | /api/quick-reply-templates/:id/duplicate | 复制内置/自定义模板为新模板 |
| POST | /api/quick-reply-templates/:id/deactivate | 停用（active→inactive）|
| POST | /api/quick-reply-templates/:id/activate | 启用（inactive→active）|
| POST | /api/quick-reply-templates/:id/restore | 恢复软删除（自定义）|
| DELETE | /api/quick-reply-templates/:id | 软删除（仅自定义）|
| POST | /api/quick-reply-templates/match | 按查询上下文匹配推荐模板 |
| POST | /api/quick-reply-templates/:id/render | 变量渲染生成回复正文 |
| POST | /api/quick-reply-templates/:id/send | 渲染并发送家长回复（写 inquiry_replies + 推送）|
| POST | /api/quick-reply-templates/seed | 初始化 41 个内置模板（幂等迁移）|

#### POST /api/quick-reply-templates
**请求体：** `{ category:'bus', name:'校車延誤通知', title?, content:'校車{{bus_code}}因{{delay_reason}}延誤約{{delay_minutes}}分鐘，預計{{estimated_arrival}}到校。', variables:['bus_code','delay_reason','delay_minutes','estimated_arrival'], intentTags:['bus_schedule'], channels:['wechat','sms','email'] }`
**响应 201：** `{ id, templateCode:'QRT-BUS-042', name, category:'bus', isDefault:false, status:'active' }`
**说明：** 新建即自定义模板（`isDefault=false`）；`templateCode` 自动分配。

#### POST /api/quick-reply-templates/match
**请求体：** `{ inquiryId?, intent:'bus_schedule', keyword?, channel?' }`
**响应：** `{ matches:[{id, templateCode, name, category, score:0.96}], top:{id, templateCode, name} }`
**说明：** 依 F-INQ-001 `intent` 与关键词检索推荐；`score` 由意图标签命中+关键词相关度计算。

#### POST /api/quick-reply-templates/:id/render
**请求体：** `{ context:{ studentId?, busCode?, delayReason?, delayMinutes?, estimatedArrival?, studentName? } }`
**响应：** `{ id, templateCode, renderedTitle?, renderedContent:'校車BUS-A1因交通意外延誤約15分鐘，預計07:42到校。', variablesUsed:['bus_code','delay_reason','delay_minutes','estimated_arrival'] }`
**说明：** 校验必填变量缺失返回 422 `TEMPLATE_MISSING_VARS`。

#### POST /api/quick-reply-templates/:id/send
**请求体：** `{ inquiryId, context:{...}, channel:'wechat'|'sms'|'email' }`
**响应 201：** `{ id, inquiryId, replyId, renderedContent, sentAt, channelDelivery:{wechat:{status:'delivered'}} }`
**说明：** 渲染后写 `inquiry_replies` 并推送家长（§7.3）；F-INQ-001 AC-05 场景。

#### POST /api/quick-reply-templates/seed
**响应：** `{ seeded:41, skipped:0 }`
**说明：** 幂等初始化 5 类 41 个内置模板（bus 8 / lunch 6 / fee 10 / leave 5 / general 12）；运行迁移或 SWAGGER 触发。

### 13.4 错误码（本模块新增）

| 错误码 | HTTP | 说明 |
|--------|------|------|
| BUS_NOT_FOUND | 404 | 校车不存在 |
| ROUTE_NOT_FOUND | 404 | 线路不存在 |
| SHIFT_LOCKED | 409 | 行程已 closed/cancelled，不可点名/变更 |
| SHIFT_NOT_ACTIVE | 409 | 行程非 active 不可点名 |
| CHECKIN_DUPLICATE | 409 | 同行程同学生同类型重复点名 |
| CHECKIN_NO_ASSIGNMENT | 422 | 学生无对应乘搭分配（或需标记异常）|
| BUS_STUDENT_DUP | 409 | 同学生同线路同日期同方向重复分配 |
| TEMPLATE_NOT_FOUND | 404 | 模板不存在 |
| TEMPLATE_DEFAULT_LOCKED | 409 | 内置模板不可物理删除/编辑正文（仅可停用/复制）|
| TEMPLATE_MISSING_VARS | 422 | 渲染时必填变量缺失 |
| TEMPLATE_INACTIVE | 409 | 已停用模板不可发送 |


## 14. AI 自动化模块 API

> 🔧 **补全说明（Issue #362）**：对应 F-AI-002（FAQ 智能匹配）、F-AUTO-001（周期性任务触发器）、F-AUTO-002（智能提醒系统），作为 DEV 实现输入。
> **边界**：FAQ 语义检索复用既有 Embedding（OpenAI text-embedding-3）与 pgvector（§2.2）；如需 LLM 意图分类/答案生成可经 Coze/OpenAI（§2.2 LLM Provider），本模块在 LLM 之上提供匹配编排与日志。F-AUTO-002 提醒的**发送**与**送达回执**复用 §7.3 多渠道通知架构与 `notifications`/`notification_deliveries`；本模块的 `reminder_records` 承载提醒级策略（级别/升级/未读跟进）。周期任务调度复用 `@nestjs/schedule`（SchedulerRegistry），与既有 cron（午膳、出勤日报、全级轮换等）同一基建。见 SPEC-SYSTEM-DESIGN §23。
> **鉴权**：所有接口需有效 Access Token（JWT/Bearer）；角色约束见 SPEC-SYSTEM-DESIGN §23.6 权限矩阵（FAQ/任务/提醒规则维护限校务主任/校务处同工/系统管理员）。
> **通用错误码（§3.4 复用）**：`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT`、`422 VALIDATION_ERROR`、`500 INTERNAL_ERROR`。

### 14.1 FAQ 知识条目管理（F-AI-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/faq | FAQ 列表（按分类/状态/关键词，分页）|
| POST | /api/faq | 创建 FAQ（含问题/答案/关键词/意图/嵌入生成）|
| GET | /api/faq/:id | FAQ 详情 |
| PATCH | /api/faq/:id | 更新 FAQ（更新后重算嵌入）|
| POST | /api/faq/:id/deactivate | 停用（active→inactive）|
| POST | /api/faq/:id/activate | 启用（inactive→active）|
| POST | /api/faq/:id/reindex | 单项重建嵌入/TF-IDF 缓存 |
| POST | /api/faq/reindex-all | 全量重建嵌入（幂等，迁移/维护用）|
| DELETE | /api/faq/:id | 软删除 |
| GET | /api/faq/match | 匹配查询（核心：多路打分返回候选）|
| POST | /api/faq/matches/:id/feedback | 反馈有用/无用 |

#### POST /api/faq
**请求体：** `{ category:'fee', questionZh:'如何查閱繳費記錄？', questionEn?, answer:{plain:'登入家長系統...', quick_reply_template_code?}, keywords:['繳費','記錄','學費'], triggerIntents:['fee_query'] }`
**响应 201：** `{ id, faqCode:'FAQ-20260813-001', category:'fee', status:'active', embedded:true }`
**说明：** 创建时同步调用 embedding 生成向量写入 `faq_knowledge_base.embedding`；`embedding` 失败时 `embedded=false`（降级关键词匹配）。

#### GET /api/faq/match
**查询参数：** `query`（必填）、`sessionId?`、`limit=5`、`intent?`（可指定意图）
**响应：** `{ results:[{faqId, questionZh, answer, score:0.93, matchedBy:['semantic','keyword']}], top:{faqId, questionZh, answer, score}, latencyMs:28, usedVector:true }`
**说明：** 融合打分 `final = keyword*0.3 + tfidf*0.2 + semantic*0.3 + intent*0.2`（F-AI-002 算法）；低分（`top_score < 0.4`）不返回 `top` 并记 `match_logs` 未命中。每请求写 `faq_match_logs`。

#### POST /api/faq/matches/:id/feedback
**请求体：** `{ useful:true, matchLogId? }`
**响应：** `{ id, helpfulCount:12, notHelpfulCount:1 }`
**说明：** 回写 `faq_match_logs.feedback` 并增量 `faq_knowledge_base.helpful_count/not_helpful_count`。

### 14.2 周期任务管理（F-AUTO-001）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/scheduled-tasks | 任务列表（按状态/类型/分页）|
| POST | /api/scheduled-tasks | 创建周期任务（含触发表达式与动作）|
| GET | /api/scheduled-tasks/:id | 任务详情（含上次/下次执行）|
| PATCH | /api/scheduled-tasks/:id | 更新任务（改表达式/参数/状态）|
| POST | /api/scheduled-tasks/:id/pause | 暂停（active→paused）|
| POST | /api/scheduled-tasks/:id/resume | 恢复（paused→active）|
| POST | /api/scheduled-tasks/:id/disable | 停用（→disabled）|
| POST | /api/scheduled-tasks/:id/run-now | 手动立即触发一次 |
| DELETE | /api/scheduled-tasks/:id | 软删除 |
| GET | /api/scheduled-tasks/:id/executions | 任务执行日志（分页）|
| GET | /api/scheduled-task-executions/:executionId | 单次执行详情 |

#### POST /api/scheduled-tasks
**请求体：** `{ name:'晨检仪表板刷新', triggerType:'daily', time:'06:30', actionType:'refresh_dashboard_data', actionParams:{dashboardIds:['main']}, priority:'normal' }`
**响应 201：** `{ id, taskCode:'CRON-20260813-0001', cronExpression:'0 30 6 * * *', status:'active', nextRunAt:'2026-08-14T06:30:00+08:00' }`
**说明：** 依 `triggerType` 与时间频率生成 `cron_expression`；支持 `triggerType:'cron'` 直接传 `cronExpression`。创建即注册到 SchedulerRegistry。

#### POST /api/scheduled-tasks/:id/run-now
**响应：** `{ executionNo:'EXE-20260813163000-001', status:'running' }`
**说明：** 忽略 `next_run_at` 立即排队执行，并写 `scheduled_task_executions` 供日志查询。

#### GET /api/scheduled-tasks/:id/executions
**查询参数：** `status?`、`from?`、`to?`、`page=1&pageSize=20`
**响应：** `{ items:[{executionNo, triggeredAt, status:'success', durationMs:1200, resultSummary}], total:34 }`

### 14.3 智能提醒规则与记录（F-AUTO-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reminder-rules | 提醒规则列表（按级别/业务/状态）|
| POST | /api/reminder-rules | 创建提醒规则 |
| GET | /api/reminder-rules/:id | 规则详情 |
| PATCH | /api/reminder-rules/:id | 更新规则 |
| POST | /api/reminder-rules/:id/pause | 暂停 |
| POST | /api/reminder-rules/:id/resume | 恢复 |
| POST | /api/reminder-rules/:id/disable | 停用 |
| DELETE | /api/reminder-rules/:id | 软删除 |
| GET | /api/reminder-records | 提醒记录（按接收者/规则/状态/已读）|
| GET | /api/reminder-records/:id | 提醒详情（含送达/已读/升级历史）|
| POST | /api/reminder-records/:id/trigger | 手动触发一条提醒（测试/补发）|
| POST | /api/reminder-records/:id/escalate | 手动升级层级 |
| POST | /api/reminder-records/:id/followup-retry | 手动触发未读跟进重发 |

#### POST /api/reminder-rules
**请求体：** `{ name:'校車延誤提醒', businessType:'bus', level:'urgent', channels:['app_push','sms'], smsBackup:true, escalationEnabled:true, escalationDelayMinutes:120, escalateToRoles:['school_head'], templateId?, filterCondition:{busRoutes:['ROUTE-TKO']} }`
**响应 201：** `{ id, ruleCode:'RMD-20260813-0001', level:'urgent', channels:['app_push','sms'], smsBackup:true, status:'active' }`
**说明：** 高优先级（bus/attendance/emergency）默认 `smsBackup=true`；`level=critical` 强制全渠道+校领导+立即（`escalationDelayMinutes=0`）。

#### GET /api/reminder-records
**查询参数：** `recipientId?`、`ruleId?`、`deliverStatus?`、`readStatus?`、`from?`、`to?`、`page=1&pageSize=20`
**响应：** `{ items:[{reminderNo, level:'urgent', deliverStatus:'delivered', readStatus:'unread', channel:'app_push', smsFallbackSent:true, retryCount:1, nextFollowupAt}], total:128 }`

#### GET /api/reminder-records/:id
**响应：** `{ reminderNo, ruleId, recipient:{id, name}, level:'urgent', deliverStatus:'delivered', readStatus:'read', readAt, channel:'app_push', notificationId, escalationLevel:'normal', escalationHistory:[{at, fromLevel:'urgent', toLevel:'normal', via:'app_push'}], smsFallbackSent:false }`

#### POST /api/reminder-records/:id/followup-retry
**请求体：** `{ viaSmsBackup?:true }`
**响应：** `{ id, retryCount:2, deliverStatus:'sent', smsFallbackSent:true, channelSummary:{app_push:true, sms:true} }`
**说明：** 未读跟进：`next_followup_at` 到点未读 → 重发一次；应用户模拟反馈 P0-01（24h 未读自动重发一次 + 短信备用）。

### 14.4 错误码（本模块新增）

| 错误码 | HTTP | 说明 |
|--------|------|------|
| FAQ_NOT_FOUND | 404 | FAQ 条目不存在 |
| FAQ_DUP_CODE | 409 | FAQ 编号重复 |
| FAQ_EMBED_FAILED | 422 | 向量嵌入生成失败（可降级关键词匹配）|
| FAQ_LOW_SCORE | 404 | 匹配分数低于阈值无候选命中 |
| TASK_NOT_FOUND | 404 | 周期任务不存在 |
| TASK_DUP_CODE | 409 | 任务编号重复 |
| TASK_INVALID_CRON | 422 | cron 表达式非法 |
| TASK_ALREADY_RUNNING | 409 | 任务正在执行，拒绝重复触发 |
| TASK_DISABLED | 409 | 任务已停用不可 run-now |
| RULE_NOT_FOUND | 404 | 提醒规则不存在 |
| RULE_DUP_CODE | 409 | 规则编号重复 |
| RULE_INVALID_CHANNEL | 422 | 渠道组合非法（如 critical 缺短信/电话）|
| REMINDER_NOT_FOUND | 404 | 提醒记录不存在 |
| REMINDER_ALREADY_READ | 409 | 已读记录不可再触发未读跟进 |

### 14.5 限流规则

| 端点 | 限流 | 说明 |
|------|------|------|
| GET/POST /api/faq/match | 60 req/min/调用方 | FAQ 匹配为 LLM/向量密集操作，防止滥用 |
| POST /api/scheduled-tasks/:id/run-now | 10 req/hour/调用方 | 防止手动触发洪峰重载调度器 |
| 其余 /api/reminder-*、/api/faq | 默认 §3.6 通用限流 | - |

---

## 15. 运维自动化模块 API（Issue #363, F-OPS-002/003/006/007/008/009）

> 运维状态查询与手动运维操作接口，为运维健康仪表板（F-OPS-009）与运维人员提供数据访问。
> 鉴权：除非特别注明，均需有效 Access Token（`Bearer + RolesGuard`）。默认 SYSTEM_ADMIN 可读写，SCHOOL_ADMIN（校务主任）只读。含 P1/P0 数据（敏感字段访问日志、DDL 语句）仅 SYSTEM_ADMIN 可查，叠加 ABAC（§16）。系统设计见 SPEC-SYSTEM-DESIGN §24，表结构 DB-SCHEMA §24，字段 DATA-DICTIONARY §27。
> 统一响应：`{ data, meta:{ page, pageSize, total } }`；错误码见 §15.4（前缀 `OPS_`）。

### 15.1 SSL 证书状态（F-OPS-002）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/ssl-certificates | SSL 证书状态列表 |
| GET | /api/ops/ssl-certificates/:domain | 单证书详情+续期历史 |

#### GET /api/ops/ssl-certificates
**查询参数：** `status?`（alert_level）、`expiringWithinDays?`、`page=1&pageSize=20`
**响应 200：** `{ data:[{ domain, issuer, notAfter:'2026-06-13T23:59:59+08:00', daysUntilExpiry:7, alertLevel:'warning', autoRenewEnabled:true, renewalResult:'success', lastRenewedAt }], meta:{ page:1, pageSize:20, total:5 } }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

#### GET /api/ops/ssl-certificates/:domain
**响应 200：** `{ domain, issuer, notBefore, notAfter, daysUntilExpiry, alertLevel, autoRenewEnabled, renewalResult, renewalAttempts, lastRenewalDetail, vaultPath, renewalHistory:[{ eventType:'ssl_cert_renewed', resolvedAt, detail }] }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

### 15.2 WebSAMS Token 刷新状态（F-OPS-003）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/token-refresh/websams | WebSAMS Token 刷新状态 |
| POST | /api/ops/token-refresh/websams | 手动触发 Token 立即刷新 |

#### GET /api/ops/token-refresh/websams
**查询参数：** `schoolId?`、`historyFrom?&historyTo?`、`page=1&pageSize=20`
**响应 200：** `{ current:{ schoolId, tokenStatus:'valid', remainingHours:23.5, refreshedAt, expiresAt, degradedMode:'none', providerActive:'websams' }, refreshHistory:[{ refreshNo, refreshedAt, reason:'scheduled_check', result:'success', remainingHours }], total:34 }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

#### POST /api/ops/token-refresh/websams
**请求体：** `{ schoolId, reason?:'manual' }`
**响应 202：** `{ refreshNo:'TOK-20260813165000-001', tokenStatus:'refresh_triggered', remainingHours:0, refreshedAt:'2026-08-13T16:50:00+08:00' }`
**说明：** 忽略剩余有效期立即排队刷新（分布式锁防并发）；写 `token_refresh_status` + `audit_logs`（audit_action=`websams_token_refreshed`）。校验失败返回 `OPS_TOKEN_REFRESH_FAILED`。
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`

### 15.3 Coze API 配额监控（F-OPS-006）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/coze-quota | Coze 配额实时监控 |
| GET | /api/ops/coze-quota/history | 配额使用率历史时间序列 |

#### GET /api/ops/coze-quota
**查询参数：** `metric?`（rpm/tpm/daily_limit）
**响应 200：** `{ metrics:[{ metricName:'rpm', used:8200, limit:10000, usagePercent:82, alertLevel:'warning', rateLimited:false, rateLimitAction:'none', providerActive:'coze' }] }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

#### GET /api/ops/coze-quota/history
**查询参数：** `metric='rpm'`、`from?&to?`、`interval?`（5m/1h/1d）
**响应 200：** `{ metricName:'rpm', series:[{ sampleAt:'2026-08-13T16:45:00+08:00', usagePercent:82, alertLevel:'warning' }] }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

### 15.4 敏感字段访问日志 / 告警查询（F-OPS-007）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/sensitive-field-access | 敏感字段访问日志/告警查询 |

#### GET /api/ops/sensitive-field-access
**查询参数：** `fieldType?`（hkid/phone/address/medical）、`userId?`、`alertLevel?`、`from?&to?`、`page=1&pageSize=20`
**响应 200：** `{ items:[{ userId, fieldType:'hkid', targetType:'student', targetId, action:'view', accessedAt, alertLevel:'warning', windowAlerts:{count:12, threshold:5, windowStart, windowEnd}, paused:false, eventNo:'OPS-...' }], total:27 }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`（仅系统管理员，含 P0 数据）
**说明：** 只读日志。`alertLevel` 标记阈值命中（§9.8）；持续异常（3 次/小时）联动权限暂停已生效的 `paused=true`。

### 15.5 DDL 审计查询（F-OPS-008）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/ddl-audit | DDL 审计日志查询 |

#### GET /api/ops/ddl-audit
**查询参数：** `commandTag?`（DROP TABLE/ALTER TABLE...）、`executor?`、`from?&to?`、`page=1&pageSize=20`
**响应 200：** `{ items:[{ eventType, objectType:'TABLE', objectName:'students', commandTag:'ALTER TABLE', ddlStatement, executedBy, executedAt, clientAddr, schemaName }], total:8 }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`（仅系统管理员，含 DDL 语句）
**说明：** 只读；引用 §9.9.2 `ddl_audit_log`；只追加不可改。

### 15.6 运维健康仪表板（F-OPS-009）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/health | 仪表板 9 维度 + 总体健康数据 |

#### GET /api/ops/health
**查询参数：** `schoolId?`
**响应 200：** `{ overall:{ score:82, status:'healthy' }, dimensions:[{ dimension:'db', score:90, status:'healthy', weight:15, detail:{ connectionUsagePercent:45 } }, ...], recentEvents:[{ eventNo, eventType:'coze_quota_alert', severity:'warning', title, createdAt }], updatedAt }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`
**说明：** 数据源 `ops_health_metrics`（每 1 分钟采样，§9.10.4 `ops_health_score` 复合指标）与 `ops_events`（近期事件流）。

### 15.7 统一运维事件流

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ops/events | 运维事件流（分页过滤）|
| GET | /api/ops/events/:id | 运维事件详情 |
| POST | /api/ops/events/:id/acknowledge | 确认事件 |
| POST | /api/ops/events/:id/resolve | 解决事件 |

#### GET /api/ops/events
**查询参数：** `eventType?`、`severity?`、`status?`（open/acknowledged/resolved/expired）、`source?`、`from?&to?`、`page=1&pageSize=20`
**响应 200：** `{ items:[{ eventNo, eventType:'ssl_cert_expiry_alert', severity:'warning', source:'cert', title:'证书7天内到期', refId:'school-admin.internal', status:'open', createdAt }], total:12 }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

#### GET /api/ops/events/:id
**响应 200：** `{ eventNo, eventType, severity, source, title, detail, refId, status, acknowledgedBy, acknowledgedAt, resolvedAt, auditSynced, createdAt }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`

#### POST /api/ops/events/:id/acknowledge
**响应 200：** `{ id, status:'acknowledged', acknowledgedAt }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`
**说明：** 写 `audit_logs`（audit_action=`ops_event_acknowledged`）。

#### POST /api/ops/events/:id/resolve
**请求体：** `{ resolutionNote? }`
**响应 200：** `{ id, status:'resolved', resolvedAt, resolutionNote }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`
**说明：** 写 `audit_logs`（audit_action=`ops_event_resolved`）。

### 15.8 错误码（本模块新增业务语义，前缀 `OPS_`）

| 错误码 | HTTP | 说明 |
|--------|------|------|
| OPS_CERT_NOT_FOUND | 404 | 证书域名不存在 |
| OPS_TOKEN_REFRESH_FAILED | 502 | WebSAMS Token 刷新失败（触发 §9.4.2 降级与告警）|
| OPS_TOKEN_ALREADY_REFRESHING | 409 | 已有刷新进行中（分布式锁占用）|
| OPS_QUOTA_METRIC_INVALID | 422 | 配额 metric 非法（非 rpm/tpm/daily_limit）|
| OPS_EVENT_NOT_FOUND | 404 | 运维事件不存在 |
| OPS_EVENT_CLOSED | 409 | 事件已 resolved/expired 不可再 acknowledge/resolve |
| OPS_SENSITIVE_DENIED | 403 | 无权限查看敏感字段访问日志 / DDL 语句（仅 SYSTEM_ADMIN）|
| OPS_INVALID_FIELD_TYPE | 422 | 敏感字段类型非法 |

### 15.9 限流规则

| 端点 | 限流 | 说明 |
|------|------|------|
| POST /api/ops/token-refresh/websams | 5 req/hour/调用方 | 防止手动刷新洪峰 |
| 其余 /api/ops/* | 默认 §3.6 通用限流 | - |

---

## 16. 增强功能模块 API（Issue #364, F-AI-003 / F-I18N-003 / F-I18N-004 / F-NEW-002 / F-NEW-005）

> **统一响应约定：** 均返回 `{ data, meta:{ page,pageSize,total } }`；时间字段 ISO8601（`+08:00`）。鉴权统一 `Bearer + RolesGuard`；角色/权限沿用 Module 16（ABAC）。错误码见 §16.6（统一前缀 `OCR_`/`TRL_`/`LOC_`/`NTF_`/`RPT_`）。

### 16.1 OCR 文档识别（F-AI-003）

**限流：** POST /api/ocr/submit 10 req/min/用户（防洪峰）；其余 /api/ocr/* 默认 §3.6 通用限流。

### 16.1 OCR 文档识别（F-AI-003）

#### POST /api/ocr/submit
**请求体：** `{ docType:'hk_id', sourceEntityType:'leave_case', sourceEntityId:'UUID', fileUrl:'https://…', parseSchemaVersion? }`
**响应 202：** `{ taskId, taskNo:'OCR-20260813-…', status:'queued', fileUrl }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF, TEACHER)`（限本人业务范围）
**说明：** 创建 `ocr_tasks`（QUEUED）入队异步识别；P1 文档（hk_id/medical）含 PDPO 合规校验（SYS 写审计）。

#### GET /api/ocr/tasks/:id
**响应 200：** `{ id, taskNo, docType, status:'succeeded', engine:'azure', confidence:0.998, rawText, resultId, createdAt }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN, OFFICE_STAFF)`（本人任务或全校可查）

#### GET /api/ocr/tasks/:id/results
**响应 200：** `{ taskId, results:[{ field:'id_number', value:'A123456(7)', confidence:0.999, matched:true, reviewStatus:'auto' }] }`
**鉴权：** 同上（人工校正写审计 `ocr_result_corrected`）

#### POST /api/ocr/tasks/:id/retry
**响应 200：** `{ taskId, status:'queued', retryCount:2 }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, SYSTEM_ADMIN)`
**说明：** 仅 `FAILED` 且 `retry_count < 3` 可重试。

#### POST /api/ocr/results/:id/review
**请求体：** `{ reviewStatus:'corrected', value? }`
**响应 200：** `{ id, field, value, reviewStatus:'corrected', reviewedBy, reviewedAt }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF, SYSTEM_ADMIN)`
**说明：** 人工校正，写审计 `ocr_result_corrected`。

### 16.2 实时内容翻译（F-I18N-003）

**限流：** POST /api/i18n/translate 60 req/min/用户（实时，保护 LLM 配额）；POST /api/i18n/translate/batch 20 req/min/用户；其余默认 §3.6 通用限流。

#### POST /api/i18n/translate
**请求体：** `{ text:'曠課', sourceLocale:'zh-HK', targetLocale:'en', useCache?:true }`
**响应 200：** `{ original:'曠課', translated:'Absence without leave', sourceLocale:'zh-HK', targetLocale:'en', confidence:0.99, cached:true, glossaryApplied:1 }`
**鉴权：** `Bearer + any role`（家长端聊天场景亦可用）
**说明：** `sourceLocale==targetLocale` 直接返回原文；命中缓存返回 `cached:true`（验收 #1）。

#### POST /api/i18n/translate/batch
**请求体：** `{ texts:['…','…'], sourceLocale:'zh-HK', targetLocale:'en' }`（≤50 条，验收 #3）
**响应 200：** `{ translations:[{ original, translated, confidence, cached }] }`
**鉴权：** `Bearer + any role`

#### GET /api/i18n/cache/stats
**响应 200：** `{ total, hitRate:0.92, expiredCount, byProvider:{coze:int,openai:int} }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN, SCHOOL_ADMIN)`
**说明：** 翻译缓存命中率统计（验收 #4 抽检辅助）。

#### POST /api/i18n/cache/clear
**请求体：** `{ locale? , olderThanHours? }`
**响应 200：** `{ cleared:1234 }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`
**说明：** 手动清理过期缓存（日常由 §23 周期任务自动 `purge_translation_cache`）。

### 16.3 Locale 格式配置（F-I18N-004）

#### GET /api/i18n/locale-configs
**查询参数：** `scope?`（global/school/user）、`locale?`
**响应 200：** `{ items:[{ scope:'global', locale:'zh-HK', dateFormat:'yyyy年M月d日', timeFormat:'a h:mm', currencyCode:'HKD', currencySymbol:'HK$', numberLocale:'zh-HK', isDefault:true }] , total }`
**鉴权：** `Bearer + any role`（只读）

#### PUT /api/i18n/locale-configs/:id
**请求体：** `{ dateFormat?, timeFormat?, currencyCode?, currencySymbol?, numberLocale?, percentFormat?, fileSizeUnit? }`
**响应 200：** `{ id, locale, scope, updatedAt }`
**鉴权：** `Bearer + RolesGuard(SYSTEM_ADMIN)`（global）；`SCHOOL_ADMIN`（school 范围内）
**说明：** 写审计 `locale_config_changed`。

### 16.4 多渠道通知模板管理（F-NEW-002）

> **复用**：模板 CRUD 端点沿用既有 `POST/GET/PUT /api/notifications/templates`（§3 API 清单 + NotificationController）。本节新增 `notification_delivery_rules` 管理端点。

#### GET /api/notifications/templates
**查询参数：** `category?`、`urgency?`、`keyword?`、`page=1&pageSize=20`
**响应 200：** `{ items:[{ id, templateCode, name, category:'bus', urgency:'high', channels:['wechat','sms'], fallbackChannel:'sms' }], total }`
**鉴权：** `Bearer + any role`（教师/家长只读引用）

#### POST /api/notifications/templates
**请求体：** `{ templateCode, name, category:'bus', urgency:'high', channels:['wechat','sms'], fallbackChannel:'sms', wechatTemplateId?, appPushTitle?, appPushContent?, smsContent?, emailSubject?, emailBody?, variables:['route_name','delay_minutes'], }`
**响应 201：** `{ id, templateCode, name, version:1, createdAt }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF, SYSTEM_ADMIN)`
**说明：** 创建模板；渠道字段缺失时校验（多渠道配置验收）。

#### PUT /api/notifications/templates/:id
**请求体：** `{ name?, content 字段?, variables?, isActive? }`
**响应 200：** `{ id, version:2, updatedAt }`
**鉴权：** 同上；更新递增 `version`。

#### POST /api/notifications/templates/:id/render
**请求体：** `{ variables:{ route_name:'校车線 A-1', delay_minutes:'15', eta_time:'07:42' }, channel:'app_push' }`
**响应 200：** `{ id, renderedTitle, renderedContent:'親愛的家長，您的孩子乘坐的校車（線路：校車線 A-1）…', variablesUsed:['route_name','delay_minutes','eta_time'], missingVariables:[] }`
**鉴权：** `Bearer + any role`
**说明：** 变量渲染，`missingVariables` 列出缺失变量（无遗漏验收）。

#### POST /api/notifications/send
**请求体：** `{ templateId?, recipientGroup:'parents'|'teachers'|'all'|'specific_users', recipientUserIds?:[], variables:{} , channelOverride?:[], scheduledAt? }`
**响应 202：** 单条 `{ id, notificationNo, channel:'app_push', status:'pending' }`；批量 `{ notificationIds:[…], total }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF)`
**说明：** 复用既有 `NotificationService` 发送；送达回执经 `notification_deliveries`（既有）。

#### GET/POST/PUT/DELETE /api/notifications/delivery-rules
**GET**：`{ items:[{ id, templateId, minIntervalMinutes:30, maxDailyPerRecipient:5, quietHoursStart:'21:00', quietHoursEnd:'07:00', fallbackChannel:'sms', rolloutPercent:100 }], total }`
**POST 请求体：** `{ templateId, minIntervalMinutes, maxDailyPerRecipient, quietHoursStart?, quietHoursEnd?, quietHoursSmsAllowed?, fallbackChannel?, recipientRoles?:[], rolloutPercent? }` → **201** `{ id, templateId }`
**PUT /api/notifications/delivery-rules/:id** → **200** `{ id, updatedAt }`
**DELETE /api/notifications/delivery-rules/:id** → **204**
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF, SYSTEM_ADMIN)`
**说明：** F-NEW-002 交付规则（频控/免打扰/备用/灰度）；写审计 `notification_delivery_rule_changed`。

### 16.5 自定义报表生成与定时推送（F-NEW-005）

#### POST /api/reports/definitions
**请求体：** `{ name:'出勤汇总', type:'daily_attendance', dataSource:{from:'attendances', join:'classes', fields:[...]}, filters:[...], sorts:[...], groupBy:[...], aggregations:[...], chartType:'bar', exportFormats:['pdf','excel'] }`
**响应 201：** `{ id, reportNo:'RPT-20260813-0001', name, status:'draft', createdAt }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF)`

#### GET /api/reports/definitions
**查询参数：** `type?`、`keyword?`、`status?`、`page=1&pageSize=20`
**响应 200：** `{ items:[{ id, reportNo, name, type, status, ownerId, lastGeneratedAt }], total }`
**鉴权：** `Bearer + any role`（按数据范围过滤）

#### GET /api/reports/definitions/:id
**响应 200：** `{ id, reportNo, name, dataSource, filters, groupBy, aggregations, chartType, sqlTemplate, resultSnapshot, ownerId }`
**鉴权：** `Bearer + any role`（数据范围过滤）

#### PUT /api/reports/definitions/:id
**请求体：** `{ name?, dataSource?, filters?, groupBy?, aggregations?, chartType?, exportFormats?, status? }`
**响应 200：** `{ id, updatedAt }`
**鉴权：** `Bearer + 报表 owner 或 SCHOOL_ADMIN`

#### DELETE /api/reports/definitions/:id
**响应 204**
**鉴权：** 报表 owner 或 `SCHOOL_ADMIN`（软删除）

#### POST /api/reports/definitions/:id/generate
**请求体：** `{ format? , filters_override? }`
**响应 200：** `{ reportId, fileUrl:'https://…/report.pdf', exportedAt, rowCount, sqlTemplate }`
**鉴权：** `Bearer + RolesGuard(SCHOOL_ADMIN, OFFICE_STAFF)`
**说明：** 只读 DSL 白名单执行；写审计 `report_exported`；`resultSnapshot` 更新供一致比对（验收 #3）。

#### POST /api/reports/definitions/:id/schedules
**请求体：** `{ cronExpression:'0 8 * * 1', recurrenceType:'weekly', pushFormat:'pdf', pushChannels:['app_push','email'], includeSummary:true, summaryLocale:'zh-HK', active:true }`
**响应 201：** `{ id, reportId, cronExpression, nextRunAt, active }`
**鉴权：** `Bearer + 报表 owner 或 SCHOOL_ADMIN`
**说明：** DEV 以 `@nestjs/schedule` 注册 cron；每次执行写 `report_deliveries`（验收 #2 连续30天）。

#### GET /api/reports/definitions/:id/schedules
**响应 200：** `{ items:[{ id, cronExpression, recurrenceType, pushFormat, pushChannels, active, lastRunAt, nextRunAt }], total }`

#### PUT /api/reports/schedules/:scheduleId
**请求体：** `{ cronExpression?, pushFormat?, pushChannels?, includeSummary?, active? }`
**响应 200：** `{ id, active, nextRunAt }`

#### DELETE /api/reports/schedules/:scheduleId
**响应 204**（软删除）

#### POST /api/reports/schedules/:scheduleId/run-now
**响应 202：** `{ deliveryId, scheduleId, status:'pending' }`，随即写 `report_deliveries`（`scheduled_at=now`）
**鉴权：** owner 或 `SCHOOL_ADMIN`

#### POST /api/reports/definitions/:id/subscribe
**请求体：** `{ pushChannels?:['app_push','email'], deliveryFormat?:'pdf' }`
**响应 201：** `{ id, reportId, userId, active:true, subscribedAt }`
**鉴权：** `Bearer + any role`（订阅本人）

#### POST /api/reports/subscriptions/:id/unsubscribe
**响应 200：** `{ id, reportId, userId, active:false, unsubscribedAt }`
**鉴权：** 订阅者本人

#### GET /api/reports/:id/deliveries
**查询参数：** `from?&to?`、`page=1&pageSize=20`
**响应 200：** `{ items:[{ id, executionNo, scheduledAt, status:'success', fileUrl, recipientCount, notificationId }], total }`
**鉴权：** `Bearer + 报表 owner / SCHOOL_ADMIN / SYSTEM_ADMIN`

### 16.6 错误码（本模块新增业务语义）

| 错误码 | HTTP | 说明 |
|--------|------|------|
| OCR_TASK_NOT_FOUND | 404 | OCR 任务不存在 |
| OCR_DUPLICATE_SUBMIT | 409 | 同业务源同一 doc_type 已存在进行中任务（幂等）|
| OCR_ENGINE_UNAVAILABLE | 503 | Azure OCR 不可用（降级 Tesseract 或人工录入）|
| OCR_RETRY_LIMIT | 422 | 重试次数达上限（>3）|
| TRL_SOURCE_TARGET_SAME | 422 | 源/目标语言相同无需翻译 |
| TRL_BATCH_LIMIT_EXCEEDED | 422 | 批量超过 50 条 |
| TRL_LLM_UNAVAILABLE | 503 | LLM Provider 不可用（触发 §9.7 回退）|
| LOC_CONFIG_NOT_FOUND | 404 | Locale 配置不存在 |
| LOC_DEFAULT_DELETE_DENIED | 409 | 默认 global 行不可删除 |
| NTF_TEMPLATE_NOT_FOUND | 404 | 通知模板不存在 |
| NTF_VARIABLE_MISSING | 422 | 渲染时变量缺失 |
| NTF_RULE_EXISTS | 409 | 该模板已有关联交付规则（一对一）|
| RPT_DEFINITION_NOT_FOUND | 404 | 报表定义不存在 |
| RPT_SQL_INVALID | 422 | 报表查询 DSL 非法/含非只读操作 |
| RPT_SCHEDULE_CONFLICT | 409 | 同一报表已存在启用中定时配置 |
| RPT_ALREADY_SUBSCRIBED | 409 | 用户已订阅该报表 |
