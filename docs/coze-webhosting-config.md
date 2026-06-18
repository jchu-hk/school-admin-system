# Coze Web Hosting 公网访问配置报告

## 📋 项目信息
- **项目名称**: school-admin-system
- **配置日期**: 2026-06-17
- **配置类型**: Cloudflare Tunnel (临时方案)

---

## ✅ 公网访问地址

### 前端访问地址
```
https://generation-boundaries-ordered-initiatives.trycloudflare.com
```

### 后端API访问地址
```
https://templates-headphones-lives-curious.trycloudflare.com
```

### API端点
- 健康检查: `https://templates-headphones-lives-curious.trycloudflare.com/api/health`
- API基础路径: `https://templates-headphones-lives-curious.trycloudflare.com/api/`

---

## 🔧 当前配置详情

### 端口转发映射
| 服务 | 本地端口 | 公网URL | 协议 |
|------|---------|---------|------|
| Frontend (Nginx) | 80 | https://generation-boundaries-ordered-initiatives.trycloudflare.com | HTTP/HTTPS |
| Backend API | 3000 | https://templates-headphones-lives-curious.trycloudflare.com | HTTP/HTTPS |

### 服务状态
- ✅ Frontend (Nginx): 端口80 - 运行中
- ✅ Backend API: 端口3000 - 运行中
- ✅ PostgreSQL: 端口5432 - 运行中
- ✅ Redis: 端口6379 - 运行中

---

## 🔒 安全配置

### 当前安全措施
1. **Cloudflare隧道加密**: 所有流量通过HTTPS加密传输
2. **临时URL**: 使用随机生成的子域名，降低被扫描风险
3. ** rate limiting**: Nginx配置了API限流 (30r/s)

### 安全建议
1. **访问Token**: 建议为外部协作者创建专用账号
2. **IP白名单**: 如有固定IP，可在Nginx配置中添加allow/deny规则
3. **只读访问**: 建议为测试环境配置只读数据库用户
4. **定期轮换**: Cloudflare临时URL会定期更换，需同步更新

---

## 📝 Coze Web Hosting 说明

### 关于 serveousercontent.com 地址
之前的访问地址 `https://c9953270c50b8d26-115-190-36-195.serveousercontent.com` 是Coze平台原生的Web Hosting地址。

**当前状况**:
- 该地址暂时无法通过API自动恢复
- Coze Web Hosting配置接口未在公开API文档中提供
- 已尝试的配置文件 `.coze.webhosting` 可能不会自动生效

**建议**:
1. 如需恢复原来的serveousercontent.com地址，建议通过Coze平台控制台手动配置
2. 或使用当前的Cloudflare Tunnel作为临时访问方案
3. 如需长期稳定的公网访问，建议配置自定义域名

---

## 🧪 测试验证结果

### 前端测试
```bash
curl -s https://generation-boundaries-ordered-initiatives.trycloudflare.com
```
✅ 返回200，页面正常加载，标题为"智慧校园管理系统"

### 后端API测试
```bash
curl -s https://templates-headphones-lives-curious.trycloudflare.com/api/health
```
✅ 返回 `{"status":"ok","timestamp":"2026-06-17T01:26:50.880Z"}`

### 连通性测试
- ✅ 本地服务端口80可访问
- ✅ 本地服务端口3000可访问
- ✅ Cloudflare隧道连接正常
- ✅ HTTPS证书有效

---

## 🔧 维护说明

### 查看隧道状态
```bash
ps aux | grep cloudflared
```

### 重启隧道
```bash
# 停止现有隧道
pkill cloudflared

# 重新启动前端隧道
cloudflared tunnel --url http://localhost:80 &

# 重新启动后端隧道
cloudflared tunnel --url http://localhost:3000 &
```

### 日志查看
```bash
# Cloudflare隧道日志
journalctl -u cloudflared 2>/dev/null || ps aux | grep cloudflared
```

---

## ⚠️ 注意事项

1. **临时性**: Cloudflare临时隧道没有uptime保证，适合短期测试使用
2. **URL变化**: 每次重启隧道都会生成新的URL
3. **带宽限制**: 免费账户有带宽限制
4. **OpenClaw网关**: 配置未影响OpenClaw网关正常运行 (端口5000)

---

## 📞 后续建议

如需恢复Coze原生Web Hosting地址 (serveousercontent.com):
1. 登录Coze平台控制台
2. 进入项目设置 → Web Hosting
3. 配置端口转发规则 (80→frontend, 3000→backend)
4. 获取分配的serveousercontent.com地址

或者考虑使用长期方案:
- 配置自定义域名 + Nginx反向代理
- 使用Cloudflare Tunnel with Named Tunnel (需要Cloudflare账户)
- 部署到云服务器获得固定公网IP
