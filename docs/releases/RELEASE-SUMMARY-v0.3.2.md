# 📦 Release v0.3.2 - 完整变更总结

**发布日期**: 2026-06-18
**Release**: https://github.com/jchu-hk/school-admin-system/releases/tag/v0.3.2

---

## 🎉 本次Release包含的功能

### 1. Issue #99 - 出勤学生证二维码扫码签到 (P0)
**v0.2.2**

- **后端API** (5个端点):
  - `POST /api/attendances/mobile/scan` - 扫码签到
  - `GET /api/attendances/mobile/classes` - 获取班级列表
  - `GET /api/attendances/mobile/class/:id/students` - 获取学生列表
  - `POST /api/attendances/mobile/batch` - 批量提交
  - `POST /api/attendances/qrcode/generate` - 生成二维码

- **前端页面**: `AttendanceMobilePage.tsx`
  - 移动端H5页面
  - 扫码签到功能 (html5-qrcode)
  - 手动签到模式
  - 离线缓存支持

- **数据库**: 
  - `attendances`表新增`sync_source`, `sync_status`列

### 2. Issue #98 - 学费分期付款管理 (P0)
**v0.3.0**

- **后端API** (8个端点):
  - `POST /api/tuition/installment/apply` - 申请分期
  - `GET /api/tuition/installment/:planId` - 获取分期详情
  - `GET /api/tuition/installment/student/:studentId` - 学生分期列表
  - `PATCH /api/tuition/installment/:planId/status` - 更新状态
  - `POST /api/tuition/installment/:planId/review` - 审核分期
  - `GET /api/tuition/payments/sub-status` - 欠费子状态
  - `POST /api/tuition/payments/:id/dispute` - 发起争议
  - `POST /api/tuition/payments/:id/dispute/resolve` - 解决争议

- **数据库**:
  - `installment_plans` - 分期计划表
  - `installment_schedules` - 还款计划表
  - `installment_plan_reviews` - 审核记录表

- **功能**:
  - 等额均分金额计算
  - 审核流程 (FINANCE_STAFF审核)
  - 状态转换矩阵
  - 逾期/争议管理

### 3. Issue #100 - 家长密码设置流程 (P0)
**v0.3.1**

- **安全机制**:
  - 账户锁定 (5次失败/30分钟)
  - bcrypt saltRounds=12
  - 密码历史验证 (最近3个)
  - OTP有效期 (5分钟/3次尝试/每日10次上限)
  - 临时密码 (15分钟一次性)

- **后端API** (7个端点):
  - `POST /api/auth/set-password` - 设置密码
  - `GET /api/auth/password-status` - 密码状态
  - `POST /api/auth/request-reset-otp` - 请求重置OTP
  - `POST /api/auth/reset-password` - OTP重置密码
  - `POST /api/auth/link-student` - 关联学生
  - `DELETE /api/auth/link-student/:id` - 解除关联
  - `GET /api/auth/linked-students` - 已关联学生

- **前端页面**:
  - `SetPasswordPage.tsx` - 设置密码
  - `LinkStudentPage.tsx` - 关联学生
  - 实时密码强度提示
  - 二次确认弹窗

### 4. Issue #101 - 学生资助资格字段 (P0)
**v0.3.2**

- **数据库字段**:
  - `subsidy_eligibility` - 资助资格枚举
  - `subsidy_start_date` - 资助开始日期
  - `subsidy_end_date` - 资助结束日期
  - `subsidy_certificate_no` - 资助证明编号

- **前端**:
  - StudentPage.tsx 新增资助信息编辑

---

## 🔧 修复的问题

| Issue | 问题 | 修复 |
|--------|------|------|
| #103 | UUID校验缺失 | 添加ParseUUIDPipe |
| #103 | 数据库列名不匹配 | 添加@Column显式映射 |
| #98 | N+1查询 | 添加relations预加载 |
| #98 | 逾期天数计算Bug | 修正dueDate计算 |
| #100 | setPassword绕过锁定 | 记录失败尝试 |
| #100 | resetPassword枚举用户 | 返回模糊消息 |
| #100 | linkStudent无验证 | verifiedAt改为null |

---

## 📊 质量审核统计

| 指标 | 数量 |
|------|------|
| 总Issues | 4个P0 |
| Design审核 | 8轮 |
| Code审核 | 6轮 |
| QA测试 | 6轮 |
| 发现的Bug | 12个 |
| 安全漏洞修复 | 5个 |

---

## 🚀 技术改进

- **前端**: React + TypeScript + Vite
- **后端**: NestJS + TypeORM
- **数据库**: PostgreSQL + Redis
- **测试**: 18个单元测试通过
- **Docker**: 多阶段构建优化

---

## 📥 下载

```bash
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system
git checkout v0.3.2
```

---

## 🔄 每日发布计划

**时间**: 每天 19:00
**内容**: 检查新commit，自动发布Release

**脚本位置**: `scripts/daily-release.sh`

---
