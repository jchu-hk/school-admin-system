#!/bin/bash
cd /workspace/projects/workspace

echo "=== Creating GitHub Issues for reported bugs ==="

# Issue #116: 学生管理 - TypeError: e.map is not a function
echo "Creating #116..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 学生管理页面 TypeError: e.map is not a function" \
  --body '## 🐛 Bug描述

学生管理页面（StudentPage）打开后报错：

```
TypeError: e.map is not a function
```

**影响**: 学生管理页面完全无法使用，无数据显示。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**重现步骤**:
1. 以 staff1 登录
2. 进入「学生管理」页面
3. 立即报错

**可能原因**:
- API 返回格式与前端期望不匹配（双重包装 `response.data.data` 或数据为空）
- 前端对非数组数据调用 `.map()`

**优先级**: P0

**状态**: 🔄 修复中' \
  --label "bug,p0,frontend" 2>&1

# Issue #117: 用户管理 page - no users showing
echo "Creating #117..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 用户管理页面没有测试账号数据显示" \
  --body '## 🐛 Bug描述

用户管理页面（UsersPage）没有显示任何用户数据。

**影响**: 校务人员无法在用户管理页面查看和管理用户。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**重现步骤**:
1. 以 staff1 登录
2. 进入「用户管理」页面
3. 页面空白，无用户列表

**可能原因**:
- API 调用失败（数据库列名与 Entity 字段名不匹配）
- 后端 `parent_inquiries` 表不存在导致500错误

**优先级**: P0

**状态**: 🔄 修复中' \
  --label "bug,p0,frontend" 2>&1

# Issue #118: 请假管理 "申请请假" - TypeError: y.map is not a function
echo "Creating #118..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 请假管理申请请假 TypeError: y.map is not a function" \
  --body '## 🐛 Bug描述

请假管理页面点击「申请请假」按钮后报错：

```
TypeError: y.map is not a function
```

**影响**: 无法提交新的请假申请。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**重现步骤**:
1. 以 staff1 登录
2. 进入「请假管理」页面
3. 点击「申请请假」按钮
4. 报错：TypeError: y.map is not a function

**可能原因**:
- teachers API 返回数据格式与前端期望不匹配
- `LeavePage.tsx` 第869行 `teachers.map` 期望数组但收到非数组数据

**优先级**: P0

**状态**: 🔄 修复中' \
  --label "bug,p0,frontend" 2>&1

# Issue #119: 家長查詢 提交新查詢 - submission failed
echo "Creating #119..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 家长查询提交新查询失败" \
  --body '## 🐛 Bug描述

家长查询页面（ParentInquiryPage）提交新查询时报错，提交失败。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**重现步骤**:
1. 以 parent1 登录
2. 进入「家长查询」页面
3. 填写查询内容并点击提交
4. 提交失败

**可能原因**:
- 后端 `inquiry` 模块报错：`relation "parent_inquiries" does not exist`
- Inquiry Entity `@Entity("parent_inquiries")` 与实际数据库表名 `inquiries` 不匹配

**优先级**: P0

**状态**: 🔄 修复中' \
  --label "bug,p0,backend" 2>&1

# Issue #120: 家長查詢隊列管理 - filters not working
echo "Creating #120..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 家长查询队列管理筛选器不工作" \
  --body '## 🐛 Bug描述

家长查询队列管理页面的筛选器（状态、类型等）选择后不生效，列表内容不更新。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**重现步骤**:
1. 以 staff1 登录
2. 进入「家长查询」→「队列管理」
3. 选择不同的筛选条件（状态、类型）
4. 列表内容不变

**可能原因**:
- 筛选 API 调用失败（parent_inquiries 表不存在）
- 前端筛选参数未正确传递

**优先级**: P1

**状态**: 🔄 修复中' \
  --label "bug,p1,frontend" 2>&1

# Issue #121: I18n - no English for 分期付款
echo "Creating #121..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 英文模式下分期付款菜单仍显示中文" \
  --body '## 🐛 Bug描述

切换到英文模式后，「分期付款」菜单仍显示中文，未被翻译为英文 "Installments"。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**重现步骤**:
1. 打开系统
2. 切换语言为 English
3. 左侧菜单中「分期付款」仍显示中文

**根因**: `Layout.tsx` 第38行使用了硬编码中文：
```tsx
{ label: '分期付款', path: '/finance/installment' }
```

**i18n 文件已有翻译**:
- `en.ts`: `financeInstallment: '"'"'Installments'"'"'` ✅
- `zh-CN.ts`: `financeInstallment: '"'"'分期付款'"'"'` ✅

**修复方案**: 将硬编码 `'"'"'分期付款'"'"'` 改为使用 i18n key `t('menu.financeInstallment')`

**优先级**: P1

**状态**: 🔄 修复中' \
  --label "bug,p1,frontend,i18n" 2>&1

# Issue #122: Language dropdown position
echo "Creating #122..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Enhancement: 语言切换下拉框位置调整到「智慧校园」旁边" \
  --body '## ✨ 功能改进建议

**当前问题**: 语言切换下拉框位置不够明显。

**建议**: 将语言切换下拉框移到「智慧校园」标题旁边，使切换语言更加方便快捷。

**环境**: https://playing-shows-hits-phrases.trycloudflare.com

**优先级**: P2

**状态**: 📋 待处理' \
  --label "enhancement,p2,frontend" 2>&1

# Issue #123: Backend database column naming mismatch (root cause)
echo "Creating #123..."
gh issue create --repo jchu-hk/school-admin-system \
  --title "Bug: 后端数据库列名与 Entity 字段名不匹配（根因修复）" \
  --body '## 🐛 Bug描述

这是多个前端错误的根因。后端 TypeORM 配置没有设置 `namingStrategy`，导致：
- Entity 使用 camelCase 字段名（如 `hkId`, `parentId`）
- 数据库使用 snake_case 列名（如 `hk_id`, `parent_id`）
- 全部查询失败，报 `column XXX.xxx does not exist`

**受影响的功能**:
- #116 学生管理 - TypeError: e.map
- #117 用户管理 - 无数据显示
- #118 请假管理 - TypeError: y.map
- #119 家长查询提交 - 失败
- #120 家长查询队列 - 筛选不工作

**修复方案**:
在 `app.module.ts` 的 TypeOrmModule 配置中添加：
```ts
import { CamelCaseNamingStrategy } from 'typeorm-naming-strategies';
// ...
namingStrategy: new CamelCaseNamingStrategy(),
```

**注意**: `typeorm-naming-strategies` v4.x 只导出 `SnakeNamingStrategy`，需要使用 v3.x 或自定义命名策略。

**优先级**: P0（根因）

**状态**: 🔄 修复中' \
  --label "bug,p0,backend,database" 2>&1

echo ""
echo "=== Done! Listing all open issues ==="
gh issue list --repo jchu-hk/school-admin-system --state open --json number,title,labels --limit 20 2>/dev/null | python3 -c "
import sys,json
issues = json.load(sys.stdin)
for i in sorted(issues, key=lambda x: x['number']):
    labels = ','.join([l['name'] for l in i.get('labels',[])])
    print(f'#{i[\"number\"]} [{labels}] {i[\"title\"]}')
"
