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
# 2. 然后**立刻** spawn
# sessions_spawn(agentId="DEV")  ← ❌ 禁止！forbidden
sessions_spawn(runtime="subagent")  ← ✅ 正确
```

**违反这个规则 = Dashboard 不更新 = PM 失去对系统的可见性**

---

## 🚨 2026-07-11 新增规则：写消息后必须 spawn

**问题**：PM 多次犯了以下错误：
1. ✅ 调用了 `write_message --type assign --status running`
2. ❌ **但没有随后 spawn subagent**
3. ❌ 反而发了 `--type passed --to HUMAN`，导致脚本自动移除 `in-progress` 标签

**后果**：DEV/QA 的 Dashboard 状态显示 `running`，但实际从未被分配工作；Issue 标签错误地标记为完成。

**新规则**：
```
write_message --type assign → 必须立即 spawn subagent
```

```bash
# ❌ 禁止：写了 assign 但不 spawn
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV --message "[#217] 修复" --type assign --status running
# (没有 sessions_spawn) ← 违规！

# ✅ 正确：写消息 + 立即 spawn
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV --message "[#217] 修复" --type assign --status running
sessions_spawn(task="修复 #217")  # ← 紧跟着 spawn！
```

**禁止**：
- ❌ 只 assign 不 spawn（DEV 不会被激活）
- ❌ 先 `--to HUMAN --type passed` 后 assign（会移除 `in-progress`）
- ❌ assign 后做其他事忘了 spawn

**验证方法**：检查 spawn 后是否有 `DEV→PM type=received` 消息出现

---

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
