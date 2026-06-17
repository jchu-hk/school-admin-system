# 🧪 PM测试环境访问指南

**更新时间**: 2026-06-17 08:13
**状态**: ✅ 所有服务正常运行

---

## 📊 服务状态

| 服务 | 状态 | 端口 | 说明 |
|------|------|------|------|
| Backend API | ✅ Healthy | 3000 | NestJS API |
| Frontend (Nginx) | ✅ Healthy | 80, 443 | Web界面 |
| PostgreSQL | ✅ Healthy | 5432 | 数据库 |
| Redis | ✅ Healthy | 6379 | 缓存 |
| Kafka | ✅ Healthy | 9092 | 消息队列 |
| Grafana | ✅ Running | 3001 | 监控面板 |

---

## 🔗 访问地址

### 基础URL
```
http://<服务器IP或域名>
```

### 服务端点

| 服务 | URL | 用途 |
|------|-----|------|
| **前端页面** | http://<IP>/ | 学校管理系统主页 |
| **API文档** | http://<IP>:3000/api-docs | Swagger API文档 |
| **健康检查** | http://<IP>:3000/api/health | API状态检查 |
| **Grafana** | http://<IP>:3001 | 监控面板 |

**示例** (假设IP为 10.0.0.1):
```
http://10.0.0.1/                    # 前端
http://10.0.0.1:3000/api/docs     # API文档
http://10.0.0.1:3000/api/health  # 健康检查
http://10.0.0.1:3001             # Grafana
```

---

## 🧪 已完成功能测试指南

### 模块列表

| 模块 | Issue | API路径 | 测试说明 |
|------|-------|---------|----------|
| 学生出勤管理 | #30 | `/api/v1/attendance/*` | 记录、查询、统计 |
| 教师请假管理 | #31 | `/api/v1/leave/*` | 申请、审批、查询 |
| 家长查询管理 | #32 | `/api/v1/inquiry/*` | 创建、查询、回复 |
| 午膳管理 | #36 | `/api/v1/lunch/*` | 订单、统计、结算 |
| 学费管理 | #33 | `/api/v1/tuition/*` | 创建、修改、查询 |
| 费用/奖学金 | #34/#35 | `/api/v1/fee/*` | 费用、奖助学金 |
| 用户管理 | #39/#40 | `/api/v1/users/*` | CRUD、权限管理 |
| AI智能建议 | #52 | `/api/v1/ai/*` | 风险评分、建议生成 |

---

## 📝 测试步骤

### 步骤1: 获取认证Token

```bash
# 注册管理员账号
curl -X POST http://<IP>:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@test.com",
    "password": "Admin123!",
    "role": "admin"
  }'

# 登录获取Token
curl -X POST http://<IP>:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

保存返回的 `accessToken`。

### 步骤2: 测试学生出勤模块

```bash
# 创建出勤记录
curl -X POST http://<IP>:3000/api/v1/attendance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "classId": "CLS001",
    "date": "2026-06-17",
    "status": "present"
  }'

# 查询出勤记录
curl -X GET "http://<IP>:3000/api/v1/attendance?date=2026-06-17" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 统计报告
curl -X GET "http://<IP>:3000/api/v1/attendance/stats?startDate=2026-06-01&endDate=2026-06-17" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 步骤3: 测试教师请假模块

```bash
# 创建请假申请
curl -X POST http://<IP>:3000/api/v1/leave \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "TCH001",
    "startDate": "2026-06-18",
    "endDate": "2026-06-18",
    "reason": "personal"
  }'

# 查询请假记录
curl -X GET "http://<IP>:3000/api/v1/leave?teacherId=TCH001" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 步骤4: 测试家长查询模块

```bash
# 创建查询记录
curl -X POST http://<IP>:3000/api/v1/inquiry \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "张家长",
    "phone": "12345678",
    "subject": "成绩查询",
    "content": "我想查询孩子最近的成绩"
  }'

# 查询待处理记录
curl -X GET "http://<IP>:3000/api/v1/inquiry?status=pending" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 回复查询
curl -X PATCH http://<IP>:3000/api/v1/inquiry/INQ001/reply \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reply": "已收到，我们会尽快处理"
  }'
```

### 步骤5: 测试AI智能建议模块

```bash
# 获取AI建议
curl -X GET "http://<IP>:3000/api/v1/ai/suggestions/student/STU001/analysis" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 获取仪表板摘要
curl -X GET "http://<IP>:3000/api/v1/ai/suggestions/dashboard-summary" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 查看建议列表
curl -X GET "http://<IP>:3000/api/v1/ai/suggestions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔍 常见问题

### Q: 如何知道服务器IP？
**A**: 联系PM获取IP地址，或检查Docker网络配置。

### Q: Token过期怎么办？
**A**: 使用 `/api/v1/auth/refresh` 端点刷新，或重新登录。

### Q: 测试数据会保存吗？
**A**: 是的，PostgreSQL数据持久化存储，重启不会丢失。

### Q: 如何清空测试数据？
**A**: 运行数据库迁移脚本或删除所有记录。

---

## 📊 监控与日志

### Grafana监控
- URL: http://<IP>:3001
- 账号: `admin` / `admin123`
- 查看系统性能、API响应时间等

### 容器日志
```bash
# 查看backend日志
docker logs infra-backend-1 --tail 50

# 查看postgres日志
docker logs school-admin-postgres --tail 20
```

---

## ✅ 验收清单

- [ ] 前端页面可访问
- [ ] API文档可查看
- [ ] 用户注册/登录正常
- [ ] 出勤管理CRUD正常
- [ ] 请假管理流程正常
- [ ] 家长查询功能正常
- [ ] AI建议功能正常
- [ ] 数据持久化正常

---

## 📝 反馈方式

测试完成后，请反馈：
1. ✅ 功能正常
2. ❌ 遇到问题（附错误信息）
3. 💡 改进建议

---

**准备好开始测试了吗？告诉我服务器的IP，马上开始！** 🚀