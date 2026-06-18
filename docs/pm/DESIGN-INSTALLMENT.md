# 📋 学费分期付款功能设计

**Issue**: #98
**日期**: 2026-06-18
**状态**: 设计阶段

---

## 1. 需求分析

### 1.1 问题描述
- 学费分期付款功能缺失
- 缺少 sub_status 字段 (installment_plan/overdue/disputed)
- 影响家长缴费体验和欠费管理

### 1.2 现有状态
```
pending (待缴费)
paid (已缴清)
partial (部分缴费)
overdue (逾期)
waived (已豁免)
```

### 1.3 新增状态
```
sub_status:
- installment_plan (分期付款中)
- overdue (逾期)
- disputed (争议中)
- paid (已缴清) - 已存在
```

---

## 2. 数据库设计

### 2.1 新增字段

```sql
-- 新增 sub_status 枚举类型
CREATE TYPE tuition_payments_sub_status_enum AS ENUM (
  'installment_plan',
  'overdue', 
  'disputed',
  'paid'
);

-- 新增 installment_plan 表
CREATE TABLE installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tuition_payment_id UUID NOT NULL REFERENCES tuition_payments(id),
  total_amount DECIMAL(10,2) NOT NULL,
  installment_count INTEGER NOT NULL DEFAULT 1,
  installment_amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 新增 installment_schedule 表
CREATE TABLE installment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES installment_plans(id),
  sequence INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- tuition_payments 表新增字段
ALTER TABLE tuition_payments ADD COLUMN sub_status VARCHAR(50);
ALTER TABLE tuition_payments ADD COLUMN installment_plan_id UUID REFERENCES installment_plans(id);
```

### 2.2 子状态说明

| sub_status | 说明 | 触发条件 |
|------------|------|---------|
| installment_plan | 分期付款中 | 申请分期付款并通过 |
| overdue | 逾期 | 分期或正常缴费逾期 |
| disputed | 争议中 | 家长提出争议 |
| paid | 已缴清 | 缴清所有欠款 |

---

## 3. API设计

### 3.1 分期付款申请

```http
POST /api/tuition/installment/apply
```

**请求**:
```json
{
  "tuitionPaymentId": "uuid",
  "installmentCount": 3,
  "reason": "经济困难，需要分期"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "planId": "uuid",
    "schedules": [
      { "sequence": 1, "amount": 1000, "dueDate": "2026-07-01" },
      { "sequence": 2, "amount": 1000, "dueDate": "2026-08-01" },
      { "sequence": 3, "amount": 1000, "dueDate": "2026-09-01" }
    ]
  }
}
```

### 3.2 分期付款查询

```http
GET /api/tuition/installment/:planId
GET /api/tuition/installment/student/:studentId
```

### 3.3 分期状态更新

```http
PATCH /api/tuition/installment/:planId/status
```

**请求**:
```json
{
  "status": "overdue",
  "remark": "逾期30天未缴"
}
```

### 3.4 欠费子状态查询

```http
GET /api/tuition/payments/sub-status
```

**响应**:
```json
{
  "success": true,
  "data": {
    "installmentPlan": [
      { "studentId": "xxx", "studentName": "陳小明", "amount": 3000, "dueDate": "2026-07-01" }
    ],
    "overdue": [
      { "studentId": "xxx", "studentName": "李小红", "amount": 5000, "overdueDays": 30 }
    ],
    "disputed": []
  }
}
```

---

## 4. UI设计

### 4.1 分期付款申请页面

```
┌─────────────────────────────────────────┐
│ ← 返回        分期付款申请               │
├─────────────────────────────────────────┤
│                                         │
│  学生: 陳小明                           │
│  应缴金额: $3,000                       │
│  已缴金额: $0                           │
│  欠费金额: $3,000                       │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  分期期数:                             │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 2期  │ │ 3期  │ │ 6期  │               │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  申请说明:                              │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         提交申请                  │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 分期付款列表

```
┌─────────────────────────────────────────┐
│ ← 返回        分期付款管理               │
├─────────────────────────────────────────┤
│                                         │
│  状态筛选:                             │
│  [全部▼] [分期中] [逾期] [已缴清]       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 分期计划 1                    │   │
│  │ 学生: 陳小明                     │   │
│  │ 期数: 3/3                       │   │
│  │ 金额: $3,000/$3,000             │   │
│  │ 状态: ✅ 已缴清                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⚠️ 分期计划 2                    │   │
│  │ 学生: 李小红                     │   │
│  │ 期数: 1/3                       │   │
│  │ 金额: $1,000/$3,000             │   │
│  │ 下期: $1,000 (2026-07-01)       │   │
│  │ 状态: ⚠️ 逾期5天                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. 错误处理

### 5.1 错误码

| 错误码 | 说明 | 处理 |
|--------|------|------|
| INVALID_INSTALLMENT_COUNT | 期数无效 | 提示选择2-12期 |
| ALREADY_IN_INSTALLMENT | 已在分期中 | 显示当前分期计划 |
| AMOUNT_TOO_LOW | 金额低于最小分期 | 提示最低分期金额 |
| PLAN_EXPIRED | 分期计划已过期 | 重新申请 |

---

## 6. 权限设计

| 角色 | 权限 |
|------|------|
| SYSTEM_ADMIN | 全部权限 |
| FINANCE_STAFF | 审核分期申请 |
| PARENT | 查看、申请分期 |
| TEACHER | 无权限 |

---

## 7. 验收标准

- [ ] 数据库迁移成功
- [ ] 分期申请API可用
- [ ] 分期查询API可用
- [ ] 子状态更新API可用
- [ ] 前端分期申请页面可用
- [ ] 前端分期管理页面可用
- [ ] 状态转换逻辑正确
- [ ] 单元测试通过
