# 🧪 Docker部署验收检查清单

**适用场景**: DEVOPS完成Docker部署后，必须由CHECKER验收

---

## 验收阶段

### 阶段1: 构建验证

- [ ] `docker compose build` 无错误
- [ ] 镜像大小合理 (非空)
- [ ] Dockerfile语法正确

### 阶段2: 容器启动验证

- [ ] 所有容器状态为 `healthy` 或 `running`
- [ ] 无CrashLoopBackOff
- [ ] 端口映射正确

### 阶段3: 功能验证

#### Backend
- [ ] `curl http://localhost:3000/api/health` 返回200
- [ ] `curl http://localhost:3000/api-docs` 可访问

#### Frontend
- [ ] `curl http://localhost:8080` 返回200
- [ ] 页面内容是**真实应用**，不是placeholder
- [ ] 检查HTML包含实际组件（如"智慧校园管理系统"）

#### Database
- [ ] PostgreSQL healthy
- [ ] 可以执行查询

### 阶段4: 集成验证

- [ ] 前端页面可登录
- [ ] API请求正常响应
- [ ] 无CORS错误

### 阶段5: 代码完整性验证

- [ ] **Frontend**: 检查 `school-admin-frontend/src/pages/` 存在真实页面
- [ ] **Backend**: 检查 `apps/backend/src/modules/` 存在模块代码
- [ ] **Package.json**: 依赖完整，非placeholder

---

## 验收报告模板

```
## 部署验收报告

**日期**: 
**部署人**: 
**验收人**: 

### 检查结果

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 构建成功 | ✅/❌ | |
| 容器健康 | ✅/❌ | |
| API健康 | ✅/❌ | |
| 前端真实内容 | ✅/❌ | |
| 功能可用 | ✅/❌ | |

### 缺陷记录

(如有)

### 验收结论

✅ **通过** / ❌ **不通过**

---
