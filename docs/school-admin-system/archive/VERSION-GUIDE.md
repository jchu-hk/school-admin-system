# 文档版本管理操作指南
## SPEC Versioning — Operations Guide

> **状态：** 生效
> **适用文件：** `SPEC-COMPLETE.md` 及所有归档版本

---

## 1. 工作目录结构

```
docs/school-admin-system/
├── SPEC-COMPLETE.md          ← ⚠️ 始终保持为最新版本
├── SPEC-SYSTEM-DESIGN.md     ← ⚠️ 系统架构设计（独立版本号）
├── SPEC-README.md
└── archive/                  ← 历史版本快照（不可编辑）
    ├── SPEC-SCHOOL-ADMIN-v1.0.0.md
    ├── SPEC-SCHOOL-ADMIN-v1.1.0.md
    ├── SPEC-SCHOOL-ADMIN-v1.2.0.md
    ├── SPEC-SCHOOL-ADMIN-v1.3.0.md
    ├── SPEC-SYSTEM-DESIGN-v0.3.md
    └── VERSION-GUIDE.md       ← 本文件
```

> ⚠️ **规则：** `archive/` 内的文件为只读快照，**禁止直接编辑**。
> 如需修改旧版本内容，请通过正规变更流程（见 §3）。

---

## 2. 版本命名规范

| 用途 | 命名格式 | 示例 |
|------|----------|------|
| 当前工作文件 | `SPEC-COMPLETE.md` | — |
| 归档快照 | `SPEC-<项目>-v<Major>.<Minor>.<Patch>.md` | `SPEC-SCHOOL-ADMIN-v1.2.0.md` |
| 变更分支（非必须）| `spec/<变更描述>` | `spec/user-auth-module` |

---

## 3. 标准变更流程

### 3.1 Patch（文档修正）
1. 直接编辑 `SPEC-COMPLETE.md`
2. 更新 `附录 A.1` Changelog 总表（变更类型 = `Patch`）
3. 在 `附录 A.2` 新增本版本历史详情
4. 替换 `archive/` 中对应的旧快照（文件覆盖）
5. 更新文档头部版本号（如 v1.2.1）

### 3.2 Minor（新增功能/模块）
1. 从 `SPEC-COMPLETE.md` 创建新分支（如需要）：
   ```bash
   # 假设 workspace 可用 Git 时
   git checkout -b spec/<功能描述>
   ```
2. 编辑 `SPEC-COMPLETE.md`，新增功能内容
3. 更新 `附录 A.1`（变更类型 = `Minor`）和 `附录 A.2`
4. **发布前：**
   - 将当前归档快照命名保存至 `archive/SPEC-SCHOOL-ADMIN-v<X.Y.Z>.md`
   - 更新文档头部版本号
   - 将新快照也保存至 `archive/`（覆盖或新增）

### 3.3 Major（架构级变更）
1. 项目经理审批后执行
2. 所有变更通过文档评审（见 `附录 A.4`）
3. 保留旧版本快照于 `archive/`
4. 更新 `SPEC-COMPLETE.md`，标记 `附录 A` 中 `变更类型 = Major`

---

## 4. 发布检查清单（Pre-Release Checklist）

每次正式发布前，确认以下项目已完成：

- [ ] 所有变更已写入 `附录 A.1` Changelog 总表
- [ ] `附录 A.2` 已新增版本历史详情（含变更序号）
- [ ] `附录 A.4` 评审审批记录已填写（评审人 + 结果）
- [ ] 文档头部「当前版本」号已更新
- [ ] 文档头部「审批人」已填写（或标注 Pending）
- [ ] 旧版快照已保存至 `archive/`
- [ ] 新版本快照已保存至 `archive/`
- [ ] `archive/VERSION-GUIDE.md` 已更新（如有变更）
- [ ] 本次变更已通知相关利益方（校务主任 / 项目经理）

---

## 5. 存档管理

| 规则 | 说明 |
|------|------|
| 保留数量 | 保留最近 **3 个正式版本**（Major + Minor）|
| 超出处理 | 更旧的版本移至 `/docs/archive/legacy/` 目录 |
| 删除限制 | Patch 版本快照可用新版覆盖后删除；Major 版本**永久保留** |
| 命名保护 | 存档文件名不得包含空格或特殊字符 |

---

## 6. 当前版本状态

### SPEC-COMPLETE.md (功能规格)

| 版本 | 文件 | 日期 | 状态 | 备注 |
|------|------|------|------|------|
| **v1.3.0** | `SPEC-SCHOOL-ADMIN-v1.3.0.md` | 2026-05-25 | ✅ Current | 多语言支持系统添加 (Module 8)，4个新函数，49个功能 |
| **v1.2.0** | `SPEC-SCHOOL-ADMIN-v1.2.0.md` | 2026-05-24 | 📁 Archived | 文档版本管理系统添加 |
| v1.1.0 | `SPEC-SCHOOL-ADMIN-v1.1.0.md` | 2026-05-24 | 📁 Archived | 用户与权限管理系统添加 |
| v1.0.0 | `SPEC-SCHOOL-ADMIN-v1.0.0.md` | 2026-05-23 | 📁 Archived | 初始版本，5大模块，38个功能 |

### SPEC-SYSTEM-DESIGN.md (系统架构)

| 版本 | 文件 | 日期 | 状态 | 备注 |
|------|------|------|------|------|
| **v0.3** | `SPEC-SYSTEM-DESIGN-v0.3.md` | 2026-05-25 | ✅ Current | 多语言支持架构 (Section 7)，Module 4 详细设计 |
| v0.2 | (overwritten) | 2026-05-25 | 🔄 Superseded | 章节编号修正 |
| v0.1 | (overwritten) | 2026-05-25 | 🔄 Superseded | 初始草稿 |

> 📝 **说明：** SPEC-SYSTEM-DESIGN.md 采用独立版本号 (v0.x)，与 SPEC-COMPLETE.md 的语义化版本号不同步。

