# Release & Build Management Process

## 核心原则

| 阶段 | 触发 | 目标 | 负责人 |
|------|------|------|--------|
| **DEV开发** | Feature Branch PR合并 | 构建测试 | DEV |
| **CI构建** | Push to main | 生成镜像 | CI/CD |
| **QA验证** | 批量累积/PM通知 | 测试环境验证 | QA |
| **Release发布** | QA通过 | 稳定版本发布 | PM/DEVOPS |
| **Mac Local刷新** | Release完成 | 开发者本地测试 | DEVOPS |

---

## PM管控机制

### QA验收队列

PM维护一个待验收Issue队列，可以**批量累积**多个Issue后再统一安排QA验收：

```json
// qa-queue.json - PM管控的QA验收队列
{
  "last_updated": "2026-07-01T05:30:00Z",
  "pending_qa": [
    {
      "issue": 155,
      "title": "学生编辑Modal z-index问题",
      "dev_done_at": "2026-07-01T04:00:00Z",
      "status": "ready_for_qa"
    }
  ],
  "qa_in_progress": [],
  "qa_passed": [],
  "qa_failed": []
}
```

### PM检查清单（每次心跳）

- [ ] 检查QA队列是否有待验收Issue
- [ ] 检查是否有新完成的Issue需要加入队列
- [ ] 批量累积足够后安排QA验收
- [ ] 跟踪QA验收结果

---

## 阶段1: DEV完成开发

### 流程
```
DEV 完成代码修改
    ↓
提交到 feature/xxx 分支 / 或直接合并到 main
    ↓
触发 CI Pipeline
```

### DEV操作
```bash
# 1. 完成代码
git commit -m "fix(#155): 修复学生编辑Modal z-index问题"

# 2. 推送到 main（触发CI）
git push origin main
```

---

## 阶段2: CI构建

### GitHub Actions流程
```
Push to main:
  1. Build frontend Docker image
     → Tag: ghcr.io/jchu-hk/school-admin-system/frontend:sha-{sha}
     → Tag: ghcr.io/jchu-hk/school-admin-system/frontend:latest
  
  2. Build backend Docker image
     → Tag: ghcr.io/jchu-hk/school-admin-system/backend:sha-{sha}
     → Tag: ghcr.io/jchu-hk/school-admin-system/backend:latest
  
  3. Push to GHCR
  4. 通知: PM (Dashboard更新)
```

### 镜像Tag规则
| Tag | 含义 | 何时更新 | 用途 |
|-----|------|----------|------|
| `sha-{commit}` | 特定提交 | 每次push | 调试 |
| `latest` | 最新开发版 | PR合并到main | **测试环境** |
| `v1.5.6` | 正式Release | QA通过后 | **Mac Local** |

---

## 阶段3: DEVOPS部署测试环境

### PM管控
PM**主动派发**DEVOPS任务，不等待：
```bash
python3 skills/pm-orchestrator/scripts/assign_task.py \
  --from PM --to DEVOPS \
  --issue 155 \
  --message "部署最新镜像到测试环境" \
  --spawn
```

### DEVOPS操作
```bash
# 1. 拉取最新镜像
docker pull ghcr.io/jchu-hk/school-admin-system/frontend:latest
docker pull ghcr.io/jchu-hk/school-admin-system/backend:latest

# 2. 重启容器
docker-compose -f docker-compose.local.yml up -d frontend backend

# 3. 验证
curl http://localhost:8080/api/health
curl http://localhost:3000/api/health
```

### PM收到通知后
1. 确认测试环境可用
2. **将Issue加入QA队列**
3. 等待批量累积或立即安排QA

---

## 阶段4: QA验收队列

### PM管理QA队列

| 操作 | 命令 |
|------|------|
| 添加到队列 | `python3 scripts/qa_queue.py --add 155` |
| 查看队列 | `python3 scripts/qa_queue.py --list` |
| 派发QA | `python3 scripts/qa_queue.py --assign-qa` |
| 更新状态 | `python3 scripts/qa_queue.py --update 155 --status passed` |

### 批量验收策略

**PM决定何时派发QA**：

| 场景 | PM操作 |
|------|--------|
| 单个紧急P0 | 立即派发QA |
| 多个Issue累积 | 每天固定时间派发 |
| 累积>=5个Issue | 立即派发QA |

### PM的QA管控规则

```
┌─────────────────────────────────────────────────────────────┐
│ PM QA管控清单                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ □ DEV完成 → 加入QA队列                                      │
│                                                             │
│ □ 队列>=5个Issue → 立即派发QA                                │
│                                                             │
│ □ 每天09:00/18:00 → 检查队列，必要时派发QA                  │
│                                                             │
│ □ QA结果 → 更新队列状态                                      │
│                                                             │
│ □ QA全部通过 → 创建Release → Mac Local刷新                  │
│                                                             │
│ □ 有Issue失败 → 退回DEV修复 → 重新加入队列                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 阶段5: Release发布

### 触发条件
| 条件 | 操作 |
|------|------|
| QA全部通过 | PM确认可发布 |
| 需要版本号 | 创建GitHub Release |

### 发布流程
```bash
# 1. PM确认发布
# 2. 创建Release Tag
git tag -a v1.5.6 -m "Fix #155: 学生编辑Modal问题"
git push origin v1.5.6

# 3. CI自动构建Release镜像
# → Tag: ghcr.io/jchu-hk/school-admin-system/frontend:v1.5.6

# 4. PM通知Mac Local刷新
```

---

## 阶段6: Mac Local刷新

### PM派发任务
```bash
python3 skills/pm-orchestrator/scripts/assign_task.py \
  --from PM --to DEVOPS \
  --message "刷新Mac Local到v1.5.6" \
  --spawn
```

### DEVOPS操作
```bash
# 1. 拉取Release版本
docker pull ghcr.io/jchu-hk/school-admin-system/frontend:v1.5.6
docker pull ghcr.io/jchu-hk/school-admin-system/backend:v1.5.6

# 2. 重启容器
docker-compose up -d
```

---

## 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DEV 完成开发                                             │
│    git commit → git push origin main                       │
│    → CI自动构建 → GHCR推送                                   │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. DEVOPS 部署测试环境                                       │
│    PM派发 → DEVOPS执行 → 拉取latest镜像                     │
│    → 重启容器 → 验证                                         │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PM 管控QA队列                                            │
│    → 将Issue加入队列                                        │
│    → 累积多个Issue                                          │
│    → 达到条件后派发QA                                       │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. QA 验收                                                  │
│    PM派发 → QA执行 → 报告结果                               │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
          ┌───────────┴───────────┐
          ↓                       ↓
    ┌──────────┐           ┌──────────┐
    │ QA 通过   │           │ QA 失败   │
    └─────┬────┘           └─────┬────┘
          ↓                       ↓
    ┌──────────────┐       ┌──────────────┐
    │ PM 创建 Release │      │ 退回DEV修复  │
    │ → Mac Local   │       │ 重新加入队列  │
    └──────────────┘       └──────────────┘
```

---

## QA队列管理脚本

### 位置
`scripts/qa_queue.py`

### 功能
```bash
# 查看队列
python3 scripts/qa_queue.py --list

# 添加Issue到队列
python3 scripts/qa_queue.py --add 155 --title "学生编辑Modal问题"

# 更新状态
python3 scripts/qa_queue.py --update 155 --status passed
python3 scripts/qa_queue.py --update 155 --status failed

# 派发QA
python3 scripts/qa_queue.py --assign-qa

# 统计
python3 scripts/qa_queue.py --stats
```

---

## Dashboard集成

Dashboard显示PM管控状态：

| 组件 | 显示内容 |
|------|----------|
| QA队列 | 待验收/验收中/已通过/失败 |
| 队列数量 | pending: 3, in_progress: 1, passed: 5, failed: 1 |
| 下次QA | 预计时间 / 达到条件 |

---

## 待办事项

- [ ] 创建 `scripts/qa_queue.py` 队列管理脚本
- [ ] Dashboard集成QA队列显示
- [ ] PM心跳检查QA队列
- [ ] 文档更新: PROJECT-WIKI.md