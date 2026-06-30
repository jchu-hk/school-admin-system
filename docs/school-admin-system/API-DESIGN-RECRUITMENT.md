# API 接口设计文档
## 教师招聘管理模块 (Module 14)
## v1.0.0 | 2026-06-30

---

## 1. 概述

本文档定义教师招聘管理模块的RESTful API接口设计。

**基础路径:** `/api/v1/recruitment`

**认证方式:** Bearer Token (JWT)

**响应格式:** JSON

---

## 2. 通用响应结构

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

---

## 3. 错误码定义

| HTTP Status | 错误码 | 说明 |
|-------------|--------|------|
| 400 | INVALID_REQUEST | 请求参数无效 |
| 401 | UNAUTHORIZED | 未授权 |
| 403 | FORBIDDEN | 无权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

**招聘模块专用错误码:**
| 错误码 | 说明 |
|--------|------|
| POSITION_NOT_FOUND | 职位不存在 |
| POSITION_CLOSED | 职位已关闭 |
| APPLICATION_NOT_FOUND | 申请不存在 |
| APPLICATION_ALREADY_SUBMITTED | 已提交申请 |
| INTERVIEW_CONFLICT | 面试时间冲突 |
| OFFER_EXPIRED | Offer已过期 |
| ONBOARDING_NOT_STARTED | 入职流程未开始 |

---

## 4. API 接口清单

### 4.1 职位管理 (F-RECRUIT-001)

#### 4.1.1 创建职位草稿
```
POST /api/v1/recruitment/positions
```

**请求体:**
```json
{
  "title": "中文科教师",
  "subject": "中文",
  "employment_type": "FULL_TIME",
  "salary_range": {
    "min": 28000,
    "max": 38000,
    "currency": "HKD"
  },
  "location": "香港九龙",
  "requirements": [
    "具香港教育局注册教师资格",
    "本科以上学历，中文相关学科优先",
    "至少3年教学经验"
  ],
  "responsibilities": [
    "教授中一至中六中文科",
    "设计及执行教学计划",
    "参与课程发展工作"
  ],
  "benefits": [
    "公积金",
    "医疗福利",
    "带薪年假"
  ],
  "application_deadline": "2026-08-31"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "DRAFT",
    "created_at": "2026-06-30T07:00:00Z"
  }
}
```

---

#### 4.1.2 更新职位信息
```
PUT /api/v1/recruitment/positions/{position_id}
```

**请求体:** (同创建职位草稿，可部分更新)

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "DRAFT",
    "updated_at": "2026-06-30T08:00:00Z"
  }
}
```

---

#### 4.1.3 发布职位
```
POST /api/v1/recruitment/positions/{position_id}/publish
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PUBLISHED",
    "published_at": "2026-06-30T09:00:00Z"
  }
}
```

---

#### 4.1.4 暂停职位
```
POST /api/v1/recruitment/positions/{position_id}/pause
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PAUSED",
    "paused_at": "2026-06-30T10:00:00Z"
  }
}
```

---

#### 4.1.5 重新发布职位
```
POST /api/v1/recruitment/positions/{position_id}/resume
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PUBLISHED",
    "resumed_at": "2026-06-30T11:00:00Z"
  }
}
```

---

#### 4.1.6 关闭职位
```
POST /api/v1/recruitment/positions/{position_id}/close
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "CLOSED",
    "closed_at": "2026-06-30T12:00:00Z"
  }
}
```

---

#### 4.1.7 获取职位详情
```
GET /api/v1/recruitment/positions/{position_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "中文科教师",
    "subject": "中文",
    "employment_type": "FULL_TIME",
    "salary_range": {
      "min": 28000,
      "max": 38000,
      "currency": "HKD"
    },
    "location": "香港九龙",
    "requirements": [
      "具香港教育局注册教师资格",
      "本科以上学历，中文相关学科优先",
      "至少3年教学经验"
    ],
    "responsibilities": [
      "教授中一至中六中文科",
      "设计及执行教学计划",
      "参与课程发展工作"
    ],
    "benefits": [
      "公积金",
      "医疗福利",
      "带薪年假"
    ],
    "application_deadline": "2026-08-31",
    "status": "PUBLISHED",
    "application_count": 15,
    "created_at": "2026-06-30T07:00:00Z",
    "published_at": "2026-06-30T09:00:00Z"
  }
}
```

---

#### 4.1.8 列出所有职位
```
GET /api/v1/recruitment/positions
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 职位状态 (DRAFT/PUBLISHED/PAUSED/CLOSED) |
| subject | String | 否 | 学科筛选 |
| employment_type | String | 否 | 雇佣类型 |
| page | Integer | 否 | 页码 (默认1) |
| page_size | Integer | 否 | 每页数量 (默认20) |

**响应:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "中文科教师",
        "subject": "中文",
        "employment_type": "FULL_TIME",
        "status": "PUBLISHED",
        "application_deadline": "2026-08-31",
        "application_count": 15,
        "created_at": "2026-06-30T07:00:00Z"
      }
    ]
  }
}
```

---

### 4.2 简历管理 (F-RECRUIT-002)

#### 4.2.1 提交申请
```
POST /api/v1/recruitment/applications
```

**请求体:**
```json
{
  "position_id": "550e8400-e29b-41d4-a716-446655440000",
  "applicant_name": "陳小明",
  "email": "chen@example.com",
  "phone": "+852-9876-5432",
  "cv_file": "<BASE64_ENCODED_FILE>",
  "cv_filename": "resume_陳小明.pdf",
  "cover_letter": "本人有5年中文科教学经验...",
  "education": [
    {
      "degree": "学士",
      "school": "香港中文大学",
      "major": "中文",
      "year": "2015"
    }
  ],
  "experience": [
    {
      "company": "XX中学",
      "position": "中文科教师",
      "duration": "2015-2020",
      "description": "教授中一至中三中文科"
    }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "application_number": "APP-2026-0001",
    "status": "NEW",
    "submitted_at": "2026-06-30T13:00:00Z"
  }
}
```

---

#### 4.2.2 获取申请详情
```
GET /api/v1/recruitment/applications/{application_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "application_number": "APP-2026-0001",
    "applicant_name": "陳小明",
    "email": "chen@example.com",
    "phone": "+852-9876-5432",
    "position": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "中文科教师",
      "subject": "中文"
    },
    "cv_url": "https://storage.example.com/cvs/APP-2026-0001.pdf",
    "cover_letter": "本人有5年中文科教学经验...",
    "education": [
      {
        "degree": "学士",
        "school": "香港中文大学",
        "major": "中文",
        "year": "2015"
      }
    ],
    "experience": [
      {
        "company": "XX中学",
        "position": "中文科教师",
        "duration": "2015-2020",
        "description": "教授中一至中三中文科"
      }
    ],
    "status": "NEW",
    "screening_notes": null,
    "submitted_at": "2026-06-30T13:00:00Z"
  }
}
```

---

#### 4.2.3 列出所有申请
```
GET /api/v1/recruitment/applications
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| position_id | UUID | 否 | 职位ID筛选 |
| status | String | 否 | 申请状态筛选 |
| keyword | String | 否 | 关键词搜索 (姓名/邮箱) |
| page | Integer | 否 | 页码 |
| page_size | Integer | 否 | 每页数量 |

**响应:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "application_number": "APP-2026-0001",
        "applicant_name": "陳小明",
        "email": "chen@example.com",
        "phone": "+852-9876-5432",
        "position": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "title": "中文科教师"
        },
        "status": "NEW",
        "submitted_at": "2026-06-30T13:00:00Z"
      }
    ]
  }
}
```

---

#### 4.2.4 更新申请状态
```
PUT /api/v1/recruitment/applications/{application_id}/status
```

**请求体:**
```json
{
  "status": "SHORTLISTED",
  "screening_notes": "符合所有要求，推荐面试"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "SHORTLISTED",
    "updated_at": "2026-06-30T14:00:00Z"
  }
}
```

---

#### 4.2.5 拒绝申请
```
POST /api/v1/recruitment/applications/{application_id}/reject
```

**请求体:**
```json
{
  "rejection_reason": "经验不足"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "REJECTED",
    "rejected_at": "2026-06-30T15:00:00Z"
  }
}
```

---

### 4.3 面试管理 (F-RECRUIT-003)

#### 4.3.1 创建面试安排
```
POST /api/v1/recruitment/interviews
```

**请求体:**
```json
{
  "application_id": "660e8400-e29b-41d4-a716-446655440001",
  "interview_date": "2026-07-15T14:00:00Z",
  "duration_minutes": 60,
  "interview_type": "ONSITE",
  "interviewers": [
    "770e8400-e29b-41d4-a716-446655440002",
    "770e8400-e29b-41d4-a716-446655440003"
  ],
  "location": "校务处会议室",
  "notes": "准备试讲环节"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "status": "SCHEDULED",
    "created_at": "2026-06-30T16:00:00Z"
  }
}
```

---

#### 4.3.2 获取面试详情
```
GET /api/v1/recruitment/interviews/{interview_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "application": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "applicant_name": "陳小明",
      "position_title": "中文科教师"
    },
    "interview_date": "2026-07-15T14:00:00Z",
    "duration_minutes": 60,
    "interview_type": "ONSITE",
    "interviewers": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "李老师"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440003",
        "name": "张老师"
      }
    ],
    "location": "校务处会议室",
    "meeting_link": null,
    "notes": "准备试讲环节",
    "status": "SCHEDULED",
    "scores": [],
    "created_at": "2026-06-30T16:00:00Z"
  }
}
```

---

#### 4.3.3 更新面试安排
```
PUT /api/v1/recruitment/interviews/{interview_id}
```

**请求体:**
```json
{
  "interview_date": "2026-07-16T15:00:00Z",
  "duration_minutes": 90,
  "notes": "更新: 增加试讲时间"
}
```

---

#### 4.3.4 取消面试
```
POST /api/v1/recruitment/interviews/{interview_id}/cancel
```

**请求体:**
```json
{
  "cancellation_reason": "申请人要求改期"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "status": "CANCELLED",
    "cancelled_at": "2026-06-30T17:00:00Z"
  }
}
```

---

#### 4.3.5 提交面试评分
```
POST /api/v1/recruitment/interviews/{interview_id}/scores
```

**请求体:**
```json
{
  "interviewer_id": "770e8400-e29b-41d4-a716-446655440002",
  "scores": [
    {
      "criterion": "教学能力",
      "score": 4,
      "comment": "教学思路清晰"
    },
    {
      "criterion": "沟通表达",
      "score": 5,
      "comment": "表达流利，逻辑清晰"
    },
    {
      "criterion": "专业素养",
      "score": 4,
      "comment": "学科知识扎实"
    }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "interview_id": "880e8400-e29b-41d4-a716-446655440000",
    "submitted_at": "2026-06-30T18:00:00Z"
  }
}
```

---

#### 4.3.6 完成面试
```
POST /api/v1/recruitment/interviews/{interview_id}/complete
```

**请求体:**
```json
{
  "overall_recommendation": "RECOMMEND",
  "final_notes": "推荐录用"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "completed_at": "2026-06-30T19:00:00Z"
  }
}
```

---

#### 4.3.7 列出所有面试
```
GET /api/v1/recruitment/interviews
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| application_id | UUID | 否 | 申请ID筛选 |
| status | String | 否 | 面试状态筛选 |
| start_date | Date | 否 | 开始日期 |
| end_date | Date | 否 | 结束日期 |
| page | Integer | 否 | 页码 |
| page_size | Integer | 否 | 每页数量 |

**响应:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "applicant_name": "陳小明",
        "position_title": "中文科教师",
        "interview_date": "2026-07-15T14:00:00Z",
        "interview_type": "ONSITE",
        "location": "校务处会议室",
        "status": "SCHEDULED"
      }
    ]
  }
}
```

---

### 4.4 录用管理 (F-RECRUIT-004)

#### 4.4.1 创建Offer
```
POST /api/v1/recruitment/offers
```

**请求体:**
```json
{
  "application_id": "660e8400-e29b-41d4-a716-446655440001",
  "salary": 35000,
  "start_date": "2026-09-01",
  "position": "中文科教师",
  "benefits_package": {
    "mpf": true,
    "medical": true,
    "annual_leave": 14
  },
  "valid_until": "2026-07-31"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "offer_number": "OFF-2026-0001",
    "status": "PENDING",
    "created_at": "2026-06-30T20:00:00Z"
  }
}
```

---

#### 4.4.2 发送Offer
```
POST /api/v1/recruitment/offers/{offer_id}/send
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "sent_at": "2026-06-30T21:00:00Z"
  }
}
```

---

#### 4.4.3 获取Offer详情
```
GET /api/v1/recruitment/offers/{offer_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "offer_number": "OFF-2026-0001",
    "application": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "applicant_name": "陳小明",
      "email": "chen@example.com"
    },
    "salary": 35000,
    "start_date": "2026-09-01",
    "position": "中文科教师",
    "benefits_package": {
      "mpf": true,
      "medical": true,
      "annual_leave": 14
    },
    "valid_until": "2026-07-31",
    "status": "PENDING",
    "sent_at": "2026-06-30T21:00:00Z",
    "created_at": "2026-06-30T20:00:00Z"
  }
}
```

---

#### 4.4.4 接受Offer (外部接口)
```
POST /api/v1/recruitment/offers/{offer_id}/accept
```

**请求体:**
```json
{
  "acceptance_token": "token_from_email_link",
  "signature": "<BASE64_SIGNATURE>"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "status": "ACCEPTED",
    "responded_at": "2026-07-05T10:00:00Z"
  }
}
```

---

#### 4.4.5 拒绝Offer (外部接口)
```
POST /api/v1/recruitment/offers/{offer_id}/decline
```

**请求体:**
```json
{
  "acceptance_token": "token_from_email_link",
  "decline_reason": "已有其他offer"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "status": "DECLINED",
    "responded_at": "2026-07-05T11:00:00Z"
  }
}
```

---

#### 4.4.6 确认签约
```
POST /api/v1/recruitment/offers/{offer_id}/confirm-signing
```

**请求体:**
```json
{
  "signed_contract_url": "https://storage.example.com/contracts/OFF-2026-0001-signed.pdf"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "status": "SIGNED",
    "signed_at": "2026-07-10T14:00:00Z"
  }
}
```

---

#### 4.4.7 列出所有Offer
```
GET /api/v1/recruitment/offers
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| application_id | UUID | 否 | 申请ID筛选 |
| status | String | 否 | Offer状态筛选 |
| page | Integer | 否 | 页码 |
| page_size | Integer | 否 | 每页数量 |

---

### 4.5 入职管理 (F-RECRUIT-005)

#### 4.5.1 创建入职清单
```
POST /api/v1/recruitment/onboarding
```

**请求体:**
```json
{
  "offer_id": "990e8400-e29b-41d4-a716-446655440000",
  "start_date": "2026-09-01",
  "tasks": [
    {
      "item": "收集个人资料",
      "required": true,
      "description": "身份证、学历证明、履历"
    },
    {
      "item": "开设系统账户",
      "required": true,
      "description": "创建教师系统账户"
    },
    {
      "item": "分配权限",
      "required": true,
      "description": "分配教师权限"
    },
    {
      "item": "安排入职培训",
      "required": false,
      "description": "新教师入职培训"
    }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "a00e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "created_at": "2026-07-10T15:00:00Z"
  }
}
```

---

#### 4.5.2 更新入职任务状态
```
PUT /api/v1/recruitment/onboarding/{onboarding_id}/tasks/{task_id}
```

**请求体:**
```json
{
  "status": "COMPLETED",
  "document_url": "https://storage.example.com/documents/ID_CARD.pdf",
  "completed_at": "2026-08-15T10:00:00Z"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "task_id": "task-001",
    "status": "COMPLETED",
    "updated_at": "2026-08-15T10:00:00Z"
  }
}
```

---

#### 4.5.3 获取入职详情
```
GET /api/v1/recruitment/onboarding/{onboarding_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "a00e8400-e29b-41d4-a716-446655440000",
    "offer": {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "applicant_name": "陳小明",
      "position": "中文科教师"
    },
    "start_date": "2026-09-01",
    "status": "IN_PROGRESS",
    "progress": {
      "total_tasks": 4,
      "completed_tasks": 2,
      "percentage": 50
    },
    "tasks": [
      {
        "id": "task-001",
        "item": "收集个人资料",
        "required": true,
        "status": "COMPLETED",
        "document_url": "https://storage.example.com/documents/ID_CARD.pdf",
        "completed_at": "2026-08-15T10:00:00Z"
      },
      {
        "id": "task-002",
        "item": "开设系统账户",
        "required": true,
        "status": "COMPLETED",
        "document_url": null,
        "completed_at": "2026-08-16T09:00:00Z"
      },
      {
        "id": "task-003",
        "item": "分配权限",
        "required": true,
        "status": "PENDING",
        "document_url": null,
        "completed_at": null
      },
      {
        "id": "task-004",
        "item": "安排入职培训",
        "required": false,
        "status": "PENDING",
        "document_url": null,
        "completed_at": null
      }
    ],
    "teacher_profile_id": "b00e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-07-10T15:00:00Z",
    "updated_at": "2026-08-16T09:00:00Z"
  }
}
```

---

#### 4.5.4 完成入职
```
POST /api/v1/recruitment/onboarding/{onboarding_id}/complete
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "a00e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "completed_at": "2026-09-01T09:00:00Z"
  }
}
```

---

#### 4.5.5 列出所有入职流程
```
GET /api/v1/recruitment/onboarding
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| offer_id | UUID | 否 | Offer ID筛选 |
| status | String | 否 | 入职状态筛选 |
| start_date | Date | 否 | 开始日期 |
| page | Integer | 否 | 页码 |
| page_size | Integer | 否 | 每页数量 |

---

## 5. 权限要求

| 功能 | 角色权限 |
|------|----------|
| 创建/编辑/发布职位 | school_director, school_staff |
| 暂停/关闭职位 | school_director |
| 查看所有申请 | school_director, school_staff |
| 更新申请状态 | school_director, school_staff |
| 创建/更新面试 | school_director, school_staff |
| 提交面试评分 | teacher, school_director, school_staff |
| 创建/发送Offer | school_director |
| 查看Offer详情 | school_director, school_staff |
| 创建入职清单 | school_director, school_staff |
| 更新入职任务 | school_director, school_staff |

---

## 6. 数据验证规则

### 职位创建
- title: 必填, 2-100字符
- subject: 必填, 必须存在于预设学科列表
- employment_type: 必填, 必须为 FULL_TIME/PART_TIME/CONTRACT
- salary_range: 必填, min必须小于等于max
- application_deadline: 必填, 必须晚于当前日期

### 申请提交
- applicant_name: 必填, 2-100字符
- email: 必填, 有效邮箱格式
- phone: 必填, 有效电话格式
- cv_file: 必填, 文件大小<10MB, 格式为PDF/DOC/DOCX
- position_id: 必填, 必须存在且状态为PUBLISHED

### 面试安排
- interview_date: 必填, 必须为未来时间
- duration_minutes: 必填, 30-180分钟
- interviewers: 必填, 至少1人

### Offer创建
- salary: 必填, 必须为正数
- start_date: 必填, 必须为未来日期
- valid_until: 必填, 必须晚于当前日期

---

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-06-30 | 初始版本，定义招聘模块所有API接口 |