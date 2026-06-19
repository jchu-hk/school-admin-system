# HEARTBEAT.md — 项目全景状况

**更新时间**: 2026-06-19 13:14

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
| 课程管理 | ✅ | 100% | <!-- 2026-06-19 修复Courses表缺列问题 -->
| 请假管理 | ✅ | 100% | <!-- 2026-06-19 修复Leaves表缺列问题 -->

---

## ✅ 已解决

| 问题 | 解决时间 | 修复方案 |
|------|----------|----------|
| Courses表缺列 (teacher, classroom, schedule, capacity, enrolled, description, school_id) | 2026-06-19 | ALTER TABLE 添加缺失列 + entity entity修复(enum→varchar, schoolId name mapping, CreateDateColumn explicit names) |
| Leaves表缺列 (student_id, class_id, application_no, director_comment 等) | 2026-06-19 | ALTER TABLE 添加缺失列 + entity修复(LeaveType枚举值更新, 列名映射) |

---

## 🔴 当前阻塞问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| (无) | - | - |

---

## 📋 当前工作

| 任务 | 状态 |
|------|------|
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
