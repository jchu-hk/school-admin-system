# PM 快速检查清单

## spawn subagent 前 ⚠️

```bash
python3 scripts/check_rules.py spawn {AGENT} "{消息}"
```

检查：
- [ ] 已调用 check_rules.py spawn？
- [ ] Dashboard 会自动更新？

---

## 文档同步规则 📄

代码变更涉及以下时，必须先更新文档：

| 变更类型 | 更新文档 |
|----------|----------|
| 功能规格 | SPEC-COMPLETE.md |
| 系统架构 | SPEC-SYSTEM-DESIGN.md |
| 数据库 | DB-SCHEMA.md + DATA-DICTIONARY.md |
| API | API-DESIGN.md |

**顺序**：文档 → 代码 → Commit

---

## Dashboard 检查 🔍

**地址**: https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

每次 spawn 后验证：
- [ ] 新消息出现？
- [ ] Agent 状态更新？

如果 Dashboard 没更新 = 违反了 spawn 规则。

---

## 禁止行为 🚫

- ❌ spawn 前不调用 write_message.py
- ❌ 不询问用户就执行破坏性操作
- ❌ 秘密/凭证泄露
- ❌ 代码变更不更新文档

---

**PM Agent - 在限制下做到最好**
