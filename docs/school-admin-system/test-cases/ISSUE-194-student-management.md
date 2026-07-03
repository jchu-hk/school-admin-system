# Issue #194 测试用例 - 学生管理模块

> 创建日期：2026-07-03
> 状态：已就绪
> Issue: #194

## 前置条件

- [x] 数据库 students, class_allocations, academic_years 表已创建
- [x] 后端 API /api/students 端点已实现 (commit 438618f)
- [x] 前端 StudentPage.tsx 已迁移到 /api/students (commit 36da8ec)

## 测试用例

### TC-001: 学生列表加载

| 项目 | 内容 |
|------|------|
| ID | TC-001 |
| 标题 | 学生列表加载 |
| 端点 | GET /api/students |
| 步骤 | 1. 访问 /students 页面<br>2. 页面自动加载学生列表 |
| 期望结果 | 返回 HTTP 200；列表显示所有已创建学生；显示学号、姓名、班级 |
| 优先级 | P0 |

### TC-002: 创建学生（手动学号）

| 项目 | 内容 |
|------|------|
| ID | TC-002 |
| 标题 | 创建学生（手动输入学号） |
| 端点 | POST /api/students |
| 请求体 | `{"name": "王小明", "student_id": "2026-0001", "gender": "male", "class_id": 1}` |
| 期望结果 | 返回 HTTP 201 + 学生对象（含 id）；列表刷新后显示新学生 |
| 优先级 | P0 |

### TC-003: 创建学生（学号自动生成）

| 项目 | 内容 |
|------|------|
| ID | TC-003 |
| 标题 | 创建学生（学号自动生成） |
| 端点 | POST /api/students |
| 请求体 | `{"name": "李小红", "gender": "female"}` （student_id 留空） |
| 期望结果 | 学号字段自动填充（如 2026-0002）；格式符合学校规范 |
| 优先级 | P1 |

### TC-004: 编辑学生

| 项目 | 内容 |
|------|------|
| ID | TC-004 |
| 标题 | 编辑学生信息 |
| 端点 | PATCH /api/students/:id |
| 请求体 | `{"name": "王小明_updated"}` |
| 期望结果 | 返回 HTTP 200；学生姓名已更新；列表显示更新后数据 |
| 优先级 | P0 |

### TC-005: 删除学生

| 项目 | 内容 |
|------|------|
| ID | TC-005 |
| 标题 | 删除学生 |
| 端点 | DELETE /api/students/:id |
| 期望结果 | 返回 HTTP 200 或 204；学生从列表消失 |
| 优先级 | P0 |

### TC-006: 班级分配

| 项目 | 内容 |
|------|------|
| ID | TC-006 |
| 标题 | 学生分配到班级 |
| 端点 | POST /api/students/:id/class |
| 请求体 | `{"class_id": 2}` |
| 期望结果 | 学生与班级关联；查询学生时包含班级信息 |
| 优先级 | P1 |

### TC-007: 错误处理 - 重复学号

| 项目 | 内容 |
|------|------|
| ID | TC-007 |
| 标题 | 创建学生 - 重复学号 |
| 端点 | POST /api/students |
| 请求体 | 使用 TC-002 中已存在的学号 |
| 期望结果 | 返回 HTTP 409 Conflict 或 400；提示学号已存在 |
| 优先级 | P2 |

### TC-008: API 直接验证（curl 测试）

| 项目 | 内容 |
|------|------|
| ID | TC-008 |
| 标题 | API 端点直接验证 |
| 端点 | ALL |
| 期望结果 | 所有端点返回正确 HTTP 状态码和 JSON 结构 |
| 优先级 | P0 |

```bash
# TC-008 curl 测试
curl -s http://localhost:4000/api/students | jq .
curl -s -X POST http://localhost:4000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"测试学生","gender":"male"}' | jq .
```

## 测试顺序

1. TC-008（API 直接验证）→ 确认后端正常
2. TC-001（列表加载）→ 确认列表页正常
3. TC-002（创建学生）→ P0
4. TC-004（编辑学生）→ P0
5. TC-005（删除学生）→ P0
6. TC-003（学号自动生成）→ P1
7. TC-006（班级分配）→ P1
8. TC-007（重复学号）→ P2
