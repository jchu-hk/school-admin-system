# Version Release Skill - 版本发布与 Wiki 更新

**版本**: v1.0.0  
**职责**: PM 执行版本发布、更新 Wiki、同步 About 页面  
**原则**: 依赖解耦、标准化、无 Token

## 概述

标准化版本发布流程：
1. 版本号递增
2. 更新 PROJECT-WIKI.md
3. 同步 CHANGELOG.md
4. 通知相关人

## 前置条件

1. 代码已合并到 `main`
2. 测试验收通过
3. Docker 镜像已构建

## 发布命令

### 方式 1: PM Agent 执行

```bash
# 版本发布
python3 skills/version-release/scripts/release.py \
  --version 1.5.7 \
  --changelog "Bug修复: 学生管理新增功能" \
  --commit abc1234

# 仅更新 Wiki
python3 skills/version-release/scripts/release.py --wiki-only
```

### 方式 2: 通过对话

```
PM: "发布 v1.5.7，修复学生管理新增功能"
```

## 输出文件

| 文件 | 说明 |
|------|------|
| `PROJECT-WIKI.md` | 更新当前版本、发布时间、环境信息 |
| `CHANGELOG.md` | 追加版本记录 |
| `docs/releases/v1.5.7.md` | 详细发布说明 |

## Wiki 更新内容

```markdown
## 📦 Current Version

- **Version**: v1.5.7
- **Release Date**: 2026-07-05 08:50 GMT+8
- **Git Commit**: `abc1234`
- **Status**: Released for Testing
- **Tested By**: QA Agent
- **Verified Features**:
  - Bug修复: 学生管理新增功能
```

## About 页面同步

About 页面从 `/version.json` 读取版本信息，在 Docker 构建时自动生成。

构建时传入：
- `--build-arg GIT_COMMIT=abc1234`
- `--build-arg GIT_BRANCH=main`

## 版本号规则

| 类型 | 格式 | 示例 |
|------|------|------|
| Major | x.0.0 | v2.0.0 (大改版) |
| Minor | x.y.0 | v1.6.0 (新功能) |
| Patch | x.y.z | v1.5.7 (Bug修复) |

## 发布检查清单

| 检查项 | 确认 |
|--------|------|
| 测试验收通过 | ☐ |
| Docker 镜像已构建 | ☐ |
| Wiki 更新完成 | ☐ |
| About 页面同步 | ☐ |
| Git tag 创建 | ☐ |
| 通知相关人 | ☐ |

## 关联 Skills

- `devops-deploy` - 部署到测试环境
- `agent-communication` - 通知 QA/PM
