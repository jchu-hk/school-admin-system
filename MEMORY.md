## 2026-06-25 — 多Agent协作系统正式实施

**目标**: PM被动触发 → 主动持续性工作

### 架构
agent-PM (调度中枢) → DEV/QA/DEVOPS/CHECKER

### 自动化Cron
- PM: GitHub Issue巡检 (每30分钟)
- PM: 每日状态汇报 (09:00, 18:00)
- PM: Subagent状态检查 (每60分钟)

### 文档
- docs/MULTI-AGENT-SYSTEM.md
- docs/agent-templates/AGENT-*.md





## 2026-06-25 — PM教训: 简单功能变更不应引入不必要复杂性

**问题**: About页面从静态文本改为i18n动态翻译后，页面空白(#136)

**根因分析**:
- 原版本(v1.4.0): 简单静态文本，无依赖，正常工作
- 新版本(v1.5.x): 引入 `useI18n()` hook，所有文本依赖 `t('about.xxx')`
- 如果i18n hook初始化失败 → 页面空白

**教训**:
1. **最小改动原则**: 简单功能不应引入不必要的依赖
2. **变更风险评估**: 从静态→动态，增加了失败点
3. **回归测试**: 每次变更后必须验证基础页面
4. **文档同步**: 每次代码变更必须在commit中注明变更原因和影响

**后续行动**:
- About页面考虑回退到静态版本(技术信息不需要动态翻译)
- 或添加fallback机制防止i18n失败时空白

---

## 2026-06-22 — PM教训: 设计文档同步规则确立

**问题**: Entity修复时发现字段名与数据库不一致，根本原因是文档与实际不同步。

**教训**: 任何代码修改涉及功能规格、系统设计、数据库设计、接口设计时，**必须先同步文档，再执行代码**。

**规则** (已写入AGENTS.md Section 9):
- 功能规格变更 → 更新 SPEC-COMPLETE.md
- 系统设计变更 → 更新 SPEC-SYSTEM-DESIGN.md
- 数据库变更 → 更新 DB-SCHEMA.md + DATA-DICTIONARY.md
- API变更 → 更新 API-DESIGN.md
- 紧急修复可事后补录，但24小时内必须完成

---

## 2026-06-14 AM — PM再次停工教训

**问题**: 昨晚23:25收到消息后，PM没有继续工作，导致CI问题未解决

**原因**: 
- PM仍在依赖外部触发
- 没有自动继续工作的机制
- 即使知道CI有问题，也没有主动继续修复

**教训**:
- 知道有问题就应该继续修复，不需要等用户提醒
- PM应该"主动发现问题并解决"，不是"等待问题被报告后再解决"

**改进**:
- 发现CI有87个错误后，立即spawn DEV agent修复
- 不等待用户确认才行动

---

## 2026-06-14 — AI团队7x24工作原则（核心）

**用户指令**: AI团队可以7x24，没有须要定工作的开始时间

**核心原则**:
1. **不需定时** - AI团队持续工作，不需要"到点才工作"
2. **按优先级** - 始终处理最高优先级的任务
3. **识别依赖** - 明确任务依赖关系，按顺序或并行执行
4. **规则执行** - 各角色按程序、规则执行，不需要人工触发

**PM工作方式**:
- 发现问题 → 立即解决
- 有阻塞 → 立即协调
- 有依赖 → 立即分配
- 持续工作直到完成

**不等待**:
- ❌ 不等用户提醒
- ❌ 不等定时报告
- ❌ 不等外部触发
- ✅ 持续工作

**各角色并行工作**:
- DEV → 开发
- QA → 测试
- DEVOPS → 部署/CI
- CHECKER → 审查
- PM → 协调

---

## 2026-06-13 — PM教训: 时间感知缺失

**问题**: feature/phase-3-abac积压6天，22个commit，30+文件冲突

**解决**: 
- 手动合并21个文件冲突 (8分钟)
- 建立Git分支管理规则 (AGENTS.md)
- Feature分支不超过3天
- PM每天检查分支状态

**规则**: 
- 短生命周期
- 及时合并
- 定期同步
- PM自主决策

---

## 2026-05-24 13:43 — School Admin Spec: Document Versioning System Added

**File:** `/workspace/projects/workspace/docs/school-admin-system/SPEC-COMPLETE.md`

### What was done
1. **Module 6 added** — User & Access Management (F-USER-001 to F-USER-007): user lifecycle, authN, RBAC+ABAC authZ, session/token mgmt, audit logging, credential reset, privilege escalation approval
2. **Document versioning system added** — SemVer (v1.2.0), Changelog (Appendix A.1/A.2), change type definitions (A.3), review & approval records (A.4), file management rules (A.5)
3. **Version archive created** at `docs/school-admin-system/archive/`:
   - `SPEC-SCHOOL-ADMIN-v1.0.0.md` — initial release, 5 modules, 38 functions
   - `SPEC-SCHOOL-ADMIN-v1.1.0.md` — +Module 6, 45 functions
   - `SPEC-SCHOOL-ADMIN-v1.2.0.md` — +versioning system, current
   - `VERSION-GUIDE.md` — operations guide for versioning workflow
4. **SPEC-COMPLETE.md updated** — section renumbering (Module 4→7, Module 5→8), cross-module summary updated

### Current state
- 7 modules total (MOD-DAILY-001, MOD-CYCL-001, MOD-FIN-001, MOD-USER-001, MOD-AI-001, MOD-INT-001 + one renumbering)
- 45 functions
- Version: v1.2.0 (Minor — versioning system added)
- Workspace is gitignored; versioning is file-based with archive snapshots
- All three version snapshots (v1.0.0/v1.1.0/v1.2.0) are in archive/

