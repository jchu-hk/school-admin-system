# 成绩发布管理设计文档
## Grade Publication Management Design
## Issue #45 | F-NEW-05

---

## 📋 文档版本信息

| 字段 | 内容 |
|------|------|
| 文档名称 | 成绩发布管理设计文档 |
| 文档编号 | DESIGN-GRADE-PUB-001 |
| 当前版本 | **v1.0.0** |
| 创建日期 | 2026-06-27 |
| 关联Issue | #45 |
| 设计者 | ARCH Agent |

---

## 1. 功能概述

### 1.1 功能目标

管理成绩单的生成、审批和发布流程，支持：
- 教师录入成绩 → 教研组长审核 → 教务处发布 → 家长/学生查看
- PDF成绩单生成与导出
- 发布权限精细化控制
- 发布通知推送

### 1.2 业务流程

```
教师录入成绩 (DRAFT)
    ↓
教师提交审批 (PENDING_APPROVAL)
    ↓
教研组长审核 (Level 1 Approval)
    ↓ 审批通过
教务处审批 (Level 2 Approval)
    ↓ 审批通过
教务处创建发布请求 (PUBLISH_REQUEST)
    ↓
教务处发布 (PUBLISHED)
    ↓
家长/学生查看成绩单
```

### 1.3 关键角色与权限

| 角色 | 权限 | 操作范围 |
|------|------|---------|
| 教师 (teacher) | 录入、提交、撤回 | 自己创建的成绩记录 |
| 教研组长 (head_teacher) | 审核、拒绝 | 本学科的成绩记录 |
| 教务处 (school_staff) | 发布审批、发布、撤回发布 | 全校成绩记录 |
| 校务主任 (school_director) | 全流程管理、发布权限配置 | 全校成绩记录 |
| 家长 (parent) | 查看 | 自己孩子的成绩单 |
| 学生 (student) | 查看 | 自己的成绩单 |

---

## 2. 成绩发布流程设计

### 2.1 流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         成绩发布完整流程                                  │
└─────────────────────────────────────────────────────────────────────────┘

阶段1: 成绩录入与审批
─────────────────────────────────────────────────────────────
┌─────────────┐
│  教师录入    │  status = DRAFT
│  成绩记录    │  approvalLevel = 0
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  教师提交    │  status = PENDING_APPROVAL
│  审批请求    │  canRevokeUntil = now + 48h
└──────┬──────┘
       │
       ▼
┌─────────────┐
│教研组长审核  │  approvalLevel = 1
│ (Level 1)   │  approvedBy = head_teacher_id
└──────┬──────┘
       │ approve
       │
       ▼ reject ──────────────► status = REJECTED
┌─────────────┐                     教师修改后重新提交
│教务处审批    │  approvalLevel = 2
│ (Level 2)   │  status = APPROVED
└──────┬──────┘
       │ approve (status = APPROVED)
       │
       │ reject ───────────────► status = REJECTED
       ▼


阶段2: 成绩发布管理
─────────────────────────────────────────────────────────────
┌─────────────┐
│教务处创建    │  grade_publish_requests
│ 发布请求     │  status = PENDING
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 校务主任    │  grade_publish_approvals
│ 发布审批     │  status = APPROVED
└──────┬──────┘
       │ approve
       │
       ▼ reject ──────────────► status = REJECTED
┌─────────────┐                     重新创建发布请求
│教务处执行    │  grade_records.status
│ 成绩发布     │    = PUBLISHED
└──────┬──────┘  published_at = now
       │
       ▼
┌─────────────┐
│ 系统推送    │  微信/App通知家长
│ 发布通知     │  短信备用
└──────┬──────┘
       │
       ▼


阶段3: 家长/学生查看
─────────────────────────────────────────────────────────────
┌─────────────┐
│ 家长登录    │  查看自己孩子的成绩单
│ 微信门户    │  PDF下载（带水印）
└─────────────┘

┌─────────────┐
│ 学生登录    │  查看自己的成绩单
│ 学生App     │  PDF下载（带水印）
└─────────────┘
```

### 2.2 状态流转图

#### GradeRecord 状态（已有）

```
DRAFT ──► PENDING_APPROVAL ──► APPROVED ──► PUBLISHED
   │           │                  │            │
   │           │                  │            │
   │         REVOKE              REJECTED      UNPUBLISH
   │         (48h内)                          (撤回发布)
   │           │                               │
   └─────► DRAFT◄──────────────────────────────┘
```

#### GradePublishRequest 状态（新增）

```
PENDING ──► APPROVED ──► PUBLISHED
    │          │            │
    │          │            │
 REJECTED    CANCELLED    UNPUBLISHED
```

### 2.3 关键时间节点

| 节点 | 时间限制 | 说明 |
|------|----------|------|
| 教师撤回审批 | 48小时 | 提交后48小时内可撤回 |
| 发布撤回 | 7天 | 发布后7天内可撤回（需校务主任审批）|
| 家长查看 | 发布即时 | 发布后家长可立即查看 |
| PDF有效期 | 无限 | PDF可永久下载（带水印）|

---

## 3. 数据表结构设计

### 3.1 grade_publish_requests（成绩发布请求）

**用途：** 记录成绩发布请求，管理发布审批流程

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| batch_id | UUID | | 批次ID（批量发布时使用）|
| grade_record_ids | JSONB | NOT NULL | 成绩记录ID数组 |
| academic_year | VARCHAR(9) | NOT NULL | 学年 |
| term | VARCHAR(10) | NOT NULL | 学期 |
| exam_name | VARCHAR(100) | NOT NULL | 考试名称 |
| class_ids | JSONB | DEFAULT [] | 班级ID数组（批量发布）|
| grade_levels | JSONB | DEFAULT [] | 年级数组（批量发布）|
| request_type | ENUM | NOT NULL | `single` / `batch` / `grade_level` |
| status | ENUM | NOT NULL | `pending` / `approved` / `rejected` / `published` / `cancelled` / `unpublished` |
| requester_id | UUID | FK→users, NOT NULL | 请求人（教务处）|
| requested_at | TIMESTAMPTZ | NOT NULL | 请求时间 |
| publish_scope | ENUM | NOT NULL | `all_students` / `selected_classes` / `selected_students` |
| selected_student_ids | JSONB | DEFAULT [] | 选定学生ID（选定学生发布时）|
| notify_channels | JSONB | DEFAULT ['wechat', 'app'] | 通知渠道数组 |
| scheduled_publish_at | TIMESTAMPTZ | | 定时发布时间 |
| published_at | TIMESTAMPTZ | | 实际发布时间 |
| unpublished_at | TIMESTAMPTZ | | 撤回发布时间 |
| unpublished_by | UUID | FK→users | 撤回发布人 |
| unpublished_reason | TEXT | | 撤回原因 |
| metadata | JSONB | DEFAULT {} | 扩展属性 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — request_type_enum:**
```
single      — 单条成绩发布
batch       — 批量班级发布
grade_level — 按年级发布
```

**枚举 — publish_request_status_enum:**
```
pending     — 待审批
approved    — 已审批
rejected    — 已拒绝
published   — 已发布
cancelled   — 已取消
unpublished — 已撤回发布
```

**枚举 — publish_scope_enum:**
```
all_students       — 全校学生
selected_classes   — 选定班级
selected_students  — 选定学生
```

**索引:**
- PRIMARY KEY (id)
- INDEX (academic_year, term)
- INDEX (requester_id)
- INDEX (status)

**外键:**
- (requester_id) → users(id)
- (unpublished_by) → users(id)

---

### 3.2 grade_publish_approvals（发布审批记录）

**用途：** 记录发布审批流程，支持多级审批和审计

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| publish_request_id | UUID | FK→grade_publish_requests, NOT NULL | 发布请求 |
| approver_id | UUID | FK→users, NOT NULL | 审批人 |
| approval_level | INTEGER | NOT NULL | 审批级别（1=教务处主任，2=校务主任）|
| action | ENUM | NOT NULL | `approve` / `reject` / `cancel` |
| comment | TEXT | | 审批意见 |
| previous_status | VARCHAR(20) | | 审批前状态 |
| new_status | VARCHAR(20) | | 审批后状态 |
| approved_at | TIMESTAMPTZ | NOT NULL | 审批时间 |
| ip_address | VARCHAR(50) | | IP地址 |
| user_agent | TEXT | | User Agent |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — publish_approval_action_enum:**
```
approve  — 批准
reject   — 拒绝
cancel   — 取消
```

**索引:**
- PRIMARY KEY (id)
- INDEX (publish_request_id)
- INDEX (approver_id)
- INDEX (approval_level)

**外键:**
- (publish_request_id) → grade_publish_requests(id)
- (approver_id) → users(id)

---

### 3.3 grade_publish_notifications（发布通知记录）

**用途：** 记录发布通知推送状态，支持追踪和重试

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| publish_request_id | UUID | FK→grade_publish_requests | 发布请求 |
| grade_record_id | UUID | FK→grade_records | 成绩记录 |
| student_id | UUID | FK→users | 学生 |
| parent_id | UUID | FK→users | 家长 |
| channel | ENUM | NOT NULL | `wechat` / `app` / `sms` / `email` |
| status | ENUM | NOT NULL | `pending` / `sent` / `delivered` / `read` / `failed` |
| sent_at | TIMESTAMPTZ | | 发送时间 |
| delivered_at | TIMESTAMPTZ | | 到达时间 |
| read_at | TIMESTAMPTZ | | 已读时间 |
| error_message | TEXT | | 错误信息 |
| retry_count | INTEGER | DEFAULT 0 | 重试次数 |
| message_id | VARCHAR(100) | | 第三方消息ID |
| created_at | TIMESTAMPTZ | NOT NULL | |

**枚举 — notification_channel_enum:**
```
wechat  — 微信
app     — App推送
sms     — 短信
email   — 邮件
```

**枚举 — notification_status_enum:**
```
pending   — 待发送
sent      — 已发送
delivered — 已送达
read      — 已读
failed    — 发送失败
```

**索引:**
- PRIMARY KEY (id)
- INDEX (publish_request_id)
- INDEX (student_id)
- INDEX (parent_id)
- INDEX (status)

---

### 3.4 扩展 grade_records 表

**新增字段:**

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| published_at | TIMESTAMPTZ | | 发布时间 |
| published_by | UUID | FK→users | 发布人 |
| publish_request_id | UUID | FK→grade_publish_requests | 发布请求 |
| view_count | INTEGER | DEFAULT 0 | 查看次数 |
| last_viewed_at | TIMESTAMPTZ | | 最后查看时间 |
| pdf_downloaded_at | TIMESTAMPTZ | | PDF下载时间 |
| pdf_download_count | INTEGER | DEFAULT 0 | PDF下载次数 |

---

### 3.5 grade_publish_settings（发布设置配置）

**用途：** 配置发布相关参数，如审批流程、通知模板等

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| school_id | UUID | FK→schools | 学校 |
| setting_key | VARCHAR(50) | NOT NULL | 设置项键 |
| setting_value | JSONB | NOT NULL | 设置项值 |
| description | TEXT | | 说明 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**预设配置项:**

| setting_key | setting_value | 说明 |
|-------------|---------------|------|
| `approval_required` | `true` | 发布是否需要审批 |
| `approval_levels` | `[1, 2]` | 审批级别（教务处主任、校务主任）|
| `revoke_window_days` | `7` | 撤回发布窗口（天）|
| `notify_channels_default` | `["wechat", "app"]` | 默认通知渠道 |
| `notify_template_wechat` | `{template_id: "...", ...}` | 微信通知模板 |
| `watermark_enabled` | `true` | PDF是否添加水印 |
| `watermark_text` | `"仅供家长个人使用"` | 水印文字 |

---

## 4. API 设计

### 4.1 发布请求 API

#### POST /grades/publish/requests
创建发布请求

**请求体:**
```json
{
  "gradeRecordIds": ["uuid-1", "uuid-2", ...],
  "academicYear": "2025-2026",
  "term": "1",
  "examName": "期中考试",
  "requestType": "batch",
  "publishScope": "selected_classes",
  "classIds": ["class-1a", "class-1b"],
  "notifyChannels": ["wechat", "app"],
  "scheduledPublishAt": "2026-06-30T10:00:00+08:00"
}
```

**响应:**
```json
{
  "id": "uuid",
  "status": "pending",
  "gradeRecordIds": [...],
  "requestedAt": "2026-06-27T16:00:00+08:00",
  "message": "发布请求已创建，等待审批"
}
```

---

#### GET /grades/publish/requests
查询发布请求列表

**查询参数:**
- `status` - 状态筛选
- `academicYear` - 学年
- `term` - 学期
- `requesterId` - 请求人
- `page` / `pageSize` - 分页

---

#### GET /grades/publish/requests/:id
获取发布请求详情

---

#### POST /grades/publish/requests/:id/approve
审批发布请求

**请求体:**
```json
{
  "comment": "审批通过，同意发布"
}
```

---

#### POST /grades/publish/requests/:id/reject
拒绝发布请求

**请求体:**
```json
{
  "comment": "成绩数据异常，暂不发布"
}
```

---

#### POST /grades/publish/requests/:id/cancel
取消发布请求

---

#### POST /grades/publish/requests/:id/execute
执行发布（审批通过后）

---

#### POST /grades/publish/requests/:id/unpublish
撤回发布

**请求体:**
```json
{
  "reason": "发现成绩录入错误，需撤回修正"
}
```

---

### 4.2 家长/学生查看 API

#### GET /grades/published/my
家长/学生获取自己/孩子的已发布成绩

**响应:**
```json
{
  "gradeRecords": [
    {
      "id": "uuid",
      "academicYear": "2025-2026",
      "term": "1",
      "examName": "期中考试",
      "overallScore": 85.5,
      "classRank": 12,
      "gradeRank": 45,
      "subjects": [...],
      "conductGrade": "A",
      "attendanceRate": "98%",
      "publishedAt": "2026-06-28T10:00:00+08:00",
      "pdfUrl": "https://.../grade-report-uuid.pdf"
    }
  ]
}
```

---

#### GET /grades/published/:id
获取单条已发布成绩详情

---

#### GET /grades/published/:id/pdf
下载成绩单PDF

**响应:** PDF文件（带水印）

---

### 4.3 发布通知 API

#### GET /grades/publish/notifications
查询通知状态

---

#### POST /grades/publish/notifications/:id/retry
重试发送失败的通知

---

## 5. 权限控制模型

### 5.1 权限矩阵

| 功能 | 教师 | 教研组长 | 教务处 | 校务主任 | 家长 | 学生 |
|------|------|----------|--------|----------|------|------|
| 录入成绩 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 提交审批 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 撤回审批(48h) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 审核成绩(L1) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 审批成绩(L2) | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| 创建发布请求 | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| 审批发布请求 | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 执行发布 | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| 撤回发布 | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 查看已发布成绩 | ❌ | ✅(本学科) | ✅ | ✅ | ✅(自己孩子) | ✅(自己) |
| 下载PDF | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

### 5.2 ABAC 权限规则

#### 教师权限规则
```
Resource: GradeRecord
Action: create, update, delete
Condition:
  - record.teacherId == user.id
  - record.status == DRAFT
```

#### 教研组长权限规则
```
Resource: GradeRecord
Action: approve, reject (Level 1)
Condition:
  - record.status == PENDING_APPROVAL
  - record.approvalLevel == 0
  - user.subjects contains record.subjects
```

#### 教务处权限规则
```
Resource: GradeRecord
Action: approve, reject (Level 2)
Condition:
  - record.status == PENDING_APPROVAL
  - record.approvalLevel == 1

Resource: GradePublishRequest
Action: create, execute
Condition:
  - user.role == school_staff
```

#### 校务主任权限规则
```
Resource: GradePublishRequest
Action: approve, reject, unpublish
Condition:
  - user.role == school_director
```

#### 家长权限规则
```
Resource: GradeRecord
Action: read, download_pdf
Condition:
  - record.status == PUBLISHED
  - user.related_student_id == record.studentId
```

#### 学生权限规则
```
Resource: GradeRecord
Action: read, download_pdf
Condition:
  - record.status == PUBLISHED
  - user.id == record.studentId
```

### 5.3 权限代码定义

| 权限代码 | 名称 | 说明 |
|----------|------|------|
| `F-GRADE-001.create` | 创建成绩记录 | 教师录入成绩 |
| `F-GRADE-001.update` | 更新成绩记录 | 教师修改草稿 |
| `F-GRADE-001.delete` | 删除成绩记录 | 教师删除草稿 |
| `F-GRADE-001.submit` | 提交审批 | 教师提交审批 |
| `F-GRADE-001.revoke` | 撤回审批 | 教师撤回审批(48h) |
| `F-GRADE-001.approve_l1` | 一级审批 | 教研组长审核 |
| `F-GRADE-001.approve_l2` | 二级审批 | 教务处审批 |
| `F-GRADE-002.create_request` | 创建发布请求 | 教务处创建 |
| `F-GRADE-002.approve_request` | 审批发布请求 | 校务主任审批 |
| `F-GRADE-002.execute` | 执行发布 | 教务处执行 |
| `F-GRADE-002.unpublish` | 撤回发布 | 校务主任撤回 |
| `F-GRADE-002.read_published` | 查看已发布成绩 | 家长/学生查看 |
| `F-GRADE-002.download_pdf` | 下载PDF | 家长/学生下载 |

---

## 6. 通知模板设计

### 6.1 微信通知模板

**模板ID:** `grade_published`

**内容:**
```
{{first.DATA}}
考试名称：{{examName.DATA}}
学年学期：{{academicYear.DATA}}
总分：{{overallScore.DATA}}
班级排名：{{classRank.DATA}}
{{remark.DATA}}
```

**示例:**
```
您好，孩子的成绩单已发布
考试名称：期中考试
学年学期：2025-2026学年 第一学期
总分：85.5分
班级排名：第12名
请点击查看详细成绩单
```

### 6.2 App推送模板

**标题:** `成绩单已发布`

**内容:**
```
孩子的期中考试成绩单已发布，总分85.5分，班级排名第12名。点击查看详情。
```

### 6.3 短信备用模板

**内容:**
```
【校务系统】孩子的成绩单已发布，请登录微信门户查看详情。
```

---

## 7. 数据迁移计划

### 7.1 新增表

```sql
-- 创建枚举类型
CREATE TYPE request_type_enum AS ENUM ('single', 'batch', 'grade_level');
CREATE TYPE publish_request_status_enum AS ENUM ('pending', 'approved', 'rejected', 'published', 'cancelled', 'unpublished');
CREATE TYPE publish_scope_enum AS ENUM ('all_students', 'selected_classes', 'selected_students');
CREATE TYPE publish_approval_action_enum AS ENUM ('approve', 'reject', 'cancel');
CREATE TYPE notification_channel_enum AS ENUM ('wechat', 'app', 'sms', 'email');
CREATE TYPE notification_status_enum AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- 创建 grade_publish_requests 表
CREATE TABLE grade_publish_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID,
  grade_record_ids JSONB NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  term VARCHAR(10) NOT NULL,
  exam_name VARCHAR(100) NOT NULL,
  class_ids JSONB DEFAULT '[]',
  grade_levels JSONB DEFAULT '[]',
  request_type request_type_enum NOT NULL,
  status publish_request_status_enum NOT NULL DEFAULT 'pending',
  requester_id UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  publish_scope publish_scope_enum NOT NULL DEFAULT 'all_students',
  selected_student_ids JSONB DEFAULT '[]',
  notify_channels JSONB DEFAULT '["wechat", "app"]',
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,
  unpublished_by UUID REFERENCES users(id),
  unpublished_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_publish_requests_academic_year ON grade_publish_requests(academic_year, term);
CREATE INDEX idx_publish_requests_requester ON grade_publish_requests(requester_id);
CREATE INDEX idx_publish_requests_status ON grade_publish_requests(status);

-- 创建 grade_publish_approvals 表
CREATE TABLE grade_publish_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_request_id UUID NOT NULL REFERENCES grade_publish_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  approval_level INTEGER NOT NULL,
  action publish_approval_action_enum NOT NULL,
  comment TEXT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_publish_approvals_request ON grade_publish_approvals(publish_request_id);
CREATE INDEX idx_publish_approvals_approver ON grade_publish_approvals(approver_id);
CREATE INDEX idx_publish_approvals_level ON grade_publish_approvals(approval_level);

-- 创建 grade_publish_notifications 表
CREATE TABLE grade_publish_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_request_id UUID REFERENCES grade_publish_requests(id) ON DELETE SET NULL,
  grade_record_id UUID REFERENCES grade_records(id) ON DELETE SET NULL,
  student_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES users(id),
  channel notification_channel_enum NOT NULL,
  status notification_status_enum NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  message_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_notifications_request ON grade_publish_notifications(publish_request_id);
CREATE INDEX idx_notifications_student ON grade_publish_notifications(student_id);
CREATE INDEX idx_notifications_parent ON grade_publish_notifications(parent_id);
CREATE INDEX idx_notifications_status ON grade_publish_notifications(status);

-- 创建 grade_publish_settings 表
CREATE TABLE grade_publish_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  setting_key VARCHAR(50) NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, setting_key)
);

-- 扩展 grade_records 表
ALTER TABLE grade_records
  ADD COLUMN published_at TIMESTAMPTZ,
  ADD COLUMN published_by UUID REFERENCES users(id),
  ADD COLUMN publish_request_id UUID REFERENCES grade_publish_requests(id),
  ADD COLUMN view_count INTEGER DEFAULT 0,
  ADD COLUMN last_viewed_at TIMESTAMPTZ,
  ADD COLUMN pdf_downloaded_at TIMESTAMPTZ,
  ADD COLUMN pdf_download_count INTEGER DEFAULT 0;
```

### 7.2 扩展 RecordStatus 枚举

```sql
-- 新增 PUBLISHED 状态
ALTER TYPE record_status_enum ADD VALUE 'published';
```

---

## 8. 验收标准

| # | Given | When | Then |
|---|-------|------|------|
| AC-01 | 教师已录入成绩，status=DRAFT | 教师点击「提交审批」 | status=PENDING_APPROVAL, canRevokeUntil=now+48h |
| AC-02 | 成绩已审批通过，status=APPROVED | 教务处创建发布请求 | grade_publish_requests.status=pending |
| AC-03 | 发布请求待审批 | 校务主任审批通过 | grade_publish_requests.status=approved |
| AC-04 | 发布请求已审批 | 教务处执行发布 | grade_records.status=published, published_at=now |
| AC-05 | 成绩已发布 | 家长登录微信门户 | 家长可查看孩子成绩单，下载PDF |
| AC-06 | 成绩已发布7天内 | 校务主任撤回发布 | grade_records.status=approved, published_at=null |
| AC-07 | 成绩发布后 | 系统推送通知 | 家长收到微信/App通知 |
| AC-08 | 家长下载PDF | PDF包含水印 | 水印文字：「仅供家长个人使用」|

---

## 9. 技术实现要点

### 9.1 批量发布性能优化

- 使用批量操作减少数据库往返
- 分批处理通知推送（每批100条）
- 使用消息队列异步处理通知

### 9.2 PDF生成优化

- 预生成PDF模板
- 批量生成时使用并发处理
- PDF缓存机制

### 9.3 通知推送可靠性

- 失败自动重试（最多3次）
- 状态追踪和监控
- 降级策略（微信失败→短信备用）

### 9.4 权限控制安全

- 所有API强制JWT验证
- ABAC条件动态校验
- 敏感操作审计日志

---

## 10. 附录

### 10.1 相关文档

- `SPEC-COMPLETE.md` - 功能规格书
- `DB-SCHEMA.md` - 数据库架构设计
- `grade-record.entity.ts` - 成绩记录实体
- `grade-review.entity.ts` - 审核历史实体

### 10.2 相关Issue

- #45 - 成绩发布管理（本Issue）
- 相关功能：F-NEW-05

---

**文档状态:** 设计完成，待DEV实现