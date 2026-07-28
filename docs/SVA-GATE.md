# SVA Gate Catalog — Self-Verifying Agent Architecture

> **Version:** v1.0.0  
> **Status:** ⚡ ACTIVE — This file is authoritative. All agents MUST load this at session start.  
> **Last updated:** 2026-07-21 00:50 GMT+8

---

## 1. Overview

This document defines the **Role-Action Matrix** — the complete mapping of which actions each agent role is permitted or prohibited from performing. It is the single source of truth for gate evaluation.

Every agent MUST evaluate the appropriate gates before every tool call that affects a tracked action class.

---

## 2. Action Classes

```
CODE_MODIFY  — write/edit/apply_patch on source code files
DOC_MODIFY   — write/edit on documentation, config, rules files
READ         — read any file
SPAWN        — sessions_spawn / sessions_send
DEPLOY       — build, docker cp, docker exec, restart, deploy
VERIFY       — run tests, check output, validate
COMMIT       — git commit, git push
CONFIG       — modify infra config (docker-compose, nginx, prometheus, grafana)
AUDIT        — run check scripts, audit logs
ESCALATE     — ask human for decision
```

### CODE_MODIFY target classification

A file is classified as CODE_MODIFY if its extension matches:

```
.ts, .tsx, .js, .jsx, .mjs, .cjs
.py, .java, .go, .rb, .php
.css, .scss, .less, .html, .vue, .svelte
.sql, .prisma
.dockerfile, .Dockerfile
.yaml, .yml  (only outside scripts/ and .github/)
```

**Whitelist — files that are NOT CODE_MODIFY even if they match extensions:**

```
docs/*.md
scripts/*
agents/*
memory/*
.github/*
HEARTBEAT.md
MEMORY.md
AGENTS.md
SOUL.md
CRITICAL_RULES.md
TOOLS.md
PROJECT-WIKI.md
```

---

## 3. Role-Action Matrix

### 3.1 PM Role

| Action Class | Verdict | Condition | Redirect |
|---|---|---|---|
| CODE_MODIFY | 🛑 BLOCKED (hard) | Target is in code path | `spawn(DEV)` |
| DOC_MODIFY | ✅ ALLOWED | Target in whitelist | — |
| READ | ✅ ALLOWED | Always | — |
| SPAWN | ✅ ALLOWED | Always | — |
| DEPLOY | ⚠️ BLOCKED (soft) | Always | `spawn(OPS)` after QA sign-off |
| VERIFY | ⚠️ BLOCKED (soft) | Always | `spawn(QA)` |
| COMMIT | ⚠️ BLOCKED (soft) | Code commit | `spawn(DEV)` to commit |
| CONFIG | ⚠️ BLOCKED (soft) | Infra config change | `spawn(OPS)` |
| AUDIT | ✅ ALLOWED | Always | — |
| ESCALATE | ✅ ALLOWED | Always | — |

### 3.2 DEV Role

| Action Class | Verdict | Condition | Redirect |
|---|---|---|---|
| CODE_MODIFY | ✅ ALLOWED | On assigned issue/PR | — |
| DOC_MODIFY | ✅ ALLOWED | Documenting code changes | — |
| READ | ✅ ALLOWED | Always | — |
| SPAWN | 🛑 BLOCKED (hard) | Always | `notify(PM)` for delegation |
| DEPLOY | 🛑 BLOCKED (hard) | Always | `notify(PM)` → `spawn(OPS)` |
| VERIFY | ✅ ALLOWED | Self-test before commit | — |
| COMMIT | ✅ ALLOWED | After self-test passes | — |
| CONFIG | ⚠️ BLOCKED (soft) | Suggest changes only | `notify(OPS)` |
| AUDIT | ✅ ALLOWED | For own code | — |

### 3.3 QA Role

| Action Class | Verdict | Condition | Redirect |
|---|---|---|---|
| CODE_MODIFY | 🛑 BLOCKED (hard) | Always | `notify(PM)` → `spawn(DEV)` |
| DOC_MODIFY | ✅ ALLOWED | Testing docs/bug reports | — |
| READ | ✅ ALLOWED | Always | — |
| SPAWN | 🛑 BLOCKED (hard) | Always | `notify(PM)` |
| DEPLOY | 🛑 BLOCKED (hard) | Always | `notify(PM)` → `spawn(OPS)` |
| VERIFY | ✅ ALLOWED | Primary job | — |
| COMMIT | 🛑 BLOCKED (hard) | Always | `notify(PM)` |
| CONFIG | 🛑 BLOCKED (hard) | Always | `notify(PM)` → `spawn(OPS)` |
| AUDIT | ✅ ALLOWED | For own verification | — |

### 3.4 OPS Role

| Action Class | Verdict | Condition | Redirect |
|---|---|---|---|
| CODE_MODIFY | ⚠️ BLOCKED (soft) | Infra/tooling code only | Coordinate with DEV |
| DOC_MODIFY | ✅ ALLOWED | Ops docs | — |
| READ | ✅ ALLOWED | Always | — |
| SPAWN | 🛑 BLOCKED (hard) | Always | `notify(PM)` |
| DEPLOY | ✅ ALLOWED | Primary job | — |
| VERIFY | ✅ ALLOWED | Deployment verification | — |
| COMMIT | ✅ ALLOWED | Infra/config commits | — |
| CONFIG | ✅ ALLOWED | Primary job | — |
| AUDIT | ✅ ALLOWED | System health checks | — |

---

## 4. Gate Evaluation Procedure

This is the **immutable procedure** that every agent MUST execute BEFORE every tool call that could trigger any gate.

```
STEP 1 — Identify:
  Current role:        {PM | DEV | QA | OPS}
  Proposed action:     {CODE_MODIFY | DOC_MODIFY | READ | SPAWN | DEPLOY | VERIFY | COMMIT | CONFIG | AUDIT | ESCALATE}
  Target:              {file path | URL | system resource | ...}

STEP 2 — Query the Matrix:
  Look up (role, action_class) in Section 3.
  If the gate is BLOCKED(hard) or BLOCKED(soft):
    → Note the condition and redirect.
  If the gate is ALLOWED:
    → Note any condition.

STEP 3 — Resolve most-restrictive:
  If ANY gate returns BLOCKED(hard):    → FINAL = BLOCKED(hard)
  If ANY gate returns BLOCKED(soft)
     and none return BLOCKED(hard):     → FINAL = BLOCKED(soft)
  If ALL gates return ALLOWED:          → FINAL = ALLOWED

STEP 4 — Emit Verification Block:
  Format:  [=== VERIFICATION BLOCK v1 ===]
           Role:      {role}
           Action:    {action_class}
           Target:    {target}
           Gates:     {list of matched gates}
           Verdict:   {FINAL}
           Redirect:  {redirect action if BLOCKED}
           [=== END VERIFICATION BLOCK ===]

  ⚠️ The Verification Block MUST appear within 100 tokens before the tool call.
  ⚠️ It MUST be in the agent's output before the tool executes.

STEP 5 — Act:
  If FINAL = ALLOWED:     → Execute the original tool call.
  If FINAL = BLOCKED(soft): → Execute ESCALATE (ask human) or follow the redirect.
  If FINAL = BLOCKED(hard): → Execute the redirect action. Do NOT execute the original action.
```

---

## 5. Verification Block Template

```
[=== VERIFICATION BLOCK v1 ===]
Role:      <ROLE>
Action:    <ACTION_CLASS>
Target:    <TARGET>
Gates:     <GATE_NAMES>
Sources:   <rule references>
Verdict:   <ALLOWED | BLOCKED>
Redirect:  <redirect action if blocked>
[=== END VERIFICATION BLOCK ===]
```

**Example — PM blocked from editing code:**

```
[=== VERIFICATION BLOCK v1 ===]
Role:      PM
Action:    CODE_MODIFY
Target:    apps/backend/src/main.ts
Gates:     SVA-R01 (PM: CODE_MODIFY → BLOCKED hard)
Sources:   SOUL.md §2.2, CRITICAL_RULES.md §SVA, SVA-GATE.md §3.1
Verdict:   BLOCKED
Redirect:  write_message --from PM --to DEV --type assign → sessions_spawn(DEV)
[=== END VERIFICATION BLOCK ===]
```

**Example — PM allowed to edit docs:**

```
[=== VERIFICATION BLOCK v1 ===]
Role:      PM
Action:    DOC_MODIFY
Target:    docs/SPEC.md
Gates:     SVA-R02 (PM: DOC_MODIFY → ALLOWED on whitelist)
Sources:   SVA-GATE.md §3.1
Verdict:   ALLOWED
Redirect:  —
[=== END VERIFICATION BLOCK ===]
```

---

## 6. Orphan-Action Detection Rule

An **orphan action** is a tool call that requires a Verification Block but is not preceded by one within 100 tokens.

### Detection condition:

```
IF tool_call CAN_TRIGGER_A_GATE
  AND NOT preceded by [=== VERIFICATION BLOCK ===] within 100 tokens
  AND NOT part of the Verification Block itself:
    → ORPHAN ACTION
```

### Self-recovery:

When an orphan action is detected (by the agent's own output scan):

```
1. HALT: Stop processing the orphan action.
2. MARK: Flag the action as ORPHAN in an internal log.
3. CORRECT: Emit the missing Verification Block and decide the correct course.
4. RESUME: Follow the Verdict from the newly emitted block.
```

### Escalation:

If the agent detects an orphan action that was already executed (tool call emitted without a prior block):

```
1. LOG: Write to self-audit: {timestamp, action, target, role}
2. REPORT: Include in the next heartbeat or turn to the human.
3. AMEND: If possible, reverse the action (git revert, rollback).
```

---

## 7. Triple Audit Specification

Every action that triggers a gate MUST be verifiable through three independent traces:

| Trace | What | Where | When |
|---|---|---|---|
| **T1 — Inline Block** | Verification Block before tool call | Agent output stream | Before execution |
| **T2 — Orphan Scan** | Self-check for orphan actions | Agent's output buffer | After output, before return |
| **T3 — External Audit** | Git log + agent log cross-check | Cron job | Periodic (8h) |

### T3 Audit rule:

```
IF git log shows {author: "PM Agent", files: [code files]}
  AND agent log shows no Verification Block for that commit:
    → CRITICAL VIOLATION → notify human
ELSE IF git log shows {author: "PM Agent", files: [code files]}
  AND agent log shows Verification Block with Verdict=BLOCKED:
    → INCONSISTENCY → investigate (probable tool bypass)
ELSE IF git log shows {author: "PM Agent", files: [doc/whitelist]}
  → OK (allowed by gate catalog)
```

---

## 8. Gate Definitions (Alphabetical)

| ID | Gate | Role | Action | Verdict |
|---|---|---|---|---|
| SVA-R01 | PM_CODE_MODIFY | PM | CODE_MODIFY | BLOCKED hard |
| SVA-R02 | PM_DOC_MODIFY | PM | DOC_MODIFY | ALLOWED on whitelist |
| SVA-R03 | PM_SPAWN | PM | SPAWN | ALLOWED |
| SVA-R04 | PM_DEPLOY | PM | DEPLOY | BLOCKED soft |
| SVA-R05 | PM_VERIFY | PM | VERIFY | BLOCKED soft |
| SVA-R06 | PM_COMMIT | PM | COMMIT | BLOCKED soft |
| SVA-R07 | DEV_SPAWN | DEV | SPAWN | BLOCKED hard |
| SVA-R08 | DEV_DEPLOY | DEV | DEPLOY | BLOCKED hard |
| SVA-R09 | QA_CODE_MODIFY | QA | CODE_MODIFY | BLOCKED hard |
| SVA-R10 | QA_SPAWN | QA | SPAWN | BLOCKED hard |
| SVA-R11 | QA_DEPLOY | QA | DEPLOY | BLOCKED hard |
| SVA-R12 | QA_COMMIT | QA | COMMIT | BLOCKED hard |
| SVA-R13 | OPS_SPAWN | OPS | SPAWN | BLOCKED hard |
| SVA-R14 | OPS_CODE_MODIFY | OPS | CODE_MODIFY | BLOCKED soft |

---

## 9. Changelog

| Date | Version | Change |
|---|---|---|
| 2026-07-21 | v1.0.0 | Initial gate catalog — 14 gates defined |
