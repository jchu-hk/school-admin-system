# AI团队角色沟通机制

**创建**: 2026-06-14 18:47
**目的**: 建立AI角色间的信息和沟通渠道

---

## 1. 沟通原则

### 核心原则

```
所有沟通通过GitHub进行
├── Issue Comments - 任务讨论
├── PR Comments - 代码审查
├── @mentions - 角色通知
└── Labels - 状态传达
```

### 为什么用GitHub？

| 优势 | 说明 |
|------|------|
| 透明 | 所有沟通公开可追溯 |
| 关联 | 沟通与任务/代码绑定 |
| 自动化 | GitHub Actions可触发 |
| 通知 | @mentions即时通知 |
| 历史 | 永久保存沟通记录 |

---

## 2. 角色标识

### GitHub用户映射

```yaml
PM:       @jchu-hk (项目经理)
REQ:      @req-agent (需求分析)
UI:       @ui-agent (前端开发)
ARCH:     @arch-agent (架构设计)
DEV:      @dev-agent (后端开发)
QA:       @qa-agent (测试验收)
CHECKER:  @checker-agent (代码审查)
DEVOPS:   @devops-agent (运维部署)
OPS:      @ops-agent (生产维护)
```

### 实际实现

由于GitHub用户限制，使用**标签+评论**机制：

```yaml
通知PM:       添加 pm 标签 + 评论 @jchu-hk
通知REQ:      添加 req 标签 + 评论 "REQ请处理"
通知UI:       添加 frontend 标签 + 评论 "UI请开发"
通知ARCH:     添加 arch 标签 + 评论 "ARCH请评审"
通知DEV:      添加 backend 标签 + 评论 "DEV请开发"
通知QA:       添加 qa 标签 + 评论 "QA请验收"
通知CHECKER:  添加 review 标签 + 评论 "CHECKER请审查"
通知DEVOPS:   添加 devops 标签 + 评论 "DEVOPS请处理"
通知OPS:      添加 ops 标签 + 评论 "OPS请处理"
```

---

## 3. 沟通场景

### 3.1 任务分配

```
PM → DEV: 
  1. 创建Issue
  2. 添加 backend/frontend 标签
  3. 评论: "DEV请开发此功能，完成后通知QA"

DEV → PM:
  1. 提交PR
  2. 添加 ready-for-review 标签
  3. 评论: "已完成开发，请PM分配QA验收"
```

### 3.2 验收流程

```
PM → QA:
  1. Issue评论: "@QA请验收"
  2. 添加 qa 标签

QA → DEV:
  1. 测试失败: 评论问题列表
  2. 添加 changes-requested 标签

QA → CHECKER:
  1. 测试通过: 评论"测试通过，请CHECKER审查"
  2. 添加 passed 标签
  3. 添加 review 标签
```

### 3.3 代码审查

```
CHECKER → DEV:
  1. 需修改: 评论审查意见
  2. 添加 changes-requested 标签

CHECKER → PM:
  1. 审查通过: 评论"已批准"
  2. 添加 approved 标签
```

### 3.4 问题协调

```
任何角色 → PM:
  1. 添加 blocked 标签
  2. 评论: "遇到阻塞，请PM协调"
  3. 说明阻塞原因

PM → 所有:
  1. 评论解决方案
  2. 移除 blocked 标签
```

---

## 4. 消息模板

### 4.1 任务通知

```markdown
## 📋 任务分配

### 任务
[任务描述]

### 负责人
@角色

### 要求
- 截止时间: [时间]
- 输出: [输出物]

### 下一步
完成后请评论通知。
```

### 4.2 完成通知

```markdown
## ✅ 任务完成

### 完成内容
- [ ] 项目1
- [ ] 项目2

### 输出
- 文件: [路径]
- Issue: #XXX

### 下一步
请 @下一角色 接手处理。
```

### 4.3 问题报告

```markdown
## ❗ 问题报告

### 问题
[问题描述]

### 影响
[影响范围]

### 建议
[解决方案]

### 需要帮助
@PM 请协调
```

### 4.4 审查意见

```markdown
## 🔍 审查报告

### 审查项
| 项目 | 状态 | 说明 |
|------|------|------|

### 审查结果
- [ ] APPROVED
- [ ] REQUEST_CHANGES

### 修改建议
1. [建议1]
2. [建议2]

---
@角色 请处理
```

---

## 5. 自动化通知

### 5.1 GitHub Actions自动评论

```yaml
# .github/workflows/role-communication.yml

on:
  issues:
    types: [labeled]

jobs:
  notify-role:
    runs-on: ubuntu-latest
    steps:
      - name: 通知QA
        if: contains(github.event.label.name, 'ready-for-review')
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "🔔 **QA验收请求**\n\nPR已就绪，请进行功能验收测试。"

      - name: 通知CHECKER
        if: contains(github.event.label.name, 'passed')
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "🔔 **CHECKER审查请求**\n\nQA测试通过，请进行代码审查。"

      - name: 通知PM
        if: contains(github.event.label.name, 'blocked')
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "⚠️ **PM协调请求**\n\n任务被阻塞，请协调解决。"
```

### 5.2 Agent间通信协议

```
PM分配任务:
  sessions_spawn(
    label: "DEV-TASK",
    task: "你是DEV，开发xxx功能... 完成后评论Issue #XX通知QA验收"
  )

DEV完成任务:
  sessions_send(
    sessionKey: "agent:main:main",
    message: "DEV完成，已评论Issue #XX通知QA"
  )

PM收到通知:
  sessions_spawn(
    label: "QA-REVIEW",
    task: "你是QA，验收Issue #XX的功能..."
  )
```

---

## 6. 沟通规范

### 6.1 评论规范

```
✅ 好的评论:
- 简洁明了
- 包含上下文
- @通知相关角色
- 明确下一步

❌ 不好的评论:
- 模糊不清
- 缺少上下文
- 不通知相关方
- 无明确行动
```

### 6.2 标签使用规范

```
添加标签 = 发送信号

ready-for-review  → "请验收/审查"
approved          → "已批准"
changes-requested → "需修改"
blocked           → "需要协调"
```

### 6.3 响应时限

| 角色 | 响应时限 |
|------|----------|
| PM | 1小时 |
| REQ | 4小时 |
| ARCH | 8小时 |
| DEV | 8小时 |
| QA | 4小时 |
| CHECKER | 4小时 |
| DEVOPS | 2小时 |
| OPS | 2小时 |

---

## 7. 沟通流程图

### 7.1 开发流程沟通

```
PM ──创建Issue──> DEV
                     │
DEV ──提交PR──> PM
                     │
PM ──评论通知──> QA
                     │
QA ──评论结果──> DEV (失败) ──修复──> QA
      │
      └──评论通知──> CHECKER (通过)
                           │
CHECKER ──评论结果──> DEV (失败) ──修复──> CHECKER
         │
         └──评论通知──> PM (通过)
                              │
PM ──合并──> 完成
```

### 7.2 问题协调沟通

```
任意角色 ──评论+blocked标签──> PM
                                 │
PM ──评论方案──> 相关角色
                                 │
相关角色 ──评论确认──> PM
                                 │
PM ──移除blocked──> 继续
```

---

## 8. 实施步骤

### Step 1: 创建角色标签

```bash
gh label create "pm" --description "PM相关"
gh label create "req" --description "REQ相关"
gh label create "arch" --description "ARCH相关"
# ... 其他角色标签
```

### Step 2: 配置自动通知

创建 `.github/workflows/role-communication.yml`

### Step 3: 建立沟通习惯

- 所有讨论在Issue/PR中
- @mentions通知角色
- 标签传达状态
- 评论记录决策

---

## 9. 检查清单

### PM每次分配任务时

```
□ 创建Issue
□ 添加标签 (backend/frontend)
□ 评论说明任务
□ @通知角色
□ 设置截止时间
```

### Agent完成任务时

```
□ 提交代码/文档
□ 评论完成内容
□ 添加标签 (ready-for-review)
□ @通知下一角色
□ 说明下一步
```

### 发现问题时

```
□ 评论问题描述
□ 添加 blocked 标签
□ @通知PM
□ 提供建议方案
```

---

*更新时间: 2026-06-14 18:47*