<text_never_used_51bce0c785ca2f68081bfa7d91973934># 智能校务助理系统 — 系统架构设计
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
│  │ (React)  │  │(Next.js)│  │ (React)  │  │ (OpenAPI)│      │
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
│  │  Service  │  │  Service   │  │  Service   │  │(队列驱动) ││
│  │  (无状态)  │  │  (无状态)  │  │  (无状态)  │  └────┬─────┘│
│  └────┬──────┘  └────┬──────┘  └────┬──────┘       │      │
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
| **Notification Service** | 多渠道通知 | H (无状态) |
| **I18n Service** | 多语言 | H (无状态) |
| **OPA Rule Engine Service** | 统一权限控制 | H (无状态) |

> **Scaling:** H = Horizontal (可水平扩展) | M = Moderate

---

## 2. 技术栈选型

### 2.1 核心技术栈

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **后端框架** | Node.js + NestJS | 22 LTS, ^10.x | TypeScript 原生支持，性能优越 |
| **前端框架** | React 18 + TypeScript | ^18.x | 生态成熟 |
| **管理后台** | Next.js 14 | ^14.x | SSR/SSG、App Router |
| **数据库** | PostgreSQL | 16 | ACID、JSONB、FDW、内置向量扩展 |
| **连接池** | PgBouncer | ^1.22.x | 事务级连接池 |
| **缓存** | Redis Cluster | ^7.x | 高性能缓存、分布式锁、集群模式 |
| **消息队列** | Apache Kafka | ^3.x | 高吞吐、事件溯源、持久化 |
| **对象存储** | MinIO | ^2024.x | S3 兼容、自托管 |
| **搜索引擎** | Elasticsearch | ^8.x | 全文搜索 |
| **API Gateway** | Kong / APISIX | ^3.x | 高性能、插件生态 |
| **容器编排** | Kubernetes (GKE) | ^1.29.x | 云原生标准，多可用区部署 |
| **服务网格** | Istio | ^1.20.x | 流量管理、安全 |
| **Secrets管理** | HashiCorp Vault | ^1.16.x | 集中密钥管理、自动轮换 |
| **规则引擎** | Open Policy Agent (OPA) | ^0.65.x | 统一RBAC/ABAC权限控制 |

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
| **Prometheus** | 指标收集，集成20+核心监控指标 |
| **Grafana** | 可视化仪表板，8个专属运维/业务视图 |
| **Loki** | 日志聚合 |
| **Tempo** | 分布式追踪 |
| **Alertmanager** | 告警管理 |
| **PagerDuty** | 告警通知与值班 |
| **Node Exporter** | 主机指标采集 |
| **pg_stat_statements/pg_bouncer_exporter** | 数据库指标采集 |
| **Custom Exporter** | 业务自定义指标采集 |

---

## 3. 部署架构

### 3.1 环境规划

| 环境 | 用途 | 部署方式 | 多可用区配置 |
|------|------|----------|--------------|
| **Local** | 开发调试 | Docker Compose | 否 |
| **Dev** | 集成测试 | ArgoCD 自动部署 | 否 |
| **Staging** | 预发布验证 | ArgoCD 自动部署 | 是（2可用区） |
| **Production** | 正式生产 | ArgoCD 手动审批 | 是（3可用区，跨区域容灾） |

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
│   ├── notification-deploy (2 replicas, HPA: 2-6)
│   ├── opa-deploy (3 replicas)
│   └── i18n-deploy (1 replica, HPA: 1-3)
├── Infrastructure
│   ├── postgres-primary (StatefulSet, 1 node，AZ-A)
│   ├── postgres-replica (StatefulSet, 2 nodes，AZ-B / AZ-C)
│   ├── pgbouncer-deploy (3 replicas, 连接池，跨AZ部署)
│   ├── redis-cluster (6 nodes, 3主3从，跨3AZ部署)
│   ├── kafka-cluster (3 brokers，跨3AZ部署)
│   ├── elasticsearch-statefulset (3 nodes，跨3AZ部署)
│   └── kong-deployment (3 replicas，跨3AZ部署)
└── Ingress
    ├── kong-ingress (HTTPS, TLS 1.3，全局负载均衡)
    └── istio-ingressgateway
```

### 3.3 数据库架构

#### 3.3.1 PostgreSQL 主从复制配置 + PITR 恢复流程

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
│  │   Primary    │◄─────── 异步流复制 (WAL) 到两个副本        │
│  │  (写流量)    │◄─────── WAL每5分钟归档到S3，支持PITR恢复   │
│  └──────┬───────┘                                          │
│         │                                                   │
│  ┌──────▼───────┐  ┌───────▼───────┐                     │
│  │  Replica 1   │  │  Replica 2   │  (读流量)          │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**PITR（时间点恢复）实现流程：**
1. PostgreSQL 开启 wal_level = replica，自动归档每5分钟WAL日志到S3
2. 每日02:00执行全量备份，上传S3加密存储
3. 恢复时选择目标时间点，基于最近全量备份应用WAL日志到指定时间
4. 恢复后自动执行数据完整性校验（MD5 + 业务逻辑校验）
5. 完整恢复时间：15-30分钟，RPO ≤ 1小时

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
  Shards: 3 (每分片1主1从，跨3可用区部署)
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

| 数据类型 | 备份频率 | 保留周期 | 存储位置 | 恢复测试频率 |
|----------|----------|----------|----------|-------------|
| PostgreSQL 全量 | 每日02:00 | 7天本地 / 12个月S3 / 7年Glacier | S3 + Glacier | 每周 |
| PostgreSQL WAL | 每5分钟 | 7天 | S3 | 持续验证 |
| Redis RDB 快照 | 每6小时 | 30天 | 本地 + S3 | 每周 |
| MinIO 对象存储 | 每日增量 | 7天本地 / 12个月S3 | S3 | 每月 |
| Elasticsearch | 每12小时快照 | 2年 | S3 | 每月 |
| Vault 快照 | 每日 | 7天 | S3 | 每月 |

---

## 4. 安全架构

### 4.1 安全分层模型

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: 网络安全 — VPC隔离 │ 子网划分 │ 安全组 │ Network Policies │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: 传输安全 — TLS 1.3 │ mTLS │ 证书管理                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: 权限控制 — OPA统一规则引擎 │ RBAC/ABAC 集中管控        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: 应用安全 — 身份认证 │ 授权 │ 输入验证 │ CSP │ Rate Limiting│
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: 数据安全 — 字段级加密 │ RLS │ 密钥管理(Vault) │ 脱敏    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 6: 操作安全 — 审计日志 │ RBAC+ABAC │ 双人见证 │ 渗透测试  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 OPA 统一规则引擎架构

#### 4.2.1 整体结构
```
┌─────────────────────────────────────────────────────────────────┐
│                        OPA Rule Engine                          │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  RBAC Rules  │  ABAC Rules  │ Data Masking │ Access Control  │
│  角色权限配置 │ 属性权限配置 │ 敏感字段脱敏 │ 操作权限控制    │
└──────────────┴──────────────┴──────────────┴──────────────────┘
                          ↑
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      规则更新与分发机制                         │
│  - 规则变更通过GitOps管理，版本控制，变更审计                  │
│  - 变更后自动推送到所有OPA实例，实时生效                       │
│  - 所有决策结果均记录到审计日志                                │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 权限决策流程
```
请求进入
    ↓
OPA 接收上下文（用户角色、部门、访问资源、操作类型、IP地址等）
    ↓
执行RBAC规则检查：用户角色是否有该操作权限？
    ↓
RBAC允许 → 执行ABAC规则检查：用户属性是否符合资源访问条件？
    ↓
ABAC允许 → 执行数据脱敏规则：敏感字段是否需要脱敏显示？
    ↓
全部通过 → 允许访问
任意规则拒绝 → 拒绝访问，记录审计日志
```

#### 4.2.3 核心规则示例
1. **RBAC规则：** 校务主任拥有全部操作权限，教师仅可访问本班学生数据
2. **ABAC规则：** 仅工作时间（08:00-18:00）允许访问财务数据，非工作时间需二次验证
3. **脱敏规则：** 学生身份证号仅显示前1后1，中间脱敏；地址完全隐藏
4. **安全规则：** 异常IP（非香港地区）访问需额外多因素验证

### 4.3 网络安全与分段

```yaml
Network Segmentation:
  VPC Structure:
    - vpc-main (10.0.0.0/16)
    │   ├── subnet-public (10.0.1.0/24)     # 负载均衡器、API Gateway，AZ-A/B/C
    │   ├── subnet-private-app (10.0.2.0/24) # 应用服务，AZ-A/B/C
    │   └── subnet-private-data (10.0.3.0/24) # 数据库、Redis、Kafka，AZ-A/B/C

  Kubernetes Network Policies:
    # 默认策略：拒绝所有入口和出口流量
    - Default: deny all ingress/egress
    - API Gateway: allow ingress from internet
    - Services: allow ingress from API Gateway only
    - Database: allow application subnet only
```

### 4.4 Secrets 管理

```yaml
HashiCorp Vault:
  Storage: PostgreSQL (HA mode, 3 nodes)

  Secrets Engines:
    KV Secrets Engine (v2):
      - database/credentials
      - api-keys (Coze, Azure, WebSAMS, eClass, SMS, 邮件服务商)

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

### 4.5 应用安全控制

#### 4.5.1 API Gateway 安全配置

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

#### 4.5.2 输入验证 (多层防护)

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

#### 4.5.3 SQL 注入防护

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

#### 4.5.4 密码安全

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

### 4.6 认证与授权流程

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
OPA 统一授权（RBAC + ABAC 混合规则验证）
    │
    ▼
Audit Service (异步记录审计日志到Kafka)
```

### 4.7 数据隐私保护 (PDPO 合规要求)

| PDPO原则 | 实现方式 | 执行频率 |
|------|----------|--------|
| **收集最小化** | 仅收集必要字段、字段级访问控制 | 季度审查 |
| **访问控制** | 行级安全(RLS)、列级权限、OPA规则控制 | 实时 |
| **数据脱敏** | 日志中敏感信息自动脱敏，界面展示也做脱敏 | 实时 |
| **审计追踪** | 完整的操作日志、不可篡改记录，保留7年 | 实时 |
| **数据加密** | TLS 1.3 传输加密、AES-256 静态加密 | 持续生效 |
| **密钥管理** | HashiCorp Vault 集中管理，自动轮换 | 每周检查 |
| **数据保留** | 自动过期清理、归档策略，符合香港合规要求 | 每月执行 |
| **数据访问** | 双人见证机制、访问审批流程，敏感数据查看告警 | 实时 |
| **数据删除** | 彻底删除 + 备份清除，所有删除操作有审计记录 | 按需执行 |

---

## 5. Module 4: 用户与访问管理架构详细设计

### 5.1 模块概述

**Module 4 (User & Access Management)** 负责系统的用户管理和访问控制：
- F-USER-001: 用户生命周期管理
- F-USER-002: 身份认证 (Authentication)
- F-USER-003: 授权管理 (Authorization — RBAC + ABAC，OPA统一管控)
- F-USER-004: 会话与令牌管理
- F-USER-005: 审计日志
- F-USER-006: 凭据重置
- F-USER-007: 权限升级审批流程

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

### 5.4 混合授权模型 (RBAC + ABAC) — OPA实现

```
请求: 用户想要执行 ACTION on RESOURCE
    │
    ▼
1. 上下文收集：用户角色、部门、IP地址、时间、资源属性
    ↓
2. OPA RBAC规则检查：用户角色是否有该资源的操作权限？
    ↓
   结果: ALLOW / DENY / ABSTAIN
    ↓
3. OPA ABAC规则检查：用户属性是否符合访问条件？
    ↓
   例：用户是否属于资源所属部门？是否在工作时间访问？
    ↓
4. 最终决策：RBAC和ABAC均允许才允许访问，否则拒绝
    ↓
5. 审计日志记录所有决策结果和上下文
```

---

## 6. 性能与扩展性

### 6.1 性能指标（SLA保障）

| 指标 | 目标值 | SLA承诺 | 告警阈值 |
|------|--------|---------|----------|
| **API 响应时间 (P95)** | < 500ms (CRUD操作), < 2s (AI查询) | 99%的请求符合 | > 1s 告警 |
| **API 响应时间 (P99)** | < 1s (CRUD操作), < 5s (AI查询) | 99.9%的请求符合 | > 2s 告警 |
| **并发用户数** | 500+ 同时在线 | 支持最大1000并发 | > 300 告警 |
| **数据库连接池使用率** | < 70% | < 85% | > 80% 告警 |
| **缓存命中率** | > 80% | > 70% | < 60% 告警 |
| **服务可用性** | 99.9%（每年 downtime ≤ 8.76小时） | 99.9% SLA | < 99.5% 告警 |
| **消息通知送达率** | > 95%（多渠道故障切换保障） | > 90% | < 90% 告警 |

### 6.2 扩展策略

| 服务 | 水平扩展 | HPA 配置 |
|------|----------|----------|
| Dashboard Service | ✅ | 3-10 副本 |
| Cyclic Service | ✅ | 2-8 副本 |
| Finance Service | ✅ | 2-8 副本 |
| User Service | ✅ | 2-8 副本 |
| AI Service | ✅ | 2-6 副本 |
| Notification Service | ✅ | 2-6 副本 |
| OPA Service | ✅ | 3副本（固定，可扩展） |
| PostgreSQL | ⚠️（读写分离，主从切换） | 3节点（1主2从） |
| Redis | ✅ (集群模式) | 6 节点集群 |

### 6.3 缓存策略

| 数据类型 | TTL | 失效策略 |
|----------|-----|----------|
| 用户会话 | 24h | 滑动过期 |
| JWT Token 黑名单 | 15min | TTL 自动 |
| FAQ 搜索结果 | 1h | LRU 淘汰 |
| 仪表板数据 | 5min | LRU 淘汰 |
| 学生信息 | 30min | 写入失效 |
| 权限配置（OPA规则） | 12h | Vault/规则更新时触发自动失效 |

---

## 7. 可观测性与监控（Prometheus+Grafana架构）

### 7.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│  指标收集层                                                 │
│  ┌────────────────┬────────────────┬────────────────┐      │
│  │ Node Exporter  │  各服务Exporter│ 自定义Exporter │      │
│  │ 主机指标      │  应用/中间件指标│ 业务自定义指标 │      │
│  └────────────────┴────────────────┴────────────────┘      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Prometheus 集群（3节点，跨可用区高可用部署）                │
│  - 指标抓取、存储、查询                                      │
│  - 告警规则计算，触发告警到Alertmanager                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│  Grafana 可视化         │                 │ Alertmanager           │
│  - 8个专属运维/业务视图 │                 │ 告警路由、去重、分组   │
│  - 支持自定义仪表板     │                 │ 多渠道告警通知         │
└─────────────────────────┘                 └─────────────────────────┘
        │                                             │
        ▼                                             ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│  Loki 日志聚合          │                 │ PagerDuty + 多渠道通知  │
│  - 全链路日志查询       │                 │ 短信/APP/邮件/WhatsApp  │
│  - 上下文关联分析       │                 │ 自动故障切换，保障送达  │
└─────────────────────────┘                 └─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Tempo 分布式追踪        │
│  - 请求全链路追踪       │
│  - 性能瓶颈定位         │
└─────────────────────────┘
```

### 7.2 核心监控指标（20项集成）

| 监控类别 | 指标名称 | 说明 | 阈值 |
|----------|----------|------|------|
| **API网关** | http_requests_total | 总请求数 | - |
|          | http_requests_error_rate | 错误率 | > 1%告警 |
|          | http_request_duration_p95 | P95响应时间 | >1s告警 |
|          | kong_upstream_latency | 上游响应延迟 | >500ms告警 |
| **数据库** | postgres_connection_usage | 连接池使用率 | >80%告警 |
|          | postgres_query_duration_p95 | 查询P95延迟 | >1s告警 |
|          | postgres_wal_archive_backlog | WAL积压 | >500MB告警 |
|          | postgres_replication_lag | 主从复制延迟 | >30s告警 |
| **缓存** | redis_used_memory_percent | 内存使用率 | >85%告警 |
|          | redis_cache_hit_rate | 缓存命中率 | <60%告警 |
| **消息队列** | kafka_consumer_group_lag | 消费者组滞后 | >5000条告警 |
| **AI服务** | coze_api_quota_usage_percent | API配额使用率 | >90%告警 |
|          | ai_service_response_duration_p95 | AI响应P95时间 | >10s告警 |
| **系统集成** | websams_sync_success_rate | WebSAMS同步成功率 | <98%告警 |
|          | eclass_sync_success_rate | eClass同步成功率 | <98%告警 |
| **通知服务** | notification_delivery_success_rate | 通知送达率 | <90%告警 |
| **基础设施** | node_cpu_usage_percent | CPU使用率 | >85%告警 |
|          | node_memory_usage_percent | 内存使用率 | >85%告警 |
|          | node_filesystem_usage_percent | 磁盘使用率 | >85%告警 |
| **安全** | audit_log_failed_access_count | 失败访问次数 | 10分钟>100次告警 |

### 7.3 多渠道通知架构（自动故障切换）

```
┌─────────────────────────────────────────────────────────────────┐
│                         Notification Service                     │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│  短信(SMS)│  APP推送 │  邮件    │ WhatsApp │  备用通知渠道     │
│  香港电讯 │  微信/飞书│  企业邮箱│  官方API │  人工通知系统     │
└──────────┴──────────┴──────────┴──────────┴───────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      故障切换与重试机制                         │
│  - 主渠道发送失败自动切换到备用渠道，最多重试3次                │
│  - 所有发送结果记录审计日志，送达状态可查                        │
│  - 送达率低于90%自动触发告警，通知运维处理                        │
│  - 紧急通知自动多渠道发送，保障100%触达                          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 告警策略

```yaml
Alerting Strategy:
  Alert Rules:
    # Critical (立即通知)
    - HighErrorRate: error_rate > 5% for 1min → 短信+APP推送校务主任
    - ServiceDown: up == 0 for 1min → 短信+APP推送运维
    - DatabasePoolHigh: pool > 80% for 5min → 告警运维
    - WALBacklogHigh: WAL backlog > 1GB → 告警运维

    # Warning (通知)
    - HighLatency: P95 latency > 2s for 5min → Slack通知
    - CacheHitLow: hit_rate < 60% for 10min → Slack通知
    - CertExpiringSoon: 证书30天内到期 → 邮件通知

  Notification Channels:
    - 短信(SMS): Critical告警
    - APP推送: 所有告警
    - 邮件: 每日运维报告、证书告警
    - WhatsApp: 紧急事件通知
    - Slack: 所有运维告警、事件通知

  Escalation:
    - Level 1: 值班工程师 (0-5 分钟响应)
    - Level 2: 团队 Lead (5-15 分钟响应)
    - Level 3: 部门经理 (>15 分钟未响应自动升级)
```

### 7.5 日志管理

```yaml
Logging Strategy:
  Format: 结构化JSON
  Levels:
    - ERROR: 错误，需要立即处理
    - WARN: 警告，需要关注
    - INFO: 重要业务事件（登录，创建，更新）
    - DEBUG: 开发调试（生产环境不开启）

  Retention:
    - Hot (Loki): 30 天
    - Warm (S3): 6 个月
    - Cold (Glacier): 2 年
    - 审计日志: 7年（合规要求）

  Sensitive Data Masking:
    - 密码: "******"
    - 手机号: "****1234"
    - 身份证号: "A1****X"
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
├─ 4. Security Scan (Snyk + Trivy, Critical漏洞阻断PR)
├─ 5. OPA规则校验：权限规则语法校验 + 逻辑测试
├─ 6. Build & Push (Container Registry + SBOM)
└─ 7. Deploy to Staging (ArgoCD)

ArgoCD CD Pipeline (Production)
│
├─ 1. Manifest Sync (Kustomize)
├─ 2. Manual Approval (/approve 需校务主任授权)
├─ 3. Canary Deployment (10% → 50% → 100%，自动健康检查)
└─ 4. Rollback (自动触发：error_rate > 5% 1分钟)
```

### 8.2 灾难恢复架构（多可用区部署 + 一键恢复实现）

#### 8.2.1 容灾总体架构
```
┌─────────────────────────────────────────────────────────────────┐
│                        生产区域（主）                            │
│  香港可用区A/B/C 三可用区部署，所有服务跨AZ高可用                │
│  数据实时同步到容灾区域                                          │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼ 数据实时同步
┌─────────────────────────────────────────────────────────────────┐
│                        容灾区域（备）                            │
│  新加坡区域，最小资源配置，主区域故障时一键切换流量                │
│  RPO ≤ 1小时，RTO ≤ 4小时                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.2.2 一键灾难恢复流程（完全自动化实现）
```
一键恢复触发条件
  - 自动：监控检测到主区域服务不可用>5分钟
  - 手动：校务主任/运维触发
    ↓
1. 故障自动评估 → 自动识别故障范围，选择最优恢复策略
2. 备份完整性校验 → 确认备份文件可用，选择最近恢复点
3. 数据恢复 → 数据库PITR恢复、缓存恢复、文件恢复
4. 应用恢复 → 拉起所有服务，自动注入配置
5. 完整性校验 → 业务逻辑校验、健康检查、数据一致性检查
6. 流量切换 → 自动切换DNS/负载均衡流量到容灾区域
7. 通知 → 多渠道通知相关人员，生成恢复报告
    ↓
总耗时：15分钟（数据层故障）~4小时（全区域故障）
```

### 8.3 灾难恢复计划 (DRP)

```yaml
Disaster Recovery Plan:
  RTO (Recovery Time Objective):
    - 关键服务 (Auth, Dashboard, Notification): ≤4小时
    - 重要服务 (Finance, Cyclic): ≤8小时
    - 非关键服务 (Audit, Archive): ≤24小时

  RPO (Recovery Point Objective):
    - 关键数据 (学生, 财务, DSE成绩): ≤15分钟（WAL归档）
    - 重要数据 (出勤, 用户): ≤1小时
    - 非关键数据 (审计日志, 翻译): ≤24小时

  Failover Architecture:
    Primary: 香港（GKE，3可用区）
    DR Site: 新加坡（GKE，2可用区，active-passive）
    模式: 主区域故障时自动/手动切换，RTO ≤4小时

  DR Testing:
    - 频率: 每季度
    - 类型: 桌面推演 + 实际故障注入 + 一键恢复演练
    - 要求: 每次演练必须验证RTO/RPO达标，问题闭环解决
```

### 8.4 系统集成架构更新（新增集成）
```
┌─────────────────────────────────────────────────────────────────┐
│                         Integration Service                     │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│ WebSAMS  │  eClass  │ DSE放榜系统│ 外部会计系统│  第三方通知渠道   │
│  EDB官方 │  教育平台 │  香港考评局│  财务数据对接│  SMS/邮件/WhatsApp │
└──────────┴──────────┴──────────┴──────────┴───────────────────┘
```
**新增集成说明：**
1. **DSE放榜成绩对接：** 对接香港考评局DSE放榜系统，自动导入学生成绩，生成成绩单，支持JUPAS联招申请辅助
2. **外部会计系统对接：** 财务数据自动同步到外部会计系统，生成财务报表，支持预算管理，自动对账
3. **多渠道通知集成：** 对接香港主流SMS服务商、企业邮件系统、WhatsApp官方API，支持多渠道通知自动故障切换

### 8.5 运维Runbook手册

| # | Runbook | 说明 |
|---|---------|------|
| 1 | 服务重启 | kubectl rollout restart + 验证 |
| 2 | 数据库连接池耗尽 | SHOW DATABASES + pg_stat_activity + 终止长事务 |
| 3 | Redis 集群故障转移 | redis-cli cluster info + Sentinel 状态 + 手动故障转移 |
| 4 | Kafka 消费滞后 | kafka-consumer-groups + 扩展消费者 + 跳过积压数据 |
| 5 | 证书过期 | openssl s_client + Let's Encrypt 自动续期 |
| 6 | 一键灾难恢复 | /scripts/disaster-recovery.sh 脚本执行 |
| 7 | OPA规则更新 | Git提交 → ArgoCD自动同步 → 规则生效验证 |
| 8 | 多渠道通知故障切换 | 自动/手动切换备用服务商，保障通知送达 |

---

## 9. 多语言支持架构

### 9.1 模块概述

**Module 8 (Multilingual Support / i18n)** 为所有功能模块提供多语言服务能力。

**支持语言：**

| 语言代码 | 名称 | 场景 |
|----------|------|------|
| `zh-HK` | 繁体中文 (香港) | 默认语言，符合香港教育局规范 |
| `zh-HK-yue` | 粤语口语 | 家长端界面，更贴近香港用户使用习惯 |
| `zh-CN` | 简体中文 | 内地用户 |
| `en` | 英语 | 国际用户、外籍教师 |

### 9.2 技术实现

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| **前端 i18n** | i18next + react-i18n | React 生态标准 |
| **后端 i18n** | NestJS i18n module | 静态文件 + 数据库混合 |
| **日期格式化** | date-fns | 轻量级，支持香港本地化格式 |
| **翻译缓存** | Redis Cluster | 分布式缓存 |
| **LLM 翻译** | Coze / OpenAI | 上下文感知翻译，符合教育场景术语 |

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

### 附录 A: 架构审查结果摘要 (v0.4 → v1.0.0 正式版本)

**审查标准:** NIST SP 800-53, OWASP, Cloud Native Best Practices, ISO/IEC 27001, PDPO 香港隐私条例
**审查日期:** 2026-06-06
**审查结果:** 所有审查项通过，正式发布v1.0.0版本

#### 新增架构模块
| # | 项目 | 说明 |
|---|------|------|
| 1 | 运维监控架构 | Prometheus+Grafana完整方案，20项核心监控指标集成，自动告警 |
| 2 | 灾难恢复架构 | 多可用区部署、PITR恢复流程、一键灾难恢复自动化实现 |
| 3 | OPA规则引擎架构 | 统一权限控制，覆盖RBAC/ABAC，细粒度权限管控 |
| 4 | 多渠道通知架构 | SMS/APP/邮件/WhatsApp多渠道支持，自动故障切换，送达率≥95% |
| 5 | 系统集成扩展 | 新增DSE放榜成绩对接、预算管理对接外部会计系统 |
| 6 | PDPO合规增强 | 完善的隐私保护机制，符合香港个人数据隐私条例要求 |
| 7 | 技术栈版本升级 | Node.js升级到22 LTS，PostgreSQL升级到16，OPA 0.65.x |

#### 非功能属性增强
| # | 项目 | 说明 |
|---|------|------|
| 1 | 性能指标 | 明确API响应时间、并发用户数、缓存命中率等指标，99.9% SLA保障 |
| 2 | 可用性SLA | 服务可用性99.9%，每年downtime≤8.76小时 |
| 3 | PDPO合规 | 覆盖6项PDPO保障原则，满足香港合规要求 |
| 4 | 容灾能力 | RTO≤4小时，RPO≤1小时，每季度容灾演练 |

### 附录 B: 待补充内容

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
| v1.0.0 | 2026-06-06 | 正式版本 | 依据SPEC-COMPLETE v1.7.0深化设计，新增运维监控/灾难恢复/OPA规则引擎/多渠道通知架构，更新系统集成，补充PDPO合规，升级技术栈版本 |
| v0.4 | 2026-05-27 | Major Review | 架构审查: 21项差距修复；Scalability/Security/Maintainability 全面增强；新增第7-8节；完整CI/CD + DRP + 可观测性策略 |
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
| **PDPO (香港个人资料私隐条例)** | 数据隐私合规 |
| **EDB 香港教育局规范** | 教育系统数据规范 |

---

**文档维护：** 系统架构团队
**最后更新：** 2026-06-06
**版本：** v1.0.0（正式版本）
**文档链接：** https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/SPEC-SYSTEM-DESIGN.md
</text_never_used_51bce0c785ca2f68081bfa7d91973934>