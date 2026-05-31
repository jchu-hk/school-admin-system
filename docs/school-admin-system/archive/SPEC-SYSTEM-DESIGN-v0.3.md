# 智能校务助理系统 — 系统架构设计
## Smart School Admin AI System — System Architecture Design

**文档版本：** v0.3
**创建日期：** 2026-05-25
**最后更新：** 2026-05-25
**状态：** Draft (草稿)

---

## 目录

1. [总体架构](#1-总体架构)
2. [技术栈选型](#2-技术栈选型)
3. [部署架构](#3-部署架构)
4. [安全架构](#4-安全架构)
5. [Module 4: 用户与访问管理架构详细设计](#5-module-4-用户与访问管理架构详细设计)
6. [性能与扩展性](#6-性能与扩展性)
7. [多语言支持架构](#7-多语言支持架构)
8. [附录](#附录)

---

## 1. 总体架构

### 1.1 架构风格

采用 **分层微服务架构 (Layered Microservices)** + **事件驱动 (Event-Driven)** 混合模式：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Web App  │  │ Admin UI │  │  Mobile  │  │  APIs    │         │
│  │ (React)  │  │(Next.js) │  │ (React)  │  │ (OpenAPI)│         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
┌───────┴────────────┴────────────┴────────────┴──────────────────┐
│                      API Gateway / BFF                           │
│              (Kong / APISIX / nginx) + Auth Middleware          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                        Services Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Dashboard  │  │  Cyclic    │  │  Finance   │  │   AI       │ │
│  │  Service   │  │  Service   │  │  Service   │  │  Service   │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │   User     │  │ Integration│  │  Audit     │  │ Notification│ │
│  │   Service  │  │  Service   │  │  Service   │  │   Service  │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                         Event Bus                                │
│                  (Apache Kafka / RabbitMQ)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                        Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ PostgreSQL  │  │   Redis     │  │  MinIO/S3   │  │  CDN    │ │
│  │ (Primary)   │  │  (Cache)    │  │  (Files)    │  │ (Static)│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │   Elastic   │  │   MongoDB   │                             │
│  │  (Search)   │  │  (Logs/Audit)│                             │
│  └─────────────┘  └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     External Integrations                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ WebSAMS  │  │  eClass  │  │   LLM    │  │   OCR    │       │
│  │   API    │  │   API    │  │  (Coze)  │  │ (Azure)  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

| 原则 | 说明 | 适用范围 |
|------|------|----------|
| **Domain-Driven Design (DDD)** | 按业务领域划分服务边界 | Service Layer |
| **API-First** | 所有功能通过 OpenAPI 规范先行设计 | 所有服务 |
| **Eventual Consistency** | 通过事件总线实现最终一致性 | 跨服务交互 |
| **Defense in Depth** | 多层安全防护 | 全栈 |
| **Observability** | 可观测性指标埋点 | 所有服务 |
| **Data Privacy First** | 隐私保护优先于便利性 | PDPO 合规相关 |

### 1.3 服务边界划分

基于领域模型，微服务划分如下：

| Service | Domain | Responsibilities | Owner |
|---------|--------|------------------|-------|
| **Dashboard Service** | 每日运营 | 出勤、迟到/早退、家长查询、午膳、校车、请假、收费 | Daily Ops |
| **Cyclic Service** | 周期性校务 | 注册、编班、课本分发、DSE、考试、招生、学年清理 | Academic Ops |
| **Finance Service** | 财务资产 | 学费、报销、奖学金、校产盘点、场地租借、保养、供应商 | Finance |
| **User Service** | 用户管理 | 用户生命周期、认证、授权、会话、令牌、密码重置、权限 | Identity |
| **AI Service** | 智能助理 | NLU、FAQ 匹配、提醒系统、OCR | AI |
| **Integration Service** | 系统集成 | WebSAMS 同步、eClass 集成、备份 | Integration |
| **Audit Service** | 审计日志 | 所有操作的审计记录、检索 | Compliance |

---

## 2. 技术栈选型

### 2.1 核心技术栈

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **后端框架** | Node.js + NestJS | ^20.x, ^10.x | TypeScript 原生支持、依赖注入、模块化架构 |
| **前端框架** | React 18 + TypeScript | ^18.x | 生态成熟、组件化、性能优化 |
| **管理后台** | Next.js 14 | ^14.x | SSR/SSG、App Router、SEO 友好 |
| **数据库** | PostgreSQL | ^16.x | ACID 特性、JSONB 支持、FDW 外部数据包装器 |
| **缓存** | Redis | ^7.x | 高性能缓存、分布式锁、Pub/Sub |
| **消息队列** | Apache Kafka | ^3.x | 高吞吐、事件溯源、持久化 |
| **对象存储** | MinIO | ^2024.x | S3 兼容、自托管、低成本 |
| **搜索引擎** | Elasticsearch | ^8.x | 全文搜索、聚合分析 |
| **API Gateway** | Kong / APISIX | ^3.x / ^3.x | 高性能、插件生态、可观测性 |
| **容器编排** | Kubernetes | ^1.29.x | 云原生标准、自动扩缩容 |
| **服务网格** | Istio | ^1.20.x | 流量管理、安全、可观测性 |

### 2.2 AI/ML 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| **LLM Provider** | Coze / OpenAI | 自然语言理解、生成 |
| **OCR Engine** | Azure Computer Vision | 文档识别 |
| **Embedding** | OpenAI text-embedding-3 | 语义搜索 |
| **Vector DB** | pgvector (PostgreSQL) | FAQ 向量存储 |
| **NLP Tools** | jieba (分词) | 中文处理 |

### 2.3 开发工具链

| 工具 | 用途 |
|------|------|
| **pnpm** | Monorepo 包管理 |
| **Turborepo** | Monorepo 构建工具 |
| **ESLint + Prettier** | 代码质量 |
| **Jest + Vitest** | 单元测试 |
| **Playwright** | E2E 测试 |
| **OpenAPI Generator** | API 代码生成 |
| **Prisma** | ORM (TypeScript-first) |
| **GitHub Actions** | CI/CD |
| **ArgoCD** | GitOps 部署 |

### 2.4 监控与可观测性

| 工具 | 用途 |
|------|------|
| **Prometheus** | 指标收集 |
| **Grafana** | 可视化 |
| **Loki** | 日志聚合 |
| **Tempo** | 分布式追踪 |
| **Jaeger** | 追踪可视化 |

---

## 3. 部署架构

### 3.1 环境规划

| 环境 | 用途 | 基础设施 |
|------|------|----------|
| **Local** | 开发调试 | Docker Compose |
| **Dev** | 集成测试 | GKE / EKS |
| **Staging** | 预发布验证 | GKE / EKS |
| **Production** | 正式生产 | GKE / EKS + 香港区域 |

### 3.2 Kubernetes 部署结构

```
Namespace: school-admin-prod
├── Services
│   ├── dashboard-deployment (3 replicas)
│   ├── cyclic-deployment (2 replicas)
│   ├── finance-deployment (2 replicas)
│   ├── user-deployment (2 replicas)
│   ├── ai-deployment (2 replicas)
│   ├── integration-deployment (1 replica)
│   └── audit-deployment (2 replicas)
├── Infrastructure
│   ├── postgres-statefulset (Primary + 2 Standby)
│   ├── redis-deployment (Sentinel cluster)
│   ├── kafka-statefulset (3 brokers)
│   ├── elasticsearch-statefulset (3 nodes)
│   ├── minio-statefulset (4 nodes, distributed)
│   └── kong-deployment (3 replicas)
├── Jobs
│   ├── daily-backup-cronjob
│   ├── data-sync-cronjob
│   └── report-generation-cronjob
└── Ingress
    ├── kong-ingress (TLS termination)
    └── api.school-admin.hk (HTTPS only)
```

### 3.3 数据备份策略

| 数据类型 | 备份频率 | 保留周期 | 存储位置 |
|----------|----------|----------|----------|
| PostgreSQL | 每日全量 + WAL 归档 | 7 年 | 离线冷存储 + S3 |
| MinIO | 每日增量 | 7 年 | MinIO versioning + S3 |
| Redis | 每 6 小时快照 | 30 天 | 本地 + S3 |
| Elasticsearch | 每 12 小时快照 | 2 年 | S3 |

---

## 4. 安全架构

### 4.1 安全分层

| 层级 | 控制措施 |
|------|----------|
| **网络层** | VPC 隔离、安全组、Network Policies |
| **应用层** | API Gateway 认证、Rate Limiting、WAF |
| **服务层** | mTLS 服务间通信、JWT 验证 |
| **数据层** | 传输加密 (TLS 1.3)、静态加密 (AES-256)、字段级加密 |
| **操作层** | RBAC + ABAC、审计日志、双人见证 |

### 4.2 认证与授权流程

```
┌──────────────┐
│   User       │
│  (Login)     │
└──────┬───────┘
       │
┌──────▼──────────────────────────────┐
│   Auth Service (OAuth 2.0 / OIDC)   │
│   - JWT Access Token (15 min)       │
│   - Refresh Token (30 days)         │
└──────┬──────────────────────────────┘
       │
┌──────▼──────────────────────────────┐
│      API Gateway (Kong)             │
│   - JWT Validation                  │
│   - Rate Limiting                   │
│   - IP Whitelist                    │
└──────┬──────────────────────────────┘
       │
┌──────▼──────────────────────────────┐
│   Resource-Based Access Control     │
│   (RBAC + ABAC Hybrid)             │
│   - Role Permissions                │
│   - Attribute-based Policies        │
│   - Resource Ownership Check        │
└─────────────────────────────────────┘
```

### 4.3 数据隐私保护 (PDPO 合规)

| 要求 | 实现方式 |
|------|----------|
| **数据最小化** | 仅收集必要字段、字段级访问控制 |
| **访问控制** | 行级安全 (RLS)、列级权限 |
| **数据脱敏** | 日志中敏感信息自动脱敏、PII 字段加密 |
| **审计追踪** | 完整的操作日志、不可篡改记录 |
| **数据保留** | 自动过期清理、归档策略 |
| **数据访问** | 双人见证机制、访问审批流程 |
| **数据删除** | 彻底删除 + 备份清除、撤销权 |

---

## 5. Module 4: 用户与访问管理架构详细设计

### 5.1 模块概述

**Module 4 (User & Access Management)** 负责系统的用户管理和访问控制，包括：
- F-USER-001: 用户生命周期管理
- F-USER-002: 身份认证 (Authentication)
- F-USER-003: 授权管理 (Authorization - RBAC + ABAC)
- F-USER-004: 会话与令牌管理
- F-USER-005: 审计日志
- F-USER-006: 凭据重置
- F-USER-007: 权限升级审批

### 5.2 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Service Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  User       │  │  Auth       │  │  AuthZ      │  │   Audit    │ │
│  │  Lifecycle  │  │  Manager    │  │  (RBAC+     │  │   Logger   │ │
│  │  Manager    │  │             │  │   ABAC)     │  │            │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
└─────────┼─────────────────┼─────────────────┼──────────────┼──────┘
          │                 │                 │              │
┌─────────┴─────────────────┴─────────────────┴──────────────┴──────┐
│                   AuthN & AuthZ Middleware Layer                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  JWT        │  │  Session    │  │  Permission │  │   Role    │ │
│  │  Validator  │  │  Manager    │  │  Checker    │  │   Resolver│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
└───────────────────────────┬───────────────────────────────────────┘
                            │
┌───────────────────────────┴───────────────────────────────────────┐
│                      Identity Data Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  Users      │  │  Roles      │  │  Permissions│               │
│  │  Table      │  │  Table      │  │  Table      │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  Sessions   │  │  Audit      │  │  Approval   │               │
│  │  (Redis)    │  │  Logs       │  │  Requests   │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└───────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴───────────────────────────────────────┐
│                   External Identity Providers                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ SAML/    │  │  LDAP/   │  │  OAuth2  │  │  Local   │        │
│  │ Shibboleth│ │  AD      │  │  (OIDC)  │  │  Auth    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└───────────────────────────────────────────────────────────────────┘
```

### 5.3 F-USER-001: 用户生命周期管理

#### 5.3.1 功能描述

管理用户从创建到删除的完整生命周期，包括账号创建、激活、挂起、停用、删除。

#### 5.3.2 用户状态机

```
                    ┌─────────────┐
                    │   CREATED   │
                    └──────┬──────┘
                           │ [邮箱激活]
                    ┌──────▼──────┐
                    │   ACTIVE    │◄───┐
                    └──────┬──────┘    │
                           │          │ [解锁]
        ┌──────────────────┼──────────┤
        │                  │          │
[挂起]   │          [临时锁定]      │
        ▼                  ▼          │
   ┌─────────┐        ┌───────┐      │
   │SUSPENDED│        │LOCKED │      │
   └────┬────┘        └───────┘      │
        │                  │          │
[解锁]   │            [自动解锁]      │
        │                  │          │
        └──────────────────┼──────────┘
                           │
                     [主动停用]
                           ▼
                    ┌─────────────┐
                    │   INACTIVE  │
                    └──────┬──────┘
                           │ [删除]
                           ▼
                    ┌─────────────┐
                    │  DELETED    │
                    └─────────────┘
```

#### 5.3.3 数据模型

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(100) NOT NULL,
  name_zh VARCHAR(100),
  department_id UUID REFERENCES departments(id),
  position VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
  is_email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id),
  metadata JSONB
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role_id)
);

CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);
```

#### 5.3.4 API 接口

```typescript
// 创建用户
POST /api/v1/users
{
  "employee_id": "E2024001",
  "username": "zhangsan",
  "email": "zhangsan@school.edu.hk",
  "full_name": "张三",
  "name_zh": "張三",
  "department_id": "dept-001",
  "position": "校务处同工",
  "role_ids": ["role-teacher"]
}

// 激活用户
POST /api/v1/users/:id/activate
{
  "activation_token": "token-from-email"
}

// 挂起用户
POST /api/v1/users/:id/suspend
{
  "reason": "合同到期",
  "suspended_by": "admin-id"
}

// 解锁用户
POST /api/v1/users/:id/unlock
```

### 5.4 F-USER-002: 身份认证 (Authentication)

#### 5.4.1 认证流程

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/v1/auth/login
       │ {username, password}
       ▼
┌──────────────────────────────────────┐
│  1. Validate Request                 │
│     - Rate limiting (IP + username) │
│     - Input validation               │
└──────┬───────────────────────────────┘
       │
┌──────▼───────────────────────────────┐
│  2. Find User by Username           │
│     - Check user status              │
│     - Check if locked                │
└──────┬───────────────────────────────┘
       │
┌──────▼───────────────────────────────┐
│  3. Verify Password                  │
│     - bcrypt.compare()               │
│     - Update last_login              │
└──────┬───────────────────────────────┘
       │
┌──────▼───────────────────────────────┐
│  4. Generate Tokens                  │
│     - Access Token (JWT, 15min)      │
│     - Refresh Token (UUID, 30days)   │
│     - Session ID (Redis)             │
└──────┬───────────────────────────────┘
       │
┌──────▼───────────────────────────────┐
│  5. Log Audit Event                  │
│     - User login success/fail        │
│     - IP, timestamp, device info     │
└──────┬───────────────────────────────┘
       │
┌──────▼───────────────────────────────┐
│  6. Return Response                  │
│     {access_token, refresh_token,    │
│      expires_in, user_info}         │
└──────────────────────────────────────┘
```

#### 5.4.2 JWT Token 结构

```typescript
interface AccessTokenPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  iss: string;
  exp: number;
  iat: number;
  jti: string;
}
```

#### 5.4.3 安全机制

| 威胁 | 防护措施 |
|------|----------|
| 暴力破解 | Rate limiting (10次/5分钟)，账户锁定 (5次失败后锁定15分钟) |
| Token 窃取 | Short-lived access tokens (15min)，HTTPS only，HttpOnly cookies |
| 重放攻击 | JWT jti 唯一标识，Redis 黑名单 |
| 会话劫持 | Session IP 绑定，User-Agent 验证 |
| XSS | HttpOnly cookies，CSP headers |

### 5.5 F-USER-003: 授权管理 (Authorization - RBAC + ABAC)

#### 5.5.1 混合授权模型

采用 **RBAC (Role-Based)** + **ABAC (Attribute-Based)** 混合授权：

```
Request: User wants to perform ACTION on RESOURCE

┌─────────────────────────────────────────────────────────┐
│  1. RBAC Check (基于角色)                              │
│     - User has Role X?                                 │
│     - Role X has Permission Y?                          │
│     ────────────────────────────────                    │
│     Result: ALLOW / DENY / ABSTAIN (继续检查)          │
└────────────────┬────────────────────────────────────────┘
                 │ (If DENY → 直接拒绝)
                 │ (If ALLOW → 继续 ABAC)
                 │ (If ABSTAIN → 继续 ABAC)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. ABAC Check (基于属性)                              │
│     - User attributes: {department, position, ...}      │
│     - Resource attributes: {owner, status, class_id...} │
│     - Environment: {time, location, ...}                │
│     ────────────────────────────────                    │
│     Policy Rule:                                        │
│     IF user.department == '校务处'                     │
│     AND resource.department == user.department          │
│     AND action in ['read', 'update']                   │
│     THEN ALLOW                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. Final Decision                                      │
│     - RBAC: ALLOW AND ABAC: ALLOW → ALLOW             │
│     - RBAC: DENY OR ABAC: DENY → DENY                 │
│     - Both ABSTAIN → DENY (默认拒绝)                   │
└─────────────────────────────────────────────────────────┘
```

#### 5.5.2 RBAC 模型

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
```

### 5.6 F-USER-004: 会话与令牌管理

#### 5.6.1 会话管理

```typescript
interface SessionData {
  user_id: string;
  username: string;
  roles: string[];
  permissions: string[];
  login_at: string;
  last_activity: string;
  ip_address: string;
  user_agent: string;
}

const SESSION_TTL = 86400; // 24 hours
```

#### 5.6.2 并发会话限制

最多同时 3 个活跃会话，超过时自动删除最旧的会话。

### 5.7 F-USER-005: 审计日志

#### 5.7.1 审计事件类型

```typescript
enum AuditEventType {
  LOGIN_SUCCESS = 'AUTH.LOGIN_SUCCESS',
  LOGIN_FAILED = 'AUTH.LOGIN_FAILED',
  USER_CREATED = 'USER.CREATED',
  USER_UPDATED = 'USER.UPDATED',
  USER_DELETED = 'USER.DELETED',
  DATA_READ = 'DATA.READ',
  DATA_CREATED = 'DATA.CREATED',
  DATA_UPDATED = 'DATA.UPDATED',
  DATA_DELETED = 'DATA.DELETED',
}
```

#### 5.7.2 审计日志数据模型

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  username VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  result VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id, created_at DESC);
CREATE INDEX audit_logs_event_type_idx ON audit_logs(event_type, created_at DESC);
```

### 5.8 F-USER-006: 凭据重置

#### 5.8.1 密码重置流程

```
用户请求重置 → 验证身份 → 发送验证码 → 验证码验证 → 设置新密码 → 记录审计 → 发送通知
```

#### 5.8.2 密码策略

| 策略 | 要求 |
|------|------|
| 最小长度 | 8 位 |
| 字符要求 | 大写字母、小写字母、数字、特殊字符各至少1个 |
| 密码历史 | 不允许使用最近 3 次的密码 |
| 密码过期 | 90 天后强制更换 |

### 5.9 F-USER-007: 权限升级审批

#### 5.9.1 流程设计

```
用户请求 → 创建审批请求 → 审批人审批 → 批准/拒绝 → 授予/拒绝权限 → 权限到期自动收回
```

#### 5.9.2 数据模型

```sql
CREATE TABLE privilege_escalation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  approver_id UUID REFERENCES users(id),
  permission_id UUID REFERENCES permissions(id),
  requested_permission VARCHAR(100) NOT NULL,
  reason TEXT NOT NULL,
  expected_duration_hours INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  granted_at TIMESTAMP,
  expires_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  denied_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE temporary_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  request_id UUID REFERENCES privilege_escalation_requests(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  revoked_by UUID REFERENCES users(id),
  revoked_at TIMESTAMP,
  revoked_reason TEXT
);
```

#### 5.9.3 后台任务：权限过期检查

每小时运行一次，查找所有已过期的临时权限并自动收回。

---

## 6. 性能与扩展性

### 6.1 性能目标

| 指标 | 目标值 |
|------|--------|
| **API 响应时间 (P95)** | < 500ms (CRUD), < 2s (AI 查询) |
| **并发用户数** | 500+ 同时在线 |
| **数据库连接池** | 每服务 20-50 连接 |
| **缓存命中率** | > 80% |
| **OCR 处理速度** | < 5s (单页 PDF) |

### 6.2 扩展策略

| 服务 | 水平扩展 | 垂直扩展 |
|------|----------|----------|
| Dashboard Service | ✅ (Stateless) | ✅ |
| Cyclic Service | ✅ (Stateless) | ✅ |
| AI Service | ✅ (Stateless + Queue) | ⚠️ (LLM 受限) |
| PostgreSQL | ⚠️ (读写分离) | ✅ |
| Redis | ✅ (Cluster) | ✅ |

### 6.3 缓存策略

| 数据类型 | 缓存层 | TTL |
|----------|--------|-----|
| 用户会话 | Redis | 24h |
| FAQ 搜索结果 | Redis | 1h |
| 仪表板数据 | Redis | 5min |
| 学生信息 | Redis | 30min |
| 权限配置 | Redis | 12h |

---

## 7. 多语言支持架构

### 7.1 模块概述

**Module 8 (Multilingual Support / i18n)** 是系统的横向基础设施模块，为所有功能模块提供多语言服务能力。

**支持语言：**

| 语言代码 | 名称 | 场景 |
|----------|------|------|
| `zh-HK` | 繁体中文 (香港) | 默认语言 |
| `zh-CN` | 简体中文 | 内地用户 |
| `en` | 英语 | 国际用户、外籍教师 |

**涵盖函数：**
- F-I18N-001: 多语言框架与翻译管理
- F-I18N-002: 语言检测与自动切换
- F-I18N-003: 实时内容翻译 (LLM)
- F-I18N-004: 区域化与格式本地化

### 7.2 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer (UI)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   React  │  │ Next.js  │  │   Email  │  │   PDF    │        │
│  │  i18next │  │ i18n API │  │ Templates│  │ Reports  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼──────────────┼──────────────┼────────────┼───────────────┘
        │              │              │            │
┌───────┴──────────────┴──────────────┴────────────┴───────────────┐
│                       i18n Service Layer                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Translation    │  │ Language       │  │ Locale         │    │
│  │ Manager        │  │ Detector       │  │ Formatter      │    │
│  │ (i18next)      │  │ (5-level)      │  │ (date-fns)     │    │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘    │
│          │                   │                   │              │
│  ┌───────▼───────────────────▼───────────────────▼───────────┐ │
│  │                  i18n Middleware                          │ │
│  │  - Locale resolution (URL → Cookie → Header → Geo → DB)   │ │
│  │  - Translation key resolution                             │ │
│  │  - Plural / Gender interpolation                        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴───────────────────────────────────────┐
│                      Data Layer (i18n)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Translation  │  │  Glossary   │  │    Cache     │           │
│  │   Files      │  │   Terms     │  │   (Redis)    │           │
│  │  (JSON/i18n) │  │  (DB + S3) │  │  (24h TTL)   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴───────────────────────────────────────┐
│                         External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  LLM (Coze/  │  │   CDN       │  │   Admin UI   │           │
│  │  OpenAI)     │  │ (Static)    │  │ (Translation  │           │
│  │  (实时翻译)   │  │             │  │   Editor)    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

### 7.3 i18n 中间件设计

#### 7.3.1 语言检测优先级

```typescript
// i18n middleware - language detection chain
async function detectLocale(context: RequestContext): Promise<string> {
  // 1. User's saved preference (highest priority)
  if (context.user?.preferred_locale) {
    return context.user.preferred_locale;
  }

  // 2. URL query parameter
  if (context.query.lang && isValidLocale(context.query.lang)) {
    return normalizeLocale(context.query.lang);
  }

  // 3. Cookie
  if (context.cookies.i18n_locale && isValidLocale(context.cookies.i18n_locale)) {
    return context.cookies.i18n_locale;
  }

  // 4. Accept-Language header
  const acceptLang = context.headers['accept-language'];
  if (acceptLang) {
    const detected = parseAcceptLanguage(acceptLang);
    if (detected) return detected;
  }

  // 5. IP Geolocation
  const geoLocale = await geoipLookup(context.ip);
  if (geoLocale) return geoLocale;

  // 6. Default
  return 'zh-HK';
}

// Locale normalization
function normalizeLocale(locale: string): string {
  const map: Record<string, string> = {
    'zh-Hant': 'zh-HK',
    'zh-TW': 'zh-HK',
    'zh-Hans': 'zh-CN',
    'zh-SG': 'zh-CN',
    'zh': 'zh-HK',
  };
  return map[locale.toLowerCase()] || locale;
}
```

#### 7.3.2 中间件集成

```typescript
// NestJS i18n middleware
@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(
    private i18nService: I18nService,
    private userService: UserService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Attach locale to request
    (req as any).locale = await this.detectLocale(req);

    // Set response headers
    res.setHeader('Content-Language', (req as any).locale);

    // Make i18n service available
    (req as any).t = (key: string, params?: Record<string, any>) =>
      this.i18nService.translate(key, {
        locale: (req as any).locale,
        params
      });

    next();
  }
}
```

### 7.4 F-I18N-001: 翻译管理架构

#### 7.4.1 翻译资源加载策略

```typescript
// Translation file loading strategy
const translationLoaders = {
  // 静态文件：默认翻译，随应用部署
  static: (locale: string) =>
    import(`../locales/${locale}.json`),

  // 数据库：动态翻译，管理员可实时更新
  database: async (locale: string) => {
    const keys = await db.query(`
      SELECT tk.key_path, t.value
      FROM translation_keys tk
      JOIN translations t ON t.key_id = tk.id
      WHERE t.locale = $1 AND t.is_approved = true
    `, [locale]);

    return keys.reduce((acc, row) => {
      setNestedValue(acc, row.key_path, row.value);
      return acc;
    }, {});
  },

  // 合并策略：数据库覆盖静态文件
  merge: async (locale: string) => {
    const staticT = await translationLoaders.static(locale);
    const dbT = await translationLoaders.database(locale);
    return deepMerge(staticT, dbT);
  }
};
```

#### 7.4.2 翻译资源存储结构

```
/src
├── locales/
│   ├── zh-HK.json          # 繁体中文默认翻译（代码仓库）
│   ├── zh-CN.json          # 简体中文默认翻译
│   └── en.json             # 英语默认翻译
├── i18n/
│   ├── i18n.module.ts
│   ├── i18n.service.ts
│   ├── i18n.middleware.ts
│   ├── locale-formatter.service.ts
│   └── translation-cache.service.ts
└── admin/
    └── translation-editor/  # 管理员翻译编辑器（独立模块）
```

#### 7.4.3 翻译缓存策略

```typescript
// Redis caching strategy
interface TranslationCache {
  locale: string;
  version: string;       // 基于最后更新时间戳
  translations: Record<string, any>;
  loaded_at: string;
  ttl: number;           // 1 hour for static, 5 min for dynamic
}

// Cache invalidation
async function invalidateTranslationCache(locale: string, keyPattern?: string) {
  if (keyPattern) {
    // Invalidate specific keys
    const keys = await redis.keys(`i18n:${locale}:${keyPattern}`);
    await redis.del(...keys);
  } else {
    // Invalidate entire locale
    await redis.del(`i18n:${locale}:translations`);
  }

  // Publish invalidation event for other instances
  await kafka.publish('i18n.cache.invalidated', { locale, keyPattern });
}
```

### 7.5 F-I18N-002: 语言检测架构

#### 7.5.1 多级检测服务

```typescript
@Injectable()
export class LanguageDetectionService {
  constructor(
    private geoService: GeoIPService,
    private cacheService: TranslationCacheService
  ) {}

  async detectBestLocale(context: DetectionContext): Promise<LocaleResult> {
    const results: LocaleResult[] = [];

    // Layer 1: User saved preference
    if (context.userId) {
      const userPref = await this.getUserPreference(context.userId);
      if (userPref) {
        results.push({ locale: userPref, source: 'user', priority: 1 });
      }
    }

    // Layer 2: URL parameter
    if (context.query.lang) {
      const normalized = this.normalizeLocale(context.query.lang);
      results.push({ locale: normalized, source: 'url', priority: 2 });
    }

    // Layer 3: Browser Accept-Language
    if (context.headers['accept-language']) {
      const detected = this.parseAcceptLanguage(context.headers['accept-language']);
      if (detected) {
        results.push({ locale: detected, source: 'browser', priority: 3 });
      }
    }

    // Layer 4: IP Geolocation
    if (context.ip) {
      const geoLocale = await this.geoService.lookup(context.ip);
      if (geoLocale) {
        results.push({ locale: geoLocale, source: 'geo', priority: 4 });
      }
    }

    // Return highest priority result
    return results.sort((a, b) => a.priority - b.priority)[0]
      ?? { locale: 'zh-HK', source: 'default', priority: 5 };
  }

  private parseAcceptLanguage(header: string): string | null {
    const locales = header
      .split(',')
      .map(part => {
        const [locale, q] = part.trim().split(';q=');
        return { locale: locale.trim(), q: q ? parseFloat(q) : 1 };
      })
      .sort((a, b) => b.q - a.q);

    for (const { locale } of locales) {
      if (this.isSupportedLocale(locale)) {
        return this.normalizeLocale(locale);
      }
    }
    return null;
  }
}
```

### 7.6 F-I18N-003: 实时翻译架构 (LLM)

#### 7.6.1 翻译服务架构

```typescript
@Injectable()
export class RealtimeTranslationService {
  constructor(
    private llmService: LLMService,
    private cacheService: RedisService,
    private glossaryService: GlossaryService
  ) {}

  async translate(
    text: string,
    sourceLocale: string,
    targetLocale: string
  ): Promise<TranslationResult> {
    const cacheKey = this.generateCacheKey(text, sourceLocale, targetLocale);

    // 1. Cache check
    const cached = await this.cacheService.get(`i18n:translate:${cacheKey}`);
    if (cached) {
      return { ...JSON.parse(cached), cached: true };
    }

    // 2. Get glossary for this language pair
    const glossary = await this.glossaryService.getTerms(sourceLocale, targetLocale);

    // 3. Call LLM
    const result = await this.llmService.translate({
      prompt: TRANSLATION_PROMPT,
      input: { text, sourceLocale, targetLocale, glossary }
    });

    // 4. Cache result (24h TTL)
    const translationResult: TranslationResult = {
      original: text,
      translated: result.translated,
      source_locale: sourceLocale,
      target_locale: targetLocale,
      confidence: result.confidence,
      cached: false,
      glossary_applied: result.glossary_applied_count
    };

    await this.cacheService.setex(
      `i18n:translate:${cacheKey}`,
      86400,  // 24 hours
      JSON.stringify(translationResult)
    );

    return translationResult;
  }

  private generateCacheKey(text: string, source: string, target: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${text}|${source}|${target}`)
      .digest('hex');
    return hash.substring(0, 32);
  }
}
```

#### 7.6.2 翻译 Prompt 模板

```typescript
const TRANSLATION_PROMPT = `You are a professional translator for a Hong Kong secondary school administration system.

Translate the following text from {sourceLocale} to {targetLocale}.

Glossary (must use these exact translations):
{glossary}

Rules:
1. Maintain the original tone (formal/informal) and structure
2. Use school-specific terminology consistently
3. Preserve placeholders like {name}, {date}, {amount} exactly as-is
4. For zh-HK: use Traditional Chinese characters (not Simplified)
5. For zh-CN: use Simplified Chinese characters
6. Return ONLY the translation, no explanations

Text to translate:
{text}`;
```

### 7.7 F-I18N-004: 格式本地化架构

#### 7.7.1 Locale 格式化服务

```typescript
@Injectable()
export class LocaleFormatterService {
  private config: Record<string, LocaleConfig> = {
    'zh-HK': {
      locale: 'zh-HK',
      dateFormat: 'yyyy年M月d日',
      shortDateFormat: 'yyyy/MM/dd',
      timeFormat: 'h:mm a',
      currency: 'HKD',
      currencySymbol: 'HK$',
      numberGrouping: ',',
      numberDecimal: '.',
    },
    'zh-CN': {
      locale: 'zh-CN',
      dateFormat: 'yyyy年M月d日',
      shortDateFormat: 'yyyy/MM/dd',
      timeFormat: 'h:mm a',
      currency: 'CNY',
      currencySymbol: '¥',
      numberGrouping: ',',
      numberDecimal: '.',
    },
    'en': {
      locale: 'en',
      dateFormat: 'MMMM d, yyyy',
      shortDateFormat: 'dd/MM/yyyy',
      timeFormat: 'h:mm a',
      currency: 'HKD',
      currencySymbol: 'HK$',
      numberGrouping: ',',
      numberDecimal: '.',
    }
  };

  formatDate(date: Date, locale: string, format?: string): string {
    const cfg = this.config[locale] ?? this.config['zh-HK'];
    return format ?? cfg.dateFormat;
    // Implementation using date-fns
  }

  formatCurrency(amount: number, locale: string): string {
    const cfg = this.config[locale] ?? this.config['zh-HK'];
    const formatted = amount.toLocaleString(
      locale === 'zh-HK' ? 'zh-HK' : locale === 'zh-CN' ? 'zh-CN' : 'en-US',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );
    return `${cfg.currencySymbol}${formatted}`;
  }

  formatNumber(num: number, locale: string): string {
    return num.toLocaleString(
      locale === 'zh-HK' ? 'zh-HK' : locale === 'zh-CN' ? 'zh-CN' : 'en-US'
    );
  }
}
```

### 7.8 技术实现总结

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| **前端 i18n** | i18next + react-i18next | React 生态标准，支持命名空间、插值、复数 |
| **后端 i18n** | NestJS i18n module | 支持静态文件 + 数据库混合加载 |
| **日期格式化** | date-fns | 轻量级，支持所有 locale |
| **翻译缓存** | Redis | 分布式缓存，支持多实例失效 |
| **术语表存储** | PostgreSQL + MinIO | 关系数据 + 大字段附件 |
| **LLM 翻译** | Coze / OpenAI | 上下文感知翻译，专业术语保证 |
| **翻译编辑器** | 自建 React Admin UI | 支持在线编辑、审核、发布 |
| **CDN 分发** | Static files via Kong | 翻译 JSON 文件 CDN 缓存 |

### 7.9 性能与可靠性

| 指标 | 目标值 | 实现方式 |
|------|--------|----------|
| 页面语言切换延迟 | < 100ms | CDN 预加载翻译文件 |
| 实时翻译响应时间 | < 3s | LLM 缓存 + 异步队列 |
| 翻译缓存命中率 | > 90% | Redis SHA256 内容哈希 |
| 翻译服务可用性 | 99.9% | 多 LLM Provider 降级 |
| 批量翻译吞吐 | 100 条/分钟 | 异步任务队列 (Kafka) |

---

## 附录

### 附录 A: 待补充内容

- [x] ~~Module 4: 用户与访问管理详细架构设计~~ ✅ (v0.2)
- [x] ~~Module 8: 多语言支持详细架构设计~~ ✅ (v0.3)
- [ ] Module 1: 每日晨检仪表板详细架构设计
- [ ] Module 2: 周期性校务管理详细架构设计
- [ ] Module 3: 财务及资产管理详细架构设计
- [ ] Module 5: AI 助理详细架构设计
- [ ] Module 6: 系统集成详细架构设计
- [ ] Module 7: 合规管理详细架构设计
- [ ] 数据库完整 Schema 设计
- [ ] API 接口完整规范 (OpenAPI)
- [ ] 前端架构详细设计
- [ ] 部署运维手册
- [ ] 监控告警配置
- [ ] 灾备方案设计

### 附录 B: 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v0.3 | 2026-05-25 | 新增第7节 — 多语言支持架构：F-I18N-001 至 F-I18N-004 详细架构设计；支持 zh-HK/zh-CN/en 三语；含 i18n 中间件、翻译管理、实时 LLM 翻译、格式本地化；更新目录结构 | 系统架构团队 |
| v0.2 | 2026-05-25 | 修正章节编号一致性、修复 ASCII 图、补充缺失章节 | 系统架构团队 |
| v0.1 | 2026-05-25 | 初始草稿 | 系统架构团队 |

---

**文档维护:** 系统架构团队
**最后更新:** 2026-05-25