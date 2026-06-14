# 测试环境部署指南

## 快速部署方案

### 方案1: Railway + Vercel (推荐)

**优点**: 免费、自动部署、HTTPS支持

#### 前端部署 (Vercel)
```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署
cd apps/frontend
vercel --prod
```

**访问URL**: https://school-admin-test.vercel.app

#### 后端部署 (Railway)
```bash
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录Railway
railway login

# 3. 创建项目
railway init

# 4. 配置环境变量
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret"

# 5. 部署
railway up --service backend
```

**访问URL**: https://school-admin-test.up.railway.app

---

### 方案2: ngrok (临时测试)

```bash
# 1. 启动后端
cd apps/backend
pnpm start

# 2. 在另一个终端启动ngrok
ngrok http 3000

# 3. 复制ngrok提供的URL
# 例如: https://xxxx.ngrok.io
```

---

### 方案3: 本地 + Cloudflare Tunnel (生产级)

```bash
# 1. 安装cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64

# 2. 登录Cloudflare
./cloudflared-linux-amd64 tunnel login

# 3. 创建tunnel
./cloudflared-linux-amd64 tunnel create school-admin-test

# 4. 配置config.yml
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: test.school-admin.example.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# 5. 启动tunnel
./cloudflared-linux-amd64 tunnel run
```

**访问URL**: https://test.school-admin.example.com

---

## 测试账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 校务主任 | admin@example.com | Test@123 | 全权限 |
| 校务同工 | staff@example.com | Test@123 | 操作权限 |
| 教师 | teacher@example.com | Test@123 | 查询/填报 |
| 家长 | parent@example.com | Test@123 | 查询/缴费 |

---

## 已完成功能 (可测试)

### ✅ 后端API
- [x] 学生出勤管理 (F-ATT-001)
- [x] 财政模块 - 学费/费用/奖学金 (F-FIN-001, F-FIN-003, F-FEE-001)
- [x] AI智能建议 (F-AI-001)
- [x] 权限审批 (F-PERM-001)
- [x] 自动备份 (F-BACK-001)
- [x] Leave跟进提醒 (F-LEAVE-001)
- [x] Inquiry自动回复 (F-INQ-001)

### ✅ 前端 (部分)
- [x] 登录/认证
- [x] 用户管理
- [x] 权限审批
- [ ] 出勤管理 (开发中)
- [ ] 财务模块 (开发中)

---

## 环境变量配置

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/school_admin
JWT_SECRET=your-super-secret-key-change-in-production
REDIS_URL=redis://localhost:6379
SCHOOL_APP_API_KEY=your-schoolapp-api-key
WECHAT_APP_ID=your-wechat-appid
WECHAT_APP_SECRET=your-wechat-secret

# Frontend (.env.local)
VITE_API_URL=https://school-admin-test.up.railway.app
VITE_WECHAT_APP_ID=your-wechat-appid
```

---

## 测试环境检查清单

### 部署前检查
- [ ] .env文件配置正确
- [ ] 数据库迁移已运行
- [ ] 所有依赖已安装
- [ ] 构建通过 (pnpm build)

### 部署后验证
- [ ] 访问主页成功
- [ ] 登录功能正常
- [ ] API可访问 (Swagger: /api)
- [ ] 数据库连接正常
- [ ] Redis连接正常

---

## 手动测试步骤

### 1. 出勤管理测试
```bash
# 1. 登录
POST /api/auth/login
{
  "username": "admin@example.com",
  "password": "Test@123"
}

# 2. 创建出勤记录
POST /api/attendance
{
  "date": "2026-06-15",
  "studentId": "2023S10123",
  "status": "present"
}

# 3. 查询出勤
GET /api/attendance?date=2026-06-15
```

### 2. 财政模块测试
```bash
# 1. 创建学费标准
POST /api/tuition-standards
{
  "academicYear": "2025-2026",
  "grade": "S1",
  "amount": 50000
}

# 2. 创建缴费记录
POST /api/tuition-payments
{
  "studentId": "2023S10123",
  "standardId": 1,
  "amount": 50000,
  "paymentMethod": "cash"
}

# 3. 查询缴费
GET /api/tuition-payments?studentId=2023S10123
```

### 3. AI功能测试
```bash
# AI智能建议
POST /api/ai/suggestions
{
  "context": "家长询问学费减免政策",
  "type": "inquiry"
}
```

---

## 访问URL汇总

部署完成后，在此记录URL：

| 环境 | 前端 | 后端 | 数据库 |
|------|------|------|--------|
| 测试 | (待部署) | (待部署) | Railway PostgreSQL |
| 本地 | http://localhost:5173 | http://localhost:3000 | localhost:5432 |

---

*更新时间: 2026-06-14 23:10*