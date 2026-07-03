# 测试环境凭证

## 系统管理员

| 用户名 | 密码 | 角色 | 备注 |
|--------|------|------|------|
| admin | ? | system_admin | 原始密码未记录 |
| qa_test | qa_test123 | system_admin | QA 专用，已创建 |

## 教师

| 用户名 | 密码 | 角色 | 备注 |
|--------|------|------|------|
| teacher_1a | ? | teacher | 密码未记录 |

## 学生

| 用户名 | 密码 | 角色 | 备注 |
|--------|------|------|------|
| stu003 | ? | student | 密码未记录 |

---

## 使用方法

### 登录获取 JWT Token

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "qa_test", "password": "qa_test123"}'
```

### 使用 Token 访问 API

```bash
curl -X GET http://localhost:4000/api/students \
  -H "Authorization: Bearer <token>"
```

---

## 注意事项

- **qa_test** 用户专门为 QA 验收创建
- 密码 hash: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- 不要在生产环境使用此凭证