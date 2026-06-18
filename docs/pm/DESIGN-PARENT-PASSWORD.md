# 📋 Issue #100: 家长密码设置流程设计

**Issue**: #100
**日期**: 2026-06-18
**状态**: 设计阶段

---

## 1. 需求分析

### 1.1 问题描述
- 家长密码设置流程缺失
- 影响多子女账号关联验证

### 1.2 现有状态
- 用户表已有 `password` 字段
- 登录功能正常
- 无首次登录强制设置密码流程

---

## 2. 功能设计

### 2.1 首次登录密码设置

```typescript
// 场景1: 首次登录
1. 家长使用临时密码/手机号登录
2. 系统检测到未设置密码
3. 强制跳转设置密码页面
4. 设置后进入主页
```

### 2.2 密码强度要求

```typescript
const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 32,
  requireUppercase: true,    // 大写字母
  requireLowercase: true,    // 小写字母
  requireNumbers: true,       // 数字
  requireSpecialChars: true,  // 特殊字符
  notUsername: true,          // 不能是用户名
  notRecent: 3               // 不能是最近3次密码
};
```

### 2.3 多子女账号关联

```typescript
// 一个家长可以关联多个学生
interface ParentStudentLink {
  parentId: string;
  studentId: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  isPrimary: boolean;  // 主要联系人
}
```

---

## 3. API设计

### 3.1 统一响应格式

所有 API 遵循以下响应结构：

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {}
}
```

**分页数据**：
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 3.2 设置密码

```http
POST /api/auth/set-password
```

**请求**:
```json
{
  "oldPassword": "临时密码",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**响应** (成功):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密码设置成功",
  "data": null
}
```

**错误响应示例**:
```json
{
  "success": false,
  "code": "PASSWORD_MISMATCH",
  "message": "两次密码输入不一致",
  "data": null
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| PASSWORD_MISMATCH | 两次密码不一致 |
| PASSWORD_TOO_WEAK | 密码强度不足 |
| INVALID_OLD_PASSWORD | 原密码错误 |
| PASSWORD_RECENTLY_USED | 密码最近使用过 |

### 3.2 重置密码

```http
POST /api/auth/reset-password
```

**请求**:
```json
{
  "phone": "13800138000",
  "otp": "123456",
  "newPassword": "NewPass123!"
}
```

### 3.3 检查密码状态

```http
GET /api/auth/password-status
```

**响应**:
```json
{
  "isPasswordSet": false,
  "mustSetPassword": true,
  "passwordExpiresAt": null
}
```

### 3.6 查询关联学生（分页）

```http
GET /api/auth/linked-students?page=1&pageSize=20
```

**响应**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "items": [
      {
        "id": "uuid",
        "studentId": "STU001",
        "studentName": "陈小明",
        "relationship": "father",
        "isPrimary": true,
        "verifiedAt": "2026-06-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## 4. 数据库设计

### 4.1 新增字段

```sql
-- users表新增
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history TEXT[]; -- 最近密码hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP;

-- 临时密码表
CREATE TABLE temporary_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  code_hash VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTP请求表
CREATE TABLE otp_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT false
);

CREATE INDEX idx_otp_phone_date ON otp_requests(phone, created_at);

-- 关联表
CREATE TABLE parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id),
  student_id VARCHAR(50) NOT NULL,
  relationship VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

CREATE INDEX idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX idx_parent_student_links_student ON parent_student_links(student_id);
```

---

## 5. UI设计

### 5.1 首次登录设置密码

```
┌─────────────────────────────────────────┐
│ 欢迎首次登录                             │
│                                         │
│ 请设置您的账户密码                        │
│                                         │
│ 新密码:                                 │
│ ┌─────────────────────────────────┐    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 确认密码:                               │
│ ┌─────────────────────────────────┐    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 密码强度: [████░░░░░░] 弱              │
│                                         │
│ ✓ 最少8个字符                          │
│ ✓ 包含大写字母                          │
│ ✓ 包含小写字母                          │
│ ✓ 包含数字                              │
│ ✓ 包含特殊字符                          │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │         确认设置                  │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 关联学生

```
┌─────────────────────────────────────────┐
│ ← 返回      关联子女账号                  │
├─────────────────────────────────────────┤
│                                         │
│ 已关联子女:                             │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 陈小明 (儿子)        [主联系人] │    │
│ │ 1A班                          │    │
│ │ [解除关联]                    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 李小红 (女儿)                  │    │
│ │ 2B班                          │    │
│ │ [解除关联]                    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │       + 添加子女账号             │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. 错误处理

| 错误码 | 用户提示 | HTTP状态码 |
|--------|---------|-----------|
| PASSWORD_MISMATCH | 两次密码输入不一致 | 400 |
| PASSWORD_TOO_WEAK | 密码强度不足，请检查要求 | 400 |
| INVALID_OLD_PASSWORD | 原密码错误 | 400 |
| PASSWORD_RECENTLY_USED | 不能使用最近使用过的密码 | 400 |
| STUDENT_NOT_FOUND | 学生不存在 | 404 |
| ALREADY_LINKED | 该学生已关联其他家长 | 409 |
| ACCOUNT_LOCKED | 账户已锁定，请在30分钟后重试 | 429 |
| INVALID_OTP | 验证码错误 | 400 |
| OTP_EXPIRED | 验证码已过期 | 400 |
| OTP_EXCEEDED | 验证码尝试次数超限 | 429 |
| DAILY_OTP_LIMIT | 今日请求次数超限，请明天再试 | 429 |
| INVALID_CREDENTIALS | 手机号或密码错误 | 401 |

---

## 7. 验收标准

### 7.1 功能验收
- [ ] 首次登录强制设置密码
- [ ] 密码强度验证通过
- [ ] 多子女可关联同一家长
- [ ] 家长可管理关联学生
- [ ] 密码历史记录功能

### 7.2 安全验收
- [ ] 账户锁定：连续5次失败，锁定30分钟
- [ ] OTP有效期5分钟，最多尝试3次
- [ ] OTP每日请求上限10次
- [ ] 密码使用bcrypt (saltRounds=12) 存储
- [ ] 最近3个密码不可重复使用
- [ ] 临时密码15分钟过期，仅限一次使用
- [ ] 暴力破解防护生效

### 7.3 UI验收
- [ ] 密码不匹配实时错误提示
- [ ] 解除关联二次确认弹窗

---

## 8. 安全设计

### 8.1 防暴力破解机制

#### 账户锁定策略

```typescript
// 账户锁定策略
const ACCOUNT_LOCKOUT = {
  maxFailedAttempts: 5,        // 5次失败
  lockoutDuration: 30 * 60,    // 锁定30分钟 (秒)
  failedAttemptWindow: 15 * 60 // 15分钟内计算 (秒)
};
```

**实现逻辑**:
- 在 `users` 表新增 `failed_attempts`, `lockout_until` 字段
- 每次认证失败，`failed_attempts + 1`
- `failed_attempts >= maxFailedAttempts` 时，设置 `lockout_until = now + lockoutDuration`
- 每次登录检查 `lockout_until`，已过期则重置计数
- 锁定期间拒绝所有认证请求，返回 `ACCOUNT_LOCKED`

#### OTP 规范

```typescript
// OTP一次性密码配置
const OTP_CONFIG = {
  length: 6,               // 6位数字
  expiryMinutes: 5,         // 5分钟内有效
  maxAttempts: 3,          // 最多尝试3次
  resendCooldown: 60,      // 60秒后才能重新发送
  dailyLimit: 10           // 每天最多请求10次
};
```

**实现逻辑**:
- 在 `otp_requests` 表记录请求历史（含 phone, created_at, ip）
- 每日按 phone + date 统计请求次数，超过 `dailyLimit` 拒绝
- 生成6位随机数字，存储 hash + expiresAt
- 验证时检查 expires、attemptCount，超限则删除旧 OTP
- 验证成功后删除 OTP（一次性）

```sql
CREATE TABLE otp_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'reset' | 'verify'
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT false
);

CREATE INDEX idx_otp_phone_date ON otp_requests(phone, created_at);
```

### 8.2 密码存储规范

```typescript
// 密码存储配置
const PASSWORD_CONFIG = {
  algorithm: 'bcrypt',
  saltRounds: 12,          // bcrypt cost factor
  historyLength: 3         // 存储最近3个密码hash
};
```

**实现逻辑**:
- 使用 bcrypt 加密，`saltRounds = 12`
- 用户修改密码时，将旧密码 hash 存入 `password_history`
- 校验新密码前，与 `password_history` 中所有 hash 比对
- `password_history` 最多保留 `historyLength` 条，超出时删除最早的

```sql
-- users表字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history TEXT[]; -- 数组存储历史hash
```

### 8.3 临时密码机制

```typescript
// 临时密码接口
interface TemporaryPassword {
  code: string;         // 6位数字
  type: 'temp' | 'reset';
  expiresAt: Date;      // 15分钟后过期
  used: boolean;
  userId: string;
}
```

**下发渠道**:
- 短信：用于首次登录场景，通过短信服务商发送
- 邮件：用于重置密码场景，发送到注册邮箱

**生成规则**:
- 6位纯数字，随机生成
- 有效期15分钟，过期自动失效
- 仅能使用一次，使用后标记 `used = true`

```sql
CREATE TABLE temporary_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  code_hash VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL,  -- 'temp' | 'reset'
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.4 安全响应格式

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {}
}
```

**统一错误响应**:

```json
{
  "success": false,
  "code": "ACCOUNT_LOCKED",
  "message": "账户已锁定，请在30分钟后重试",
  "data": null
}
```

**错误码映射**:

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| SUCCESS | 200 | 成功 |
| ACCOUNT_LOCKED | 429 | 账户已锁定 |
| INVALID_OTP | 400 | OTP错误 |
| OTP_EXPIRED | 400 | OTP已过期 |
| OTP_EXCEEDED | 429 | OTP尝试次数超限 |
| DAILY_OTP_LIMIT | 429 | 今日请求次数超限 |
| PASSWORD_MISMATCH | 400 | 两次密码不一致 |
| PASSWORD_TOO_WEAK | 400 | 密码强度不足 |
| PASSWORD_RECENTLY_USED | 400 | 密码最近使用过 |
| INVALID_CREDENTIALS | 401 | 认证失败 |

---

## 9. API分页规范

### 9.1 分页请求参数

```http
GET /api/auth/linked-students?page=1&pageSize=20
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | integer | 1 | 页码（从1开始） |
| pageSize | integer | 20 | 每页条数（最大100） |

### 9.2 分页响应格式

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 10. UI交互补充

### 10.1 密码不匹配错误提示

在设置/确认密码场景中，当两次输入不一致时：

- 实时检测：输入框失焦时校验
- 错误提示：显示红色提示文字 "两次密码输入不一致"
- 视觉反馈：输入框边框变红
- 阻止提交：确认按钮禁用，直到输入一致

### 10.2 解除关联二次确认弹窗

点击"解除关联"时，弹出确认对话框：

```
┌─────────────────────────────────────────┐
│                                         │
│         确认解除关联？                   │
│                                         │
│ 解除后，您将无法查看 陈小明 的在校情况   │
│                                         │
│ ┌─────────────────┐  ┌────────────────┐ │
│ │     取消        │  │    确认解除    │ │
│ └─────────────────┘  └────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**实现要求**:
- 模态弹窗，禁止背景滚动
- 取消按钮：关闭弹窗，不执行操作
- 确认按钮：红色/危险操作样式，执行解除关联 API
- 键盘支持：ESC 关闭，Enter 确认

---

## 11. 权限设计

| 角色 | 权限 |
|------|------|
| PARENT | 设置密码、关联学生、管理关联 |
| STUDENT | 修改自己密码 |
| 其他 | 无权限 |
