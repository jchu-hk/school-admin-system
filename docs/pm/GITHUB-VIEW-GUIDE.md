# GitHub App 项目进度查看指南

**创建**: 2026-06-14
**用途**: 通过GitHub App查看项目进度

---

## 1. GitHub移动App (手机/平板)

### 下载安装
- **iOS**: App Store搜索 "GitHub"
- **Android**: Play Store搜索 "GitHub"

### 查看项目进度

#### 1.1 首页 (Home)

打开App后显示：
```
├── Notifications (通知)
├── Your repositories (你的仓库)
├── Explore (发现)
└── Settings (设置)
```

#### 1.2 查看仓库

1. 点击仓库名称 `school-admin-system`
2. 显示仓库概览

**可以看到**:
- 最近提交 (Commits)
- 最近活动
- Issues数量
- PR数量

#### 1.3 Issues (问题)

点击底部的 **Issues** tab

**查看内容**:
- 所有Open Issues列表
- 按标签筛选
- 按里程碑筛选
- 按负责人筛选

**操作**:
- 创建Issue
- 评论Issue
- 添加/移除标签
- 分配负责人
- 关闭Issue

#### 1.4 Pull Requests (合并请求)

点击 **Pull requests** tab

**查看内容**:
- 打开的PR列表
- CI状态
- 审查状态
- 合并状态

#### 1.5 Actions (工作流)

点击 **Actions** tab

**查看内容**:
- Workflow列表
- 运行状态 (成功/失败)
- 运行历史
- 运行日志

---

## 2. GitHub网页版 (电脑浏览器)

### 链接
https://github.com/jchu-hk/school-admin-system

### 2.1 Issues页面

**地址**: `https://github.com/jchu-hk/school-admin-system/issues`

**功能**:
| 功能 | 位置 | 说明 |
|------|------|------|
| 查看所有Issues | 默认 | Open Issues列表 |
| 筛选器 | 右侧边栏 | Labels, Assignees, Milestones |
| 搜索 | 顶部搜索栏 | 关键词搜索 |
| 看板视图 | Cards按钮 | 看板形式查看 |

**看板视图**:
点击右上角 **Cards** 按钮 → 切换到看板视图

#### 列定义
```
📥 Backlog     - 待处理
🔨 Ready       - 准备开始
🚧 In Progress - 开发中
🧪 Testing     - 测试中
✅ Done        - 已完成
```

#### 卡片信息
每个卡片显示:
- Issue编号
- 标题
- 标签 (颜色区分)
- 负责人
- 评论数

---

### 2.2 Labels页面

**地址**: `https://github.com/jchu-hk/school-admin-system/labels`

**查看标签**:
| 标签 | 颜色 | 含义 |
|------|------|------|
| p0 | 🔴 红色 | P0优先级 |
| p1 | 🟠 橙色 | P1优先级 |
| p2 | 🟡 黄色 | P2优先级 |
| p3 | 🔵 蓝色 | P3优先级 |
| backend | 🟣 紫色 | 后端开发 |
| frontend | 🔵 蓝色 | 前端开发 |
| qa | 🟢 绿色 | 测试相关 |
| ops | 🐙 深蓝 | 运维相关 |
| in-progress | 🔵 蓝色 | 进行中 |
| done | 🟢 绿色 | 已完成 |
| blocked | ⚫ 黑色 | 阻塞 |

**使用筛选**:
点击标签名称 → 显示所有使用此标签的Issues

---

### 2.3 Milestones页面

**地址**: `https://github.com/jchu-hk/school-admin-system/milestones`

**查看**:
- 版本里程碑列表
- 每个里程碑的进度条
- 剩余Open/Closed Issues数

---

### 2.4 Projects页面

**地址**: https://github.com/users/jchu-hk/projects/1

**功能**:
| 视图 | 说明 |
|------|------|
| Board (看板) | 拖拽卡片管理状态 |
| Table (表格) | 表格形式列表 |
| Roadmap (路线图) | 时间线视图 |

**看板列**:
- Backlog
- To Do
- In Progress
- Done

**卡片显示**:
- Issue标题
- 标签
- 负责人
- 截止日期

---

### 2.5 Actions页面

**地址**: `https://github.com/jchu-hk/school-admin-system/actions`

**查看内容**:
```
Workflows:
├── CI/CD Pipeline     - 持续集成
├── E2E Tests          - 端到端测试
├── Daily Report       - 每日报告
├── Auto Label         - 自动标签
└── Sync Issues        - 同步Issues

每个Workflow显示:
- 最近运行状态
- 运行时间
- 触发原因
```

**查看运行详情**:
点击某个运行 → 显示:
- Jobs列表
- 每个Job的日志
- 成功/失败步骤

---

### 2.6 Insights页面

**地址**: `https://github.com/jchu-hk/school-admin-system/pulse`

**查看内容**:
| 区域 | 内容 |
|------|------|
| Recent activity | 最近7天活动 |
| Commits | 提交统计 |
| Issues | 新增/关闭统计 |
| PRs | 合并统计 |
| Contributors | 贡献者 |

---

## 3. 快捷筛选

### 按标签筛选
```
github.com/jchu-hk/school-admin-system/issues?q=is%3Aissue+label%3Ap0
```
显示所有P0 Issues

### 按状态筛选
```
is:open is:issue      # 所有Open Issues
is:closed is:issue    # 所有Closed Issues
```
### 按负责人筛选
```
assignee:jchu-hk      # 我负责的Issues
```

### 组合筛选
```
is:open label:p0 assignee:jchu-hk
```
显示我负责的所有P0 Issues

---

## 4. 通知设置

### 手机App通知

1. 点击头像 → **Settings**
2. **Notifications**
3. 开启:
   - [x] Issues assigned to you
   - [x] Pull requests you're watching
   - [x] Comments on your issues/PRs

### 邮件通知

设置 → Notifications → Email

建议开启:
- [x] Participating
- [x] Watching
- [ ] All activity (避免过多邮件)

---

## 5. 常用快捷操作

### 创建Issue
1. Issues → **New issue**
2. 选择模板 (Bug/Feature/Task)
3. 填写内容
4. 添加标签
5. 分配负责人

### 快速评论
1. 打开Issue
2. 底部输入框输入评论
3. 点击 **Comment**

### 更改状态
1. 打开Issue
2. 右侧 **Labels** → 添加/移除
3. **Assignees** → 更改负责人
4. **Projects** → 添加到看板

---

## 6. 查看工作进度

### 每日检查清单

#### 1. 检查Notifications (通知)
- 打开GitHub App
- 查看通知列表
- 处理@提及和评论

#### 2. 检查Issues (问题)
- 打开 Issues页面
- 筛选 `is:open assignee:@me`
- 处理分配的Issue

#### 3. 检查CI状态
- 打开 Actions页面
- 查看最近运行
- 确认是否全部通过

#### 4. 检查看板
- 打开 Projects
- 查看各列卡片数量
- 移动卡片更新状态

---

## 7. 快速链接

| 内容 | 链接 |
|------|------|
| 仓库首页 | https://github.com/jchu-hk/school-admin-system |
| Issues | https://github.com/jchu-hk/school-admin-system/issues |
| PRs | https://github.com/jchu-hk/school-admin-system/pulls |
| Actions | https://github.com/jchu-hk/school-admin-system/actions |
| Projects | https://github.com/users/jchu-hk/projects/1 |
| Labels | https://github.com/jchu-hk/school-admin-system/labels |
| Milestones | https://github.com/jchu-hk/school-admin-system/milestones |

---

## 8. 推荐视图

### PM每日视图
```
1. Notifications → 处理通知
2. Projects → Board视图 → 查看整体进度
3. Issues → 筛选 assignee:@me → 查看个人任务
4. Actions → 查看CI状态
```

### 快速概览
```
1. Insights → Pulse → 7天活动概览
2. Issues → 按标签筛选 → 查看各模块进度
```

---

*更新时间: 2026-06-14 19:31*