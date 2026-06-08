# 智能校园管理系统 (Smart School Admin System)

## 项目简介
这是一个功能完整的智能校园管理系统，涵盖学校管理、用户管理、学生管理、考勤管理、收费管理、家校互动、教学管理等多个模块，支持多学校部署，符合香港教育署的相关规范。

## 技术栈
- 后端：Node.js 22 + NestJS + TypeORM + PostgreSQL 16
- 前端：React 18 + TypeScript + Ant Design
- 消息队列：Kafka
- 缓存：Redis 7
- 监控：Prometheus + Grafana
- 认证：JWT + 多因素认证
- 权限：RBAC + ABAC (OPA)
- 部署：Docker + Docker Compose + Kubernetes

## 主要功能
### 1. 核心管理
- 学校信息管理
- 部门管理
- 学年学期管理

### 2. 用户与权限
- 多角色管理 (超级管理员、学校管理员、教师、家长、学生)
- 精细化权限控制
- 多因素认证支持
- 操作审计日志

### 3. 学生与班级
- 学生信息管理
- 班级管理
- 教师管理
- 家长信息管理
- 家校关联

### 4. 日常运营
- 考勤管理 (支持人脸识别、打卡机导入)
- 迟到早退管理
- 午膳订单管理
- 校车实时跟踪
- 请假申请与审批
- 收费管理
- 家长查询与回复
- 智能问答知识库

### 5. 周期性校务
- 入学注册管理
- 教材管理
- 考试报名与成绩管理

### 6. 财务与资产
- 学费评定
- 零用现金管理
- 资产全生命周期管理
- 供应商管理

## 快速开始
请参考 [开发环境搭建指南](./docs/DEVELOPMENT_GUIDE.md) 进行环境搭建和项目启动。

## 项目结构
```
school-admin-system/
├── apps/
│   ├── backend/          # 后端Node.js服务
│   └── frontend/         # 前端React服务
├── packages/
│   ├── common/           # 公共工具库
│   ├── types/            # TypeScript类型定义
│   └── database/         # 数据库相关配置
├── infra/                # 基础设施配置
├── docs/                 # 项目文档
└── scripts/              # 脚本文件
```

## 环境要求
- Node.js >= 22.0.0
- Docker >= 24.0.0
- pnpm >= 8.0.0

## 开发规范
- 遵循Conventional Commits提交规范
- 单元测试覆盖率 >= 80%
- 代码必须通过ESLint检查

## License
MIT
