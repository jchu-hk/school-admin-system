# CR-20260714-001 测试用例 - QR考勤模块

> 创建日期：2026-07-14
> 状态：已就绪
> 关联需求: #T20

## 前置条件

- [x] QR码生成API已实现
- [x] 扫码签到API (POST /attendance/qr/scan) 已实现
- [x] 日报生成cron任务已实现
- [x] 离线缓存机制已实现
- [x] 防重复签到逻辑已实现
- [x] 防重放（nonce）机制已实现
- [x] 离线同步API (POST /attendance/qr/sync-batch) 已实现

## 环境配置

| 项目 | 值 |
|------|-----|
| Base URL | `http://localhost:4000` |
| QR展示页 | `/attendance/qr` |
| 扫码页 | `/attendance/scan` |
| 测试学生账号 | `student_test_001` |
| 测试教职工账号 | `teacher_test_001` |

---

## 1. 正常流程测试

### TC-001 (QR-01): 学生成功生成QR码

| 项目 | 内容 |
|------|------|
| ID | QR-01 |
| 标题 | 学生成功生成QR码 |
| 端点 | GET /attendance/qr/generate |
| 前置条件 | 学生已登录 `student_test_001`；当天无签到记录 |
| 步骤 | 1. 打开QR展示页 `/attendance/qr`<br>2. 页面自动请求生成 QR 码<br>3. 观察倒计时及QR码显示 |
| 期望结果 | 返回 HTTP 200；响应体中包含 `qr_data`, `nonce`, `expires_at`；页面显示 QR 码图片及30秒倒计时器 |
| 优先级 | P0 |

```bash
# curl 测试
curl -s -X GET http://localhost:4000/attendance/qr/generate \
  -H "Authorization: Bearer <student_token>" | jq .
# 期望输出结构:
# { "qr_data": "data:image/png;base64,...", "nonce": "uuid-string", "expires_at": "2026-07-14T07:01:00+08:00" }
```

### TC-002 (QR-02): 教职工扫码签到成功

| 项目 | 内容 |
|------|------|
| ID | QR-02 |
| 标题 | 教职工扫码签到成功 |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 学生 `student_test_001` 已生成有效 QR 码（含 nonce）；教职工 `teacher_test_001` 已登录 |
| 步骤 | 1. 教职工打开扫码页 `/attendance/scan`<br>2. 扫描学生 QR 码<br>3. 调用 scan API |
| 期望结果 | 返回 HTTP 200；响应体包含学生信息：`{ "student_id": "...", "name": "...", "class_name": "...", "sign_time": "..." }` |
| 优先级 | P0 |

```bash
# curl 测试
curl -s -X POST http://localhost:4000/attendance/qr/scan \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "<base64_qr_data>", "nonce": "<nonce_from_qr>"}' | jq .
```

### TC-003 (QR-03): 日报自动生成

| 项目 | 内容 |
|------|------|
| ID | QR-03 |
| 标题 | 日报自动生成 |
| 端点 | (cron任务) |
| 前置条件 | 当天有班级签到记录（若干学生已签到，若干学生未签到） |
| 步骤 | 1. 等待系统 cron 在 18:00 执行<br>2. 查询日报记录 |
| 期望结果 | 日报已生成；日报显示应签到人数、实际签到人数、缺勤学生名单；数据格式符合业务规范 |
| 优先级 | P1 |

```bash
# 验证日报
curl -s -X GET http://localhost:4000/attendance/daily-report \
  -H "Authorization: Bearer <admin_token>" | jq .
```

---

## 2. 异常流程测试

### TC-004 (QR-04): 已签到再次生成QR

| 项目 | 内容 |
|------|------|
| ID | QR-04 |
| 标题 | 已签到再次请求生成QR码 |
| 端点 | GET /attendance/qr/generate |
| 前置条件 | 学生 `student_test_001` **当天已成功签到** |
| 步骤 | 1. 学生登录<br>2. 打开QR展示页 `/attendance/qr`<br>3. 页面尝试请求生成QR码 |
| 期望结果 | 返回 HTTP 200 或 409；页面**不生成新QR码**；显示提示信息 "今日已签到"，并附签到时间 |
| 优先级 | P0 |

```bash
curl -s -X GET http://localhost:4000/attendance/qr/generate \
  -H "Authorization: Bearer <student_token>" | jq .
# 期望响应: { "status": "already_signed", "signed_at": "2026-07-14T07:30:00+08:00", "message": "今日已签到" }
```

### TC-005 (QR-05): 同一QR码二次扫码

| 项目 | 内容 |
|------|------|
| ID | QR-05 |
| 标题 | 同一QR码被二次扫码 |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 学生QR码已成功签到一次（同 nonce 已被使用） |
| 步骤 | 1. 教职工（可同人或另一人）再次扫描同一 QR 码<br>2. 调用 scan API 传入相同 nonce |
| 期望结果 | 返回 HTTP 409 Conflict；响应含 `"code": "DUPLICATE_SIGN"`；提示"该学生今日已签到" |
| 优先级 | P0 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/scan \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "<same_qr_data>", "nonce": "<used_nonce>"}' | jq .
# 期望: HTTP 409, { "error": "DUPLICATE_SIGN", "message": "该学生今日已签到" }
```

### TC-006 (QR-06): 过期QR码扫码

| 项目 | 内容 |
|------|------|
| ID | QR-06 |
| 标题 | 过期QR码扫码 |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 学生生成QR码后等待超过30秒（或直接使用 expires_at 已过期的 nonce） |
| 步骤 | 1. 教职工扫描已过期的 QR 码<br>2. 调用 scan API |
| 期望结果 | 返回 HTTP 400 Bad Request；响应含 `"code": "QR_EXPIRED"`；提示"QR码已过期，请刷新后重试" |
| 优先级 | P1 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/scan \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "<expired_qr>", "nonce": "<expired_nonce>"}' | jq .
# 期望: HTTP 400, { "error": "QR_EXPIRED", "message": "QR码已过期，请刷新后重试" }
```

### TC-007 (QR-07): 伪造QR码扫码

| 项目 | 内容 |
|------|------|
| ID | QR-07 |
| 标题 | 伪造QR码扫码 |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 无（无需有效QR码） |
| 步骤 | 1. 教职工扫描伪造（篡改数据/随意生成）的 QR 码<br>2. 调用 scan API 传入伪造的 nonce 和 qr_data |
| 期望结果 | 返回 HTTP 400 Bad Request；响应含 `"code": "INVALID_QR"`；提示"无效的QR码"；同时系统记录安全日志（包括源IP、时间、用户ID） |
| 优先级 | P1 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/scan \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "fake_qr_data", "nonce": "fake-nonce-12345"}' | jq .
# 期望: HTTP 400, { "error": "INVALID_QR", "message": "无效的QR码" }
```

---

## 3. 离线/同步测试

### TC-008 (QR-08): 离线签到缓存

| 项目 | 内容 |
|------|------|
| ID | QR-08 |
| 标题 | 离线签到本地缓存 |
| 端点 | (前端离线逻辑) |
| 前置条件 | 学生已生成有效 QR 码；教职工设备网络可用 |
| 步骤 | 1. 教职工扫码签到<br>2. scan API 请求发起后**网络断开**（模拟离线）<br>3. 检查 LocalStorage 或 IndexedDB |
| 期望结果 | 签到数据被缓存到 LocalStorage / IndexedDB；缓存结构包含 student_id, nonce, scan_time, retry_count 等字段 |
| 优先级 | P1 |

### TC-009 (QR-09): 离线数据同步成功

| 项目 | 内容 |
|------|------|
| ID | QR-09 |
| 标题 | 离线数据同步到服务端 |
| 端点 | POST /attendance/qr/sync-batch |
| 前置条件 | 本地有一批离线缓存的签到记录（至少2条） |
| 步骤 | 1. 恢复网络连接<br>2. 调用 sync-batch API 批量提交离线缓存数据 |
| 期望结果 | 返回 HTTP 200；响应体包含 `"synced_count"`（成功数）及 `"failed_count"`（失败数）；服务端可查到所有成功同步的签到记录 |
| 优先级 | P1 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/sync-batch \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"student_id": "S001", "nonce": "n1", "scan_time": "2026-07-14T07:00:00+08:00"},
      {"student_id": "S002", "nonce": "n2", "scan_time": "2026-07-14T07:01:00+08:00"}
    ]
  }' | jq .
# 期望: { "synced_count": 2, "failed_count": 0 }
```

### TC-010 (QR-10): 同步含重复数据

| 项目 | 内容 |
|------|------|
| ID | QR-10 |
| 标题 | 离线同步含已存在的签到记录 |
| 端点 | POST /attendance/qr/sync-batch |
| 前置条件 | `student_id=S001` 的签到记录已存在于服务端；local 缓存包含 S001 的签到数据 |
| 步骤 | 1. 调用 sync-batch API<br>2. 提交包含 S001（已存在）和 S003（新）两条记录 |
| 期望结果 | 返回 HTTP 200；`synced_count` 为1（仅 S003 成功）；`failed_count` 为1（S001 重复）；响应中 `failed_records` 数组包含 S001 及错误标记 `"DUPLICATE"` |
| 优先级 | P2 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/sync-batch \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"student_id": "S001", "nonce": "n1", "scan_time": "2026-07-14T06:50:00+08:00"},
      {"student_id": "S003", "nonce": "n3", "scan_time": "2026-07-14T07:10:00+08:00"}
    ]
  }' | jq .
# 期望: { "synced_count": 1, "failed_count": 1,
#          "failed_records": [{"student_id": "S001", "reason": "DUPLICATE"}] }
```

---

## 4. 安全测试

### TC-011 (QR-11): 学生角色调用scan API

| 项目 | 内容 |
|------|------|
| ID | QR-11 |
| 标题 | 学生角色扫码操作 |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 使用 **学生角色 token** 调用 scan API；提供有效 QR 数据 |
| 步骤 | 1. 学生 token 登录<br>2. POST /attendance/qr/scan 传入合法 QR 数据 |
| 期望结果 | 返回 HTTP 403 Forbidden；响应含 `"code": "FORBIDDEN"`；提示"无签到操作权限" |
| 优先级 | P0 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/scan \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "any", "nonce": "any"}' | jq .
# 期望: HTTP 403
```

### TC-012 (QR-12): 非教职工角色冒充扫码

| 项目 | 内容 |
|------|------|
| ID | QR-12 |
| 标题 | 非教职工用户扫码签到 |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 使用其他非教职工角色（如家长、访客）的 token |
| 步骤 | 1. 非教职工 token 登录<br>2. 调用 scan API（带上有效或任意 QR 数据） |
| 期望结果 | 返回 HTTP 403 Forbidden；响应含 `"code": "FORBIDDEN"`；角色权限拦截正常工作 |
| 优先级 | P1 |

### TC-013 (QR-13): Nonce 重放攻击

| 项目 | 内容 |
|------|------|
| ID | QR-13 |
| 标题 | 同一 nonce 再次使用（重放攻击） |
| 端点 | POST /attendance/qr/scan |
| 前置条件 | 某 nonce 值已被成功使用过（签到成功，服务端已记录该 nonce 为已消费） |
| 步骤 | 1. 教职工（可同人或另一人）构造包含同一 nonce 的请求<br>2. POST /attendance/qr/scan 再次提交 |
| 期望结果 | 返回 HTTP 400 Bad Request；响应含 `"code": "NONCE_REUSED"`；提示"QR码已被使用" |
| 优先级 | P0 |

```bash
curl -s -X POST http://localhost:4000/attendance/qr/scan \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "<data>", "nonce": "<already_used_nonce>"}' | jq .
# 期望: HTTP 400, { "error": "NONCE_REUSED", "message": "QR码已被使用" }
```

---

## 测试顺序

1. **QR-01** (生成QR码) → 基础流程
2. **QR-02** (扫码签到) → 核心功能
3. **QR-11** (学生扫码越权) → 权限验证
4. **QR-13** (Nonce重放攻击) → 安全基线
5. **QR-04** (重复签到) → 业务校验
6. **QR-05** (二次扫码) → 幂等性验证
7. **QR-06** (过期QR) → 过期校验
8. **QR-07** (伪造QR) → 安全校验
9. **QR-12** (非教职工扫码) → 角色权限
10. **QR-08** (离线缓存) → 离线能力
11. **QR-09** (批量同步) → 同步功能
12. **QR-10** (同步含重复) → 同步幂等
13. **QR-03** (日报生成) → 后续验证

---

## 附录

### A. 测试数据准备

```sql
-- 测试学生
INSERT INTO students (id, student_id, name, gender, class_id)
VALUES (1001, 'S001', 'QR测试学生', 'male', 1);

-- 测试教职工
INSERT INTO staff (id, staff_id, name, role)
VALUES (2001, 'T001', 'QR测试教职工', 'teacher');
```

### B. 检查清单

- [ ] QR-01: QR码生成含30秒过期时间
- [ ] QR-02: 扫码成功后签到记录写入数据库
- [ ] QR-03: 日报cron在18:00执行，包含完整统计
- [ ] QR-04: 已签到页面显示提示而非新QR
- [ ] QR-05: 同nonce二次扫码返回409
- [ ] QR-06: 过期QR返回400
- [ ] QR-07: 伪造QR返回400+安全日志
- [ ] QR-08: 离线数据正确缓存到本地
- [ ] QR-09: sync-batch正确写入服务端
- [ ] QR-10: sync-batch处理重复记录返回部分成功
- [ ] QR-11: 学生角色无法调用scan API
- [ ] QR-12: 非教职工角色扫码返回403
- [ ] QR-13: 已消费nonce再次使用返回400
