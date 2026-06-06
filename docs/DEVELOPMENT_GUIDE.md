# 开发环境搭建指南

## 1. 环境要求
- Node.js >= 22.0.0
- Docker >= 24.0.0
- Docker Compose >= 2.20.0
- pnpm >= 8.0.0 (推荐使用pnpm作为包管理器)

## 2. 快速开始

### 2.1 克隆项目
```bash
git clone <repository-url>
cd school-admin-system
```

### 2.2 安装依赖
```bash
pnpm install
```

### 2.3 启动基础设施服务
```bash
cd infra
docker-compose up -d
```
启动的服务包括：
- PostgreSQL 16: 5432端口，用户名school_admin，密码school_admin123
- Redis 7: 6379端口
- Kafka: 9092端口
- Prometheus: 9091端口
- Grafana: 3001端口，用户名admin，密码admin123

### 2.4 数据库初始化
```bash
cd packages/database
pnpm migrate:dev
```
或者直接执行SQL脚本：
```bash
psql -h localhost -U school_admin -d school_admin -f migrations/0001_initial_schema.sql
psql -h localhost -U school_admin -d school_admin -f migrations/0002_initial_data.sql
```

### 2.5 启动后端服务
```bash
cd apps/backend
pnpm dev
```
后端服务启动在 http://localhost:3000
API文档地址：http://localhost:3000/api-docs

### 2.6 启动前端服务
```bash
cd apps/frontend
pnpm dev
```
前端服务启动在 http://localhost:5173

## 3. 项目结构
```
school-admin-system/
├── apps/
│   ├── backend/          # 后端Node.js服务 (NestJS)
│   └── frontend/         # 前端React服务
├── packages/
│   ├── common/           # 公共工具库
│   ├── types/            # TypeScript类型定义
│   └── database/         # 数据库相关 (schema, migrations, ORM配置)
├── infra/                # 基础设施配置 (Docker Compose, K8s)
├── .github/workflows/    # CI/CD配置
├── docs/                 # 项目文档
└── scripts/              # 脚本文件
```

## 4. 开发规范

### 4.1 代码规范
- 使用TypeScript进行开发
- 遵循ESLint配置的代码规范
- 提交代码前执行`pnpm lint`检查代码
- 提交信息遵循Conventional Commits规范：
  ```
  feat(scope): 新功能描述
  fix(scope): 修复描述
  docs(scope): 文档更新
  style(scope): 代码格式调整
  refactor(scope): 代码重构
  perf(scope): 性能优化
  test(scope): 测试相关
  chore(scope): 构建/工具等调整
  ```

### 4.2 数据库规范
- 所有表必须包含`created_at`、`updated_at`字段
- 敏感数据使用软删除`deleted_at`字段
- 主键使用UUID类型
- 外键必须添加索引
- 迁移脚本命名规范：`{序号}_{描述}.sql`

### 4.3 API规范
- 所有API返回统一格式：
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {},
    "requestId": "uuid"
  }
  ```
- 错误码规范：
  - 0: 成功
  - 400: 请求参数错误
  - 401: 未授权
  - 403: 权限不足
  - 404: 资源不存在
  - 500: 服务器内部错误
- API必须包含版本号，例如`/api/v1/xxx`

## 5. 测试规范
- 单元测试覆盖率 >= 80%
- 使用Jest作为测试框架
- 测试文件命名规范：`{文件名}.spec.ts`
- 提交代码前执行`pnpm test`确保所有测试通过

## 6. 部署规范
- 开发环境：使用Docker Compose本地部署
- 测试环境：提交代码到develop分支后自动部署
- 生产环境：提交代码到main分支后，经过CI检查后手动部署

## 7. 常见问题

### 7.1 数据库连接失败
- 检查Docker容器是否正常启动：`docker ps`
- 检查端口是否被占用：`lsof -i :5432`
- 检查数据库用户名密码是否正确

### 7.2 Kafka连接失败
- 检查Zookeeper是否正常启动
- 检查Kafka配置的advertised.listeners是否正确
- 等待Kafka完全启动后再尝试连接

### 7.3 Grafana无法访问
- 检查Grafana容器是否正常启动
- 检查端口3001是否被占用
- 默认用户名密码：admin / admin123
