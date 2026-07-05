# PM Deploy Skill - 标准化部署工具

**版本**: v1.0.0  
**作者**: PM Agent  
**原则**: 依赖解耦、标准化、无 Token

## 概述

提供标准化的前后端部署脚本，支持一键部署、分步部署、验证回滚。

## 依赖

| 组件 | 路径 | 说明 |
|------|------|------|
| 部署脚本 | `scripts/deploy-frontend.sh` | 前端构建+部署 |
| 后端脚本 | `scripts/deploy-backend.sh` | 后端编译+重启 |
| 验证脚本 | `scripts/verify-deployment.sh` | 健康检查 |
| 全量脚本 | `scripts/full-deploy.sh` | 一键全量部署 |

## 前置条件

1. 代码已合并到 `main` 分支
2. Git 仓库位于 `/workspace/school-admin-system`
3. Docker 服务运行中
4. PM 已确认要部署

## 使用方式

### 方式 1: 一键全量部署（推荐）

```bash
# 在 Git 仓库根目录执行
bash /workspace/projects/workspace/skills/pm-deploy/scripts/full-deploy.sh
```

### 方式 2: 分步执行

```bash
# Step 1: 构建前端
bash /workspace/projects/workspace/skills/pm-deploy/scripts/deploy-frontend.sh

# Step 2: 部署前端
bash /workspace/projects/workspace/skills/pm-deploy/scripts/deploy-frontend.sh --deploy-only

# Step 3: 后端编译
bash /workspace/projects/workspace/skills/pm-deploy/scripts/deploy-backend.sh

# Step 4: 验证
bash /workspace/projects/workspace/skills/pm-deploy/scripts/verify-deployment.sh
```

### 方式 3: PM Agent 调用

```
PM: "部署最新代码到测试环境"
PM Agent 执行: bash scripts/full-deploy.sh
```

## 输出格式

所有脚本输出统一的 JSON 格式日志：

```json
{
  "timestamp": "2026-07-05T08:40:00.000Z",
  "component": "frontend",
  "action": "build",
  "status": "success|failed",
  "details": {
    "git_commit": "926f7f5",
    "version": "1.5.5",
    "duration_seconds": 120
  }
}
```

## 部署检查清单

| 检查项 | 预期 | 验证方式 |
|--------|------|---------|
| 前端 Health | 200 OK | `curl /api/health` |
| 后端 Health | 200 OK | `curl localhost:3000/api/health` |
| 容器运行 | running | `docker ps` |
| 网络连通 | 无 502 | `curl localhost:8080/api/health` |

## 回滚流程

```bash
# 查看历史镜像
docker images | grep school-admin

# 回滚到指定镜像
docker stop school-admin-frontend
docker rm school-admin-frontend
docker run -d --name school-admin-frontend -p 8080:80 --restart always school-admin-frontend:<tag>
```

## 错误处理

| 错误码 | 说明 | 处理方式 |
|--------|------|---------|
| E001 | Git 仓库不存在 | 检查路径 |
| E002 | Docker 构建失败 | 查看构建日志 |
| E003 | 后端编译失败 | 检查 TypeScript 错误 |
| E004 | 健康检查失败 | 检查容器日志 |

## 关联 Skills

- `github-status` - 更新 Issue 状态
- `agent-communication` - 通知 QA 验收
