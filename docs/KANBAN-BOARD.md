# 进度看板

本文档定义项目进度看板的列、字段和使用规范。

---

## 📋 GitHub Project Board

**🔗 链接：** https://github.com/users/jchu-hk/projects/1

**创建时间：** 2026-06-09 10:23 GMT+8

**Token配置：** ✅ 已配置 GitHub PAT（2026-06-09 11:15）

**看板模式：** Board（看板）
**列定义：**
- 📥 Todo（待办）
- 🔨 In Progress（开发中）
- ✅ Done（已完成）

**当前状态：** 11个Issues已添加并配置完成（2026-06-09 11:45）

---

## 列定义

| 列名 | 状态 | 说明 |
|------|------|------|
| 📥 待办（Backlog） | Backlog | 待处理的功能和任务，已排期但未开始 |
| 🔨 开发中（In Progress） | In Progress | 正在开发的功能，至少有一个开发者正在工作 |
| ✅ 已完成（Done） | Done | 开发完成，待QA测试 |
| 🐛 测试中（Testing） | Testing | QA测试中，发现缺陷会退回到"开发中" |
| 🚀 已发布（Released） | Released | 已发布到生产环境 |

---

## 卡片字段

每个任务卡片包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 功能名称 | 文本 | ✓ | 任务标题 |
| 优先级 | 单选 | ✓ | P0/P1/P2/P3 |
| 负责人 | 人员 | ✓ | 主要负责人 |
| 开始日期 | 日期 | ✓ | 任务开始时间 |
| 预计完成日期 | 日期 | ✓ | 预计完成时间 |
| 状态 | 单选 | ✓ | 对应列状态 |
| GitHub Issue | 链接 | ✅ | 对应的GitHub Issue链接 |
| 关联需求 | 链接 | - | 需求文档链接 |
| 测试用例 | 链接 | - | 测试用例链接 |
| DoD检查清单 | 复选框 | - | 参考DOD标准 |

---

## 工作流规则

```
待办 → 开发中 → 已完成 → 测试中 → 已发布
             ↑                    ↑
             └────────────────────┘
                   （测试失败退回）
```

**流转规则：**

1. **待办 → 开发中**
   - 需求已评审确认
   - 已分配负责人
   - 已填写预计完成日期

2. **开发中 → 已完成**
   - 代码已完成并提交
   - 已完成自测
   - 已更新相关文档

3. **已完成 → 测试中**
   - 代码已合并到测试分支
   - 已部署到测试环境
   - 已通知QA测试

4. **测试中 → 已发布**
   - 所有测试用例通过
   - P0/P1缺陷已修复
   - PM验收通过

5. **测试中 → 开发中**（退回）
   - 测试发现缺陷
   - 在卡片中标记缺陷编号
   - 明确修复期限

---

## 优先级定义

| 级别 | 定义 | 响应时间 |
|------|------|----------|
| P0 | 紧急关键，阻塞主流程或影响核心业务 | 4小时内响应，24小时内解决 |
| P1 | 重要但不紧急，影响部分功能或体验 | 1天内响应，3天内解决 |
| P2 | 一般性需求或问题 | 3天内响应，1周内解决 |
| P3 | 优化建议、低优先级任务 | 按迭代计划安排 |

---

## 看板维护规范

1. **每日更新**：站会后更新卡片状态
2. **及时归档**：已发布的任务每周归档一次
3. **定期清理**：超过3个月未开始的"待办"任务需重新评估
4. **透明展示**：看板对所有项目成员可见

---

## 📊 当前看板状态

### 🔨 开发中（3个）

| # | 功能名称 | 优先级 | 负责人 | 开始日期 | 预计完成 | GitHub Issue |
|---|---------|--------|--------|----------|---------|--------------|
| #19 | 修复Token验证机制 | P0 | DEV3 | 2026-06-08 | 2026-06-09 | [链接](https://github.com/jchu-hk/school-admin-system/issues/19) |
| #20 | 补齐课程管理和系统设置页面 | P0 | DEV2 | 2026-06-08 | 2026-06-10 | [链接](https://github.com/jchu-hk/school-admin-system/issues/20) |
| #21 | 财政模块完全未开发 | P0 | DEV1 | 2026-06-08 | 2026-06-13 | [链接](https://github.com/jchu-hk/school-admin-system/issues/21) |

---

### 📥 待办（8个）- REQ角色任务

| # | 功能名称 | 优先级 | 负责人 | GitHub Issue |
|---|---------|--------|--------|--------------|
| #22 | 家长查询AC验收标准缺失 | P1 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/22) |
| #23 | 午膳管理独立页面设计缺失 | P1 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/23) |
| #24 | 家长自助变更微信端UI缺失 | P2 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/24) |
| #25 | 财务报销完整AC缺失 | P1 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/25) |
| #26 | ABAC规则详细示例缺失 | P1 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/26) |
| #27 | 灾难恢复操作界面设计缺失 | P2 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/27) |
| #28 | 运维仪表板详细设计缺失 | P2 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/28) |
| #29 | 家长门户整体UI严重不足 | P0 | REQ | [链接](https://github.com/jchu-hk/school-admin-system/issues/29) |

---

### ✅ 已完成（20个）

| # | 功能名称 | 优先级 | 负责人 | 完成日期 | GitHub Issue |
|---|---------|--------|--------|----------|--------------|
| #1 | substituteTeacherClassHours未实现 | P1 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/1) |
| #2 | 前端仪表盘API类型错误 | P1 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/2) |
| #3 | 前端缺少API Mock配置 | P1 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/3) |
| #4 | 前端无单元测试 | P3 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/4) |
| #5 | 深蓝色主题未配置 | P3 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/5) |
| #6 | 移动端快捷操作布局优化 | P3 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/6) |
| #7 | LeaveController缺少认证守卫 | P0 | DEV3 | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/7) |
| #8 | API路径前缀不一致 | P0 | DEV2 | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/8) |
| #9 | Dashboard模块缺失 | P0 | DEV | 2026-06-08 | [链接](https://github.com/docschool-admin-system/issues/9) |
| #10 | Notification控制器缺失 | P0 | DEV3 | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/10) |
| #11 | Inquiry模块完全缺失 | P0 | DEV2 | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/11) |
| #12 | Auth模块完全缺失 | P0 | DEV1 | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/12) |
| #13 | 登录后Token存储为'undefined'导致跳登录 | P1 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/13) |
| #14 | 学生管理页面崩溃 | P1 | DEV | 2026-06-08 | [https://github.com/jchu-hk/school-admin-system/issues/14) |
| #15 | 仪表盘多项功能缺失 | P2 | DEV | 2026-06-08 | [链接](https://github.com/jchu-hk/school-admin-system/issues/15) |
| #16 | 请假/家长查询/通知/用户管理缺少Mock | P1 | DEV | 2026-06-08 | [https://github.com/jchu-hk/school-admin-system/issues/16) |
| #17 | Auth字段不匹配 | P1 | DEV | 2026-06-08 | [https://github.com/jchu-hk/school-admin-system/issues/17) |
| #18 | 多语言模块未实现 | P2 | DEV | 2026-06-08 | [https://github.com/jchu-hk/school-admin-system/issues/18) |
| #67 | 午膳管理 F-LUNCH-001 | P1 | DEV3 | 2026-06-11 | [链接](https://github.com/jchu-hk/school-admin-system/issues/67) |
| #69 | 校车管理 F-BUS-001 | P1 | DEV3 | 2026-06-11 | [链接](https://github.com/jchu-hk/school-admin-system/issues/69) |

---

### 🐛 测试中（0个）

*暂无测试中任务*

---

### 🚀 已发布（0个）

*暂无已发布任务*

---

## 📊 统计数据

| 状态 | 数量 |
|------|------|
| **总Issues** | 31个 |
| **开放** | 9个 |
| **已关闭** | 20个 |
| **P0** | 4个（#19, #20, #21, #29）|
| **P1** | 7个（#22, #23, #25, #26, #67, #69）|
| **P2** | 2个（#24, #27, #28）|

---

## 🔄 下一步行动

**PM需要：**
1. 将GitHub Project Board中的卡片拖拽到对应列
2. **In Progress（3个）** → ✅ 已完成
3. **Backlog（8个REQ任务）** → 保持待办或调整优先级
4. **Done（20个）** → 保持已完成

**协调：**
- DEV3：处理Token验证（#19）
- DEV2：课程/设置页面（#20）
- DEV1：财政模块基础框架（#21）
- REQ：按优先级处理8个文档补充任务（#22-#29）

---

*最后更新：2026-06-11 08:10*