# 智能校务助理系统
## Smart School Admin AI System

<p align="center">
  <img src="https://img.shields.io/badge/version-v1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-development-yellow.svg" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/language-zh--HK-red.svg" alt="Language">
</p>

<p align="center">
  <b>基于 AI 的校务管理自动化平台</b><br>
  <i>Automated School Administration Platform powered by AI</i>
</p>

---

## 📋 目录

- [项目简介](#-项目简介)
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [系统架构](#-系统架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [文档](#-文档)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🎯 项目简介

智能校务助理系统是一套专为香港中小学校设计的智能化校务管理平台。系统结合人工智能技术，实现校务工作的自动化、智能化处理，大幅提升校务管理效率。

### 核心目标

- 🤖 **AI 驱动** - 智能问答、自动提醒、文档识别
- 📊 **数据可视化** - 实时仪表板、统计分析
- 🔒 **安全可靠** - PDPO 合规、双人见证、审计追踪
- 🌐 **多语言支持** - 繁体中文、简体中文、英文
- 📱 **多端适配** - Web、移动端响应式设计

---

## ✨ 功能特性

### 模块 1: 每日仪表板 (MOD-DAILY-001)
- ✅ 出勤统计与监控
- ✅ 迟到/早退记录管理
- ✅ 家长查询队列处理
- ✅ 午膳订购汇总
- ✅ 校车实时追踪与点名
- ✅ 请假申请处理
- ✅ 费用收取追踪

### 模块 2: 周期性校务 (MOD-CYCL-001)
- ✅ 新生注册管理
- ✅ AI 辅助编班
- ✅ 课本分发追踪
- ✅ DSE 报考管理
- ✅ 试卷与考试安排
- ✅ 成绩单生成发布
- ✅ 中一自行分配与 JUPAS 联招
- ✅ 学年财务结算与档案清理

### 模块 3: 财务资产 (MOD-FIN-001)
- ✅ 学费管理与催缴
- ✅ 零用现金报销
- ✅ 奖学金与津贴申请
- ✅ 校产条码盘点
- ✅ 场地租借管理
- ✅ 设备保养追踪
- ✅ 供应商注册评估

### 模块 4: 用户与访问管理 (MOD-USER-001)
- ✅ 用户生命周期管理
- ✅ 身份认证 (MFA 支持)
- ✅ RBAC + ABAC 权限控制
- ✅ 会话与 Token 管理
- ✅ 审计日志与登录记录
- ✅ 密码与凭证重置
- ✅ 权限变更审批流程

### 模块 5: AI 智能助理 (MOD-AI-001)
- ✅ 自然语言查询理解
- ✅ FAQ 智能匹配
- ✅ 周期性任务触发器
- ✅ 智能提醒系统
- ✅ OCR 文档识别

### 模块 6: 系统集成 (MOD-INT-001)
- ✅ WebSAMS 数据同步
- ✅ eClass 系统集成
- ✅ 隐私条例 (PDPO) 合规检查
- ✅ 双人见证流程
- ✅ 自动备份管理

### 模块 8: 多语言支持 (MOD-I18N-001)
- ✅ 繁体中文 (香港) - 默认
- ✅ 简体中文
- ✅ 英文
- ✅ 自动语言检测与切换
- ✅ 实时内容翻译 (LLM)
- ✅ 区域化格式本地化

---

## 🛠️ 技术栈

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | 运行环境 |
| NestJS | 10.x | Web 框架 |
| TypeScript | 5.x | 开发语言 |
| PostgreSQL | 16.x | 主数据库 |
| Redis | 7.x | 缓存与会话 |
| Kafka | 3.x | 消息队列 |
| MinIO | 2024.x | 对象存储 |

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| Next.js | 14.x | 管理后台 |
| TypeScript | 5.x | 开发语言 |
| Tailwind CSS | 3.x | 样式框架 |
| i18next | 23.x | 国际化 |

### AI/ML
| 技术 | 用途 |
|------|------|
| Coze / OpenAI | LLM  provider |
| Azure Computer Vision | OCR 识别 |
| text-embedding-3 | 语义搜索 |
| pgvector | 向量存储 |

### 基础设施
| 技术 | 用途 |
|------|------|
| Kubernetes | 容器编排 |
| Docker | 容器化 |
| Istio | 服务网格 |
| Kong | API 网关 |
| HashiCorp Vault | 密钥管理 |
| Prometheus + Grafana | 监控告警 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│         Web App (React)    Admin UI (Next.js)   Mobile      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      API Gateway (Kong)                      │
│            Auth │ Rate Limit │ WAF │ TLS Termination        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Services Layer                          │
│  Dashboard │ Cyclic │ Finance │ User │ AI │ Integration     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Data Layer                              │
│  PostgreSQL │ Redis │ MinIO │ Elasticsearch │ Kafka          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20.x
- pnpm >= 8.x
- Docker >= 24.x (可选)
- PostgreSQL >= 16.x
- Redis >= 7.x

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 4. 启动开发服务器
pnpm dev

# 5. 访问应用
# Web 应用: http://localhost:3000
# API 文档: http://localhost:3001/api/docs
```

### Docker 部署

```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 服务将运行在:
# - Web: http://localhost:3000
# - API: http://localhost:3001
# - Admin: http://localhost:3002
```

---

## 📁 项目结构

```
school-admin-system/
├── 📁 .github/                 # GitHub 配置 (Actions, templates)
├── 📁 docs/                    # 项目文档
│   ├── SPEC-COMPLETE.md       # 功能规格书 v1.3.0
│   ├── SPEC-SYSTEM-DESIGN.md  # 系统架构设计 v0.4
│   ├── SPEC-UI-PROTO.html     # UI 原型设计
│   └── archive/               # 历史版本归档
├── 📁 src/
│   ├── 📁 backend/            # NestJS 后端
│   │   ├── 📁 src/
│   │   │   ├── 📁 modules/    # 功能模块
│   │   │   ├── 📁 common/     # 共享组件
│   │   │   └── main.ts
│   │   └── package.json
│   ├── 📁 frontend/           # React 前端
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/ # 组件
│   │   │   ├── 📁 pages/      # 页面
│   │   │   └── 📁 services/   # API 服务
│   │   └── package.json
│   └── 📁 shared/             # 共享类型定义
├── 📁 infra/                  # 基础设施配置
│   ├── 📁 k8s/               # Kubernetes 配置
│   ├── 📁 terraform/         # IaC 配置
│   └── 📁 docker/            # Docker 配置
├── 📁 scripts/               # 自动化脚本
├── 📄 package.json           # 根项目配置
├── 📄 pnpm-workspace.yaml    # PNPM 工作区配置
├── 📄 turbo.json             # Turborepo 配置
├── 📄 README.md              # 本文件
└── 📄 LICENSE                # 许可证
```

---

## 📚 文档

### 设计文档

| 文档 | 版本 | 描述 |
|------|------|------|
| [功能规格书](./docs/SPEC-COMPLETE.md) | v1.3.0 | 完整功能规格，49 个功能函数 |
| [系统架构设计](./docs/SPEC-SYSTEM-DESIGN.md) | v0.4 | 技术架构、安全设计、部署方案 |
| [UI 原型设计](./docs/SPEC-UI-PROTO.html) | v1.0.0 | 交互式界面原型 |

### API 文档

启动后端服务后访问:
- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI JSON: `http://localhost:3001/api/docs-json`

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. **Fork 仓库** 并克隆到本地
2. **创建功能分支**: `git checkout -b feature/MOD-XXX-description`
3. **提交更改**: `git commit -m "feat(MOD-XXX): description"`
4. **推送分支**: `git push origin feature/MOD-XXX-description`
5. **创建 Pull Request**

### 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
feat(MOD-USER-001): add user login functionality
fix(api): resolve 500 error on attendance query
docs(readme): update setup instructions
refactor(db): optimize user query performance
test(auth): add unit tests for JWT validation
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 单元测试覆盖率 >= 80%
- 所有 PR 需通过 CI 检查

---

## 🔒 安全

- 🔐 所有 API 使用 JWT 认证
- 🔒 敏感数据字段级加密
- 🛡️ PDPO 隐私条例合规
- 📝 完整审计日志
- 🔄 定期密钥轮换

如发现安全问题，请发送邮件至: security@example.com

---

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源许可证。

Copyright © 2026 School Admin System Team. All rights reserved.

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者、设计师和测试人员。

特别感谢:
- 耀美学校管理团队提供需求与反馈
- OpenClaw 社区的技术支持

---

<p align="center">
  <b>🏫 让校务管理更智能，让教育工作更高效</b><br>
  <i>Made with ❤️ for education</i>
</p>