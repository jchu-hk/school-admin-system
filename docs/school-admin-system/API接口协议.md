# 智能校务助理系统 — API 接口协议

> **文档版本：** v1.0.0
> **对应系统版本：** SPEC-COMPLETE v1.7.0
> **最后更新：** 2026-06-07
> **状态：** 正式版
> **维护人：** 系统架构团队

---

## 目录

1. [概述](#1-概述)
2. [统一错误码规范](#2-统一错误码规范)
3. [全局响应格式](#3-全局响应格式)
4. [鉴权 Header 规范](#4-鉴权-header-规范)
5. [请求超时配置](#5-请求超时配置)
6. [分页规范](#6-分页规范)
7. [文件上传协议](#7-文件上传协议)
8. [模块接口清单](#8-模块接口清单)

---

## 1. 概述

本文档定义智能校务助理系统所有对外 API 的接口协议规范，作为前后端并行开发和第三方系统集成的基础契约。所有接口均遵循本规范，违反规范的实现视为不合格。

### 1.1 基本约定

| 项目 | 规范 |
|------|------|
| API 版本前缀 | `/api/v1/` |
| 字符编码 | UTF-8 |
| 日期格式 | ISO 8601 / RFC 3339（含时区）|
| 时区 | Asia/Hong_Kong (UTC+8) |
| JSON 格式 | application/json |
| 数据类型 | 优先使用 UUID 作为 ID，string 作为外键引用 |
| 多租户 | 所有请求必须携带 X-School-ID Header |

---

## 2. 统一错误码规范

### 2.1 错误码格式

错误码格式：`{模块}-{序号}`，共 2~3 位字母前缀 + 3 位数字序号。

### 2.2 模块前缀映射表

| 模块前缀 | 模块名称 | 英文名 |
|----------|----------|--------|
| `USER` | 用户与权限管理 | User & Access Management |
| `AUTH` | 身份认证 | Authentication |
| `ATT` | 出勤管理 | Attendance |
| `LEAVE` | 请假管理 | Leave Management |
| `INQ` | 家长查询 | Parent Inquiries |
| `LUNCH` | 午膳管理 | Lunch Management |
| `BUS` | 校车管理 | Bus Management |
| `FIN` | 财务管理 | Finance |
| `ENRL` | 入学注册 | Enrollment |
| `EXAM` | 考试管理 | Exam Management |
| `TEXT` | 课本管理 | Textbook Management |
| `ASSET` | 资产管理 | Asset Management |
| `AI` | AI 助理 | AI Assistant |
| `NOTIF` | 通知管理 | Notification |
| `I18N` | 多语言 | Internationalization |
| `OPS` | 运维管理 | Operations |
| `SYS` | 系统通用 | System |

### 2.3 错误级别定义

| 级别 | 标识 | 说明 | 用户感知 |
|------|------|------|----------|
| **FATAL** | F | 致命错误，系统不可用 | 系统告警，需立即介入 |
| **ERROR** | E | 操作失败，数据未损坏 | 显示错误信息，可重试 |
| **WARN** | W | 警告，操作仍可完成 | 显示提示信息 |
| **INFO** | I | 提示信息，不影响操作 | 信息展示 |

### 2.4 HTTP 状态码映射

| HTTP 状态码 | 含义 | 适用场景 |
|-------------|------|----------|
| `200 OK` | 成功 | GET/PATCH 操作成功 |
| `201 Created` | 已创建 | POST 创建资源成功 |
| `204 No Content` | 无内容 | DELETE 操作成功 |
| `400 Bad Request` | 请求参数错误 | 参数校验失败、格式错误 |
| `401 Unauthorized` | 未认证 | 未提供 Token 或 Token 失效 |
| `403 Forbidden` | 无权限 | RBAC/ABAC 权限不足 |
| `404 Not Found` | 资源不存在 | 资源 ID 不存在 |
| `409 Conflict` | 资源冲突 | 重复创建、状态冲突 |
| `422 Unprocessable Entity` | 业务规则不满足 | 违反业务规则 |
| `429 Too Many Requests` | 请求过于频繁 | 触发限流 |
| `500 Internal Server Error` | 服务器内部错误 | 未捕获异常 |
| `503 Service Unavailable` | 服务不可用 | 系统维护中 |
| `504 Gateway Timeout` | 网关超时 | 上游服务超时 |

### 2.5 各模块错误码详细定义

#### USER — 用户与权限管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `USER-001` | 使用者不存在 | ERROR | 404 |
| `USER-002` | 帳戶已被停用，請聯絡校務處 | ERROR | 403 |
| `USER-003` | 帳戶已過期，請聯絡校務處 | ERROR | 403 |
| `USER-004` | 使用者類型不符合要求 | ERROR | 400 |
| `USER-005` | 同一身份證號碼已存在 | ERROR | 409 |
| `USER-006` | 無效的學校 ID | ERROR | 400 |
| `USER-007` | 學生與家長的關聯不存在 | ERROR | 404 |
| `USER-008` | 無法綁定多於 5 名子女 | WARN | 422 |
| `USER-009` | 家長密碼未設置，請先設定 | WARN | 422 |
| `USER-010` | 密碼複雜度不足（需包含大小階字母、數字及特殊字符）| ERROR | 400 |
| `USER-011` | 密碼已使用過，不可與最近 5 個密碼相同 | ERROR | 400 |
| `USER-012` | 密碼已過期，請先更改密碼 | ERROR | 403 |
| `USER-013` | 同一手機號碼已存在 | ERROR | 409 |
| `USER-014` | 同一電子郵件已存在 | ERROR | 409 |
| `USER-015` | 會話已過期，請重新登入 | ERROR | 401 |
| `USER-016` | 會話數量已達上限（最多 3 個並發會話）| WARN | 429 |
| `USER-017` | 異地登入檢測，請確認是否為本人操作 | WARN | 200 |
| `USER-018` | 敏感資料查閱頻率異常，臨時禁用敏感字段訪問 | ERROR | 403 |
| `USER-019` | 角色分配衝突（使用者已有相同角色）| WARN | 409 |
| `USER-020` | 臨時權限已過期 | ERROR | 403 |

#### AUTH — 身份认证

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `AUTH-001` | 認證失敗，請檢查帳號或密碼 | ERROR | 401 |
| `AUTH-002` | 驗證碼無效或已過期，請重新獲取 | ERROR | 401 |
| `AUTH-003` | 驗證碼輸入錯誤超過 3 次，請稍後重試 | ERROR | 429 |
| `AUTH-004` | 帳戶已被鎖定，請於 {minutes} 分鐘後重試 | ERROR | 423 |
| `AUTH-005` | 請先完成多重因素驗證 | ERROR | 403 |
| `AUTH-006` | 無效的刷新 Token | ERROR | 401 |
| `AUTH-007` | Token 格式無效 | ERROR | 401 |
| `AUTH-008` | SSO 認證失敗，請聯絡系統管理員 | ERROR | 502 |
| `AUTH-009` | 飛書 OAuth 授權失敗 | ERROR | 401 |
| `AUTH-010` | 登入失敗次數過多，帳戶已被暫時鎖定 | ERROR | 423 |
| `AUTH-011` | 密碼重置連結已過期（15 分鐘有效期）| ERROR | 410 |
| `AUTH-012` | 密碼重置 Token 無效 | ERROR | 401 |

#### ATT — 出勤管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `ATT-001` | 學生出勤記錄不存在 | ERROR | 404 |
| `ATT-002` | 該學生今日已有出勤記錄，不可重複錄入 | ERROR | 409 |
| `ATT-003` | 數據源同步失敗，請稍後重試 | ERROR | 502 |
| `ATT-004` | 設備離線，受影響學生列表已生成 | WARN | 200 |
| `ATT-005` | 批量撤銷已超過 15 分鐘時限 | ERROR | 422 |
| `ATT-006` | 無權撤銷他人的出勤記錄 | ERROR | 403 |
| `ATT-007` | 學號格式不正確（應為 YYYY+S+NNN 格式）| ERROR | 400 |
| `ATT-008` | 連續缺席天數已達預警閾值，已通知相關人員 | INFO | 200 |
| `ATT-009` | 批量導入記錄數超過上限（每次最多 500 條）| ERROR | 400 |
| `ATT-010` | 無效的出勤狀態 | ERROR | 400 |

#### LEAVE — 请假管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `LEAVE-001` | 請假申請不存在 | ERROR | 404 |
| `LEAVE-002` | 請假狀態不允許此操作 | ERROR | 422 |
| `LEAVE-003` | 請假天數超過允許範圍 | ERROR | 422 |
| `LEAVE-004` | 病假超過 2 天需提交醫療證明 | ERROR | 422 |
| `LEAVE-005` | 事假需提前 24 小時審批 | ERROR | 422 |
| `LEAVE-006` | 已超出本學期請假次數上限 | ERROR | 422 |
| `LEAVE-007` | AI 核驗標記為高風險，需人工覆核 | WARN | 200 |
| `LEAVE-008` | 醫療證明 OCR 識別失敗，請重新上傳 | ERROR | 422 |
| `LEAVE-009` | 請假申請已撤銷，不可重複操作 | ERROR | 409 |
| `LEAVE-010` | 教師撤回已超過 48 小時期限 | ERROR | 422 |
| `LEAVE-011` | 審批人已處理，無法撤回 | ERROR | 409 |

#### INQ — 家长查询

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `INQ-001` | 查詢記錄不存在 | ERROR | 404 |
| `INQ-002` | 查詢狀態不允許回复 | ERROR | 422 |
| `INQ-003` | 回覆内容不得為空 | ERROR | 400 |
| `INQ-004` | 通話記錄時長未填寫（電話渠道必填）| ERROR | 400 |
| `INQ-005` | 查詢已關閉，不可回复 | ERROR | 409 |
| `INQ-006` | AI意圖分類置信度低，已轉人工處理 | INFO | 200 |

#### LUNCH — 午膳管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `LUNCH-001` | 午膳訂單不存在 | ERROR | 404 |
| `LUNCH-002` | 已超過更改截止時間（{time}），請聯絡校務處 | ERROR | 422 |
| `LUNCH-003` | 該班級今日已確認訂單，不可修改 | ERROR | 409 |
| `LUNCH-004` | 供應商不存在 | ERROR | 404 |
| `LUNCH-005` | 訂單總數與明細不符 | ERROR | 400 |

#### BUS — 校车管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `BUS-001` | 校車記錄不存在 | ERROR | 404 |
| `BUS-002` | GPS 數據更新失敗 | ERROR | 502 |
| `BUS-003` | 校車路線不存在 | ERROR | 404 |
| `BUS-004` | 學生未訂閱此校車路線 | ERROR | 422 |
| `BUS-005` | 校車延誤未達通知閾值（<{threshold}分鐘）| INFO | 200 |
| `BUS-006` | 學生登車記錄不存在 | ERROR | 404 |

#### FIN — 财务管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `FIN-001` | 學費記錄不存在 | ERROR | 404 |
| `FIN-002` | 學費已繳清，不可修改 | ERROR | 409 |
| `FIN-003` | 超出單筆交易限額（HK$ {limit}）| ERROR | 422 |
| `FIN-004` | 現金交易需雙人見證 | ERROR | 422 |
| `FIN-005` | 單據缺失，請上傳原始單據 | ERROR | 422 |
| `FIN-006` | 金額差異超過閾值（HK$50），需調查 | WARN | 200 |
| `FIN-007` | 獎學金資格審核未通過 | ERROR | 422 |
| `FIN-008` | 預算類別不存在 | ERROR | 404 |
| `FIN-009` | 預算執行率已達 100%，無法調整 | ERROR | 422 |
| `FIN-010` | 預算調整超出總預算 | ERROR | 422 |
| `FIN-011` | 第三方支付到賬存在延遲，狀態稍後更新 | INFO | 200 |

#### ENRL — 入学注册

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `ENRL-001` | 註冊記錄不存在 | ERROR | 404 |
| `ENRL-002` | 中一自行分配學位階段已截止 | ERROR | 422 |
| `ENRL-003` | 必填文件缺失：{document_name} | ERROR | 422 |
| `ENRL-004` | 身份證明文件驗證失敗 | ERROR | 422 |
| `ENRL-005` | 班級人數已滿，無法分配 | ERROR | 422 |
| `ENRL-006` | 轉學學生到校後 14 天內未完成註冊 | WARN | 200 |

#### EXAM — 考试管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `EXAM-001` | 考試報考記錄不存在 | ERROR | 404 |
| `EXAM-002` | 報考科目數量不符合要求（最少 6 科，最多 8 科）| ERROR | 422 |
| `EXAM-003` | 逾期報名需繳納額外費用（每科 HK$560）| WARN | 200 |
| `EXAM-004` | 特別考試安排審批未通過 | ERROR | 422 |
| `EXAM-005` | 試卷保險箱鑰匙不在指定位置 | FATAL | 500 |
| `EXAM-006` | 成績單審批流程未完成 | ERROR | 422 |
| `EXAM-007` | 成績撤回已超過 48 小時期限 | ERROR | 422 |
| `EXAM-008` | 教師撤回成績後已觸發審計告警 | INFO | 200 |

#### ASSET — 资产管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `ASSET-001` | 資產記錄不存在 | ERROR | 404 |
| `ASSET-002` | 條碼已被其他資產使用 | ERROR | 409 |
| `ASSET-003` | 場地已被預訂 | ERROR | 409 |
| `ASSET-004` | 設備保養到期提醒已觸發 | INFO | 200 |
| `ASSET-005` | 資產盤點結果與系統記錄不符 | WARN | 200 |

#### AI — AI 助理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `AI-001` | AI 意圖分類失敗 | ERROR | 500 |
| `AI-002` | 找不到匹配的 FAQ | INFO | 200 |
| `AI-003` | AI 回覆置信度低，建議人工處理 | WARN | 200 |
| `AI-004` | OCR 識別失敗，請重新上傳清晰的圖片 | ERROR | 422 |
| `AI-005` | LLM 翻譯服務暫時不可用 | ERROR | 503 |
| `AI-006` | Coze API 配額已達上限，核心功能已降級 | WARN | 200 |

#### NOTIF — 通知管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `NOTIF-001` | 通知模板不存在 | ERROR | 404 |
| `NOTIF-002` | 微信消息發送失敗，已切換至短信備用渠道 | WARN | 200 |
| `NOTIF-003` | 通知發送頻率超出限制（每家長每日最多 {count} 條）| ERROR | 429 |
| `NOTIF-004` | 安靜時段（21:00-07:00）暫停推送 | INFO | 200 |
| `NOTIF-005` | 模板變量缺失：{variable_name} | ERROR | 400 |

#### I18N — 多语言

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `I18N-001` | 翻譯鍵不存在 | ERROR | 404 |
| `I18N-002` | 目標語言不支持 | ERROR | 400 |
| `I18N-003` | 翻譯正在審核中，暫不可用 | INFO | 200 |

#### OPS — 运维管理

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `OPS-001` | 數據庫連接池已滿 | FATAL | 503 |
| `OPS-002` | WAL 歸檔積壓嚴重（>{threshold}MB）| ERROR | 200 |
| `OPS-003` | SSL 證書即將到期（{days} 天）| WARN | 200 |
| `OPS-004` | 審計日誌寫入失敗，可能存在記錄丢失 | FATAL | 500 |
| `OPS-005` | WebSAMS Token 已過期 | ERROR | 502 |
| `OPS-006` | Coze API 配額使用率已達 {percent}% | WARN | 200 |
| `OPS-007` | 敏感字段查閱頻率異常 | WARN | 200 |
| `OPS-008` | 備份任務執行失敗 | ERROR | 500 |
| `OPS-009` | 健康檢查發現異常：{component} | ERROR | 200 |

#### SYS — 系统通用

| 错误码 | 错误信息（zh-HK）| 级别 | HTTP |
|--------|-------------------|------|------|
| `SYS-001` | 請求參數校驗失敗 | ERROR | 400 |
| `SYS-002` | 請求體 JSON 格式錯誤 | ERROR | 400 |
| `SYS-003` | 必填參數缺失：{field_name} | ERROR | 400 |
| `SYS-004` | 請求頻率超出限制，請稍後重試 | ERROR | 429 |
| `SYS-005` | 學校 ID 與 Token 不匹配 | ERROR | 403 |
| `SYS-006` | 功能模組已停用，請聯絡管理員 | ERROR | 503 |
| `SYS-007` | 數據格式不正確：{field_name} | ERROR | 400 |
| `SYS-008` | 業務邏輯校驗失敗：{reason} | ERROR | 422 |

---

## 3. 全局响应格式

### 3.1 成功响应格式

**标准成功响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-06-07T08:30:00.000+08:00"
}
```

**创建资源成功响应（HTTP 201）：**
```json
{
  "code": 0,
  "message": "created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-06-07T08:30:00.000+08:00"
  },
  "timestamp": "2026-06-07T08:30:00.000+08:00"
}
```

### 3.2 错误响应格式

**标准错误响应：**
```json
{
  "code": "ATT-002",
  "message": "該學生今日已有出勤記錄，不可重複錄入",
  "details": {
    "field": "student_id",
    "value": "2023S10123",
    "date": "2026-06-07"
  },
  "timestamp": "2026-06-07T08:30:00.000+08:00",
  "request_id": "req-550e8400-e29b-41d4-a716-446655440000",
  "trace_id": "trace-abc123"
}
```

**字段级校验错误响应（HTTP 400）：**
```json
{
  "code": "SYS-001",
  "message": "請求參數校驗失敗",
  "details": {
    "errors": [
      {
        "field": "phone",
        "message": "電話號碼格式不正確",
        "value": "12345",
        "code": "INVALID_FORMAT"
      }
    ]
  },
  "timestamp": "2026-06-07T08:30:00.000+08:00",
  "request_id": "req-550e8400-e29b-41d4-a716-446655440000"
}
```

**业务规则错误响应（HTTP 422）：**
```json
{
  "code": "LEAVE-004",
  "message": "病假超過 2 天需提交醫療證明",
  "details": {
    "leave_days": 3,
    "document_required": true,
    "current_documents": []
  },
  "timestamp": "2026-06-07T08:30:00.000+08:00",
  "request_id": "req-550e8400-e29b-41d4-a716-446655440000"
}
```

### 3.3 分页响应格式

**标准分页响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 1200,
      "page": 1,
      "pageSize": 20,
      "totalPages": 60,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2026-06-07T08:30:00.000+08:00"
}
```

### 3.4 文件响应格式

- Header: `Content-Type: application/octet-stream`
- Header: `Content-Disposition: attachment; filename="report_20260607.pdf"`
- Body: 文件二进制流

---

## 4. 鉴权 Header 规范

### 4.1 必填 Header

| Header 名称 | 必填 | 格式 | 说明 |
|------------|------|------|------|
| `Authorization` | 是 | `Bearer {JWT}` | JWT Access Token |
| `X-School-ID` | 是 | UUID | 学校唯一标识 |
| `X-Request-ID` | 是 | UUID v4 | 请求唯一追踪 ID |
| `Content-Type` | 是 | `application/json` | 请求内容类型（POST/PUT/PATCH）|

### 4.2 选填 Header

| Header 名称 | 必填 | 格式 | 说明 |
|------------|------|------|------|
| `X-Timezone` | 建议 | `Asia/Hong_Kong` | 请求方时区 |
| `X-User-Locale` | 建议 | `zh-HK` / `zh-CN` / `en` | 用户界面语言偏好 |
| `Accept-Language` | 建议 | `zh-HK, zh-CN, en` | HTTP 标准 Accept-Language |
| `X-Idempotency-Key` | 条件 | UUID v4 | 幂等性 Key（创建类操作建议）|
| `User-Agent` | 自动 | 字符串 | 客户端标识 |

### 4.3 JWT Token 结构

**Payload 示例：**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "school_id": "school-uuid",
  "role": "OFFICER",
  "type": "SCHOOL_ADMIN",
  "iat": 1750000000,
  "exp": 1750003600
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `sub` | UUID | 用户 ID |
| `school_id` | UUID | 学校 ID |
| `role` | string | 当前角色 |
| `type` | string | 用户类型 |
| `iat` | number | 签发时间（Unix 时间戳）|
| `exp` | number | 过期时间（30分钟）|

---

## 5. 请求超时配置

| 操作类型 | 超时时间 | 适用场景 |
|----------|---------|----------|
| **普通 API** | 5 秒 | 标准 CRUD 操作、查询接口 |
| **文件上传** | 30 秒 | 图片、文档上传 |
| **批量操作** | 60 秒 | 批量导入、批量导出 |
| **第三方接口同步** | 30 秒 | WebSAMS、eClass API 调用 |
| **AI 推理** | 10 秒 | Coze/OpenAI LLM 调用 |
| **OCR 识别** | 15 秒 | 文档 OCR 识别 |

---

## 6. 分页规范

| 参数名 | 必填 | 类型 | 默认值 | 最大值 | 说明 |
|--------|------|------|--------|--------|------|
| `page` | 否 | integer | 1 | — | 页码（从 1 开始）|
| `pageSize` | 否 | integer | 20 | 100 | 每页数量 |
| `offset` | 否 | integer | 0 | — | 偏移量（OFFSET 模式）|
| `limit` | 否 | integer | 20 | 100 | 每页数量（OFFSET 模式）|
| `sortBy` | 否 | string | — | — | 排序字段 |
| `sortOrder` | 否 | string | desc | — | `asc` / `desc` |

> `page` 和 `offset` 两种模式不可混用。优先使用 `page` 模式。

---

## 7. 文件上传协议

### 7.1 上传端点

| 方法 | 路径 | Content-Type | 说明 |
|------|------|-------------|------|
| `POST` | `/api/v1/files/upload` | `multipart/form-data` | 通用文件上传 |
| `POST` | `/api/v1/files/avatar` | `multipart/form-data` | 头像上传 |
| `POST` | `/api/v1/files/attachment` | `multipart/form-data` | 请假证明/文档附件 |

### 7.2 文件大小限制

| 文件类型 | 最大大小 | 适用场景 |
|----------|---------|----------|
| 图片（jpg, png, gif, webp）| **5 MB** | 头像、学生照片、证明文件 |
| 文档（pdf, doc, docx, xls, xlsx）| **20 MB** | 医生证明、同意书、收据 |
| 视频（mp4, mov, avi）| **100 MB** | 教学视频（仅管理员）|
| 压缩包（zip, rar）| **50 MB** | 批量数据导入 |

### 7.3 格式白名单

| 类型 | 允许格式 |
|------|----------|
| 图片 | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| 文档 | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| 视频 | `video/mp4`, `video/quicktime`, `video/x-msvideo` |
| 压缩包 | `application/zip`, `application/x-rar-compressed` |

---

## 8. 模块接口清单

> 所有接口前缀：`/api/v1/`。权限列中角色缩写：SA=校务主任，OFF=校务处同工，T=教师，P=家长，ST=学生，SYS=系统管理员。

### 8.1 模块 1：每日晨检仪表板（Daily Operations）

#### F-DASH-001 — 仪表板主视图

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/dashboard` | 获取仪表板主视图（当日汇总数据）| SA, OFF |
| `GET` | `/dashboard/custom-config` | 获取用户仪表板自定义配置 | 全部 |
| `PUT` | `/dashboard/custom-config` | 保存用户仪表板自定义配置 | 全部 |

#### F-ATT-001 — 学生出勤概览

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/attendance/overview` | 获取全校出勤概览（按日期/班级）| SA, OFF |
| `GET` | `/attendance/classes/{classId}/date/{date}` | 获取指定班级指定日期出勤明细 | SA, OFF, T |
| `POST` | `/attendance/manual` | 手动录入出勤记录（批量）| SA, OFF |
| `POST` | `/attendance/batch-revoke` | 批量撤销出勤记录（15分钟内）| SA, OFF |
| `GET` | `/attendance/sync-status` | 获取多数据源同步状态 | SA, OFF |
| `GET` | `/attendance/affected-students` | 获取数据源故障受影响学生列表 | SA, OFF |
| `GET` | `/attendance/anomalies` | 获取出勤异常检测列表 | SA, OFF |

#### F-ATT-002 — 迟到/早退记录

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/attendance/late-early` | 获取迟到/早退记录列表 | SA, OFF, T |
| `GET` | `/attendance/late-early/{id}` | 获取迟到/早退记录详情 | SA, OFF, T |
| `POST` | `/attendance/late-early` | 登记迟到/早退记录 | SA, OFF |

#### F-INQ-001 — 家长查询队列管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/inquiries` | 获取家长查询列表 | SA, OFF |
| `GET` | `/inquiries/{id}` | 获取查询详情 | SA, OFF, P |
| `POST` | `/inquiries` | 提交家长查询 | P |
| `POST` | `/inquiries/{id}/reply` | 回复家长查询 | SA, OFF, T |
| `POST` | `/inquiries/{id}/ai-analyze` | AI分析查询意图 | SA, OFF |

#### F-INQ-002 — 快速回复模板

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/inquiries/templates` | 获取快速回复模板列表 | SA, OFF |
| `POST` | `/inquiries/templates` | 创建快速回复模板 | SA |
| `PUT` | `/inquiries/templates/{id}` | 更新快速回复模板 | SA |
| `DELETE` | `/inquiries/templates/{id}` | 删除快速回复模板 | SA |

#### F-LUNCH-001 — 午膳订单汇总

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/lunch/orders` | 获取午膳订单列表 | SA, OFF |
| `GET` | `/lunch/orders/{id}` | 获取午膳订单详情 | SA, OFF |
| `POST` | `/lunch/orders` | 创建/确认午膳订单 | SA, OFF |
| `PUT` | `/lunch/orders/{id}` | 更新午膳订单（截止时间前）| SA, OFF |
| `POST` | `/lunch/orders/{id}/change` | 家长自助提交午膳变更申请 | P |
| `GET` | `/lunch/vendors` | 获取供餐商列表 | SA, OFF |

#### F-BUS-001 — 校车实时追踪

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/bus/tracking` | 获取校车实时追踪列表 | SA, OFF, P |
| `GET` | `/bus/tracking/{busId}` | 获取指定校车实时位置详情 | SA, OFF, P |
| `GET` | `/bus/routes` | 获取校车路线列表 | SA, OFF |
| `GET` | `/bus/routes/{id}/students` | 获取校车乘搭学生名单 | SA, OFF |
| `POST` | `/bus/routes/{id}/notify` | 一键通知全部乘搭学生家长 | SA, OFF |
| `PUT` | `/bus/routes/{id}` | 手动更新校车路线 | SA, OFF |

#### F-BUS-002 — 校车点大名记录

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/bus/checkin` | 登记学生上/下车记录（刷卡）| 系统/设备 |
| `GET` | `/bus/checkin/{studentId}` | 获取学生登车记录 | SA, OFF |

#### F-LEAVE-001 — 请假申请处理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/leaves` | 创建请假申请 | P, OFF, SA |
| `GET` | `/leaves` | 获取请假申请列表 | SA, OFF, T, P |
| `GET` | `/leaves/pending` | 获取待处理请假申请 | SA, OFF, T |
| `GET` | `/leaves/ai-review-queue` | 获取AI核验队列 | SA |
| `POST` | `/leaves/{id}/ai-review/confirm` | 确认AI核验通过 | SA |
| `GET` | `/leaves/{id}` | 获取请假申请详情 | SA, OFF, T, P |
| `POST` | `/leaves/{id}/class-teacher-approve` | 班主任审批通过 | SA, OFF, T |
| `POST` | `/leaves/{id}/director-approve` | 校务主任审批通过（超3天）| SA |
| `POST` | `/leaves/{id}/reject` | 拒绝请假申请 | SA, OFF, T |
| `PATCH` | `/leaves/{id}/cancel` | 取消请假申请（家长）| P |
| `POST` | `/leaves/{id}/check-in` | 销假（学生返校）| SA, OFF, T |
| `PATCH` | `/leaves/{id-leaves/{id}/check-in` | 销假（学生返校）| SA, OFF, T |
| `PATCH` | `/leaves/{id}/follow-up` | 设置跟进提醒 | SA, OFF |
| `GET` | `/leaves/statistics` | 获取请假统计 | SA, OFF |

#### F-FEE-001 — 每日收费追踪

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/fees/daily-collection` | 获取每日收费汇总 | SA, OFF |
| `GET` | `/fees/daily-collection/{id}` | 获取收费记录详情 | SA, OFF |
| `POST` | `/fees/daily-collection` | 登记每日收费 | SA, OFF |
| `POST` | `/fees/daily-collection/{id}/close` | 关闭每日收费（对账）| SA, OFF |
| `POST` | `/fees/daily-collection/witness` | 双人见证确认 | SA, OFF |

### 8.2 模块 2：周期性校务管理（Cyclical Operations）

#### F-ENRL-001 — 新生注册管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/enrollments` | 创建入学注册记录 | SA, OFF |
| `GET` | `/enrollments` | 获取注册记录列表 | SA, OFF |
| `GET` | `/enrollments/{id}` | 获取注册记录详情 | SA, OFF |
| `PUT` | `/enrollments/{id}` | 更新注册记录 | SA, OFF |
| `POST` | `/enrollments/{id}/documents` | 上传注册文件 | P, SA, OFF |
| `POST` | `/enrollments/{id}/verify-document` | 核对注册文件 | SA, OFF |
| `POST` | `/enrollments/{id}/assign-class` | 分配班级 | SA |

#### F-ENRL-002 — AI辅助编班

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/allocations/ai-allocate` | 发起AI编班 | SA |
| `GET` | `/allocations` | 获取编班方案列表 | SA |
| `GET` | `/allocations/{id}` | 获取编班方案详情 | SA |
| `PUT` | `/allocations/{id}/approve` | 审批编班方案 | SA |
| `POST` | `/allocations/{id}/adjust` | 手动调整编班 | SA |

#### F-ENRL-003 — 课本分发管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/textbooks` | 获取课本目录 | SA, OFF |
| `POST` | `/textbooks` | 添加课本记录 | SA |
| `POST` | `/textbooks/distribution` | 创建分发记录 | SA, OFF |
| `GET` | `/textbooks/distributions` | 获取分发记录列表 | SA, OFF |
| `PUT` | `/textbooks/distributions/{id}` | 更新分发记录（确认分发/退换）| SA, OFF |
| `POST` | `/textbooks/distributions/batch` | 批量创建分发记录 | SA, OFF |
| `GET` | `/textbooks/distributions/report` | 生成每日分发汇总报表 | SA, OFF |

#### F-EXAM-001 — DSE报考管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/exams/dse/register` | 创建DSE报考记录 | SA, OFF |
| `GET` | `/exams/dse/registrations` | 获取DSE报考列表 | SA, OFF |
| `GET` | `/exams/dse/registrations/{id}` | 获取DSE报考详情 | SA, OFF |
| `PUT` | `/exams/dse/registrations/{id}` | 更新报考信息 | SA, OFF |
| `POST` | `/exams/dse/registrations/{id}/submit` | 提交至HKEAA | SA |

#### F-EXAM-002 — 试卷管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/exams/papers` | 获取试卷列表 | SA, OFF |
| `POST` | `/exams/papers` | 创建试卷记录 | SA |
| `POST` | `/exams/papers/{id}/print-order` | 生成印刷订单 | SA, OFF |
| `PUT` | `/exams/papers/{id}/status` | 更新试卷状态 | SA |
| `POST` | `/exams/papers/{id}/seal` | 密封试卷 | SA |
| `POST` | `/exams/papers/{id}/distribute` | 分发试卷（考试日）| SA |
| `POST` | `/exams/papers/{id}/recover` | 回收试卷 | SA |
| `POST` | `/exams/papers/{id}/destroy` | 销毁试卷 | SA |

#### F-EXAM-003 — 特别考试安排

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/exams/special-arrangements` | 获取特别安排列表 | SA, OFF |
| `POST` | `/exams/special-arrangements` | 申请特别考试安排 | SA |
| `PUT` | `/exams/special-arrangements/{id}` | 更新特别安排 | SA |

#### F-EXAM-004 — 成绩单生成与发布

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/reports/generate` | 生成成绩单批次 | SA |
| `GET` | `/reports` | 获取成绩单列表 | SA, OFF, T |
| `GET` | `/reports/{id}` | 获取成绩单详情 | SA, OFF, T |
| `POST` | `/reports/{id}/submit` | 教师提交成绩 | T |
| `POST` | `/reports/{id}/withdraw` | 教师撤回成绩（48小时内）| T |
| `POST` | `/reports/{id}/approve` | 审批通过成绩单 | SA |
| `POST` | `/reports/{id}/publish` | 发布成绩单 | SA |
| `GET` | `/reports/{id}/export-pdf` | 导出成绩单PDF | P, SA, OFF |
| `GET` | `/reports/class-distribution` | 获取班级成绩分布图 | T |

#### F-ADM-001 — 中一自行分配学位

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/admission/ssdsa` | 获取SSDS申请列表 | SA, OFF |
| `POST` | `/admission/ssdsa` | 提交SSDS申请 | SA |
| `PUT` | `/admission/ssdsa/{id}/score` | 评分 | SA |
| `POST` | `/admission/ssdsa/{id}/interview` | 记录面试成绩 | SA |
| `PUT` | `/admission/ssdsa/{id}/result` | 公布结果 | SA |

#### F-ADM-002 — JUPAS联招管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/admission/jupas` | 获取JUPAS申请列表 | SA, OFF |
| `POST` | `/admission/jupas/{id}/reference-letter` | 填写推荐信 | T |
| `POST` | `/admission/jupas/{id}/school-reference` | 生成学校推荐信 | SA |
| `PUT` | `/admission/jupas/{id}/status` | 更新申请状态 | SA |

#### F-YREND-001 — 档案清理与销毁

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/records/retention` | 获取档案保留状态列表 | SA |
| `POST` | `/records/retention/{id}/destroy` | 申请销毁档案 | SA |
| `POST` | `/records/retention/{id}/destroy/approve` | 审批销毁申请 | SA |

#### F-YREND-002 — 学年财务结算

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/finance/year-end-reconciliation` | 获取学年结算报告 | SA |
| `POST` | `/finance/year-end-reconciliation/generate` | 生成学年结算报告 | SA |
| `GET` | `/finance/year-end-reconciliation/{id}` | 获取结算详情 | SA |

### 8.3 模块 3：财务及资产管理（Finance & Assets）

#### F-FIN-001 — 学费管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/finance/tuition` | 获取学费评定列表 | SA, OFF |
| `GET` | `/finance/tuition/{id}` | 获取学费评定详情 | SA, OFF |
| `POST` | `/finance/tuition/{id}/assess` | 评定学费 | SA, OFF |
| `PUT` | `/finance/tuition/{id}/items/{itemId}` | 更新学费项目状态 | SA, OFF |
| `POST` | `/finance/tuition/{id}/payment` | 登记学费缴纳 | SA, OFF |

#### F-FIN-002 — 零用现金报销

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/finance/petty-cash` | 获取零用现金交易列表 | SA, OFF |
| `POST` | `/finance/petty-cash` | 创建报销/收款记录 | SA, OFF |
| `GET` | `/finance/petty-cash/{id}` | 获取交易详情 | SA, OFF |
| `PUT` | `/finance/petty-cash/{id}/authorize` | 双人见证授权 | SA, OFF |
| `POST` | `/finance/petty-cash/{id}/receipt` | 上传收据（OCR识别）| SA, OFF |

#### F-FIN-003 — 奖学金与津贴申请

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/finance/scholarships` | 获取奖学金/津贴列表 | SA, OFF |
| `POST` | `/finance/scholarships/apply` | 提交申请 | P, SA, OFF |
| `PUT` | `/finance/scholarships/{id}/approve` | 审批申请 | SA |

#### F-ASSET-001 — 校产条码盘点

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/assets` | 获取资产列表 | SA, OFF |
| `POST` | `/assets` | 创建资产记录 | SA |
| `POST` | `/assets/barcode/scan` | 扫描条码（盘点）| SA, OFF |
| `POST` | `/assets/inventory-session` | 创建盘点任务 | SA |
| `GET` | `/assets/inventory-session/{id}` | 获取盘点结果 | SA |
| `PUT` | `/assets/inventory-session/{id}/resolve` | 处理盘点差异 | SA |

#### F-ASSET-002 — 场地租借管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/assets/venues` | 获取场地列表 | SA, OFF, P |
| `POST` | `/assets/venues/bookings` | 创建租借预约 | P, SA, OFF |
| `GET` | `/assets/venues/bookings` | 获取预约列表 | SA, OFF |
| `PUT` | `/assets/venues/bookings/{id}` | 更新预约状态 | SA |

#### F-ASSET-003 — 设备保养管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/assets/maintenance` | 获取保养记录列表 | SA, OFF |
| `POST` | `/assets/maintenance` | 创建保养记录 | SA, OFF |
| `PUT` | `/assets/maintenance/{id}` | 更新保养记录 | SA |

#### F-VEND-001 — 供应商注册与评估

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/vendors` | 获取供应商列表 | SA, OFF |
| `POST` | `/vendors` | 注册供应商 | SA |
| `PUT` | `/vendors/{id}` | 更新供应商信息 | SA |
| `POST` | `/vendors/{id}/evaluate` | 评估供应商 | SA, OFF |

### 8.4 模块 4：用户与权限管理（User & Access Management）

#### F-USER-001 — 用户生命周期管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/users` | 创建用户 | SYS, SA |
| `GET` | `/users` | 获取用户列表 | SA, OFF, T, P |
| `GET` | `/users/{id}` | 获取用户详情 | SA, OFF, T, P |
| `PUT` | `/users/{id}` | 更新用户信息 | SYS, SA |
| `DELETE` | `/users/{id}` | 删除用户（软删除）| SYS, SA |
| `PATCH` | `/users/{id}/restore` | 恢复已删除用户 | SYS, SA |
| `PATCH` | `/users/{id}/toggle-status` | 启用/禁用用户 | SYS, SA |
| `PATCH` | `/users/{id}/reset-password` | 重置密码 | SYS, SA |
| `GET` | `/users/profile/me` | 获取当前用户信息 | 全部 |

#### F-USER-002 — 身份认证

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/auth/login` | 账号密码登录 | 公开 |
| `POST` | `/auth/otp/send` | 发送OTP验证码 | 公开 |
| `POST` | `/auth/otp/verify` | 验证OTP | 公开 |
| `POST` | `/auth/sso/callback` | SSO回调 | 公开 |
| `POST` | `/auth/feishu/callback` | 飞书OAuth回调 | 公开 |
| `POST` | `/auth/refresh` | 刷新Access Token | 公开 |
| `POST` | `/auth/logout` | 登出 | 全部 |
| `GET` | `/auth/sessions` | 获取活跃会话列表 | 全部 |
| `DELETE` | `/auth/sessions/{sessionId}` | 终止指定会话 | 全部 |
| `DELETE` | `/auth/sessions` | 终止所有会话 | 全部 |

#### F-USER-003 — 功能授权（RBAC + ABAC）

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/auth/authorize` | 权限检查（实时）| 全部 |
| `GET` | `/roles` | 获取角色列表 | SA, SYS |
| `POST` | `/roles` | 创建角色 | SYS |
| `PUT` | `/roles/{id}` | 更新角色权限 | SYS |
| `GET` | `/roles/{id}/permissions` | 获取角色权限列表 | SA |
| `POST` | `/roles/assign` | 分配角色给用户 | SA |
| `POST` | `/privilege-escalation` | 申请临时权限提升 | SA, OFF |
| `GET` | `/privilege-escalation` | 获取权限提升申请列表 | SA |

#### F-USER-004 — 会话与Token管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/sessions` | 获取用户会话列表 | 全部 |
| `DELETE` | `/sessions/{sessionId}` | 终止指定会话 | 全部 |
| `DELETE` | `/sessions` | 终止所有会话 | 全部 |

#### F-USER-005 — 审计日志

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/audit-logs` | 查询审计日志 | SA, SYS |
| `GET` | `/audit-logs/{id}` | 获取审计日志详情 | SA, SYS |

#### F-USER-006 — 密码与凭证重置

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/auth/password/reset-request` | 请求密码重置 | 公开 |
| `POST` | `/auth/password/reset/confirm` | 确认密码重置 | 公开 |
| `POST` | `/auth/parent-password/reset-request` | 请求家长密码重置 | 公开 |
| `POST` | `/auth/parent-password/reset/confirm` | 确认家长密码重置 | 公开 |
| `PUT` | `/users/me/password` | 修改当前用户密码 | 全部 |

#### F-USER-007 — 权限变更审批流程

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/privilege-approval` | 提交权限变更申请 | SA, OFF |
| `GET` | `/privilege-approval` | 获取权限变更申请列表 | SA |
| `POST` | `/privilege-approval/{id}/approve` | 审批通过 | SA |
| `POST` | `/privilege-approval/{id}/reject` | 审批拒绝 | SA |

### 8.5 模块 5：整合及合规（Integration & Compliance）

#### F-INT-001 — WebSAMS数据同步

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/integration/websams/sync` | 触发WebSAMS数据同步 | SYS |
| `GET` | `/integration/websams/sync-status` | 获取同步状态 | SA, SYS |
| `GET` | `/integration/websams/logs` | 获取同步日志 | SYS |

#### F-INT-002 — eClass系统集成

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/integration/eclass/attendance` | 获取eClass出勤数据 | SA, OFF |
| `POST` | `/integration/eclass/attendance/sync` | 同步eClass出勤 | SA, OFF |

#### F-COMP-001 — 隐私条例合规检查

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/compliance/pdpo-check` | PDPO合规检查 | 系统 |
| `GET` | `/compliance/consent-records` | 获取同意书记录 | SA, SYS |

#### F-COMP-002 — 双人见证流程

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/compliance/witness/initiate` | 发起双人见证 | SA, OFF |
| `POST` | `/compliance/witness/{id}/sign` | 第二见证人签字 | SA, OFF |
| `GET` | `/compliance/witness/pending` | 获取待见证列表 | SA, OFF |

#### F-COMP-003 — 审计日志管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/compliance/audit-export` | 导出审计日志 | SA, SYS |

#### F-BACK-001 — 自动备份管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/backup/status` | 获取备份状态 | SYS |
| `POST` | `/backup/trigger` | 手动触发备份 | SYS |
| `GET` | `/backup/history` | 获取备份历史 | SYS |

### 8.6 模块 6：AI助理及自动化（AI Assistant）

#### F-AI-001 — 自然语言查询理解（NLU）

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/ai/nlu` | 自然语言查询分析 | 全部 |
| `GET` | `/ai/intents` | 获取意图分类列表 | SYS |

#### F-AI-002 — FAQ智能匹配

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ai/faq/match` | 匹配FAQ | 全部 |
| `GET` | `/ai/faq` | 获取FAQ列表 | SA, OFF |
| `POST` | `/ai/faq` | 创建FAQ | SA |
| `PUT` | `/ai/faq/{id}` | 更新FAQ | SA |
| `DELETE` | `/ai/faq/{id}` | 删除FAQ | SA |

#### F-AUTO-001 — 周期性任务触发器

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/automation/tasks` | 获取任务列表 | SYS |
| `PUT` | `/automation/tasks/{id}` | 更新任务配置 | SYS |
| `POST` | `/automation/tasks/{id}/trigger` | 手动触发任务 | SYS |

#### F-AUTO-002 — 智能提醒系统

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/reminders` | 获取提醒列表 | 全部 |
| `POST` | `/reminders` | 创建提醒 | 全部 |
| `PUT` | `/reminders/{id}` | 更新提醒 | 全部 |
| `DELETE` | `/reminders/{id}` | 删除提醒 | 全部 |
| `POST` | `/reminders/{id}/complete` | 标记提醒完成 | 全部 |

#### F-AI-003 — OCR文档识别

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/ai/ocr/recognize` | 识别文档 | SA, OFF, P |

### 8.7 模块 7：多语言支持（Internationalization）

#### F-I18N-001 — 多语言框架与翻译管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/i18n/translations` | 获取翻译资源（全部语言）| 全部 |
| `GET` | `/i18n/translations/{locale}` | 获取指定语言翻译 | 全部 |
| `POST` | `/i18n/translations` | 提交新翻译 | SA |
| `PUT` | `/i18n/translations/{id}/approve` | 审核翻译 | SA |
| `GET` | `/i18n/glossary` | 获取术语表 | 全部 |
| `GET` | `/i18n/keys` | 获取翻译键列表 | SA |
| `GET` | `/i18n/keys/missing` | 获取缺失翻译的键 | SA |

#### F-I18N-002 — 语言检测与自动切换

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/i18n/detect` | 检测用户语言偏好 | 公开 |
| `PUT` | `/i18n/preferences` | 保存语言偏好 | 全部 |

#### F-I18N-003 — 实时内容翻译（LLM）

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/i18n/translate` | 实时翻译 | 全部 |
| `POST` | `/i18n/translate/batch` | 批量翻译 | 全部 |

#### F-I18N-004 — 区域化与格式本地化

无独立 API，作为中间件自动应用。

### 8.8 模块 8：运维自动化与监控体系（Operations）

#### F-OPS-001 — 数据库健康检查与WAL积压自动处理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/db-health` | 获取数据库健康状态 | SYS |
| `GET` | `/ops/db-health/report` | 获取健康检查JSON报告 | SYS |
| `POST` | `/ops/db-health/wal-recover` | 手动触发WAL恢复 | SYS |

#### F-OPS-002 — SSL证书到期自动续期

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/ssl/certificates` | 获取证书状态列表 | SYS |
| `POST` | `/ops/ssl/renew` | 手动触发证书续期 | SYS |

#### F-OPS-003 — WebSAMS Token自动刷新

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/websams/token-status` | 获取Token状态 | SYS |
| `POST` | `/ops/websams/token-refresh` | 手动刷新Token | SYS |

#### F-OPS-004 — 一键灾难恢复脚本

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/ops/dr/execute` | 执行一键灾难恢复 | SYS, SA |
| `GET` | `/ops/dr/status` | 获取恢复状态 | SYS, SA |
| `GET` | `/ops/dr/history` | 获取恢复历史 | SYS |

#### F-OPS-005 — 审计日志写入完整性监控

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/audit/health` | 获取审计日志写入健康状态 | SYS |
| `GET` | `/ops/audit/health/report` | 获取完整性监控报告 | SYS |

#### F-OPS-006 — Coze API配额实时监控

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/coze/quota` | 获取Coze API配额状态 | SYS |
| `GET` | `/ops/coze/rate-limit` | 获取限流状态 | SYS |

#### F-OPS-007 — 敏感字段查看频率告警

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/sensitive-field/monitor` | 获取敏感字段访问监控报告 | SYS, SA |
| `GET` | `/ops/sensitive-field/alerts` | 获取告警列表 | SYS |

#### F-OPS-008 — 数据库DDL操作审计

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/ops/ddl-audit/logs` | 获取DDL审计日志 | SYS, SA |
| `GET` | `/ops/ddl-audit/alert-rules` | 获取DDL告警规则 | SYS |

### 8.9 模块 9 & 10 & 11：新增功能（New Functions）

#### F-NEW-001 — 一键灾难恢复与业务连续性

（见 F-OPS-004）

#### F-NEW-002 — 多渠道通知模板管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/notifications/templates` | 获取通知模板列表 | SA |
| `POST` | `/notifications/templates` | 创建通知模板 | SA |
| `PUT` | `/notifications/templates/{id}` | 更新通知模板 | SA |
| `POST` | `/notifications/send` | 发送通知 | SA, OFF, SYS |

#### F-NEW-003 — DSE放榜成绩追踪

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `POST` | `/dse/results/import` | 导入DSE成绩 | SA |
| `GET` | `/dse/results` | 获取DSE成绩列表 | SA, OFF |
| `GET` | `/dse/results/statistics` | 获取DSE成绩统计 | SA, OFF |
| `GET` | `/dse/jupas-tracking` | 获取JUPAS追踪列表 | SA |
| `PUT` | `/dse/jupas-tracking/{id}` | 更新JUPAS状态 | SA |

#### F-NEW-004 — 年度预算编制与执行追踪

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/finance/budget` | 获取年度预算列表 | SA |
| `POST` | `/finance/budget` | 创建年度预算 | SA |
| `GET` | `/finance/budget/{id}` | 获取预算详情 | SA |
| `PUT` | `/finance/budget/{id}/adjust` | 预算调整 | SA |
| `GET` | `/finance/budget/{id}/execution` | 获取预算执行追踪 | SA |
| `GET` | `/finance/budget/{id}/report` | 获取预算执行报告 | SA |

#### F-NEW-005 — 自定义报表生成与定时推送

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/reports/custom` | 获取自定义报表列表 | SA, OFF |
| `POST` | `/reports/custom` | 创建自定义报表 | SA, OFF |
| `PUT` | `/reports/custom/{id}` | 更新自定义报表 | SA, OFF |
| `POST` | `/reports/custom/{id}/generate` | 生成报表数据 | SA, OFF |
| `GET` | `/reports/custom/{id}/export` | 导出报表（PDF/Excel）| SA, OFF |
| `GET` | `/reports/schedules` | 获取定时推送配置 | SA |
| `POST` | `/reports/schedules` | 创建定时推送 | SA |
| `PUT` | `/reports/schedules/{id}` | 更新定时推送 | SA |

#### F-NEW-006 — 系统健康检查与自动诊断

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| `GET` | `/health` | 系统健康状态检查 | 公开 |
| `GET` | `/health/detailed` | 详细健康诊断报告 | SYS, SA |
| `GET` | `/health/components` | 各组件健康状态 | SYS |

### 8.10 健康检查端点（公开，无需认证）

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/health` | 系统健康状态（Liveness Probe）|
| `GET` | `/health/ready` | 就绪检查（Readiness Probe）|
