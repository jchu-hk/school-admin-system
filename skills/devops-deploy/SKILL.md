# DEVOPS Agent - 部署执行 Skill

**版本**: v1.0.0  
**职责**: 部署执行、环境管理、CI/CD 维护  
**原则**: 依赖解耦、标准化、无 Token

## 职责边界

| 角色 | 职责 |
|------|------|
| **PM** | 决定何时部署、部署什么版本、通知 QA |
| **DEVOPS** | 执行部署脚本、验证部署结果、管理环境 |
| **DEV** | 代码开发、提交 PR |
| **QA** | 验收测试 |

## PM 请求 DEVOPS 部署

PM 使用 `agent-communication` Skill 通知 DEVOPS：

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEVOPS \
  --message "[部署请求] v1.5.6 已就绪，请部署到测试环境" \
  --type deploy --status pending
```

## DEVOPS 部署流程

### Step 1: 接收部署请求

DEVOPS 检查消息队列，发现 `type=deploy` 的请求。

### Step 2: 执行部署

```bash
# 方式 1: 自动全量部署
bash skills/pm-deploy/scripts/full-deploy.sh auto

# 方式 2: PM 控制分步部署
bash skills/pm-deploy/scripts/full-deploy.sh pm
```

### Step 3: 验证部署

```bash
bash skills/pm-deploy/scripts/verify-deployment.sh
```

### Step 4: 报告结果

```bash
# 部署成功
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "[部署完成] v1.5.6 已部署到测试环境，验证通过" \
  --type deploy --status done

# 部署失败
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "[部署失败] v1.5.6 部署失败，原因: xxx" \
  --type deploy --status failed
```

## PM 工作流程（重构后）

```
DEV 合并代码到 main
        ↓
PM 评估是否需要部署
        ↓
PM 请求 DEVOPS: "部署 v1.5.6"
        ↓
DEVOPS 执行部署脚本
        ↓
DEVOPS 报告结果给 PM
        ↓
PM 通知 QA 验收
```

## PM 命令示例

| 场景 | PM 操作 |
|------|---------|
| 常规部署 | `PM: "请 DEVOPS 部署最新代码到测试环境"` |
| 指定版本 | `PM: "请 DEVOPS 部署 v1.5.6 到测试环境"` |
| 仅前端 | `PM: "请 DEVOPS 重新部署前端"` |
| 回滚 | `PM: "请 DEVOPS 回滚到 v1.5.5"` |

## DEVOPS Skill 文件

```
skills/devops-deploy/
├── SKILL.md                    # 本文件
└── scripts/
    ├── full-deploy.sh          # 来自 pm-deploy skill
    ├── deploy-frontend.sh
    ├── deploy-backend.sh
    └── verify-deployment.sh
```

## 部署检查清单

| 检查项 | 预期 | 验证方式 |
|--------|------|---------|
| 容器运行 | running | `docker ps` |
| 前端 Health | 200 OK | `curl /api/health` |
| 后端 Health | 200 OK | `curl localhost:3000/api/health` |
| 网络连通 | 无 502 | API 响应正常 |

## 错误处理

| 错误码 | 说明 | DEVOPS 动作 |
|--------|------|-------------|
| E001 | Git 仓库不存在 | 报告 PM，终止 |
| E002 | Docker 构建失败 | 查看日志，修复或报告 |
| E003 | 后端编译失败 | 查看日志，修复或报告 |
| E004 | 健康检查失败 | 回滚或重试 |

## 回滚流程

```bash
# 查看历史镜像
docker images | grep school-admin

# 回滚命令
docker stop school-admin-frontend
docker rm school-admin-frontend
docker run -d --name school-admin-frontend -p 8080:80 school-admin-frontend:<tag>
docker restart school-admin-backend
```
