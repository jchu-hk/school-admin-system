# 🎯 各角色速查卡

## DEV1 - 后端开发 (权限/ABAC/出勤/财务)

### 我的任务
```bash
gh issue list --search "DEV1" --state open
```

### 每日流程
```
1. git pull origin main
2. 开始开发
3. 每2小时更新进度
4. 完成 → 提交PR → 更新Issue
```

### 常用命令
```bash
# 开始工作
gh issue comment <#> --body "@PM 开始开发 #XX"

# 更新进度
gh issue comment <#> --body "进度: 50%"

# 完成
gh issue close <#> --comment "✅ 开发完成"
```

---

## DEV2 - 后端开发 (用户/请假/费用/校车)

### 我的任务
```bash
gh issue list --search "DEV2" --state open
```

### 每日流程
```
1. git pull origin main
2. 开始开发
3. 每2小时更新进度
4. 完成 → 提交PR → 更新Issue
```

### 常用命令
```bash
# 开始工作
gh issue comment <#> --body "@PM 开始开发 #XX"

# 更新进度
gh issue comment <#> --body "进度: 50%"

# 完成
gh issue close <#> --comment "✅ 开发完成"
```

---

## DEV3 - 全栈/DEVOPS

### 我的任务
```bash
gh issue list --search "DEV3" --state open
gh issue list --search "部署" --state open
```

### 每日流程
```
1. 检查部署队列
2. 执行部署
3. 冒烟测试
4. 完成后更新Issue
```

### 部署命令
```bash
# 开始部署
gh issue comment 64 --body "🚀 开始部署..."

# 部署完成
gh issue comment 64 --body "✅ 部署完成，服务健康"
gh issue close 64
```

---

## QA1 - API功能测试

### 我的任务
```bash
gh issue list --label "testing" --state open
```

### 每日流程
```
1. 接收验收任务
2. 执行测试
3. 编写测试报告
4. 上传qa_report/
5. 关闭Issue
```

### 测试命令
```bash
# 开始测试
gh issue comment 62 --body "🧪 开始测试..."

# 提交报告
git add qa_report/
git commit -m "docs(qa): 验收报告"
git push origin main

# 完成
gh issue close 62 --comment "✅ 通过验收"
```

---

## QA2 - E2E自动化测试

### 我的任务
```bash
gh issue list --label "e2e" --state open
```

### 常用命令
```bash
# 运行E2E测试
npm run test:e2e

# 更新测试结果
gh issue comment <#> --body "E2E测试: 95%通过"
```

---

## REQ - 需求分析

### 我的任务
```bash
gh issue list --label "req" --state open
```

### 常用命令
```bash
# 更新需求
gh issue comment <#> --body "需求已确认，等待开发"

# 完成需求
gh issue close <#>
```

---

## PM - 项目经理

### 常用命令
```bash
# 查看所有进行中
gh issue list --state open

# 查看超时
gh issue list --state open --search "截止"

# 查看某人任务
gh issue list --search "DEV1"

# 每日报告
gh issue create --title "📊 每日报告 YYYY-MM-DD"
```

---

## 🚨 紧急情况

| 情况 | 行动 |
|------|------|
| 超时无法完成 | 立即在Issue下上报 |
| 技术难题 | 在Issue下评论，请求协助 |
| 无法访问GitHub | 微信联系PM |
| 部署失败 | 立即上报，说明原因 |

---

## 📞 GitHub快捷访问

**仓库**: https://github.com/jchu-hk/school-admin-system

**Issues**: https://github.com/jchu-hk/school-admin-system/issues

**看板**: [KANBAN-BOARD.md](./KANBAN-BOARD.md)
