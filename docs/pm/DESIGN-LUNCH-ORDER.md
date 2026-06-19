# 设计文档: F-LUNCH-001 午膳订单管理

> **Issue**: #36  
> **版本**: v1.0  
> **日期**: 2026-06-19  
> **状态**: P1 开发中

---

## 1. 功能概述

本模块为学校午膳系统，提供家长自助提交午膳变更申请、供应商统计汇总、预订预测三大核心功能。

## 2. 数据库设计

### 2.1 已有表 `lunch_orders`（现有）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| student_id | UUID | 学生外键 |
| order_date | DATE | 订单日期 |
| menu_name | VARCHAR(200) | 菜品名称 |
| menu_price | DECIMAL(10,2) | 单价 |
| quantity | INT | 数量 |
| total_amount | DECIMAL(10,2) | 总金额 |
| status | ENUM | pending/confirmed/cancelled/completed |
| created_by | UUID | 创建人 |
| created_at | TIMESTAMP | 创建时间 |
| updated_by | UUID | 更新人 |
| updated_at | TIMESTAMP | 更新时间 |

### 2.2 新增表 `lunch_changes`（变更记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_id | UUID | 关联订单（可空，加单场景） |
| student_id | UUID | 学生外键 |
| change_type | ENUM | add/cancel/modify |
| original_item | VARCHAR(200) | 原菜品（modify/cancel时） |
| new_item | VARCHAR(200) | 新菜品（modify/add时） |
| new_quantity | INT | 新数量 |
| new_price | DECIMAL(10,2) | 新价格 |
| notes | TEXT | 变更备注 |
| cutoff_time | TIME | 当日截止时间（默认14:00） |
| status | ENUM | pending/approved/rejected/auto_rejected |
| reviewed_by | UUID | 审核人 |
| reviewed_at | TIMESTAMP | 审核时间 |
| reject_reason | VARCHAR(500) | 拒绝原因 |
| created_by | UUID | 申请人 |
| created_at | TIMESTAMP | 申请时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2.3 新增表 `lunch_menu`（菜单管理）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(200) | 菜品名称 |
| description | TEXT | 菜品描述 |
| price | DECIMAL(10,2) | 价格 |
| image_url | VARCHAR(500) | 图片URL |
| available_days | VARCHAR(20)[] | 可用日期数组（逗号分隔） |
| supplier | VARCHAR(200) | 供应商 |
| status | ENUM | active/inactive |
| created_by | UUID | 创建人 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 3. API 设计

### 3.1 现有端点（保留）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/lunch/orders | 获取订单列表 |
| POST | /api/lunch/orders | 创建订单 |
| GET | /api/lunch/orders/:id | 获取订单详情 |
| PUT | /api/lunch/orders/:id | 更新订单 |
| DELETE | /api/lunch/orders/:id | 删除订单 |
| POST | /api/lunch/orders/:id/confirm | 确认订单 |
| POST | /api/lunch/orders/:id/cancel | 取消订单 |
| POST | /api/lunch/orders/:id/complete | 标记完成 |
| GET | /api/lunch/stats | 统计 |
| GET | /api/lunch/settlement | 结算 |

### 3.2 新增端点

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/lunch/changes | 提交变更申请 | PARENT/TEACHER |
| GET | /api/lunch/changes | 获取变更列表 | ADMIN/STAFF |
| GET | /api/lunch/changes/:id | 获取变更详情 | ADMIN/STAFF |
| POST | /api/lunch/changes/:id/approve | 审核通过变更 | SCHOOL_STAFF |
| POST | /api/lunch/changes/:id/reject | 拒绝变更 | SCHOOL_STAFF |
| GET | /api/lunch/menu | 获取菜单列表 | ALL |
| POST | /api/lunch/menu | 创建菜单项 | SCHOOL_STAFF |
| PUT | /api/lunch/menu/:id | 更新菜单项 | SCHOOL_STAFF |
| DELETE | /api/lunch/menu/:id | 删除菜单项 | SCHOOL_STAFF |
| GET | /api/lunch/supplier-report | 供应商报表 | SCHOOL_STAFF |
| GET | /api/lunch/prediction | 预订预测 | SCHOOL_STAFF |
| GET | /api/lunch/cutoff-status | 获取当日截止状态 | ALL |

## 4. 核心业务规则

### 4.1 变更截止时间

- 默认截止时间：**每天 14:00**
- 超过截止时间提交变更 → 自动拒绝（status=auto_rejected）
- 变更类型：
  - **add**：加单，无原订单
  - **cancel**：取消已有订单
  - **modify**：更改菜品或数量

### 4.2 审核流程

```
家长提交变更 → pending
       ↓
  是否超过截止时间？
  ├─ 是 → auto_rejected（系统自动）
  └─ 否 → 等待审核
              ↓
         食堂员工审核
         ├─ 通过 → approved → 更新 lunch_orders
         └─ 拒绝 → rejected
```

### 4.3 供应商统计

- 按日期范围汇总订单数量和金额
- 按供应商分组统计
- 支持导出 CSV/PDF 格式

### 4.4 预订预测

基于最近4周的订单历史数据，预测未来一周的订单量：

```
预测方法：移动平均 + 趋势调整
- 参考数据：最近28天
- 权重：近期数据权重更高
```

## 5. Cron Job 设计

### 5.1 变更自动拒绝任务

- **表达式**：`0 14 * * *`（每天14:00执行）
- **逻辑**：查询所有 status=pending 且 created_at < 当日14:00 的变更记录，批量更新为 auto_rejected

### 5.2 截止时间前提醒

- **表达式**：`0 13 * * *`（每天13:00执行）
- **逻辑**：
  1. 查询次日有 pending 变更的家长
  2. 通过微信/飞书推送提醒消息
  3. 消息内容：「您有一条午膳变更待审核，截止时间为今日14:00」

## 6. 前端页面

### 6.1 LunchOrderPage.tsx

功能模块：
1. **订单列表**（默认视图）
   - 按日期/学生筛选
   - 状态标签（pending/confirmed/cancelled）
2. **变更申请**
   - 变更类型选择（加单/取消/更改）
   - 菜品选择器
   - 截止时间提示横幅
3. **菜单管理**（管理员视图）
   - 菜单列表维护
4. **统计报表**（管理员视图）
   - 每日/每周汇总
   - 供应商报表导出

## 7. 实现清单

- [x] lunch-change.entity.ts（变更记录实体）
- [x] lunch-menu.entity.ts（菜单实体）
- [x] lunch.dto.ts（新增变更/菜单DTO）
- [x] lunch.service.ts（新增变更/菜单/统计/预测方法）
- [x] lunch.controller.ts（新增端点）
- [x] lunch.module.ts（导入新实体）
- [x] lunch-reminder.service.ts（Cron Job提醒）
- [x] LunchOrderPage.tsx（前端页面）
- [x] App.tsx（路由注册）

## 8. 测试计划

| 用例 | 测试场景 | 预期结果 |
|------|---------|---------|
| 变更申请-正常 | 13:00提交变更 | 状态=pending |
| 变更申请-超期 | 14:01提交变更 | 状态=auto_rejected |
| 审核通过 | 变更申请→approve | 订单同步更新 |
| 供应商统计 | 查询本周数据 | 正确汇总 |
| 预订预测 | 预测下周订单 | 返回预测数量 |

## 9. 安全考虑

- 所有变更操作需家长身份验证
- 审核操作需食堂员工权限
- 敏感字段（金额）需服务端计算，前端仅展示
- 防止截止时间篡改：截止时间以服务端时间为准
