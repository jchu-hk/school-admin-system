# PM工作流程规范 (2026-06-25)

> 基于用户6项要求，建立标准化PM工作流程

---

## 1. 工作状态跟踪 - 一切以GitHub为准

### 核心原则
**所有工作状态必须在GitHub上可见、可追踪**

### GitHub作为单一真相来源 (SSOT)
| 工作类型 | GitHub载体 | 状态定义 |
|---------|-----------|---------|
| 缺陷 | Issue (Bug label) | Open → In Progress → Closed |
| 功能需求 | Issue (Feature label) | Open → In Progress → Closed |
| 技术任务 | Issue (Task label) | Open → In Progress → Closed |
| 文档任务 | Issue (Documentation label) | Open → In Progress → Closed |
| 代码修改 | Pull Request | Open → Review → Merged |

### Git标签体系
```
优先级: P0 (阻断), P1 (严重), P2 (一般), P3 (低优先级)
类型: bug, feature, task, documentation, enhancement, testing
模块: mod-user, mod-attendance, mod-tuition, mod-leave, mod-i18n, etc.
状态: open, in-progress, blocked, waiting-qa, waiting-review, done
```

### 工作流程
```
发现缺陷/任务
    ↓ 创建Issue (明确标签、优先级、 assignee)
    ↓ 指派给对应Agent (DEV/QA/OPS)
    ↓ Agent在Issue内更新进度
    ↓ Code Review (CHECKER)
    ↓ 合并到main分支
    ↓ QA验证
    ↓ 关闭Issue
```

---

## 2. 缺陷跟踪规范

### Issue模板
```markdown
## 问题描述
[清晰描述问题]

## 环境
- URL:
- 账号:
- 浏览器:

## 复现步骤
1.
2.
3.

## 期望结果
[描述期望行为]

## 实际结果
[描述实际行为]

## 截图/日志
[附上证据]

## 优先级评估
- P0: 系统不可用/数据丢失风险
- P1: 功能严重受损，影响核心流程
- P2: 功能受限但有workaround
- P3: UI问题/体验优化，不影响功能

## 排查记录 (由处理者填写)
### 根因分析
[分析过程和结论]

### 解决方案
[修复方案描述]

### 相关文件
- [修改的文件]
- [相关API/数据库变更]

### 关联Issue
- Blocked by: #
- Blocks: #
- Related to: #
```

### 优先级设定原则
| 优先级 | 定义 | 示例 | 响应时间 |
|--------|------|------|---------|
| P0 | 阻断发布/系统崩溃 | 登录不可用，数据丢失 | 立即处理 |
| P1 | 核心功能受损 | 仪表板空白，保存失败 | 24小时内 |
| P2 | 功能受限 | 筛选器缺失，UI显示错误 | 72小时内 |
| P3 | 体验优化 | 文案错误，样式问题 | 下一版本 |

---

## 3. 质量保证 - 独立测试验收

### 测试角色分离
```
DEV ←→ CHECKER ←→ QA ←→ 人类
 ↑                   ↑
编写代码            独立测试
```

### 测试验收清单
| 阶段 | 负责人 | 产出物 |
|------|--------|--------|
| 单元测试 | DEV | 测试代码 |
| Code Review | CHECKER | Review意见 |
| 功能测试 | QA | 测试报告 |
| 集成测试 | QA | 测试报告 |
| 验收测试 | 人类/PM | 验收确认 |

### QA验收流程
```
开发完成 → 创建PR → CHECKER审查 → 合并main
    ↓
部署到测试环境
    ↓
QA执行测试用例
    ↓
通过 → 验收报告 → 关闭Issue
失败 → Reopen Issue → 退回DEV
```

---

## 4. 测试报告规范

### 测试报告模板
```markdown
# 测试报告 - [模块/缺陷名称]

## 基本信息
| 项目 | 内容 |
|------|------|
| 测试对象 | |
| 测试类型 | 系统测试/模块测试/回归测试 |
| 测试日期 | |
| 测试人员 | |
| 测试环境 | |

## 测试范围
### 功能列表
- [ ] 功能点1
- [ ] 功能点2

### 测试用例
| 用例ID | 用例名称 | 前置条件 | 测试步骤 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|----------|----------|----------|------|
| TC001 | 登录功能 | 无 | 1.输入账号密码 | 登录成功 | 登录成功 | ✅ |

## 测试结果汇总
| 类型 | 数量 |
|------|------|
| 总用例数 | |
| 通过 | |
| 失败 | |
| 阻塞 | |

## 缺陷记录
| 缺陷ID | 描述 | 严重程度 | 状态 |
|--------|------|----------|------|
| | | | |

## 测试结论
[通过/不通过 + 理由]

## 附录
- 测试数据
- 环境配置
- 截图
```

### 报告级别
| 级别 | 触发条件 | 报告内容 |
|------|---------|---------|
| 系统级 | 新版本发布 | 全模块回归测试 |
| 模块级 | 模块功能变更 | 本模块完整测试 |
| 缺陷级 | 缺陷修复 | 相关功能验证 |

---

## 5. 文档变更管理

### 核心原则
**任何代码变更必须先更新相关文档，再执行代码修改**

### 文档同步规则
| 变更类型 | 必须更新的文档 | 验证方式 |
|---------|---------------|---------|
| 新增功能 | SPEC-COMPLETE.md, API-DESIGN.md | 功能对比规格 |
| 架构变更 | SPEC-SYSTEM-DESIGN.md | 架构图更新 |
| 数据库变更 | DB-SCHEMA.md, DATA-DICTIONARY.md | Schema一致性 |
| API变更 | API-DESIGN.md | 接口测试 |

### 文档任务追踪
```
发现文档与代码不一致
    ↓
创建文档更新Issue (Documentation label)
    ↓
关联原Issue (Related to)
    ↓
文档更新 → PR → 合并
    ↓
代码变更 (如需要)
```

### 依赖关系管理
```markdown
## Issue关联格式
- Blocks: #123 (此Issue阻塞另一个)
- Blocked by: #456 (此Issue被另一个阻塞)
- Related to: #789 (关联但非阻塞)
- Part of: #111 (属于某个Epic)
```

### 违规处理
| 违规类型 | 处理方式 |
|---------|---------|
| 未同步文档就改代码 | 作为补丁补充commit，24小时内补文档 |
| 严重不一致 | 回滚代码，先补文档再开发 |
| 多人协作 | 各自负责模块文档，交叉检查 |

---

## 6. 项目Wiki - 中央式信息发布

### Wiki首页结构
```
# 智慧校园管理系统 - 项目Wiki

## 📌 快速链接
- [最新版本](https://github.com/jchu-hk/school-admin-system/releases/latest)
- [测试环境](URL)
- [API文档](URL)
- [数据库Schema](docs/DB-SCHEMA.md)

## 🎯 当前版本
- **版本号**: v1.5.x
- **发布日期**: YYYY-MM-DD
- **更新内容**: [Changelog](链接)

## 🔗 测试环境
| 环境 | URL | 状态 |
|------|-----|------|
| 测试环境 | https://xxx | ✅ 正常 |

## 👤 测试账号
| 角色 | 用户名 | 密码 | OTP |
|------|--------|------|-----|
| 管理员 | admin | Admin123! | ✅ |
| 校务 | staff1 | Admin123! | ❌ |

## 📊 项目状态
- Open Issues: [数量](链接)
- 今日测试: [状态]
- 最近部署: [时间]

## 📚 文档库
- [功能规格](docs/SPEC-COMPLETE.md)
- [架构设计](docs/SPEC-SYSTEM-DESIGN.md)
- [API设计](docs/API-DESIGN.md)
- [数据库设计](docs/DB-SCHEMA.md)
- [运维文档](docs/OPS.md)

## 🔧 开发指南
- [本地开发](docs/DEVELOPMENT.md)
- [部署指南](docs/DEPLOYMENT.md)
- [测试指南](docs/TESTING.md)
```

### Wiki维护
- Wiki首页每次版本发布时更新
- 测试账号信息实时更新
- 环境状态通过CI/CD自动更新

---

## PM工作检查清单

### 每次工作开始前
- [ ] 确认Issue已创建并分配
- [ ] Issue包含完整模板信息
- [ ] 相关文档已检查

### 工作进行中
- [ ] 定期更新Issue进度
- [ ] 代码变更记录到Issue
- [ ] 遇到阻塞立即更新Issue状态

### 工作完成后
- [ ] PR已创建并关联Issue
- [ ] CHECKER已审查
- [ ] QA测试报告已生成
- [ ] 文档已更新
- [ ] Issue已关闭
- [ ] 向人类汇报（汇总形式）

---

## 工具使用规范

### GitHub CLI命令速查
```bash
# 创建Issue
gh issue create --title "标题" --body "内容" --label "bug,P1"

# 查看Issue列表
gh issue list --state open --label "bug"

# 关联Issue到PR
gh pr create --title "标题" --body "Fixes #123"

# 关闭Issue
gh issue close #123 --comment "Fixed in commit xxx"

# 查看里程碑
gh issue list --milestone "v1.5.x"
```

### 状态同步规则
- **Open**: 工作未开始或进行中
- **In Progress**: 有人认领并正在处理
- **Waiting for Review**: PR已创建，等待审查
- **Waiting for QA**: 代码已合并，等待测试
- **Closed**: 所有验证完成

---

## 违规处理

| 违规 | 处理 |
|------|------|
| 未创建Issue就开始工作 | 立即停止，补创建Issue |
| 未关闭Issue就声称完成 | 退回，要求走完流程 |
| 缺少测试报告 | 不验收，要求补充 |
| 文档与代码不一致 | 回滚，先补文档 |

---

*本文档为PM工作准则，所有PM行为应遵循此规范*
