# 📋 PM项目管理流程规范

**版本**: v1.0  
**生效日期**: 2026-06-18  
**最后更新**: 2026-06-18 05:46

---

## 🎯 核心原则

1. **每个任务必须有验收** - DEVOPS部署后必须CHECKER验收
2. **质量第一** - 不追求速度，追求质量
3. **透明管理** - 所有状态在GitHub可见
4. **流程驱动** - 遵循既定流程，不跳过步骤

---

## 📊 角色职责

| 角色 | 职责 | 汇报对象 |
|------|------|----------|
| **PM** | 任务分配、进度监控、流程管理 | 用户 |
| **DEV** | 代码开发、功能实现 | PM |
| **DEVOPS** | 部署、环境配置、CI/CD | PM |
| **QA** | 测试用例设计、功能测试 | PM |
| **CHECKER** | 代码审查、部署验收 | PM |

---

## 🔄 标准工作流程

### 流程A: 新功能开发

```
1. PM 分析需求 → 创建Issue
2. PM 分配给DEV
3. DEV 开发代码 → 创建PR
4. CHECKER 审查PR
5. PM 合并PR
6. DEVOPS 部署到测试环境
7. CHECKER 验收部署 ← 【重要！】
8. PM 确认完成 → 关闭Issue
```

### 流程B: Bug修复

```
1. PM/QA 发现Bug → 创建Issue (label: bug)
2. PM 分配给DEV (label: dev-backend/dev-frontend)
3. DEV 修复 → 创建PR
4. CHECKER 审查PR
5. PM 合并PR
6. DEVOPS 部署
7. QA 验证Bug修复
8. CHECKER 确认部署 ← 【重要！】
9. PM 关闭Issue
```

### 流程C: 部署变更

```
1. DEVOPS 执行部署
2. DEVOPS 创建部署报告 → Post到Issue/PR
3. CHECKER 验收 ← 【必须！】
   - 构建验证
   - 功能验证
   - 代码完整性验证
4. CHECKER 确认通过/失败
5. 如失败 → 返回DEVOPS修复
```

---

## 📝 CHECKER验收标准

### 部署验收检查清单

**每个DEVOPS部署必须通过以下检查**:

#### 1. 构建验证
- [ ] `docker compose build` 无错误
- [ ] 镜像大小 > 100MB (非空)

#### 2. 容器验证
- [ ] 所有容器 `healthy` 或 `running`
- [ ] 无重启循环

#### 3. 功能验证
- [ ] Backend API: `curl /api/health` 返回200
- [ ] Frontend: 页面是**真实应用**，不是placeholder

#### 4. 代码完整性
- [ ] Frontend: `src/pages/` 有真实页面代码
- [ ] Backend: `src/modules/` 有真实模块代码

#### 5. 集成验证
- [ ] 前端可访问后端API
- [ ] 无CORS错误

---

## 🚨 违规处理

| 违规 | 处理 |
|------|------|
| DEVOPS跳过CHECKER验收 | PM警告，记录到检讨 |
| CHECKER未认真验收 | PM警告，重新验收 |
| PM跳过流程 | 用户提醒，整改 |

---

## 📊 GitHub Issue标签规范

### 角色标签
- `dev-backend` - 后端开发
- `dev-frontend` - 前端开发
- `ops` - 运维任务
- `qa` - 测试任务
- `checker` - 代码审查

### 优先级标签
- `p0` - 紧急，必须立即处理
- `p1` - 高优，本周完成
- `p2` - 中优，本月完成
- `p3` - 低优，计划中

### 状态标签
- `in-progress` - 进行中
- `ready-for-review` - 待审查
- `ready-for-test` - 待测试
- `ready-for-deploy` - 待部署
- `done` - 已完成

---

## 📋 PM检查清单

### 每日检查 (Heartbeat)
- [ ] CI/CD状态正常
- [ ] 无阻塞的Issue
- [ ] 部署已完成验收
- [ ] 进度符合计划

### 每周检查
- [ ] Issue处理及时
- [ ] 无长期open的bug
- [ ] 代码质量达标
- [ ] 文档更新

---

## 🔗 相关文档

- `docs/qa/DEPLOYMENT-CHECKLIST.md` - 部署验收清单
- `docs/pm/WORK-MODE-7x24.md` - 7x24工作模式
- `AGENTS.md` - Agent管理规则

---

*PM Agent - 流程规范 v1.0*
