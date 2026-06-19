# HEARTBEAT.md — 项目全景状况

**更新时间**: 2026-06-19 12:45

---

## 🎯 核心模块完成度

| 模块 | 状态 | 完成度 |
|------|------|--------|
| 用户管理 | ✅ | 100% |
| 认证授权 | ✅ | 100% |
| 出勤管理 | ✅ | 100% |
| 学费管理 | ✅ | 100% |
| 家长密码 | ✅ | 100% |
| 学生资助 | ✅ | 100% |
| 病假AI核验 | ✅ | 95% |
| 课程管理 | ⚠️ | 60% |
| 请假管理 | ⚠️ | 70% |

---

## 🔴 当前阻塞问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| Courses表缺列 | 课程API 500错误 | P0 |
| Leaves表缺列 | 请假API 500错误 | P0 |

---

## 📋 当前工作

| 任务 | 状态 |
|------|------|
| 修复Courses/Leaves表 | 🔄 进行中 |
| Issue #104 AI边界Bug | 🔄 进行中 |

---

## 📊 完整全景图

详细查看: `docs/pm/PROJECT-DASHBOARD.md`

---

## 查询命令

```bash
# 查看所有Open Issues
gh issue list --state open

# 查看P0/P1 Issues
gh issue list -l p0
gh issue list -l p1

# 查看Releases
gh release list
```
