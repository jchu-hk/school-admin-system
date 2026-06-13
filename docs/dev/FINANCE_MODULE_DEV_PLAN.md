# 财政模块开发计划

## 一、需求概述

财政模块（F-FIN-001, F-FIN-003, F-FEE-001）负责管理学校的财务相关功能，包括：

### F-FIN-001 学费管理
- 学费标准设定（按年级、学年）
- 学生缴费记录管理
- 欠费追踪和提醒
- 电子收据生成

### F-FIN-002 零用现金报销
- 员工报销申请
- OCR收据识别
- 双人见证审批流程
- 实时推送通知

### F-FIN-003 奖学金与津贴申请
- 奖学金项目管理
- 学生申请管理
- 审批流程
- 发放记录追踪
- 预算管理

### F-FEE-001 每日收费追踪
- 各类费用项目管理（午膳、校车、课本等）
- 每日收费汇总
- 缴费状态追踪
- 电子收据推送

## 二、后端模块现状

### 已完成模块
| 模块 | 路径 | 状态 | 说明 |
|------|------|------|------|
| Tuition | apps/backend/src/modules/tuition/ | ✅ 完整 | 学费管理完整实现 |
| Fee | apps/backend/src/modules/fee/ | ✅ 完整 | 费用管理完整实现 |
| Scholarship | apps/backend/src/modules/scholarship/ | ✅ 完整 | 奖学金管理完整实现 |

### 后端API清单

#### Tuition API
```
GET    /api/tuition/standards           - 获取学费标准列表
GET    /api/tuition/standards/:id      - 获取学费标准详情
POST   /api/tuition/standards          - 创建学费标准
PATCH  /api/tuition/standards/:id      - 更新学费标准
DELETE /api/tuition/standards/:id      - 删除学费标准

GET    /api/tuition/payments           - 获取缴费记录列表
GET    /api/tuition/payments/:id      - 获取缴费记录详情
POST   /api/tuition/payments          - 创建缴费记录
PATCH  /api/tuition/payments/:id      - 更新缴费记录
POST   /api/tuition/payments/:id/pay  - 缴费

GET    /api/tuition/arrears            - 获取欠费列表
```

#### Fee API
```
GET    /api/fee/items                  - 获取费用项目列表
GET    /api/fee/items/:id             - 获取费用项目详情
POST   /api/fee/items                  - 创建费用项目
PATCH  /api/fee/items/:id             - 更新费用项目
DELETE /api/fee/items/:id             - 删除费用项目

GET    /api/fee/collections            - 获取收费记录
GET    /api/fee/collections/:id       - 获取收费详情
POST   /api/fee/collections           - 创建收费记录
PATCH  /api/fee/collections/:id       - 更新收费记录
POST   /api/fee/collections/:id/pay   - 缴费

GET    /api/fee/reductions             - 获取减免申请
POST   /api/fee/reductions            - 申请费用减免
PATCH  /api/fee/reductions/:id/approve - 审批减免申请

POST   /api/fee/ocr                   - OCR收据识别
```

#### Scholarship API
```
GET    /api/scholarships               - 获取奖学金项目列表
GET    /api/scholarships/:id          - 获取奖学金详情
POST   /api/scholarships              - 创建奖学金
PATCH  /api/scholarships/:id         - 更新奖学金
DELETE /api/scholarships/:id         - 删除奖学金

GET    /api/scholarships/:id/applications - 获取申请列表
GET    /api/scholarships/applications/:id - 获取申请详情
POST   /api/scholarships/:id/apply   - 提交申请
PATCH  /api/scholarships/applications/:id/review - 审核申请

GET    /api/scholarships/:id/disbursements - 获取发放记录
POST   /api/scholarships/disbursements    - 发放奖学金
```

## 三、前端页面现状

### 已完成页面
| 页面 | 路径 | 状态 | 说明 |
|------|------|------|------|
| FinanceTuitionPage | src/pages/FinanceTuitionPage.tsx | ✅ 新建 | 学费管理页面 |
| FinanceFeePage | src/pages/FinanceFeePage.tsx | ✅ 新建 | 费用管理页面 |
| FinanceScholarshipPage | src/pages/FinanceScholarshipPage.tsx | ✅ 新建 | 奖学金管理页面 |

### 路由配置
```
/finance/tuition      - 学费管理
/finance/fee          - 费用管理
/finance/scholarship  - 奖学金管理
```

### 导航集成
- 已在Layout组件中添加财政管理子菜单
- 支持展开/折叠子菜单

## 四、待完成功能

### 高优先级
1. **学费标准管理** - CRUD完整功能
2. **缴费记录管理** - 支持批量缴费
3. **欠费追踪** - 逾期提醒

### 中优先级
1. **OCR收据识别** - 与后端OCR接口对接
2. **电子收据推送** - 消息通知集成
3. **奖学金审批流程** - 多级审批支持

### 低优先级
1. **财务统计报表** - 数据可视化
2. **批量导入导出** - Excel集成

## 五、API对接清单

### 前端需对接的API
```typescript
// course.ts - 已创建
import { courseApi } from '../api/course';

// settings.ts - 已创建
import { settingsApi } from '../api/settings';

// tuition, fee, scholarship - 需创建
import { tuitionApi } from '../api/tuition';
import { feeApi } from '../api/fee';
import { scholarshipApi } from '../api/scholarship';
```

## 六、测试用例

### 学费管理测试
1. 创建学费标准
2. 更新学费标准
3. 删除学费标准
4. 学生缴费
5. 查看欠费列表

### 费用管理测试
1. 创建费用项目
2. OCR识别收据
3. 批量收费
4. 费用减免审批

### 奖学金管理测试
1. 创建奖学金项目
2. 学生提交申请
3. 审批申请
4. 发放奖学金
5. 查看预算使用情况

## 七、开发时间估算

| 任务 | 优先级 | 预估工时 | 负责人 |
|------|--------|----------|--------|
| 学费管理功能完善 | P0 | 4h | DEV |
| 费用管理功能完善 | P0 | 4h | DEV |
| 奖学金管理功能完善 | P0 | 4h | DEV |
| OCR收据识别对接 | P1 | 4h | DEV |
| 电子收据推送 | P1 | 2h | DEV |
| 财务统计报表 | P2 | 8h | DEV |

---
生成时间: 2026-06-13
