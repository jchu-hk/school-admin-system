# QA Agent - 长期记忆

*上次更新: 2026-07-11*

---

## 🧠 我的身份

我是 **QA Agent** — 质量保证。我负责测试 PM 分配的 Issue，编写测试用例，执行测试并报告结果。

**汇报对象**: PM
**协作对象**: DEV（接收移交的代码进行测试）

---

## 📚 项目上下文

### School Admin System
- **前端 URL（测试环境）**: `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/`
- **后端 API（直接）**: `http://localhost:3000/api/`
- **登录**: OTP 认证，用户名 `testuser`
- **账户类型**: `system_admin`

### 关键架构
- Coze 代理: `/school-admin/` → `localhost:8080`, `/school-admin/api/` → `localhost:3000/api/`
- 前端 basename: `/school-admin`

---

## 📋 我的工作记录

## 📋 我的工作记录

### Test-03 回归测试 (2026-07-11)
**目标**: 对7个修复缺陷做验收测试

| # | 缺陷 | 结果 | 备注 |
|---|------|------|------|
| #224 | 学生出勤概览→人工录入 | ✅ PASSED | 点击人工录入按钮正常跳转 |
| #229 | 人工录入→日期下拉 | ✅ PASSED | 改变日期后标签更新，数据刷新 |
| #227 | 人工录入→重置按钮 | ✅ PASSED | 修改状态后点击重置恢复为"出席" |
| #225 | 用户管理→搜索/下拉 | ✅ PASSED (第二轮) | 搜索功能修复验证通过，9项测试全部通过 |
| #228 | 人工录入→日期标签 | ✅ PASSED | "📅 出勤日期: YYYY-MM-DD"正常显示 |
| #226 | 资产管理→加载 | ✅ PASSED | GET /api/asset 返回 HTTP 200 |
| #230 | 资产管理→添加保存 | ✅ PASSED | POST 创建资产返回 HTTP 201 |

**第二轮验收详情 (#225 搜索功能修复)**:
- DEV 在 dist 层部署了修复：`findAll()` 新增 `keyword` 参数，service 层实现 `LIKE %keyword%` 模糊匹配
- 测试项：
  1. ✅ 无keyword返回全部166用户
  2. ✅ keyword=test → 127匹配
  3. ✅ keyword=测试 → 8匹配（中文搜索）
  4. ✅ keyword=系统 → 1匹配（admin/系统管理员）
  5. ✅ keyword=小红 → 1匹配（李小红, 按name搜索）
  6. ✅ keyword=zzznoonexists → 0结果
  7. ✅ 搜索+分页 (limit=5, page=1)
  8. ✅ 搜索+分页 (page=2)
  9. ✅ 搜索+角色组合筛选
- **注意**: 源`.ts`文件未同步更新，但运行的编译JS已包含修复

---

## 🛠 测试工作流

### 获取 API Token
```python
import subprocess, json
login = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/login",
    "-H", "Content-Type: application/json",
    "-d", '{"username":"testuser","password":"***"}'
]))
verify = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/verify-otp",
    "-H", "Content-Type: application/json",
    "-d", json.dumps({"sessionId": login["sessionId"], "code": login["otpCode"], "tempToken": login["temp_token"], "otpType": login["otpType"]})
]))
token = verify["access_token"]
```

### Dashboard 更新
```bash
# 开始测试
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "开始测试 Issue #XXX" \
  --type received --status running

# 测试通过
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "Issue #XXX 测试通过" \
  --type passed --status idle

# 测试失败
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "Issue #XXX 测试失败: [原因]" \
  --type failed --status idle
```

---

## ⚡ spawn 时我应该做什么

1. **读我的 MEMORY.md** — 了解项目上下文
2. **读 PM 的 task** — 理解测试范围
3. **记录 received 到 Dashboard**
4. **开始测试**
5. **完成后记录结果到 Dashboard**
6. **更新 MEMORY.md**
