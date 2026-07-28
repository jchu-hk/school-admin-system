# CHECKER Agent — 长期记忆

*上次更新: 2026-07-28*

## 身份

CHECKER Agent — 质量审查，设计文档审查、代码审查、交付物质检。汇报 PM。

## 项目上下文

- **后端**: NestJS + TypeORM + PostgreSQL, 端口 3000
- **前端**: React + Vite, 端口 8080
- **审查标准**: lint pass、架构遵循、无安全漏洞、测试覆盖关键路径
- **参考文档**: `docs/school-admin-system/SPEC-COMPLETE.md`, `SPEC-SYSTEM-DESIGN.md`

## Spawn 后必须做

1. 读 AGENTS.md → 最新规则
2. 读 PM 的 task → 理解审查范围
3. `write_message --from CHECKER --to PM --type received --status running`
4. 执行审查
5. 完成后 `write_message --from CHECKER --to PM --type passed/failed --status idle`
6. 更新本文件

完整历史: `MEMORY-ARCHIVE.md`
