# Issue #115: 仪表板出勤数据未从数据库读取

## 缺陷信息

| 字段 | 内容 |
|------|------|
| **Issue #** | #115 |
| **标题** | 仪表板出勤数据未从数据库读取 |
| **严重程度** | 🔴 **Serious** (P0) |
| **类型** | Bug |
| **发现日期** | 2026-06-21 |
| **状态** | Open |

## 问题描述

登录后在仪表板看不到任何出勤数据。经排查发现 `DashboardService.getAdminStats()` 方法**从未读取 `attendances` 表**，而是用简单的数学公式计算：

```typescript
// 当前错误逻辑 (dashboard.service.ts:130-133)
const present = Math.max(0, totalUsers - todayLeaves);
const attendanceRate = totalUsers > 0 
  ? Math.round((present / totalUsers) * 100) 
  : 0;
```

这导致：
1. ❌ 无论插入多少出勤记录，仪表板都不显示
2. ❌ 昨日插入的5条出勤记录完全没被使用
3. ❌ 所有角色（管理员/教师/家长）的出勤数据都不准确

## 影响范围

- **影响模块**: Dashboard (每日晨检仪表板)
- **影响角色**: 系统管理员、校务主任、教师、家长、学生
- **用户数**: 全部用户（约14人）

## 复现步骤

1. 登录系统 (staff1 / Admin123!)
2. 进入仪表板
3. 观察出勤率显示为 0%
4. 检查数据库：`SELECT * FROM attendances WHERE attendance_date = '2026-06-21'` 有5条记录

**预期结果**: 仪表板应显示实际出勤数据
**实际结果**: 仪表板显示 0% 出勤率

## 根因分析

`DashboardService` 应该从 `attendances` 表读取数据，但当前实现使用推算公式。

### 相关代码位置
- `/apps/backend/src/modules/dashboard/dashboard.service.ts`
  - `getAdminStats()` (行 ~130)
  - `getTeacherStats()` (行 ~200)
  - `getParentStats()` (行 ~250)
  - `getStudentStats()` (行 ~300)

## 修复方案

### 方案：直接从 Attendances 表查询

```typescript
// 修复后的 getAdminStats 方法
private async getAdminStats(today: Date, tomorrow: Date, ...): Promise<DashboardStats> {
  // 从 Attendances 表读取今日出勤数据
  const todayAttendances = await this.attendanceRepository.find({
    where: {
      attendanceDate: Between(today, tomorrow),
    },
  });

  const total = todayAttendances.length;
  const present = todayAttendances.filter(a => a.status === 'present').length;
  const late = todayAttendances.filter(a => a.status === 'late').length;
  const absent = todayAttendances.filter(a => a.status === 'absent').length;
  const leave = todayAttendances.filter(a => a.status === 'leave_early').length;

  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    todayAttendance: { total, present, absent, leave, attendanceRate },
    ...
  };
}
```

## 修复任务清单

- [ ] 修改 `DashboardService` 注入 `Attendance` Repository
- [ ] 修改 `getAdminStats()` 从数据库读取出勤数据
- [ ] 修改 `getTeacherStats()` 从数据库读取出勤数据
- [ ] 修改 `getParentStats()` 从数据库读取出勤数据
- [ ] 修改 `getStudentStats()` 从数据库读取出勤数据
- [ ] 验证修复后数据正确显示

## 修复负责人

- DEV: 待分配
- QA: 待验证

## 修复截止日期

建议：2026-06-21 (今日修复)

## 备注

相关数据已准备好：
- 数据库中有5条今日出勤记录
- 数据库中有7个班级
- 请确保修复后能正确关联班级和学生数据