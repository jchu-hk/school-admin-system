# GitHub Pages Deployment Guide for Multi-Agent Dashboard

## 长期解决方案: GitHub Pages

### 为什么选择 GitHub Pages？

| 对比 | htmlpreview | GitHub Pages |
|------|-------------|--------------|
| **缓存** | ❌ 服务端缓存（5-10分钟） | ✅ 无缓存（自动更新） |
| **URL** | ⚠️ 临时服务 | ✅ 永久稳定 |
| **渲染** | ⚠️ 有时失败 | ✅ 原生HTML渲染 |
| **延迟** | ❌ 推送后5-10分钟 | ✅ 推送后1-2分钟 |
| **依赖** | ❌ 第三方服务 | ✅ GitHub原生 |

### 新部署 URL（稳定）

```
https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html
```

### 如何启用 GitHub Pages

#### 方法1: 通过 GitHub UI（推荐）

1. 进入仓库: https://github.com/jchu-hk/school-admin-system
2. 点击 **Settings** → **Pages**
3. **Source** 选择:
   - Branch: `main`
   - Folder: `/ (root)`
4. 点击 **Save**
5. 等待 GitHub Actions 完成（1-2分钟）

#### 方法2: 通过 GitHub CLI

```bash
gh api \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  repos/jchu-hk/school-admin-system/pages \
  -f source[branch]=main \
  -f source[path]=/
```

### 自动部署

每次推送 `multi-agent-dashboard.html` 到 `main` 分支时:
- ✅ GitHub Actions 自动触发
- ✅ 部署到 GitHub Pages
- ✅ 1-2分钟后生效

### Workflow 文件

已创建: `.github/workflows/deploy-dashboard.yml`

```yaml
on:
  push:
    branches: [ main ]
    paths: ['multi-agent-dashboard.html']
```

### 更新 PROJECT-WIKI.md

需要在 wiki 中替换 URL:

**旧 URL**:
```
https://htmlpreview.github.io/?https://github.com/...
```

**新 URL**:
```
https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html
```

### 验证步骤

1. 启用 GitHub Pages（见上面）
2. 推送 dashboard 文件: `git push`
3. 等待 GitHub Actions 完成（查看 Actions 标签页）
4. 访问新 URL 验证

### 临时方案（在 GitHub Pages 启用前）

继续使用:
```
https://htmlpreview.github.io/?https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html?t=1782695402
```

时间戳可以绕过缓存。

---

**当前状态**:
- ✅ Workflow 文件已创建 (commit c4b0815)
- ⏳ 等待手动启用 GitHub Pages
- ⏳ 部署完成后更新 PROJECT-WIKI.md