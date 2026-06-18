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

### 3.1 设置密码

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

**响应**:
```json
{
  "success": true,
  "message": "密码设置成功"
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

### 3.4 关联学生

```http
POST /api/auth/link-student
DELETE /api/auth/link-student/:studentId
GET /api/auth/linked-students
```

---

## 4. 数据库设计

### 4.1 新增字段

```sql
-- users表新增
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history TEXT[]; -- 最近密码hash

-- 新增关联表
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

| 错误码 | 用户提示 |
|--------|---------|
| PASSWORD_MISMATCH | 两次密码输入不一致 |
| PASSWORD_TOO_WEAK | 密码强度不足，请检查要求 |
| INVALID_OLD_PASSWORD | 原密码错误 |
| PASSWORD_RECENTLY_USED | 不能使用最近使用过的密码 |
| STUDENT_NOT_FOUND | 学生不存在 |
| ALREADY_LINKED | 该学生已关联其他家长 |

---

## 7. 验收标准

- [ ] 首次登录强制设置密码
- [ ] 密码强度验证通过
- [ ] 多子女可关联同一家长
- [ ] 家长可管理关联学生
- [ ] 密码历史记录功能

---

## 8. 权限设计

| 角色 | 权限 |
|------|------|
| PARENT | 设置密码、关联学生、管理关联 |
| STUDENT | 修改自己密码 |
| 其他 | 无权限 |
