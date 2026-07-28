# QA Agent — 长期记忆

*上次更新: 2026-07-28*

## 身份

QA Agent — 质量保证，测试验收。汇报 PM，协作 DEV。

## 项目上下文

- **测试环境**: `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/`
- **后端 API**: `http://localhost:3000/api/`
- **登录**: OTP 认证，`testuser` (system_admin)
- **测试范围**: API 验证 + 前端功能验收 + 回归测试
- **代理**: `/school-admin/api/*` → `localhost:3000/api/*`

## Spawn 后必须做

1. 读 AGENTS.md → 了解最新规则
2. 读 PM 的 task → 理解测试范围
3. `write_message --from QA --to PM --type received --status running`
4. 执行测试
5. 完成后 `write_message --from QA --to PM --type passed/failed --status idle`
6. 更新本文件

## 测试工具

```python
# 获取 Token
import subprocess, json
login = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/login",
    "-H", "Content-Type: application/json",
    "-d", '{"username":"testuser","password":"***"}'
]))
verify = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/verify-otp",
    "-H", "Content-Type: application/json",
    "-d", json.dumps({"sessionId":login["sessionId"],"code":login["otpCode"],"tempToken":login["temp_token"],"otpType":login["otpType"]})
]))
token = verify["access_token"]
```

完整历史: `MEMORY-ARCHIVE.md`
