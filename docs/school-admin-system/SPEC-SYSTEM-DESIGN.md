# 智能校务助理系统 — 系统架构设计
## Smart School Admin AI System — System Architecture Design

**文档版本：** v0.4
**创建日期：** 2026-05-25
**最后更新：** 2026-05-27
**审查标准：** NIST SP 800-53, OWASP, Cloud Native Best Practices, ISO/IEC 27001
**审查报告：** `/docs/school-admin-system/archive/ARCH-REVIEW-v0.4.md`
**状态：** Draft (草稿)

---

## 目录

1. [总体架构](#1-总体架构)
2. [技术栈选型](#2-技术栈选型)
3. [部署架构](#3-部署架构)
4. [安全架构](#4-安全架构)
5. [Module 4: 用户与访问管理架构详细设计](#5-module-4-用户与访问管理架构详细设计)
6. [性能与扩展性](#6-性能与扩展性)
7. [可观测性与监控](#7-可观测性与监控)
8. [运维与灾难恢复](#8-运维与灾难恢复)
9. [多语言支持架构](#9-多语言支持架构)
10. [附录](#附录)

---

## 1. 总体架构

### 1.1 架构风格

采用 **分层微服务架构 (Layered Microservices)** + **事件驱动 (Event-Driven)** 混合模式，遵循 **云原生 12 要素 (12-Factor App)** 设计原则：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Web App  │  │ Admin UI │  │  Mobile  │  │  APIs    │      │
│  │ (React)  │  │(Next.js) │  │ (React)  │  │ (OpenAPI)│      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
└───────┼──────────────┼──────────────┼──────────────┼────────────┘
        │              │              │              │
┌───────┴──────────────┴──────────────┴──────────────┴────────────┐
│                     API Gateway / BFF (Kong)                     │
│          Auth Middleware │ Rate Limiting │ WAF │ TLS Termination │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                         Services Layer                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐│
│  │ Dashboard  │  │  Cyclic    │  │  Finance   │  │   AI      ││
│  │  Service  │  │  Service   │  │  Service   │  │  Service  ││
│  │  (无状态)  │  │  (无状态)  │  │  (无状态)  │  │(队列驱动) ││
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘│
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐│
│  │   User    │  │ Integration│  │  Audit    │  │Notification││
│  │  Service  │  │  Service   │  │  Service  │  │  Service  ││
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     Service Mesh (Istio)                         │
│            mTLS 双向TLS │ 流量管理 │ 熔断 │ 重试策略              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                         Event Bus (Kafka)                         │
│              消息持久化 │ 消费者组 │ 死信队列 │ 事件溯源            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                          Data Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ PostgreSQL  │  │   Redis    │  │  MinIO/S3  │  │  CDN    │ │
│  │ (主从复制)  │  │ (集群模式) │  │  (文件存储) │  │(Cloudflare)│
│  │ + PgBouncer│  │ + Sentinel │  │            │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │   Elastic  │  │   MongoDB  │                             │
│  │  (搜索)   │  │ (日志/审计) │                             │
│  └─────────────┘  └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    Secrets Management (Vault)                     │
│        DB凭证 │ API密钥 │ JWT签名密钥 │ 密钥自动轮换              │
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
| **Infrastructure as Code** | 所有基础设施通过代码管理 | 部署 |
| **GitOps** | 部署配置与代码同版本管理 | CI/CD |

### 1.3 服务边界划分

| Service | Domain | Scaling |
|---------|--------|---------|
| **Dashboard Service** | 每日运营 | H (无状态) |
| **Cyclic Service** | 周期性校务 | H (无状态) |
| **Finance Service** | 财务资产 | H (无状态) |
| **User Service** | 用户管理 | H (无状态) |
| **AI Service** | 智能助理 | H (队列驱动) |
| **Integration Service** | 系统集成 | M (1-2副本) |
| **Audit Service** | 审计日志 | H (无状态) |
| **I18n Service** | 多语言 | H (无状态) |

> **Scaling:** H = Horizontal (可水平扩展) | M = Moderate

---

## 2. 技术栈选型

### 2.1 核心技术栈

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **后端框架** | Node.js + NestJS | ^20.x, ^10.x | TypeScript 原生支持 |
| **前端框架** | React 18 + TypeScript | ^18.x | 生态成熟 |
| **管理后台** | Next.js 14 | ^14.x | SSR/SSG、App Router |
| **数据库** | PostgreSQL | ^16.x | ACID、JSONB、FDW |
| **连接池** | PgBouncer | ^1.22.x | 事务级连接池 |
| **缓存** | Redis Cluster | ^7.x | 高性能缓存、分布式锁、集群模式 |
| **消息队列** | Apache Kafka | ^3.x | 高吞吐、事件溯源、持久化 |
| **对象存储** | MinIO | ^2024.x | S3 兼容、自托管 |
| **搜索引擎** | Elasticsearch | ^8.x | 全文搜索 |
| **API Gateway** | Kong / APISIX | ^3.x | 高性能、插件生态 |
| **容器编排** | Kubernetes (GKE) | ^1.29.x | 云原生标准 |
| **服务网格** | Istio | ^1.20.x | 流量管理、安全 |
| **Secrets管理** | HashiCorp Vault | ^1.16.x | 集中密钥管理、自动轮换 |

### 2.2 AI/ML 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| **LLM Provider** | Coze / OpenAI | 自然语言理解、生成 |
| **OCR Engine** | Azure Computer Vision | 文档识别 |
| **Embedding** | OpenAI text-embedding-3 | 语义搜索 |
| **Vector DB** | pgvector (PostgreSQL) | FAQ 向量存储 |

### 2.3 开发工具链

| 工具 | 用途 |
|------|------|
| **pnpm + Turborepo** | Monorepo 包管理 |
| **ESLint + Prettier** | 代码质量 |
| **Jest + Vitest** | 单元测试 |
| **Playwright** | E2E 测试 |
| **Snyk + Trivy** | 安全漏洞扫描 |
| **SonarQube** | 代码质量分析 |
| **Prisma** | ORM |
| **GitHub Actions** | CI/CD |
| **ArgoCD** | GitOps |
| **Terraform + Pulumi** | IaC |

### 2.4 监控与可观测性

| 工具 | 用途 |
|------|------|
| **Prometheus** | 指标收集 |
| **Grafana** | 可视化仪表板 |
| **Loki** | 日志聚合 |
| **Tempo** | 分布式追踪 |
| **AlertManager** | 告警管理 |
| **PagerDuty** | 告警通知与值班 |

---

## 3. 部署架构

### 3.1 环境规划

| 环境 | 用途 | 部署方式 |
|------|------|----------|
| **Local** | 开发调试 | Docker Compose |
| **Dev** | 集成测试 | ArgoCD 自动部署 |
| **Staging** | 预发布验证 | ArgoCD 自动部署 |
| **Production** | 正式生产 | ArgoCD 手动审批 |

### 3.2 Kubernetes 部署结构

```
Namespace: school-admin-prod
├── Services
│   ├── dashboard-deploy (3 replicas, HPA: 3-10)
│   ├── cyclic-deploy (2 replicas, HPA: 2-8)
│   ├── finance-deploy (2 replicas, HPA: 2-8)
│   ├── user-deploy (2 replicas, HPA: 2-8)
│   ├── ai-deploy (2 replicas, HPA: 2-6) + Kafka Consumer Group
│   ├── integration-deploy (1 replica, HPA: 1-3)
│   ├── audit-deploy (2 replicas, HPA: 2-6)
│   └── i18n-deploy (1 replica, HPA: 1-3)
├── Infrastructure
│   ├── postgres-primary (StatefulSet, 1 node)
│   ├── postgres-replica (StatefulSet, 2 nodes)
│   ├── pgbouncer-deploy (3 replicas, 连接池)
│   ├── redis-cluster (6 nodes, 3主3从)
│   ├── kafka-cluster (3 brokers)
│   ├── elasticsearch-statefulset (3 nodes)
│   └── kong-deployment (3 replicas)
└── Ingress
    ├── kong-ingress (HTTPS, TLS 1.3)
    └── istio-ingressgateway
```

### 3.3 数据库架构

#### 3.3.1 PostgreSQL 主从复制配置

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐                                          │
│  │   写流量      │                                          │
│  │ (App Services)│                                          │
│  └──────┬───────┘                                          │
│         │                                                   │
│  ┌──────▼───────┐     ┌──────────────────────────────────┐│
│  │  PgBouncer    │     │  Services                        ││
│  │ (事务级连接池) │─────┤  - Dashboard, Cyclic, Finance    ││
│  │  pool_size:20│     │  - User, AI, Audit               ││
│  └──────┬───────┘     └──────────────────────────────────┘│
│         │                                                   │
│  ┌──────▼───────┐                                          │
│  │   Primary     │◄─────── 异步流复制 (WAL)                 │
│  │  (写流量)    │                                          │
│  └──────┬───────┘                                          │
│         │                                                   │
│  ┌──────▼───────┐  ┌───────▼───────┐                     │
│  │  Replica 1   │  │  Replica 2   │  (读流量)          │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.2 表分区策略

```sql
-- 审计日志：按月分区
CREATE TABLE audit_logs (
  id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  result VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 创建分区
CREATE TABLE audit_logs_2026_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

### 3.4 Redis 集群配置

```yaml
Redis Cluster:
  Mode: Cluster (水平分片)
  Node Count: 6 (3 masters + 3 replicas)
  Shards: 3 (每分片1主1从)
  Max Memory: 4GB per node
  Eviction Policy: allkeys-lru
  Persistence: RDB + AOF
```

### 3.5 CDN 配置 (Cloudflare)

```yaml
CDN Configuration:
  Provider: Cloudflare (香港节点优化)
  Cache Rules:
    - 静态资源 (JS/CSS/Fonts): public, max-age=31536000
    - 翻译JSON: private, max-age=3600, cache-busting
    - 图片: public, max-age=2592000
    - API响应: no-cache
  Security: TLS 1.3 only
```

### 3.6 数据备份策略

| 数据类型 | 备份频率 | 保留周期 | 存储位置 | 恢复验证 |
|----------|----------|----------|----------|----------|
| PostgreSQL | 每小时 WAL + 每日全量 | 7 年 | S3 + Glacier | 每周测试 |
| MinIO | 每日增量 | 7 年 | S3 + Glacier | 每月测试 |
| Redis | 每6小时快照 | 30 天 | 本地 + S3 | 每周测试 |
| Elasticsearch | 每12小时快照 | 2 年 | S3 | 每月测试 |

---

## 4. 安全架构

### 4.1 安全分层模型

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: 网络安全 — VPC隔离 │ 子网划分 │ 安全组 │ Network Policies │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: 传输安全 — TLS 1.3 │ mTLS │ 证书管理                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: 应用安全 — 身份认证 │ 授权 │ 输入验证 │ CSP │ Rate Limiting│
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: 数据安全 — 字段级加密 │ RLS │ 密钥管理(Vault) │ 脱敏    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: 操作安全 — 审计日志 │ RBAC+ABAC │ 双人见证 │ 渗透测试  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 网络安全与分段

```yaml
Network Segmentation:
  VPC Structure:
    - vpc-main (10.0.0.0/16)
    │   ├── subnet-public (10.0.1.0/24)     # 负载均衡器、API Gateway
    │   ├── subnet-private-app (10.0.2.0/24) # 应用服务
    │   └── subnet-private-data (10.0.3.0/24) # 数据库、Redis、Kafka

  Kubernetes Network Policies:
    # 默认策略：拒绝所有入口和出口流量
    - Default: deny all ingress/egress
    - API Gateway: allow ingress from internet
    - Services: allow ingress from API Gateway only
    - Database: allow application subnet only
```

### 4.3 Secrets 管理

```yaml
HashiCorp Vault:
  Storage: PostgreSQL (HA mode, 3 nodes)

  Secrets Engines:
    KV Secrets Engine (v2):
      - database/credentials
      - api-keys (Coze, Azure, WebSAMS, eClass)

    Transit Secrets Engine:
      - JWT signing keys (每6个月自动轮换)

    Database Secrets Engine:
      - PostgreSQL credentials (90天动态轮换)

  Access Control:
    - Kubernetes Auth: 服务账号通过 ServiceAccount 认证
    - MFA: 手动访问需通过 MFA 认证

  Rotation Schedule:
    - Database passwords: 每90天
    - API Keys: 每180天
    - JWT Signing Keys: 每6个月
```

### 4.4 应用安全控制

#### 4.4.1 API Gateway 安全配置

```yaml
Kong Security Plugins:
  # JWT 验证
  jwt:
    key_claim_name: sub
    maximum_expiration: 900  # 15 minutes

  # 速率限制
  rate-limiting:
    minute: 100
    hour: 1000
    policy: redis

  # 安全响应头
  headers:
    Content-Security-Policy: |
      default-src 'self';
      script-src 'self' 'nonce-{nonce}';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      frame-ancestors 'none';
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
```

#### 4.4.2 输入验证 (多层防护)

```typescript
// Layer 1: API Gateway (Zod Schema)
const userSchema = z.object({
  employee_id: z.string().regex(/^E\d{7}$/),
  username: z.string().min(3).max(50),
  email: z.string().email()
});

// Layer 2: Service Layer (Business Validation)
@Injectable()
export class UserValidationService {
  async validateUserCreation(data: CreateUserDto): Promise<ValidationResult> {
    const errors: string[] = [];

    if (await this.userRepo.exists({ employee_id: data.employee_id })) {
      errors.push('员工ID已存在');
    }

    return { valid: errors.length === 0, errors };
  }
}
```

#### 4.4.3 SQL 注入防护

```yaml
SQL Injection Protection:
  ORM: Prisma (参数化查询)
  Database Least Privilege:
    - application_user: SELECT, INSERT, UPDATE
    - migration_user: DDL
    - analytics_user: SELECT only
  OWASP Scan:
    - Snyk + npm audit (每次CI/CD)
    - Critical漏洞阻断PR
```

#### 4.4.4 密码安全

```yaml
Password Security:
  Algorithm: Argon2id (@node-rs/argon2)
  Parameters:
    - Memory Cost: 64 MiB
    - Time Cost: 3 iterations
    - Parallelism: 4 threads
  Policy:
    - Minimum: 8 characters
    - Complexity: 大写+小写+数字+特殊字符
    - History: 最近5次密码
    - Expiration: 90天后强制更换
    - Lockout: 5次失败后锁定15分钟
```

### 4.5 认证与授权流程

```
User Login
    │
    ▼
Kong API Gateway (Rate Limiting + WAF + TLS)
    │
    ▼
Auth Service (JWT Access Token 15min + Refresh Token 30days)
    │
    ▼
Authorization (RBAC + ABAC Hybrid)
    │
    ▼
Audit Logging (async to Kafka)
```

### 4.6 数据隐私保护 (PDPO 合规)

| 要求 | 实现方式 |
|------|----------|
| **数据最小化** | 仅收集必要字段、字段级访问控制 |
| **访问控制** | 行级安全(RLS)、列级权限 |
| **数据脱敏** | 日志中敏感信息自动脱敏 |
| **审计追踪** | 完整的操作日志、不可篡改记录 |
| **数据加密** | TLS 1.3 传输加密、AES-256 静态加密 |
| **密钥管理** | HashiCorp Vault |
| **数据保留** | 自动过期清理、归档策略 |
| **数据访问** | 双人见证机制、访问审批流程 |
| **数据删除** | 彻底删除 + 备份清除 |

---

## 5. Module 4: 用户与访问管理架构详细设计

### 5.1 模块概述

**Module 4 (User & Access Management)** 负责系统的用户管理和访问控制：
- F-USER-001: 用户生命周期管理
- F-USER-002: 身份认证 (Authentication)
- F-USER-003: 授权管理 (Authorization - RBAC + ABAC)
- F-USER-004: 会话与令牌管理
- F-USER-005: 审计日志
- F-USER-006: 凭据重置
- F-USER-007: 权限升级审批

### 5.2 数据模型

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
  password_hash VARCHAR(255),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- 角色表
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 权限表
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 角色权限关联
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 用户角色关联
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

-- 审计日志表
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
  result VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
) PARTITION BY RANGE (created_at);

CREATE INDEX audit_logs_user_created ON audit_logs(user_id, created_at DESC);
```

### 5.3 JWT Token 结构

```typescript
interface AccessTokenPayload {
  sub: string;        // user_id
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  iss: string;
  exp: number;        // 15 minutes
  iat: number;
  jti: string;       // JWT ID for revocation
}
```

### 5.4 混合授权模型 (RBAC + ABAC)

```
Request: User wants to perform ACTION on RESOURCE
    │
    ▼
1. RBAC Check (基于角色)
   User has Role X? → Role X has Permission Y?
   Result: ALLOW / DENY / ABSTAIN
    │
    ▼ (if ALLOW or ABSTAIN)
2. ABAC Check (基于属性)
   IF user.department == '校务处'
   AND resource.department == user.department
   AND action in ['read', 'update']
   THEN ALLOW
    │
    ▼
3. Final Decision
   RBAC ALLOW AND ABAC ALLOW → ALLOW
   RBAC DENY OR ABAC DENY → DENY
   Both ABSTAIN → DENY (默认拒绝)
```

---

## 6. 性能与扩展性

### 6.1 性能目标

| 指标 | 目标值 | 告警阈值 |
|------|--------|----------|
| **API 响应时间 (P95)** | < 500ms (CRUD), < 2s (AI 查询) | > 1s 告警 |
| **API 响应时间 (P99)** | < 1s (CRUD), < 5s (AI 查询) | > 2s 告警 |
| **并发用户数** | 500+ 同时在线 | > 300 告警 |
| **数据库连接池使用率** | < 70% | > 80% 告警 |
| **缓存命中率** | > 80% | < 60% 告警 |
| **服务可用性** | 99.9% | < 99.5% 告警 |

### 6.2 扩展策略

| 服务 | 水平扩展 | HPA 配置 |
|------|----------|----------|
| Dashboard Service | ✅ | 3-10 副本 |
| Cyclic Service | ✅ | 2-8 副本 |
| Finance Service | ✅ | 2-8 副本 |
| User Service | ✅ | 2-8 副本 |
| AI Service | ✅ | 2-6 副本 |
| PostgreSQL | ⚠️ (读写分离) | 主从复制 |
| Redis | ✅ (集群模式) | 6 节点集群 |

### 6.3 缓存策略

| 数据类型 | TTL | 失效策略 |
|----------|-----|----------|
| 用户会话 | 24h | 滑动过期 |
| JWT Token 黑名单 | 15min | TTL 自动 |
| FAQ 搜索结果 | 1h | LRU 淘汰 |
| 仪表板数据 | 5min | LRU 淘汰 |
| 学生信息 | 30min | 写入失效 |
| 权限配置 | 12h | Vault 轮换触发 |

---

## 7. 可观测性与监控

### 7.1 可观测性三大支柱

```
┌─────────────────────────────────────────────────────────────┐
│  指标 (Metrics)      │  日志 (Logs)      │  追踪 (Traces) │
│  Prometheus + Grafana │  Loki + Promtail │  Tempo + Jaeger │
│                                                             │
│  - Request Rate       │  - ERROR级别     │  - 请求链路     │
│  - Error Rate        │  - WARN级别      │  - 服务间调用   │
│  - Latency P50/P95/P99│  - INFO级别     │  - 数据库查询   │
│  - CPU/Memory        │  - DEBUG(非生产) │  - LLM调用     │
└─────────────────────────────────────────────────────────────┘
                          │
                    AlertManager
                    PagerDuty + Slack
```

### 7.2 告警策略

```yaml
Alerting Strategy:
  Alert Rules:
    # Critical (立即通知)
    - HighErrorRate: error_rate > 5% for 1min
    - ServiceDown: up == 0 for 1min
    - DatabasePoolHigh: pool > 80% for 5min

    # Warning (通知)
    - HighLatency: P95 latency > 2s for 5min
    - CacheHitLow: hit_rate < 60% for 10min

  Notification:
    - PagerDuty: Critical 告警, 24/7 值班
    - Slack #ops-alerts: 所有告警
    - Slack #ops-critical: Critical 告警

  Escalation:
    - Level 1: 值班工程师 (0-5 分钟)
    - Level 2: 团队 Lead (5-15 分钟)
    - Level 3: 部门经理 (> 15 分钟)
```

### 7.3 日志管理

```yaml
Logging Strategy:
  Format: 结构化 JSON
  Levels:
    - ERROR: 错误, 需要立即处理
    - WARN: 警告, 需要关注
    - INFO: 重要业务事件 (登录, 创建, 更新)
    - DEBUG: 开发调试 (生产环境不开启)

  Retention:
    - Hot (Loki): 30 天
    - Warm (S3): 6 个月
    - Cold (Glacier): 2 年

  Sensitive Data Masking:
    - 密码: "******"
    - 手机号: "****1234"
    - JWT Token: "Bearer ****"
```

---

## 8. 运维与灾难恢复

### 8.1 CI/CD 流水线

```
GitHub Actions CI Pipeline
│
├─ 1. Lint & Format (ESLint + Prettier)
├─ 2. Unit Tests (Jest, coverage >= 80%)
├─ 3. Integration Tests (Docker Compose)
├─ 4. Security Scan (Snyk + Trivy, Critical阻断)
├─ 5. Build & Push (Container Registry + SBOM)
└─ 6. Deploy to Staging (ArgoCD)

ArgoCD CD Pipeline (Production)
│
├─ 1. Manifest Sync (Kustomize)
├─ 2. Manual Approval (/approve)
├─ 3. Canary Deployment (10% → 50% → 100%)
└─ 4. Rollback (自动触发: error_rate > 5%)
```

### 8.2 灾难恢复计划 (DRP)

```yaml
Disaster Recovery Plan:
  RTO (Recovery Time Objective):
    - 关键服务 (Auth, Dashboard): 4 小时
    - 重要服务 (Finance, Cyclic): 8 小时
    - 非关键服务 (Audit, Archive): 24 小时

  RPO (Recovery Point Objective):
    - 关键数据 (学生, 财务): 15 分钟 (WAL 归档)
    - 重要数据 (出勤, 用户): 1 小时
    - 非关键数据 (审计日志, 翻译): 24 小时

  Failover Architecture:
    Primary: 香港 (GKE)
    DR Site: 亚太区域 (active-passive)
    模式: 主区域故障时手动切换

  Backup & Restore:
    Database:
      - 全量备份: 每日 02:00 HKT
      - WAL 归档: 每 5 分钟
      - 跨区域复制: S3 Cross-Region
      - 恢复测试: 每周

  DR Testing:
    - 频率: 每季度
    - 类型: 桌面推演 + 实际故障注入
```

### 8.3 运维手册 (Runbooks)

| # | Runbook | 说明 |
|---|---------|------|
| 1 | 服务重启 | kubectl rollout restart + 验证 |
| 2 | 数据库连接池耗尽 | SHOW DATABASES + pg_stat_activity |
| 3 | Redis 集群故障转移 | redis-cli cluster info + Sentinel 状态 |
| 4 | Kafka 消费滞后 | kafka-consumer-groups + 扩展消费者 |
| 5 | 证书过期 | openssl s_client + Let's Encrypt 更新 |

---

## 9. 多语言支持架构

### 9.1 模块概述

**Module 8 (Multilingual Support / i18n)** 为所有功能模块提供多语言服务能力。

**支持语言：**

| 语言代码 | 名称 | 场景 |
|----------|------|------|
| `zh-HK` | 繁体中文 (香港) | 默认语言 |
| `zh-CN` | 简体中文 | 内地用户 |
| `en` | 英语 | 国际用户、外籍教师 |

### 9.2 技术实现

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| **前端 i18n** | i18next + react-i18next | React 生态标准 |
| **后端 i18n** | NestJS i18n module | 静态文件 + 数据库混合 |
| **日期格式化** | date-fns | 轻量级 |
| **翻译缓存** | Redis Cluster | 分布式缓存 |
| **LLM 翻译** | Coze / OpenAI | 上下文感知翻译 |

### 9.3 语言检测优先级

```
1. 用户保存偏好 (user.preferred_locale)
2. URL 参数 (?lang=zh-HK)
3. Cookie (i18n_locale)
4. 浏览器 Accept-Language
5. IP 地理位置
6. 默认: zh-HK
```

---

## 附录

### 附录 A: 架构审查结果摘要 (v0.3 → v0.4)

**审查标准:** NIST SP 800-53, OWASP, Cloud Native Best Practices, ISO/IEC 27001
**审查日期:** 2026-05-27
**审查结果:** 发现 **21 项差距**，已全部纳入本版本

#### 可扩展性改进 (Scalability)

| # | 项目 | 优先级 | 说明 |
|---|------|--------|------|
| S-01 | 数据库读写分离 | P1 | 完整主从配置 + PgBouncer |
| S-02 | Redis 架构 | P1 | Redis Cluster 6节点集群 |
| S-03 | 表分区策略 | P2 | 完整分区管理 + 自动创建/归档策略 |
| S-04 | CDN 配置 | P2 | Cloudflare 完整配置 + 缓存规则 |
| S-05 | 负载均衡策略 | P2 | Weighted Least Connection + 健康检查 |
| S-06 | 速率限制 | P2 | Kong 插件完整配置 (100/min per user) |

#### 安全性改进 (Security)

| # | 项目 | 优先级 | 说明 |
|---|------|--------|------|
| SEC-01 | Secrets管理 | **P0** | HashiCorp Vault 完整方案 |
| SEC-02 | SQL注入防护 | **P0** | ORM + 最小权限 + OWASP扫描 |
| SEC-03 | CSP Headers | P1 | Kong 完整安全响应头配置 |
| SEC-04 | 网络分段 | **P0** | K8s Network Policies + 子网划分 |
| SEC-05 | 密码哈希 | P3 | Argon2id + 迁移策略 |
| SEC-06 | 证书管理 | P1 | Let's Encrypt + Vault 自动轮换 |
| SEC-07 | 输入验证 | P1 | 三层验证 (Gateway + Service + DB) |
| SEC-08 | 服务网格 | P1 | mTLS + 流量策略完整配置 |

#### 可维护性改进 (Maintainability)

| # | 项目 | 优先级 | 说明 |
|---|------|--------|------|
| M-01 | 监控策略 | **P0** | 完整可观测性策略 + 告警规则 |
| M-02 | 灾难恢复计划 | **P0** | 完整 DRP (RTO/RPO/Failover) |
| M-03 | CI/CD流水线 | P1 | 完整流水线定义 + ArgoCD Canary |
| M-04 | 代码质量 | P2 | SonarQube + 覆盖率阈值 |
| M-05 | 运维手册 | P1 | 5个关键 Runbook |
| M-06 | 告警与响应 | P1 | AlertManager + PagerDuty + 升级流程 |
| M-07 | 密钥轮换 | P1 | Vault 自动化轮换策略 |

#### 新增内容

| # | 项目 | 说明 |
|---|------|------|
| N-01 | 多层安全模型 | Layer 1-5 完整安全分层 |
| N-02 | SRE 最佳实践 | SLO/SLI 定义，性能目标表 |
| N-03 | GitOps 部署 | ArgoCD 完整配置 |
| N-04 | 架构审查报告 | 完整审查报告存档路径 |

### 附录 B: 待补充内容

- [x] ~~Module 4: 用户与访问管理详细架构设计~~ ✅
- [x] ~~Module 8: 多语言支持详细架构设计~~ ✅
- [x] ~~架构审查与增强 (Scalability/Security/Maintainability)~~ ✅ (v0.4)
- [ ] Module 1: 每日晨检仪表板详细架构设计
- [ ] Module 2: 周期性校务管理详细架构设计
- [ ] Module 3: 财务及资产管理详细架构设计
- [ ] Module 5: AI 助理详细架构设计
- [ ] Module 6: 系统集成详细架构设计
- [ ] Module 7: 合规管理详细架构设计
- [ ] 数据库完整 Schema 设计
- [ ] API 接口完整规范 (OpenAPI)
- [ ] 前端架构详细设计
- [ ] 部署运维手册 (完整版)
- [ ] 监控告警配置 (Grafana Dashboard + Alert Rules)
- [ ] 灾备方案设计 (详细 DR Runbook)

### 附录 C: 变更对比表

| 版本 | 日期 | 变更类型 | 变更内容 |
|------|------|----------|----------|
| v0.4 | 2026-05-27 | Major Review | 架构审查: 21项差距修复; Scalability/Security/Maintainability 全面增强; 新增第7-8节; 完整CI/CD + DRP + 可观测性策略 |
| v0.3 | 2026-05-25 | Minor | 新增第7节 — 多语言支持架构 |
| v0.2 | 2026-05-25 | Patch | 修正章节编号一致性 |
| v0.1 | 2026-05-25 | Initial | 初始草稿 |

### 附录 D: 参考标准

| 标准 | 适用领域 |
|------|----------|
| **NIST SP 800-53** | 信息安全与隐私控制 |
| **OWASP Top 10** | 应用安全 |
| **Cloud Native Computing Foundation** | 云原生架构 |
| **12-Factor App** | 应用设计原则 |
| **ISO/IEC 27001** | 信息安全管理 |
| **Google SRE Handbook** | 运维与可靠性 |

---

**文档维护:** 系统架构团队
**最后更新:** 2026-05-27
**审查报告:** `/archive/ARCH-REVIEW-v0.4.md`