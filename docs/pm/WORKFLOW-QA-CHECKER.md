# AI团队工作流程与质量管控

**创建**: 2026-06-14
**更新**: 2026-06-14 14:34
**基于**: PM检讨会议

---

## 1. 核心原则

### 任何完成工件必须经过

```
DEV完成 → QA验收 → CHECKER审批 → PM确认 → 合并/发布
```

### 待开发模块必须满足

```
REQ完成 → ARCH审批 → CHECKER确认 → DEV接任务
```

---

## 2. 工作分派流程

### 2.1 新任务分派

```
┌─────────────────────────────────────────────────────────────┐
│ 1. REQ 需求分析                                            │
│    - 编写功能规格说明书 (SPEC)                              │
│    - 定义接受标准 (AC)                                      │
│    - 评估复杂度                                             │
│    - 输出: docs/features/F-XXX-001/SPEC.md                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ARCH 架构审查 (P1+功能)                                 │
│    - 评审技术方案                                           │
│    - 确认接口设计                                           │
│    - 验证可行性                                             │
│    - 输出: Technical Design Review                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CHECKER 审批                                            │
│    - 确认需求合理                                           │
│    - 确认设计可行                                           │
│    - 标记: APPROVED / REQUEST_CHANGES                       │
│    - 输出: Issue添加 approved 标签                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PM 分配开发                                             │
│    - 创建开发Issue                                          │
│    - 分配给DEV                                             │
│    - 设置优先级和里程碑                                     │
│    - 添加标签: backend/frontend, p1/p2                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 开发完成触发验收

```
┌─────────────────────────────────────────────────────────────┐
│ DEV 开发完成                                                │
│    - 提交PR到main分支                                      │
│    - 代码自测通过                                           │
│    - 添加标签: ready-for-review                             │
│    - 通知PM和QA                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. QA 验收测试                                             │
│    - 功能测试 (黑盒)                                        │
│    - 集成测试                                               │
│    - 记录测试结果                                           │
│    - 输出: 测试报告 + Bug列表                               │
│    - 条件: 所有P0/P1 Bug已修复                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CHECKER 代码审查                                         │
│    - 代码质量审查                                           │
│    - 安全审查                                               │
│    - 规范审查                                               │
│    - 输出: APPROVED / REQUEST_CHANGES                        │
│    - 条件: 所有问题已解决                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. PM 最终确认                                              │
│    - 确认所有审批通过                                       │
│    - 合并PR到main                                          │
│    - 更新Issue状态                                          │
│    - 安排发布                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CHECKER职责与审批标准

### 3.1 CHECKER角色定义

**CHECKER = 质量守门员**

负责：
- 需求审批 (REQ输出)
- 架构审批 (ARCH输出)
- 代码审批 (DEV输出)
- 安全审批 (敏感操作)

### 3.2 审批标准

#### 需求审批 (REQ → CHECKER)
```
□ 需求描述清晰
□ 接受标准明确
□ 无歧义或遗漏
□ 技术可行性确认
□ 优先级合理
```

#### 架构审批 (ARCH → CHECKER)
```
□ 技术方案合理
□ 接口设计清晰
□ 扩展性考虑
□ 安全风险评估
□ 性能影响评估
```

#### 代码审批 (DEV → CHECKER)
```
□ 代码规范符合
□ 无安全漏洞
□ 无明显性能问题
□ 测试覆盖充分
□ 文档完整
```

### 3.3 审批流程

```
CHECKER 收到请求
    ↓
评审 (最多4小时)
    ↓
通过 → 添加 approved 标签 → 通知PM
不通过 → 添加 changes-requested 标签 → 说明原因 → 返回
```

---

## 4. QA职责与验收标准

### 4.1 QA角色定义

**QA = 功能验证者**

负责：
- 功能测试
- 集成测试
- 回归测试
- 验收报告

### 4.2 验收标准

#### 功能测试
```
□ 所有AC通过
□ 边界条件正确
□ 错误处理正常
□ UI交互流畅
```

#### 集成测试
```
□ 模块间接口正常
□ 数据流正确
□ 权限控制有效
□ 事务完整性
```

### 4.3 QA流程

```
QA 收到测试请求
    ↓
执行测试用例
    ↓
通过 → 生成测试报告 → 通知CHECKER
失败 → 创建Bug Issue → 返回DEV修复
```

---

## 5. 标签体系

### 状态标签

| 标签 | 含义 | 使用者 |
|------|------|--------|
| `pending-review` | 待审查 | DEV |
| `ready-for-review` | 可审查 | DEV |
| `changes-requested` | 需修改 | CHECKER |
| `approved` | 已批准 | CHECKER |
| `testing` | 测试中 | QA |
| `passed` | 测试通过 | QA |
| `failed` | 测试失败 | QA |

### 生命周期

```
draft → pending-review → ready-for-review → testing → passed → approved → merged
         ↓                                                              ↓
    changes-requested ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← failed
```

---

## 6. Issue状态流转

### 6.1 开发Issue

```
Open (已分配)
    ↓
In Progress (DEV开始开发)
    ↓
PR Created (提交PR)
    ↓
Ready for Review (DEV完成，标记ready-for-review)
    ↓
QA标签 (QA开始验收，添加qa标签)
    ↓
Passed (测试通过，添加passed标签)
    ↓
Approved (CHECKER审批，添加approved标签)
    ↓
Merged (PM合并)
    ↓
Closed (完成)
```

### 6.2 QA工作流程（最佳实践）

```
原Issue保持唯一真相
    ↓
添加qa标签 (QA开始验收)
    ↓
Issue评论记录QA进度
    ↓
添加passed/failed标签 (验收完成)
    ↓
只对发现的Bug创建新Issue
```

**原则**:
- ❌ 不要为QA创建新Issue
- ✅ 用qa标签表示"QA验收中"
- ✅ 原Issue保留为唯一真相
- ✅ 只为新发现的Bug创建Issue

### 6.2 阻塞处理

```
阻塞 → 添加 blocked 标签 + blocked-by 标签
    ↓
解决阻塞 → 移除 blocked
    ↓
继续流转
```

---

## 7. 自动化触发

### 7.1 GitHub Actions自动触发

```yaml
on:
  pull_request:
    types: [opened, ready_for_review, closed]
  issues:
    types: [labeled]

jobs:
  trigger-qa:
    if: github.event.action == 'ready_for_review'
    runs-on: ubuntu-latest
    steps:
      - name: 通知QA测试
        run: |
          echo "PR已就绪，请QA开始测试"
          gh issue comment $PR_NUMBER --body "PR已就绪，请QA验收测试"

  trigger-checker:
    if: contains(github.event.pull_request.labels.*.name, 'ready-for-review')
    runs-on: ubuntu-latest
    steps:
      - name: 通知CHECKER审查
        run: |
          echo "请CHECKER审查代码"
          gh issue comment $PR_NUMBER --body "请CHECKER审批"

  auto-merge:
    if: |
      contains(github.event.pull_request.labels.*.name, 'approved') &&
      contains(github.event.pull_request.labels.*.name, 'passed')
    runs-on: ubuntu-latest
    steps:
      - name: PM确认合并
        run: |
          echo "所有审批通过，PM可合并"
```

---

## 8. 工作分配规则

### 8.1 DEV分配规则

```
开发条件:
  ✓ CHECKER已批准需求
  ✓ ARCH已批准设计 (P1+)
  ✓ 优先级已确定
  ✓ Issue已创建

分配优先级:
  1. P0 且无依赖
  2. P1 且无依赖
  3. P2/P3
  4. 有依赖的按依赖顺序
```

### 8.2 QA分配规则

```
测试条件:
  ✓ DEV提交PR
  ✓ 代码审查通过 (lint/test)
  ✓ ready-for-review标签

测试优先级:
  1. P0功能
  2. P1功能
  3. P2功能
  4. 回归测试
```

### 8.3 CHECKER分配规则

```
审查条件:
  ✓ REQ/ARCH/DEV请求审查
  ✓ 提交材料完整

审查优先级:
  1. P0功能 (4小时内)
  2. P1功能 (8小时内)
  3. P2功能 (24小时内)
  4. 文档/规范 (48小时内)
```

---

## 9. 报告机制

### 9.1 CHECKER报告

```markdown
## CHECKER审批报告 - Issue #XXX

### 审批类型
- [ ] 需求审批 (REQ)
- [ ] 架构审批 (ARCH)
- [ ] 代码审批 (DEV)

### 审批结果
- [ ] APPROVED
- [ ] REQUEST_CHANGES

### 审查意见
[详细说明]

### 通过条件
- [ ] 条件1
- [ ] 条件2

### 签名
CHECKER: @username
日期: YYYY-MM-DD
```

### 9.2 QA报告

```markdown
## QA验收报告 - Issue #XXX

### 测试类型
- [ ] 功能测试
- [ ] 集成测试
- [ ] 回归测试

### 测试结果
- [ ] PASSED
- [ ] FAILED

### 测试用例
| 用例ID | 描述 | 结果 | Bug |
|--------|------|------|-----|
| TC-001 | ... | PASS | - |

### Bug列表
| Bug ID | 描述 | 严重性 | 状态 |
|--------|------|--------|------|

### 签名
QA: @username
日期: YYYY-MM-DD
```

---

## 10. 执行检查清单

### PM执行检查

```
收到开发完成通知:
  □ 检查PR状态
  □ 分配QA测试
  □ 等待QA报告
  
收到QA通过:
  □ 分配CHECKER审查
  □ 等待CHECKER批准
  
收到CHECKER批准:
  □ 确认所有审批
  □ 合并PR
  □ 更新Issue
  □ 通知相关人员
```

### CHECKER执行检查

```
收到审查请求:
  □ 确认审查类型
  □ 评审材料
  □ 做出决定 (APPROVED/REQUEST_CHANGES)
  □ 添加标签
  □ 通知PM
  
审查超时 (4小时无响应):
  □ 提醒CHECKER
  □ 升级到PM
```

### QA执行检查

```
收到测试请求:
  □ 确认测试范围
  □ 执行测试
  □ 记录结果
  □ 生成报告
  □ 通知PM和CHECKER
  
测试失败:
  □ 创建Bug Issue
  □ 分配给DEV
  □ 等待修复
  □ 重新测试
```

---

*更新时间: 2026-06-14 14:34*
*下次更新: 执行中调整*