# 📡 出勤移动端扫码API设计

**日期**: 2026-06-18
**版本**: v1.0
**功能**: 出勤学生证二维码扫码签到

---

## 1. API列表

### 1.1 获取教师负责班级

```http
GET /api/attendance/mobile/classes
```

**请求头**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "classId": "cls-1a-2026",
      "className": "1A",
      "grade": "一年级",
      "studentCount": 38,
      "todayCheckedIn": 28
    },
    {
      "classId": "cls-1b-2026",
      "className": "1B",
      "grade": "一年级",
      "studentCount": 36,
      "todayCheckedIn": 30
    }
  ]
}
```

**错误码**:
- 401: 未授权
- 403: 无权限

---

### 1.2 获取班级学生列表

```http
GET /api/attendance/mobile/class/:classId/students?date=2026-06-18
```

**路径参数**:
- classId: 班级ID

**查询参数**:
- date: 日期 (可选，默认今天)

**响应**:
```json
{
  "success": true,
  "data": {
    "classId": "cls-1a-2026",
    "className": "1A",
    "date": "2026-06-18",
    "students": [
      {
        "studentId": "stu-001",
        "studentName": "陳小明",
        "classNumber": "01",
        "qrcode": "STUDENT:stu-001:陳小明",
        "status": "present",
        "checkInTime": "07:58:32",
        "checkedIn": true
      },
      {
        "studentId": "stu-002",
        "studentName": "李小红",
        "classNumber": "02",
        "qrcode": "STUDENT:stu-002:李小红",
        "status": null,
        "checkInTime": null,
        "checkedIn": false
      }
    ]
  }
}
```

---

### 1.3 扫码签到

```http
POST /api/attendance/mobile/scan
```

**请求体**:
```json
{
  "qrcode": "STUDENT:stu-001:陳小明",
  "classId": "cls-1a-2026",
  "attendanceDate": "2026-06-18",
  "status": "present",
  "checkInTime": "07:58:32",
  "deviceId": "mobile-teacher-001"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "studentId": "stu-001",
    "studentName": "陳小明",
    "status": "present",
    "checkInTime": "07:58:32",
    "message": "签到成功"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QRCODE",
    "message": "无效的二维码"
  }
}
```

**错误码**:
- INVALID_QRCODE: 二维码格式错误
- STUDENT_NOT_FOUND: 学生不存在
- ALREADY_CHECKED_IN: 已签到
- INVALID_CLASS: 班级不匹配

---

### 1.4 批量提交签到

```http
POST /api/attendance/mobile/batch
```

**请求体**:
```json
{
  "classId": "cls-1a-2026",
  "attendanceDate": "2026-06-18",
  "records": [
    {
      "studentId": "stu-001",
      "status": "present",
      "checkInTime": "07:58:32"
    },
    {
      "studentId": "stu-002",
      "status": "late",
      "checkInTime": "08:05:15"
    }
  ],
  "syncSource": "MOBILE_SCAN"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "batchId": "batch-uuid-001",
    "count": 38,
    "successCount": 36,
    "failCount": 2,
    "failures": [
      {
        "studentId": "stu-xxx",
        "reason": "已存在记录"
      }
    ]
  }
}
```

---

### 1.5 生成学生证二维码

```http
POST /api/attendance/qrcode/generate
```

**请求体**:
```json
{
  "studentId": "stu-001"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "studentId": "stu-001",
    "studentName": "陳小明",
    "qrcode": "STUDENT:stu-001:陳小明",
    "imageUrl": "/qrcode/stu-001.png"
  }
}
```

---

### 1.6 批量生成班级二维码

```http
POST /api/attendance/qrcode/batch-generate
```

**请求体**:
```json
{
  "classId": "cls-1a-2026"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "classId": "cls-1a-2026",
    "count": 38,
    "downloadUrl": "/downloads/qrcodes/cls-1a-2026.zip",
    "expiresAt": "2026-06-18T12:00:00Z"
  }
}
```

---

## 2. 二维码格式

### 2.1 格式定义

```
STUDENT:{studentId}:{studentName}
```

**示例**:
```
STUDENT:stu-001:陳小明
```

### 2.2 二维码图片

- 类型: PNG
- 尺寸: 300x300px
- 容错级别: M (15%)
- 编码: UTF-8

---

## 3. 安全考虑

### 3.1 权限控制
- 仅教师可扫码
- 仅本班学生可签到
- 防止跨班级签到

### 3.2 防作弊
- 二维码绑定学生ID
- 二维码不可伪造
- 签到时间戳记录

### 3.3 数据验证
- 二维码格式验证
- 学生存在性验证
- 班级匹配验证

---

## 4. 错误处理

### 4.1 错误码表

| 错误码 | 描述 | 处理建议 |
|--------|------|---------|
| INVALID_QRCODE | 二维码格式错误 | 提示重新扫描 |
| STUDENT_NOT_FOUND | 学生不存在 | 提示学生信息异常 |
| ALREADY_CHECKED_IN | 已签到 | 提示已签到，可修改状态 |
| INVALID_CLASS | 班级不匹配 | 提示班级错误 |
| NETWORK_ERROR | 网络错误 | 提示离线缓存 |

---

*API设计 - 出勤移动端扫码*
