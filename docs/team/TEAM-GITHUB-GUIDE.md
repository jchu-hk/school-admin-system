# 👥 团队成员GitHub使用指南

**适用角色**: DEV1, DEV2, DEV3, QA1, QA2, REQ
**更新时间**: 2026-06-10

---

## 🚀 快速入门

### 设置GitHub CLI (推荐)

```bash
# 安装 (如有需要)
brew install gh  # macOS
# 或从 https://cli.github.com 安装

# 登录
gh auth login
```

### 设置通知 (Web界面)

1. 访问 https://github.com/jchu-hk/school-admin-system
2. 点击右上角 **Watch** → 选择 **All Activity**
3. 点击 **Notification settings** → 开启 **Email**

---

## 📋 每日必做

### 1. 开始工作 - 签到

在 **#dev-standup** 群或直接在此Issue评论:
```
[@PM] DEV1 开始今日工作
任务: #65 学生出勤管理
预计完成: 18:00
```

### 2. 工作完成 - 状态更新

#### DEV团队: 提交代码后

```bash
# 1. 提交你的工作
git add .
git commit -m "feat: 完成出勤管理CRUD功能"
git push origin feature/attendance

# 2. 创建PR
gh pr create --title "feat: 学生出勤管理模块" --body "完成F-ATT-001开发

## 交付内容
- [x] 出勤记录CRUD
- [x] 出勤统计报表
- [x] 单元测试覆盖率85%

## 相关Issue
Closes #65
"

# 3. 在Issue评论
gh issue comment 65 --body "
✅ 开发完成

- 代码已提交到 feature/attendance
- PR: https://github.com/jchu-hk/school-admin-system/pull/XX
- 单元测试: 通过
- 等待QA验收
"
```

#### QA团队: 验收完成后

```bash
# 1. 创建验收报告
cat > qa_report/出勤管理验收报告.md << 'EOF'
# 学生出勤管理模块QA验收报告

## 测试结果
- 用例数: 25
- 通过: 24
- 失败: 1
- 通过率: 96%

## 缺陷
无P0/P1缺陷

## 结论
✅ 通过验收
EOF

# 2. 提交报告
git add qa_report/出勤管理验收报告.md
git commit -m "docs(qa): 出勤管理模块验收报告"
git push origin main

# 3. 关闭Issue并评论
gh issue close 62 --comment "✅ 验收完成，通过"
```

---

## 🎯 各角色核心命令

### DEV1/DEV2/DEV3 - 开发人员

```bash
# 查看分配给我的任务
gh issue list --search "DEV1" --state open

# 查看我负责的模块
gh issue list --label "mod-daily" --state open

# 更新任务进度
gh issue comment <issue-number> --body "
📍 当前进度: 60%
✅ 已完成: CRUD、统计报表
🔄 进行中: 出勤提醒功能
⏳ 预计完成: 今天17:00
"

# 完成任务
gh issue close <issue-number> --comment "✅ 开发完成，等待QA验收"
```

### QA1/QA2 - 测试人员

```bash
# 查看待测试任务
gh issue list --label "testing" --state open

# 开始测试
gh issue comment <issue-number> --body "
🧪 开始测试
测试人员: @QA1
预计完成: 今天16:00
"

# 提交测试报告
gh issue comment <issue-number> --body "
✅ 测试完成

结果: 通过 (96%)
缺陷: 1个P2级问题(已记录#XXX)
建议: 可以部署
"

# 关闭Issue
gh issue close <issue-number>
```

### DEVOPS (@DEV3) - 部署人员

```bash
# 查看待部署任务
gh issue list --search "部署" --state open

# 开始部署
gh issue comment <issue-number> --body "
🚀 开始部署
环境: 测试环境
预计完成: 1小时
"

# 部署完成
gh issue comment <issue-number> --body "
✅ 部署完成

部署模块:
- [x] ABAC权限服务
- [x] 用户管理模块
- [x] 基础认证

服务状态: 健康
访问地址: https://test.xxx.com
"
gh issue close <issue-number>
```

### PM - 项目经理

```bash
# 查看所有进行中任务
gh issue list --state open

# 查看超时任务
gh issue list --state open --search "截止"

# 创建新任务
gh issue create \
  --title "[DEV1] 模块名称" \
  --body "任务描述..." \
  --label "p1,mod-daily" \
  --assignee "username"

# 每日报告
gh issue create \
  --title "📊 每日进度报告 2026-06-10" \
  --body "报告内容..."
```

---

## 📱 移动端操作 (手机操作)

### 通过GitHub App

1. 下载 **GitHub** 手机App
2. 登录你的GitHub账号
3. 访问仓库 → Issues
4. 可以查看、更新、评论任务

### 通过微信 (间接方式)

发送消息给PM机器人，PM会代为更新:
```
[@PM] DEV1 完成#65开发
[@PM] QA1 开始测试#62
[@PM] DEV3 部署完成#64
```

---

## 🔄 标准化更新模板

### 进度更新模板

```
## [角色] HH:MM 进度更新

**任务**: #XX 标题
**进度**: XX%
**状态**: 🔄 进行中 / ✅ 完成 / 🔴 阻塞
**完成项**:
- 完成的功能点1
- 完成的功能点2

**阻塞问题**: (如有)
- 问题描述

**下一步**:
- 即将开始的工作

**预计完成**: HH:MM
```

### 完成汇报模板

```
## [角色] HH:MM 完成汇报

**任务**: #XX 标题
**结果**: ✅ 完成

**交付物**:
- 代码PR: [链接]
- 测试报告: [链接]
- 文档更新: [链接]

**遗留问题**: (如有)
- 问题描述 (Issue #XX)

**耗时**: X小时
```

### 阻塞上报模板

```
## [角色] HH:MM 阻塞上报

**任务**: #XX 标题
**状态**: 🔴 阻塞

**阻塞原因**:
- 详细描述...

**已尝试的解决方案**:
- 方案1 (失败原因)
- 方案2 (失败原因)

**需要协助**:
- 具体需求
- 负责人: @xxx
```

---

## ⚠️ 重要约定

### 必须遵守

1. **每天开始工作** → 在Issue下评论告知开始
2. **每2小时** → 更新一次进度
3. **遇到阻塞** → 立即上报，不要等待
4. **完成任务** → 提交报告 + 关闭Issue
5. **Commit规范** → 遵循 `[类型] 描述` 格式

### 严禁事项

1. ❌ 不创建Issue就开发
2. ❌ 完成任务不更新状态
3. ❌ 超时不上报
4. ❌ 直接在main分支开发

---

## 🆘 常见问题

**Q: 忘记更新状态怎么办?**
A: 立即补上，并说明原因

**Q: 任务无法按时完成?**
A: 提前上报，附上新预估时间

**Q: 遇到技术问题?**
A: 在Issue下评论，@PM协调资源

**Q: GitHub无法访问?**
A: 联系PM，通过微信汇报

---

## 📞 联系PM

有任何问题，通过以下方式联系PM:
- GitHub Issue评论 @PM
- 微信群 @PM
