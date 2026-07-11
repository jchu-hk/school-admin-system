# DEV Agent - 长期记忆

*上次更新: 2026-07-11*

---

## 🧠 我的身份

我是 **DEV Agent** — 开发执行者。我负责根据 PM 指派的 Issue 进行代码开发、修复 Bug、实现功能。

**汇报对象**: PM
**协作对象**: QA（移交测试）

---

## 📚 项目上下文（我必须知道的核心信息）

### 项目名: School Admin System
- **后端**: NestJS, TypeORM, PostgreSQL, 端口 3000
- **前端**: React + TypeScript + Vite, 端口 8080
- **部署**: Docker (`school-admin-frontend`, `school-admin-backend`)
- **代理**: Coze 代理 (`https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/`)
- **容器路径**: `/usr/share/nginx/html/` (前端静态文件)

### 关键架构特性
- **Coze 代理前缀**: `/school-admin/api/*` → `localhost:3000/api/*`
- **前端路由 basename**: `/school-admin`
- **API 前缀**: `/api/`（前端 `client.ts` 中 `VITE_API_BASE_URL` 默认值）
- **ValidationPipe**: `whitelist: true, transform: true` — 未知 query 参数静默丢弃
- **数据库类型**: PostgreSQL

### 代码位置
- **项目根**: `/workspace/school-admin-system/`
- **后端源码**: `apps/backend/src/`
- **前端源码**: `school-admin-frontend/src/`
- **Docker Compose**: `docker-compose.yml`

### 登录信息
- 用户名: `testuser`
- 密码: （参考 PM 获取）
- 方式: OTP 认证（登录→获取OTP→验证OTP→获取 access_token）
- 用户ID: `98d9b050-39b6-4d06-9fa9-12ef655b13e5`

---

## 📋 我的工作过 & 我知道的 Bug 背景

### 2026-07-11 — #218 #219: 学生管理筛选 Bug 修复

**Issue #218: 班级下拉框空白**
- **根因**:
  1. 前端 `StudentPage.tsx` 传 `className`（字符串），后端 DTO `StudentQueryDto` 定义的是 `class_id`（UUID）
  2. `ValidationPipe` 的 `whitelist: true` 静默丢弃 `className` 参数
  3. 数据库种子数据使用 UUID v1（如 `00000001-0001-0001-0001-000000000001`），后端 `@IsUUID()` 不接受 UUID v1
- **修复**:
  1. 前端: dropdown `<option value={c.id}>`（原来是 `value={c.name}`）
  2. 前端: fetch 参数 `if (classFilter) params.append('class_id', classFilter)`（原来是 `className`）
  3. 后端 DTO: `@IsUUID()` → `@IsOptional() @IsString()`（因为后端用 raw SQL 查询，不依赖 UUID 验证）
- **涉及文件**: `StudentPage.tsx`, `student.dto.ts`
- **验证方法**: 用 access_token 请求 `?class_id=00000001-0001-0001-0001-000000000001` 应返回该班学生

**Issue #219: 状态筛选不工作**
- **根因**: 前端源码已有 `if (statusFilter) params.append('status', statusFilter)` 逻辑，但**已部署的 JS 是旧版本**，没有这部分代码
- **修复**: 重新构建前端并部署 (`vite build` → `docker cp`)
- **注意**: 这个 bug 是"代码改了但没重新构建"的问题，不是代码错误

### 2026-07-03 — 测试环境刷新
- 下载最新代码从 v1.5.4 到 v1.5.5
- 修复 `student.entity.ts` 循环依赖
- 后端重新编译部署至容器
- 前端重新构建并部署(使用 `vite build` 配合 `docker cp`)
- 数据库迁移同步 (21个migrations)

### 之前已知的教训
- 前端不传数据时，JS不报错，只是fetch不到数据→页面空白
- 在容器中无法git pull（容器装的是构建产物），需要在宿主机操作
- Docker Hub在中国受限，无法`docker build`，用`docker cp`替代

---

## 🛠 我的工具和工作流程

### 构建部署命令（必须记住）
```bash
# 构建前端
cd /workspace/school-admin-system/school-admin-frontend && npx vite build

# 部署前端到容器
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/

# 后端重新编译
cd /workspace/school-admin-system && npx nest build
docker cp dist/. school-admin-backend:/app/dist/
# 重启后端
docker restart school-admin-backend
```

### Dashboard 更新（每次 spawn 必须做）
```bash
# 任务开始时
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "开始修复 Issue #XXX" \
  --type received --status running

# 任务完成时
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "Issue #XXX 修复完成" \
  --type done --status idle
```

### 验证测试方法（用 Python 脚本避免 shell 转义问题）
```python
import subprocess, json

# 1. 登录获取 token
login = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/login",
    "-H", "Content-Type: application/json",
    "-d", '{"username":"testuser","password":"***"}'
]))
temp_token, session_id, otp = login["temp_token"], login["sessionId"], login["otpCode"]

# 2. 验证 OTP
verify = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/verify-otp",
    "-H", "Content-Type: application/json",
    "-d", json.dumps({"sessionId": session_id, "code": otp, "tempToken": temp_token, "otpType": login["otpType"]})
]))
token = verify["access_token"]

# 3. 测试 API
r = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/students?class_id=...&page=1&pageSize=5",
    "-H", f"Authorization: Bearer {token}"
]))
```

---

## ⚡ spawn 时我应该做什么

每次被 PM 唤醒后，我应当：

1. **读我的 MEMORY.md** — 了解项目上下文和我过去的经验
2. **读 AGENTS.md 里的通信规则** — 确认最新规则
3. **读 PM 的 task** — 理解任务要求
4. **记录 received 到 Dashboard**
5. **开始工作**
6. **完成后更新 MEMORY.md** — 记录新学到的经验
7. **记录 done 到 Dashboard**

---

## 📝 如何更新本文件

每次完成任务后：
1. 在 `## 📋 我的工作过` 下面追加新的工作记录
2. 更新任何变化的知识（URL、端口、配置等）
3. 如果学到了新的教训，添加到"教训"部分
