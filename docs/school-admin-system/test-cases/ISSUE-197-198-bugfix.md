# Issue #197 + #198 测试用例

## 前置条件

### 认证凭证

| 用户名 | 密码 | 角色 |
|--------|------|------|
| qa_test | qa_test123 | system_admin |

### 登录获取 Token

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "qa_test", "password": "qa_test123"}'
```

**保存返回的 `access_token`**，后续请求使用：
```bash
Authorization: Bearer <access_token>
```

---

## Issue #197: TC-006 currentClass 返回 null

### 测试步骤
1. 创建学生（无班级）
2. 分配到班级（POST /api/students/:id/class）
3. GET /api/students 查询列表
4. 检查 `currentClass` 字段

### 期望结果
```json
{
  "id": 1,
  "name": "王小明",
  "student_id": "20260001",
  "currentClass": {
    "id": 1,
    "name": "1A",
    "academicYear": {
      "year": "2026-2027"
    }
  }
}
```

### 修复内容
- 过滤 `allocation_type = 'MAIN'`
- 确保 LEFT JOIN 正确映射

---

## Issue #198: 软删除学生学号禁止重用

### 测试步骤
1. 创建学生，学号 `20260002`
2. 删除该学生（软删除）
3. 尝试再次创建学号 `20260002`

### 期望结果
```
HTTP 409 Conflict
{
  "statusCode": 409,
  "message": "Student ID already exists (including soft-deleted records)"
}
```

### 修复内容
- 添加 `WHERE student_id = ? AND deleted_at IS NULL` 校验
- 禁止重用软删除学生的学号