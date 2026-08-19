# UAT 访问清单 — CR-20260714-001 (Phase 5 / T26)

> **创建**: 2026-08-18 · **DEVOPS** · 关联 Issue #262
> **用途**: 为真实用户 UAT（Issue #262 T26）提供环境访问入口、测试账号、已知限制与健康基线。
>
> ⚠️ **敏感凭据警告**: 本文件包含**明文密码**。属于本地敏感文件，**禁止推送 GitHub、禁止粘贴到 chat / Issue comment / 邮件 / 群聊**。仅在需要时私密分发。
> 🔒 **已 gitignore**（`.gitignore` 含本文件条目）——本仓库为 PUBLIC，切勿 commit/push 本文件。

---

## 1. 外部访问入口（Coze Proxy）

> 所有外部门户经 Coze proxy → localhost。本环境无独立公网 tunnel（见 §4 限制）。

| 角色 | 用途 | 外部 URL (Coze proxy) |
|------|------|----------------------|
| 教职工 / 管理员（后台） | 考勤扫码终端、审批、日报、管理菜单 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/` |
| 学生（门户 + QR 展示码） | 个人档案、我的QR码、电子请假、考勤、成绩、课表 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student` |
| 家长（门户） | 子女档案(只读)、子女考勤、代请假、成绩、缴费 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent` |
| QR 考勤（学生展示码页） | 扫码签到（学生侧展示） | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr` |
| 健康检查 | 环境就绪自检 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/health` |

**实测可达性（2026-08-18）**：`/school-admin/` 200、`/portal/student` 200、`/portal/parent` 200、`/attendance/qr` 200、`/school-admin/api/health` 200 `{"status":"ok"}`、根 `/` 200。

---

## 2. UAT 测试账号（4 类角色 · 登录状态已核对）

> **核对方法**：通过 `/api/auth/login` 实测登录（+ OTP 验证时取后端容器日志一次性码），`last_login` 与 token 角色均确认。均为共享演示账号。
> **OTP 情况**：student/parent 直接返回 access_token（无需 OTP）；director/teacher/admin 强制邮箱 OTP（见 §3 说明）。

| 角色 | 首选账号 | OTP | 状态 | 备用账号（存在·active） |
|------|---------|-----|------|------------------------|
| **校务主任** (school_director) | `director` | ✅ 需邮箱OTP | ✅ 登录+验OTP全通 (school_director) | —（仅此1个 active director） |
| **教职工/班主任** (teacher) | `teacher_1a` | ✅ 需邮箱OTP | ✅ 登录+验OTP全通 (teacher) | `teacher_2b`、`teacher_3a`（active） |
| **学生** (student) | `student1` | ❌ 无需 | ✅ 直接登录 (student) | `teststu21`、`stu001`、`testlogin`（active） |
| **家长** (parent) | `parent1` | ❌ 无需 | ✅ 直接登录 (parent) | `parent_chen`、`parent_li`、`parent006`（active） |

> **附加**: 后台通用 `staff1`（school_staff，无需 OTP，`Admin123!`）可用于教职工后台侧快速巡检（历史 wiki 推荐账号）。

### 密码（⚠️ 仅存本文件，勿外泄）

| 账号 | 角色 | 密码 | OTP 备注 |
|------|------|------|----------|
| `director` | school_director | `director123` | 登录后需邮箱OTP（码在后端日志） |
| `teacher_1a` | teacher | `Teacher@123` | 登录后需邮箱OTP（码在后端日志） |
| `student1` | student | `Admin123!` | 免OTP |
| `parent1` | parent | `Admin123!` | 免OTP |
| `staff1` | school_staff | `Admin123!` | 免OTP |

---

## 3. ⚠️ 角色 OTP 限制（UAT 前务必知悉）

- 后端 `auth.service.ts` 强制 **TEACHER / SCHOOL_DIRECTOR / SYSTEM_ADMIN** 登录需**邮箱 OTP**（与 `otp_enabled` 无关，代码级强制）。
- 本环境 `NOTIFICATION_CHANNEL=mock`（不真实发邮件），但 OTP 码会通过 `console.log` 打到 **backend 容器日志**。
  - **获取 OTP 方式**（UAT 执行时）：`docker logs school-admin-backend --since 2m | grep "OTP for <username>"`，取 6 位码，在登录页完成 OTP 验证。
- 已实测 director/teacher_1a 走「登录→取下日志OTP→verify-otp」**可完整拿到 access_token**（角色正确）。
- **建议**：若 UAT 需大量 director/teacher 登录且不便读日志，可考虑临时切 `NODE_ENV=development`（login 直接返回 `otpCode`）或换用手测为主。**此为建议，未擅自改配置。**

---

## 4. 已知环境限制

| 限制 | 说明 | 影响 |
|------|------|------|
| **Docker Hub / registry 不可达** | `docker.io:443`、`registry-1.docker.io:443` 均 timeout | ⚠️ 无法在本机 `pull` 新 base image / 重建 backend 镜像；阻碍 #309 镜像重建部署与未来升级 |
| **无独立公网 tunnel** | cloudflared 已停；对外仅依赖 Coze proxy | 外部门户只能用 Coze 根地址；custom domain (school-admin.coze.site 等) 未接线（#310 provider 侧待绑定） |
| **backend 版本已含 HEAD** | 运行镜像 `school-admin-backend:v1.5.9`（Image tag 为旧版号，代码实为 `53e2c31`（HEAD））——容器 Dockerfile 含 #309 offline-embed pg_dump 16.15 debs，`pg_dump 16.15` 实测在位、夜间备份连续 14+ 晚非空 | ✅ **未落后 main**，无需部署 |
| **磁盘 89%** | 40G 已用 33G，余 4.5G | 高峰期备份/日志需留意，暂不阻塞 UAT |
| **内存偏紧** | 3.8Gi 总 / 3.3Gi 用 / 无 swap，available ~579Mi | 同时开大量 UAT 会话或重型操作时注意 |
| **portal 请假 schema 缺口** | 部署的 portal leave entity `@Entity('leave_requests')` 指向表 **`leave_requests` 在 DB 中不存在**（现 DB 有 `leaves`；HEAD 新增迁移 `CreateQrAttendanceAndPortalLeaveTables` 会建 `leave_requests`+`offline_sync_buffer`，`IF NOT EXISTS` 幂等，但**未部署**）。 | ⚠️ 待确认：portal 电子请假功能在当前测试环境可用性需 QA/DEV 复核（DEVOPS 不做业务诊断）。已列入版本差异报告。 |

---

## 5. 环境健康快照（UAT 基线，2026-08-18 15:46 CST）

### Docker 容器（13 Up，无 unhealthy/exited）

| 容器 | 状态 | 端口 |
|------|------|------|
| school-admin-backend | Up 2 days (image v1.5.9) | 3000 |
| school-admin-frontend (admin-app) | Up 2 days (nginx) | 8080 |
| school-admin-frontend-v2 (portal-app) | Up 2 days (nginx) | 8081 |
| school-admin-grafana | Up 2 days | 3001 |
| school-admin-prometheus / node-exporter / postgres-exporter / alertmanager | Up 2 days | 9091 / 9100 / 9187 / 9093 |
| school-admin-postgres | Up 2 days (healthy) | 5432 |
| school-admin-redis | Up 2 days (healthy) | 6379 |
| school-admin-kafka / zookeeper / opa | Up 2 days | 9092 / 2181 / 8181 |

### 资源

| 项 | 值 |
|----|----|
| 磁盘 / | 40G，已用 33G (89%)，余 4.5G |
| 内存 | 3.8Gi 总 / 3.3Gi 用 / free 116Mi / buff-cache 781Mi / available 579Mi / swap 0 |
| 运行时长 | up 2 days 7:46 |
| 负载 | loadavg 12.64 / 16.72 / 9.41（历史均值偏高，瞬时正常） |

### 健康端点（全 200）

- `GET localhost:3000/api/health` → `{"status":"ok"}`
- `GET localhost:8080/` 、`localhost:8081/` 、`localhost:5001/` → 200

---

## 6. 代码版本核对结果（backend == main HEAD ✅）

| 项 | 测试环境现状 | main (HEAD) | 差异 |
|----|--------------|-------------|------|
| Backend 镜像/代码 | `school-admin-backend:v1.5.9`（built 2026-08-14），容器 Dockerfile==HEAD（含 #309 offline-embed pg_dump），`pg_dump 16.15` 在位且备份连续 14+ 晚非空 | HEAD `53e2c31` | ✅ **不在落后**（`53e2c31` 仅改 Dockerfile/debs/部署脚本，未改 backup.service.ts；容器 Dockerfile 与 HEAD 逐字一致） |
| 前端 admin-app (8080) | `version.json` = **v1.6.1 / commit 2c7680c / build 2026-08-02**，served `index-B52kQjGo-20260707.js` | 一致（版本台账相同） | ✅ 与台账相符 |
| 前端 portal-app (8081) | `index-DZuNsJUY-20260707.js` + `index-DIFrQjOg.js` 含 QR/portal 关键字 | — | ✅ **QR考勤 + 学生/家长门户功能在构建产物中** |
| DB 迁移 | QR/考勤表已存在；`leave_requests`、`offline_sync_buffer` **缺失** | HEAD 含 `CreateQrAttendanceAndPortalLeaveTables`（5表，`IF NOT EXISTS` 幂等，未部署） | ⚠️ 见 §4 |

**结论**：测试环境 backend 代码==main HEAD（`53e2c31`），前端 admin v1.6.1/2c7680c 与台账一致，portal-app 构建产物含 QR 考勤 + 学生/家长门户功能。**无需任何部署升级**。唯一待办为 portal 请假表 `leave_requests` schema 缺口（交 QA/DEV 复核）。**未擅自部署任何变更**。

---

## 7. 交接 / 待办

- [ ] UAT 执行者确认 §3 的 director/teacher OTP 取码流程可用（或决定切换 NODE_ENV）
- [ ] QA/DEV 复核 §4「portal 请假 schema 缺口」是否影响 UAT 用例 UC2 电子请假
- [ ] PM/DEVOPS 复核 `leave_requests`/`offline_sync_buffer` 迁移是否需在测试环境补跑（QR/考勤表已在，请假表缺）
- [ ] 本文件含明文密码，交付后请勿外传
