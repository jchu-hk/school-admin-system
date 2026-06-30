# 测试数据准备脚本

本目录包含用于生成测试数据的脚本，可在 Mac 本地测试环境中使用。

---

## 📋 可用脚本

| 脚本 | 用途 | 使用方式 |
|------|------|----------|
| `seed-users.sql` | 创建测试用户账号 | `psql -f scripts/seed-users.sql` |
| `seed-dashboard-data.sql` | Dashboard 测试数据 | `psql -f scripts/seed-dashboard-data.sql` |
| `seed-attendance-data.sql` | 出勤记录测试数据 | `psql -f scripts/seed-attendance-data.sql` |
| `seed-dashboard-complete.sql` | 完整 Dashboard 数据 | `psql -f scripts/seed-dashboard-complete.sql` |
| `seed-daily-attendance.sh` | 每日出勤数据 | `./scripts/seed-daily-attendance.sh` |
| `generate-test-data.js` | 综合测试数据生成 | `node scripts/generate-test-data.js` |

---

## 🚀 Mac 本地环境使用方法

### 方法 1：Docker 容器内执行

```bash
# 进入后端容器
docker exec -it school-admin-backend bash

# 执行 SQL 脚本
psql -U postgres -d school_admin -f /app/scripts/seed-users.sql
psql -U postgres -d school_admin -f /app/scripts/seed-dashboard-complete.sql
```

### 方法 2：从宿主机执行

```bash
# 连接到 Docker PostgreSQL
docker exec -i school-admin-db psql -U postgres -d school_admin < scripts/seed-users.sql

# 或使用 psql 直接连接（如果端口映射）
psql -h localhost -p 5432 -U postgres -d school_admin -f scripts/seed-users.sql
```

### 方法 3：使用 Node.js 脚本

```bash
# 生成综合测试数据
node scripts/generate-test-data.js
```

---

## 📊 测试账号

脚本会创建以下测试账号：

| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | 系统管理员 |
| staff1 | Admin123! | 校务人员 |
| teacher1 | Admin123! | 教师 |
| parent1 | Admin123! | 家长 |
| student1 | Admin123! | 学生 |

---

## 🔧 数据类型

### Dashboard 数据
- 班级：7个
- 学生：8个
- 家长：3个
- 出勤记录：每日5条
- 家长查询：3个

### 出勤数据
- 出勤状态：present, late, absent, leave_early
- 每日自动生成

---

## ⚠️ 注意事项

1. 执行脚本前确保 PostgreSQL 容器已启动
2. 脚本会覆盖现有数据，谨慎在生产环境使用
3. `seed-daily-attendance.sh` 可配置为 cron job 自动执行

---

## 📅 自动化配置

```bash
# 每日 06:00 自动生成出勤数据
crontab -e
0 6 * * * cd /workspace/projects/workspace && ./scripts/seed-daily-attendance.sh
```

---

*脚本位置：`/app/scripts/` (Docker 容器内)*
*宿主机位置：`scripts/` (项目根目录)*