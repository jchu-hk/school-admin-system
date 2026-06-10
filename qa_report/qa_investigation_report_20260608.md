# 测试环境问题排查报告

## 排查时间
2026-06-08

## 问题概述

根据PM反馈，测试环境存在以下5个问题：
1. 财政菜单缺失
2. 课程管理空白
3. 系统设置不能进入
4. 学生管理和请假管理跳回登录页
5. 只有仪表盘、家长查询、通知管理可用

---

## 一、问题根因分析

### 1. 财政菜单缺失 ❌

**根因**：项目代码中完全没有财政模块的实现

**具体发现**：
- `Layout.tsx` 菜单配置中没有财政菜单项
- `App.tsx` 路由中没有 `/finance` 路由
- `src/pages/` 目录下没有 `FinancePage.tsx` 文件
- `src/i18n/locales/zh-CN.ts` 中没有财政相关的翻译

**结论**：财政模块从未被开发，属于功能缺失

---

### 2. 课程管理空白 ❌

**根因**：有菜单但无对应页面和路由

**具体发现**：
- ✅ `Layout.tsx` 中有课程管理菜单：`{ label: t.nav.courseManagement, icon: BookOpen, path: '/courses' }`
- ❌ `App.tsx` 路由中没有 `/courses` 路由
- ❌ `src/pages/` 目录下没有 `CoursePage.tsx` 文件
- ✅ `src/i18n/locales/zh-CN.ts` 中有翻译：`courseManagement: '课程管理'`

**结论**：课程管理菜单存在但页面未实现，点击后可能显示404或空白

---

### 3. 系统设置不能进入 ❌

**根因**：有菜单但无对应页面和路由

**具体发现**：
- ✅ `Layout.tsx` 中有系统设置菜单：`{ label: t.nav.systemSettings, icon: Settings, path: '/settings' }`
- ❌ `App.tsx` 路由中没有 `/settings` 路由
- ❌ `src/pages/` 目录下没有 `SettingsPage.tsx` 文件
- ✅ `src/i18n/locales/zh-CN.ts` 中有翻译：`systemSettings: '系统设置'`

**结论**：系统设置菜单存在但页面未实现，点击后可能显示404或空白

---

### 4. 学生管理和请假管理跳回登录页 ⚠️

**根因**：Token验证机制问题

**具体发现**：
- ✅ `StudentPage.tsx` 和 `LeavePage.tsx` 页面组件存在且代码完整
- ✅ API Mock已配置 (`/api/users`, `/api/leaves`)
- ⚠️ **Layout.tsx** 中的Token检查逻辑：
  ```tsx
  const token = localStorage.getItem('token')
  if (!token) { window.location.href = '/login'; return null }
  ```
- ⚠️ **StudentPage.tsx** 中的API调用Token处理：
  ```tsx
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = '/login'
    return
  }
  ```
- ⚠️ **StudentPage.tsx** 中的401错误处理：
  ```tsx
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    window.location.href = '/login'
  }
  ```

**可能的触发原因**：
1. **Token过期**：登录后Token未持久化或过期
2. **Mock模式问题**：开发环境使用MSW Mock，但登录接口返回的Token可能不被其他接口认可
3. **localStorage清空**：浏览器隐私模式或手动清除存储

**建议排查方向**：
- 检查登录后Token是否正确写入localStorage
- 检查Mock API的Token验证逻辑是否统一

---

### 5. 仪表盘、家长查询、通知管理可用 ✅

**验证结果**：
- ✅ Dashboard - 完整实现，有API和Mock
- ✅ InquiryPage (家长查询) - 完整实现，有API和Mock
- ✅ NotificationPage (通知管理) - 完整实现，有API和Mock

---

## 二、缺失功能清单

| 功能模块 | 路由 | 页面组件 | API接口 | Mock数据 | 翻译 | 状态 |
|---------|------|---------|---------|---------|------|------|
| 财政管理 | ❌缺失 | ❌缺失 | ❌缺失 | ❌缺失 | ❌缺失 | 🔴未开发 |
| 课程管理 | ❌缺失 | ❌缺失 | ❌缺失 | ❌缺失 | ✅有 | 🟡部分 |
| 系统设置 | ❌缺失 | ❌缺失 | ❌缺失 | ❌缺失 | ✅有 | 🟡部分 |
| 学生管理 | ✅有 | ✅有 | ✅有 | ✅有 | ✅有 | 🟢完整* |
| 请假管理 | ✅有 | ✅有 | ✅有 | ✅有 | ✅有 | 🟢完整* |
| 仪表盘 | ✅有 | ✅有 | ✅有 | ✅有 | ✅有 | 🟢完整 |
| 家长查询 | ✅有 | ✅有 | ✅有 | ✅有 | ✅有 | 🟢完整 |
| 通知管理 | ✅有 | ✅有 | ✅有 | ✅有 | ✅有 | 🟢完整 |

> *学生管理和请假管理存在但可能有Token验证问题

---

## 三、代码问题详情

### App.tsx 路由配置（当前）
```tsx
<Route path="/" element={<Layout />}>
  <Route index element={<Navigate to="/dashboard" replace />} />
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="students" element={<StudentPage />} />
  <Route path="leaves" element={<LeavePage />} />
  <Route path="inquiries" element={<InquiryPage />} />
  <Route path="notifications" element={<NotificationPage />} />
  {/* ❌ 缺少 /courses, /settings, /finance */}
</Route>
```

### Layout.tsx 菜单配置（当前）
```tsx
const navItems = [
  { label: t.nav.dashboard, icon: LayoutDashboard, path: '/dashboard' },
  { label: t.nav.studentManagement, icon: Users, path: '/students' },
  { label: t.nav.leaveManagement, icon: Calendar, path: '/leaves' },
  { label: t.nav.parentInquiry, icon: MessageCircle, path: '/inquiries' },
  { label: t.nav.notificationManagement, icon: Bell, path: '/notifications' },
  { label: t.nav.courseManagement, icon: BookOpen, path: '/courses' },  // ❌ 无对应路由
  { label: t.nav.systemSettings, icon: Settings, path: '/settings' },   // ❌ 无对应路由
  // ❌ 缺少财政菜单
]
```

---

## 四、建议修复方案

### 优先级1：修复路由和页面缺失（影响基本使用）

1. **添加课程管理页面**
   - 创建 `src/pages/CoursePage.tsx`
   - 在 `App.tsx` 添加 `<Route path="courses" element={<CoursePage />} />`
   - 创建课程相关API接口和Mock数据

2. **添加系统设置页面**
   - 创建 `src/pages/SettingsPage.tsx`
   - 在 `App.tsx` 添加 `<Route path="settings" element={<SettingsPage />} />`
   - 创建设置相关API接口和Mock数据

3. **从菜单移除或隐藏未实现的功能**
   - 暂时注释掉 `Layout.tsx` 中的课程管理和系统设置菜单项
   - 或添加 "开发中" 标签避免用户困惑

### 优先级2：修复Token验证问题（影响现有功能）

1. **检查登录流程**
   - 验证登录后Token是否正确写入localStorage
   - 检查Token格式是否统一

2. **统一Mock API的Token验证**
   - 在 `src/mocks/handlers.ts` 中添加统一的Token验证逻辑
   - 确保所有受保护接口都验证Token

3. **添加Token刷新机制**
   - 实现自动刷新Token逻辑
   - 添加Token过期提醒

### 优先级3：开发财政模块（新功能开发）

1. **设计财政模块功能**
   - 明确财政管理的具体功能（收费、支出、报表等）

2. **实现财政模块**
   - 创建 `src/pages/FinancePage.tsx`
   - 在 `App.tsx` 添加路由
   - 在 `Layout.tsx` 添加菜单
   - 添加翻译
   - 创建API和Mock数据

### 快速修复方案（临时）

如果急需演示，可以：
1. 创建空的 `CoursePage.tsx` 和 `SettingsPage.tsx` 组件，显示"功能开发中"
2. 检查并修复Mock登录逻辑，确保Token持久化
3. 暂时从菜单中移除财政选项

---

## 五、文件清单

### 需要创建的文件
```
src/pages/CoursePage.tsx       # 课程管理页面
src/pages/SettingsPage.tsx     # 系统设置页面
src/pages/FinancePage.tsx      # 财政管理页面
src/api/course.ts              # 课程API
src/api/settings.ts            # 设置API
src/api/finance.ts             # 财政API
```

### 需要修改的文件
```
src/App.tsx                    # 添加缺失的路由
src/components/Layout.tsx      # 添加财政菜单（可选）
src/mocks/handlers.ts          # 添加新API的Mock
src/mocks/handlers/course.ts   # 课程Mock
src/mocks/handlers/settings.ts # 设置Mock
src/mocks/handlers/finance.ts  # 财政Mock
src/i18n/locales/zh-CN.ts      # 添加财政翻译
src/i18n/locales/zh-TW.ts      # 添加财政翻译
src/i18n/locales/en.ts         # 添加财政翻译
```

---

## 六、结论

测试环境的问题主要由两部分组成：

1. **功能缺失**：财政、课程管理、系统设置三个模块未完全实现
2. **Token验证问题**：学生管理和请假管理可能因Token问题导致跳回登录页

建议按优先级逐步修复，先解决影响现有功能使用的问题，再开发新功能。
