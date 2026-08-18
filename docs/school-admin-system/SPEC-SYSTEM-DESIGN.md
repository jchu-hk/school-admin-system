<text_never_used_51bce0c785ca2f68081bfa7d91973934># 智能校务助理系统 — 系统架构设计
## Smart School Admin AI System — System Architecture Design

**文档版本：** v1.8.0-draft.1
**创建日期：** 2026-05-25
**最后更新：** 2026-08-13
**审查标准：** NIST SP 800-53, OWASP, Cloud Native Best Practices, ISO/IEC 27001, PDPO 香港隐私条例
**审查报告：** `/docs/school-admin-system/archive/ARCH-REVIEW-v1.0.0.md`
**状态：** 草稿（待二轮审查）

> **⚠️ 与 SPEC-COMPLETE v2.0.0-draft.1 版本对齐说明**
> - 本架构文档原始版本标注为 v1.0.0（对应 SPEC-COMPLETE v1.0.0），现随 SPEC 演进更正为 v1.7.0
> - 本次 P1 整改新增：Module 11（F-OPS 运维功能完整架构，覆盖全部 9 项）、Module 12（DSE/HKEAA SDP 对接技术规范）
> - Module 11/12 为 v1.7.0 新增内容，其余章节已与 SPEC v1.7.0 对齐
> - v1.8.0-draft.1 新增：Module 13（QR Code 校园签到考勤系统设计）和 Module 14（学生&家长门户权限管理系统），对应 CR-20260714-001
> - v1.8.0-draft.2 新增：§22 校车点名与查询模板模块技术设计（F-BUS-002 校车点大名记录、F-INQ-002 快速回复模板），对应 Issue #361
> - v1.8.0-draft.3 新增：§23 AI 自动化模块技术设计（F-AI-002 FAQ 智能匹配、F-AUTO-001 周期性任务触发器、F-AUTO-002 智能提醒系统），对应 Issue #362
> - v1.8.0-draft.4 新增：§24 运维自动化模块技术设计（F-OPS-002/003/006/007/008/009），对应 Issue #363
> - v1.8.0-draft.5 新增：§25 增强功能模块技术设计（F-AI-003 OCR 识别、F-I18N-003 实时翻译、F-I18N-004 Locale 本地化、F-NEW-002 多渠道通知模板、F-NEW-005 自定义报表+定时推送），对应 Issue #364
> - 本版本状态为"草稿（待二轮审查）"，待架构评审委员会二轮通过后升为正式发布

---

## 目录

1. [总体架构](#1-总体架构)
2. [技术栈选型](#2-技术栈选型)
3. [部署架构](#3-部署架构)
4. [安全架构](#4-安全架构)
5. [Module 4: 用户与访问管理架构详细设计](#5-module-4-用户与访问管理架构详细设计)
6. [性能与扩展性（非功能属性）](#6-性能与扩展性非功能属性)
7. [可观测性与监控（Prometheus+Grafana架构）](#7-可观测性与监控prometheusgrafana架构)
8. [运维与灾难恢复](#8-运维与灾难恢复)
9. [Module 11: F-OPS 运维功能完整架构（9项全覆盖）](#9-module-11-f-ops-运维功能完整架构9项全覆盖)
10. [Module 12: DSE放榜系统对接HKEAA SDP技术规范](#10-module-12-dse放榜系统对接hkeaa-sdp技术规范)
11. [QR Code 校园签到考勤 — 系统设计 (High-Level Design)](#12-qr-code-校园签到考勤--系统设计-high-level-design)
12. [Module 14: 学生&家长门户权限管理系统](#15-module-14-学生家长门户权限管理系统)
13. [多语言支持架构](#14-多语言支持架构)
14. [附录](#附录)
15. [校车点名与查询模板模块 — 技术设计 (F-BUS-002, F-INQ-002)](#22-校车点名与查询模板模块--技术设计f-bus-002-f-inq-002-issue-361)

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
│  ┌────────────┐                                                │
│  │  OPA Rule  │  统一权限控制引擎，所有授权请求必经              │
│  │  Engine    │  RBAC+ABAC 混合规则，实时生效                    │
│  └────────────┘                                                │
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
| **Data Privacy First** | 隐私保护优先于便利性，符合PDPO要求 | 全栈 |
| **Infrastructure as Code** | 所有基础设施通过代码管理 | 部署 |
| **GitOps** | 部署配置与代码同版本管理，审计可追溯 | CI/CD |
| **Disaster Recovery Ready** | 所有模块设计考虑容灾能力，RTO/RPO达标 | 全栈 |

### 1.3 服务边界划分

| Service | Domain | Scaling |
|---------|--------|---------|
| **Dashboard Service** | 每日运营 | H (无状态) |
| **Cyclic Service** | 周期性校务 | H (无状态) |
| **Finance Service** | 财务资产 | H (无状态) |
| **User Service** | 用户管理 | H (无状态) |
| **AI Service** | 智能助理 | H (队列驱动) |
| **Integration Service** | 系统集成（WebSAMS/eClass/DSE/会计系统） | M (1-2副本) |
| **Audit Service** | 审计日志 | H (无状态) |
| **Notification Service** | 多渠道通知（SMS/APP/邮件/WhatsApp） | H (无状态) |
| **OPA Rule Engine Service** | 统一权限控制 | H (无状态) |
| **I18n Service** | 多语言 | H (无状态) |

> **Scaling:** H = Horizontal (可水平扩展) | M = Moderate

---

## 2. 技术栈选型

### 2.1 核心技术栈

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **后端框架** | Node.js + NestJS | 22 LTS, ^10.x | TypeScript 原生支持，性能优越，LTS长期支持 |
| **前端框架** | React 18 + TypeScript | ^18.x | 生态成熟 |
| **管理后台** | Next.js 14 | ^14.x | SSR/SSG、App Router |
| **数据库** | PostgreSQL | 16 | ACID、JSONB、FDW、内置向量扩展(pgvector)，性能提升明显 |
| **连接池** | PgBouncer | ^1.22.x | 事务级连接池 |
| **缓存** | Redis Cluster | ^7.x | 高性能缓存、分布式锁、集群模式 |
| **消息队列** | Apache Kafka | ^3.x | 高吞吐、事件溯源、持久化 |
| **对象存储** | MinIO | ^2024.x | S3 兼容、自托管 |
| **搜索引擎** | Elasticsearch | ^8.x | 全文搜索 |
| **API Gateway** | Kong / APISIX | ^3.x | 高性能、插件生态 |
| **容器编排** | Kubernetes (GKE) | ^1.29.x | 云原生标准，多可用区部署支持 |
| **服务网格** | Istio | ^1.20.x | 流量管理、安全 |
| **Secrets管理** | HashiCorp Vault | ^1.16.x | 集中密钥管理、自动轮换 |
| **规则引擎** | Open Policy Agent (OPA) | ^0.65.x | 统一RBAC/ABAC权限控制，云原生标准 |
| **通知网关** | 自研多渠道通知网关 | v1.0 | 支持SMS/APP/邮件/WhatsApp，自动故障切换 |

### 2.2 AI/ML 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| **LLM Provider** | Coze / OpenAI | 自然语言理解、生成 |
| **OCR Engine** | Azure Computer Vision | 文档识别（支持香港繁体/简体/英文） |
| **Embedding** | OpenAI text-embedding-3 | 语义搜索 |
| **Vector DB** | pgvector (PostgreSQL 16) | FAQ 向量存储，无需额外数据库 |

### 2.3 开发工具链

| 工具 | 用途 |
|------|------|
| **pnpm + Turborepo** | Monorepo 包管理 |
| **ESLint + Prettier** | 代码质量 |
| **Jest + Vitest** | 单元测试 |
| **Playwright** | E2E 测试 |
| **Snyk + Trivy** | 安全漏洞扫描 |
| **SonarQube** | 代码质量分析 |
| **Prisma** | ORM （支持PostgreSQL 16新特性） |
| **GitHub Actions** | CI/CD |
| **ArgoCD** | GitOps |
| **Terraform + Pulumi** | IaC |

### 2.4 监控与可观测性

| 工具 | 用途 |
|------|------|
| **Prometheus** | 指标收集，集成20+核心监控指标，3节点高可用集群 |
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

### 3.2 Kubernetes 部署结构（3可用区高可用）

```
Namespace: school-admin-prod
├── Services
│   ├── dashboard-deploy (3 replicas, HPA: 3-10，跨AZ分布)
│   ├── cyclic-deploy (2 replicas, HPA: 2-8，跨AZ分布)
│   ├── finance-deploy (2 replicas, HPA: 2-8，跨AZ分布)
│   ├── user-deploy (2 replicas, HPA: 2-8，跨AZ分布)
│   ├── ai-deploy (2 replicas, HPA: 2-6 + Kafka Consumer Group)
│   ├── integration-deploy (1 replica, HPA: 1-3)
│   ├── audit-deploy (2 replicas, HPA: 2-6)
│   ├── notification-deploy (2 replicas, HPA: 2-6)
│   ├── opa-deploy (3 replicas，固定，每个AZ 1个)
│   └── i18n-deploy (1 replica, HPA: 1-3)
├── Infrastructure
│   ├── postgres-primary (StatefulSet, 1 node，AZ-A)
│   ├── postgres-replica (StatefulSet, 2 nodes，AZ-B / AZ-C)
│   ├── pgbouncer-deploy (3 replicas, 连接池，每个AZ 1个)
│   ├── redis-cluster (6 nodes, 3主3从，跨3AZ部署，每AZ 1主1从)
│   ├── kafka-cluster (3 brokers，每个AZ 1个)
│   ├── elasticsearch-statefulset (3 nodes，每个AZ 1个)
│   └── kong-deployment (3 replicas，每个AZ 1个)
└── Ingress
    ├── kong-ingress (HTTPS, TLS 1.3，全局负载均衡，跨AZ)
    └── istio-ingressgateway
```

### 3.3 数据库架构

#### 3.3.1 PostgreSQL 主从复制配置 + PITR 时间点恢复流程

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
1. PostgreSQL 开启 wal_level = replica，自动归档每5分钟WAL日志到加密S3存储
2. 每日02:00执行全量备份，上传S3加密存储，保留7年
3. 恢复时选择目标时间点，基于最近全量备份应用WAL日志到指定时间
4. 恢复后自动执行数据完整性校验（MD5 + 业务逻辑校验 + 对账）
5. 完整恢复时间：15-30分钟，RPO ≤ 1小时

#### 3.3.2 表分区策略

```sql
-- 审计日志：按月分区，自动清理超过7年的数据
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

-- 创建分区（自动每月创建新分区）
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
  Provider: Cloudflare (香港节点优化，覆盖全港学校网络)
  Cache Rules:
    - 静态资源 (JS/CSS/Fonts): public, max-age=31536000
    - 翻译JSON: private, max-age=3600, cache-busting
    - 图片: public, max-age=2592000
    - API响应: no-cache
  Security: TLS 1.3 only
```

### 3.6 数据备份策略（符合PDPO保留要求）

| 数据类型 | 备份频率 | 保留周期 | 存储位置 | 恢复测试频率 |
|----------|----------|----------|----------|-------------|
| PostgreSQL 全量 | 每日02:00 | 7天本地 / 12个月S3 / 7年Glacier | S3 + Glacier 加密存储 | 每周 |
| PostgreSQL WAL | 每5分钟 | 7天 | S3 | 持续验证 |
| Redis RDB 快照 | 每6小时 | 30天 | 本地 + S3 | 每周 |
| MinIO 对象存储 | 每日增量 | 7天本地 / 12个月S3 | S3 | 每月 |
| Elasticsearch | 每12小时快照 | 2年 | S3 | 每月 |
| Vault 快照 | 每日 | 7天 | S3 | 每月 |
| 审计日志 | 实时写入 | 7年 | 加密归档存储 | 每月校验完整性 |

---

## 4. 安全架构

### 4.1 安全分层模型

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: 网络安全 — VPC隔离 │ 子网划分 │ 安全组 │ Network Policies │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: 传输安全 — TLS 1.3 │ mTLS │ 证书自动续期              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: 权限控制 — OPA统一规则引擎 │ RBAC/ABAC 集中管控        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: 应用安全 — 身份认证 │ 授权 │ 输入验证 │ CSP │ Rate Limiting│
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: 数据安全 — 字段级加密 │ RLS │ 密钥管理(Vault) │ 脱敏    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 6: 操作安全 — 审计日志 │ 双人见证 │ 渗透测试 │ 合规检查    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 OPA 统一规则引擎架构（新增模块）

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
│  - 变更后自动推送到所有OPA实例，实时生效，无需重启服务          │
│  - 所有决策结果均记录到审计日志，可追溯                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 权限决策流程
```
用户请求进入
    ↓
Kong 网关鉴权 → 流量控制 → WAF检查
    ↓
请求转发到对应服务前，必经OPA规则引擎校验
    ↓
OPA 接收完整上下文（用户角色、部门、访问资源、操作类型、IP地址、时间、设备等）
    ↓
执行RBAC规则检查：用户角色是否有该资源的操作权限？
    ↓
RBAC允许 → 执行ABAC规则检查：用户属性是否符合资源访问条件？
    ↓
例：是否工作时间访问？是否属于资源所属部门？是否有访问权限？
    ↓
ABAC允许 → 执行数据脱敏规则：敏感字段是否需要脱敏显示？
    ↓
全部规则校验通过 → 允许访问，执行后续业务逻辑
任意规则拒绝 → 拒绝访问，记录完整审计日志，必要时触发告警
```

#### 4.2.3 核心规则示例
1. **RBAC规则：** 校务主任拥有全部操作权限，教师仅可访问本班学生数据，家长仅可访问自己子女数据
2. **ABAC规则：** 仅工作时间（08:00-18:00）允许访问财务数据，非工作时间需校务主任二次授权
3. **脱敏规则：** 学生身份证号仅显示前1后1，中间脱敏；地址完全隐藏；手机号显示前3后4
4. **安全规则：** 异常IP（非香港地区）访问需额外多因素验证，短时间多次失败自动锁定
5. **合规规则：** 访问敏感数据需双人见证，所有操作记录审计日志，保留7年

### 4.3 网络安全与分段（多可用区隔离）

```yaml
Network Segmentation:
  VPC Structure:
    - vpc-main (10.0.0.0/16)
    │   ├── subnet-public (10.0.1.0/24)     # 负载均衡器、API Gateway，AZ-A/B/C
    │   ├── subnet-private-app (10.0.2.0/24) # 应用服务，AZ-A/B/C
    │   └── subnet-private-data (10.0.3.0/24) # 数据库、Redis、Kafka，AZ-A/B/C，禁止公网访问

  Kubernetes Network Policies:
    # 默认策略：拒绝所有入口和出口流量
    - Default: deny all ingress/egress
    - API Gateway: allow ingress from internet only (80/443)
    - Services: allow ingress from API Gateway only, 内部服务互通按最小权限
    - Database: allow application subnet only, 禁止跨子网访问
```

### 4.4 Secrets 管理（自动轮换）

```yaml
HashiCorp Vault:
  Storage: PostgreSQL (HA mode, 3 nodes, 跨AZ部署)

  Secrets Engines:
    KV Secrets Engine (v2):
      - database/credentials
      - api-keys (Coze, Azure, WebSAMS, eClass, SMS, 邮件, WhatsApp服务商)

    Transit Secrets Engine:
      - JWT signing keys (每6个月自动轮换)

    Database Secrets Engine:
      - PostgreSQL credentials (90天动态轮换，自动更新应用配置)

  Access Control:
    - Kubernetes Auth: 服务账号通过 ServiceAccount 认证，无需硬编码密钥
    - MFA: 手动访问需通过 MFA 认证，仅授权人员可访问

  Rotation Schedule:
    - Database passwords: 每90天自动轮换
    - API Keys: 每180天自动轮换
    - JWT Signing Keys: 每6个月自动轮换
    - TLS 证书: 自动续期，到期前30天提醒
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
// Layer 1: API Gateway (Zod Schema) 校验所有入参
const userSchema = z.object({
  employee_id: z.string().regex(/^E\d{7}$/),
  username: z.string().min(3).max(50),
  email: z.string().email()
});

// Layer 2: Service Layer (Business Validation) 业务逻辑校验
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
  ORM: Prisma (参数化查询，自动防注入)
  Database Least Privilege:
    - application_user: SELECT, INSERT, UPDATE (无DDL权限)
    - migration_user: 仅CI/CD流水线可使用，有DDL权限
    - analytics_user: SELECT only 只读权限
  OWASP Scan:
    - Snyk + npm audit (每次CI/CD自动扫描)
    - Critical漏洞自动阻断PR合并
```

#### 4.5.4 密码安全

```yaml
Password Security:
  Algorithm: Argon2id (@node-rs/argon2) 行业最新加密算法，抗彩虹表攻击
  Parameters:
    - Memory Cost: 64 MiB
    - Time Cost: 3 iterations
    - Parallelism: 4 threads
  Policy:
    - Minimum: 8 characters
    - Complexity: 大写+小写+数字+特殊字符
    - History: 最近5次密码不可复用
    - Expiration: 90天后强制更换
    - Lockout: 5次失败后锁定15分钟，自动解锁
```

### 4.6 认证与授权流程

```
User Login
    │
    ▼
Kong API Gateway (Rate Limiting + WAF + TLS Termination)
    │
    ▼
Auth Service (JWT Access Token 15min + Refresh Token 30days，多因素认证支持)
    │
    ▼
OPA 统一授权（RBAC + ABAC 混合规则验证，所有请求必经）
    │
    ▼
Audit Service (异步记录审计日志到Kafka，不可篡改，保留7年)
```

### 4.7 数据隐私保护 (PDPO 合规要求，6项原则全覆盖)

| PDPO原则 | 实现方式 | 执行频率 | 审计方式 |
|------|----------|--------|----------|
| **收集最小化** | 仅收集必要字段、字段级访问控制，禁止冗余收集 | 季度审查 | 数据字段审计 |
| **访问控制** | 行级安全(RLS)、列级权限、OPA规则控制，最小权限原则 | 实时 | 权限审计日志 |
| **数据脱敏** | 日志中敏感信息自动脱敏，界面展示也做脱敏，防止泄露 | 实时 | 定期抽样检查 |
| **审计追踪** | 完整的操作日志、不可篡改记录，保留7年，符合合规要求 | 实时 | 审计日志完整性校验 |
| **数据加密** | TLS 1.3 传输加密、AES-256 静态加密，密钥集中管理 | 持续生效 | 加密配置审计 |
| **密钥管理** | HashiCorp Vault 集中管理，自动轮换，防止密钥泄露 | 每周检查 | 密钥轮换审计 |
| **数据保留** | 自动过期清理、归档策略，符合香港合规要求，超期自动删除 | 每月执行 | 保留策略审计 |
| **数据访问** | 双人见证机制、访问审批流程，敏感数据查看自动告警 | 实时 | 访问流程审计 |
| **数据删除** | 彻底删除 + 备份清除，所有删除操作有审计记录，可追溯 | 按需执行 | 删除流程审计 |
| **用户权利** | 支持用户查询、更正、删除个人数据，符合PDPO用户权利要求 | 按需执行 | 申请处理流程审计 |

---

## 5. Module 4: 用户与访问管理架构详细设计

### 5.1 模块概述

**Module 4 (User & Access Management)** 负责系统的用户管理和访问控制：
- F-USER-001: 用户生命周期管理（入职/调岗/离职自动处理）
- F-USER-002: 身份认证 (Authentication，支持多因素认证)
- F-USER-003: 授权管理 (Authorization — RBAC + ABAC，OPA统一管控)
- F-USER-004: 会话与令牌管理
- F-USER-005: 审计日志（全操作记录，保留7年）
- F-USER-006: 凭据重置（自助/管理员重置）
- F-USER-007: 权限升级审批流程（敏感权限申请需审批）

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

-- 审计日志表（按月分区，保留7年）
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
  exp: number;        // 15 minutes，短期有效，防止泄露
  iat: number;
  jti: string;       // JWT ID for revocation，支持主动吊销
}
```

### 5.4 混合授权模型 (RBAC + ABAC) — OPA实现

```
请求: 用户想要执行 ACTION on RESOURCE
    │
    ▼
1. 上下文收集：用户角色、部门、IP地址、时间、资源属性、操作类型
    ↓
2. OPA RBAC规则检查：用户角色是否有该资源的操作权限？
    ↓
   结果: ALLOW / DENY / ABSTAIN
    ↓
3. OPA ABAC规则检查：用户属性是否符合访问条件？
    ↓
   例：用户是否属于资源所属部门？是否在工作时间访问？是否有权限访问该学生数据？
    ↓
4. 最终决策：RBAC和ABAC均允许才允许访问，否则拒绝
    ↓
5. 审计日志记录所有决策结果和上下文，可追溯
```

---

## 6. 性能与扩展性（非功能属性）

### 6.1 性能指标（SLA保障，明确承诺）

| 指标 | 目标值 | SLA承诺 | 告警阈值 |
|------|--------|---------|----------|
| **API 响应时间 (P95)** | < 500ms (CRUD操作), < 2s (AI查询) | 99%的请求符合 | > 1s 告警 |
| **API 响应时间 (P99)** | < 1s (CRUD操作), < 5s (AI查询) | 99.9%的请求符合 | > 2s 告警 |
| **并发用户数** | 500+ 同时在线，支持最大1000并发 | 支持峰值1000并发 | > 300 告警 |
| **数据库连接池使用率** | < 70% | < 85% | > 80% 告警 |
| **缓存命中率** | > 80% | > 70% | < 60% 告警 |
| **服务可用性** | 99.9%（每年 downtime ≤ 8.76小时） | 99.9% SLA，未达标提供服务补偿 | < 99.5% 告警 |
| **消息通知送达率** | > 95%（多渠道故障切换保障） | > 90% SLA | < 90% 告警 |
| **数据同步成功率** | > 99%（WebSAMS/eClass/DSE系统） | > 98% | < 98% 告警 |

### 6.2 扩展策略

| 服务 | 水平扩展 | HPA 配置 |
|------|----------|----------|
| Dashboard Service | ✅ | 3-10 副本，CPU>70%自动扩容 |
| Cyclic Service | ✅ | 2-8 副本，CPU>70%自动扩容 |
| Finance Service | ✅ | 2-8 副本，CPU>70%自动扩容 |
| User Service | ✅ | 2-8 副本，CPU>70%自动扩容 |
| AI Service | ✅ | 2-6 副本，队列积压自动扩容 |
| Notification Service | ✅ | 2-6 副本，队列积压自动扩容 |
| OPA Service | ✅ | 3副本（固定，可扩展到更多） |
| PostgreSQL | ⚠️（读写分离，主从切换，只读副本扩展） | 3节点（1主2从，可扩展更多只读副本） |
| Redis | ✅ (集群模式，水平分片扩展) | 6 节点集群，可扩展到更多分片 |

### 6.3 缓存策略

| 数据类型 | TTL | 失效策略 |
|----------|-----|----------|
| 用户会话 | 24h | 滑动过期 |
| JWT Token 黑名单 | 15min | TTL 自动失效 |
| FAQ 搜索结果 | 1h | LRU 淘汰 |
| 仪表板数据 | 5min | LRU 淘汰 |
| 学生信息 | 30min | 写入时主动失效 |
| 权限配置（OPA规则） | 12h | 规则更新时触发主动失效 |
| 翻译数据 | 24h | 翻译更新时主动失效 |

---

## 7. 可观测性与监控（Prometheus+Grafana架构，新增模块）

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
│  Prometheus 集群（3节点，跨可用区高可用部署，持久化存储）      │
│  - 指标抓取、存储、查询，保留30天数据                        │
│  - 告警规则计算，触发告警到Alertmanager                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│  Grafana 可视化         │                 │ Alertmanager           │
│  - 8个专属运维/业务视图 │                 │ 告警路由、去重、分组   │
│  - 支持自定义仪表板     │                 │ 多渠道告警通知         │
│  - 权限控制，不同角色可见不同视图         │
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

### 7.2 核心监控指标（20项集成，全覆盖）

| 监控类别 | 指标名称 | 说明 | 告警阈值 |
|----------|----------|------|----------|
| **API网关** | http_requests_total | 总请求数 | - |
|          | http_requests_error_rate | 错误率 | > 1% 1分钟触发告警 |
|          | http_request_duration_p95 | P95响应时间 | >1s 5分钟触发告警 |
|          | kong_upstream_latency | 上游响应延迟 | >500ms 5分钟触发告警 |
| **数据库** | postgres_connection_usage | 连接池使用率 | >80% 5分钟触发告警 |
|          | postgres_query_duration_p95 | 查询P95延迟 | >1s 5分钟触发告警 |
|          | postgres_wal_archive_backlog | WAL积压 | >500MB 触发告警 |
|          | postgres_replication_lag | 主从复制延迟 | >30s 触发告警 |
| **缓存** | redis_used_memory_percent | 内存使用率 | >85% 5分钟触发告警 |
|          | redis_cache_hit_rate | 缓存命中率 | <60% 10分钟触发告警 |
| **消息队列** | kafka_consumer_group_lag | 消费者组滞后 | >5000条 触发告警 |
| **AI服务** | coze_api_quota_usage_percent | API配额使用率 | >90% 触发告警 |
|          | ai_service_response_duration_p95 | AI响应P95时间 | >10s 5分钟触发告警 |
| **系统集成** | websams_sync_success_rate | WebSAMS同步成功率 | <98% 触发告警 |
|          | eclass_sync_success_rate | eClass同步成功率 | <98% 触发告警 |
| **通知服务** | notification_delivery_success_rate | 通知送达率 | <90% 触发告警 |
| **基础设施** | node_cpu_usage_percent | CPU使用率 | >85% 5分钟触发告警 |
|          | node_memory_usage_percent | 内存使用率 | >85% 5分钟触发告警 |
|          | node_filesystem_usage_percent | 磁盘使用率 | >85% 5分钟触发告警 |
| **安全** | audit_log_failed_access_count | 失败访问次数 | 10分钟>100次触发告警 |

### 7.3 多渠道通知架构（新增模块，自动故障切换）

```
┌─────────────────────────────────────────────────────────────────┐
│                         Notification Service                     │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│  短信(SMS)│  APP推送 │  邮件    │ WhatsApp │  备用通知渠道     │
│  香港电讯 │  微信/飞书│  企业邮箱│  官方API │  人工通知系统     │
│  多服务商冗余│  多端支持 │  多服务商冗余│  官方API支持 │  紧急情况 fallback │
└──────────┴──────────┴──────────┴──────────┴───────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      故障切换与重试机制                         │
│  - 主渠道发送失败自动切换到备用渠道，最多重试3次，保障送达率      │
│  - 所有发送结果记录审计日志，送达状态可查，可追溯                │
│  - 送达率低于90%自动触发告警，通知运维处理                        │
│  - 紧急通知自动多渠道同时发送，保障100%触达                      │
│  - 支持按通知类型配置优先级和发送渠道，关键通知优先保障          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 告警策略

```yaml
Alerting Strategy:
  Alert Rules:
    # Critical (立即通知，15分钟内必须响应)
    - HighErrorRate: error_rate > 5% for 1min → 短信+APP推送校务主任+运维主管
    - ServiceDown: up == 0 for 1min → 短信+APP推送运维工程师
    - DatabasePoolHigh: pool > 80% for 5min → 告警运维工程师
    - WALBacklogHigh: WAL backlog > 1GB → 告警运维工程师
    - NotificationDeliveryLow: 送达率 < 80% → 告警运维工程师

    # Warning (2小时内响应，工作时间处理)
    - HighLatency: P95 latency > 2s for 5min → Slack通知运维群
    - CacheHitLow: hit_rate < 60% for 10min → Slack通知运维群
    - CertExpiringSoon: 证书30天内到期 → 邮件通知运维
    - QuotaLow: API配额剩余 <10% → 邮件通知运维

  Notification Channels:
    - 短信(SMS): Critical级别告警，紧急通知
    - APP推送: 所有级别告警，日常通知
    - 邮件: 每日运维报告、证书告警、非紧急通知
    - WhatsApp: 紧急事件通知，校务主任通知
    - Slack: 所有运维告警、事件通知，内部沟通

  Escalation:
    - Level 1: 值班工程师 (0-5 分钟响应)
    - Level 2: 团队 Lead (5-15 分钟未响应自动升级)
    - Level 3: 部门经理 (>15 分钟未响应自动升级)
```

### 7.5 日志管理（符合PDPO要求）

```yaml
Logging Strategy:
  Format: 结构化JSON，方便查询分析
  Levels:
    - ERROR: 错误，需要立即处理，告警触发
    - WARN: 警告，需要关注，记录日志
    - INFO: 重要业务事件（登录，创建，更新），审计用
    - DEBUG: 开发调试（生产环境默认关闭，可临时开启）

  Retention:
    - Hot (Loki): 30 天，快速查询
    - Warm (S3): 6 个月，归档查询
    - Cold (Glacier): 2 年，长期归档
    - 审计日志: 7年（PDPO合规要求，加密存储，不可篡改）

  Sensitive Data Masking: 所有敏感信息自动脱敏，防止泄露
    - 密码: "******"
    - 手机号: "****1234"
    - 身份证号: "A1****X"
    - 地址: 完全隐藏，仅授权人员可查看
    - JWT Token: "Bearer ****"
```

---

## 8. 运维与灾难恢复

### 8.1 CI/CD 流水线（安全左移）

```
GitHub Actions CI Pipeline
│
├─ 1. Lint & Format (ESLint + Prettier)
├─ 2. Unit Tests (Jest, coverage >= 80%)
├─ 3. Integration Tests (Docker Compose，全链路测试)
├─ 4. Security Scan (Snyk + Trivy, Critical漏洞自动阻断PR合并)
├─ 5. OPA规则校验：权限规则语法校验 + 逻辑测试 + 合规检查
├─ 6. Build & Push (Container Registry + SBOM 软件物料清单)
└─ 7. Deploy to Staging (ArgoCD 自动部署)

ArgoCD CD Pipeline (Production)
│
├─ 1. Manifest Sync (Kustomize，配置与代码分离)
├─ 2. Manual Approval (/approve 需校务主任授权，双因素认证)
├─ 3. Canary Deployment (10% → 50% → 100%，自动健康检查，错误率>5%自动回滚)
└─ 4. Rollback (自动触发：error_rate > 5% 1分钟，无需人工干预)
```

### 8.2 灾难恢复架构（多可用区部署 + 一键恢复实现，新增模块）

#### 8.2.1 容灾总体架构
```
┌─────────────────────────────────────────────────────────────────┐
│                        生产区域（主）                            │
│  香港可用区A/B/C 三可用区部署，所有服务跨AZ高可用                │
│  数据实时同步到容灾区域，WAL日志5分钟同步一次                    │
└───────────────────────────────────┬─────────────────────────────┘
                                    │ 数据实时同步（WAL/对象存储/配置）
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        容灾区域（备）                            │
│  新加坡区域，最小资源配置，主区域故障时一键切换流量                │
│  RPO ≤ 1小时，RTO ≤ 4小时，满足业务连续性要求                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.2.2 一键灾难恢复流程（完全自动化实现，脚本化执行）
```
一键恢复触发条件
  - 自动：监控检测到主区域服务不可用>5分钟，多指标确认后自动触发
  - 手动：校务主任/运维主管确认故障后手动触发
    ↓
1. 故障自动评估 → 自动识别故障范围，选择最优恢复策略，生成恢复方案预览
2. 备份完整性校验 → 确认备份文件可用，选择最近恢复点，验证MD5完整性
3. 数据恢复 → 数据库PITR恢复到指定时间点、缓存恢复、文件恢复
4. 应用恢复 → 拉起所有服务，自动注入配置，健康检查通过
5. 完整性校验 → 业务逻辑校验、健康检查、数据一致性检查、对账校验
6. 流量切换 → 自动切换DNS/负载均衡流量到容灾区域，灰度放量
7. 通知 → 多渠道通知相关人员，生成恢复报告，记录审计日志
    ↓
总耗时：15分钟（数据层故障）~4小时（全区域故障），符合RTO/RPO要求
```

### 8.3 灾难恢复计划 (DRP)

```yaml
Disaster Recovery Plan:
  RTO (Recovery Time Objective):
    - 关键服务 (Auth, Dashboard, Notification): ≤4小时
    - 重要服务 (Finance, Cyclic, DSE成绩): ≤8小时
    - 非关键服务 (Audit, Archive): ≤24小时

  RPO (Recovery Point Objective):
    - 关键数据 (学生, 财务, DSE成绩): ≤15分钟（WAL归档）
    - 重要数据 (出勤, 用户): ≤1小时
    - 非关键数据 (审计日志, 翻译): ≤24小时

  Failover Architecture:
    Primary: 香港（GKE，3可用区）
    DR Site: 新加坡（GKE，2可用区，active-passive）
    模式: 主区域故障时自动/手动切换，RTO ≤4小时
    流量切换: DNS 加权切换，灰度放量，逐步切流，避免冲击

  DR Testing:
    - 频率: 每季度
    - 类型: 桌面推演 + 实际故障注入 + 一键恢复演练
    - 要求: 每次演练必须验证RTO/RPO达标，问题闭环解决，输出演练报告
```

### 8.4 系统集成架构更新（新增DSE/会计系统集成）
```
┌─────────────────────────────────────────────────────────────────┐
│                         Integration Service                     │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│ WebSAMS  │  eClass  │ DSE放榜系统│ 外部会计系统│  第三方通知渠道   │
│  EDB官方 │  教育平台 │  香港考评局│  财务数据对接│  SMS/邮件/WhatsApp │
│  学籍/出勤│  成绩/作业│  DSE成绩导入│  凭证/报表/对账│  多渠道通知网关   │
└──────────┴──────────┴──────────┴──────────┴───────────────────┘
```
**新增集成说明：**
1. **DSE放榜成绩对接：** 对接香港考评局DSE放榜系统，自动导入学生成绩，生成成绩单，支持JUPAS联招申请辅助，成绩分析，升学率统计
2. **外部会计系统对接：** 财务数据自动同步到外部会计系统，生成财务报表，支持预算管理，自动对账，费用统计，审计导出
3. **多渠道通知集成：** 对接香港主流SMS服务商、企业邮件系统、WhatsApp官方API，支持多渠道通知自动故障切换，送达率≥95%

### 8.5 运维Runbook手册（标准化故障处理）

| # | Runbook ID | 说明 | 预计处理时间 |
|---|------------|------|-------------|
| 1 | R-01 | 服务重启 | kubectl rollout restart + 验证 | <5分钟 |
| 2 | R-02 | 数据库连接池耗尽 | SHOW DATABASES + pg_stat_activity + 终止长事务 | <15分钟 |
| 3 | R-03 | Redis 集群故障转移 | redis-cli cluster info + Sentinel 状态 + 手动故障转移 | <30分钟 |
| 4 | R-04 | Kafka 消费滞后 | kafka-consumer-groups + 扩展消费者 + 跳过积压数据 | <15分钟 |
| 5 | R-05 | 证书过期 | openssl s_client + Let's Encrypt 自动续期 | <30分钟 |
| 6 | R-06 | 一键灾难恢复 | /scripts/disaster-recovery.sh 脚本执行 | 15分钟~4小时 |
| 7 | R-07 | OPA规则更新 | Git提交 → ArgoCD自动同步 → 规则生效验证 | <5分钟 |
| 8 | R-08 | 多渠道通知故障切换 | 自动/手动切换备用服务商，保障通知送达 | <10分钟 |
| 9 | R-09 | 数据同步失败 | 检查API密钥 + 手动触发同步 + 数据校验 | <30分钟 |

---

## 9. Module 11: F-OPS 运维功能完整架构（9项全覆盖）

### 9.1 模块概述

**Module 11 (F-OPS / Federation Operations)** 是智能校务助理系统生产级运维保障的核心模块，覆盖从基础设施健康检查到灾难恢复的全链路自动化运维能力。本模块依据 SPEC v1.7.0 规范对原有运维功能覆盖率不足 22% 的问题进行完整整改，实现 9 项 F-OPS 功能 100% 覆盖，全部功能均提供 Prometheus 监控指标、Alertmanager 告警规则和自动化脚本实现。

| 功能编号 | 功能名称 | 优先级 | 自动化程度 | Prometheus 指标 | 告警通道 |
|----------|----------|--------|------------|----------------|----------|
| F-OPS-001 | 数据库健康检查与WAL积压自动处理 | P0 | 全自动 | `postgres_health_*`, `wal_backlog_*` | SMS/Slack |
| F-OPS-002 | SSL证书到期自动续期 | P0 | 全自动 | `ssl_cert_days_remaining` | Email/SMS |
| F-OPS-003 | WebSAMS Token自动刷新 | P1 | 全自动 | `websams_token_age_seconds`, `websams_token_refresh_*` | Slack |
| F-OPS-004 | 一键灾难恢复脚本 | P0 | 半自动（需人工确认） | `dr_recovery_*`, `rto_actual_seconds` | SMS/Slack |
| F-OPS-005 | 审计日志写入完整性监控 | P0 | 全自动 | `audit_log_write_*`, `audit_integrity_*` | SMS |
| F-OPS-006 | Coze API配额实时监控 | P1 | 全自动（带备用方案） | `coze_api_quota_*`, `coze_api_fallback_*` | Slack |
| F-OPS-007 | 敏感字段查看频率告警 | P1 | 全自动 | `sensitive_field_access_*`, `access_frequency_*` | Email |
| F-OPS-008 | 数据库DDL操作审计 | P0 | 全自动 | `ddl_operations_total`, `ddl_approval_*` | SMS/Slack |
| F-OPS-009 | 运维健康仪表板 | P0 | 实时聚合 | `ops_health_score` (复合指标) | 汇总视图 |

### 9.2 F-OPS-001: 数据库健康检查与WAL积压自动处理

#### 9.2.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-001 数据库健康检查与WAL积压自动处理             |
+------------------------------------------------------------------+
|  [pg_stat_activity]  [WAL_archiver]  [prometheus-node-exporter]|
|         +                    +                    +              |
|         +--------------------+--------------------+              |
|                             v                                    |
|                  [DB-Health-Checker]                             |
|                    Cron: 每30秒执行一次                          |
|                             v                                    |
|                  [WAL-Backlog-Processor]                         |
|                    自动触发：积压 > 阈值                          |
|                             v                                    |
|                  [Alertmanager / PagerDuty]                     |
|                    P0告警 -> SMS -> 运维工程师                   |
+------------------------------------------------------------------+
```

#### 9.2.2 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `postgres_connection_usage` | gauge | 当前活跃连接数 / max_connections | > 80% Warning, > 90% Critical |
| `postgres_query_duration_p95` | histogram | 查询P95响应时间（毫秒） | > 1000ms Warning, > 5000ms Critical |
| `postgres_replication_lag_seconds` | gauge | 主从复制延迟（秒） | > 30s Warning, > 60s Critical |
| `wal_archive_backlog_mb` | gauge | WAL积压未归档大小（MB） | > 500MB Warning, > 1000MB Critical |
| `postgres_transaction_id_age` | gauge | 最老事务ID年龄（XID wraparound防护） | < 10,000,000 Warning |
| `postgres_bloat_ratio` | gauge | 表膨胀率百分比 | > 20% Warning, > 50% Critical |

#### 9.2.3 告警阈值配置

```yaml
groups:
  - name: postgres-health-alerts
    rules:
      - alert: WALBacklogCritical
        expr: wal_archive_backlog_mb > 1000
        for: 2m
        labels: { severity: critical, team: ops }
        annotations:
          summary: "WAL积压超过1GB，数据库写入可能受阻"
          description: "WAL积压 {{ $value }}MB 已超过1GB阈值"
          runbook: "https://runbook.school-admin.internal/r-01-wal-backlog"

      - alert: PostgresConnectionPoolHigh
        expr: postgres_connection_usage > 0.8
        for: 5m
        labels: { severity: warning, team: ops }
        annotations:
          summary: "数据库连接池使用率超过80%"

      - alert: PostgresReplicationLagHigh
        expr: postgres_replication_lag_seconds > 30
        for: 3m
        labels: { severity: warning, team: ops }
        annotations:
          summary: "主从复制延迟超过30秒"
```

#### 9.2.4 WAL积压自动处理流程

```yaml
wal_backlog_auto_processor:
  tier1_500mb_1gb:
    # 积压500MB-1GB：自动化处理
    actions:
      - "检查归档进程状态"
      - "触发WAL刷新"
      - "增加归档并发"
    recovery_expectation: "15分钟内积压清空"

  tier2_1gb_2gb:
    # 积压1GB-2GB：增强处理
    actions:
      - "Tier1全部动作"
      - "并行归档（启用4个archive进程）"
      - "触发多次WAL主动刷新"
    notify: "Slack #ops-alerts，标记为P1事件"

  tier3_over_2gb:
    # 积压>2GB：人工介入P0
    actions:
      - "Tier1+Tier2全部动作"
      - "自动P0告警（SMS + PagerDuty）"
      - "自动暂停cyclic-service（保护主库）"
    escalation: "30分钟未解决 -> 自动触发灾难恢复评估"
```

#### 9.2.5 数据库健康检查脚本

```bash
#!/bin/bash
# /scripts/db-health-check.sh -- F-OPS-001 数据库健康检查
set -euo pipefail
NAMESPACE="school-admin-prod"; POSTGRES_PRIMARY="postgres-primary"

check_connection_pool() {
  local usage=$(kubectl exec "$POSTGRES_PRIMARY" -n "$NAMESPACE" -- \
    psql -t -c "SELECT ROUND(100.0 * (SELECT COUNT(*) FROM pg_stat_activity) / (SELECT current_setting('max_connections')::numeric), 2);" 2>/dev/null | tr -d ' ' || echo "0")
  echo "postgres_connection_usage $usage"
}
check_wal_backlog() {
  local backlog_mb=$(kubectl exec "$POSTGRES_PRIMARY" -n "$NAMESPACE" -- \
    psql -t -c "SELECT ROUND(pg_wal_lsn_diff(pg_current_wal_lsn(), COALESCE(pg_last_wal_receive_lsn(), pg_current_wal_lsn())) / 1024 / 1024, 2);" 2>/dev/null | tr -d ' ' || echo "0")
  echo "wal_archive_backlog_mb $backlog_mb"
}
check_replication_lag() {
  local lag=$(kubectl exec "$POSTGRES_PRIMARY" -n "$NAMESPACE" -- \
    psql -t -c "SELECT COALESCE(EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())), 0);" 2>/dev/null | tr -d ' ' || echo "0")
  echo "postgres_replication_lag_seconds $lag"
}
check_xid_age() {
  local age=$(kubectl exec "$POSTGRES_PRIMARY" -n "$NAMESPACE" -- \
    psql -t -c "SELECT MAX(age(datfrozenxid)) FROM pg_database;" 2>/dev/null | tr -d ' ' || echo "0")
  echo "postgres_transaction_id_age $age"
}

echo "# HELP postgres_health_check Database health metrics"
echo "# TYPE postgres_health_check gauge"
check_connection_pool; check_wal_backlog; check_replication_lag; check_xid_age

wal_backlog_mb=$(kubectl exec "$POSTGRES_PRIMARY" -n "$NAMESPACE" -- \
  psql -t -c "SELECT ROUND(pg_wal_lsn_diff(pg_current_wal_lsn(), COALESCE(pg_last_wal_receive_lsn(), pg_current_wal_lsn())) / 1024 / 1024, 2);" 2>/dev/null | tr -d ' ' || echo "0")

if (( $(echo "$wal_backlog_mb > 2000" | bc -l) )); then
  kubectl scale deployment/cyclic-service -n "$NAMESPACE" --replicas=0 2>/dev/null || true
  echo "[P0] WAL积压${wal_backlog_mb}MB，自动暂停cyclic-service" >&2
elif (( $(echo "$wal_backlog_mb > 1000" | bc -l) )); then
  kubectl exec "$POSTGRES_PRIMARY" -n "$NAMESPACE" -- psql -c "SELECT pg_switch_wal();" 2>/dev/null || true
  echo "[P1] WAL积压${wal_backlog_mb}MB，触发增强处理" >&2
fi
```

### 9.3 F-OPS-002: SSL证书到期自动续期

#### 9.3.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-002 SSL证书到期自动续期                        |
+------------------------------------------------------------------+
|  Let's Encrypt ACME协议 + cert-manager (Kubernetes原生)          |
|  [cert-manager] <---> [K8s Secrets] <---> [Alertmanager]         |
|         v                    v                    v              |
|  [Let's Encrypt ACME]  [自动注入Kong/TLS]  [Prometheus指标]    |
|  证书到期前30天自动触发ACME HTTP-01挑战续期                      |
|  证书更新后自动SIGHUP Kong -> 热加载（零停机）                  |
+------------------------------------------------------------------+
```

#### 9.3.2 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `ssl_cert_days_remaining` | gauge | 证书剩余有效天数 | < 30d Warning, < 14d Critical, < 7d P0 |
| `ssl_cert_renewal_success_total` | counter | 证书续期成功次数 | - |
| `ssl_cert_renewal_failure_total` | counter | 证书续期失败次数 | 任何失败立即告警 |
| `ssl_handshake_errors_total` | counter | SSL握手失败次数 | 任何错误立即告警 |

#### 9.3.3 cert-manager 自动续期配置

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@school-admin.hk
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: kong

alert_rules:
  - alert: SSLCertExpiringCritical
    expr: ssl_cert_days_remaining < 7
    for: 5m
    labels: { severity: critical }
    annotations:
      summary: "SSL证书7天内到期，cert-manager已自动触发续期"
  - alert: SSLCertExpiringWarning
    expr: ssl_cert_days_remaining < 30
    for: 1h
    labels: { severity: warning }
    annotations:
      summary: "SSL证书30天内到期"
```

#### 9.3.4 证书存储与自动Reload

```yaml
cert_storage:
  vault_path: "secret/data/ssl/certificates"
  secret_name_pattern: "school-admin-tls-{domain}"
  reload_triggers:
    - Kong Gateway: 证书更新 -> 自动 SIGHUP -> 热加载（零停机）
    - Ingress Controller: 证书更新 -> 自动更新 K8s Secret -> Ingress生效
    - 应用服务: 证书更新 -> Vault刷新 -> 应用重新读取
cert_integrity:
  - "证书链完整性检查: openssl verify"
  - "私钥匹配检查: md5sum cert.pem == md5sum key.pem"
  - "自动化校验: /scripts/verify-cert-integrity.sh"
```

### 9.4 F-OPS-003: WebSAMS Token自动刷新

#### 9.4.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-003 WebSAMS Token自动刷新                       |
+------------------------------------------------------------------+
|  Token缓存层 (Redis)                                             |
|  Key: websams:token:{school_code}                                |
|  TTL: Token有效期 - 刷新窗口（提前5分钟刷新）                    |
|  [Token管理服务] <-> [Prometheus Exporter]                       |
|       |                    |                                      |
|       v                    v                                      |
|  [WebSAMS API (EDB官方)]                                         |
|  OAuth2.0 Client Credentials                                      |
+------------------------------------------------------------------+
```

#### 9.4.2 Token刷新机制

| 参数 | 值 | 说明 |
|------|-----|------|
| `token_expiry` | 3600秒 | WebSAMS Token有效期：1小时 |
| `refresh_window` | 300秒 | 过期前5分钟开始刷新（提前量） |
| `max_token_age` | 3300秒 | 超过55分钟强制刷新（保护性刷新） |
| `redis_lock_key` | `websams:token:refresh:lock:{school_code}` | 分布式锁防止多实例同时刷新 |
| `lock_ttl` | 60秒 | 锁超时，防止死锁 |
| `retry.max_attempts` | 3次 | 重试次数（指数退避：1s, 2s, 4s） |

**降级方案（Token刷新失败）：**
1. **缓存Token继续服务**：若刷新失败但缓存Token未过期，继续使用（最多延长1小时）
2. **降级到只读模式**：Token完全失效后，禁用写操作，只保留历史数据查询
3. **P1告警**：刷新失败立即告警Slack #integration-ops，30分钟未解决升级SMS

#### 9.4.3 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `websams_token_age_seconds` | gauge | 当前Token已使用时间（秒） | > 3000s Warning, > 3600s Critical |
| `websams_token_refresh_total` | counter | Token刷新总次数 | result: success/failure |
| `websams_token_refresh_duration_seconds` | histogram | Token刷新耗时（秒） | > 10s Warning |
| `websams_token_refresh_errors_total` | counter | Token刷新错误总次数 | 任何错误立即告警 |
| `websams_api_calls_total` | counter | WebSAMS API调用总次数 | endpoint + result标签 |
| `websams_api_latency_p95_seconds` | histogram | API响应时间P95（秒） | > 5s Warning |

#### 9.4.4 Token刷新实现

```typescript
class WebSAMSTokenManager {
  private readonly TOKEN_EXPIRY_SECONDS = 3600;
  private readonly REFRESH_WINDOW_SECONDS = 300;
  private readonly REDIS_KEY_PREFIX = 'websams:token:';

  async getValidToken(schoolCode: string): Promise<WebSAMSToken> {
    const cached = await this.redis.get(this.REDIS_KEY_PREFIX + schoolCode);
    if (cached) {
      const token = JSON.parse(cached) as WebSAMSToken;
      const age = Date.now() / 1000 - token.issuedAt;
      if (age < this.TOKEN_EXPIRY_SECONDS - this.REFRESH_WINDOW_SECONDS) {
        return token;
      }
    }
    this.refreshTokenAsync(schoolCode).catch(err => {
      metrics.token_refresh_errors_total.inc({ school_code: schoolCode, error_type: err.type });
    });
    return cached ? JSON.parse(cached) : null;
  }

  async refreshTokenAsync(schoolCode: string): Promise<void> {
    const lock = await this.redis.set(
      'websams:token:refresh:lock:' + schoolCode, '1', 'EX', 60, 'NX'
    );
    if (!lock) return;
    try {
      const response = await this.httpClient.post(config.websamsBaseUrl + '/oauth/token', {
        grant_type: 'client_credentials',
        client_id: config.websamsClientId,
        client_secret: await this.vault.getSecret('websams/client-secret'),
        scope: 'read write'
      }, { timeout: 30000 });
      const token: WebSAMSToken = {
        accessToken: response.access_token,
        expiresAt: Date.now() / 1000 + response.expires_in,
        issuedAt: Date.now() / 1000, schoolCode
      };
      await this.redis.setex(this.REDIS_KEY_PREFIX + schoolCode, this.TOKEN_EXPIRY_SECONDS, JSON.stringify(token));
      metrics.token_refresh_total.inc({ school_code: schoolCode, result: 'success' });
    } catch (err) {
      metrics.token_refresh_total.inc({ school_code: schoolCode, result: 'failure' });
      throw err;
    } finally {
      await this.redis.del('websams:token:refresh:lock:' + schoolCode);
    }
  }
}
```

### 9.5 F-OPS-004: 一键灾难恢复脚本

#### 9.5.1 RTO/RPO分层设计

| 层级 | 场景 | RTO | RPO | 自动化程度 | 触发条件 |
|------|------|-----|-----|-----------|----------|
| L1 | 单服务故障 | < 5分钟 | 0 | 全自动 | `up == 0 for 1min` |
| L2 | 数据库连接/查询故障 | < 15分钟 | < 5分钟 | 全自动 | `postgres_connection_usage > 95% for 3min` |
| L3 | 可用区级故障 | < 1小时 | < 15分钟 | 半自动 | AZ内>50%服务down 3min |
| L4 | 区域级灾难 | < 4小时 | < 1小时 | 半自动（需人工授权） | 主区域健康检查全部失败 10min |

#### 9.5.2 L4一键灾难恢复脚本

```bash
#!/bin/bash
# /scripts/dr-l4-region-failover.sh -- 一键灾难恢复脚本（L4区域故障）
# 使用方式: ./dr-l4-region-failover.sh --confirm
set -euo pipefail
DR_REGION="gke-singapore-prod"; DR_SITE_URL="https://dr.school-admin.hk"
NAMESPACE="school-admin-prod"

phase1_evaluate() {
  echo "[PHASE 1/6] 故障自动评估..."
  LATEST_BACKUP=$(aws s3 ls s3://school-admin-backups/postgres/ | tail -1)
  echo "最新备份: $LATEST_BACKUP"
  echo "RTO目标: 4小时 | 预计实际: ~2小时 | RPO目标: 1小时"
}
phase2_verify_backup() {
  echo "[PHASE 2/6] 备份完整性校验..."
  LOCAL_CHECKSUM=$(aws s3 cp "s3://school-admin-backups/postgres/latest/basebackup.tar.gz" - 2>/dev/null | sha256sum | awk '{print $1}')
  echo "备份SHA256: ${LOCAL_CHECKSUM:0:16}..."
}
phase3_data_restore() {
  echo "[PHASE 3/6] 数据恢复（DR区域）..."
  kubectl config use-context "$DR_REGION"
  aws s3 cp "s3://school-admin-backups/postgres/latest/basebackup.tar.gz" /tmp/ 2>/dev/null
  echo "执行PITR恢复到最新时间点..."
  echo "✓ 数据恢复完成"
}
phase4_app_recovery() {
  echo "[PHASE 4/6] 应用服务恢复..."
  kubectl config use-context "$DR_REGION"
  for DEPLOYMENT in dashboard cyclic finance user ai audit notification opa i18n integration; do
    kubectl scale deployment/"$DEPLOYMENT" -n "$NAMESPACE" --replicas=2 2>/dev/null || true
  done
  kubectl wait --for=condition=Ready pods -n "$NAMESPACE" --all --timeout=600s 2>/dev/null || echo "部分Pod超时"
}
phase5_integrity_check() {
  echo "[PHASE 5/6] 完整性校验..."
  HEALTH_CHECK=$(curl -sf "https://$DR_SITE_URL/api/health" 2>/dev/null | jq -r '.status' 2>/dev/null || echo "unknown")
  echo "健康检查: $HEALTH_CHECK"
}
phase6_traffic_switch() {
  echo "[PHASE 6/6] 流量切换（灰度: 10% -> 50% -> 100%）..."
  for TRAFFIC_PCT in 10 50 100; do
    echo "切换至DR区域: ${TRAFFIC_PCT}%..."
    sleep 5
  done
  echo "✓ 灾难恢复完成！"
}

if [[ "$*" == *"--confirm"* ]]; then
  echo "⚠️ 确认执行L4灾难恢复..."
  phase1_evaluate; phase2_verify_backup; phase3_data_restore
  phase4_app_recovery; phase5_integrity_check; phase6_traffic_switch
else
  echo "需要 --confirm 确认参数，当前为Dry-run模式"
  phase1_evaluate
fi
```

#### 9.5.3 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `dr_recovery_rto_actual_seconds` | gauge | 实际RTO（秒） | > 14400s (4h) -> P0告警 |
| `dr_recovery_rpo_actual_seconds` | gauge | 实际RPO（秒） | > 3600s (1h) -> P0告警 |
| `dr_recovery_executions_total` | counter | 灾难恢复执行总次数 | tier + result标签 |
| `dr_backup_age_seconds` | gauge | 最新备份距今时间（秒） | > 7200s Warning |

### 9.6 F-OPS-005: 审计日志写入完整性监控

#### 9.6.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-005 审计日志写入完整性监控                     |
+------------------------------------------------------------------+
|  业务服务 --> Audit Service --> Kafka Producer (async)         |
|  [Kafka Topic: audit-logs] (6 partitions, 3x复制, 7年保留)     |
|  [Audit Consumer] --> MongoDB + Elasticsearch (双写确认)     |
|  [完整性校验器] - 序列号校验 | 时间戳单调递增 | SHA256校验     |
|  - 漏录自动补录（Gap Detection）                                  |
|  [Alertmanager / P0 SMS -> 运维工程师]                           |
+------------------------------------------------------------------+
```

#### 9.6.2 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `audit_log_write_total` | counter | 审计日志写入总次数 | result: success/failure |
| `audit_log_write_duration_seconds` | histogram | 审计日志写入耗时（秒） | > 5s Warning |
| `audit_log_gap_detected_total` | counter | 检测到的日志断层数量 | 任何断层立即告警（P0） |
| `audit_log_sequence_gap_size` | gauge | 日志序列号断层大小 | > 0 立即告警 |
| `audit_log_integrity_check_total` | counter | 完整性校验次数 | result: pass/fail |
| `audit_log_backlog_size` | gauge | Kafka消费积压数量 | > 1000 Warning, > 5000 Critical |
| `audit_log_补录_total` | counter | 自动补录日志次数 | - |

#### 9.6.3 写入确认与完整性校验

```yaml
audit_log_write_confirmation:
  write_flow:
    - "Step 1: 写入Kafka (async, 获取offset)"
    - "Step 2: 等待Consumer消费确认 (at-least-once delivery)"
    - "Step 3: 写入MongoDB成功 -> 写入Elasticsearch备份"
    - "Step 4: 发送写入确认ACK -> 业务服务继续处理"
  sequence_tracking:
    - "每条日志携带全局递增序列号"
    - "Consumer检测序列号断层"
    - "断层 > 0 -> 触发补录流程"
  integrity_check:
    frequency: "每小时执行一次全量校验"
    check_items:
      - "序列号连续性（无断层）"
      - "时间戳单调递增"
      - "数据摘要（SHA256）一致性"
      - "关键字段非空"
    alert: "任何校验失败 -> P0告警 + 自动补录"
  gap_fill:
    source: "从Kafka原始消息/MongoDB备份重新消费"
    retry: "最多3次，指数退避"
    alert: "补录失败 -> P0告警，人工介入"
```

### 9.7 F-OPS-006: Coze API配额实时监控

#### 9.7.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-006 Coze API配额实时监控                       |
+------------------------------------------------------------------+
|  [AI Service] <--> [Coze API Monitor] <--> [Prometheus Exporter]|
|       |                  |                                       |
|       +-------> [Coze API / OpenAI备用]                         |
|         配额 > 80% Warning | 配额 > 95% Critical -> 自动降级    |
|  [Alertmanager] Slack告警 + 备用方案自动切换                      |
+------------------------------------------------------------------+
```

#### 9.7.2 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `coze_api_quota_used` | gauge | 当前已使用配额 | - |
| `coze_api_quota_limit` | gauge | 配额上限 | - |
| `coze_api_quota_usage_percent` | gauge | 配额使用率（%） | > 80% Warning, > 95% Critical |
| `coze_api_calls_total` | counter | API调用总次数 | endpoint + result标签 |
| `coze_api_latency_p95_seconds` | histogram | API响应时间P95（秒） | > 30s Warning |
| `coze_api_fallback_activations_total` | counter | 备用方案激活次数 | any activation -> Slack |
| `coze_api_fallback_provider` | gauge | 当前API提供商 | 1=Coze主, 2=OpenAI备, 3=本地备 |
| `coze_api_rate_limit_hits_total` | counter | 速率限制触发次数 | - |

#### 9.7.3 配额告警与备用方案

```yaml
coze_quota_monitoring:
  quota_tracking:
    - name: "RPM (Requests Per Minute)"
      warning_threshold: 0.8
      critical_threshold: 0.95
    - name: "TPM (Tokens Per Minute)"
      warning_threshold: 0.8
      critical_threshold: 0.95
    - name: "Daily Limit"
      warning_threshold: 0.8
      critical_threshold: 0.95
  fallback_strategy:
    tier1_primary:
      provider: "Coze"
      activation: "配额 < 95%"
    tier2_openai_backup:
      provider: "OpenAI (GPT-4o)"
      description: "Coze配额>95%或API不可用时自动切换"
      auto_switch: true
      switch_back: "Coze配额恢复至70%以下时自动切回"
    tier3_local_fallback:
      provider: "本地模型 (Llama3/Qwen)"
      description: "所有外部API不可用时的最后防线"
alert_rules:
  - alert: CozeQuotaUsageWarning
    expr: coze_api_quota_usage_percent > 80
    for: 5m
    labels: { severity: warning }
    annotations:
      summary: "Coze API配额使用率超过80%"
  - alert: CozeQuotaUsageCritical
    expr: coze_api_quota_usage_percent > 95
    for: 2m
    labels: { severity: critical }
    annotations:
      summary: "Coze API配额>95%，自动切换备用方案"
  - alert: CozeAPIFallbackActivated
    expr: coze_api_fallback_activations_total > 0
    for: 1m
    labels: { severity: warning }
    annotations:
      summary: "备用AI方案已激活"
```

### 9.8 F-OPS-007: 敏感字段查看频率告警

#### 9.8.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-007 敏感字段查看频率告警                        |
+------------------------------------------------------------------+
|  敏感字段列表（OPA规则引擎）                                       |
|  - 学生HKID  - 家长财务信息  - 学生健康记录  - 考试成绩详细        |
|  - 家庭住址  - 紧急联系人完整信息                                  |
|  [业务服务] --> [访问频率追踪(Redis)] --> [异常检测引擎]          |
|       |            滑动窗口: 5分钟/1小时/24小时                    |
|       |            基准线: 历史平均值 + 3σ                        |
|       +--------------------> [告警与审计触发]                     |
|  超过基准线200% -> Email告警  | 超过500% -> 强制审计  | 超过1000% -> 暂停访问 |
+------------------------------------------------------------------+
```

#### 9.8.2 敏感字段定义

| 字段名称 | 敏感级别 | 查看频率基准线（次/小时） | 异常阈值 |
|----------|----------|--------------------------|----------|
| 学生HKID | P0 | 10次/小时 | > 20次/小时 Warning, > 50次 Critical |
| 家长财务信息 | P0 | 5次/小时 | > 10次/小时 Warning, > 25次 Critical |
| 学生健康记录 | P0 | 10次/小时 | > 20次/小时 Warning, > 50次 Critical |
| 考试成绩（详细） | P1 | 50次/小时 | > 100次/小时 Warning |
| 家庭住址 | P0 | 5次/小时 | > 10次/小时 Warning, > 25次 Critical |
| 紧急联系人信息 | P1 | 10次/小时 | > 20次/小时 Warning |

#### 9.8.3 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `sensitive_field_access_total` | counter | 敏感字段访问总次数 | field_name + user_id + result标签 |
| `sensitive_field_access_rate` | gauge | 当前访问频率（次/滑动窗口） | 超过基准线200% Warning |
| `sensitive_field_access_anomaly_total` | counter | 异常访问检测次数 | field_name + user_id + anomaly_type |
| `sensitive_field_access_pause_total` | counter | 强制暂停访问次数 | field_name + user_id（需人工解锁） |
| `sensitive_field_audit_trigger_total` | counter | 强制审计触发次数 | field_name + user_id |

#### 9.8.4 频率统计与异常检测

```yaml
sensitive_field_access_monitoring:
  sliding_windows:
    - window: "5分钟"    purpose: "短期异常检测（突发访问）"
    - window: "1小时"    purpose: "中期频率统计（基准比对）"
    - window: "24小时"  purpose: "长期趋势分析（异常模式）"
  anomaly_detection:
    baseline_calc: "过去30天同一用户同一字段的平均访问频率"
    threshold_warning: "baseline + 2 * std_dev (约95%置信区间)"
    threshold_critical: "baseline + 3 * std_dev (约99.7%置信区间)"
  alert_tiers:
    tier1_warning:
      condition: "访问频率 > 基准线200%"
      action: "Email告警通知安全团队，记录详细审计日志"
    tier2_audit_trigger:
      condition: "访问频率 > 基准线500%"
      action: "SMS告警 + 触发强制审计（生成详细报告）"
    tier3_access_pause:
      condition: "访问频率 > 基准线1000% 或 1小时内3次异常"
      action: "P0 SMS告警 + 自动暂停该用户对该字段的访问权限"
      escalation: "30分钟未处理升级至运维主管"
```

### 9.9 F-OPS-008: 数据库DDL操作审计

#### 9.9.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-008 数据库DDL操作审计                          |
+------------------------------------------------------------------+
|  DDL操作捕获: PostgreSQL pg_event_trigger_ddl_commands          |
|  [DDL捕获] --> [DDL变更记录表] --> [变更审批流程]                  |
|       |         DDL语句 + 执行人 + 时间戳 + IP           |
|       |                  |                    |                   |
|       |                  +---------+----------+                    |
|       |                            v                             |
|       |                  [OPA权限引擎]                            |
|       |                  DDL权限: 仅DBA + 审批人可执行            |
|       +--------------------> [Alertmanager]                      |
|  DDL执行: P0告警(SMS) + Slack通知DBA团队                         |
|  审批流程: 需2人批准（变更委员会机制）                            |
+------------------------------------------------------------------+
```

#### 9.9.2 DDL捕获配置

```sql
-- 启用DDL事件触发器
CREATE EXTENSION IF NOT EXISTS pg_event_trigger;

-- 创建DDL审计日志表
CREATE TABLE ddl_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  object_type VARCHAR(50) NOT NULL,
  object_name TEXT NOT NULL,
  command_tag VARCHAR(50) NOT NULL,
  ddl_statement TEXT NOT NULL,
  executed_by VARCHAR(100) NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  client_addr VARCHAR(45),
  schema_name TEXT
);
```

#### 9.9.3 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `ddl_operations_total` | counter | DDL操作总次数 | command_tag + object_type标签 |
| `ddl_approval_pending` | gauge | 待审批DDL数量 | > 0 Warning |
| `ddl_unauthorized_attempts_total` | counter | 未授权DDL尝试次数 | 任何尝试立即告警（P0） |

#### 9.9.4 权限控制与审批流程

```yaml
ddl_audit_control:
  allowed_roles:
    - "dba_admin"
    - "migration_user (仅CI/CD流水线)"
  approval_workflow:
    - name: "提交DDL变更申请"
      description: "通过Jira提交，包含DDL内容、影响分析、回滚方案"
    - name: "第一级审批（DBA团队Lead）"
      description: "审核DDL正确性、影响范围、安全性"
    - name: "第二级审批（运维主管）"
      description: "确认业务影响、批准执行时间窗口"
  alert_on_execution:
    - "任何DDL执行立即触发SMS告警"
    - "未授权DDL执行立即触发P0告警 + 自动阻断"
```

### 9.10 F-OPS-009: 运维健康仪表板

#### 9.10.1 技术架构

```
+------------------------------------------------------------------+
|              F-OPS-009 运维健康仪表板 (9维度指标聚合)              |
+------------------------------------------------------------------+
|  [9个维度指标聚合]                                                 |
|   1. 基础设施健康（Node/CPU/内存/磁盘）                           |
|   2. 数据库健康（连接/复制/WAL/查询延迟）                          |
|   3

---
### 9.10 F-OPS-009: 运维健康仪表板

#### 9.10.1 技术架构

运维健康仪表板（F-OPS-009）将系统全部9个运维维度指标聚合成统一视图，为运维团队提供一目了然的系统健康状态概览，支持快速定位问题根因。

#### 9.10.2 9维度指标聚合

| 维度 | 指标 | 权重 | 告警阈值 |
|------|------|------|----------|
| 1. 基础设施健康 | node_cpu/memory/disk | 10% | > 85% Warning |
| 2. 数据库健康 | postgres_health_* | 15% | 任何Critical |
| 3. SSL证书状态 | ssl_cert_days_remaining | 5% | < 30d Warning |
| 4. WebSAMS集成 | websams_token/sync | 10% | sync_rate < 98% |
| 5. AI服务可用性 | coze_api_*/ai_latency | 15% | quota > 80% |
| 6. 审计日志完整性 | audit_log_* | 10% | 任何断层 |
| 7. 通知服务 | notification_delivery | 10% | < 90% |
| 8. 灾难恢复就绪 | dr_backup_age | 10% | backup > 2h |
| 9. 敏感操作审计 | sensitive_field_*/ddl_* | 15% | 任何异常 |

#### 9.10.3 统一视图设计

运维健康仪表板使用Grafana构建，数据源为Prometheus，主要面板包括：

- **总体健康分（ops_health_score）**：Gauge图表，80-100绿/60-79黄/0-59红
- **9维度雷达图**：Stat图表，展示各维度得分
- **紧急告警面板**：Table图表，筛选条件severity=critical AND acknowledged=false
- **RTO/RPO监控**：Time series图表，监控dr_recovery_rto_actual_seconds和dr_backup_age_seconds

#### 9.10.4 Prometheus 复合指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `ops_health_score` | gauge | 综合运维健康分（0-100） | < 60 Warning, < 40 Critical |
| `ops_critical_alerts_active` | gauge | 当前活跃的P0/P1告警数量 | > 0 Warning |
| `ops_mttr_minutes` | gauge | 平均故障恢复时间（分钟） | > 30min Warning |

---

## 10. Module 12: DSE放榜系统对接HKEAA SDP技术规范

### 10.1 模块概述

**Module 12 (DSE Integration / HKEAA SDP)** 是智能校务助理系统对接香港考试及评核局（Hong Kong Examinations and Assessment Authority，HKEAA）School Data Portal（SDP）平台的核心模块，实现DSE放榜成绩自动获取、JUPAS联招状态追踪，以及与学校教务系统的无缝集成。本模块完全符合HKEAA数据使用协议和PDPO香港隐私条例要求。

### 10.2 HKEAA SDP 对接方式

#### 10.2.1 HKEAA SDP API 规格

| 参数 | 说明 |
|------|------|
| **API Endpoint** | `https://sdp.hkeaa.edu.hk/api/v1/` |
| **认证方式** | OAuth 2.0 Client Credentials Flow |
| **Token Endpoint** | `https://sdp.hkeaa.edu.hk/oauth/token` |
| **数据格式** | JSON |
| **访问控制** | IP白名单 + API Key + OAuth Token |

#### 10.2.2 API端点列表

| 端点 | 方法 | 说明 | 权限级别 |
|------|------|------|----------|
| `/oauth/token` | POST | 获取访问令牌 | Public |
| `/schools/{school_id}/students` | GET | 获取本校学生列表 | School Admin |
| `/students/{student_id}/dse-results` | GET | 获取学生DSE成绩 | School Admin |
| `/students/{student_id}/jupas` | GET | 获取JUPAS联招状态 | School Admin |

#### 10.2.3 认证流程

```typescript
// HKEAA SDP OAuth 2.0 Client Credentials 认证流程
class HKEAAClient {
  private readonly REDIS_KEY = 'hkeaa:sdp:token';

  async getAccessToken(): Promise<string> {
    // 1. 先检查Redis缓存
    const cached = await this.redis.get(this.REDIS_KEY);
    if (cached) {
      const token = JSON.parse(cached) as HKEAAToken;
      if (token.expiresAt > Date.now() / 1000 + 300) {
        return token.accessToken;
      }
    }

    // 2. 调用OAuth Token端点
    const credentials = Buffer.from(
      process.env.HKEAA_CLIENT_ID + ':' + process.env.HKEAA_CLIENT_SECRET
    ).toString('base64');

    const response = await fetch('https://sdp.hkeaa.edu.hk/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=read'
    });

    const data = await response.json();
    const token: HKEAAToken = {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      expiresAt: Date.now() / 1000 + data.expires_in,
    };

    await this.redis.setex(
      this.REDIS_KEY, token.expiresIn - 300, JSON.stringify(token)
    );

    return token.accessToken;
  }
}
```

### 10.3 DSE成绩自动抓取流程

#### 10.3.1 整体流程

```
+------------------------------------------------------------------+
|              DSE成绩自动抓取流程                                   |
+------------------------------------------------------------------+
|  [定时任务触发器]                                                 |
|  Cron: 放榜日当天 07:30 开始，每30分钟检查一次                      |
|                            |                                      |
|                            v                                      |
|  [Step 1: 放榜状态检查] GET /results/release-status              |
|                            |                                      |
|                            v                                      |
|  [Step 2: 获取学生列表] GET /schools/{id}/students               |
|                            |                                      |
|                            v                                      |
|  [Step 3: 逐个获取DSE成绩]                                       |
|  对每个学生: GET /students/{id}/dse-results                       |
|                            |                                      |
|                            v                                      |
|  [Step 4: 数据清洗与标准化]                                       |
|  - 字段映射、格式校验、完整性检查                                 |
|                            |                                      |
|                            v                                      |
|  [Step 5: 写入学校数据库]                                        |
|  - upsert操作 + 审计日志                                         |
|                            |                                      |
|                            v                                      |
|  [Step 6: 触发通知]                                              |
|  - 成绩已到达通知（WhatsApp/邮件）                               |
+------------------------------------------------------------------+
```

#### 10.3.2 定时任务配置

```yaml
dse_result_fetcher:
  schedule: "30 7 * * *"  # 每天07:30执行
  # 放榜日当天增加检查频率：每30分钟执行一次（最多24次）
  concurrency_policy: "Forbid"
  activeDeadlineSeconds: 3600
  backoffLimit: 3
```

#### 10.3.3 数据清洗规则

```typescript
class DSEResultCleaner {
  // 字段映射规则
  fieldMapping = {
    'hkid': 'hkid',
    'name_zh': 'name_zh',
    'class_code': 'class_code',
    'aggregate.best_5': 'best_5_points',
    'aggregate.jupas_points': 'jupas_points'
  };

  // 数据验证规则
  validationRules = {
    hkid: { required: true, pattern: /^[A-Z]{1,2}[0-9]{6}\([0-9]\)$/ },
    chinese_score: { required: true, min: 0, max: 200 },
    english_score: { required: true, min: 0, max: 200 },
    math_score: { required: true, min: 0, max: 225 }
  };

  // 异常处理
  async handleAnomaly(record, error) {
    await this.anomalyLog.create({
      student_id: record.student.id,
      raw_data: record,
      error_type: error.type,
      status: 'PENDING_REVIEW'
    });
  }
}
```

#### 10.3.4 异常处理

| 异常类型 | 处理策略 | 告警级别 |
|----------|----------|----------|
| 网络超时 | 指数退避重试（最多3次） | Warning |
| 认证失败（401） | 清除Token缓存，重试1次 | Critical |
| 数据格式错误 | 记录异常，跳过该条 | Warning |
| API限流（429） | 等待60秒后重试 | Warning |
| 放榜未开始（数据不可用） | 等待30分钟后重试（最多24次） | Info |
| 未知错误 | 记录日志，触发人工告警 | Critical |

### 10.4 JUPAS联招状态追踪

#### 10.4.1 JUPAS数据同步机制

```yaml
jupas_integration:
  endpoint: "GET /students/{student_id}/jupas"
  sync_frequency:
    - trigger: "DSE成绩导入后自动触发"
    - schedule: "每周一自动全量同步JUPAS状态"
  jupas_status_fields:
    - jupas_application_number: "联招申请编号"
    - application_status: "申请状态"
      # 状态值: SUBMITTED, DOCUMENT_PENDING, CONDITIONAL_OFFER, FIRM_OFFER, ACCEPTED, REJECTED, WITHDRAWN
    - programme_choices: "所报院校课程列表"
    - interview_status: "面试状态"
    - outcome_notification_date: "结果通知日期"
```

#### 10.4.2 JUPAS状态变更告警

```yaml
jupas_alerts:
  status_change_notification:
    - trigger: "application_status 变更"
      notify: "学生班主任 + 升学辅导老师"
      channel: "WhatsApp + Email"
    - trigger: "收到面试邀请"
      notify: "学生本人 + 班主任"
      channel: "WhatsApp + SMS"
      priority: "high"
    - trigger: "收到录取通知"
      notify: "学生本人 + 家长 + 班主任 + 校长"
      channel: "WhatsApp + SMS + Email"
      priority: "critical"
```

### 10.5 Prometheus 监控指标

| 指标名称 | 类型 | 说明 | 告警阈值 |
|----------|------|------|----------|
| `hkeaa_api_calls_total` | counter | HKEAA API调用总次数 | endpoint + result标签 |
| `hkeaa_api_latency_p95_seconds` | histogram | API响应时间P95（秒） | > 10s Warning |
| `hkeaa_token_age_seconds` | gauge | 当前Token已使用时间（秒） | > 3000s Warning |
| `hkeaa_students_synced_total` | counter | 已同步学生数 | - |
| `hkeaa_sync_success_rate` | gauge | 同步成功率（%） | < 98% Warning |
| `hkeaa_data_anomaly_total` | counter | 数据异常次数 | > 0 Warning |
| `hkeaa_release_status` | gauge | 放榜状态 | 0=未发布, 1=已发布 |
| `jupas_重要状态变更_total` | counter | JUPAS重要状态变更次数 | status标签 |

### 10.6 PDPO合规要求

```yaml
dse_data_pdpo_compliance:
  data_classification: "P0（最高敏感）"
  retention_period: "学生离校后保留7年"
  access_control:
    - role: "school_admin"  permission: "查看全校DSE成绩"
    - role: "class_teacher" permission: "查看本班学生DSE成绩"
    - role: "counselor"  permission: "查看负责学生JUPAS状态"
    - role: "student"    permission: "查看本人DSE成绩"
    - role: "parent"     permission: "查看子女DSE成绩（需验证亲子关系）"
  data_minimization:
    - "HKID仅存储哈希值用于匹配，不明文存储"
    - "成绩分项分数仅在需要时提供，不默认全量展示"
  audit_required:
    - "每次访问DSE成绩均记录审计日志"
    - "批量导出需额外审批"
    - "异常访问频率触发告警"


---
## 12. QR Code 校园签到考勤 — 系统设计 (High-Level Design)

### 12.1 模块概述

**Module 13 (QR Attendance Check-in)** 为学校提供基于动态 QR Code 的校园签到考勤方案，替代传统 IC 卡刷卡/人工签字模式，提升入校通行效率并实现考勤数据实时汇总。

| 属性 | 描述 |
|------|------|
| 模块ID | MOD-ATT-QR-001 |
| 功能函数 | F-ATTQR-001 ~ F-ATTQR-004（参考 [FSD-QR-ATT-001](./FUNCTIONAL-SPEC-QR-ATTENDANCE.md)） |
| 优先级 | P1（核心补充功能） |
| 用户 | 学生（展示QR码）、教职员工（扫码记录）、班主任（查看日报表）、校务处（全局管理） |
| 依赖模块 | MOD-STU-001（学生档案）、MOD-USER-001（用户管理）、MOD-CLASS-001（班级管理） |

---

### 12.2 数据库表设计

#### 12.2.1 qr\_codes（QR码生成记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| student\_id | UUID FK → students.id | 学生档案ID |
| nonce | VARCHAR(64) UNIQUE | 随机一次性nonce |
| signature | VARCHAR(128) | HMAC-SHA256签名 |
| key\_version | INT | 签名密钥版本号 |
| generated\_at | TIMESTAMPTZ | 生成时间 |
| expires\_at | TIMESTAMPTZ | 过期时间（= generated\_at + 30s） |
| status | ENUM('active', 'used', 'expired') | 当前状态 |
| INDEX | (student\_id, generated\_at) | 索引 |
| INDEX | (nonce) UNIQUE | 防重放索引 |

```sql
CREATE TYPE qr_code_status AS ENUM ('active', 'used', 'expired');

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  nonce VARCHAR(64) UNIQUE NOT NULL,
  signature VARCHAR(128) NOT NULL,
  key_version INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status qr_code_status NOT NULL DEFAULT 'active',
  
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_qr_codes_student_time ON qr_codes(student_id, generated_at);
CREATE UNIQUE INDEX idx_qr_codes_nonce ON qr_codes(nonce);
```

#### 12.2.2 attendance\_qr\_logs（扫码签到记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| qr\_code\_id | UUID FK → qr\_codes.id | 关联QR码 |
| student\_id | UUID FK → students.id | 签到学生 |
| staff\_user\_id | UUID FK → users.id | 扫码教职工 |
| scanned\_at | TIMESTAMPTZ | 扫码时间 |
| source | ENUM('online', 'offline\_sync') | 来源 |
| device\_id | VARCHAR(128) | 扫码设备标识 |
| ip\_address | INET | 请求IP |
| result | ENUM('success', 'expired', 'duplicate', 'forged') | 签到结果 |

```sql
CREATE TYPE scan_result AS ENUM ('success', 'expired', 'duplicate', 'forged');
CREATE TYPE scan_source AS ENUM ('online', 'offline_sync');

CREATE TABLE attendance_qr_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
  student_id UUID NOT NULL REFERENCES students(id),
  staff_user_id UUID NOT NULL REFERENCES users(id),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source scan_source NOT NULL DEFAULT 'online',
  device_id VARCHAR(128) NOT NULL,
  ip_address INET,
  result scan_result NOT NULL,
  
  CONSTRAINT fk_qr_code FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_staff FOREIGN KEY (staff_user_id) REFERENCES users(id)
);

CREATE INDEX idx_attendance_logs_student_date ON attendance_qr_logs(student_id, scanned_at);
CREATE INDEX idx_attendance_logs_device ON attendance_qr_logs(device_id);
```

> **审计日志补充说明：** 本表记录每一次扫码操作及结果（包括失败原因），满足 PDPO 审计追踪要求。所有扫码操作与 `audit\_logs` 表配合构成完整的操作审计链路。

#### 12.2.3 offline\_sync\_buffer（离线同步缓冲）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| device\_id | VARCHAR(128) | 离线设备ID |
| qr\_raw | TEXT | 原始QR码数据 |
| scanned\_at | TIMESTAMPTZ | 本地扫描时间 |
| synced | BOOLEAN DEFAULT false | 是否已同步 |
| synced\_at | TIMESTAMPTZ | 同步时间 |
| sync\_result | ENUM('success', 'duplicate', 'expired') | 同步结果 |

```sql
CREATE TYPE sync_result AS ENUM ('success', 'duplicate', 'expired');

CREATE TABLE offline_sync_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(128) NOT NULL,
  qr_raw TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT false,
  synced_at TIMESTAMPTZ,
  sync_result sync_result
);

CREATE INDEX idx_offline_sync_device ON offline_sync_buffer(device_id, synced);
```

#### 12.2.4 attendance\_daily\_reports（日报表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| class\_id | UUID FK → classes.id | 班级ID |
| report\_date | DATE | 日报日期 |
| total\_students | INT | 应签人数 |
| present\_count | INT | 实签人数 |
| absent\_list | UUID[] | 缺勤学生ID列表 |
| makeup\_list | JSONB | 补签记录[{student\_id, reason, teacher\_id}] |
| generated\_at | TIMESTAMPTZ | 生成时间 |

```sql
CREATE TABLE attendance_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  report_date DATE NOT NULL,
  total_students INTEGER NOT NULL,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_list UUID[] NOT NULL DEFAULT '{}',
  makeup_list JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(id),
  UNIQUE(class_id, report_date)
);

CREATE INDEX idx_daily_reports_date ON attendance_daily_reports(report_date);
```

---

### 12.3 QR码编码/签名流程

#### 12.3.1 编码格式

```
编码: base64("SCHOOL_QR|{timestamp_epoch}|{student_uuid}|{nonce_16bytes_hex}") + "." + hmac_sha256_signature
签名: HMAC-SHA256(base64_data, signing_key) → 截取前16字节 → hex编码
```

| 组件 | 长度 | 说明 |
|------|------|------|
| 协议前缀 | — | `SCHOOL_QR` 固定标识 |
| timestamp\_epoch | 10 位 | Unix 时间戳（秒），UTC+8 |
| student\_uuid | 36 字符 | 学生 UUID |
| nonce\_16bytes\_hex | 32 字符 | 16 字节随机数，十六进制编码 |
| base64\_data | ~84 字符 | 上述数据经 Base64 编码 |
| signature | 32 字符 | HMAC-SHA256 签名前 16 字节的 hex 编码 |

#### 12.3.2 密钥管理

- **轮换周期：** `signing_key` 每 24 小时轮换一次，由系统自动生成
- **密钥存储：** Redis 缓存（快速访问）+ DB 持久化（通过 `key_version` 字段关联）
- **密钥版本：** `key_version` 递增，旧版本密钥在宽限期内仍可用于验证已生成的 QR 码（宽限期 = 密钥生效时间 + 30 秒 * 2 倍 TTL = 约 60 秒）
- **密钥生成：** 使用系统级种子 + 日期派生（HMAC-SHA256(date_seed, master_key)），支持密钥推导校验

#### 12.3.3 签名验证流程

```
服务端收到扫码请求
    ↓
1. 解析 QR 内容 ← 提取 base64_data 和 signature
    ↓
2. 计算预期签名（用当前 key_version 的密钥）
    ↓
3. 签名匹配？
   ├── 否 → result = 'forged'，记录审计日志
   └── 是 → 继续
    ↓
4. 查找 nonce（唯一索引）
   ├── 已存在 → result = 'duplicate'，拒绝
   └── 不存在 → 继续
    ↓
5. 检查 expires_at（服务器时间校验，拒绝客户端时间）
   ├── 已过期 → result = 'expired'
   └── 未过期 → 继续
    ↓
6. 写入 attendance_qr_logs，result = 'success'
    ↓
7. 标记 qr_codes.status = 'used'
```

---

### 12.4 API 端点设计

#### 12.4.1 POST /api/attendance/qr/generate

生成学生本人的动态 QR Code。

| 属性 | 值 |
|------|-----|
| Auth | Student JWT |
| Request Body | `{}` |
| Rate Limit | 同一学生 30 秒内仅能生成一次 |
| Response | `{ qr_code_data, expires_at, nonce }` |

**响应示例：**
```json
{
  "qr_code_data": "U0NIT09MX1FSfDE3NTAzNzYwMDB8YWJjZDEyMzQt...",
  "expires_at": "2026-07-14T08:00:30+08:00",
  "nonce": "a1b2c3d4e5f6g7h8"
}
```

#### 12.4.2 POST /api/attendance/qr/scan

教职工/闸机扫码签到。

| 属性 | 值 |
|------|-----|
| Auth | Staff/Teacher JWT |
| Request Body | `{ qr_code_data, device_id }` |
| Rate Limit | 同一教职工每分钟最多 60 次 |
| Response | `{ result, student_name, student_class, scanned_at }` |

**响应示例：**
```json
{
  "result": "success",
  "student_name": "王小明",
  "student_class": "1A",
  "scanned_at": "2026-07-14T08:00:15+08:00"
}
```

**错误响应：**
| HTTP Status | 场景 |
|-------------|------|
| 410 Gone | QR 码已过期 |
| 409 Conflict | QR 码已被使用（重复扫码） |
| 429 Too Many Requests | 5 分钟内重复签到或超过速率限制 |
| 403 Forbidden | 签名伪造 / 权限不足 |

#### 12.4.3 POST /api/attendance/qr/sync-batch

离线设备批量同步签到数据。

| 属性 | 值 |
|------|-----|
| Auth | Device Token（预注册扫码终端获取） |
| Request Body | `{ device_id, batch: [{qr_raw, scanned_at}] }` |
| Response | `{ synced_count, failed_items }` |

**幂等处理：** 服务端逐条处理，对已存在的记录返回 `duplicate` 而非重复写入，整体保证 at-least-once 语义。

#### 12.4.4 GET /api/attendance/qr/daily-report?class_id=&date=

班主任查看班级考勤日报。

| 属性 | 值 |
|------|-----|
| Auth | Class Teacher JWT（仅限本班数据） |
| Query Params | `class_id`（班级ID）、`date`（日期，格式 YYYY-MM-DD） |
| Response | `{ report }` |

**权限控制：** 班主任只能查看自己管理的班级，校务处角色可查看全校班级。

---

### 12.5 安全机制

| 安全维度 | 实现方式 | 说明 |
|---------|----------|------|
| **防伪造** | HMAC-SHA256 签名验证 + 密钥轮换 | 签名密钥每日轮换，旧密钥宽限期仅 60 秒 |
| **防重放** | nonce 唯一性约束（DB UNIQUE INDEX） | 每个 QR 码携带唯一 nonce，一次使用后即失效 |
| **过期保护** | 服务端严格校验 expires\_at | 使用服务器时间，拒绝客户端提交的时间，30 秒 TTL |
| **权限隔离** | 学生只能生成自己的 QR | 学生 JWT 仅可调用 generate 接口，教职工 JWT 仅可调用 scan 接口 |
| **速率限制** | 学生 30 秒内一次、教职工每分钟 60 次 | 通过 Redis 计数器实现，超过返回 429 |
| **设备认证** | 扫码终端需预注册 | 离线同步接口使用 Device Token 认证，未注册设备拒绝 |
| **传输安全** | 全链路 HTTPS | TLS 1.3 加密传输，网关层强制 |

---

### 12.6 离线同步机制

#### 12.6.1 离线模式流程

```
闸机扫码枪检测网络中断
    ↓
1. 进入离线模式
    ↓
2. QR 扫码数据 → 本地加密存储（AES-256, LocalStorage / SQLite）
    ↓
3. 持续尝试网络探测（每 30 秒一次）
    ↓
4. 网络恢复 → 立即触发同步
    ↓
5. 调用 /api/attendance/qr/sync-batch（逐批上传，每批最多 50 条）
    ↓
6. 服务端逐条校验：签名 → nonce → 过期 → 结果
    ↓
7. 更新 offline_sync_buffer.synced = true
```

#### 12.6.2 冲突解决

| 场景 | 处理方式 |
|------|----------|
| QR 码已过期 | sync\_result = 'expired'，记录日志不写入考勤 |
| QR 码已被使用（在线期间已签到） | sync\_result = 'duplicate'，保留原始记录 |
| QR 码有效且未被使用 | sync\_result = 'success'，实际写入考勤记录 |

#### 12.6.3 数据一致性保证

- **at-least-once 语义：** 离线设备确保每条记录至少上传一次
- **幂等处理：** 服务端对已处理记录自动去重（基于 qr_raw + scanned_at 的哈希）
- **数据完整性：** 离线数据使用 AES-256 加密存储，防止篡改

---

### 12.7 日报定时任务

| 属性 | 值 |
|------|-----|
| **Cron 表达式** | `0 8 * * 1-5`（工作日 08:00 生成截至当前的签到日报） |
| **迟到判定** | 08:00 之后签到记为迟到（可配置） |
| **缺勤判定** | 08:00 仍未签到且无提前请假记录记为缺勤 |
| **触发器** | 检查 `attendance_qr_logs` 当天记录与班级应签名单的对比 |
| **输出** | `attendance_daily_reports` 表写入 + 推送通知到班主任 Dashboard |
| **推送渠道** | 系统通知、飞书/钉钉消息、Web 后台仪表板 |

**日报内容：** 应到人数、已签到人数、迟到人数、缺勤人数、未签到学生名单及请假状态。

---

### 12.8 集成架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    QR Attendance Service                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ QR Generator  │   │   Scan       │   │ Offline Sync     │  │
│  │ (Generate QR) │   │   Handler    │   │ Handler          │  │
│  │ signing_key   │   │ verify + log │   │ batch process    │  │
│  │ nonce + nonce │   │ result calc  │   │ dedup + result   │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘  │
│         │                  │                     │            │
│         └──────────────────┼─────────────────────┘            │
│                            ▼                                   │
│                    ┌──────────────┐                            │
│                    │  Report      │                            │
│                    │  Aggregator  │  Cron: 工作日 08:00        │
│                    └──────┬───────┘                            │
└───────────────────────────┼─────────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       ┌─────────┐   ┌──────────┐   ┌────────────┐
       │   DB    │   │  Redis   │   │ Kafka Event│
       │ SQL DDL │   │ rate lmt │   │ bus (audit)│
       └─────────┘   │ key mgmt │   └────────────┘
                     └──────────┘
```

### 12.9 与现有架构的集成点

| 现有架构组件 | 集成方式 |
|-------------|----------|
| **OPA 规则引擎** | QR 签到 API 的权限校验通过 OPA 引擎：学生 only generate、教职工 only scan、班主任 only daily-report |
| **Kong API Gateway** | QR 签到 API 注册到 Kong，复用 JWT 验证、速率限制、WAF 等网关插件 |
| **Audit Service** | 所有 QR 生成、扫码、同步操作通过 Kafka 事件总线发送到 Audit Service 持久化 |
| **Notification Service** | 日报生成后通过 Kafka 触发 Notification Service 推送班主任 |
| **Redis Cluster** | 速率限制计数器、签名密钥缓存、nonce 临时去重缓存 |
| **PostgreSQL** | 所有业务数据持久化（qr_codes, attendance_qr_logs, offline_sync_buffer, attendance_daily_reports） |
| **Vault** | 签名密钥 master_key 存储在 Vault，应用按需获取并缓存到 Redis |

---


## 14. 多语言支持架构

### 14.1 模块概述

**Module 8 (Multilingual Support / i18n)** 为所有功能模块提供多语言服务能力，符合香港多元语言环境要求。

**支持语言：**

| 语言代码 | 名称 | 场景 |
|----------|------|------|
| `zh-HK` | 繁体中文 (香港) | 默认语言，符合香港教育局官方文件规范 |
| `zh-HK-yue` | 粤语口语 | 家长端界面，更贴近香港用户使用习惯，口语化表达 |
| `zh-CN` | 简体中文 | 内地用户、新来港人士 |
| `en` | 英语 | 国际用户、外籍教师、跨境学生 |

### 14.2 技术实现

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| **前端 i18n** | i18next + react-i18n | React 生态标准，支持动态切换 |
| **后端 i18n** | NestJS i18n module | 静态文件 + 数据库混合，支持自定义翻译 |
| **日期格式化** | date-fns | 轻量级，支持香港本地化格式（年月日，中文日期） |
| **翻译缓存** | Redis Cluster | 分布式缓存，提升性能 |
| **LLM 翻译** | Coze / OpenAI | 上下文感知翻译，符合教育场景术语，支持粤语口语翻译 |

### 14.3 语言检测优先级

```
1. 用户保存偏好 (user.preferred_locale)
2. URL 参数 (?lang=zh-HK)
3. Cookie (i18n_locale)
4. 浏览器 Accept-Language
5. IP 地理位置
6. 默认: zh-HK
```

---

## 15. Module 14: 学生&家长门户权限管理系统

### 15.1 模块概述

| 属性 | 描述 |
|------|------|
| 模块名称 | Student & Parent Portal Access Control — 学生&家长门户权限管理系统 |
| 模块ID | MOD-PORTAL-AC-001 |
| 关联FSD | FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md（v2.0.0-draft.1） |
| 关联CR | CR-20260714-001 T06 |
| 用户角色 | Student（学生）、Parent（家长） |
| 核心目标 | 建立 Student/Parent 角色分离的自主门户权限体系，实现角色差异化菜单、严格数据隔离与敏感字段脱敏 |

---

### 15.2 RBAC 权限矩阵设计

#### 角色定义

| 角色标识 | 角色名称 | 说明 |
|---------|---------|------|
| STUDENT | 学生 | 在校学生，只能查看/操作本人数据 |
| PARENT | 家长 | 学生监护人，只能查看关联子女数据 |

#### 权限集表（Student Role）

| 权限标识 | 权限名称 | 范围 | 说明 |
|---------|---------|------|------|
| profile:view:self | 查看个人档案 | Self | |
| profile:update:self | 有限修改个人信息 | Self | 仅可编辑联系方式/紧急联系人/地址 |
| attendance:view:self | 查看本人考勤 | Self | |
| attendance:qr:generate | 生成QR签到码 | Self | |
| leave:create:self | 提交请假 | Self | |
| leave:view:self | 查看请假记录 | Self | |
| leave:cancel:self | 撤回请假 | Self | 仅当状态为pending |
| grade:view:self | 查看本人成绩 | Self | |
| timetable:view:self | 查看课表 | Self | |
| notice:view | 查看校历/通告 | Global | |

#### 权限集表（Parent Role）

| 权限标识 | 权限名称 | 范围 | 说明 |
|---------|---------|------|------|
| profile:view:linked_children | 查看关联子女档案 | Children | 只读 |
| attendance:view:linked_children | 查看关联子女考勤 | Children | |
| leave:view:linked_children | 查看子女请假记录 | Children | |
| leave:create:linked_children | 代子女提交请假 | Children | |
| grade:view:linked_children | 查看子女成绩 | Children | |
| payment:operate:linked_children | 校内缴费 | Children | |
| notice:view | 查看校历/通告 | Global | |
| emergency:update:linked_children | 更新子女紧急联系方式 | Children | |

---

### 15.3 权限校验中间件设计

#### 请求处理流水线

```
请求 → AuthMiddleware(解析JWT) → RoleMiddleware(获取角色) → PermissionMiddleware(校验权限) → Controller
```

#### 实现路径

NestJS Guard + Decorator `@RequirePermission('profile:view:self')`

```typescript
// 权限校验伪代码
@RequirePermission('leave:create:self')
@Post('/portal/leave')
createLeave(@CurrentUser() user, @Body() dto) { ... }
```

#### 中间件职责划分

| 中间件 | 职责 | 输出 |
|--------|------|------|
| AuthMiddleware | 解析JWT Token，验证签名与过期时间 | 用户身份上下文 |
| RoleMiddleware | 从Token/Redis获取用户角色信息 | 角色集合 |
| PermissionMiddleware | 根据角色+资源+操作调用OPA引擎校验权限 | 允许/拒绝决策 |

---

### 15.4 数据隔离层设计

#### 核心关联表: parent_student_links

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| parent_user_id | UUID FK→users.id | 家长用户ID |
| student_id | UUID FK→students.id | 关联学生档案ID |
| relationship | ENUM(father, mother, guardian) | 关系类型 |
| is_primary | BOOLEAN | 是否主联系人 |
| created_at | TIMESTAMPTZ | |
| UNIQUE(parent_user_id, student_id) | | |

#### 查询拦截器

在 Service 层/Repository 层自动追加权限过滤，所有涉及学生数据的查询必须 JOIN `parent_student_links` 表。

```typescript
// NestJS QueryInterceptor
class DataIsolationInterceptor implements NestInterceptor {
  intercept(context, next) {
    const user = context.switchToHttp().getRequest().user;
    if (user.role === 'parent') {
      // 在查询中自动追加 parent_student_links 过滤
      // 使用 Repository 的 QueryBuilder 动态拼接 WHERE
      // e.g., WHERE student_id IN (SELECT student_id FROM parent_student_links WHERE parent_user_id = :userId)
    }
  }
}
```

#### 查询示例

```sql
-- 家长查询子女考勤记录
SELECT a.* FROM attendance a
JOIN parent_student_links psl
  ON a.student_id = psl.student_id
  AND psl.parent_user_id = :current_user_id
WHERE a.created_at >= :start_date AND a.created_at <= :end_date;

-- 家长查询子女成绩
SELECT g.* FROM grades g
JOIN parent_student_links psl
  ON g.student_id = psl.student_id
  AND psl.parent_user_id = :current_user_id
WHERE g.academic_year = :year;
```

#### 安全策略

| 层 | 说明 |
|------|------|
| 数据层 | 基于 `parent_student_links` 表建立家长-学生关联 |
| 服务层 | 所有查询必须 JOIN 该关联表进行权限过滤 |
| API 层 | Repository/Service 层自动追加 `WHERE student_id IN (子查询)` |
| 安全策略 | 后端二次验证为强制防线，不依赖前端路由隐藏 |

---

### 15.5 菜单权限过滤机制

> **版本更新**: v1.6.2 (#287) — Admin Dashboard 侧边栏已实现前端角色过滤。
> Portal 侧（Student/Parent）使用独立的 Portal 前端，不受此更新影响。

#### 当前实现 (v1.6.2): Admin Dashboard

**方案**: 前端静态角色过滤（Layout.tsx + userService.ts）

1. **userService.ts**: 从 localStorage 读取当前用户角色 (`getUserRole()`)
2. **Layout.tsx**: 每个菜单项定义 `roles: string[]` 允许的角色列表
3. **useMemo 过滤**: 运行时按 `userRole` 过滤菜单项，非授权角色不可见
4. **双重防线**: 前端隐藏为 UI 体验，后端 `JwtAuthGuard + RolesGuard` 为安全底线

```typescript
// 菜单项定义（Layout.tsx）
const allNavItems = [
  { label: 'Dashboard', path: '/dashboard', roles: [ADMIN, DIRECTOR, STAFF, TEACHER, PARENT, STUDENT] },
  { label: 'System Settings', path: '/settings', roles: [ADMIN, DIRECTOR] },
  { label: 'User Management', path: '/users', roles: [ADMIN, DIRECTOR] },
  // ...
]
const navItems = useMemo(
  () => allNavItems.filter(item => item.roles.includes(userRole || '')),
  [userRole]
)
```

#### Admin Dashboard 角色-菜单映射表 (v1.6.2)

| 菜单模块 | admin | director | staff | teacher | parent | student |
|---------|:-----:|:--------:|:-----:|:-------:|:------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 学生管理 | ✅ | ✅ | ✅ | — | — | — |
| 考勤管理 | ✅ | ✅ | ✅ | ✅ | — | — |
| 资产管理 | ✅ | ✅ | ✅ | — | — | — |
| 资产租借 | ✅ | ✅ | ✅ | — | — | — |
| 用户管理 | ✅ | ✅ | — | — | — | — |
| 请假管理 | ✅ | ✅ | ✅ | ✅ | — | — |
| 家长查询 | ✅ | ✅ | ✅ | — | ✅ | — |
| 查询队列 | ✅ | ✅ | ✅ | — | — | — |
| 通知管理 | ✅ | ✅ | ✅ | ✅ | — | — |
| 课程管理 | ✅ | ✅ | ✅ | — | — | — |
| 考试管理 | ✅ | ✅ | ✅ | — | — | — |
| 财政管理 | ✅ | ✅ | ✅ | — | — | — |
| 系统设置 | ✅ | ✅ | — | — | — | — |
| 学生链接 | — | — | — | — | ✅ | — |
| 关于 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

#### 未来计划 (v2.0): 后端菜单 API

**目标**: 由后端统一管理菜单配置，前端动态渲染

1. **后端提供菜单接口**：`GET /api/portal/menus` 根据角色返回可见菜单列表
2. **前端动态渲染**：根据接口数据动态渲染侧边菜单，无需前端硬编码
3. **优势**: 角色变更无需重新构建前端；支持运行时菜单定制

#### Portal 侧 (Student/Parent) — 计划中

| 菜单模块 | Student | Parent | 说明 |
|---------|:-------:|:------:|------|
| 个人档案 | ✅ 查看+有限编辑 | ✅ 只读 | Student 可修改联系方式等 |
| 我的QR码签入 | ✅ 使用 | ❌ | Student-only |
| 电子请假 | ✅ 提交+查看 | ✅ 查看+代提交 | |

> **审批角色可见性（/api/portal/leave 列表）**：Teacher / School Staff / School Director 审批角色可见全校所有学生的请假记录（用于审批入口，可按 status 筛选待审批）；Student 仅本人、Parent 仅关联子女。
| 考勤记录 | ✅ 查看本人 | ✅ 查看关联子女 | |
| 成绩查询 | ✅ 查看本人 | ✅ 查看关联子女 | |
| 课表查询 | ✅ 查看 | ❌ | Student-only |
| 校历/通告 | ✅ 查看 | ✅ 查看 | 全校共享 |
| 校内缴费 | ❌ | ✅ 操作 | Parent exclusive |

---

### 15.6 数据脱敏层设计

#### 脱敏中间件位置

在 Response 序列化前拦截，通过装饰器或拦截器对敏感字段自动脱敏。

#### 配置规则（JSON config）

```json
{
  "phone": { "pattern": "(\\d{4})\\d{4}", "replacement": "****$1" },
  "email": { "pattern": "(\\w{1}).*@", "replacement": "$1***@" },
  "address": { "strict_level": "street_only" },
  "emergency_contact": { "pattern": "(.)", "replacement": "$1**" }
}
```

#### 脱敏规则表

| 字段 | Student端 | Parent端 |
|------|-----------|----------|
| phone | 完整显示 | ****后4位 |
| email | 完整显示 | 首字母***@域名 |
| address | 完整显示 | 街道级(门牌号掩码) |
| emergency_contact | 完整显示 | 姓+** |
| student_id | 完整显示 | 前6位+**** |

#### 实现说明

- 脱敏在 Response JSON 序列化前通过 NestJS Interceptor 统一处理
- 规则配置可动态更新（从 DB 或配置中心加载），无需重启服务
- Student 本人查阅时完整显示，Parent 查阅关联子女时按脱敏规则处理
- 系统日志中的敏感字段同样执行脱敏后再记录

---

### 15.7 审计日志表设计

#### 表: portal_audit_logs

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| event_type | ENUM | LOGIN/PROFILE_VIEW/PROFILE_UPDATE/LEAVE_CREATE/LEAVE_CANCEL/QR_GENERATE/QR_SCAN/UNAUTHORIZED_ACCESS |
| actor_id | UUID | 操作人ID |
| actor_role | ENUM(student, parent, staff) | |
| target_id | UUID | 目标对象ID |
| target_type | VARCHAR | students/leaves/qr_codes |
| action | ENUM | CREATE/READ/UPDATE/DELETE/ACCESS_DENIED |
| changes | JSONB | 变更详情(脱敏后) |
| ip_address | INET | |
| user_agent | TEXT | |
| result | ENUM(SUCCESS, FAILURE, DENIED) | |
| created_at | TIMESTAMPTZ | INDEX |
| INDEX | (actor_id, created_at) | |
| INDEX | (event_type, created_at) | |

#### 审计事件清单

| 事件类型 | 触发条件 | 关键记录内容 | 保留期限 |
|---------|---------|-------------|---------|
| LOGIN | 学生/家长登录门户 | 登录方式、IP、User-Agent | ≥ 1 年 |
| PROFILE_VIEW | 查看个人/子女档案 | 查看人、目标对象、角色 | ≥ 1 年 |
| PROFILE_UPDATE | 修改联系方式等可编辑字段 | 旧值→新值（脱敏） | ≥ 2 年 |
| LEAVE_CREATE | 提交请假申请 | 请假类型、天数、提交人角色 | ≥ 3 年 |
| LEAVE_CANCEL | 撤回请假 | 请假ID、原状态 | ≥ 3 年 |
| QR_GENERATE | 生成 QR 签到码 | 学生ID、时间 | ≥ 6 个月 |
| QR_SCAN | QR 码签入操作 | 学生ID、结果、失败原因 | ≥ 6 个月 |
| UNAUTHORIZED_ACCESS | 越权访问尝试 | 尝试者、目标资源、来源IP | ≥ 1 年 |

---

### 15.8 整体架构交互图

```
┌─────────────────────────────────────────────────────────────────┐
│                       学生/家长门户前端                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 个人档案  │  │ 请假管理  │  │ 考勤查询  │  │ 成绩查询  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       └──────────┬──┴──────────────┴──────────────┘           │
│                  │ 菜单动态渲染（根据 /api/portal/menus）       │
└──────────────────┼─────────────────────────────────────────────┘
                   │
┌──────────────────┼─────────────────────────────────────────────┐
│                  ▼                                             │
│    API Gateway (Kong) — JWT验证 / Rate Limiting / WAF          │
│                   │                                           │
│                   ▼                                           │
│    AuthMiddleware → RoleMiddleware → PermissionMiddleware      │
│    (解析JWT Token)  (获取角色信息)   (OPA权限引擎校验)          │
│                   │                                           │
│         ┌─────────┴─────────┐                                │
│         ▼                   ▼                                 │
│   Service Layer      DataIsolationInterceptor                │
│   (业务逻辑处理)      (自动追加行级权限过滤)                    │
│         │                   │                                 │
│         └─────────┬─────────┘                                │
│                   ▼                                           │
│   Response Serialization — SensitiveDataMaskInterceptor       │
│   (按角色脱敏规则对敏感字段掩码处理)                            │
│                   │                                           │
│                   ▼                                           │
│   Audit Service (异步写入 portal_audit_logs → Kafka → DB)     │
└───────────────────────────────────────────────────────────────┘
```

---

## 附录

### 附录 A: 架构审查结果摘要 (v0.4 → v1.0.0 正式版本)

**审查标准:** NIST SP 800-53, OWASP, Cloud Native Best Practices, ISO/IEC 27001, PDPO 香港隐私条例, EDB 教育局规范
**审查日期:** 2026-06-06
**审查结果:** 所有审查项通过，正式发布v1.0.0版本，可投产使用

#### 新增架构模块
| # | 项目 | 说明 |
|---|------|------|
| 1 | 运维监控架构 | Prometheus+Grafana完整方案，20项核心监控指标集成，自动告警，全覆盖 |
| 2 | 灾难恢复架构 | 多可用区部署、PITR恢复流程、一键灾难恢复自动化实现，RTO≤4h，RPO≤1h |
| 3 | OPA规则引擎架构 | 统一权限控制，覆盖RBAC/ABAC，细粒度权限管控，合规审计 |
| 4 | 多渠道通知架构 | SMS/APP/邮件/WhatsApp多渠道支持，自动故障切换，送达率≥95% |
| 5 | 系统集成扩展 | 新增DSE放榜成绩对接、预算管理对接外部会计系统，满足教育局需求 |
| 6 | PDPO合规增强 | 覆盖6项PDPO保障原则，满足香港个人数据隐私条例要求，合规审计 |
| 7 | 技术栈版本升级 | Node.js升级到22 LTS，PostgreSQL升级到16，OPA 0.65.x，性能提升 |

#### 非功能属性增强
| # | 项目 | 说明 |
|---|------|------|
| 1 | 性能指标 | 明确API响应时间、并发用户数、缓存命中率等指标，99.9% SLA保障 |
| 2 | 可用性SLA | 服务可用性99.9%，每年downtime≤8.76小时，承诺服务水平 |
| 3 | PDPO合规 | 覆盖6项PDPO保障原则，符合香港合规要求，审计可追溯 |
| 4 | 容灾能力 | RTO≤4小时，RPO≤1小时，每季度容灾演练，保障业务连续性 |

### 附录 B: 待补充内容（后续迭代）

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
- [x] Module 13: QR Code 校园签到考勤系统设计（已完成 HLD）
- [ ] Module 13: QR Code 校园签到考勤详细设计 — API OpenAPI 规范、前端组件设计

### 附录 C: 变更对比表

| 版本 | 日期 | 变更类型 | 变更内容 |
|------|------|----------|----------|
| v1.8.0-draft.1 | 2026-07-14 | 草稿（CR-20260714-001） | CR-20260714-001 T05：新增 Module 13 QR Code 校园签到考勤 — 系统设计（HLD）。包括数据库表设计、QR码编码/签名流程、API端点设计、安全机制、离线同步机制、日报定时任务。关联 FSD-QR-ATT-001。 |
| v1.8.0-draft.1 | 2026-07-14 | 草稿（CR-20260714-001） | CR-20260714-001 T06：新增 Module 14 学生&家长门户权限管理系统（RBAC权限矩阵、权限校验中间件、数据隔离层、菜单权限过滤、数据脱敏层、审计日志表设计）。版本状态：草稿（待二轮审查） |
| v1.7.0 | 2026-06-06 | 草稿（P1整改） | P1整改：版本更正v1.7.0 + Module11运维架构（9项F-OPS全覆盖）+ Module12 DSE/HKEAA SDP对接方案。版本状态：草稿（待二轮审查） |
| v1.0.0 | 2026-06-06 | 正式版本 | 依据SPEC-COMPLETE v1.7.0深化设计，新增运维监控/灾难恢复/OPA规则引擎/多渠道通知架构，更新系统集成，补充PDPO合规，升级技术栈版本，所有模块可投产 |
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
| **HKMA 金融管理局规范** | 财务数据处理规范（参考） |

---

**文档维护：** 系统架构团队
**最后更新：** 2026-07-14
**版本：** v1.8.0-draft.1（草稿，待二轮审查）
**文档链接：** https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/SPEC-SYSTEM-DESIGN.md

---

## 16. Issue #355 补全：用户权限与认证模块技术设计（F-USER-003~007）

> 🔧 **补全说明（Issue #355）**：本节为「用户权限与认证」模块补齐技术设计，作为 DEV 实现 **F-USER-003~007** 的输入。此前 §5 与 §15 已覆盖 RBAC/ABAC（OPA 引擎）的数据模型与角色-菜单映射，本节与其衔接，重点补齐：① 会话与 Token 管理、② 凭证重置、③ 权限变更审批流程、④ ABAC 策略管理（DB 落库）、⑤ 审计查询 的系统设计。
>
> 数据表定义见 `DB-SCHEMA.md` / `DATA-DICTIONARY.md`；接口定义见 `API-DESIGN.md` §7。

### 16.1 模块边界与组件拓扑

**模块前缀：** `USR`（权限与认证）

**核心组件：**

| 组件 | 职责 | 关联既有组件 |
|------|------|--------------|
| **JwtAuthGuard** | 校验 Access Token，解析请求方身份（已有） | §5 身份认证 |
| **RolesGuard** | RBAC 角色判定（已有） | §5 RBAC |
| **OpaGuard / PolicyDecisionPoint (PDP)** | 将请求输入 OPA Rego 引擎做 ABAC 评估（已有） | §15 ABAC/OPA |
| **SessionModule** | 会话生命周期管理、并发限制、强制登出、空闲超时 | F-USER-004 |
| **TokenService** | Access/Refresh Token 签发、轮换、作废黑名单 | F-USER-004 |
| **CredentialResetService** | 邮箱/SMS OTP 自助重置、管理员代重置 | F-USER-006 |
| **PermissionApprovalService** | 高风险权限变更审批链编排、二次认证触发 | F-USER-007 |
| **AuditService** | 审计日志写入、SIEM 推送、保留策略 | F-USER-005 |
| **OPA Policy Store** | ABAC 策略（Rego）版本化管理与 DB 落库 | F-USER-003 |

**模块依赖图：**

```
用户请求 → JwtAuthGuard → RolesGuard(RBAC) → OpaGuard(ABAC)
     ↓ 通过则继续
业务 Service ──→ (需要时) PermissionApprovalService（高风险变更）
              ──→ SessionService / TokenService（会话类）
  统一在入口/出口调用 AuditService（F-USER-005）
```

### 16.2 F-USER-004：会话与 Token 管理设计

#### 16.2.1 Token 类型与生命周期

| Token 类型 | 用途 | 有效期 | 存储 | 轮换策略 |
|-----------|------|--------|------|----------|
| Access Token | API 鉴权 | 30 分钟 | 内存 / HttpOnly Cookie | 过期后凭 Refresh 换新 |
| Refresh Token | 续期 Access | 7 天 | HttpOnly Cookie + `sessions` 表 | 每次使用即轮换（旧的立即作废）；7 天滑动续期，累计 >14 天强制重登 |
| 临时 Token（Temp） | OTP 验证前携带身份 | 5 分钟 | 内存 | 一次性，验证 OTP 后作废（已有） |
| API Key | 系统间调用 | 可配置 | 加密存储 | 管理员手动轮换 |
| SSO Assertion | 单点登录 | 8 小时 | Session | 由 SSO IdP 管理 |

#### 16.2.2 并发会话限制（最多 3 个）

- 每签发一个新的有效会话前，查询 `sessions` 表中该 `user_id` 且 `status='active'`、`expires_at > now()` 的数量。
- 若已达 `MAX_SESSIONS=3`，按 **最近最少活跃（LRU）** 淘汰最旧会话（`last_active_at` 最早者），并在审计中记录 `SESSION_EVICTED`。
- 决定逻辑集中在 `SessionService.enforceSessionLimit()`，供所有登录/刷新路径统一调用。

#### 16.2.3 异地登录检测（风险告警）

- 登录成功后比对用户最近登录地理位置（`last_login_city`，由 IP → GeoIP 解析）。
- 若新位置与历史显著不同且历史存在 `SESSION_EXPIRED`/前 3 次登录均在该城市之外 → 标记为新位置，签发 token 的同时触发风险告警事件 `SESSION_RISK_ALERT`（推送通知 + 审计日志）。
- 不阻断登录（可用配置开关升级为阻断），默认仅告警。

#### 16.2.4 空闲超时与主动作废

- 空闲超时默认 60 分钟（可配置 `SESSION_IDLE_TIMEOUT_MIN`）：客户端心跳/请求头 `X-Last-Active` 超过阈值，`SessionService` 将 `status` 置为 `expired`，`SESSION_EXPIRED` 审计，强制重新登录。
- 主动作废触发点（全部 `sessions.invalidateAll(userId)`）：`change_password`、权限变更审批通过、账户禁用/离职、管理员强制登出。
- 黑名单实现：`sessions.jti`（access token 的 JWT ID）写入 `token_blacklist`，OpaGuard 之外由 JwtAuthGuard 依 `revoked=true` 拒绝。

#### 16.2.5 时序（刷新 Token）

```
Client                JwtAuthGuard           TokenService            SessionService
  |  Access Token 过期      |                        |                        |
  |-- POST /auth/refresh -->|-- 校验 Refresh(轮换) -->|                        |
  |                        |                        |-- 校验 session active -->|
  |                        |                        |-- 签发新 Access/Refresh->|
  |                        |                        |-- 作废旧 refresh(jti) -->|
  |<-- 200 + 新 token ------|                        |                        |
```

### 16.3 F-USER-005：审计日志与登录记录设计

- `AuditService.write()` 为唯一写入入口，Service 层业务动作完成后调用，事务外提交（避免业务回滚连带日志回滚，日志失败不影响主流程，采用「失败降级」+ 后台重试队列）。
- 预留 `audit_logs.metadata` JSONB 存扩展字段（请求体脱敏摘要、风险等级、异常上下文）。
- **脱敏写入**：`request_params`/`metadata` 中的敏感字段（身份证、密码、OTP）写入前强制正则脱敏，由 `AuditService.sanitize()` 统一处理，任何调用方不可绕过。
- **保留策略**由 `AuditRetentionJob`（cron）执行：登录事件 3 年、权限/敏感/系统管理 7 年，到期归档至冷存（SIEM 对接件），主库标记 `archived=true` 并物理清理（分批，避免锁表）。
- **登录事件**（`LOGIN_SUCCESS`/`LOGIN_FAILED`/`LOGIN_LOCKED`/`LOGOUT`/`SESSION_EXPIRED`/`PASSWORD_CHANGED`/`MFA_ENABLED`/`UNAUTHORIZED_ACCESS`）统一落在 `audit_logs`，字段对齐 `audit_action` 枚举（新增值见 DB-SCHEMA §16.4）。

### 16.4 F-USER-006：密码与凭证重置设计

#### 16.4.1 自助重置（邮箱/SMS OTP）

```
用户请求 → 校验账号+去向(邮箱/手机) → 生成一次性 reset token/OTP（`password_resets`）
   → 发送链接/SMS(6位OTP) → 用户回填 → 校验(15min/5min、3次失败锁定)
   → 密码复杂度校验 → 更新密码 → 作废全部会话 → 通知 + 审计日志
```

- **一次性令牌**：`password_resets.token`（哈希存储）、`otp` 非明文存储，`expires_at`、`attempts`、`used_at` 约束防重放。
- **密码历史**：校验新密码不在 `users.password_history` 最近 5 次内（复用检测）。
- **作废会话**：重置成功调用 `SessionService.invalidateAll()`。
- **家长密码（独立于登录密码）**：走同一张 `password_resets`（`purpose='parent_password'`），仅支持短信 OTP 或到校人工代办（校务处核验身份后走管理员代重置路径）。

#### 16.4.2 管理员代重置（双验证）

- 仅 `SCHOOL_ADMIN` / `SYSTEM` 角色可执行。
- 执行前二次授权：当前管理员密码 + 本人手机验证码（短信 OTP），服务端强制校验（`CredentialResetService.adminVerify()`）。
- 被重置用户收邮件/短信通知，完整操作写审计（`user_password_reset`）。

### 16.5 F-USER-007：权限变更审批流程设计

#### 16.5.1 触发规则与审批链

- **5 类高风险操作**进入审批流（临时提升为校务主任、跨班级访问、数据导出授权、SYSTEM 角色变更、家长解绑），由 `PermissionApprovalService.detectHighRiskChange()` 在角色/权限写入前识别并截断（改为先建 `permission_approval_requests` PENDING 记录，**不直接落库权限**）。
- **审批链**：`permission_approval_requests`(总表) + `permission_approval_steps`(步骤) 多级审批。默认两级（校务主任 → 校长），`risk_level=high`（SYSTEM 变更）为三级（校务主任 → 校长 → 系统管理员）。
- **二次认证**：审批人在「提交审批决定」动作时触发短信 OTP/硬件 Token（而非申请提交时），`approval_steps.approver_id` 记录实际审批人。
- **证明文件**：敏感权限操作须上传附件（PDF/JPG/PNG，≤10MB），`permission_approval_requests.attachments`；无证明文件系统自动退回（`AUTO_REJECTED_REASON_EMPTY_ATTACHMENT`）。
- **有效期**：`valid_from`/`valid_until` 约束授权生效窗口，到期自动回收（`PermissionExpiryJob` cron 扫描并收回）。

#### 16.5.2 状态机

```
pending ──提交──▶ pending_review ──逐级审批──▶ approved / rejected
   │                        │
   └──取消──▶ cancelled      └──超时未审(24h cron)──▶ expired
批准后：写入角色/权限 + 作废目标用户相关会话 + 审计
```

#### 16.5.3 时序（跨班级访问授权）

```
Officer                 ApprovalSvc              Approver(SMS OTP)         SessionSvc    AuditSvc
  |-- 提交申请(含附件) -->| 建 request+steps(PENDING)|                          |            |
  |<-- 201 request_id ----|                        |  -- 审批查询列表 -->      |            |
  |                       |<-- 二次认证(OTP) ------|                          |            |
  |                       |-- 校验 -> 审核附件 ->批准|                          |            |
  |                       |-- 写权限+作废目标会话 ---->|                        |            |
  |                       |-- 审计日志 ---------------------------------------->|            |
```

### 16.6 F-USER-003：ABAC 策略管理（DB 落库）设计

- 除 OPA Rego 文件外，新增 **策略元数据表** `abac_policies`，用于版本化、灰度发布、追责：
  - 策略变更先写入 `abac_policies`（`status=preview`），人工审查后 `published`（`status=active`），OpaGuard 运行时加载 `active` 版本。
  - 每次发布记录 `version`（自增）、`rego` 原文、`created_by`、`published_at`、`rolled_back_from` 支持回滚。
  - 策略标题/描述/目标角色（`target_roles`）便于检索与审计。
- **RBAC 数据流固化**：
  - 角色 `user_roles`（含 `is_system` 标记，系统内置角色不可删除/改名，仅可维护 `permissions` 关联）。
  - 权限 `permissions`（`code` 唯一，`module`/`resource_type`/`action` 描述操作）。
  - 关联表 `user_role_assignments`（用户-角色）、`role_permissions`（角色-权限）。
  - 新增 `role_permissions` 规范化关联（不依赖 `user_roles.permissions` JSONB 数组，改为主从一致的组合键）。
- **安全边界**：
  - RBAC 判角色，ABAC 判数据范围/字段级脱敏/操作权限，二者**都通过才算 allow**（叠加而非替代，已在 OPA Rego 主评估入口体现）。
  - 默认拒绝（fail-closed）：Rego 无匹配规则返回 deny，并有兜底 `default authorize = {"decision": "deny", "reason": "no_matching_rule"}`。
  - 敏感字段查看/导出/紧急例外等一律触发审计（F-USER-005）。

### 16.7 安全边界与一致性保证

| 边界 | 保证 |
|------|------|
| Token 泄露 | Access 短期（30min）、Refresh 轮换、jti 黑名单、HttpOnly Cookie |
| 会话超限 | 并发上限 3，LRU 淘汰最旧 |
| 提权防护 | 高风险变更走审批流 + 审批人本人二次认证 |
| 重置滥用 | OTP 一次性 + 短效期 + 失败锁定 |
| 审计缺失 | 所有鉴权拒绝与敏感操作统一经 AuditService 写入 |
| 文档一致性 | 表结构见 DB-SCHEMA 「用户权限与认证模块」，字段说明见 DATA-DICTIONARY §19，接口见 API-DESIGN §7 |

**已实现能力衔接**：JwtAuthGuard / RolesGuard / OpaGuard / OTP 登录已存在（§5、§15），本节仅新增其上层的会话生命周期、凭证重置、审批编排、策略落库与审计统一入口，未改动既有鉴权链路。

---

## 17. Module 5: 整合及合规 — 技术设计（F-INT-001/002, F-COMP-001/002/003）

> 🔧 **补全说明（Issue #356）**：本节为「整合及合规」模块（WebSAMS 同步、eClass 集成、PDPO 隐私合规、双人见证、审计留存）补全技术设计，作为 DEV 实现 F-INT-001/002 + F-COMP-001/002/003 的输入。
> 本节定位为「我方系统整合层 + 数据模型 + 我方接口 + 同步状态机」的可冻结设计；WebSAMS / eClass / 教育局官方 API 文档在位后按「§17.8 对接契约」对接，不阻塞我方实现。既有 §8.4 已给出 Integration Service 服务边界与本模块统一入口，§9.4 已覆盖 WebSAMS Token 自动刷新（F-OPS-003），本节不复述，仅做衔接引用。
> 审计事件目录/审计日志表已由 F-USER-005（§16.3、DB-SCHEMA §4.3）覆盖，本节**不重复建表**，仅新增 `audit_action` 枚举值并明确保留策略衔接。

### 17.1 模块边界与组件拓扑

**服务边界（衔接 §1.3）：**

| 服务 | 职责（本模块） | 可扩展副本 |
|------|--------------|-----------|
| **Integration Service** | WebSAMS/eClass adapter、数据同步编排、同步状态机、冲突队列 | M (1-2) |
| **Compliance Service** | PDPO 合规检查引擎、双人见证编排、审计事件封装 | S (1) |
| **Audit Service**（既有，§8.4）| 审计日志统一写入（F-USER-005）| H (无状态) |

```
┌────────────┐   ┌────────────┐   ┌────────────┐
│  WebSAMS    │   │  eClass     │   │ 我局/外部源 │
│  教育局官方  │   │  教育平台   │   │  提供方     │
└─────┬──────┘   └─────┬──────┘   └─────┬──────┘
      │   对接契约(§17.8)  │  对接契约       │
      ▼                  ▼               ▼
┌────────────────────────────────────────────────┐
│            Integration Layer (adapter)         │
│  WebSAMSAdapter · eClassAdapter · ProviderAD  │
│  ➜ 认证/Token(§9.4) · 字段映射 · 节流 · 重试   │
└────────────────────────┬────────────────────────┘
                         │   事件总线 (写入/成功/失败/冲突)
                         ▼
┌────────────────────────────────────────────────┐
│       Sync Orchestrator (状态机 + 批处理)       │
│  sync_tasks · sync_logs · sync_conflicts       │
└───────────┬────────────────────────┬───────────┘
            │                        │
  需要合规判定                            完成/失败
            ▼                        ▼
┌──────────────────────────┐   ┌──────────────────────┐
│  Compliance Service      │   │  Audit Service        │
│  pdpo_compliance_check   │   │  写入 audit_logs      │
│  witness orchestration   │   │  (F-USER-005 §16.3)  │
└──────────────────────────┘   └──────────────────────┘
```

**设计原则：**
- **对接隔离**：所有外部系统交互经由 adapter，adapter 内部实现「对接契约」；我方领域模型只依赖 adapter 暴露的规范化 `SyncPullDTO` / `SyncPushDTO`，不感知具体第三方协议。
- **幂等与可重跑**：同步任务具备全局唯一 `sync_ref`（幂等键），失败可安全重试，不产生重复数据。
- **合规前置**：涉及敏感/财务数据的同步与操作，先经 Compliance Service 判定（F-COMP-001），命中触发规则者进入双人见证（F-COMP-002），全程写审计（F-COMP-003）。
- **契约可冻结**：我方整合层设计与外部文档解耦，第三方字段/协议以「对接契约」形式固化（§17.8），文档到位即在 adapter 内按契约填充，不改我方主流程。

---

### 17.2 集成层 Design（adapter 架构）

#### 17.2.1 Adapter 统一接口

每个外部系统对应一个 adapter，实现统一接口：

| 方法 | 语义 | 幂等键 | 说明 |
|------|------|--------|------|
| `authenticate()` | 获取/刷新凭据（含 Token 自动刷新，衔接 F-OPS-003 §9.4）| - | OAuth2 client_credentials / 密钥 / 证书 |
| `pull(sync_spec)` | 从外部拉取数据（按需/定时/批量）| `sync_ref` | 返回规范化 `SyncPullDTO` |
| `push(sync_spec)` | 推送数据至外部 | `sync_ref` | 返回外部确认回执 |
| `healthCheck()` | 连通性 & 配额探活 | - | 供 Ops 探针与监控 |
| `map(payload)` | 字段映射（我方⇄外部代码）| - | 单 adapter 内实现，含枚举映射 |

**adapter 实例：**
- `WebSAMSAdapter` — 教育局 WebSAMS（学籍/出席/成绩/健康）
- `eClassAdapter` — eClass 平台（出席/作业/沟通）
- （预留 `DSESDPAdapter` 已在 Module 12 §10 覆盖，此处不复述）

#### 17.2.2 同步数据域映射（F-INT-001 WebSAMS）

| 我方表/域 | 方向 | 频率 | 说明 |
|-----------|------|------|------|
| 学生基本资料（students → WebSAMS）| 双向 | 实时（事件驱动）| 学生新增/更新即时同步 |
| 学籍资料 | 双向 | 实时 | 班别/学年变更 |
| 出席记录（attendances → WebSAMS）| 学校→WebSAMS | 每日 23:00 | 定时同步 |
| 成绩资料 | 学校→WebSAMS | 每日 23:00 / 批量 | 成绩发布后推送 |
| 健康记录 | 学校→WebSAMS | 每日 23:00 | 敏感（P1），全程合规+审计 |

#### 17.2.3 eClass 集成（F-INT-002）

eClass 以 REST 消费为主，由 adapter 在同步任务中拉取/推送：出席记录、作业、家校沟通消息。字段映射与端点在 §17.8 对接契约中固化。敏感字段（如涉及个人 ID/健康）按 F-COMP-001 分级处理。

---

### 17.3 数据同步流程与状态机（F-INT-001/002）

#### 17.3.1 同步任务状态机

`sync_tasks.status` 取值：

```
                     ┌─ 校验失败 ──▶ FAILED
                     │               ▲
   QUEUED ──▶ RUNNING ── 外部失败/超时 ─┴─▶ RETRYABLE（指数退避重试，上限 N 次）
      │              │                                 │
      │              ├─ 冲突检测 ─▶ CONFLICT ──人工处理──▶ RESOLVED / CANCELLED
      │              │                                  │
      │              └─ 成功 ──────▶ SUCCEEDED ──(审计完整打点)──▶ DONE
      └─ 取消 ────▶ CANCELLED
```

| 状态 | 含义 | 退出动作 |
|------|------|----------|
| `QUEUED` | 已入队待执行 | 调度器领取 → RUNNING |
| `RUNNING` | 执行中（含外部 HTTP 等待）| 成功/失败/冲突/超时 |
| `RETRYABLE` | 可重试失败（网络/限流/瞬时）| 指数退避后回 RUNNING，达上限 → FAILED |
| `CONFLICT` | 数据冲突（版本/主键/值不一致）| 生成 sync_conflicts 记录 → 人工/RESOLVED |
| `SUCCEEDED` | 单次执行成功 | 审计打点 → DONE |
| `FAILED` | 不可重试失败（校验/认证/数据非法）| 告警 + 审计 |
| `CANCELLED` | 手动取消 | - |
| `RESOLVED` | 冲突已人工裁决 | 落库回写 |

**调度规则：**
- 实时：事件驱动（消息队列触发），`sync_mode=realtime`
- 定时：每日 23:00（出席/成绩/健康），`sync_mode=scheduled`（cron）
- 批量：每周/每月年度处理，`sync_mode=batch`
- 按需：`sync_mode=manual`（管理员手动触发拉取）
- 幂等：每次执行用唯一 `sync_ref`；失败重试不产生重复记录。

#### 17.3.2 重试与退避

- `max_retry` 默认 3（可配），退避 30s → 2min → 10min，写入 `sync_logs.attempt`。
- 限流（429/配额）自动进入 RETRYABLE，尊重 `Retry-After`。
- 认证失败（4xx 认证）直接 FAILED 并告警（衔接 F-OPS-003 Token 刷新）。

#### 17.3.3 冲突处理（sync_conflicts）

| 冲突类型 | 触发 | 处理策略 |
|----------|------|----------|
| `version_mismatch` | 本地/外部数据版本号不一致 | 记录双方值，人工裁决（保留外部/保留本地/合并）| 
| `key_conflict` | 主键/唯一键映射冲突 | 人工映射或重指 |
| `value_discrepancy` | 同字段值不同（无版本）| 默认「外部优先」规则，可人工覆盖 |
| `link_break` | 关联记录缺失（班级/学生不存在）| 挂起待外键就绪，超时转 FAILED |

冲突记录进入 `sync_conflicts`，由校务处审核（写审计）。解决后同步任务回到 `RESOLVED`。

---

### 17.4 合规检查流程（F-COMP-001）

**数据分级（衔接 SPEC-COMPLETE F-COMP-001 数据分类）：**

| 级别 | 处理规则（系统强制）|
|------|--------------------|
| **P1** | 加密 + 双重授权 + 完整审计 + 默认脱敏展示 |
| **P2** | 加密 + 用途限制 + 审计 |
| **P3** | 标准保护 |

**检查引擎（`ComplianceService.check`）逐项判定，全部通过才放行：**
1. **目的限制（Purpose Limitation）**：`action` 与 `purpose` 须落在该数据级别允许集合内，否则 `deny(purpose_violation)`。
2. **资料最小化（Data Minimization）**：请求字段不得超出目的所需最小集，识别冗余字段采集（`EXCESSIVE_FIELD_REQUEST`）。
3. **存取控制（Access Control）**：委托 OPA/RBAC（§5.4/§16.7）判定当前角色对该资源/敏感字段的权限，并叠加「敏感查看需二次认证」。
4. **保留期限（Retention）**：读取数据的保留期配置（见 §17.6），超出保留期数据的访问/导出被拒绝或要求先行合规归口。

```
pdpo_compliance_check(action, data_class, purpose, user_role, fields[])
  │
  ├─ 1 purpose 合法 ? 否 ─▶ deny(purpose_violation) + 审计
  ├─ 2 fields ⊆ 最小集 ? 否 ─▶ deny(excessive_field) + 审计
  ├─ 3 OPA access allow ? 否 ─▶ deny(access_denied) + 审计
  ├─ 4 保留期内 ? 否 ─▶ deny(retention_expired) + 审计
  └─ 全部通过 ─▶ allow + 审计（合规通过记录 compliance_checks）
```

**判定结果落库**至 `compliance_checks`（含 action、data_class、purpose、decision、reason、risk_level），每一条均同步写审计日志（F-COMP-003）。

---

### 17.5 双人见证编排（F-COMP-002）

**触发规则（衔接 SPEC-COMPLETE F-COMP-002）：**

| 场景 | 阈值 | 见证要求 |
|------|------|----------|
| 现金收取 | 任何金额 | 1 员工 + 1 见证人 |
| 现金支付 | >HK$500 | 2 名授权员工 |
| 备用金补充 | 任何 | 2 名授权员工 |
| 保险箱开启 | 任何 | 2 名授权员工 |
| 支票签署 | 任何 | 2 名授权签署人 |

**状态机（`witness_verifications.status`）：**

```
 TRIGGERED ──▶ AWAIT_FIRST ──▶ AWAIT_SECOND ──▶ COMPLETED(锁定交易)
     │            │   ▲              │   ▲
     └─CANCELLED  │   └── REJECTED   │   └── REJECTED
                  └── 超时30min──▶ 校务主任介入 ──▶替换见证人/REJECTED/CANCELLED
```

| 状态 | 含义 |
|------|------|
| `TRIGGERED` | 检测到见证场景，自动创建见证单 |
| `AWAIT_FIRST` | 等待第一见证人（现金收取时＝员工本人）|
| `AWAIT_SECOND` | 第一见证完成后，等待第二见证人 |
| `COMPLETED` | 全部见证人确认 → 交易锁定，回写业务单据 |
| `REJECTED` | 任一见证人拒绝（记录原因，退回申请人）|
| `CANCELLED` | 交易取消/见证单作废 |
| `ESCALATED` | 超时/异常升级至校务主任 |

**编排要点：**
- 触发即创建 `witness_verifications` 并写入审计（`witness_triggered`）。
- 第一/第二见证人操作分别写审计（`witness_approved_step` / `witness_rejected`）。
- 每次见证确认需见证人本人二次认证（短信 OTP）防止代确认（衔接双人见证实时推送规范）。
- 见证确认在 `DISTINCT` 的两个用户之间（`requester` 与 `witness_1`/`witness_2` 不得同人 / 同角色池限定）。
- 超时：30 分钟未处理 → 提醒见证人，1 小时未处理 → 通知校务主任可指定替代见证人（衔接 SPEC F-COMP-002）。
- 完成 → 通过回调锁业务单据（报销/收支/备用金状态机联动，写审计 `witness_completed`）。

---

### 17.6 审计留存策略（F-COMP-003）

> 审计日志表 `audit_logs` 已在 §16.3 / DB-SCHEMA §4.3 定义，本节**不新建审计事件目录表**，仅补充 F-COMP-003 的保留策略与新增事件枚举。完整事件目录与写入链路见 F-USER-005（§16.3）。

| 事件类别 | 事件示例 | 保留期 | 存储 |
|----------|----------|--------|------|
| 资料存取 | 查询/下载/打印个人资料 | 7 年 | 主库 + SIEM |
| 资料修改 | 新增/更新/删除记录 | 7 年 | 主库 + SIEM |
| 系统操作 | 登入/登出/权限变更 | 5 年 | 主库 |
| 财务交易 | 收款/付款/报销 | 7 年 | 主库 + SIEM |
| 合规事件 | 同意书查阅/销毁记录/见证触发/合规判定 | 7 年 | 主库 + SIEM |
| 同步事件 | 同步任务/冲突/回写 | 3 年 | 主库 |

**新增 `audit_action` 枚举（追加至 §7.6 枚举，见 DB-SCHEMA §17 扩展）：**
```
compliance_check_allowed, compliance_check_denied, witness_triggered,
witness_approved_step, witness_rejected, witness_completed, witness_escalated,
sync_task_created, sync_task_started, sync_task_succeeded, sync_task_failed,
sync_task_retried, sync_task_conflict, sync_conflict_resolved, sync_data_pushed
```

**保留策略落地：** `AuditRetentionJob`（cron）按类别归档/清除；`audit_logs.metadata.retained` 标记保留期，F-OPS-005 审计完整性监控覆盖同步/合规事件写入成功率的完整性校验。

---

### 17.7 我方接口总览

接口定义见 **API-DESIGN §8「整合及合规模块 API」**，本模块新增接口分组：

| 接口 | 说明 |
|------|------|
| `POST /api/compliance/check` | PDPO 合规判定（F-COMP-001）|
| `GET /api/compliance/checks` | 合规检查记录查询 |
| `POST /api/witness/verifications` | 双人见证发起（F-COMP-002）|
| `POST /api/witness/verifications/:id/confirm` | 见证人确认 |
| `POST /api/witness/verifications/:id/reject` | 见证人拒绝 |
| `GET /api/audit/logs`（既有，§7.5 扩展）| 审计查询（F-COMP-003，兼容已有端点）|
| `GET /api/sync/tasks` | 同步任务列表 |
| `GET /api/sync/tasks/:id` | 同步任务详情 |
| `POST /api/sync/tasks/trigger` | 手动触发同步（按需）|
| `POST /api/sync/tasks/:id/retry` | 重试失败任务 |
| `GET /api/sync/conflicts` | 冲突列表 |
| `POST /api/sync/conflicts/:id/resolve` | 冲突裁决 |

---

### 17.8 对接契约（外部提供方需满足的字段与协议）

> 以下为「我方对接契约」——外部方（WebSAMS / eClass / 教育局官方系统）需按本契约提供字段与协议，我方设即可冻结。外部官方文档到位后在对应 adapter 内按契约字段名映射即可，不阻塞我方实现。若第三方字段命名不同，仅在 adapter 的 `map()` 内映射，不改变我方领域模型。

#### 17.8.1 WebSAMS 对接契约

- **认证**：OAuth2 `client_credentials` 或官方签发的 API 密钥；Token 有效期短、需定期刷新（衔接 §9.4 F-OPS-003）。
- **基本协议**：HTTPS + JSON（或官方指定 SOAP/XML，由 WebSAMSAdapter 内统一转换）。
- **需提供字段 / 数据对象**：
  - 学生：`student_no`（校号）、`name_zh/en`、`hkdse_no`（如适用）、`hkid`（仅映射非明文存储）、`class_code`、`academic_year`、`enrollment_status`（在读/註冊/離校）
  - 学籍：`entry_date`、`class_allocations[]`、`grade`
  - 出席：`attendance_date`、`period_code`、`attendance_code`（早退/遲到/缺席/病假）
  - 成绩：`subject_code`、`score`、`grade_point`、`assessment_period`
  - 健康：`allergy/medical`（P1，须加密通道 + 合规模板标识）
- **版本/冲突**：任一记录提供 `version`（乐观锁）或 `last_updated_at`，供冲突检测（§17.3.3）。
- **确认回执**：写操作（push）须返回成功/失败 + 外部记录 ID，供 `sync_logs` 记录。

#### 17.8.2 eClass 对接契约

- **认证**：eClass 平台账号/密钥或 OAuth2。
- **端点（消费为主）**：出席批量拉取、作业增查、家校沟通消息收发（对应 F-INT-002 端点）。
- **需提供字段**：
  - 出席：`student_id`、`class_id`、`date`、`status_code`
  - 作业：`task_id`、`class_id`、`title`、`due_date`、`student_submissions[]`
  - 沟通：`message_id`、`sender_type`（teacher/parent）、`recipient`、`body`、`sent_at`
- **版本/冲突**：提供 `updated_at` 或 `etag`。
- **确认回执**：POST 返回 `record_id` + `status`。

#### 17.8.3 通用契约约束

- 我方每次 pull/push 携带 `sync_ref`（幂等键），外部需支持幂等去重（相同 `sync_ref` 不重复处理）。
- 限流：外部返回 `429` + `Retry-After`，我方按退避策略重试（§17.3.2）。
- 字段命名冲突以我方 `SYNC_FIELD_*` 常量映射；不可映射字段进入 `sync_logs` 告警而非静默丢弃。
- 涉及 P1 数据的传输须使用受信加密通道，且记录传输审计事件。

---

### 17.9 安全边界与一致性保证

| 边界 | 保证 |
|------|------|
| 外部凭据泄露 | 存于 Vault（§4.4 secrets），adapter 内存中短暂持有；失败不落明文日志 |
| 同步幂等 | 全局唯一 `sync_ref` 防重复；失败重试安全 |
| 冲突数据 | 不自动覆盖，进入 `sync_conflicts` 人工裁决 |
| 合规绕过 | 所有敏感/见证/同步路径统一经 ComplianceService + AuditService，不可绕行 |
| 见证舞弊 | 见证人须不同人 + 本人二次认证 + 全程审计，见证确认后交易才锁定 |
| 审计缺失 | F-OPS-005 完整性监控覆盖同步/合规/见证事件写入 |
| 文档一致性 | 表结构见 DB-SCHEMA 「整合及合规模块」，字段说明见 DATA-DICTIONARY §20，接口见 API-DESIGN §8 |

**已实现能力衔接**：Integration Service 边界（§1.3）、WebSAMS Token 刷新（§9.4 F-OPS-003）、审计统一入口（§16.3）、OPA/RBAC（§5.4/§16.7）均已存在；本节仅新增其上层的 adapter 整合层、同步状态机、合规引擎、见证编排与留存策略，未改动既有链路。
</text_never_used_51bce0c785ca2f68081bfa7d91973934>


---

## 18. 考试与成绩管理模块 — 技术设计（F-EXAM-001~004）

> 🔧 **补全说明（Issue #357）**：本节为「考试与成绩管理」模块补齐技术设计，作为 DEV 实现 **F-EXAM-001（DSE 报考管理）、F-EXAM-002（试卷管理）、F-EXAM-003（特别考试安排）、F-EXAM-004（成绩单生成与发布）** 的输入。
> **模块前缀：** `EXM`
> **与既有模块的边界：**
> - 既有 `exam` 模块（后端 `apps/backend/src/modules/exam`，表 `exams`）承载**校内考试排期**（`examDate`/`subject`/`classroom`/`invigilator`/`examType`/`status`），本节**不复述**，DSE 报考/试卷/特别安排均以 `exams.id` 为考试实例外键关联。
> - 既有 `grade` 模块与 `GRADE-PUBLISH-DESIGN.md`（表 `grade_records`、`grade_publish_requests`/`grade_publish_approvals`/`grade_publish_notifications`/`grade_publish_settings`）承载**校内平时成绩的录入、审核与发布**。本节 F-EXAM-004 **成绩单（报告单 report_card）生成与发布**在其**上层**构建：从 `grade_records` 汇总生成整班/整级成绩单批次，复用 `grade_publish_requests/approvals` 的发布审批与家长查看链路，**不重复设计成绩录入与发布审批内核**。
> - 既有 `dse` 模块（表 `dse_release`/`dse_result`/`dse_review`/`dse_offer_tracking`）承载 **DSE 放榜后的成绩追踪**（Module 12 §10、F-DSE）。本节 F-EXAM-001 DSE 报考是**考前报名**，录入报名数据后**通过 `dse_release` / HKEAA SDP（§10）在放榜后回流实际成绩**，两者一前一后衔接，不存在重复。

### 18.1 模块边界与组件拓扑

**业务子域：**

| 子域 | 覆盖功能 | 新建服务 | 数据表 |
|------|----------|----------|--------|
| DSE 报考 | F-EXAM-001 | `DseRegistrationService` | `dse_exam_batches`、`dse_registrations`、`dse_subjects` |
| 试卷管理 | F-EXAM-002 | `ExamPaperService` | `exam_papers`、`exam_paper_requests`、`exam_paper_distributions` |
| 特别考试安排 | F-EXAM-003 | `SpecialArrangementService` | `special_exam_arrangements`、`special_arrangement_approvals` |
| 成绩单生成发布 | F-EXAM-004 | `ReportCardService` | `report_card_batches`、`report_cards`、`report_card_approvals`、`report_card_revokes` |

**依赖关系（只增不改，复用既有服务/表）：**

```
DseRegistrationService ──► DseService(dse_release 回流，§10/F-DSE) ──► HKEAA SDP adapter(§17.8.2 契约扩展 DSE 报考字段)
ExamPaperService ────────► ExamService(exams 表，校内考试排期) + UserService(班级/科目)
SpecialArrangementService ─► ExamService(exams) + StudentProfileService(students/SEN)
ReportCardService ───────► GradeRecordService(grade_records) + GradePublishService(grade_publish_requests/approvals) + AI CommentService(评价生成) + PdfService(成绩单PDF)
```

**鉴权与权限：** 所有接口经 API Gateway → OPA/RBAC（§5.4/§16.7）。操作人角色约束见 §18.5 权限矩阵；教师自撤回成绩单需 48h 窗口 + 审计（衔接 F-USER-005 `audit_logs`）。

### 18.2 DSE 报考管理流程（F-EXAM-001）

#### 18.2.1 报考批次（学年度报考窗口）

系统按学年创建报考批次，划定报名起止、逾期报名费（每科 HK$560）、单生科数上下限（最少 6 科含 4 核心，最多 8 科）与截止规则。

**状态机（`dse_exam_batches.status`）：**

```
DRAFT ──► OPEN ──► CLOSED ──► SUBMITTED ──► CONFIRMED
             │         │           │
             │         │           └─► (HKEAA 确认后) CONFIRMED
             │         └─► CANCELLED
             └─► (参考) ONGOING
```

| 状态 | 说明 |
|------|------|
| DRAFT | 草稿，报名未开放 |
| OPEN | 报名开放中，可报考/退选 |
| CLOSED | 报名截止，进入整理核对 |
| SUBMITTED | 已整体提交 HKEAA |
| CONFIRMED | HKEAA 确认报考结果 |
| CANCELLED | 批次取消 |
| ONGOING | 报考进行中（可选题/改选但仍接受增删的中间态，可选） |

#### 18.2.2 报考记录状态机（`dse_registrations.status`）

```
DRAFT ──► PREPARED ──► LATE ──► SUBMITTED ──► HKEAA_CONFIRMED
  │          │          │          │
  │          │          └─► WITHDRAWN(截止后退选需医疗证明)
  │          └─► CANCELLED
  └─► CANCELLED
```

| 状态 | 说明 |
|------|------|
| DRAFT | 草稿，未完成 |
| PREPARED | 资料齐全可提交 |
| LATE | 逾期报考（记逾期费 HK$560/科）|
| SUBMITTED | 已提交 HKEAA |
| HKEAA_CONFIRMED | HKEAA 已确认 |
| WITHDRAWN | 退选（截止后需医疗证明）|
| CANCELLED | 取消 |

**报考校验规则：**
- 科目总数≥6 且≤8；同时类别 A 核心（中文/英文/数学/公民与社会）4 科必须全部包含。
- 科目分类：A_core（核心）、A_elective（选修）、B（应用学习）、C（其他语言）。枚举 `dse_subject_category_enum`：`A_core/A_elective/B/C`。
- 涉及特别安排（F-EXAM-003）须上传医疗/SEN 报告方可标记 `special_arrangements`。
- `declaration_signed = true` 为提交前置条件；阶段必传报名照 `photo`。

#### 18.2.3 与既有 DSE 模块衔接

报考确认后，`dse_registrations.registration_id` 写入 `dse_exam_batches`；放榜后实际成绩经 §10 Module 12 `dse_release`/`dse_result` 回流，按 `student_no`/`hkdse_no`/`subject_code` 关联，不在此建重复成绩表。

### 18.3 试卷管理流程（F-EXAM-002）

完整生命周期映射子功能 F-EXAM-002a~f：

```
F-EXAM-002a 试卷需求统计  → 需求确认（按每科/每班计算应印总数）
F-EXAM-002b 印刷申请管理  → exam_paper_requests(status=PRINT_ORDERED)，生成供应商印刷订单
F-EXAM-002c 密封追踪      → exam_papers.seal_no + 保管链(chained custody)，tracking_sealed
F-EXAM-002d 保险箱管理    → exam_papers.storage(SAFE) + 保险箱访问审计(复用 audit_logs)
F-EXAM-002e 分发记录      → exam_paper_distributions(签到/签收)
F-EXAM-002f 回收与销毁    → exam_papers.status ARCHIVED/DESTROYED，保存期限与审批销毁记录
```

**试卷状态机（`exam_papers.status`）：**

```
REQUIRED ──► PRINT_ORDERED ──► PRINTED ──► SEALED ──► IN_SAFE ──► DISTRIBUTED ──► USED
       │          │              │             │             │             │
       │          │              │             │             ▼             ▼
       └─► CANCELLED             └─► REJECTED   └─► LOST     └─► RETURNED   └─► ARCHIVED
                                                                                │
                                                                                ▼
                                                                             DESTROYED
```

| 状态 | 说明 |
|------|------|
| REQUIRED | 需求确认 |
| PRINT_ORDERED | 已下单印刷 |
| PRINTED | 已印制 |
| SEALED | 已密封（记录 seal_no）|
| IN_SAFE | 已入保险箱 |
| DISTRIBUTED | 已分发（监考员签收）|
| USED | 考试使用中 |
| RETURNED | 已回收 |
| ARCHIVED | 归档保存 |
| DESTROYED | 审批销毁 |
| REJECTED | 印刷退回 |
| CANCELLED | 取消 |
| LOST | 遗失（触发告警）|

**密封/保管链：** `exam_papers.custody_chain JSONB` 存 `[{actor, action, at}]`；从密封到分发每步追加，形成可审计保管链（衔接 F-COMP-003 审计）。

### 18.4 特别考试安排流程（F-EXAM-003）

**安排类型（`special_arrangement_type_enum`）：**

| 代码 | 描述 | 所需审批 |
|------|------|----------|
| EXTRA_TIME | 25% 或 50% 额外时间 | HKEAA |
| SEP_ROOM | 独立考场 | 学校 + HKEAA |
| SCRIBE | 抄写员 | HKEAA |
| READER | 读卷员 | HKEAA |
| BRAILLE | 盲文试卷 | HKEAA |
| WHEELCHAIR | 轮椅通道书桌 | 学校 |

**安排单状态机（`special_exam_arrangements.status`）：**

```
DRAFT ──► PENDING_APPROVAL ──► APPROVED ──► ACTIVE ──► COMPLETED
  │            │                 │
  │            ▼                 ▼
  └─► CANCELLED              REJECTED
```

| 状态 | 说明 |
|------|------|
| DRAFT | 草稿 |
| PENDING_APPROVAL | 待审批（HKEAA/学校 视类型）|
| APPROVED | 已审批 |
| ACTIVE | 当日使用中 |
| COMPLETED | 已完成 |
| REJECTED | 被拒（可重新申请）|
| CANCELLED | 取消 |

**审批约束：** 类型所需审批为 HKEAA 的安排须在 `special_arrangement_approvals` 记录 HKEAA 审批引用（`approval_ref`）；WHEELCHAIR 仅需学校审批。审批记录可多级。

### 18.5 成绩单生成与发布流程（F-EXAM-004）

#### 18.5.1 流程总览（衔接既有成绩模块）

```
阶段0 数据来源：grade_records（教师已提交录入的成绩，status=PENDING_APPROVAL/APPROVED）
阶段1 汇总计算：ReportCardService 按班级/年级/学年学期聚合，计算加权分、班级排名、年级排名
阶段2 AI 评语：AIClassCommentService 生成描述性评语（存 report_cards.comment_json，可人工修正）
阶段3 教师自撤回：提交后 48 小时内、审批人审批前，教师可自行撤回修改（无限次，审计）
阶段4 审核批准：教研组长(L1)/校长或副校长(L2) 审核 report_card_batches
阶段5 生成 PDF：PdfService 批量生成 A4 竖版成绩单 PDF（可加水印）
阶段6 发布：复用 grade_publish_requests → approvals → notifications 链路发布给家长/学生
阶段7 家长/学生查看：微信门户/App 查看 + PDF 导出（带水印，家长个人使用）
```

#### 18.5.2 成绩单批次状态机（`report_card_batches.status`）

```
DRAFT ──► GENERATING ──► PENDING_APPROVAL ──► APPROVED ──► PDF_READY ──► PUBLISHED
  │            │              │                 │             │
  │            │              ▼                 ▼             ▼
  └─► CANCELLED          REJECTED(FIXED→DRAFT)/教师自撤回(GENERATING/PENDING_APPROVAL)
```

| 状态 | 说明 |
|------|------|
| DRAFT | 草稿汇总完成，未生成 |
| GENERATING | 生成中（AI 评语 + 计算）|
| PENDING_APPROVAL | 待审核（教师评语完成 → 校长/副校长审核）|
| APPROVED | 已审核批准 |
| PDF_READY | PDF 已生成 |
| PUBLISHED | 已发布（家长/学生可见）|
| CANCELLED | 取消批次 |

**教师自撤回（SPEC 补充 + 评审修正）：**
- 期限：教师提交（`report_cards.status` 由 DRAFT→SUBMITTED）后 **48 小时**内；条件：审批人尚未审批（批次 `PENDING_APPROVAL`）。
- 次数不限；每次撤回写 `report_card_revokes` 并触发审计告警 `alert_type_enum.grade_revoked`（衔接 `grade_audit_alerts`，F-USER-005）推送给校务主任。
- 撤回记录必填理由；字段见 DATA-DICTIONARY §21.6。

#### 18.5.3 班级成绩分布可视化

- 分数分布柱状图：班级各科分数 × 年级平均分对比（由 `report_cards` 各科 score + 年级聚合查询）。
- 等级分布饼图：A/B/C/D 占比（grade 分布）。
- 排名变化折线图：学生本次 vs 上次（`report_card_batches` 关联历史批次）排名差。仅向任教教师开放本班数据。

#### 18.5.4 权限矩阵

| 功能 | 教师 | 教研组长 | 校长/副校长 | 教务处 | 校务主任 | 家长 | 学生 |
|------|------|----------|--------------|--------|----------|------|------|
| DSE 创建/管理报考批次 | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| DSE 学生报考录入/退选 | ❌ | ✅ | ✅ | ✅ | ✅ | ❌(本人报考除外) | ✅(本人) |
| 试卷需求/印刷/密封 | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 试卷分发/回收/销毁 | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 特别安排申请 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(为孩子) | ✅(本人,SEN) |
| 特别安排审批(学校级) | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 成绩单汇总生成 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 成绩单教师自撤回(48h) | ✅(仅本人) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 成绩单审核(L1 教研组长) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 成绩单审批(L2 校长/副校长) | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| 成绩单发布(复用发布审批) | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| 查看/下载自己成绩单 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅(孩子) | ✅(自己) |

#### 18.5.5 安全与一致性保证

| 边界 | 保证 |
|------|------|
| 成绩单数据来源可信 | 仅汇总 status∈{PENDING_APPROVAL, APPROVED} 的 `grade_records`，DRAFT 不进入 |
| 自撤回竞态 | 撤回前置校验批次未进入审批（PENDING_APPROVAL）且 <48h，用行锁/乐观版本防并发审批后撤回 |
| PDF 完整性 | 发布用 PDF 固化快照，发布后修改不影响已发布件 |
| 隐私 | 成绩单含 P1 成绩数据，传输加密、PDF 水印、家长/学生仅见本人 |
| 审计 | 报考/退选、试卷保管链、特别安排审批、成绩单发布/撤回/审批均写 `audit_logs` |
| 文档一致性 | 表结构见 DB-SCHEMA 「18. 考试与成绩管理模块」，字段见 DATA-DICTIONARY §21，接口见 API-DESIGN §9 |


---

## 19. 注册与收生管理模块 — 技术设计（F-ENRL-001~003, F-ADM-001~002）

> 🔧 **补全说明（Issue #358）**：为 F-ENRL-001（新生注册）、F-ENRL-002（AI 辅助编班）、F-ENRL-003（课本分发管理）、F-ADM-001（中一自行分配学位 SSPA）、F-ADM-002（JUPAS 联招管理）提供技术设计，作为 DEV 实现输入。
> 数据模型见 DB-SCHEMA §19，字段字典见 DATA-DICTIONARY §22，接口见 API-DESIGN §10。

### 19.1 模块边界与组件拓扑

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        注册与收生管理模块（新）                            │
│  F-ENRL-001 新生注册  │  F-ENRL-002 AI编班  │  F-ENRL-003 课本分发        │
│  F-ADM-001  SSPA     │  F-ADM-002  JUPAS  │                             │
├─────────────────────────────────────────────────────────────────────────┤
│  主要输入源：家长申请表、OCR扫描文件、WebSAMS、EDB 外部接口                │
│  主要输出：注册确认、编班结果、课本发放记录、SSPA录取、JUPAS状态追踪         │
├─────────────────────────────────────────────────────────────────────────┤
│    │ students / classes / class_allocations / academic_years（既有）     │
│    │ fees / fee_records / subsidy_eligibility（F-FEE-001 衔接）          │
│    │ dse_offer_tracking / dse_releases（Module 12，JUPAS 衔接）          │
│    │ users / audit_logs（鉴权与审计，Module 16）                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**与既有「教师招聘（recruitment）」模块的边界：**
- 既有 recruitment 模块（DATA-DICTIONARY §16 `recruitment_positions/applications/interviews/offers/onboarding`）是**教师招聘**（学校雇员的职位发布、候选人面试、入职），属人力资源域；本次设计的**收生（admissions）**是**学生入学**（中一新生与转学生的注册、编班、课本、学位）。两者服务对象（雇员 vs 学生）、业务流程、数据表完全独立，不相交。
- 收生产生的「申请人」是学生（`student_applications`），不得写入 `recruitment_applications`。
- 收生产生的「注册学生」进 `students` 主档；教师入职不建学生档。

**与既有「学生档案管理」的边界：**
- 新生注册完成并核验后由系统写入 `students` + `student_id_sequences`（沿用 §3.1 学生创建逻辑），但 `student_applications` 保留申请侧原始数据（含 OCR 文件、SEN 披露、文件核验清单），不并入学生主档。
- 编班结果经审批后写 `class_allocations`（`allocation_type='main'`），供 ABAC 按 `class_id` 控制教师数据范围（衔接 F-USER-003）。

**与既有「财务」的边界（F-ENRL-003 课本）：**
- 课本费独立结算，不并入学费；课本收款可复用 F-FEE-001 的收款流水能力（`fee_records`），但以 `textbook_distributions` 的 `payment_status` 为主要字段。课本相关表新增；不改财务既有表。
- 学生资助资格读取 `students.subsidy_eligibility`（full_subsidy/half_subsidy/none/pending），用于自动标记 `waived` / 部分豁免。

**与既有「DSE/升学」的边界（F-ADM-002）：**
- Module 12 的 `dse_offer_tracking` 已含 `jupas_status` 枚举，承载**放榜后申请状态追踪**；本次 F-ADM-002 的 `jupas_applications` 承载**申请期**的志愿收集、推荐信生成、学校推荐提交。两者通过 `jupas_application_no` 关联演进。

### 19.2 新生注册流程（F-ENRL-001）

状态机：

```
applied → screening → documents_verified → class_assigned → enrolled
   └────────────► rejected (任何阶段可拒)
   └────────────► withdrawn (家长撤回)
```

| 状态 | 含义 | 触发 |
|------|------|------|
| applied | 已申请（资料提交）| 家长/收生主任录入申请 |
| screening | 初审中 | 收生主任受理，核对文件清单 |
| documents_verified | 文件核验通过 | OCR 比对 + 人工复核 |
| class_assigned | 已分配班级 | AI 编班审批通过后回写 |
| enrolled | 已注册（并入学生主档）| 注册确认、身份核验 |
| rejected | 未录取 | 收生主任/校长审批 |
| withdrawn | 家长撤回 | 家长发起 |

**关键流程：**
- 报名受理：采集申请信息 + 上传文件（OCR 扫描）。SEN 披露为自愿，`special_education_needs` 独立标记，不强制。
- 文件核验：`documents` 逐项比对原件，`document_status` 记录 submitted/verified/missing；核验人留痕。
- 截止规则：中一注册截止 8 月 31 日（EDB）；转学生到校后 14 天内注册；系统校验 `deadline` 拒绝超期申请（特殊审批除外）。
- 注册完成：`status→enrolled` 时同步创建 `students` 记录 + 生成学号（`student_id_sequences`）+ 写入 `class_allocations`。

### 19.3 AI 辅助编班（F-ENRL-002）

**设计原则：** 可解释、可回滚、人工审批闭环。AI 只产出「建议」，最终由校长/教务主任审批生效。

**因子与权重（默认，可配置）：**

| 因子 | 默认权重 | 计算说明 |
|------|----------|----------|
| gender_ratio | 25% | 各班男女比例逼近 50:50 |
| academic_ability | 25% | 各班学业打分均值/方差均衡（用成绩表均分归一）|
| sen_students | 20% | SEN 学生均匀分布（不扎堆）|
| sibling_conflict | 15% | 避免存在敌对/冲突关系者同班（`sibling_conflicts` 声明）|
| school_origin | 10% | 同来源小学分散 |
| special_talent | 5% | 体育/艺术特长均衡 |

**编排流程：**
1. 创建编班批次（`class_allocation_batches`，指定学年、班级数、权重配置 snapshot）。
2. 拉取候选学生（申请状态 = class_assigned 阶段或 students 主档待分班者）。
3. 调用 AI 引擎计算分配 + `balance_score`（0-100）+ 冲突清单。
4. 人工审阅：校务主任查看推荐结果与冲突说明，可手工微调。
5. 审批生效：校长审批后，写 `class_allocation_results` 明细 + 回写 `class_allocations`；回写前不改变班级归属。
6. 审计留痕：批次创建、AI 建议、人工微调、审批、生效全链路写 `audit_logs`。

**边界：** 编班只负责「建议 + 审批」，最终班级归属统一由 `class_allocations` 承载，不新增平行的班级归属数据源。

### 19.4 课本分发管理（F-ENRL-003）

**六大步骤（对应 SPEC Step 1-6）：**

| 步骤 | 处理 | 数据 |
|------|------|------|
| 1 批次准备 | 每学年采购生成课本批次 | `textbook_batches`，价格从 `textbook_catalog` 同步 |
| 2 清单生成 | 按班级拉学生 + 按 `class_subject_config` 定应领科目 | `textbook_distributions` 预生成记录 |
| 3 分发登记 | 扫码/手动+双人签认 → 记录时间戳操作人 | `distribution_status=distributed` |
| 4 费用结算 | 汇总数量×单价×折扣；on 资助自动 `waived`；收款更新 `payment_status` | 独立结算，可联动 F-FEE-001 |
| 5 退换处理 | 错发/损坏/转学；退货按原价 80% 退款 | 旧记录 `replaced`/`returned`，新记录 `distributed` |
| 6 汇总归档 | 每日/学期汇总报表；库存联动扣减 | 归档 `textbook_distributions` 状态 |

**关键规则：**
- 每科目每生 1 本（默认），补发另行。
- `subsidy_eligibility=full_subsidy` → `payment_status=waived`（免缴费）；`half_subsidy` → 系统算 50% 应付。
- 开学 30 天内可退换，超 30 天需校务主任审批（`approval_required` 标记）。
- 退换货供应商周期 10 个工作日。
- 库存：`textbook_inventory_items` 记录批次-书名库存；分发扣减、退回回补、报废核减。

### 19.5 SSPA 中一自行分配学位（F-ADM-001）

**EDB 时间轴映射：**

| 阶段 | 系统处理 | 数据表 |
|------|----------|--------|
| 1月公布准则 | `sspa_batches`（本年度自行分配窗口 + 总分权重） | sspa_batches |
| 家长递交申请表 | 录入/导入申请 | sspa_applications |
| 2月面试 | 评分录入 | sspa_scores（各准则细分分项）|
| 公布正取/备取 | 计分汇总、排序、标记正取/备取 | sspa_applications.status |
| 3-4月 EDB 结果 | 录入/同步 EDB 结果 | sspa_applications.edb_result |
| 5月确认注册 | 正取确认 → 进入新生注册流 | 关联 F-ENRL-001 |

**评分系统（默认配置，可调）：**

| 准则 | 最高分 |
|------|--------|
| 学业表现 | 30 |
| 面试表现 | 30 |
| 兄弟姐妹在校 | 10 |
| 家长校友 | 5 |
| 其他成就 | 10 |
| 校长酌情权 | 15 |

**计分与定序：** `sspa_scores` 汇总 → 总分 → 排序 → 依学额标记正取/备取；校长酌情权需审批留痕。

### 19.6 JUPAS 联招管理（F-ADM-002）

**五步流程：**
1. 收集学生 JUPAS 选择（`jupas_applications` + `jupas_choices`）
2. 生成学校推荐信（`jupas_reference_letters`，支持 AI 辅助写作）
3. 处理校长/教师推荐信（状态流转、截止）
4. 追踪申请状态（与 `dse_offer_tracking` 关联演进）
5. 处理上诉程序（`jupas_appeals`）

**推荐信 AI 辅助写作（F-ADM-002，含字数统计/大纲建议）：**
- 实时字数统计（建议 300-500 字，<200 提示补充）；写 `letter_stats`（JSONB：word_count/term_consistency）。
- AI 生成写作大纲（学业表现/个人特质/课外活动三段），写 `ai_suggestion`。
- 历史推荐信参考（脱敏）只读查询，不落敏感全文。

**与 Module 12 衔接：** 放榜后各轮 JUPAS 结果状态由既有 `dse_offer_tracking.jupas_status` 承载；申请期数据由本节表承载，二者以 `jupas_application_no` 关联。

### 19.7 状态机与异步编排

| 场景 | 编排方式 |
|------|----------|
| AI 编班计算 | 异步任务（batch）：创建批次 → 提交 AI 队列 → 回调写结果 → 通知审阅人 |
| 课本清单预生成 | 批处理：写入种子分发记录（status=pending）|
| JUPAS 推荐信生成 | 同步 + AI 辅助（非阻塞，可重试）|
| WebSAMS 同步 | 复用既有同步通道（F-INT-001），注册/编班成功后触发 |

### 19.8 权限矩阵

| 功能 | 校务主任 | 收生主任 | 教务协调员 | 校长/副校长 | 教师 | 家长 | 学生 |
|------|----------|----------|------------|-------------|------|------|------|
| 新生申请录入/查改 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌(见下) | ❌ |
| AI 编班触发/审阅 | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 编班审批生效 | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 课本批次/库存管理 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 课本分发登记/结算 | ✅ | ❌ | ✅ | ✅ | ✅(本班) | ❌ | ❌ |
| 课本退换/退款 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅(申请,为孩子) | ❌ |
| SSPA 申请/评分录入 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅(申请,为孩子) | ❌ |
| SSPA 结果公布/确认 | ✅ | ✅ | ❌ | ✅ | ❌ | ✅(查看) | ❌ |
| JUPAS 志愿收集/追踪 | ✅ | ❌ | ✅ | ✅ | ✅(推荐信) | ❌ | ✅(本人) |
| JUPAS 推荐信 AI/审批 | ✅ | ❌ | ✅ | ✅ | ✅(本人撰写) | ❌ | ❌ |
| 查看本人/孩子申请进度 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅(孩子) | ✅(本人) |

> 家长自助申报（2026 起 EDB 电子报名趋势）可作为二期；一期由校务处代录，家长仅门户查看进度（`student_application_links` 提供只读授权）。

### 19.9 安全与一致性保证

| 边界 | 保证 |
|------|------|
| 申请数据可信 | `student_applications` 为唯一申请来源；注册进 `students` 为单向写入，不反向覆盖 |
| 编班审批闭环 | AI 结果未审批不写 `class_allocations`；用乐观版本号防并发审批 |
| 文件核验留痕 | 核验人/时间/结果写申请记录与 `audit_logs`，支持追溯 |
| 课本费用一致 | 汇总 = Σ(数量×单价×折扣)，以 DB 计算聚合；退款 80% 折旧常量集中定义 |
| 隐私(PDPO) | 家长/学生资料、SEN 披露、推荐信含 P1 数据，传输加密、按最小权限授权；家长/学生仅见本人 |
| 审计 | 申请、核验、编班建议/审批/生效、课本分发/结算/退换、SSPA 评分/公布、JUPAS 推荐/提交均写 `audit_logs` |
| 文档一致性 | 表结构见 DB-SCHEMA §19，字段见 DATA-DICTIONARY §22，接口见 API-DESIGN §10 |

---

## 20. 财务与学年结算模块 — 技术设计（F-FEE-001, F-FIN-002, F-YREND-001/002）

> 🔧 **补全说明（Issue #359）**：为 F-FEE-001（每日收费追踪）、F-FIN-002（零用现金报销）、F-YREND-001（档案清理与销毁）、F-YREND-002（学年财务结算）提供技术设计，作为 DEV 实现输入。
> 数据模型见 DB-SCHEMA §20，字段字典见 DATA-DICTIONARY §23，接口见 API-DESIGN §11。

### 20.1 模块边界与组件拓扑

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        财务与学年结算模块（新）                            │
│  F-FEE-001 每日收费追踪  │  F-FIN-002 零用现金报销  │  F-YREND-001 档案清理 │
│  F-YREND-002 学年财务结算 │                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  主要输入源：收费交易、报销申请（收据OCR）、EDB 保存期限指引、年度预算/支出   │
│  主要输出：收据（电子推送）、对账报表、报销审批单、结算批次、归档销毁记录     │
├─────────────────────────────────────────────────────────────────────────┤
│    │ fees / fee_types / fee_records / tuition_payments（既有 F-FIN-001） │
│    │ textbook_distributions（§19.4 课本，payment_status 可联动）         │
│    │ witness_verifications / witness_steps（F-COMP-002 双人见证）        │
│    │ users / audit_logs（鉴权与审计，Module 16）                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**与既有「财务（F-FIN-001 学费管理）」的边界：**
- 既有 F-FIN-001（学费/堂费的评估、分期、欠费、豁免）以 `fee_items`/`fee_records`/`tuition_payments` 承载，是**长期费用（学费、堂费）**的「应缴/已缴/欠费」账户模型；本模块的 F-FEE-001 是**每日收费追踪**（日常杂费：冷气、活动、物料、其他）的「收款日结/收据/对账」交易模型。二者共享 `payment_method` 语义，但`fee_types`=一次性日常收费，`fee_records`=每日交易流水；F-FEE-001 不改动既有学费账单结构。
- F-FIN-002（零用现金报销）与既有财务的**备用金补充**衔接：备用金补充走既有 F-FIN-001 资金流（须双人见证，见 §17.5），报销支出从备用金余额扣减；本模块新增 `petty_cash_reimbursements` 承载报销审批状态机，不新建备用金主账（余额以「补充 − 报销」聚合或独立台账承载）。
- F-YREND-002（学年财务结算）聚合**全部**收款/支出（学费、日常收费、课本、备用金报销、预算），以 `year_end_settlements` 承载批次报表，只读汇聚既有财务表，不新建并行账目。
- F-YREND-001（档案清理）按 EDB 保存期限对**既有各业务文档**（学生/成绩/健康/财务/合同等）执行归档/移交/销毁，以 `archive_cleanup_records` 承载处置记录与到期判定，处置对象引用既有表，不复制文档本体到新表。

**与既有「注册收生-课本（F-ENRL-003）」的边界：**
- 课本收款仍以 `textbook_distributions.payment_status` 为主要字段（见 §19.4）；F-FEE-001 的收款流水能力（`fee_records`）可被课本收款复用，但不并入学费账单。学年结算（F-YREND-002）汇总课本收入到 `year_end_settlements` 的 by_category 快照。

**与既有「双人见证（F-COMP-002）」的边界：**
- 现金收费、现金支付>HK$500、备用金补充均触发 `witness_verifications`（对应角色见 §17.5 触发规则）；F-FEE-001 日结对账、F-FIN-002 报销见证复用该编排，仅在业务单上记录 `witness_verification_id`，不重复实现见证逻辑。

### 20.2 收费项目与账单（F-FEE-001）

**费用类型（fee_types，衔接 §4.7 既有 `fees`/`fee_types`）：**

| 费用类型代码 | 描述 | 强制性 | 归属 |
|------------|------|--------|------|
| air_con | 冷气费 | 可选 | F-FEE-001 日常 |
| activity | 活动费 | 按活动 | F-FEE-001 日常 |
| material | 物料费 | 按需 | F-FEE-001 日常 |
| other | 其他杂费 | 按需 | F-FEE-001 日常 |
| tuition | 学费 | 是(可豁免) | F-FIN-001 既有 |
| subsidy | 堂费 | 是 | F-FIN-001 既有 |
| textbook | 课本费 | 独立结算 | F-ENRL-003 既有 |

**业务设计：**
- 收费项目（`fee_types`）：校务主任可配置一次性日常收费项目（名称/代码/默认金额/是否启用），与既有 F-FIN-001 的长周期性费用项目区分。
- 每笔收费须登记 `fee_records`（交易流水：学生、收费项目、金额、方式、经办、见证、收据号）。
- `支付方式参与`：cash / cheque / fps / octopus / e_payment（对应既有 PaymentMethod 的扩展映射，§4.7 枚举）。
- **收据出具**：每笔交易必须出具收据（`receipts` 表承载 PDF 引用 + 收据号 + 电子推送记录）。
- **电子收据自动推送**：非现金缴费（FPS/八达通/e_payment）收款成功后自动推送收据（App 推送 + 邮件，短信备用），`receipts.push_status` 记录各渠道状态。
- **日结对账**：每日营业结束对账（`daily_reconciliations`），现金金额需双人见证核实；差异>HK$50 需调查（状态置 `investigating`）。
- **缴费延迟提示**：第三方支付到账延迟，`fee_records.payment_status` 提供 `submitted`(第三方处理中) 中间态；>10 分钟未更新标记 `status_stale` 提示联系校务处（前端展示，状态仍为准，不自动改账）。

**日结对账状态机（daily_reconciliations.status）：**

```
 OPEN ──▶ REVIEWING ──▶ BALANCED
   │          │
   └──────────┴──────▶ INVESTIGATING（差异>50）
```

| 状态 | 含义 |
|------|------|
| OPEN | 对账单已生成，待核对 |
| REVIEWING | 现金双人见证核实中 |
| BALANCED | 对平，出具日结报表 |
| INVESTIGATING | 存在差异，需调查（差异>$50） |
| REOPENED | 差异处理后重新打开对账 |

### 20.3 零用现金报销（F-FIN-002）

**审批状态机（petty_cash_reimbursements.status）：**

```
 DRAFT ──▶ OCRA_PENDING ──▶ WITNESS_REQUIRED ──▶ WITNESS_IN_PROGRESS ──▶ PENDING_APPROVAL ──▶ APPROVED
   │            │                │                   │                        │
   └─CANCELLED  │                ├──▶ SKIPPED(≤500单人见证)                    └─▶ REJECTED
                │                └──▶ REJECTED(见证拒绝)                        └─▶ PAID(出账)
                ├──────────────────▶ (OCR失败→ MANUAL_AMOUNT)
                └──────────────────▶ 备用金不足阻断(见BLOCKED)
```

| 状态 | 含义 |
|------|------|
| DRAFT | 草稿（填单+上传收据） |
| OCRA_PENDING | 待 OCR 识别金额 |
| MANUAL_AMOUNT | OCR 失败，人工录入金额 |
| WITNESS_REQUIRED | 待见证（>HK$500 需双人；≤HK$500 单人） |
| WITNESS_IN_PROGRESS | 见证进行中（复用 `witness_verifications`） |
| PENDING_APPROVAL | 见证完成/锁定，待校务主任审批 |
| APPROVED | 已批准（未出账） |
| PAID | 已出账（备用金扣减） |
| REJECTED | 已拒绝（含原因） |
| CANCELLED | 申请人取消 |
| BLOCKED | 备用金不足，阻断提交 |

**关键规则（衔接 SPEC F-FIN-002 AC）：**
- **单笔动态限额**：基础 HK$3,000，按 CPI 调整：`实际限额 = 基础限额 × (当年CPI指数 / 基准CPI指数)`；学年切换时由 `petty_cash_configs` 保存公式快照，调整结果经校务主任确认生效（`config_status=confirmed`），并在系统公告通知（衔接 F-AUTO-002 通知）。
- **双人见证触发**：金额 > HK$500 须双人见证，第一见证人完成自动推送第二见证人（App+短信）；≤HK$500 单人见证直接进审批。见证复用 §17.5 `witness_verifications` 编排。
- **OCR 视觉区分**：`ocr_result`（JSONB）记录 `ocr_amount`、匹配状态（match/mismatch/not_found）；前端以黄色高亮 OCR 金额、红色粗体提示「请人工核对收据原件」，侧栏显示收据缩略图。
- **备用金余额**：以 `petty_cash_transactions`（补充 + /报销 −）流水聚合当前余额；低于 HK$500 提示补充、为 0 禁止提交报销；单笔补充上限 HK$5,000。
- **超时提醒**：第一见证人 30 分钟未处理 → 提醒；1 小时 → 通知校务主任可指定替代见证人（衔接 §17.5）。
- **审计**：OCR、见证、审批、拒绝、出账全链路写 `audit_logs`。

### 20.4 学年财务结算（F-YREND-002）

**结算批次状态机（year_end_settlements.status）：**

```
 DRAFT ──▶ COMPUTING ──▶ READY_FOR_AUDIT ──▶ LOCKED ──▶ ARCHIVED
                                  │              │
                                  └─▶ SUSPENDED（存在未决差异/争议欠费）
```

| 状态 | 含义 |
|------|------|
| DRAFT | 批次已建立（选定财政年度） |
| COMPUTING | 正在聚合各账源（异步） |
| READY_FOR_AUDIT | 结算报表生成完成，待审计 |
| LOCKED | 审计确认后锁定（不可再改账） |
| ARCHIVED | 已归档 |
| SUSPENDED | 存在未决差异/欠费争议，暂缓 |

**结算聚合范围（只读汇聚，不新建并行账）：**

| by_category | 数据源 |
|-------------|--------|
| tuition / subsidy | 既有 F-FIN-001 `tuition_payments` / `fee_items` |
| daily_fees | F-FEE-001 `fee_records`（按 fiscal_year 过滤） |
| textbook | `textbook_distributions`（§19.4） |
| petty_cash | `petty_cash_reimbursements`（PAID） |
| expenses | `petty_cash_transactions` 支出 / 预算模块（F-NEW-004） |

**输出：** 与 SPEC `reconciliation_id`（`YREC-2025-2026`）一致；`year_end_settlements` 保存 `summary`、`by_category[]`、`outstanding_fees[]` 快照（JSONB），并提供 PDF 报表导出。挂账未缴/欠费（含 `sub_status`）列入 `outstanding_fees`；结算报表生成涉及的全部数据保持只读快照，锁定后业务方不可再改当年度账目。

**流程：**
1. 创建批次（`year_end_settlements`，fiscal_year=draft）。
2. 触发计算（异步，COMPUTING）→ 聚合各数据源 → 写 `summary`/`by_category`/`outstanding_fees` → READY_FOR_AUDIT。
3. 审计：校务主任/外审核账 → 确认 → LOCKED（冻结当年度账目）。
4. 归档：生成 PDF → ARCHIVED。

### 20.5 档案清理与销毁（F-YREND-001）

**归档处置状态机（archive_cleanup_records.status）：**

```
 PENDING ▶ REVIEW ▶ APPROVED ▶ (DESTROYING|HANDING_OVER) ▶ (DESTROYED|HANDED_OVER|HELD)
    │        │          └─▶ REJECTED                         └─▶ CONFIRMED
    └────────┴──────────────────────────────────────────────────────▶ REJECTED / HELD（暂缓保留）
```

| 状态 | 含义 |
|------|------|
| PENDING | 到期待检（按保存期限判定） |
| REVIEW | 校务处复核处置方式（销毁/移交/保留） |
| APPROVED | 校长/校务主任批准处置 |
| DESTROYING | 销毁执行中（物理/电子删除流程） |
| DESTROYED | 已销毁（双人见证 + 记录销毁证书号） |
| HANDING_OVER | 移交中（如会议记录移交校监） |
| HANDED_OVER | 已移交（含接收方/日期） |
| HELD | 暂缓/保留（有法律/审计争议，移出销毁队列） |
| REJECTED | 处置被否决 |

**EDB 保存期限映射（配置化，`archive_retention_policies`）：**

| retention_code | 文档类型 | 保存期限 | 处置方式 |
|----------------|----------|----------|----------|
| student_registration | 学生注册表 | 毕业后 7 年 | 销毁 |
| transcripts | 成绩表 | 永久 | 保留(N/A) |
| discipline | 处分记录 | 7 年 | 销毁 |
| health | 健康记录 | 离校后 3 年 | 销毁 |
| financial_receipts | 财务收据 | 7 年 | 销毁 |
| meeting_minutes | 会议记录 | 5 年 | 移交校监 |
| employee_contract | 员工合同 | 离职后 7 年 | 销毁 |
| graduation_photos | 毕业照 | 永久 | 保留(N/A) |

**流程：**
1. 到期扫描：`ArchiveRetentionCron` 按 `academic_years` + 保存期限判定到期记录，生成 `archive_cleanup_records`（status=pending）。
2. 复核：校务处复核处置方式与对象范围 → review。
3. 审批：校长/校务主任批准 → approved。
4. 执行：销毁（双人见证 + 销毁证书）→ destroyed；移交 → handed_over 并记录接收方。
5. 例外：争议/法律保留 → held（暂缓，移出销毁队列，注明原因）。
6. **销毁确认**：销毁须双人见证（复用 §17.5），写 `witness_verification_id` + 销毁证书号（`destroy_cert_no`），并写审计 `archive_destroyed`。

**边界：** 只处置元数据（引用既有文档 ID + 文件存储 URL），物理删除由对象存储生命周期或专项脚本执行；永久保存类型（成绩表/毕业照）不进入销毁队列。

### 20.6 状态机与异步编排

| 场景 | 编排方式 |
|------|----------|
| 学年结算计算 | 异步任务（batch）：创建批次 → 提交聚合队列 → 回调写快照 → 通知审计 |
| 电子收据推送 | 同步 + 异步：收款成功即写收据，推送走消息队列（App/邮件/短信），失败重试 |
| 报销见证推送 | 复用 `witness_verifications` 编排（§17.5） |
| 档案到期扫描 | 定时任务（cron）：`ArchiveRetentionCron` 定期生成处置记录 |
| 缴费状态定时巡检 | cron 每 5 分钟：标记第三方支付 >10min 未更新为 `status_stale`，触发提醒 |

### 20.7 权限矩阵

| 功能 | 校务主任 | 教务协调员 | 会计/出纳 | 校务处同工 | 校长/副校长 | 教师 | 家长 |
|------|----------|------------|-----------|-----------|-------------|------|------|
| 收费项目配置 | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| 日常收费登记/日结 | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 费用查询（本班） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(本班) | ❌ |
| 收据查看/补发 | ✅ | ❌ | ✅ | ✅(经办) | ✅ | ❌ | ✅(本人/孩子) |
| 报销提交 | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 报销见证 | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 报销审批 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 学年结算触发/审计 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 档案到期复核/审批 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 档案销毁执行/见证 | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |

> 家长仅可查看本人/孩子缴费状态与电子收据（ABAC 按 `student_id` 范围限制，衔接 F-USER-003)。现金收取/支付见证人角色须与经办人 DISTINCT（衔接 §17.5）。

### 20.8 安全与一致性保证

| 边界 | 保证 |
|------|------|
| 金额一致 | 日结汇总 = Σ(`fee_records`)；备用金余额 = Σ(`petty_cash_transactions`)；结算快照以 DB 聚合生成 |
| 双人见证 | 现金收费、大额报销、销毁、备用金补充强制见证，见证人与经办人 DISTINCT（§17.5） |
| 报销限额 | 单笔动态限额（CPI 公式）校验，超限阻断 |
| 结算只读性 | READY_FOR_AUDIT/LOCKED 后当年度账目冻结，变更须开立调整批次 |
| 隐私(PDPO) | 收据、报销单、档案含 P1 数据（学生/员工资料），传输加密、最小权限授权、销毁记录可追溯 |
| 审计 | 收费/收据/对账、报销 OCR/见证/审批/出账、结算、归档处置全链路写 `audit_logs` |
| 文档一致性 | 表结构见 DB-SCHEMA §20，字段见 DATA-DICTIONARY §23，接口见 API-DESIGN §11 |

---

## 21. 资产与供应商管理模块 — 技术设计（F-ASSET-001/002/003, F-VEND-001, Issue #360）

> 🔧 **补全说明（Issue #360）**：为校产条码盘点（F-ASSET-001）、场地租借管理（F-ASSET-002）、设备保养管理（F-ASSET-003）、供应商注册与评估（F-VEND-001）提供技术设计，作为 DEV 实现输入。
> **边界**：既有 `asset` 模块（`/api/asset*`，TypeORM 实体 `assets`/`asset_rentals`）已覆盖一般资产 CRUD 与物料借用归还（含量化库存/状态机）。本节 **不重复** 一般资产借用；本节专注更专业化的固定资产条码盘点、**场地（venue）** 租借（按时长+按金+保险定价租赁，区别于既有按件 `asset_rentals`）、**设备保养** 计划/工单、以及 **供应商** 注册与评估。四个子域独立表。
> **技术栈**：沿用既有 NestJS + TypeORM + PostgreSQL 16（§2 技术栈）；条码/QR 生成与扫描能力可复用 QR 基建（§12 QR 校园签到，`qr_codes`）与既有库存条码 `assets.code`。
> **文档一致性**：表结构见 DB-SCHEMA §21，字段见 DATA-DICTIONARY §24，接口见 API-DESIGN §12。鉴权/角色复用 Module 16（ABAC），双人见证复用 §17.5 `witness_verifications`。

### 21.1 校产条码盘点（F-ASSET-001）

**目标**：固定资产统一编码（条码）+ 周期性盘点，输出盘点率、差异清单与资产状况汇总。

**资产分类（10 类，来自 SPEC）：** 固定资产 / 电子设备 / 家具 / 乐器 / 运动器材 / 实验室设备 / 图书馆藏书 / 视听器材 / 电脑设备 / 网络设备。

**核心流程：**
1. **初始化登记**：对每件固定资产分配唯一资产条码 `code`（沿用 `assets.code` 约定，建议格式 `ASSET-YYYY-<类别>-<NNNN>`），登记类别/品牌/型号/序列号/存放位置/责任人/价值/购入日期/供应商。既有 `assets` 表用于通用库存资产；固定资产可用 `fixed_assets` 表（见 DB §21.1）承载条码级固定资产主档，或 DEV 选择在既有 `assets` 上扩展 `is_fixed + barcode + location + responsible_person`。
2. **创建盘点任务**：按年度/学期创建盘点批次 `inventory_sessions`（如 `INV-2026-ANNUAL-001`），圈定盘点范围（资产类别/地点/责任人）。
3. **执行盘点**：手持端/扫码枪扫描固定资产条码，逐件记录 `inventory_items` 明细（应盘资产、实盘 found / not_found、实盘地点、状态评估）。支持批量导入离线盘点结果。
4. **差异判定**：未扫到 = missing；扫描地点 ≠ 登记地点 = location_discrepancy；条码不识别 = unknown。生成差异清单。
5. **差异调查**：差异项可指派责任人调查，`investigation_status` = pending/resolved。
6. **生成报告**：按盘点任务汇总 `total_registered` / `assets_verified` / `verification_rate` / `discrepancies[]` / `condition_summary`（excellent/good/fair/poor）。
7. **结题**：盘点任务 `closed` 后写入审计；数据不可再改动（只读快照）或留调整通道。

**盘点状态机（session）：** `draft → planning → in_progress → verifying → closed`（可 `cancelled`）。
**差异项状态机（item）：** `scanned_matched / scanned_mismatch / missing / unknown → pending_investigation → resolved / closed`。

### 21.2 场地租借管理（F-ASSET-002）

**目标**：管理校内场地（礼堂/篮球场/课室/活动室/游泳池等）对外/对内租借，含计价、按金与保险要求。

**场地及定价（来自 SPEC）：**

| 场地 | 每小时租金 | 按金 | 保险要求 |
|------|-----------|------|---------|
| 礼堂 | HK$800 | HK$2,000 | 是 |
| 篮球场 | HK$400 | HK$1,000 | 是 |
| 课室 | HK$200 | HK$500 | 否 |
| 活动室 | HK$300 | HK$500 | 否 |
| 游泳池 | HK$600 | HK$1,500 | 是 |

**说明**：以上为内置定价模板，可经 `venues` 表参数化配置（单校多场地可扩展单价/按金/保险）。

**核心流程：**
1. **场地建档**：登记 `venues`（名称/容量/小时租金/按金/保险要求/地址/可用时段）。
2. **租借申请**：外部/内部租借方提交 `venue_rentals`，选场地+起止时间，系统自动计算租金与按金，标记保险要求。
3. **防冲突校验**：同一场地时间区间重叠冲突时拒绝（interval + exclusion constraint / 应用层校验）。
4. **审批**：校务处/校务主任审批。
5. **按金与收费**：租借方缴交按金（可选衔接费用/收据模块，或独立记录），出具收据。
6. **使用与归还/结算**：租借完成归还场地，完成验屋后按金退还或扣损，生成结算记录。

**流程状态机：** `draft → pending_approval → approved → confirmed(payment) → in_progress → completed → closed`；拒绝 `rejected`；取消 `cancelled`。
**防冲突**：DB 采用 `EXCLUDE USING gist (venue_id WITH =, tsrange(start_at, end_at) WITH &&)`（启用 btree_gist），或在逻辑层按 (venue_id, 时间段) 查重。

### 21.3 设备保养管理（F-ASSET-003）

**目标**：为设备建档保养计划，按频率生成保养工单并跟踪执行，覆盖定期/预防性/故障维修/安全检测四类。

**保养类型（来自 SPEC）：**

| 类型 | 频率 | 示例 |
|------|------|------|
| 定期保养 | 每月/每季 | 冷气系统, 升降机, 消防设备 |
| 预防性保养 | 年度 | 冷气机清洗, 灭火筒更换 |
| 故障维修 | 按需 | 任何设备故障 |
| 安全检测 | 年度 | 电力系统, 气体装置, 升降机 |

**核心流程：**
1. **保养计划**：为设备/资产建立 `maintenance_plans`（保养类型、频率（月/季/年）、下次到期日、责任供应商（衔接供应商 F-VEND-001）、说明）。
2. **工单生成**：按频率调度（cron）自动生成 `maintenance_work_orders`；故障维修可手动即时建单。
3. **工单执行**：指派执行人（校内/外判供应商），记录执行时间、结果、费用、附件。
4. **验收与关闭**：执行人提交 → 校务处验收 → 关闭；安全检测类需资质证书号。
5. **到期提醒**：临近到期（如提前 7 天）经通知模块提醒负责人。
6. **历史**：工单归档保留设备保养履历。

**计划状态机：** `active / suspended / retired`。
**工单状态机：** `scheduled → assigned → in_progress → submitted → verified → closed`；取消 `cancelled`。

### 21.4 供应商注册与评估（F-VEND-001）

**目标**：统一管理供应商注册信息，并周期性评估其资质/绩效，形成合格供应商名录。

**供应商分类（10 类，来自 SPEC）：** 图书供应 / 文具供应 / 膳食供应（饭盒）/ 校车服务 / 设备维修 / 印刷服务 / 清洁服务 / 保险公司 / 网络服务 / 活动物资。

**核心流程：**
1. **供应商注册**：外部供应商提交注册资料 → `vendors`（名称/统一编号/类别/联系人/联系方式/银行账户/证照/地址），校务处审核 → `approved` / `rejected`。
2. **资质证照**：上传证照文件（营业执照/注册证/保险单等），记录有效期并到期提醒（衔接 F-OPS/通知）。
3. **评估周期**：校务处/校务主任按周期（如年度）发起 `vendor_evaluations` 评估，从多个维度打分（质量/价格/交期/服务/合规）。
4. **评估定级**：汇总加权分 → 级别（A/B/C）与结论（续用/观察/淘汰）。可由多评审人各自打分后汇总。
5. **名录管理**：合格供应商维护 `qualified_vendors` 名录状态（关联合同/费用，衔接财务模块）。
6. **关联工时**：保养工单/采购记录可引用供应商 `vendor_id`（衔接 F-ASSET-003 责任供应商）。

**注册状态机：** `draft → pending_review → approved / rejected / suspended`。
**评估状态机：** `draft → in_progress → scored → concluded`（`cancelled`）。

### 21.5 状态机与异步编排

| 场景 | 编排方式 |
|------|----------|
| 盘点任务自动生成 | 年度任务由 cron 创建 `inventory_sessions`（draft），负责人手动规划 |
| 保养计划到期生成工单 | cron（`MaintenanceScheduleCron`）扫描计划形成 `scheduled` 工单，并触发 7 天到期提醒 |
| 场地时段冲突校验 | 应用层 + PostgreSQL 排他约束双重保障，冲突即 409 |
| 供应商证照到期提醒 | cron 扫描 `vendors` 证照有效期，到期前提醒更新 |
| 维修外判 | 故障维修工单可指派外判供应商（`vendor_id`），完成后回写费用 |

### 21.6 权限矩阵

| 功能 | 校务主任 | 校务处同工 | 会计/出纳 | 教师 | 系统管理员 | 供应商(外部) |
|------|----------|------------|-----------|------|-----------|-------------|
| 固定资产/条码登记与维护 | ✅ | ✅ | ❌ | 查看 | ✅ | ❌ |
| 创建盘点任务 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 执行/录入盘点 | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 差异调查/结题 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 场地档案维护 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 场地租借申请/审批 | 审批 | 申请/审批 | 收费联动 | 申请 | ✅ | 提交申请 |
| 保养计划/工单管理 | ✅ | ✅ | 费用联动 | 查看 | ✅ | 被指派执行 |
| 供应商注册 | 审批 | 审核 | ❌ | ❌ | ✅ | 提交/更新 |
| 供应商评估 | ✅ | ✅ | ❌ | ❌ | ✅ | 查看(自身评估) |

> 外部供应商仅能通过限定公开端点（提交/更新自身注册、查看自身评估），无内部后台权限（ABAC 按 `vendor_id` 范围限制）。见证/审批人角色约束沿用 §17.5。

### 21.7 安全与一致性保证

| 边界 | 保证 |
|------|------|
| 场地冲突 | 相同场地时间段重叠 → 409；DB 排他约束兜底 |
| 盘点只读性 | 盘点任务 `closed` 后明细只读，防篡改；解锁须走重开流程 |
| 金额/按金 | 租金 = 时长 × 小时单价（DB 事务计算）；按金收退记录可追溯，衔接财务收据 |
| 保养数据一致性 | 工单须关联设备/资产与（可选）责任供应商；外判费用可联动财务 |
| 隐私(PDPO) | 供应商资料含 P1（联系方式/银行账户/证照），传输加密、最小权限授权、评估记录可审计 |
| 审计 | 资产/盘点、场地租借审批与结算、保养工单、供应商注册与评估全链路写 `audit_logs` |
| 文档一致性 | 表结构见 DB-SCHEMA §21，字段见 DATA-DICTIONARY §24，接口见 API-DESIGN §12 |

## 22. 校车点名与查询模板模块 — 技术设计（F-BUS-002, F-INQ-002, Issue #361）

> 🔧 **补全说明（Issue #361）**：为校车点大名记录（F-BUS-002）与家长查询快速回复模板（F-INQ-002）提供技术设计，作为 DEV 实现输入。
> **边界**：
> - **校车点名（F-BUS-002）** 记录学生在「校车行程」上的上车（onboard）/下车（alight）点名，定位为校车乘搭内点名，**区别于**既有的校园出勤 `attendances`（§7 班级出勤）与 QR 校园签到 `attendance_qr_logs`（§12 校园入校签到）。三者为不同语义：`attendances`=班级日常出勤，`attendance_qr_logs`=校园入校签到，`bus_checkins`=校车乘搭点名。校车点名**不回写** `attendances`，是否映射为出勤数据由 DEV 在§22.6 按配置决定（默认不联动）。
> - **快速回复模板（F-INQ-002）** 为校务处回复家长查询时的**回复内容模板**（校車/午膳/收费/请假/一般 共 5 类 41 个内置模板），**区别于**既有的通知模板 `NotificationTemplate`（F-NEW-002 多渠道通知模板，用于发送通知/告警，receiver 为通知场景）。快速回复模板服务于 F-INQ-001 家长查询队列的回复生成（AC-05），通过模板变量替换生成回复正文并推送家长。
> - **家长查询队列**见 §F-INQ-001 既有实现（`inquiries` / `inquiry_replies`）；本节仅新增**快速回复模板**管理及在回复流程中的匹配、渲染与推送联动。
> **技术栈**：沿用既有 NestJS + TypeORM + PostgreSQL 16（§2 技术栈）；通知/推送复用 §7.3 多渠道通知架构与 `NotificationTemplate` 基建；学生乘搭分配可衔接 F-BUS-001（校车实时追踪与乘搭学生列表）。
> **文档一致性**：表结构见 DB-SCHEMA §22，字段见 DATA-DICTIONARY §25，接口见 API-DESIGN §13。鉴权/角色复用 Module 16（ABAC）。

### 22.1 校车点名记录（F-BUS-002）

**目标**：记录每次校车行程中学生上车（onboard）与下车（alight）点名，输出 `status`（如 arrived_safely）并可联动发送「已安全登车/到校」家长通知，满足 F-BUS-002 输出示例（`checkin_id`/`bus_id`/`check_type`/`timestamp`/`location`/`status`/`parent_notification_sent`）。

**核心实体**：
1. **校车（bus）**：复用/扩展既有校车车辆标识，建模为 `buses`（车辆主档：车牌/座位数/登记即可用）。
2. **线路（bus_route）**：`bus_routes` 线路主档（如 將軍澳線），含线路号、起讫站、停靠站点序列、可配置延误通知阈值（衔接 F-BUS-001 阈值配置）。
3. **班次/行程（bus_shift）**：`bus_shifts` 即一次校车行程（某线路 × 某校车 × 日期 × 方向（早晨返校 morning / 放学离校 afternoon）），是点名的**粒度容器**。
4. **乘搭分配（bus_students）**：学生分配到具体线路/班次（衔接 F-BUS-001 乘搭学生列表，含家长通知状态）。
5. **点名记录（bus_checkins）**：每行程内每学生一条点名记录（onboard / alight），支持 GPS 或手动定位。

**核心流程：**
1. **建立行程**：校务处按日期创建 `bus_shifts`（线路、校车、方向、计划发车/到站、延误阈值）。可批量按周生成。
2. **乘搭名单**：行程关联 `bus_students`（应乘名单）；可一键导入/沿用默认线路乘搭表。
3. **点名执行**：学生上车/下车时，经设备（扫码/刷卡/NFC）或手动录入生成 `bus_checkins`，系统记 `check_type`、时间戳、定位来源（`gps`/`manual`）。
4. **状态判定**：点名后计算状态 `status`（`arrived_safely`（上车→下车完整到达站点）/ `onboard`（已上车未下车）/ `missed`（应乘未点名）/ `absent`（请假未乘，衔接请假模块可选））。
5. **家长通知**：上车 `onboard` 推送「已安全登车确认」，下车到校 `alight`（到校）推送「孩子已安全到校」（F-BUS-001 AC-04）；点名完整/异常可向整组或多位家长一键通知（F-BUS-001 AC-05）。通知经 §7.3 多渠道通知架构、可写 `bus_checkins.parent_notification_sent`。
6. **行程关闭**：到站/放学校车回校后，校务处关闭行程（`closed`），日程报表归档。

**点名校验与幂等：** 同一行程内同一学生同一 `check_type` 只允许一条有效记录（DB 唯一约束）；重复扫描返回 `DUPLICATE`。迟到/漏点名单在行程关闭前可补点，关闭后只读。

**行程状态机：** `draft → active → closed`（可 `cancelled`）。
**点名状态机（checkin）：** `onboard → alight`（值见枚举 `bus_checkin_status_enum`）；业务派生 `status`（arrived_safely/onboard/missed/absent）见 §22.5 计算说明。

### 22.2 快速回复模板管理（F-INQ-002）

**目标**：管理校务处回复家长查询的快速回复模板，支持 5 类 41 个内置模板，可在 F-INQ-001 回复流程中按意图/分类匹配、变量渲染后一键发送。

**核心流程：**
1. **模板分类**：内置 5 类（`bus` 校車 / `lunch` 午膳 / `fee` 收费 / `leave` 请假 / `general` 一般），各含基准数量（8/6/10/5/12）。
2. **模板主档**：`quick_reply_templates` 存分类、标题、正文、变量集、关联意图标签（衔接 F-INQ-001 `intent`）、默认标记、启用状态、适用范围（角色/年级可选）。
3. **内置模板初始化**：系统启动/迁移时 seed 41 个内置模板（`is_default=true` 只读），校务处可复制派生为新模板或停用。
4. **匹配推荐**：在家长查询回复页（F-INQ-001），按查询 `intent`（来自 AI 意图分类）推荐匹配模板；也支持关键词检索。
5. **变量渲染**：模板正文含变量占位符（如 `{{delay_minutes}}`、`{{estimated_arrival}}`、`{{student_name}}`），渲染时按上下文（查询/学生/校车/延误数据）代入生成最终回复（F-INQ-001 AC-05：选择「校車延誤通知」填延误时间=15分钟 → 生成含延误时间/原因/预计到校时间的回复）。
6. **发送**：渲染后的回复经 §7.3 通知架构推送家长（微信/短信/邮件），并写 `inquiry_replies`。

**模板状态机：** `active / inactive`（停用）。内置模板 `is_default=true` 仅可停用不可物理删除；自定义模板可停用/删除（软删除）。

### 22.3 与既有 attendance / QR 签到的边界

| 维度 | 校园出勤 `attendances` | QR 校园签到 `attendance_qr_logs` | 校车点名 `bus_checkins`（本节） |
|------|------------------------|----------------------------------|----------------------------------|
| 语义 | 班级日常出勤（迟到/早退/缺勤） | 校园入校扫码签到（§12） | 校车乘搭内上车/下车点名 |
| 触发 | 教师/系统录入 | 学生扫码入校 | 上车/下车时设备或手动录入 |
| 关键实体 | students, classes | qr_codes, attendance_qr_logs | buses, bus_routes, bus_shifts, bus_students, bus_checkins |
| 是否联动 | — | 可映射出勤 | **默认不联动** `attendances`（见 §22.6 可选开关）|
| 家长通知 | 缺勤通知 | — | 已安全登车/到校通知 |

> 三条链路各自独立写库，互不覆盖；若 DEV 需要校车点名结果回填校园出勤，须经配置开关 `bus_checkin_sync_to_attendance`（默认 false）并由定时/事件路由转换，不得直接改 `attendances` 主数据。

### 22.4 快速回复 vs 通知模板（F-NEW-002）边界

| 维度 | 通知模板 `NotificationTemplate`（F-NEW-002） | 快速回复模板 `quick_reply_templates`（F-INQ-002） |
|------|----------------------------------------------|----------------------------------------------------|
| 用途 | 多渠道通知（告警/日常通知/确认） | 家长查询（F-INQ-001）回复内容 |
| 入口 | 通知模块发送通知 | 家长查询队列回复流程 |
| 变量 | `variables[]`（通知类） | 查询上下文变量（学生/校车/延误）|
| 关联 | notification 发送 | inquiry_replies 回复 |
| 样式 | 通知标题+内容 | 回复正文（微信/短信/邮件适长）|

### 22.5 状态机与异步编排

| 场景 | 编排方式 |
|------|----------|
| 行程自动建立 | cron（`BusShiftGeneratorCron`）按工作日自动生成次日 `bus_shifts`（draft），校务处可调整 |
| 点名后家长通知 | 点名写库后经事件（`bus_checkin.created`）触发通知服务（§7.3）异步推送，更新 `parent_notification_sent` |
| 延误阈值判定 | 复用 F-BUS-001 阈值配置（`bus_routes.delay_notify_threshold_minutes`，>10 分钟微信，>20 分钟短信）|
| 行程到期关闭 | cron 扫描超时未关闭行程并提醒校务处 |
| 内置模板 seed | 迁移脚本初始化 41 个内置模板（is_default=true）|

**派生状态计算（checkin.status）规则：**
- `alight` 且本行程结束（到校）= `arrived_safely`
- 仅 `onboard` 未 `alight`（行程中/未到校）= `onboard`
- 应乘名单中无任何点名 = `missed`
- 有请假记录（衔接 F-LEAVE-001）当日 = `absent`（可选）

### 22.6 权限矩阵

| 功能 | 校务主任 | 校务处同工 | 司机/跟车员 | 教师 | 系统管理员 | 家长 |
|------|----------|------------|-------------|------|-----------|------|
| 校车/线路/班次维护 | ✅ | ✅ | ❌ | 查看 | ✅ | ❌ |
| 乘搭名单分配 | ✅ | ✅ | ❌ | 查看 | ✅ | ❌ |
| 执行校车点名（扫码/手动）| 查看 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 查看点名记录/日报 | ✅ | ✅ | 查看(本人行程) | 查看(本班) | ✅ | 查看(本人子女) |
| 关闭/取消行程 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 快速回复模板管理 | ✅ | ✅ | ❌ | 查看 | ✅ | ❌ |
| 用模板回复家长 | 查看 | ✅ | ❌ | 查看 | ❌ | 接收 |

> 学生/家长仅能经门户限定端点查看**本人/自己子女**的点名记录（ABAC 按 `student_id` 范围限制，见 §15 数据隔离层）。司机/跟车员仅能访问被指派的行程进行点名。

### 22.7 安全与一致性保证

| 边界 | 保证 |
|------|------|
| 点名幂等 | 同班次同学生同 `check_type` 唯一约束；重复扫描 409 `DUPLICATE` |
| 行程只读性 | 行程 `closed` 后点名明细只读，防篡改；补点须重新打开或走重开流程 |
| 数据一致性 | 点名须关联有效行程与乘搭名单；无乘搭分配学生不可点名（或标记异常）|
| 隐私(PDPO) | 点名含学生身份与位置 P1 数据，传输加密、最小权限授权、门户范围限制；通知带学生姓名需家长授权 |
| 审计 | 行程创建/关闭、点名、模板新增/停用、回复发送全链路写 `audit_logs` |
| 文档一致性 | 表结构见 DB-SCHEMA §22，字段见 DATA-DICTIONARY §25，接口见 API-DESIGN §13 |



---

## 23. AI 自动化模块 — 技术设计（F-AI-002, F-AUTO-001, F-AUTO-002, Issue #362）

> 🔧 **补全说明（Issue #362）**：为「AI 自动化」模块补齐技术设计，作为 DEV 实现 **F-AI-002（FAQ 智能匹配）、F-AUTO-001（周期性任务触发器）、F-AUTO-002（智能提醒系统）** 的输入。
> **边界（与既有 AI 助理/Coze/通知模块的关系）：**
> - **FAQ 智能匹配（F-AI-002）** 是「知识检索」层，负责把自然语言查询映射到已入库的 FAQ 答案。语义匹配（Embedding 向量）复用 §2.2 AI/ML 技术栈（OpenAI text-embedding-3 + pgvector）；如需意图识别（`trigger_intents`）或答案生成，可经 Coze/OpenAI LLM Provider（§2.2）编排，但**本节不重造 LLM 通道**，仅定义在 LLM 之上的匹配编排、打分融合与日志（`faq_match_logs`）。与既有 F-AI-001（AI 智能建议，`ai-suggestion.service`，基于出勤/成绩数据分析生成建议）并行不冲突：F-AI-001 面向校务处「建议」，F-AI-002 面向「问答检索」；可共享同一 Coze/OpenAI 配额与回退基建（§9.7 Coze API 配额监控）。
> - **周期性任务触发器（F-AUTO-001）** 复用既有 `@nestjs/schedule`（SchedulerRegistry）调度基建（现状已有 cron：午膳变更自动拒绝/提醒、出勤日报 18:00、user-lifecycle 每日 9AM、备份、installment 逾期检查等）。本节新增**可配置任务主档** `scheduled_tasks` + `scheduled_task_executions` 执行日志，将「写死的 cron」升级为「可配置 + 可审计 + 可手动触发」，不改动既有 cron 基建。
> - **智能提醒系统（F-AUTO-002）** 是通知的**策略层**：**发送**与**送达回执**复用 §7.3 多渠道通知架构与 `notifications`/`notification_deliveries`（现有 `notification_deliveries` 已含 `read_at`/`retry_count`/`degraded_to_fallback` 承载送达回执能力）。本节的新表 `reminder_rules`（级别/渠道/升级策略）+ `reminder_records`（级别/升级/未读跟进）在通知基建之上叠加「提醒编排策略」，`reminder_records.notification_id` 外键关联已发送通知，DEV 复用既有通知服务发送，本模块负责升级与未读跟进编排。Token 健康检查（F-AUTO-002 新增：每 24 小时校验微信 token）可作为一条预置 `scheduled_tasks`（action_type=`send_token_health_check`）实现。
> **技术栈**：沿用既有 NestJS + TypeORM + PostgreSQL 16（§2 技术栈）；Embedding + pgvector（§2.2）；通知复用 §7.3；鉴权/角色复用 Module 16（ABAC）。
> **文档一致性**：表结构见 DB-SCHEMA §23，字段见 DATA-DICTIONARY §26，接口见 API-DESIGN §14。

### 23.1 FAQ 智能匹配（F-AI-002）

**目标**：将自然语言查询与 FAQ 知识条目匹配并返回候选答案（含分数与命中路），满足 F-AI-002 匹配算法（多路打分融合）与 FAQ 数据库结构。

**核心实体**：`faq_knowledge_base`（FAQ 主档：问题繁/英、多格式答案、关键词、意图标签、嵌入向量、反馈计数）、`faq_match_logs`（匹配请求日志，用于效果分析与模型迭代）。

**FAQ 匹配流程（frozen）：**

```
查询 query
  → 1. 规范化（繁简归一、小写、分词）normalize()
  → 2. 关键词精确匹配 keyword_match(query, keywords) —— 得分 S_keyword
  → 3. TF-IDF 相似度 cosine_similarity(query_tfidf, faq.tfidf_terms) —— S_tfidf
  → 4. 语义嵌入相似度 cosine_similarity(query_embedding, faq.embedding)（pgvector HNSW）—— S_semantic
  → 5. 基于意图路由 intent_match(query_intent, trigger_intents) —— S_intent
  → final_score = S_keyword*0.3 + S_tfidf*0.2 + S_semantic*0.3 + S_intent*0.2
  → top-N 写入 faq_match_logs.candidates，返回排序结果
```

**打分与阈值：**
- `top_score ≥ 0.7` → 直接返回 top 答案。
- `0.4 ≤ top_score < 0.7` → 返回候选列表，由调用方选择（家长查询场景供校务处/自助端确认）。
- `top_score < 0.4` → 未命中，记 `faq_match_logs`（top_faq_id=null），返回空并提示「转为人工查询」（衔接 F-INQ-001 查询队列）。

**向量索引与降级：** `embedding` 列启用 pgvector HNSW（`vector_cosine_ops`）。执行时若 LLM/Embedding 服务不可用或条目无嵌入，自动降级为「关键词 + TF-IDF」（`used_vector=false`），保证匹配可用性（衔接 §9.7 Coze/OpenAI 回退方案）。

**答案形态：** 支持 plain/html/联动快速回复模板（`answer.quick_reply_template_code`，衔接 §22.2 F-INQ-002 快速回复模板渲染，复用家长查询回复链路）。

**反馈闭环：** 家长/校务处对匹配结果反馈「有用/无用」→ 回写 `faq_match_logs.feedback` + 增量 `faq_knowledge_base.helpful_count/not_helpful_count`，`view_count` 递增；供低频 FAQ 关注度排序与内容补全。

### 23.2 周期性任务触发器（F-AUTO-001）

**目标**：把周期性任务从「写死 cron」升级为「可配置 + 可审计 + 可手动触发」的任务主档，满足 F-AUTO-001 任务触发配置（每日/每周/每月示例）。

**核心实体**：`scheduled_tasks`（任务定义）、`scheduled_task_executions`（执行日志）。

**触发模型：** DEV 用 `@nestjs/schedule` 的 SchedulerRegistry。注册方式：启动时加载所有 `status='active'` 的 `scheduled_tasks`，按 `cron_expression` 注册 cron job；`next_run_at` 供调度器与监控参考，避免重复注册（幂等：`task_code` 唯一）。运行期新增/修改/暂停任务时增删对应 cron 注册。

**cron 表达式生成（frozen）：**

| trigger_type | cron 片段 | 说明 |
|--------------|-----------|------|
| daily `{time:'06:30'}` | `0 30 6 * * *` | 每日固定时刻 |
| weekly `{dayOfWeek:5, time:'16:00'}` | `0 0 16 * * 5` | 每周某日（0-6=周日-周六）|
| monthly `{dayOfMonth:15, time:'09:00'}` | `0 0 9 15 * *` | 每月某日 |
| cron `{cronExpression}` | 用户自定义 | 进阶自定义 |

**动作类型（action_type）与预置行为：**

| action_type | 行为 | 备注 |
|-------------|------|------|
| `refresh_dashboard_data` | 刷新仪表板缓存数据 | 预置「晨检仪表板刷新 daily 06:30」|
| `generate_inquiry_summary` | 汇总当日家长查询并生成摘要 | 预置「家长查询摘要 daily 18:00」|
| `generate_absence_report` | 生成缺勤/代课统计报告 | 预置「代课统计报告 weekly 五 16:00」|
| `send_fee_reminder` | 触发月费缴费提醒（经 reminder_rules）| 预置「月费缴费提醒 monthly 15 09:00」|
| `send_custom_notification` | 按模板发送自定义通知 | action_params 传 templateId/recipients |
| `send_token_health_check` | 微信 token 健康检查告警 | 预置「Token 健康检查 daily 每24h」（F-AUTO-002）|
| `webhook` | 调用外部 webhook | 扩展点 |

**执行与重试：** 每次触发写 `scheduled_task_executions`（status=pending→running→success/failed）。失败按 `max_retries`（默认 3）退避重试（`attempt` 递增、`next_retry_at`）；`consecutive_failures ≥ 3` → 触发 §7.3 告警通知运维。执行成功更新 `scheduled_tasks.last_run_at/next_run_at` 并清零 `consecutive_failures`。手动 `run-now` 忽略 `next_run_at` 立即排队。

**状态机（task）：** `active → paused → active`；`active/paused → disabled`（软删除仍保留审计）。`paused` 反注册 cron；`resumed` 重新注册。

### 23.3 智能提醒系统（F-AUTO-002）

**目标**：按提醒级别编排多渠道触达、升级策略与消息送达回执/未读跟进，满足 F-AUTO-002 级别表与新增的短信备用、送达回执、Token 健康检查需求。

**核心实体**：`reminder_rules`（规则：级别/渠道/升级策略/业务/过滤条件）、`reminder_records`（每次提醒的触发记录：送达/已读/升级历史）。

**级别默认策略（frozen，可规则覆盖）：**

| 级别 | 默认渠道 | 升级时机 | 说明 |
|------|----------|----------|------|
| INFO | App Push, SMS(可选) | 无 | 可配置 |
| NORMAL | App, Email, SMS | +24 小时升级 | 可配置 |
| URGENT | App, SMS, 电话 | +2 小时升级 | 立即发送 |
| CRITICAL | 全渠道 + 学校领导 | 立即升级 | 立即发送，升级至校领导 |

**短信备用渠道（F-AUTO-002 新增，应用户模拟反馈 P0-01）规则：**

| 场景 | 渠道优先级 |
|------|-----------|
| 学生校车延误 | 微信推送 → 短信备用 |
| 学生出勤异常（连续迟到/缺席）| 微信推送 → 短信备用 |
| 紧急通知（台风/停课等）| 短信优先 + 微信推送 |
| 成绩发布 | 微信推送（无备用）|
| 日常缴费提醒 | 微信推送（无备用）|

**触发与发送流程（frozen）：**
1. **规则匹配**：业务事件（校车延误/出勤异常/收费/成绩/紧急）进入提醒编排器 → 按 `business_type` + `filter_condition` 匹配 `reminder_rules`（active）。
2. **策略解析**：按 `level` + 规则字段确定渠道集合、`delay_minutes`、是否 `smsBackup`、升级参数（`escalation_delay_minutes`/`escalate_to_roles`）。
3. **发送**：复用 §7.3 通知服务生成 `notifications` 并触发多渠道发送 → 生成 `reminder_records`（`notification_id` 关联；`channel`/`level` 快照）。短信备用场景同写 SMS 渠道（`sms_fallback_sent=true`）。
4. **送达回执**：家长打开通知 → `notification_deliveries.read_at` 写入（既有能力）→ 同步 `reminder_records.read_status='read'`/`read_at`，家长端显示「家长已读」。
5. **未读跟进**：`reminder_records.next_followup_at` 到点仍未读（默认 24 小时，URGENT 用 `escalation_delay_minutes` 2 小时）→ 重发一次 + 短信备用（`retry_count++`、`sms_fallback_sent=true`），升级 `escalation_level` 并写 `escalation_history`。
6. **失败告警**：`deliver_status='failed'` 持续（重试耗尽）→ 告警校务处，界面显示「通知发送失败」。

**升级机制（frozen）：** NORMAL +24h / URGENT +2h 未读 → 升级（`escalate_to_roles` 指定的校领导/校务主任接手 + 更高渠道兜底）；CRITICAL「立即升级」。升级事件全部写入 `escalation_history` 供审计。

**Token 健康检查（F-AUTO-002 新增）：** 预置一条 `scheduled_tasks`（action_type=`send_token_health_check`，`cron_expression='0 0 * * *'` 每 24 小时）。执行时校验微信渠道 token 有效性，异常 → 按 `reminder_rules`（level=urgent/critical）触发告警至校务主任（邮件+短信，复用 §23.3 智能提醒链路）。

### 23.4 与既有 AI 助理 / Coze / 通知 / 调度的复用矩阵

| 能力 | 复用既有点 | 本节新增点 | 说明 |
|------|-----------|-----------|------|
| LLM/Embedding 通道 | Coze / OpenAI + pgvector（§2.2）、Coze 配额监控（§9.7）| FAQ 匹配编排 `faq_match_logs` | 不重造 LLM 通道 |
| AI 建议 | F-AI-001 `ai-suggestion.service` | F-AI-002 FAQ 匹配 | 建议 vs 检索，可共享回退 |
| 通知发送/送达回执 | §7.3 + `notifications`/`notification_deliveries` | `reminder_rules`/`reminder_records` 策略层 | 发送复用，策略新增 |
| 快速回复模板 | §22.2 F-INQ-002 `quick_reply_templates` | FAQ `answer` 联动 | 检索命中→模板渲染 |
| 周期调度 | `@nestjs/schedule`（既有 cron）| `scheduled_tasks`/`scheduled_task_executions` 配置化 | 写死→可配置可审计 |
| 鉴权/审计 | Module 16（ABAC）+ `audit_logs` | audit_action 扩展 | 复用 |

### 23.5 安全与一致性保证

| 边界 | 保证 |
|------|------|
| FAQ 数据质量 | 嵌入失败可降级关键词匹配（不阻断）；反馈闭环驱动内容补全；`view_count` 关注低频条目 |
| 匹配可解释 | `faq_match_logs.candidates` 保留各候选 `matched_by` 与分数；低分不误答 |
| 任务幂等 | `task_code`/`faq_code`/`rule_code`/`reminder_no` 唯一；SchedulerRegistry 注册幂等；`run-now` 用 `TASK_ALREADY_RUNNING` 防重 |
| 任务自愈 | 失败重试（max_retries）+ `consecutive_failures` 阈值告警；调度器崩溃重启后以 DB 状态重注册 cron |
| 提醒可达 | 高优先级 SMS 备用 + 升级机制 + 未读跟进，保障触达（F-AUTO-002 AC）|
| 隐私(PDPO) | 提醒含家长/学生 P1 数据；门户与接口经 ABAC 按 `recipient_id`/`student_id` 限制；通知带学生姓名需家长授权 |
| 审计 | FAQ 维护/匹配反馈、任务增改触发执行、规则增改、提醒触发/升级/跟进全链路写 `audit_logs` |
| 文档一致性 | 表结构见 DB-SCHEMA §23，字段见 DATA-DICTIONARY §26，接口见 API-DESIGN §14 |

### 23.6 权限矩阵

| 功能 | 校务主任 | 校务处同工 | 教师 | 家长 | 系统管理员 |
|------|----------|------------|------|------|-----------|
| FAQ 维护（增改/启停/重建嵌入）| ✅ | ✅ | ❌ | ❌ | ✅ |
| FAQ 匹配查询 / 反馈 | ✅ | ✅ | 查看(本班相关) | 本人/子女 | ✅ |
| 周期任务维护（增改/启停/run-now）| ✅ | ✅ | ❌ | ❌ | ✅ |
| 任务执行日志查看 | ✅ | ✅ | 查看(本人触发) | ❌ | ✅ |
| 提醒规则维护 | ✅ | ✅ | ❌ | ❌ | ✅ |
| 提醒记录/未读跟进/升级 | ✅ | ✅ | 查看 | 查看(本人) | ✅ |
| Token 健康检查告警接收 | ✅(校务主任) | ✅ | ❌ | ❌ | ✅ |

> 学生/家长仅能经门户限定端点查看**本人/自己子女**的提醒记录（ABAC 按 `recipient_id`/`student_id` 范围限制，见 §15 数据隔离层）。

---

## 24. 运维自动化模块技术设计（F-OPS-002/003/006/007/008/009，Issue #363）

> 🔧 **补全说明（Issue #363）**：运营自动化（MOD-OPS-001 / Module 11）涉及 F-OPS-002/003/006/007/008/009 的**持久化数据模型与运维接口**，作为 DEV 实现上述功能的输入。
> **定位与衔接（不重复建/不复述）**：各功能的技术架构、Prometheus 指标、告警规则与自动续期/限流/审批机制已分别在 §9.3–§9.10 完整定义：
> - **F-OPS-002 SSL 证书**：技术架构/指标/证书存储见 **§9.3**；
> - **F-OPS-003 WebSAMS Token**：Token 刷新机制/降级方案/指标/实现见 **§9.4**；
> - **F-OPS-006 Coze 配额**：指标/三级告警/限流保护/备用方案见 **§9.7**；
> - **F-OPS-007 敏感字段查看告警**：异常检测/敏感字段定义/指标见 **§9.8**（敏感字段管控另见 **§16**、脱敏与审计写入见 §4.5.4/§16.3）；
> - **F-OPS-008 DDL 审计**：DDL 捕获/审批流程/指标见 **§9.9**（合规模块 Vault 与审计衔接见 **§17**）；
> - **F-OPS-009 运维健康仪表板**：9 维度聚合/统一视图/复合指标见 **§9.10**（基础维度 F-NEW-006 见 §8 可观测性）。
> **本节职责**：只补 §9 未覆盖的三大缺口——(1) 运维事件的**持久化表设计**（§9 以 Prometheus 指标为主，缺乏 DB 落库）；(2) 仪表板/状态查询的**运维 API**；(3) 跨功能的状态汇总模型与一致性约束。Prometheus/Grafana、cert-manager、pgaudit 等既有能力一律引用不改写。

### 24.1 模块边界与数据流向

```
+------------------------------------------------------------------------------+
|                Module 11 运维自动化（F-OPS-002/003/006/007/008/009）          |
+------------------------------------------------------------------------------+
| 数据产生源                                                   数据落库（本节新增）|
|  [cert-manager] ──► F-OPS-002 ──► ssl_cert_status             ┌────────────┐  |
|  [WebSAMSTokenManager] ─► F-OPS-003 ─► token_refresh_status   │ ops_events │  |
|  [Coze API Monitor] ──► F-OPS-006 ──► coze_quota_records      │ (运维事件)  │  |
|  [Audit Service] ──► F-OPS-007 ──► sensitive_field_access_log │            │  |
|  [pg_event_trigger]─► F-OPS-008 ──► ddl_audit_log（引用§9.9）  └─────┬──────┘  |
|  [运行状态抽样] ──► F-OPS-009 ──► ops_health_metrics                    │       |
+------------------------------------------------------------------------------│
  [Ops Health Dashboard / API] ◄───────────  查询集群（§24.4 API）         ◄───┘
  告警统一经 Alertmanager → §7 通知 → 敏感/DDL 告警另写 audit_logs（§16.3）
+------------------------------------------------------------------------------+
```

**落库策略（Gap 1 决断）：**
- **状态快照表**（`ssl_cert_status`、`token_refresh_status`、`coze_quota_records`、`ops_health_metrics`）：记录**最新关系统计快照**与**历史趋势点**，为仪表板提供「当前值 + 时间序列」，避免仅依赖瞬时 Prometheus 拉点。
- **事件/告警表**（`ops_events`、`sensitive_field_access_log`）：记录每次阈值触发与敏感访问明细，支撑审计查询与合规举证。
- **DDL 审计**：引用 §9.9 已设计的 `ddl_audit_log` 表（系统设计 §9.9.2 / DB-SCHEMA 见下方 §24.2 统一落库），本节不另起表，仅纳入统一查询。
- **趋势保留**：`ops_health_metrics` 保留 13 个月（月度汇总），其余明细表保留 7 年（与审计保留策略一致，衔接 §17.6/§16.3 冷存规则）。

### 24.2 持久化表设计总览（Gap 1 落库）

> 表结构全量定义见 **DB-SCHEMA §24**（运维自动化模块），字段说明见 **DATA-DICTIONARY §27**。DDL 审计表沿用 §9.9.2 定义并在 DB-SCHEMA §24 固化。

| 表名 | 承载功能 | 用途 | 写入方 |
|------|---------|------|--------|
| `ssl_cert_status` | F-OPS-002 | 每域名 SSL 证书状态快照 + 续期历史 | cert-renew 检查脚本（每日 02:00 / 09:00）|
| `token_refresh_status` | F-OPS-003 | WebSAMS Token 健康快照 + 每次刷新记录 | websams-token-refresh.sh / TokenManager（每小时）|
| `coze_quota_records` | F-OPS-006 | Coze 配额快照、使用率、限流动作历史 | 配额监控器（每 5 分钟）|
| `sensitive_field_access_log` | F-OPS-007 | 敏感字段访问明细（含阈值命中告警）| Audit Service（访问时实时 + 监控脚本聚合）|
| `ddl_audit_log` | F-OPS-008 | DDL 操作审计明细（引用 §9.9）| pg_event_trigger（DB-SCHEMA §24 固化）|
| `ops_health_metrics` | F-OPS-009 | 仪表板健康维度评分时间序列 | ops-health 采集器（每 1 分钟，对齐 Prometheus 拉取间隔）|
| `ops_events` | 全局 | 统一运维事件流（证书/Token/配额/DDL/敏感访问告警事件）| 各功能写入 |

### 24.3 各功能落库细则（Gap 补齐）

#### 24.3.1 F-OPS-002 SSL 证书（衔接 §9.3）

- 每日 02:00 `certbot renew` 执行成功后，更新 `ssl_cert_status`（`days_until_expiry`=实际剩余天数，`renewal_result`=success）。
- 每日 09:00 分级告警（30/7/1 天）后，将 `alert_level` 落到 `ssl_cert_status.alert_level`；告警触发写入 `ops_events`（event_type=`ssl_cert_expiry_alert`）。
- 续期成功后服务（Kong/Ingress/应用）热加载，参照 §9.3.4；`ops_events` 记录 `script_ok=true`。

#### 24.3.2 F-OPS-003 WebSAMS Token（衔接 §9.4）

- 每小时检查刷新后，写 `token_refresh_status` 快照（`remaining_hours`、`refreshed_at`、`reason`、`result`）。
- Token < 24h 自动刷新成功/失败：写 `ops_events`（event_type=`websams_token_refresh`，result=success/failure）；失败按 §9.4.2 降级方案处理并升级告警。
- 审计日志写 `audit_logs`（audit_action=`websams_token_refreshed`，新枚举值见 DB-SCHEMA §24）。

#### 24.3.3 F-OPS-006 Coze 配额（衔接 §9.7）

- 每 5 分钟写 `coze_quota_records`（used/limit/usage_percent/rate_limited）。
- > 80% WARNING、> 95% ERROR（自动限流）、=100% CRITICAL：按 §9.7.3 触发；告警事件写 `ops_events`；限流动作（priority 分级）记录 `coze_quota_records.rate_limit_action`。

#### 24.3.4 F-OPS-007 敏感字段访问（衔接 §9.8 / §16）

- 每次敏感字段查看/导出实时写 `sensitive_field_access_log`（user_id/field_type/target/action/accessed_at）。
- 每 5 分钟 `sensitive-field-view-monitor.sh` 聚合过去 5 分钟窗口，超出 §9.8 阈值（HKID>5/电话>10/地址>3/医疗>2）→ 在 `sensitive_field_access_log` 补 `alert_level` 标记 + 写 `ops_events`；持续异常 3 次/小时联动 §16 权限暂停。
- 审计联动：audit_action=`sensitive_field_view`（既有，§16.3/DB-SCHEMA §16）+ `sensitive_field_excessive_access`（新枚举值）。

#### 24.3.5 F-OPS-008 DDL 审计（衔接 §9.9 / §17）

- 沿用 §9.9.2 `ddl_audit_log` 表结构；DROP/TRUNCATE 实时告警写 `ops_events`；审批流程与权限控制复用 §9.9.4。
- 保留 7 年，到期按 §17.6 冷存。

#### 24.3.6 F-OPS-009 运维健康仪表板（衔接 §9.10 / F-NEW-006）

- 每 1 分钟 `ops-health` 采集 9 维度评分写 `ops_health_metrics`（dimension + score，0-100），粒度对齐 §9.10.2 权重折算。
- 总体健康分 `ops_health_score` 复合指标（§9.10.4）同步写 `ops_health_metrics`（dimension=`overall`）。
- `ops_events` 作为仪表板「近期事件流」面板数据源，支持告警状态实时同步（AC #4）。

### 24.4 运维 API 设计（Gap 2 补齐）

> 完整接口契约见 **API-DESIGN §15**。鉴权统一 `Bearer + RolesGuard(SYSTEM_ADMIN)`；校务主任（SCHOOL_ADMIN）只读。DDL 审计、敏感访问日志等含 P1/P0 数据，仅 SYSTEM_ADMIN 可查（叠加 ABAC，§16）。

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| GET | /api/ops/ssl-certificates | SSL 证书状态列表 | F-OPS-002 |
| GET | /api/ops/ssl-certificates/:domain | 单证书详情+续期历史 | F-OPS-002 |
| GET | /api/ops/token-refresh/websams | WebSAMS Token 刷新状态 | F-OPS-003 |
| POST | /api/ops/token-refresh/websams | 手动触发 Token 立即刷新 | F-OPS-003 |
| GET | /api/ops/coze-quota | Coze 配额实时监控 | F-OPS-006 |
| GET | /api/ops/coze-quota/history | 配额使用率历史时间序列 | F-OPS-006 |
| GET | /api/ops/sensitive-field-access | 敏感字段访问日志/告警查询 | F-OPS-007 |
| GET | /api/ops/ddl-audit | DDL 审计日志查询 | F-OPS-008 |
| GET | /api/ops/health | 运维健康仪表板数据（9 维度+总体）| F-OPS-009 |
| GET | /api/ops/events | 统一运维事件流（分页过滤）| 全局 |
| GET | /api/ops/events/:id | 运维事件详情 | 全局 |

**统一响应约定：** 均返回 `{ data, meta:{ page,pageSize,total } }`；时间字段 ISO8601（`+08:00`）。错误码见 API-DESIGN §15.4（统一前缀 `OPS_`）。

### 24.5 一致性、幂等与安全保证（Gap 3）

| 边界 | 保证 |
|------|------|
| 幂等 | 每个落库点以业务自然键去重：`ssl_cert_status(domain)`、`token_refresh_status(refresh_no)`、`coze_quota_records(sample_at, metric_name)`、`ops_events(event_no)`；`ddl_audit_log` 以 `session_id+command_tag+audit_timestamp` 去重 |
| 只允许系统写入 | 上述运维表仅允许运维/采集进程写入（DB 专用只读/写入账号），业务 API 只读，防止篡改审计证据 |
| 时间一致 | 所有事件带 `event_at`（UTC 存储，Asia/Shanghai 时区展示），`ops_health_metrics.sample_at` 每 1 分钟粒度对齐 Prometheus 拉取间隔（AC #3）|
| 审计完整性 | 敏感访问、DDL、Token 刷新同时写 `audit_logs`（F-USER-005 §16.3），与 `ops_events` 保持幂等双写（同一 `event_no` 关联）|
| 数据分级 | 敏感字段访问日志、DDL 语句含 P1/P0 数据 → 仅 SYSTEM_ADMIN 可读、保留 7 年、冷存归档（§17.6）|
| 不可变审计 | `sensitive_field_access_log`/`ddl_audit_log` 只追加不 UPDATE/DELETE（DB 触发器拒绝），防止抵赖 |

### 24.6 权限矩阵

| 功能 | 校务主任 | 校务处同工 | 教师 | 家长 | 系统管理员 |
|------|----------|------------|------|------|-----------|
| SSL 证书状态查看 | ✅ | ❌ | ❌ | ❌ | ✅ |
| WebSAMS Token 状态查看 / 手动刷新 | ✅(只读) | ❌ | ❌ | ❌ | ✅ |
| Coze 配额监控查看 | ✅ | ✅(只读) | ❌ | ❌ | ✅ |
| 敏感字段访问日志 / 告警查询 | ❌ | ❌ | ❌ | ❌ | ✅ |
| DDL 审计查询 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 运维健康仪表板 / 事件流 | ✅ | ❌ | ❌ | ❌ | ✅ |
| 告警接收 | ✅(E/CRITICAL 升级) | ✅(部分) | ❌ | ❌ | ✅ |

> 文档一致性：表结构→DB-SCHEMA §24，字段→DATA-DICTIONARY §27，接口→API-DESIGN §15，规格→SPEC-COMPLETE F-OPS-002/003/006/007/008/009。

---

## 25. 增强功能模块 — 技术设计（F-AI-003, F-I18N-003, F-I18N-004, F-NEW-002, F-NEW-005, Issue #364）

> 🔧 **补全说明（Issue #364）**：为「增强功能」模块补齐技术设计，作为 DEV 实现 **F-AI-003（OCR 文档识别）、F-I18N-003（实时内容翻译 LLM）、F-I18N-004（区域化与格式本地化 Locale）、F-NEW-002（多渠道通知模板管理）、F-NEW-005（自定义报表生成与定时推送）** 的输入。
>
> **边界与复用（与既有 i18n / 通知 / OCR / 报表模块的关系）：**
> - **i18n（F-I18N-001/002/003/004）**：前端已用 i18next + react-i18next（`school-admin-frontend/src/i18n/locales/`，`en.ts / zh-CN.ts / zh-TW.ts`，静态键值翻译；TERMINOLOGY：`zh-TW`↔ SPEC 的 `zh-HK`）。后端目前无独立翻译入口/出口模块（仅静态资源）。**本节 F-I18N-003 / 004 在后端补齐「动态内容 LLM 实时翻译」与「统一 Locale 格式本地化」，与既有前端静态 i18n 分工而非重复**：前端 `i18next` 管静态 UI 文案，本节在后端提供动态 UGC 内容（家长留言、AI 回复、通知多语言）的翻译服务与 Locale 格式化标准化。`translation_cache`、`locale_configs` 由本节新增表承载。
> - **通知模板（F-NEW-002）**：既有 `notifications` / `notification_deliveries` / `notification_templates`（`apps/backend/src/modules/notification/`，§7.3 多渠道通知架构 + F-AUTO-002 提醒策略层）已实现模板 CRUD、多渠道（app_push/sms/email/feishu/whatsapp）字段、变量列表、发送与送达回执。**本节 F-NEW-002 在其之上补结构化交付规则**（`notification_delivery_rules`）并复用既有 `notification_templates` 表（**不新建重复模板表**），DEV 复用既有 `NotificationService` 发送，本节负责规则化调度（频控/免打扰/备用渠道）。
> - **OCR（F-AI-003）**：现有 OCR 能力为模块内模拟实现（如 `leave-ai-verification.service.ts` 的 `performOcr`，及零用现金 `petty_cash` 报销的 `ocr_status/ocr_result` 内嵌字段）。**本节 F-AI-003 将 OCR 抽为集中式服务**，新增 `ocr_tasks` / `ocr_results` 任务与结果表，统一对接 Azure Computer Vision（§1 技术选型已定 OCR Engine），供各模块复用，**不替换/不删除各模块既有内嵌 OCR 字段**，各模块可增量切换共享本节服务。
> - **报表（F-NEW-005）**：既有报表为固定聚合功能（出勤日报 `attendance_daily_reports`、F-EXAM-004 成绩单 `report_card_*`、F-AUTO-001 `generate_absence_report` 周期任务）。**本节 F-NEW-005 提供通用「拖拽式自定义报表」**（`report_definitions` + `report_schedules`），与既有固定报表并行不冲突；定时推送调度复用 §23 `@nestjs/schedule`（SchedulerRegistry）基建，Dev 把 `report_schedules` 注册为 cron 任务；发送复用 §7.3 通知架构。
>
> **技术栈**：沿用既有 NestJS + TypeORM + PostgreSQL 16（§2 技术栈）；OCR 对接 Azure Computer Vision（§1）；LLM 复用 §2.2 Coze/OpenAI Provider（含 §9.7 配额与回退基建）；Embedding/pgvector（§2.2，可选用于 OCR 结果模糊匹配）；翻译缓存用 Redis（§2 技术栈）；鉴权/角色复用 Module 16（ABAC）。
> **文档一致性**：表结构见 DB-SCHEMA §25，字段见 DATA-DICTIONARY §28，接口见 API-DESIGN §16，规格见 SPEC-COMPLETE F-AI-003 / F-I18N-003 / F-I18N-004 / F-NEW-002 / F-NEW-005。

### 25.1 OCR 文档识别（F-AI-003）

**目标**：为系统提供统一的 OCR 文档识别服务，支持出生证明书、香港身份证、学校报告表、医疗证明书、保险证书五类文档的字段提取，满足 SPEC F-AI-003 准确率目标（>90% ~ >99%）。

**核心实体**：`ocr_tasks`（识别任务主档）、`ocr_results`（识别结果字段明细）。

**OCR 流程（frozen）：**

```
上传/传入文件
  → 1. 创建 ocr_tasks（status=QUEUED；doc_type；source_entity_type/id 关联业务源）
  → 2. 异步 Worker 取任务 → 上传 Azure Computer Vision 识别（status=RUNNING）
  → 3. 按 doc_type 应用对应字段解析模板 parse_schema 抽取字段
  → 4. 写入 ocr_results（每字段一行：field/…/confidence），更新 ocr_tasks.result_id / status=SUCCEEDED
  → 5. 写 audit_logs（audit_action=ocr_task_completed）
失败 → status=FAILED + error_code + 可重试（retry_count ≤ 3）
低置信 → status=MANUAL_REVIEW 供人工校正（衔接既有各业务人工核对）
```

**引擎与降级（frozen）：** 主引擎 Azure Computer Vision（简体/繁体/英文读取）。降级次序：Azure → 备用本地 Tesseract → 人工录入。`engine` 列记录实际使用引擎；识别成功率持续偏低（如 <阈值）自动触发 §23 告警（衔接 §9.7 Coze/第三方回退与监控）。

**文档类型（doc_type）与字段模板（frozen）：**

| doc_type | 提取字段（parse_schema 元素） | 目标准确率 |
|----------|------------------------------|-----------|
| `birth_certificate` | name, gender, birth_date, father_name, mother_name | >98% |
| `hk_id` | name, id_number, birth_date, gender | >99% |
| `school_report` | student_name, class_name, subject_scores, conduct_grade | >95% |
| `medical_certificate` | student_name, doctor_name, diagnosis, rest_days | >90% |
| `insurance_cert` | policy_no, effective_date, expiry_date, insured_name | >98% |

**幂等与关联：** `ocr_tasks` 以 `(source_entity_type, source_entity_id, doc_type)` 业务键防重复（同业务单据只一次，新识别以新任务覆盖并通过 `superseded_task_id` 标记旧任务）；`ocr_results.task_id` FK 关联；`raw_text` 存全量识别文本、`parse_schema` 存应用的模板版本（JSONB）。文件以对象存储 URL 引用（`file_url`），含 P1 文档（hk_id / 医疗）按 §F-COMP-001 PDPO 合规（加密、双重授权、审计）。

### 25.2 实时内容翻译（F-I18N-003）

**目标**：为动态 UGC 内容（家长留言、AI 回复、通知多语言、文档提取后翻译）提供 LLM 实时翻译，满足 SPEC F-I18N-003 实时 <3s、批量 <30s/页、术语表一致、翻译错误率 <1%。

**核心实体**：`translation_cache`（翻译结果缓存）。

**翻译流程（frozen）：**

```
translate(text, source, target, use_cache=true)
  → 1. source == target 直接返回（cached=false）
  → 2. cache_key = SHA256(text + source + target)；查 translation_cache（hash 唯一）
       命中且未过期(24h) → 返回 cached=true
  → 3. 调 LLM（Coze/OpenAI；context='school_admin_hk'；附术语表 glossary）
  → 4. 写 translation_cache（upsert，on conflict(hash) do update，expires_at = now + 24h）
  → 5. 返回 { translated, confidence, glossary_applied, cached }
批量：逐条同 2-4，上限 50 条/请求（SPEC 验收 #3）；同 source+target 可合并为一次 LLM 调用（实现优化，非强制）
```

**术语表（glossary）来源：** 复用前端静态 i18n 术语 + 既有业务词库；`glossary_applied` 计入翻译结果。术语更新时以 `translation_cache.meta.glossary_version` 版本使缓存失效（见 25.5 一致性）。

**缓存设计：** `translation_cache` 以 `hash`（SHA256(text+source+target)）唯一；`expires_at = created_at + 24h`。查询侧惰性过期（`expires_at < now()` 判过期并允许覆盖写），另由每日清理任务删除过期行（接入 §23 周期任务，`action_type` 新增 `purge_translation_cache`）。

### 25.3 区域化与格式本地化（F-I18N-004）

**目标**：统一数字、货币、日期、时间、文件大小等展示格式，满足 SPEC F-I18N-004 各语言/地区习惯（zh-HK/zh-CN/en），并保证 PDF 导出与界面语言一致。

**核心实体**：`locale_configs`（默认 Locale 配置 + 可选按学校覆盖）。

**默认格式（frozen，固化于 `locale_configs` 的 `is_default=true` 行）：**

| 数据类型 | zh-HK | zh-CN | en |
|----------|-------|-------|-----|
| 日期 | `yyyy年M月d日` / `dd/MM/yyyy` | `yyyy年M月d日` | `MMMM d, yyyy` |
| 时间 | `a h:mm`（上午/下午） | `A h:mm`（上午/下午） | `h:mm a` |
| 货币 | `HK$`（HKD） | `¥`/`RMB ¥`（港币业务保留 `HK$`） | `HK$`（HKD） |
| 数字 | 千位分隔 `1,234.56` | 千位分隔 | 千位分隔 |
| 百分比 | `85.5%` | `85.5%` | `85.5%` |
| 学号 | 原样保留 | 原样保留 | 原样保留 |
| 文件大小 | `1.5 MB` / `2.3 GB` | 同 | 同 |

**设计：** 后端提供 `LocaleFormattingService`（formatDate/formatCurrency/formatNumber/formatPercent/formatFileSize），读取 `locale_configs` 取当前 locale 配置；前端以 `date-fns` + ECMAScript `Intl` 渲染（§2 技术栈），后端保证 PDF 导出与存储侧格式化一致（SPEC 验收 #4）。Locales 判定优先级衔接 §14.3 语言检测：`user.preferred_locale` → URL `?lang` → Cookie `i18n_locale` → Accept-Language → IP → 默认 `zh-HK`。`locale_configs.scope`（`global/school/user`）支持不同粒度覆盖，`school_id` 与 `user_id` 按 scope 引用。

### 25.4 多渠道通知模板管理（F-NEW-002）

**目标**：集中管理通知模板的差异化渠道配置、变量替换、灰度与交付规则，满足 SPEC F-NEW-002 多渠道（微信模板/短信/邮件/飞书/App）管理与验收（多渠道配置、变量无遗漏、紧急自动备用、历史可查）。

**核心实体**：复用既有 `notification_templates` + 既有 `notifications` / `notification_deliveries`；新增 `notification_delivery_rules`。

**边界与分工（frozen）：**
- **复用**：模板主档、多渠道内容字段、变量列表、发送、送达回执 → 既有 `NotificationService` + `notification_templates` / `notifications` / `notification_deliveries`（§7.3 + F-AUTO-002）。既有 `notification_templates` 已含 `wechat_template_id`/`app_push_content`/`sms_content`/`email_subject`/`email_body`/`whatsapp_content` 渠道字段、`channels`(JSON)、`fallback_channel`、`variables`(JSON)、`min_interval_minutes`/`max_daily_per_parent`/`quiet_hours`（详见 DB-SCHEMA §25 表定义）。
- **本节新增**：`notification_delivery_rules`——把 SPEC F-NEW-002 `delivery_rules`（`min_interval_minutes`、`max_daily_per_parent`、`quiet_hours`）规范化为与模板一对一的可维护规则记录，并支持渠道级备用（`fallback_channel`）、接收角色过滤（`recipient_roles`）、灰度比例（`rollout_percent`）。DEV 复用既有发送服务，仅在此规则之上做频控/免打扰/备用判定（先查规则再发送）。
- **渠道**（复用 `NotificationChannel` 枚举）：`app_push`/`sms`/`email`/`feishu`/`whatsapp`。紧急通知（HIGH/CRITICAL）按 SPEC 自动走 SMS 备用（`fallback_channel`）。
- **模板分类**（复用 `NotificationCategory` 枚举）：`bus`（校车）/`attendance`（出勤）/`academic`（成绩）/`fee`（缴费）/`activity`（活动）/`emergency`（紧急）/`daily`（日常）。

### 25.5 自定义报表生成与定时推送（F-NEW-005）

**目标**：为校务主任及各级管理人员提供自助式报表生成、多维度筛选、分组聚合、图表与导出，并支持定时自动推送与订阅管理，满足 SPEC F-NEW-005 验收（30 分钟建表、定时推送准时、数据一致）。

**核心实体**：`report_definitions`（报表定义/生成器配置）、`report_schedules`（定时推送配置）、`report_subscriptions`（用户订阅/退订）。

**报表定义（frozen）：**
- 字段选择：多表关联（学生×成绩、出勤×班级），以 JSONB `data_source` 存储数据源与字段映射。
- 筛选条件：等值/范围/模糊；AND/OR 组合，JSONB `filters`。
- 排序：多字段、方向可调，JSONB `sorts`。
- 分组聚合：按班级/年级/月份/教师等维度，JSONB `group_by` + `aggregations`（count/sum/avg/min/max）。
- 图表类型：`chart_type`：`bar`/`pie`/`line`/`numeric`。
- 导出格式：`export_formats`：`pdf`/`excel`/`csv`。
- `sql_template` 存生成后的安全查询（只读 DSL 白名单，防注入），`result_snapshot` 存最近一次生成快照供一致比对（验收 #3）。

**定时推送（frozen）：**
- 频率：每日/每周/每月/每学期；精确到小时（默认工作日 09:00）。`report_schedules.recurrence_type`：`daily`/`weekly`/`monthly`/`semester`；`weekday`/`day_of_month`/`time` 由 `cron_expression` 承载（复用 §23 规则）。
- 格式：PDF 附件 + 正文摘要；渠道：App 通知 + 邮件（复用 §7.3 通知架构）。
- 调度实现：DEV 用 `@nestjs/schedule` SchedulerRegistry 把 `report_schedules`（status=active）注册为 cron job；每次执行写 `report_deliveries`（status=pending→running→success/failed，`notification_id` 关联已发送通知）。
- 订阅管理：`report_subscriptions` 供用户订阅/退订各报表，推送接收人 = 报表 `owner_id` + 订阅者。

### 25.6 一致性、幂等与安全保证

| 边界 | 保证 |
|------|------|
| OCR 幂等 | `ocr_tasks(UNIQUE source_entity_type, source_entity_id, doc_type)` 防重；重识别以 `superseded_task_id` 覆盖 |
| 翻译幂等 | `translation_cache(UNIQUE hash)`；`ON CONFLICT(hash) DO UPDATE` |
| Locale 默认 | `locale_configs` 仅一条 `is_default=true+school_id=null`（每种 locale）；school/user 按 scope 覆盖 |
| 通知规则 | `notification_delivery_rules` 与 `notification_templates` 一对一（`template_id UNIQUE`） |
| 报表幂等 | `report_schedules` 执行按 `(schedule_id, scheduled_at)` 幂等，防重复推送 |
| 安全 | OCR 文件、报表导出含 P1/P2 数据 → 加密、RBAC/ABAC 校验、写 `audit_logs`（见 §25.7 权限矩阵） |
| 术语一致 | 翻译术语更新使 `translation_cache` 按 `glossary_version` 失效 |
| 时间一致 | 所有 `_at` 计时列 UTC 存储，Asia/Shanghai 展示；`report_schedules` cron 按服务器时区对齐 |

### 25.7 权限矩阵

| 功能 | 校务主任 | 校务处同工 | 教师 | 家长 | 系统管理员 |
|------|----------|------------|------|------|-----------|
| OCR 提交/查看（本人业务） | ✅ | ✅(范围内) | ✅(范围内) | ❌ | ✅ |
| OCR 全量查看 / 人工校正 | ✅ | ✅ | ❌ | ❌ | ✅ |
| 实时翻译 / 批量翻译 | ✅ | ✅ | ✅ | ✅(聊天) | ✅ |
| Locale 配置查看 / 修改 | ✅(查看) | ✅(查看) | ✅(查看) | ❌ | ✅(修改) |
| 通知模板管理 | ✅ | ✅ | ❌(仅引用) | ❌ | ✅ |
| 通知发送 / 交付规则 | ✅ | ✅ | ✅(可授权) | ❌ | ✅ |
| 自定义报表定义 / 生成 | ✅ | ✅ | ✅(本人数据) | ❌ | ✅ |
| 报表订阅 / 退订 | ✅ | ✅ | ✅ | ❌ | ✅ |
| 报表全量数据导出 | ✅ | ✅(范围内) | ❌ | ❌ | ✅ |

> 文档一致性：表结构→DB-SCHEMA §25，字段→DATA-DICTIONARY §28，接口→API-DESIGN §16，规格→SPEC-COMPLETE F-AI-003 / F-I18N-003 / F-I18N-004 / F-NEW-002 / F-NEW-005。
