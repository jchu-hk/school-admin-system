# Release & Build Management Process

## 核心原则

| 阶段 | 触发 | 目标 | 负责人 |
|------|------|------|--------|
| **DEV开发** | Feature Branch PR合并 | 构建测试 | DEV |
| **CI构建** | Push to main | 生成镜像 | CI/CD |
| **QA验证** | 镜像构建完成 | 测试环境验证 | QA |
| **Release发布** | QA通过 | 稳定版本发布 | PM/DEVOPS |
| **Mac Local刷新** | Release完成 | 开发者本地测试 | DEVOPS |

---

## 阶段1: DEV完成开发

### 流程
```
DEV 完成代码修改
    ↓
提交到 feature/xxx 分支
    ↓
创建 PR / 或直接合并到 main
    ↓
触发 CI Pipeline
```

### 镜像Tag规则
| Tag | 含义 | 何时更新 |
|-----|------|----------|
| `sha-{commit}` | 特定提交 | 每次push |
| `latest` | 最新稳定版 | 每次PR合并到main |
| `v1.5.5` | Release版本 | 手动发布 |

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
```yaml
Push to main:
  1. Build frontend Docker image
     → Tag: ghcr.io/jchu-hk/school-admin-system/frontend:sha-{sha}
     → Tag: ghcr.io/jchu-hk/school-admin-system/frontend:latest
  
  2. Build backend Docker image
     → Tag: ghcr.io/jchu-hk/school-admin-system/backend:sha-{sha}
     → Tag: ghcr.io/jchu-hk/school-admin-system/backend:latest
  
  3. Push to GHCR
```

### 构建产物
| 镜像 | Registry | Latest Tag | SHA Tag |
|------|----------|------------|---------|
| Frontend | ghcr.io | ✅ 已推送 | ✅ 已推送 |
| Backend | ghcr.io | ✅ 已推送 | ✅ 已推送 |

---

## 阶段3: QA验证环境

### 部署位置
| 环境 | URL | 用途 |
|------|-----|------|
| **测试环境** | `cloudflare-tunnel-url` | QA验证 |
| **本地环境** | `localhost:8080` | 开发者测试 |

### QA验证流程
```
CI构建完成 (镜像已推送到GHCR)
    ↓
DEVOPS 部署到测试环境
    ↓
QA 访问测试环境验证
    ↓
QA 通过/失败
    ↓
通知PM结果
```

### 测试环境部署命令
```bash
# 方式1: 使用 docker-compose (推荐)
cd infra
docker-compose -f docker-compose.test.yml pull frontend backend
docker-compose -f docker-compose.test.yml up -d

# 方式2: 手动拉取最新镜像
docker pull ghcr.io/jchu-hk/school-admin-system/frontend:latest
docker pull ghcr.io/jchu-hk/school-admin-system/backend:latest
docker-compose -f docker-compose.local.yml up -d

# 验证部署
curl http://localhost:8080/api/health
```

### QA验收清单
| 检查项 | 通过标准 |
|--------|----------|
| 功能测试 | 按Issue描述验证功能正常 |
| 回归测试 | 不破坏现有功能 |
| UI测试 | 样式/布局正常 |

### QA操作
```bash
# QA验收后报告
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "Issue #155 QA验证通过" \
  --type done

# 或失败
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "Issue #155 QA验证失败: [原因]" \
  --type failed
```

---

## 阶段4: Release发布

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
# → Tag: ghcr.io/jchu-hk/school-admin-system/backend:v1.5.6

# 4. 更新Release Notes
gh release create v1.5.6 \
  --title "v1.5.6 - Bug Fix Release" \
  --notes "Fix #155: 学生编辑Modal问题"
```

### Release镜像
| Tag | 含义 | 何时更新 |
|-----|------|----------|
| `v1.5.6` | 正式发布版本 | Release Tag |
| `latest` | 最新稳定版 | Release Tag |

---

## 阶段5: Mac Local刷新

### 开发者本地更新
```bash
# 1. 拉取最新Release版本
docker pull ghcr.io/jchu-hk/school-admin-system/frontend:v1.5.6
docker pull ghcr.io/jchu-hk/school-admin-system/backend:v1.5.6

# 2. 重启容器
docker-compose -f docker-compose.local.yml up -d

# 3. 验证版本
docker ps | grep school-admin
```

### 自动刷新机制 (可选)
```bash
# 使用 watchtower 自动更新
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300
```

---

## 当前问题 & 解决方案

### 问题1: 本地容器没自动更新
| 问题 | 原因 | 解决 |
|------|------|------|
| 本地容器还是旧版本 | 没有拉取latest | DEVOPS手动拉取或设置自动刷新 |

### 问题2: QA不知道在哪测试
| 问题 | 原因 | 解决 |
|------|------|------|
| 测试URL不明确 | 没有固定测试URL | DEVOPS维护稳定测试URL |

### 问题3: latest vs Release Tag混淆
| Tag | 用途 | 更新时机 |
|-----|------|----------|
| `sha-xxx` | 特定提交测试 | 每次push |
| `latest` | 开发中最新 | 每次main push |
| `v1.5.6` | 正式发布 | Release tag |

---

## 总结: 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│ DEV 完成开发                                                │
│   git commit → git push origin main                        │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ CI Pipeline (自动)                                          │
│   1. Build Docker images                                   │
│   2. Push to GHCR: latest + sha-xxx                       │
│   3. 通知: PM / Dashboard                                  │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ DEVOPS 部署到测试环境                                       │
│   docker pull ghcr.io/.../frontend:latest                 │
│   docker-compose up -d                                     │
│   通知QA测试URL                                             │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ QA 验收                                                      │
│   1. 访问测试URL                                            │
│   2. 按Issue验证功能                                        │
│   3. 报告结果 (通过/失败)                                    │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
          ┌───────────┴───────────┐
          ↓                       ↓
    ┌──────────┐           ┌──────────┐
    │ QA 通过   │           │ QA 失败   │
    └─────┬────┘           └─────┬────┘
          ↓                       ↓
    ┌──────────────┐       ┌──────────────┐
    │ PM 创建 Release │      │ 返回DEV修复    │
    │ git tag v1.5.6 │       └──────────────┘
    └─────┬──────────┘
          ↓
    ┌─────────────────────────────────────────────────────────┐
    │ Release Pipeline (自动)                                  │
    │   1. Build: v1.5.6 images                               │
    │   2. Push to GHCR: v1.5.6                              │
    │   3. Update latest tag                                  │
    └─────────────────────┬───────────────────────────────────┘
                          ↓
    ┌─────────────────────────────────────────────────────────┐
    │ Mac Local 开发者刷新 (手动/自动)                         │
    │   docker pull .../v1.5.6                               │
    │   docker-compose up -d                                  │
    └─────────────────────────────────────────────────────────┘
```

---

## 关键规则

1. **latest 不等于 Release** - latest是开发中最新，可能未经验证
2. **QA验证后才能Release** - 确保质量
3. **明确谁负责什么**:
   - DEV: 提交代码
   - CI: 自动构建
   - DEVOPS: 部署测试环境
   - QA: 验收测试
   - PM: Release决策

---

## 待办事项

- [ ] DEVOPS创建 `docker-compose.test.yml` 测试环境配置
- [ ] DEVOPS维护固定测试URL
- [ ] 设置测试环境自动刷新机制
- [ ] 文档更新: PROJECT-WIKI.md