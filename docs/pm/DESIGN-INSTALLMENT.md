# 📋 学费分期付款功能设计

**Issue**: #98
**日期**: 2026-06-18
**状态**: 设计阶段
**版本**: v1.1（CHECKER整改版）

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

### 2.1 枚举类型定义

```sql
-- 子状态枚举
CREATE TYPE tuition_payments_sub_status_enum AS ENUM (
  'installment_plan',
  'overdue',
  'disputed',
  'paid'
);

-- 分期计划状态枚举
CREATE TYPE installment_plan_status_enum AS ENUM (
  'pending_review',
  'active',
  'completed',
  'cancelled',
  'expired'
);

-- 分期记录状态枚举
CREATE TYPE installment_schedule_status_enum AS ENUM (
  'pending',
  'paid',
  'overdue',
  'cancelled'
);
```

### 2.2 新增字段

```sql
-- 新增 installment_plans 表
CREATE TABLE installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tuition_payment_id UUID NOT NULL REFERENCES tuition_payments(id),
  student_id UUID NOT NULL REFERENCES students(id),
  parent_id UUID NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  installment_count INTEGER NOT NULL DEFAULT 1 CHECK (installment_count >= 2 AND installment_count <= 12),
  installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
  start_date DATE NOT NULL,
  end_date DATE,
  status installment_plan_status_enum DEFAULT 'pending_review',
  review_notes TEXT,
  review_by UUID REFERENCES users(id),
  review_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 新增 installment_schedules 表
CREATE TABLE installment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES installment_plans(id),
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  paid_date DATE,
  status installment_schedule_status_enum DEFAULT 'pending',
  paid_transaction_id UUID REFERENCES transactions(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- tuition_payments 表新增字段
ALTER TABLE tuition_payments ADD COLUMN sub_status tuition_payments_sub_status_enum;
ALTER TABLE tuition_payments ADD COLUMN installment_plan_id UUID REFERENCES installment_plans(id);
```

### 2.3 索引设计

```sql
-- 分期计划按缴费ID索引（查询家长关联的分期）
CREATE INDEX idx_installment_plans_payment ON installment_plans(tuition_payment_id);
CREATE INDEX idx_installment_plans_student ON installment_plans(student_id);
CREATE INDEX idx_installment_plans_status ON installment_plans(status);

-- 分期记录按到期日和状态索引（逾期查询）
CREATE INDEX idx_installment_schedules_due_status ON installment_schedules(due_date, status);
CREATE INDEX idx_installment_schedules_plan ON installment_schedules(plan_id);

-- 缴费表按子状态索引
CREATE INDEX idx_tuition_payments_sub_status ON tuition_payments(sub_status);
```

### 2.4 子状态说明

| sub_status | 说明 | 触发条件 |
|------------|------|---------|
| installment_plan | 分期付款中 | 申请分期付款并通过 |
| overdue | 逾期 | 分期或正常缴费逾期 |
| disputed | 争议中 | 家长提出争议 |
| paid | 已缴清 | 缴清所有欠款 |

---

## 3. 金额计算规则

### 3.1 分期金额计算

```
等额均分规则:
- 每期金额 = 总金额 / 期数
- 例如: $3000 / 3期 = $1000/期
- 金额除不尽时，最后一期补差
  - 示例: $1000 / 3期 = $333.33...
  - 第1期: $333.33
  - 第2期: $333.33
  - 第3期: $333.34 (补差)
```

### 3.2 期数限制

| 限制 | 值 |
|------|-----|
| 最低期数 | 2期 |
| 最高期数 | 12期 |

### 3.3 提前还款金额计算

```
提前还款金额 = 剩余所有期次本金之和（不含已逾期罚息）
流程:
1. 家长申请提前还款
2. 系统计算: SUM(剩余未付期次的amount)
3. 家长确认还款金额
4. 一次性扣款
5. 分期计划标记为 completed
```

---

## 4. 审核流程

### 4.1 审核角色

| 角色 | 权限 |
|------|------|
| FINANCE_STAFF | 审核分期申请（通过/拒绝） |

### 4.2 审核流程

```
审核流程:
1. 家长提交分期申请
   - status = 'pending_review'
2. FINANCE_STAFF 收到通知（系统消息/邮件）
3. FINANCE_STAFF 审核:
   - 审核标准:
     a) 经济困难证明（房产证明/收入证明/失业证明等）
     b) 以往缴费记录（是否有逾期历史）
     c) 申请金额是否合理
   - 通过 → status = 'active'，创建分期计划
   - 拒绝 → status = 'cancelled'，通知家长原因
4. 审核状态转换: pending_review → active / cancelled
```

### 4.3 审核记录

```sql
CREATE TABLE installment_plan_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES installment_plans(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  attachment_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. 状态转换矩阵

### 5.1 分期计划状态转换 (installment_plan.status)

```
┌─────────────────┐
│ pending_review  │ ← 初始状态（申请提交）
└────────┬────────┘
         │
    ┌────┴────┐
    │ 审核通过 │ → active
    │ 审核拒绝 │ → cancelled
    └─────────┘

active ────────────────────────────────────────────→ completed
  │                                                    (全部还清)
  │
  ├─────→ cancelled (取消计划/审核拒绝)
  │
  └─────→ expired (计划过期，未按时还款)
```

| 当前状态 | 允许转换 | 触发条件 |
|---------|---------|---------|
| pending_review | → active | FINANCE_STAFF审核通过 |
| pending_review | → cancelled | FINANCE_STAFF审核拒绝 |
| active | → completed | 全部期次还款成功 |
| active | → cancelled | 家长申请取消或系统取消 |
| active | → expired | 计划到期仍有未还清 |

### 5.2 分期记录状态转换 (installment_schedule.status)

```
pending ────────────────────────────→ paid
  │                                      (还款成功)
  │
  └───────────────→ overdue
       (逾期，自动转换)

overdue ──────────────→ paid
       (补交逾期款)

paid → (终止，状态不再变化)
cancelled → (终止，状态不再变化)
```

| 当前状态 | 允许转换 | 触发条件 |
|---------|---------|---------|
| pending | → paid | 用户按时还款 |
| pending | → overdue | 到期日当天结束仍未还款 |
| overdue | → paid | 用户补交逾期款 |
| paid | → (终止) | 状态固定 |
| cancelled | → (终止) | 状态固定 |

---

## 6. API设计

### 6.1 分期付款申请

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
    "status": "pending_review",
    "schedules": [
      { "sequence": 1, "amount": 1000.00, "dueDate": "2026-07-01" },
      { "sequence": 2, "amount": 1000.00, "dueDate": "2026-08-01" },
      { "sequence": 3, "amount": 1000.00, "dueDate": "2026-09-01" }
    ],
    "message": "申请已提交，请等待财务审核"
  }
}
```

### 6.2 分期付款审核（FINANCE_STAFF）

```http
POST /api/tuition/installment/:planId/review
```

**请求**:
```json
{
  "action": "approve",
  "notes": "经济困难证明充分，同意分期"
}
```

```json
{
  "action": "reject",
  "reason": "经济困难证明不足"
}
```

### 6.3 分期付款查询

```http
GET /api/tuition/installment/:planId
GET /api/tuition/installment/student/:studentId
GET /api/tuition/installment/pending-review  (FINANCE_STAFF 查看待审核列表)
```

### 6.4 分期状态更新

```http
PATCH /api/tuition/installment/:planId/status
```

**请求**:
```json
{
  "status": "active",
  "remark": "审核通过"
}
```

### 6.5 期次还款

```http
POST /api/tuition/installment/:scheduleId/pay
```

**请求**:
```json
{
  "transactionId": "uuid"
}
```

### 6.6 提前还款

```http
POST /api/tuition/installment/:planId/early-repayment
```

**响应**:
```json
{
  "success": true,
  "data": {
    "remainingPrincipal": 2000.00,
    "earlyRepaymentAmount": 2000.00,
    "message": "提前还款金额为剩余所有期次之和"
  }
}
```

**确认还款**:
```http
POST /api/tuition/installment/:planId/early-repayment/confirm
```

### 6.7 欠费子状态查询

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

### 6.8 争议处理

```http
POST /api/tuition/payments/:paymentId/dispute
```

**请求**:
```json
{
  "reason": "对账单金额有异议"
}
```

**响应**: sub_status → 'disputed'

```http
POST /api/tuition/payments/:paymentId/dispute/resolve
```

**请求**:
```json
{
  "resolution": "adjusted",
  "newAmount": 2800.00,
  "notes": "核对后发现多计50元，已调整"
}
```

---

## 7. API错误码矩阵

| 错误码 | 说明 | HTTP状态 | 处理建议 |
|--------|------|---------|---------|
| PLAN_NOT_FOUND | 分期计划不存在 | 404 | 检查planId是否正确 |
| INVALID_INSTALLMENT_COUNT | 期数无效(需2-12) | 400 | 提示选择2-12期 |
| AMOUNT_TOO_LOW | 金额低于最低分期 | 400 | 提示最低分期金额限制 |
| PLAN_EXPIRED | 分期计划已过期 | 400 | 重新申请分期 |
| INVALID_STATUS_TRANSITION | 状态转换无效 | 400 | 检查当前状态是否允许此操作 |
| UNAUTHORIZED | 未授权操作 | 401 | 重新登录 |
| NOT_INSTALLMENT_PLAN | 非分期计划 | 400 | 该缴费不支持分期操作 |
| CANNOT_CANCEL_ACTIVE | 无法取消生效中计划 | 400 | 需先还清所有期次 |
| AMOUNT_MISMATCH | 金额不匹配 | 400 | 检查还款金额是否正确 |
| OVERDUE_COUNT_EXCEEDED | 逾期次数超限 | 400 | 联系财务人员处理 |
| REVIEW_ALREADY_EXISTS | 已存在审核记录 | 400 | 该申请已审核，请勿重复提交 |
| REVIEW_NOT_FOUND | 审核记录不存在 | 404 | 检查审核ID |
| STUDENT_NOT_FOUND | 学生不存在 | 404 | 检查学生ID |
| PARENT_NOT_MATCH | 家长不匹配 | 403 | 当前用户非该学生家长 |
| INSTALLMENT_NOT_FOUND | 分期记录不存在 | 404 | 检查scheduleId |
| SCHEDULE_ALREADY_PAID | 期次已还款 | 400 | 该期次无需重复还款 |
| INVALID_REVIEW_ACTION | 审核动作无效 | 400 | action需为approve/reject |
| PLAN_NOT_PENDING_REVIEW | 计划非待审核状态 | 400 | 当前计划不在待审核状态 |
| EARLY_REPAYMENT_NOT_ALLOWED | 不允许提前还款 | 400 | 存在逾期期次，需先处理逾期 |
| DISPUTE_ALREADY_EXISTS | 争议已存在 | 400 | 该缴费已在争议处理中 |
| DISPUTE_NOT_FOUND | 争议不存在 | 404 | 检查争议ID |
| DISPUTE_ALREADY_RESOLVED | 争议已解决 | 400 | 该争议已处理完毕 |
| DUPLICATE_INSTALLMENT_PLAN | 存在进行中的分期计划 | 400 | 请先完成当前分期计划 |
| MIN_INSTALLMENT_AMOUNT | 分期金额过低 | 400 | 每期金额不能低于$100 |
| MAX_INSTALLMENT_PERIOD | 超过最长分期期数 | 400 | 分期期数不能超过12期 |
| START_DATE_INVALID | 起始日期无效 | 400 | 起始日期不能早于今天 |
| END_DATE_INVALID | 结束日期无效 | 400 | 结束日期需晚于起始日期 |
| ATTACHMENT_REQUIRED | 需上传证明材料 | 400 | 申请分期需提供经济困难证明 |

---

## 8. UI设计

### 8.1 分期付款申请页面

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
│  分期期数: [______] 期 (2-12期)         │
│  每期应付: $1,000                       │
│                                         │
│  申请说明:                              │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  上传证明材料:                           │
│  ┌─────────────────────────────────┐   │
│  │   点击上传经济困难证明            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         提交申请                  │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 8.2 分期付款列表

```
┌─────────────────────────────────────────┐
│ ← 返回        分期付款管理               │
├─────────────────────────────────────────┤
│                                         │
│  状态筛选:                             │
│  [全部▼] [待审核] [分期中] [逾期] [已缴清] │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 分期计划 1                    │   │
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
│  ┌─────────────────────────────────┐   │
│  │ ⏳ 分期计划 3                    │   │
│  │ 学生: 王小華                     │   │
│  │ 期数: 0/3                       │   │
│  │ 金额: $0/$3,000                  │   │
│  │ 状态: ⏳ 待审核                  │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 8.3 FINANCE_STAFF 审核页面

```
┌─────────────────────────────────────────┐
│ ← 返回        分期申请审核               │
├─────────────────────────────────────────┤
│                                         │
│  待审核 (3)                             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 学生: 李小红                     │   │
│  │ 申请期数: 3期                    │   │
│  │ 金额: $3,000 ($1,000/期)        │   │
│  │ 申请时间: 2026-06-18            │   │
│  │ 理由: 经济困难，需要分期         │   │
│  │ 附件: 经济困难证明.pdf           │   │
│  │ 以往记录: ⚠️ 有1次逾期           │   │
│  │                                 │   │
│  │  [拒绝]        [通过]           │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 8.4 争议处理页面

```
┌─────────────────────────────────────────┐
│ ← 返回        争议处理                  │
├─────────────────────────────────────────┤
│                                         │
│  学生: 陳小明                           │
│  争议期次: 第2期                        │
│  原金额: $1,000                        │
│  争议原因: 账单金额有误                 │
│  附件: 截图.png                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 财务备注:                       │   │
│  │ 经核对，多计50元，调整为$950    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  调整后金额: $950                       │
│                                         │
│  [解决争议]                             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. 提前还款流程

```
提前还款流程:
┌──────────────────────────────────────────────────────┐
│ 1. 家长申请提前还款                                   │
│    POST /api/tuition/installment/:planId/early-repayment│
│                                                      │
│ 2. 系统计算提前还款金额                               │
│    = SUM(剩余所有期次的amount)                        │
│    例: 剩余2期 × $1000 = $2000                       │
│                                                      │
│ 3. 展示给家长确认                                    │
│    "提前还款金额: $2000"                             │
│    "还款后将立即完成分期计划"                        │
│                                                      │
│ 4. 家长确认                                          │
│    POST /api/tuition/installment/:planId/            │
│           early-repayment/confirm                    │
│                                                      │
│ 5. 一次性扣款                                        │
│    触发支付接口，扣除全部剩余金额                     │
│                                                      │
│ 6. 分期计划标记为 completed                           │
│    所有schedules状态→ paid                          │
│    installment_plan.status → 'completed'            │
└──────────────────────────────────────────────────────┘
```

---

## 10. 争议处理流程

```
争议处理流程:
┌──────────────────────────────────────────────────────┐
│ 1. 家长发起争议                                      │
│    POST /api/tuition/payments/:paymentId/dispute     │
│    - tuition_payments.sub_status → 'disputed'        │
│                                                      │
│ 2. FINANCE_STAFF 收到通知                            │
│                                                      │
│ 3. FINANCE_STAFF 处理                                │
│    - 查看争议原因和附件                               │
│    - 核对账单明细                                     │
│    - 做出决定                                         │
│                                                      │
│ 4. 解决争议                                          │
│    POST /api/tuition/payments/:paymentId/dispute/resolve
│                                                      │
│    可能的结果:                                        │
│    a) 调整金额: 修改对应期次的amount                  │
│    b) 维持原金额: 通知家长维持原账单                  │
│    c) 豁免: 将该期次状态设为waived                    │
│                                                      │
│ 5. sub_status 恢复正常                               │
│    → 'installment_plan' 或 → 'paid'                │
└──────────────────────────────────────────────────────┘
```

---

## 11. 权限设计

| 角色 | 权限 |
|------|------|
| SYSTEM_ADMIN | 全部权限 |
| FINANCE_STAFF | 查看所有分期申请、审核分期申请、处理争议 |
| PARENT | 查看本人子女分期计划、申请分期、还款、发起争议 |
| TEACHER | 无权限 |

---

## 12. 错误处理

### 12.1 错误码

（详见第7节 API错误码矩阵）

### 12.2 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "分期计划不存在",
    "details": "planId: xxx"
  }
}
```

---

## 13. 验收标准

- [ ] 数据库迁移成功（枚举类型、表、索引、审计字段）
- [ ] 分期申请API可用
- [ ] 分期审核API可用（FINANCE_STAFF）
- [ ] 分期查询API可用
- [ ] 子状态更新API可用
- [ ] 提前还款API可用
- [ ] 争议处理API可用
- [ ] 前端分期申请页面可用（期数灵活输入）
- [ ] 前端分期管理页面可用
- [ ] 前端审核页面可用（FINANCE_STAFF）
- [ ] 状态转换逻辑正确
- [ ] 金额计算逻辑正确（除不尽时最后一期补差）
- [ ] 单元测试通过
- [ ] 集成测试通过
