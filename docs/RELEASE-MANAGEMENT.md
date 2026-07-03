# 软件发布管理计划 (Release Management Plan)

> **目标**: 标准化 AI 团队变更 → 版本发布流程，确保质量、可追溯、可回滚。

---

## 一、发布策略

### 核心原则

| 原则 | 说明 |
|------|------|
| **每日发布** | 每天准备一个 Docker 镜像候选，但不是每天发布 |
| **按需发布** | 有重要修复/功能时才创建新版本 |
| **质量优先** | 所有变更必须通过 QA 验证 |
| **可追溯** | 每个版本关联 Git Tag + Release Notes |

### 发布频率

| 场景 | 频率 | 说明 |
|------|------|------|
| **Bug 修复（P0/P1）** | 立即发布 | 修复后 1 小时内发布 |
| **新功能** | 每周/每 2 周 | 功能完成 + QA 验收后发布 |
| **日常小改进** | 每天晚上 | 每天自动创建 Nightly 镜像 |
| **无变更** | 不发布 | 保持现有版本 |

---

## 二、发布流程

### 完整流程图

```
AI 团队变更（DEV + QA）
    ↓
代码提交 + QA 验收通过
    ↓
PM 审核变更
    ↓
决定是否需要发布？
    ├─ 否 → 等待下一次
    └─ 是 → 创建新版本
            ↓
        1. 更新 CHANGELOG.md
        2. 更新 version.json
        3. 创建 Git Tag
        4. 创建 GitHub Release
        5. 构建 Docker 镜像
        6. 更新文档（About Page 反映新版本）
        7. 通知用户（可选）
```

### 详细步骤

#### Step 1: PM 审核

PM 每天检查变更，决定是否需要发布：

```bash
# PM 每日检查任务
1. 查看 GitHub Issues 状态（P0/P1 已解决）
2. 查看 Git Commits（是否有重要变更）
3. 查看 Dashboard（QA 验收通过）
4. 决定是否发布
```

#### Step 2: 准备发布

**2.1 更新 CHANGELOG.md**

```markdown
## [1.5.7] - 2026-07-04

### Fixed
- Issue #XXX: Bug 描述

### Changed
- XXX 模块重构

### Added
- 新增 XXX 功能
```

**2.2 更新前端 version.json**

```json
{
  "version": "v1.5.7",
  "buildDate": "2026-07-04",
  "gitCommit": "<commit-hash>",
  "gitBranch": "main",
  "changelog": [
    {
      "version": "v1.5.7",
      "date": "2026-07-04",
      "changes": [
        "Bug修复: Issue #XXX",
        "新增: XXX 功能"
      ]
    }
  ]
}
```

**2.3 提交变更**

```bash
git add CHANGELOG.md school-admin-frontend/public/version.json
git commit -m "chore: prepare release v1.5.7"
git push
```

#### Step 3: 创建 Git Tag

```bash
# Tag 包含所有变更的 commit
git tag -a v1.5.7 <commit-hash> -m "Release v1.5.7 - [简短描述]"

# 推送 tag 到 GitHub
git push origin v1.5.7
```

#### Step 4: 创建 GitHub Release

```bash
gh release create v1.5.7 \
  --title "v1.5.7 - [标题]" \
  --notes "Release Notes 内容"
```

#### Step 5: 构建 Docker 镜像

```bash
# 构建后端镜像
docker build -f apps/backend/Dockerfile \
  -t school-admin-backend:latest \
  -t school-admin-backend:v1.5.7 \
  .

# 构建前端镜像（如果有独立镜像）
docker build -f school-admin-frontend/Dockerfile \
  -t school-admin-frontend:latest \
  -t school-admin-frontend:v1.5.7 \
  .
```

#### Step 6: 部署到测试环境（可选）

```bash
# 测试环境验证
docker compose -f infra/docker-compose.test.yml up -d --build

# 验证测试
curl http://test.school-admin.com/api/health
```

#### Step 7: 更新文档

- [ ] About Page 自动显示新版本（version.json）
- [ ] PROJECT-WIKI 更新版本号
- [ ] 内部通知团队

---

## 三、版本命名规则

### 语义化版本 (SemVer)

```
主版本号.次版本号.修订号
Major.Minor.Patch
```

| 变更类型 | 版本号变化 | 示例 |
|---------|-----------|------|
| 破坏性变更 | Major +1 | 1.5.6 → 2.0.0 |
| 新功能 | Minor +1 | 1.5.6 → 1.6.0 |
| Bug 修复 | Patch +1 | 1.5.6 → 1.5.7 |

### 预发布版本

| 标签 | 用途 | 示例 |
|------|------|------|
| `-nightly` | 每日构建候选 | 1.5.7-nightly |
| `-beta` | Beta 测试版 | 1.5.7-beta.1 |
| `-rc` | Release Candidate | 1.5.7-rc.1 |

---

## 四、Docker 镜像管理

### 镜像标签策略

| 标签 | 用途 | 更新频率 |
|------|------|---------|
| `latest` | 最新稳定版 | 每次发布后更新 |
| `v1.5.6` | 固定版本 | 永不变 |
| `nightly` | 每日构建 | 每天晚上更新 |

### Nightly 镜像自动构建

使用 GitHub Actions 自动构建 nightly 镜像：

```yaml
# .github/workflows/docker-nightly.yml
name: Docker Nightly Build
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点 (GMT+8)
  workflow_dispatch:    # 手动触发

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Backend Nightly
        run: |
          docker build -f apps/backend/Dockerfile \
            -t ghcr.io/jchu-hk/school-admin-backend:nightly \
            .
          docker push ghcr.io/jchu-hk/school-admin-backend:nightly
```

### 镜像保留策略

- **Latest**: 保留最近 10 个
- **版本标签**: 永久保留（用于回滚）
- **Nightly**: 保留最近 7 天

---

## 五、发布检查清单

每次发布前 PM 必须确认：

- [ ] 所有 Issues 状态已更新（已解决/已关闭）
- [ ] QA 验收通过（测试用例 + 结果）
- [ ] CHANGELOG.md 已更新
- [ ] version.json 已更新
- [ ] Git Tag 已创建并推送
- [ ] GitHub Release 已创建
- [ ] Docker 镜像已构建
- [ ] 测试环境验证通过（可选）
- [ ] 文档已同步更新

---

## 六、回滚计划

### 回滚条件

- P0 Bug 影响核心功能
- 严重性能问题
- 数据损坏

### 回滚步骤

```bash
# 1. 停止当前服务
docker compose -f infra/docker-compose.yml down

# 2. 拉取上一个版本镜像
docker pull ghcr.io/jchu-hk/school-admin-backend:v1.5.5

# 3. 修改 docker-compose.yml 使用旧版本
sed -i 's/:latest/:v1.5.5/' infra/docker-compose.yml

# 4. 重新部署
docker compose -f infra/docker-compose.yml up -d

# 5. 验证回滚
curl http://localhost:3000/api/health
```

### 数据库回滚

如果有数据库变更，需要执行回滚 migration：

```bash
docker exec school-admin-backend npx typeorm migration:revert
```

---

## 七、发布通知

### 通知渠道

| 渠道 | 用途 | 触发条件 |
|------|------|---------|
| GitHub Release | 正式发布 | 每次发布 |
| Email/SMS | 重要发布 | P0 修复 / Major 变更 |
| 内部文档 | 团队同步 | 每次发布 |
| Dashboard 状态 | 实时更新 | Git Push 触发 |

### 通知内容

```
🚀 发布通知 v1.5.7

时间: 2026-07-04 10:00

变更:
- Issue #197: currentClass 返回 null 修复 ✅
- Issue #198: 学号重用禁止 ✅

链接:
- GitHub Release: https://github.com/jchu-hk/school-admin-system/releases/tag/v1.5.7
- CHANGELOG: https://github.com/jchu-hk/school-admin-system/blob/main/CHANGELOG.md

部署:
- Docker 镜像: school-admin-backend:v1.5.7
- 前端版本: v1.5.7 (commit: abc1234)

回滚:
- 前一版本: v1.5.6
- 命令: docker compose up -d --image school-admin-backend:v1.5.6
```

---

## 八、当前状态

| 项目 | 当前版本 | 下一版本计划 | 状态 |
|------|---------|-------------|------|
| Git Tag | v1.5.6 (25354ad) | v1.5.7 | 待定 |
| Docker 镜像 | latest (包含 #197/#198 修复) | nightly (每日) | ✅ 就绪 |
| About Page | v1.5.6 (adc8dfd) | v1.5.7 | ✅ 同步 |
| CHANGELOG | v1.5.6 已记录 | v1.5.7 待记录 | 📝 维护中 |

---

## 九、PM 每日任务

### 每天晚上（22:00-23:00）

```bash
# 1. 检查变更
git log --since="1 day ago" --oneline

# 2. 检查 Issues
gh issue list --state open --limit 20

# 3. 检查 Dashboard
curl https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

# 4. 决定是否发布
# 如果有重要修复 → 执行发布流程
# 如果无重要变更 → 只创建 nightly 镜像
```

---

## 十、工具和脚本

### 自动发布脚本

```bash
#!/bin/bash
# scripts/release.sh
# 使用方法: ./scripts/release.sh v1.5.7 "Bug fixes for #197 and #198"

VERSION=$1
MESSAGE=$2

# 更新 version.json
cat > school-admin-frontend/public/version.json <<EOF
{
  "version": "$VERSION",
  "buildDate": "$(date +%Y-%m-%d)",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "main",
  "changelog": [...]
}
EOF

# 提交
git add .
git commit -m "chore: prepare release $VERSION"
git push

# 创建 Tag
git tag -a $VERSION -m "Release $VERSION - $MESSAGE"
git push origin $VERSION

# 创建 GitHub Release
gh release create $VERSION --title "$VERSION - $MESSAGE" --notes-file RELEASE_NOTES.md

# 构建镜像
docker build -f apps/backend/Dockerfile -t school-admin-backend:$VERSION .
docker tag school-admin-backend:$VERSION school-admin-backend:latest

echo "✅ Release $VERSION ready!"
```

---

## 十一、参考文档

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**文档版本**: v1.0.0
**最后更新**: 2026-07-04
**维护者**: PM Agent