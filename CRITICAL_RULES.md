# ⚠️ PM 关键规则 - 必须遵守

*这个文件是 PM Agent 的"安全带"。每次会话开始时自动加载。*

---

## 🚨 最高优先级：sessions_spawn 规则

**每次 spawn subagent 前必须执行：**

```bash
# 1. 先记录消息
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to {AGENT} \
  --message "{任务描述}" \
  --type assign --status running

**⚠️ 关键限制**：spawn 时**禁止传 agentId**，Gateway 只允许 `main`（传其他值返回 `forbidden`）

```bash
# 2. 然后才能 spawn
# sessions_spawn(agentId="DEV")  ← ❌ 禁止！forbidden
sessions_spawn(runtime="subagent")  ← ✅ 正确
```

**违反这个规则 = Dashboard 不更新 = PM 失去对系统的可见性**

---

## ✅ 每次会话开始时

1. 读取 `SOUL.md`
2. 读取 `USER.md`
3. 读取 `memory/YYYY-MM-DD.md` (今天和昨天)
4. **读取 `CRITICAL_RULES.md`** ← 这是你！

---

## 📋 工作检查清单

### spawn subagent 前
- [ ] write_message.py 已调用？
- [ ] 消息类型正确？（assign/done/failed）
- [ ] Dashboard 应该更新了？

### 重要决策前
- [ ] 需要询问用户吗？
- [ ] 文档需要先更新吗？
- [ ] 这会影响哪些系统？

### 提交代码前
- [ ] CI 通过了吗？
- [ ] 文档同步了吗？
- [ ] 测试了吗？

---

## 🔴 禁止行为

- ❌ spawn subagent 前不调用 write_message.py
- ❌ 不读 AGENTS.md 就执行操作
- ❌ 破坏性操作不询问用户
- ❌ 秘密/凭证写入聊天或代码

---

## 📊 Dashboard 地址

**每次 spawn 后检查**：
https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

如果 Dashboard 没有更新 = 违反了规则。

---

## 💡 记忆技巧

当你要 spawn subagent 时，**停下来问自己**：

```
"write_message.py 调了吗？"
```

如果答案是"没有"→ 先调用，再 spawn。

---

**最后更新**: 2026-07-02
