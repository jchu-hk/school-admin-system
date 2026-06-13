


## 2026-06-13 — PM教训: 时间感知缺失

**问题**: PM报告准时率0% (4/4次延误)
- 10:00 延误66分钟
- 14:00 延误19分钟
- 18:00 延误11分钟
- 22:00 延误42分钟

**根本原因**: PM没有内部时间感知
- PM只在收到消息时"醒来"
- 无法主动检查时间
- 依赖外部触发（cron/用户提醒）失效

**永久解决方案**:
1. PM每次醒来先检查时间
2. 报告时间±15分钟立即生成报告
3. 不依赖任何外部触发

**教训**: 承诺无效，机制才有效。必须建立真正的触发机制。

---

## 2026-06-13 — Git分支管理规则建立

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

