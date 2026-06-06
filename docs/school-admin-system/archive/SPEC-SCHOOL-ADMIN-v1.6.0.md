# 智能校务助理系统 — 完整功能规格书
## Smart School Admin AI System — Complete Functional Specification

---

### 📋 文档版本信息

| 字段 | 内容 |
|------|------|
| 文档名称 | 智能校务助理系统 — 完整功能规格书 |
| 文档编号 | SPEC-SCHOOL-ADMIN-001 |
| 当前版本 | **v1.6.0** |
| 文档状态 | ~~已核准 (Approved)~~ **→ 变更中 (Change in Progress)** |
| 存放位置 | `/docs/school-admin-system/SPEC-COMPLETE.md` |
| 主维护人 | 系统架构团队 |
| 审批人 | 校务主任 / 项目经理 |

### 📌 版本修订规则

| 规则 | 说明 |
|------|------|
| **版本号格式** | `Major.Minor.Patch` (语义化版本) |
| **Major (主版本)** | 重大架构变更、功能模块增减、不兼容变更 |
| **Minor (次版本)** | 新增功能、模块扩展、字段变更（向后兼容）|
| **Patch (修订版)** | 文档修正、格式调整、错别字纠正（不影响功能）|
| **Changelog 粒度** | 每次正式变更必须记录，Patch 版本可选 |
| **审批要求** | Minor 及以上变更需项目经理/校务主任审批 |
| **分支策略** | 在 CI/CD 流程中维护，变更通过 Pull Request 合并 |

---

## 第一部分：需求规格说明书 (Requirements Specification)

### 1.1 系统概述

**项目名称：** 智能校务助理系统 (Smart School Admin AI System)
**项目目标：** 为香港中学校务处构建一个AI驱动的智能工作平台
**核心价值：**
- **自动化**：重复性工作的智能处理与提醒
- **整合化**：分散系统的数据统一管理
- **合规化**：确保符合香港教育局及隐私条例要求
- **协同化**：支持多同工协作与权限管理

### 1.2 用户角色

| 角色 | 职责范围 | 系统权限 |
|------|----------|----------|
| 校务主任 | 统筹管理、决策审批 | 全权限 |
| 校务处同工 | 日常执行、数据处理 | 操作权限 |
| 教师 | 查询、申请、填报 | 受限权限 |
| 家长/学生 | 查询、申请、缴费 | 门户权限 |

### 1.3 工作分类

#### 恒常性事务（按日/周/月循环）
- **每日必做**：处理学生迟到/早退记录、接听家长查询、分派校内通讯、统计午餐订饭人数、管理校车点到、处理突发请假及各类收费
- **每周/每月**：统计教师代课安排、更新全校通讯录、盘点文具仓存、整理校务处会议记录、处理水电网络等常规缴费

#### 周期性事务（按学年阶段推进）
- **开学前后（7-9月）**：协助编班及分发课本、处理转校/新生注册、回收各项同意书、购买学生保险
- **考试与成绩期（10-6月）**：协助报名DSE及校内试、印制/密封试卷、处理特别考试安排、发布成绩单
- **行政及人事**：协助教师招聘、更新EDB网上资料、管理校车/饭盒供应商合约
- **收生与升学**：协助中一自行分配学位面试、处理中六联招/JUPAS文件及推荐信
- **学年结束（6-8月）**：盘点及销毁旧文件、整理全校学生档案移交、结算各项杂费

#### 财务及资产（贯穿全年）
- **财务**：零用现金报销、学费/堂费点算、奖学金/车船津贴申请
- **资产**：校产条码盘点、租借场地管理、课本/冷气机等设备保养记录

---

## 第二部分：系统架构设计

### 2.1 技术架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户界面层 (Presentation Layer)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web 后台    │  │  飞书/钉钉    │  │  微信/APP    │              │
│  │   (校务处)    │  │  (内部协作)   │  │  (家长门户)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                         AI 核心引擎层 (AI Core Engine)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  自然语言处理  │  │   流程自动化   │  │   数据分析    │              │
│  │    (NLP)     │  │  (Workflow)  │  │ (Analytics)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   文档识别    │  │   提醒通知    │  │   知识库     │              │
│  │    (OCR)     │  │  (Reminder)  │  │ (Knowledge)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                      集成与数据层 (Integration & Data)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ WebSAMS  │ │  eClass  │ │ SchoolApp│ │  考勤系统  │ │  财务系统  │ │
│  │ (EDB)    │ │          │ │ (缴费)   │ │          │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  校务数据库 (学校私有部署)                     │ │
│  │         PostgreSQL + Redis + 加密文件存储                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据模型设计

#### 核心实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   学生 Student │◄─────►│   班级 Class  │◄─────►│   教师 Teacher │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   出勤记录    │       │   课程表     │       │   代课记录    │
│  Attendance │       │   Timetable │       │   Substitute│
└─────────────┘       └─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   事务任务    │◄─────►│   工作流程    │◄─────►│   提醒通知    │
│    Task     │       │   Workflow  │       │   Reminder  │
└─────────────┘       └─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   财务记录    │       │   资产项目    │       │   供应商     │
│   Finance   │       │    Asset    │       │   Vendor    │
└─────────────┘       └─────────────┘       └─────────────┘
```

> 📘 **详细数据库架构设计**，请参阅：
> - `DB-SCHEMA.md` — 完整表结构定义、索引设计、外键关系
> - `DATA-DICTIONARY.md` — 数据项定义、枚举值、业务规则、数据质量规范

---

## 第三部分：Module 1 — 每日晨检仪表板

### 3.1 模块概述

| 属性 | 描述 |
|------|------|
| 模块名称 | Daily Operations Dashboard (每日晨检仪表板) |
| 模块ID | MOD-DAILY-001 |
| 优先级 | P0 (关键) |
| 用户 | 校务处同工, 校务主任 |
| 使用频率 | 每日, 7:00 AM - 9:00 AM 高峰期 |

---

### Function F-DASH-001: 仪表板主视图

**输入：** 无（默认显示当日数据）

**仪表板自定义功能（用户模拟反馈A-05 — 新增）：**
> 用户可按个人偏好调整仪表板的组件显示、顺序和筛选条件，配置保存在用户个人设置中。

| 功能 | 说明 | 适用角色 |
|------|------|---------|
| 组件显示/隐藏 | 可选择显示或隐藏特定组件 | 全部 |
| 组件拖拽排序 | 拖拽调整组件位置，保存后生效 | 全部 |
| 紧急程度筛选 | 对待处理任务按「紧急/一般/低」筛选（用户模拟反馈B-09）| 校务处同工 |
| 默认日期范围 | 可设置默认显示日期范围（如：本月/本周/今日）| 全部 |

> **实现说明：** 用户配置存储在用户偏好表（`user_preferences`），不影响系统默认配置。管理员可强制固定某些组件不可隐藏。

**输出：**
```json
{
  "date": "2026-05-23",
  "weekday": "星期五",
  "components": [
    {"name": "出勤率", "value": "98.75%", "status": "normal"},
    {"name": "迟到/早退", "value": "5人", "status": "warning"},
    {"name": "家长查询", "value": "3个待处理", "status": "urgent"},
    {"name": "校车状态", "value": "全部到达", "status": "normal"},
    {"name": "午餐订单", "value": "980份", "status": "confirmed"},
    {"name": "请假申请", "value": "2个待处理", "status": "pending"}
  ]
}
```

---

### Function F-ATT-001: 学生出勤概览

**输入：**
| 字段 | 类型 | 来源 | 描述 |
|------|------|------|------|
| date | Date | System | 当前日期(默认)或选择日期 |
| class_filter | Array[String] | 用户选择 | 可选：按班级筛选 |
| sync_source | Enum | System | "eClass", "manual", "biometric" |

**处理流程：**

```
Step 1: 数据拉取 (Data Ingestion)
Step 2: 数据清洗与标准化 (Data Cleansing)
Step 3: 聚合汇总 (Aggregation)
Step 4: 异常检测 (Anomaly Detection)
Step 5: 预警标记 (Alert Tagging)
Step 6: 响应组装 (Response Assembly)
```

**数据同步状态展示（用户模拟反馈B-01 — 新增）：**
> 每个数据源（eClass API、门禁刷卡机、人脸识别闸机）须独立显示同步状态，不合并为"部分成功"。

| 数据源 | 状态 | 显示内容 |
|--------|------|---------|
| eClass API | ✅ 成功 / ❌ 失败 / ⚠️ 部分成功 | 最后同步时间 + 记录数 |
| 门禁刷卡机（每台设备） | ✅ 正常 / ❌ 离线 | 设备名称 + 最后同步时间 |
| 人脸识别闸机（每台设备） | ✅ 正常 / ❌ 离线 | 设备名称 + 最后同步时间 |

**受影响学生智能列表（用户模拟反馈B-01）：**
> 当任一数据源同步失败时，系统自动生成「受影响学生列表」，显示：
- 学生姓名、班级
- 所属数据源/设备
- 建议操作（「确认到校」/「标记待确认」）

```json
{
  "affected_students": [
    {
      "student_id": "2023S10123",
      "name": "陳大明",
      "class": "1A",
      "affected_sources": ["人脸识别闸机-RFID-003"],
      "suggested_action": "confirm_present",
      "last_known_status": "unknown"
    }
  ]
}
```

**批量录入确认预览 + 批量撤销（用户模拟反馈B-02 — 新增）：**
> 批量录入出勤记录时，须先显示确认预览页，用户确认后方可保存。保存后15分钟内可批量撤销。

| 功能 | 说明 |
|------|------|
| 确认预览页 | 显示即将录入的记录摘要（学生数量、日期、状态类型统计）|
| 批量撤销 | 保存后**15分钟**内可一次性撤销全部记录（需二次确认），超出时限须逐条删除 |
| 撤销权限 | 仅录入人或校务主任可撤销 |

#### Step 1: 数据拉取 (Data Ingestion)

本步骤从多个数据源实时/定时拉取出勤原始数据，支持以下来源：

**1.1 eClass API（首选数据源）**

| 接口端点 | 方法 | 描述 | 数据量 |
|----------|------|------|--------|
| `/api/attendance/students/{class_id}/{date}` | GET | 按班级和日期获取出勤记录 | 每班约30-40人 |
| `/api/attendance/student/{student_id}/history` | GET | 获取单个学生出勤历史 | 单个学生 |
| `/api/class/{class_id}/students` | GET | 获取班级学生列表 | 每班约30-40人 |
| `/api/attendance/sync` | POST | 批量同步出勤数据 | 每次最多500条 |

**API 调用示例：**
```bash
# 获取指定班级某日的出勤数据
curl -X GET "https://school.eclass.com/api/attendance/students/1A/2026-05-27" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json"

# 响应：
{
  "class_id": "1A",
  "date": "2026-05-27",
  "records": [
    {
      "student_id": "2023S10101",
      "student_name": "陳小明",
      "status": "present",
      "check_in_time": "07:58:32",
      "check_in_method": "card",
      "device_id": "RFID-001"
    },
    {
      "student_id": "2023S10102",
      "student_name": "李小红",
      "status": "late",
      "check_in_time": "08:12:15",
      "check_in_method": "card",
      "device_id": "RFID-001"
    }
  ],
  "summary": {
    "total": 38,
    "present": 35,
    "absent": 1,
    "late": 2
  }
}
```

**1.2 人工录入（Backup）**

当系统接口不可用或数据异常时，校务处同工可通过 Web 表单手动录入：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | String | 是 | 班级代码 |
| date | Date | 是 | 出勤日期 |
| student_id | String | 是 | 学号 |
| status | Enum | 是 | present / absent / late / excused |
| check_in_time | Time | 条件 | 到校时间（迟到时必填）|
| reason | Text | 条件 | 缺席/迟到原因（缺席/迟到时必填）|
| document | File | 可选 | 证明文件（医生证明等）|

**表单布局：**
```
┌──────────────────────────────────────────────────────────┐
│  人工录入出勤记录                                      │
├──────────────────────────────────────────────────────────┤
│  班级:    [全部 ▼]   日期:    [2026-05-27 📅]        │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 学号    │ 姓名   │ 状态      │ 到校时间 │ 备注 │  │
│  ├────────────────────────────────────────────────┤  │
│  │ S00101 │ 陳小明 │ ○出席  ●迟到 ○缺席 ○请假 │ 08:02 │ [  ] │  │
│  │ S00102 │ 李小红 │ ●出席  ○迟到 ○缺席 ○请假 │ 07:55 │ [  ] │  │
│  │ S00103 │ 王小華 │ ○出席  ○迟到 ●缺席 ○请假 │  --   │ [病假] │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [批量导入 Excel]          [保存]  [取消]           │
└──────────────────────────────────────────────────────────┘
```

**1.3 生物识别设备（实时数据源）**

| 设备类型 | 品牌/型号 | 数据格式 | 实时性 |
|----------|----------|----------|--------|
| 门禁刷卡机 | 智慧卡考勤机 | JSON over HTTP | 准实时（<30s延迟）|
| 人脸识别闸机 | 海康/大华人脸识别 | JSON over HTTP | 准实时（<5s延迟）|
| 移动考勤App | 学校自研App | REST API | 实时 |

**Webhook 配置示例：**
```json
{
  "webhook_url": "https://school-admin.internal/api/attendance/webhook",
  "events": ["check_in", "check_out", "anomaly"],
  "auth": {
    "type": "hmac_sha256",
    "secret": "{webhook_secret}"
  },
  "retry": {
    "max_attempts": 3,
    "interval_seconds": 5
  }
}
```

**1.4 数据拉取策略**

| 策略 | 触发条件 | 执行时间 | 适用场景 |
|------|----------|---------|----------|
| **实时同步** | Webhook推送触发 | 事件驱动 | 门禁/刷卡/刷脸 |
| **定时拉取** | 每日定时任务 | 07:00 AM / 15:30 PM | eClass系统同步 |
| **按需拉取** | 用户查询时触发 | 实时 | 历史数据补录 |
| **批量导入** | 人工上传文件 | 手动触发 | 数据异常恢复 |

**定时任务配置（例）：**
```yaml
attendance_sync:
  schedule: "0 7,15 * * *"  # 每天7:00和15:00执行
  sources:
    - name: eclass_api
      priority: 1
      timeout: 30s
      retry: 3
    - name: biometric_backup
      priority: 2
      timeout: 10s
      retry: 2
  merge_strategy: "latest_wins"  # 以最新记录为准
  alert_on_failure: true
```

#### Step 2: 数据清洗与标准化 (Data Cleansing)

| 处理规则 | 说明 | 示例 |
|----------|------|------|
| **去重** | 同一学生同一天多条记录，保留最新 | 刷卡2次→保留最终状态 |
| **状态优先** | excused > present > late > early > absent | 有请假条优先于缺席 |
| **时间标准化** | 统一为 Asia/Hong_Kong 时区 | UTC+0 → UTC+8 |
| **格式校验** | 校验学号格式、日期格式 | 学号应为YYYY+S+NNN格式 |
| **异常值过滤** | 过滤明显错误记录 | 时间在06:00前或21:00后 |

#### Step 3: 聚合汇总 (Aggregation)

```python
# 伪代码：出勤聚合计算
def aggregate_attendance(records, group_by="class"):
    summary = {
        "total_students": len(records),
        "present": records.filter(status="present").count(),
        "absent": records.filter(status="absent").count(),
        "late": records.filter(status="late").count(),
        "early": records.filter(status="early").count(),
        "excused": records.filter(status="excused").count(),
        "attendance_rate": f"{(present / total * 100):.2f}%"
    }
    if group_by == "grade":
        return group_by_grade(records)
    elif group_by == "class":
        return group_by_class(records)
    return summary
```

#### Step 4: 异常检测 (Anomaly Detection)

| 异常类型 | 检测规则 | 预警级别 |
|----------|----------|----------|
| 连续缺席 | 同一学生连续缺席≥3天 | medium |
| 连续迟到 | 7天内迟到≥3次 | medium |
| 突发缺席 | 过去30天缺席率<5%，今日突然>20% | high |
| 班级异常 | 班级出勤率低于全校平均值2个标准差 | low |
| 模式逃逸 | 特定学生连续多天同一时间段缺席 | high |

#### Step 5: 预警标记 (Alert Tagging)

| alert_level | 触发条件 | 通知对象 | 通知方式 |
|-------------|----------|----------|----------|
| `high` | 连续缺席≥5天 / 突发异常 | 校务主任 + 班主任 + 家长 | 短信 + App推送 |
| `medium` | 连续缺席3-4天 / 连续迟到3次/7天 | 班主任 + 家长 | App推送 |
| `low` | 单次异常 / 班级出勤偏低 | 校务处 | 系统通知 |
| `none` | 正常出勤 | 无 | 无 |

**输出：**
```json
{
  "attendance_summary": {
    "date": "2026-05-23",
    "total_students": 1200,
    "present": 1185,
    "absent": 10,
    "late": 5,
    "attendance_rate": "98.75%"
  },
  "by_grade": [
    {
      "grade": "S1",
      "total": 200,
      "present": 195,
      "absent": 3,
      "late": 2
    }
  ],
  "anomalies": [
    {
      "student_id": "2023S10123",
      "name": "陳大文",
      "class": "1A",
      "pattern": "consecutive_late",
      "days": 3,
      "alert_level": "medium"
    }
  ],
  "requires_action": true
}
```

---

### Function F-ATT-002: 迟到/早退记录

**输入：**
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| student_id | String | 是 | 学生证号或刷卡 |
| type | Enum | 是 | "late_arrival" / "early_departure" |
| timestamp | DateTime | 自动 | 记录时间(默认当前) |
| reason | String | 可选 | 原因类别或自由文本 |
| parent_notified | Boolean | 自动 | 系统追踪通知 |

**业务规则：**
- 迟到阈值：8:00 AM后（可配置）
- 早退阈值：3:30 PM前（可配置）
- 自动家长通知：迟到>30分钟或无故
- 模式检测：7天内3+次触发辅导员预警

**输出：**
```json
{
  "record_id": "REC-20260523-001",
  "student": {
    "id": "2023S10123",
    "name": "陳大文",
    "class": "1A"
  },
  "type": "late_arrival",
  "timestamp": "2026-05-23T08:15:00+08:00",
  "duration_minutes": 15,
  "reason_category": "traffic",
  "parent_notified": true,
  "notification_sent_at": "2026-05-23T08:16:00+08:00",
  "pattern_alert": {
    "triggered": true,
    "consecutive_count": 3,
    "recommended_action": "contact_parent"
  }
}
```

---

### Function F-INQ-001: 家长查询队列管理

**输入（用户模拟反馈B-05 — 新增通话质量字段）：**
| 字段 | 类型 | 来源 | 描述 |
|------|------|------|------|
| channel | Enum | System | "phone", "email", "whatsapp", "in_person", "app" |
| parent_info | Object | 输入 | 姓名、联系方式、学生ID |
| query_content | String | 输入/音频 | 文本或转录语音 |
| urgency | Enum | AI/自动 | "low", "medium", "high", "critical" |
| call_duration_minutes | Integer | 可选（电话渠道建议填写）| 通话时长（分钟）|
| call_result | Enum | 可选（电话渠道建议填写）| `resolved` / `follow_up_required` / `escalated` |
| parent_satisfaction | Enum | 可选 | `positive` / `neutral` / `negative` |

**AI处理：**
1. **意图分类：** 归类查询类型
   - 校车时间 (bus_schedule)
   - 午膳餐单 (lunch_menu)
   - 费用查询 (fee_inquiry)
   - 请假 (absence_report)
   - 一般行政 (general_admin)
   - 投诉 (complaint)
2. **情感分析：** 检测紧急程度
3. **自动回复生成：** 匹配FAQ数据库
4. **路由分配：** 分配给适当人员或自动回复

**输出：**
```json
{
  "inquiry_id": "INQ-20260523-089",
  "timestamp": "2026-05-23T08:30:00+08:00",
  "parent": {
    "name": "黃家長",
    "phone": "9123xxxx",
    "student_name": "黃小明",
    "student_class": "2B"
  },
  "channel": "phone",
  "original_query": "我想問下今日校車會唔會遲？",
  "ai_analysis": {
    "intent": "bus_schedule_inquiry",
    "sentiment": "neutral",
    "urgency": "medium",
    "confidence": 0.94
  },
  "suggested_response": "今日校車按正常時間行駛，第一班約7:45到達學校。如有臨時改動，會透過App通知家長。",
  "auto_response_eligible": true,
  "status": "pending_response",
  "escalation_required": false
}
```

---

### Function F-INQ-002: 快速回复模板

**模板分类：**

| 类别 | 模板数量 | 示例 |
|------|----------|------|
| 校車 | 8 templates | "校車延誤通知", "臨時改道通知" |
| 午膳 | 6 templates | "餐單查詢", "特殊飲食安排" |
| 收费 | 10 templates | "學費繳納方式", "雜費明細" |
| 请假 | 5 templates | "病假程序", "事假申請" |
| 一般 | 12 templates | "校曆查詢", "聯絡方式" |

---

### Function F-LUNCH-001: 午膳订单汇总

**输入：**
| 字段 | 类型 | 来源 | 描述 |
|------|------|------|------|
| order_date | Date | System | 目标日期 |
| vendor_filter | Array | 可选 | 按供应商筛选 |
| status_filter | Enum | 可选 | "confirmed", "pending", "cancelled" |

**家长自助午膳变更（用户模拟反馈B-03/D-02 — 新增）：**
> 家长可通过微信门户自助提交午膳变更申请（如更改款式、加单、取消），无需通过电话联系校务处。

| 变更类型 | 受理条件 | 系统行为 |
|----------|---------|---------|
| 加单 | 截止时间前 | 自动进入待确认队列，校务处审批 |
| 取消 | 截止时间前 | 自动确认，取消订单 |
| 更改款式 | 截止时间前 | 自动进入待确认队列，校务处审批 |

**更改截止时间规则（用户模拟反馈B-08 — 新增）：**
> 午膳变更设有统一截止时间，超过截止时间后系统自动拒绝并引导家长联系校务处。

| 规则 | 说明 |
|------|------|
| 默认截止时间 | 每日下午 14:00（可按供应商配置）|
| 超时提示 | 系统显示「更改截止时间为下午2:00，已过。请联系学校」，并内嵌「致电校务处」和「发送消息」快捷按钮 |
| 通知提醒 | 系统在截止时间前1小时推送微信消息提醒家长 |

**输出：**
```json
{
  "order_date": "2026-05-23",
  "summary": {
    "total_orders": 980,
    "confirmed": 950,
    "pending": 30
  },
  "by_vendor": [
    {
      "vendor_id": "V001",
      "vendor_name": "陽光膳食",
      "total": 450,
      "meal_types": {
        "regular": 420,
        "vegetarian": 25,
        "special_diet": 5
      }
    }
  ],
  "prediction_tomorrow": {
    "estimated_total": 975,
    "confidence": "high",
    "recommended_prep": 1000
  },
  "vendor_report_pdf": "https://.../report_20260523.pdf"
}
```

---

### Function F-BUS-001: 校车实时追踪

**输入：**
| 字段 | 类型 | 来源 | 描述 |
|------|------|------|------|
| bus_id | String | GPS | 校车标识 |
| timestamp | DateTime | GPS | 最后更新 |
| location | GeoJSON | GPS | 经纬度坐标 |
| route_id | String | System | 分配路线 |

**输出（用户模拟反馈A-04/B-07/D-04 — 增强）：**
```json
{
  "bus_id": "BUS-A1",
  "route": "將軍澳線",
  "status": "in_transit",
  "current_location": {
    "lat": 22.3085,
    "lng": 114.2632,
    "address": "寶琳路近將軍澳隧道"
  },
  "schedule": {
    "estimated_arrival": "2026-05-23T07:42:00+08:00",
    "scheduled_arrival": "2026-05-23T07:45:00+08:00",
    "variance_minutes": -3
  },
  "students_onboard": 45,
  "next_stop": "寶琳邨",
  "next_stop_eta": "2026-05-23T07:38:00+08:00",
  "alert_status": "normal",
  "delay_reason": "東涌公路交通意外",
  "incident_type": "minor_accident"
}
```

**乘搭学生列表（用户模拟反馈A-04 — 新增）：**
> 校车详情页显示完整乘搭学生名单，支持一键通知所有相关家长。

| 信息项 | 内容 |
|--------|------|
| 乘搭学生 | 姓名、班级、家长联系方式（隐藏）|
| 通知状态 | 每位学生的通知状态（已通知/未通知/家长已读）|
| 一键通知 | 点击「全部通知」→ 系统自动发送微信/App推送至全部相关家长 |

**延误通知增强（用户模拟反馈D-04 — 新增）：**
> 延误通知须包含意外类型标签和家长最关心的安全信息。

| 通知节点 | 内容 |
|----------|------|
| 延误发生时 | 预计延误时间 + 原因 + 意外类型标签 + 孩子已安全登车确认 |
| 到校确认 | 孩子已安全到达学校 |
| 意外类型标签 | `traffic_jam`（交通拥堵）/ `minor_accident`（轻微事故）/ `serious_accident`（严重事故）|

**延误通知阈值配置（评审报告修正 — 业务逻辑不合理#4）：**
> 为避免轻微延误（<10分钟）造成信息过载，系统须支持可配置的延误通知阈值。

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 延误通知阈值 | >10分钟 | 仅延误超过此阈值才发送微信/App通知家长 |
| 短信备用阈值 | >20分钟 | 延误超过此阈值同时发送短信备用 |
| 阈值配置入口 | 校务主任后台 → 系统配置 → 校车管理 | 可按校车路线单独配置 |
| 阈值说明 | 轻微延误（<10分钟）不入通知，仅在详情页显示 | 家长可在App内主动查看实时校车位置 |

---

### Function F-BUS-002: 校车点大名记录

**输入：**
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| student_id | String | 是 | 学生卡扫描 |
| bus_id | String | 是 | 校车标识 |
| check_type | Enum | 是 | "onboard", "alight" |
| timestamp | DateTime | 自动 | 签到时间 |
| location | String | 自动 | GPS或手动 |

**输出：**
```json
{
  "checkin_id": "CHK-20260523-456",
  "student_id": "2023S10123",
  "student_name": "陳大文",
  "bus_id": "BUS-A1",
  "check_type": "alight",
  "timestamp": "2026-05-23T07:43:15+08:00",
  "location": "School Main Gate",
  "status": "arrived_safely",
  "parent_notification_sent": true
}
```

---

### Function F-LEAVE-001: 请假申请处理

**输入：**
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| student_id | String | 是 | 学生标识 |
| leave_type | Enum | 是 | "sick", "personal", "family", "other" |
| start_date | Date | 是 | 请假开始 |
| end_date | Date | 是 | 请假结束 |
| reason | String | 可选 | 详细原因 |
| parent_name | String | 是 | 联系家长 |
| contact_phone | String | 是 | 紧急联络 |
| supporting_doc | File | 可选 | 证明文件 |

**业务规则（用户模拟反馈C-01 — 新增代课老师课时数显示）：**
- 病假>2天需提交医疗证明
- 事假需提前24小时审批
- 紧急请假可事后补办（当天）
- 模式检测：每学期>5天病假触发福利检查
- **病假自动批准风险管控（评审报告修正 — 业务逻辑不合理#2）：** 有医生证明的病假申请虽可自动标记为「已提交」，但**系统须随机抽取5%-10%进行AI辅助核验**，对高风险案例（如同一天多名学生提交、重复使用同一诊所证明等）触发人工复查，由校务主任确认后方正式批准，以防伪造证明

**代课老师推荐增强（用户模拟反馈C-01）：**
> 推荐代课老师时，须显示每位候选人的当日已有课时数，避免重复安排。

| 推荐字段 | 说明 |
|----------|------|
| 候选人姓名 | 显示教师姓名 |
| 任教科目 | 显示所教科目的学科 |
| 当日已排课时数 | **新增：** 显示该教师当日已有课时数（如"今日已有4节课"）|

**跟进提醒设置（用户模拟反馈B-06 — 新增）：**
> 连续病假等需要跟进的场景，处理人员可在系统中设定下次跟进提醒日期和内容。

| 字段 | 类型 | 说明 |
|------|------|------|
| follow_up_date | Date | 下次跟进日期 |
| follow_up_content | String | 跟进内容摘要 |
| follow_up_reminder | Boolean | 是否设置系统提醒 |

**OCR进度提示（用户模拟反馈D-01 — 新增）：**
> 家长上传医生证明后，系统须显示明确的处理进度，避免重复上传。

| 状态 | 显示内容 |
|------|---------|
| 上传中 | 进度条 + 「上传中，请稍候...」|
| 识别中 | 进度条 + 「正在识别证明文件，请稍候...」|
| 识别完成 | 「识别成功，正在处理...」|
| 处理完成 | 「请假申请已提交」|

**审批进度状态条（用户模拟反馈C-07 — 新增）：**
> 教师提交请假申请后，可实时追踪审批进度。

| 状态节点 | 说明 |
|----------|------|
| `submitted` | 已提交，等待审批 |
| `pending_approval` | 审批中（显示当前审批人）|
| `approved` | 已批准 |
| `rejected` | 已拒绝（显示拒绝原因）|

**输出：**
```json
{
  "application_id": "LEAVE-20260523-012",
  "student": {
    "id": "2023S10123",
    "name": "陳大文",
    "class": "1A"
  },
  "leave_details": {
    "type": "sick",
    "start_date": "2026-05-23",
    "end_date": "2026-05-23",
    "days": 1,
    "reason": "發燒及感冒"
  },
  "status": "approved",
  "parent_contact": "陳家長 9123xxxx",
  "notifications_sent": {
    "class_teacher": true,
    "subject_teachers": 8,
    "admin_officer": true
  },
  "medical_cert_required": false,
  "follow_up_needed": false
}
```

---

### Function F-FEE-001: 每日收费追踪

**输入：**
| 字段 | 类型 | 来源 | 描述 |
|------|------|------|------|
| date | Date | System | 收取日期 |
| fee_type | Enum | 筛选 | "air_con", "activity", "material", "other" |
| payment_method | Enum | 筛选 | "cash", "cheque", "fps", "octopus", "e_payment" |

**业务规则：**
- 现金处理需双人见证核实
- 每笔交易必须出具收据
- 关门前进每日对账
- 差异>$50需调查

**电子收据自动推送（用户模拟反馈B-10 — 新增）：**
> 非现金缴费（FPS、八达通、e-payment）收款成功后，系统自动向付款人推送电子收据，无需人工发送。

| 推送渠道 | 触发时机 | 内容 |
|----------|---------|------|
| App推送 | 收款成功即时 | 电子收据PDF链接 |
| 邮件 | 收款成功即时 | 电子收据PDF附件 |
| 短信（备用）| 收款成功即时 | 「您的缴费已成功，收据已发送至App/邮箱，请查收。」|

**缴费延迟提示（用户模拟反馈D-03 — 新增）：**
> 第三方支付（FPS等）到账存在延迟，界面须正确引导用户。

| 场景 | 界面显示 |
|------|---------|
| 缴费成功（第三方处理中）| 「您的缴费已提交，预计5分钟内更新。请勿重复缴费。」|
| 最后缴费记录 | 显示上次缴费时间戳（如「上次缴费：2026-05-27 14:23:12」）|
| 状态持续未更新（>10分钟）| 提示「缴费状态未更新，请联系校务处」+ 快捷联系按钮 |

**输出：**
```json
{
  "collection_date": "2026-05-23",
  "summary": {
    "total_collected": 15800.00,
    "transaction_count": 45,
    "by_type": {
      "air_con": 12000.00,
      "activity": 3000.00,
      "material": 800.00
    },
    "by_method": {
      "cash": 5000.00,
      "fps": 6800.00,
      "octopus": 4000.00
    }
  },
  "witness_verification": {
    "staff_1": "張同工",
    "staff_2": "李同工",
    "verified": true,
    "timestamp": "2026-05-23T16:00:00+08:00"
  },
  "receipts_issued": 45,
  "discrepancy": 0.00,
  "status": "balanced"
}
```

---

## 第四部分：Module 2 — 周期性校务管理

### 4.1 模块概述

| 属性 | 描述 |
|------|------|
| 模块名称 | Cyclical Operations Module (周期性校务管理) |
| 模块ID | MOD-CYCL-001 |
| 优先级 | P0 (关键) |
| 用户 | 全体校务人员, 教务协调员, 收生主任 |

**学年时间轴：**
```
7月        8月        9月        10-12月       1-3月        4-6月        6-8月
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│ 开学前  ││ 开学月  ││ 稳定期  ││  第一学  ││  第二学  ││  考试及  ││  学年结  │
│ 准备期  ││         ││         ││  期中期  ││  期中期  ││  毕业期  ││  束期    │
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
```

---

### Function F-ENRL-001: 新生注册管理

**目的：** 处理所有中一入学及跨校转学生

**输入：**
| 字段 | 类型 | 必填 | 来源 |
|------|------|------|------|
| application_no | String | 是 | 系统生成 |
| student_name_zh | String | 是 | 申请表 |
| date_of_birth | Date | 是 | 出生证明 |
| gender | Enum | 是 | 申请表 |
| school_of_origin | String | 条件 | 仅转学生 |
| parent_name | String | 是 | 申请表 |
| parent_id | String | 是 | 香港身份证 |
| contact_phone | String | 是 | 申请表 |
| special_education_needs | Boolean | 是 | 医疗/评估报告 |
| documents | File[] | 是 | OCR扫描 |

**业务规则：**
- 中一注册截止日期：8月31日（EDB要求）
- 转学生：到校后14天内
- SEN披露为自愿性质
- 所有文件须与原件核对

**输出：**
```json
{
  "registration_id": "ENRL-2026-S1-0001",
  "student": {
    "student_id": "2026S10001",
    "hkid": "A123456(X)",
    "dob": "2011-03-15",
    "gender": "M"
  },
  "status": "documents_verified",
  "documents_checklist": {
    "birth_certificate": {"submitted": true, "verified": true},
    "hkid_copy": {"submitted": true, "verified": true},
    "report_card": {"submitted": true, "verified": false},
    "consent_form": {"submitted": false, "deadline": "2026-08-20"}
  },
  "class_assigned": "1A",
  "sen_flag": true,
  "webSAMS_synced": true
}
```

---

### Function F-ENRL-002: AI辅助编班

**目的：** 根据多项标准公平分配学生到各班

**平衡因素权重（默认）：**
| 因素 | 权重 | 描述 |
|------|------|------|
| gender_ratio | 25% | 维持约50:50男女比例 |
| academic_ability | 25% | 各班均匀分布 |
| sen_students | 20% | SEN学生均匀分配 |
| sibling_conflict | 15% | 防止敌对关系同班 |
| school_origin | 10% | 同一学校来源分散 |
| special_talent | 5% | 体育/艺术人才均衡 |

**输出：**
```json
{
  "allocation_id": "ALLOC-2026-S1-001",
  "total_students": 180,
  "num_classes": 5,
  "allocations": [
    {
      "class": "1A",
      "students": [...],
      "gender_ratio": {"M": 18, "F": 18},
      "sen_count": 2,
      "avg_ability_score": 72.5
    }
  ],
  "balance_score": 87.3,
  "conflicts": [...],
  "approval_required": true
}
```

---

### Function F-ENRL-003: 课本分发管理

**输出：**
```json
{
  "distribution_id": "TXTBK-2026-1A-001",
  "class": "1A",
  "student": {"id": "2026S10001", "name": "王小明"},
  "textbooks": [
    {
      "subject": "中文",
      "title": "新編中國語文",
      "price": 185.00,
      "status": "distributed",
      "barcode": "TXTBK-2026-12345"
    }
  ],
  "summary": {
    "total_textbooks": 12,
    "distributed": 12,
    "total_cost": 2220.00,
    "payment_status": "paid"
  }
}
```

---

### Function F-EXAM-001: DSE报考管理

**目的：** 处理香港中学文凭考试报名

**输入：**
| 字段 | 类型 | 必填 | 来源 |
|------|------|------|------|
| student_id | String | 是 | WebSAMS |
| subject_selections | Array[Subject] | 是 | 学生选择 |
| special_arrangements | Object | 条件 | 医疗/SEN报告 |
| photo | File | 是 | 照片上传 |
| declaration_signed | Boolean | 是 | 同意书 |

**科目分类：**
| 类别 | 科目 |
|------|------|
| Category A - 核心 | 中文, 英文, 数学, 公民与社会 |
| Category A - 选修 | 生物, 化学, 物理, 经济等 |
| Category B | 应用学习 |
| Category C | 其他语言 |

**业务规则：**
- 最少6科（包括4个核心）
- 最多8科
- 逾期报名费：每科HK$560
- 截止后退选需医疗证明

**输出：**
```json
{
  "registration_id": "DSE-2026-001234",
  "student": {
    "id": "2023S10123",
    "name": "陳大文",
    "class": "6A"
  },
  "subjects": [
    {"subject_code": "CN", "subject_name": "中國語文", "category": "A_core", "status": "registered"},
    {"subject_code": "BA", "subject_name": "企業概論", "category": "A_elective", "status": "registered"}
  ],
  "special_arrangements": {
    "extra_time": true,
    "duration_extension": "25%",
    "separate_room": true,
    "approved_by_hkeaa": true
  },
  "total_subjects": 6,
  "registration_status": "submitted_to_hkeaa"
}
```

---

### Function F-EXAM-002: 试卷管理

**流程：**
```
试卷需求确认 → 印刷申请 → 印刷厂印制 → 密封交付 
      ↓
储存保险箱 → 考试前分发 → 考试使用 → 密封回收 
      ↓
保存期限 → 审批销毁 → 记录归档
```

**子功能：**
| 子功能 | ID | 描述 |
|--------|-----|------|
| 试卷需求统计 | F-EXAM-002a | 计算每科/每班试卷总数 |
| 印刷申请管理 | F-EXAM-002b | 生成供应商印刷订单 |
| 密封追踪 | F-EXAM-002c | 追踪密封号码及保管链 |
| 保险箱管理 | F-EXAM-002d | 安全存储及访问记录 |
| 分发记录 | F-EXAM-002e | 考试日分发及监考员签收 |
| 回收与销毁 | F-EXAM-002f | 考后回收及销毁记录 |

---

### Function F-EXAM-003: 特别考试安排

**安排类型：**
| 类型代码 | 描述 | 所需审批 |
|---------|------|----------|
| EXTRA_TIME | 25%或50%额外时间 | HKEAA |
| SEP_ROOM | 独立考场 | 学校+HKEAA |
| SCRIBE | 抄写员 | HKEAA |
| READER | 读卷员 | HKEAA |
| BRAILLE | 盲文试卷 | HKEAA |
| WHEELCHAIR | 轮椅通道书桌 | 学校 |

**输出：**
```json
{
  "arrangement_id": "SEA-2026-S6-CHEM-001",
  "student": {
    "id": "2023S10501",
    "name": "張同學",
    "sen_type": "ASD",
    "sen_severity": "moderate"
  },
  "exam": {
    "subject": "化學",
    "date": "2026-04-18",
    "paper": "卷二"
  },
  "arrangements": [
    {"type": "extra_time", "description": "25%額外時間", "approval_ref": "SEA-2025-CHEM-555"},
    {"type": "sep_room", "description": "獨立考場 - 201室", "invigilator_assigned": "陳老師"}
  ]
}
```

---

### Function F-EXAM-004: 成绩单生成与发布

**流程：**
1. 从WebSAMS/eClass汇总考试成绩
2. 计算加权分数及排名
3. 生成描述性评语（AI辅助）
4. 校长/副校长审核批准流程
5. 生成PDF成绩单
6. 通过eClass/SchoolApp/实体分发

**教师成绩自撤回功能（用户模拟反馈C-03 — 新增，评审报告修正 — 业务逻辑不合理#3）：**
> 教师提交成绩后，在审批人审批前，可在48小时内自行撤回修改，无需联系教务主任退回。

| 条件 | 说明 |
|------|------|
| 撤回期限 | 提交后48小时内 |
| 撤回条件 | 仅在审批人尚未审批时可撤回 |
| 撤回次数 | 不限次数 |
| 操作记录 | 每次撤回记录至审计日志（F-USER-005）|
| **审计告警（评审修正）** | **教师撤回成绩后，系统自动触发审计告警（alert），记录：撤回教师、原始成绩、撤回时间戳、撤回理由（必填）；告警推送给校务主任，而非无记录处理** |

**家长成绩单PDF导出（用户模拟反馈D-07 — 新增）：**
> 家长可在微信门户将孩子的成绩单导出为PDF，方便保存和打印。

| 导出内容 | 说明 |
|----------|------|
| 完整成绩单 | 各科成绩、等级、排名、班主任评语 |
| 导出格式 | PDF（A4竖版）|
| 水印 | 可选：「仅供家长个人使用」|
| 历史成绩 | 可选择导出历史学期成绩单 |

**班级成绩分布图（用户模拟反馈C-06 — 新增）：**
> 教师可查看任教班级在全年级的成绩分布柱状图，辅助了解学生定位。

| 图表类型 | 内容 |
|----------|------|
| 分数分布柱状图 | 班级各科分数与年级平均分的对比 |
| 等级分布饼图 | A/B/C/D等级占比 |
| 排名变化折线图 | 学生本次与上次考试的排名变化 |

**输出：**
```json
{
  "report_card_batch": "RC-2026-S1-TERM1-001",
  "class": "1A",
  "total_students": 36,
  "reports": [
    {
      "student_id": "2025S10001",
      "subjects": [
        {
          "subject": "中文",
          "score": 85,
          "grade": "A",
          "class_rank": 5,
          "class_avg": 72.3,
          "comment": "閱讀理解能力強，寫作表達有進步。"
        }
      ],
      "overall_score": 78.5,
      "class_rank": 8,
      "conduct_grade": "B+",
      "attendance_rate": "95%",
      "status": "pending_approval"
    }
  ],
  "approval_workflow": {
    "teacher_comments_done": 30,
    "principal_approval_done": 0,
    "next_deadline": "2026-02-15"
  }
}
```

---

### Function F-ADM-001: 中一自行分配学位

**流程时间表（EDB标准）：**
```
1月 → 学校公布收生准则 → 家长递交申请表 
2月 → 学校进行面试 → 公布正取/备取名单 
3-4月 → EDB公布自行分配阶段结果 
5月 → 正取学生确认学位 → 获录取学生完成注册
```

**评分系统：**
| 准则 | 最高分 |
|------|--------|
| 学业表现（成绩表） | 30 |
| 面试表现 | 30 |
| 兄弟姐妹在校 | 10 |
| 家长校友 | 5 |
| 其他成就 | 10 |
| 校长酌情权 | 15 |

---

### Function F-ADM-002: JUPAS联招管理

**流程：**
1. 收集学生JUPAS选择
2. 生成学校推荐信
3. 处理校长/教师推荐信
4. 追踪申请状态
5. 处理上诉程序

**推荐信AI辅助写作（用户模拟反馈C-04 — 新增）：**
> 教师填写推荐信时，系统提供字数统计和AI写作提示，帮助教师写出符合要求的推荐信。

| 辅助功能 | 说明 |
|----------|------|
| 字数统计 | 实时显示当前字数（如「约280字」），建议字数：300-500字 |
| 最低字数提示 | 低于200字时显示「字数较少，建议补充更多细节」|
| AI写作大纲 | 根据学生档案自动生成写作大纲建议（学业表现/个人特质/课外活动三部分）|
| 术语一致性检查 | 自动检查术语与系统术语表的一致性 |
| 历史推荐信参考 | 可查看该校其他教师的推荐信示例（脱敏后）|

**输出：**
```json
{
  "jupas_id": "JUPAS-2026-S6-00045",
  "student": {"id": "2023S10678", "name": "陳大文", "class": "6A"},
  "jupas_app_no": "24601234",
  "choices": [
    {
      "priority": 1,
      "institution": "香港大學",
      "program": "工商管理學學士",
      "program_code": "JS4013",
      "status": "confirmed"
    }
  ],
  "reference_letters": [
    {"teacher": "李老師", "subject": "數學", "status": "draft", "deadline": "2026-03-15"}
  ],
  "school_reference": {
    "status": "in_progress",
    "includes": ["校內成績", "班主任評語", "學校排名"],
    "submission_deadline": "2026-03-31"
  }
}
```

---

### Function F-YREND-001: 档案清理与销毁

**保存期限（EDB指引）：**
| 文档类型 | 保存期限 | 期限后处理 |
|---------|---------|-----------|
| 学生注册表 | 7年（毕业后） | 销毁 |
| 成绩表 | 永久保存 | N/A |
| 处分记录 | 7年 | 销毁 |
| 健康记录 | 学生离校后3年 | 销毁 |
| 财务收据 | 7年 | 销毁 |
| 会议记录 | 5年 | 移交校监 |
| 员工合同 | 雇员离职后7年 | 销毁 |
| 毕业照 | 永久保存 | N/A |

---

### Function F-YREND-002: 学年财务结算

**输出：**
```json
{
  "reconciliation_id": "YREC-2025-2026",
  "fiscal_year": "2025-2026",
  "summary": {
    "total_fees_collected": 4580000.00,
    "total_expenses": 3890000.00,
    "net_balance": 690000.00,
    "budget_variance": -120000.00
  },
  "by_category": [
    {
      "category": "tuition",
      "budget": 3000000.00,
      "collected": 2950000.00,
      "outstanding": 50000.00
    }
  ],
  "outstanding_fees": [...],
  "audit_status": "ready_for_audit"
}
```

---

## 第五部分：Module 3 — 财务及资产管理

### Function F-FIN-001: 学费管理

**费用类型：**
| 费用类型代码 | 描述 | 强制性 |
|------------|------|--------|
| TUITION | 学费 | 是（资助学校豁免） |
| SUBSIDY | 堂费 | 是 |
| AIRCON | 冷气费 | 可选 |
| ACTIVITY | 活动费 | 按活动 |
| BUS | 校车费 | 可选 |
| INSURANCE | 学生保险 | 年度 |
| SCHOLARSHIP | 奖学金 | N/A（负数） |

**输出（用户模拟反馈A-06 — 新增欠费子状态）：**
```json
{
  "fee_assessment_id": "FA-2026-2027-S6-00045",
  "student": {
    "id": "2023S10678",
    "name": "陳大文",
    "subsidy_eligibility": "full_grant"
  },
  "fee_items": [
    {
      "type": "tuition",
      "annual_amount": 0.00,
      "net_payable": 0.00,
      "status": "exempted"
    },
    {
      "type": "subsidy",
      "annual_amount": 3100.00,
      "edb_subsidy": 1550.00,
      "net_payable": 1550.00,
      "outstanding": 1033.00,
      "sub_status": "installment_plan",
      "installments": [
        {"term": 1, "amount": 517.00, "due": "2026-09-15", "paid": true},
        {"term": 2, "amount": 517.00, "due": "2026-11-15", "paid": false, "sub_status": "installment_plan"},
        {"term": 3, "amount": 516.00, "due": "2027-02-15", "paid": false, "sub_status": "overdue"}
      ]
    }
  ],
  "summary": {
    "total_annual": 3100.00,
    "total_paid": 517.00,
    "total_outstanding": 1033.00,
    "outstanding_breakdown": {
      "installment_plan": 1033.00,
      "overdue": 0.00,
      "disputed": 0.00
    }
  }
}
```

> **sub_status 枚举值说明：**
> - `installment_plan`：分期付款中（正常状态）
> - `overdue`：逾期未付（需跟进）
> - `disputed`：争议中（家长提出申诉）
> - `paid`：已缴清

---

### Function F-FIN-002: 零用现金报销

**业务规则（评审报告修正 — 业务逻辑不合理#3）：**
- **单笔交易限额：动态限额机制（评审修正）**：单笔HK$3,000限额为基础限额，每学年根据香港政府统计处公布的综合消费物价指数（CPI）自动调整，公式：`实际限额 = 基础限额 × (当年CPI指数 / 基准CPI指数)`；调整结果由校务主任确认后生效，并在系统公告通知
- 现金交易>HK$500需双重授权
- 所有交易需原始收据
- 每月对账必需
- 备用金补充：最高HK$5,000

**OCR收据识别展示规范（用户模拟反馈A-02 — 新增）：**
> OCR识别的金额须与系统记录金额明确区分，并要求审核人员人工核对原件。

| 展示要素 | 规范 |
|----------|------|
| OCR金额标签 | 显示「🤖 OCR识别金额」（非系统原始金额）|
| 系统记录金额 | 显示「📋 系统登记金额」|
| 视觉区分 | OCR金额以**黄色底色高亮**显示，系统金额以白色正常显示 |
| 复核提示 | 以**粗体红色文字**显示：「⚠️ 请人工核对收据原件」|
| 收据缩略图 | 审批页面侧栏显示收据图片缩略图，支持点击放大 |

**双人见证实时推送（用户模拟反馈B-04 — 新增）：**
> 第一见证人完成见证后，系统自动向第二见证人发送待见证任务推送（App推送 + 短信），无需手动通知。

| 触发条件 | 系统行为 |
|----------|---------|
| 第一见证人完成见证 | 自动向第二见证人发送待见证任务推送（内容：交易摘要 + 金额 + 见证链接）|
| 第二见证人完成见证 | 系统锁定交易 → 流程完成 |
| 第二见证人超时（30分钟未处理）| 自动提醒校务主任介入 |

**输出：**
```json
{
  "transaction_id": "PC-2026-05-0234",
  "type": "payment",
  "amount": 856.00,
  "payee": "光明文具公司",
  "description": "購買期末考試試卷紙 (500張)",
  "category": "printing",
  "authorizations": [
    {"name": "李主任", "role": "first_authorizer", "signed_at": "2026-05-23T11:45:00+08:00"},
    {"name": "陳副主任", "role": "second_authorizer", "signed_at": "2026-05-23T11:50:00+08:00"}
  ],
  "dual_authorization_completed": true,
  "current_float_balance": 3244.00
}
```

---

### Function F-FIN-003: 奖学金与津贴申请

**奖学金/津贴类型：**
| 类型 | 来源 | 金额 | 资格 |
|------|------|------|------|
| 校本奖学金 | 学校 | HK$1,000-5,000 | 学业优秀 |
| 书簿津贴 | 教育局 | HK$3,000-5,000 | 低收入家庭 |
| 车船津贴 | 教育局 | HK$1,000-3,000 | 偏远交通 |
| 校本清贫助学金 | 学校 | HK$500-2,000 | 校长酌情 |

---

### Function F-ASSET-001: 校产条码盘点

**资产分类：**
```
固定资产 | 电子设备 | 家具 | 乐器 | 运动器材 | 实验室设备 | 
图书馆藏书 | 视听器材 | 电脑设备 | 网络设备
```

**输出：**
```json
{
  "inventory_session_id": "INV-2026-ANNUAL-001",
  "total_registered_assets": 2456,
  "assets_verified": 2389,
  "verification_rate": "97.3%",
  "discrepancies": [
    {
      "asset_id": "ASSET-2020-LAPTOP-0045",
      "name": "聯想手提電腦",
      "registered_location": "301室",
      "scan_location": "not_found",
      "status": "missing",
      "responsible_person": "王老師",
      "investigation_status": "pending"
    }
  ],
  "condition_summary": {
    "excellent": 120,
    "good": 1856,
    "fair": 298,
    "poor": 98
  }
}
```

---

### Function F-ASSET-002: 场地租借管理

**场地及定价：**
| 场地 | 每小时租金 | 按金 | 保险要求 |
|------|-----------|------|---------|
| 礼堂 | HK$800 | HK$2,000 | 是 |
| 篮球场 | HK$400 | HK$1,000 | 是 |
| 课室 | HK$200 | HK$500 | 否 |
| 活动室 | HK$300 | HK$500 | 否 |
| 游泳池 | HK$600 | HK$1,500 | 是 |

---

### Function F-ASSET-003: 设备保养管理

**保养类型：**
| 类型 | 频率 | 示例 |
|------|------|------|
| 定期保养 | 每月/每季 | 冷气系统, 升降机, 消防设备 |
| 预防性保养 | 年度 | 冷气机清洗, 灭火筒更换 |
| 故障维修 | 按需 | 任何设备故障 |
| 安全检测 | 年度 | 电力系统, 气体装置, 升降机 |

---

### Function F-VEND-001: 供应商注册与评估

**供应商分类：**
```
图书供应 | 文具供应 | 膳食供应（饭盒）| 校车服务 | 设备维修 |
印刷服务 | 清洁服务 | 保险公司 | 网络服务 | 活动物资
```

---

## 第六部分：Module 6 — 用户与权限管理系统

### 6.1 模块概述

| 属性 | 描述 |
|------|------|
| 模块名称 | User & Access Management (用户与权限管理系统) |
| 模块ID | MOD-USER-001 |
| 优先级 | P0 (关键 — 所有其他模块的基础) |
| 用户 | 校务主任, 系统管理员 |

---

### Function F-USER-001: 用户生命周期管理

**目的：** 统一管理系统内所有用户身份的全生命周期

**用户角色定义：**

| 角色代码 | 角色名称 | 描述 | 可授权功能范围 |
|----------|----------|------|---------------|
| `SCHOOL_ADMIN` | 校务主任 | 统筹管理，全权限 | 全部功能 |
| `OFFICER` | 校务处同工 | 日常操作 | 所属业务范围 |
| `TEACHER` | 教师 | 查询与填报 | 受限功能 |
| `PARENT` | 家长 | 门户查询 | 仅家长门户 |
| `STUDENT` | 学生 | 自主查询 | 仅学生门户 |
| `SYSTEM` | 系统管理员 | 技术运维 | 系统配置，用户管理 |

**输入：**
| 字段 | 类型 | 必填 | 来源 |
|------|------|------|------|
| user_type | Enum | 是 | `SCHOOL_ADMIN`, `OFFICER`, `TEACHER`, `PARENT`, `STUDENT`, `SYSTEM` |
| staff_id / student_id / parent_id | String | 条件 | 内部编号 |
| name_zh | String | 是 | 姓名 |
| name_en | String | 可选 | 英文名 |
| email | String | 条件 | 学校邮箱或家长邮箱 |
| phone | String | 可选 | 联系电话 |
| department | String | 条件 | 任职部门（校务处/教务/总务等）|
| class_assignment | String | 条件 | 所属班级（仅教师/班主任）|
| linked_student_id | String | 条件 | 关联学生（仅家长）|
| employment_type | Enum | 条件 | `permanent`, `contract`, `supply`, `relief` |
| account_expiry | Date | 可选 | 账户过期日（合同截止）|

**业务规则（用户模拟反馈D-06 — 新增家长密码强制设置）：**
- 教师入职自动生成账户，离职自动停用（联动HR记录）
- 同一手机号/邮箱不可重复注册（防止冒用）
- 账户过期前30天推送预警
- 离职/毕业自动触发账户禁用流程（保留审计记录）
- 家长账户与学生账户绑定，一对多（多个子女）
- **家长首次注册时须强制设置「家长密码」（独立于登录密码），用于多子女账号关联验证；若未设置，系统引导至「设置家长密码」页面后方可使用完整功能**
- **家长密码找回支持短信OTP验证（F-USER-006），不再依赖到校办理**

**输出：**
```json
{
  "user_id": "USR-2026-00001",
  "account_status": "active",
  "profile": {
    "user_type": "OFFICER",
    "staff_id": "S00123",
    "name_zh": "張三豐",
    "email": "cheungsf@school.edu.hk",
    "phone": "91234567",
    "department": "校務處",
    "created_at": "2026-09-01T09:00:00+08:00",
    "account_expiry": "2027-08-31",
    "password_changed_at": "2026-09-01T09:00:00+08:00",
    "password_expires_in_days": 90,
    "last_login": "2026-05-23T08:30:00+08:00",
    "status": "active"
  },
  "linked_accounts": [],
  "provisioned_systems": ["school_admin_ai", "feishu", "eclass"],
  "offboarding_status": null,
  "audit_trail": [
    {"action": "account_created", "actor": "USR-SYS-ADMIN", "timestamp": "2026-09-01T09:00:00+08:00"}
  ]
}
```

---

### Function F-USER-002: 身份认证

**目的：** 提供安全、多因素的登录验证机制

**认证方式支持：**

| 认证方式 | 适用角色 | 描述 |
|----------|----------|------|
| 账号密码 | 全部 | 盐值哈希存储（bcrypt/argon2）|
| 单点登录 (SSO) | 教师, 校务主任 | 学校统一身份（LDAP / Azure AD / Google Workspace）|
| 短信验证码 (OTP) | 家长, 学生 | 6位数字，一次性有效（10分钟）|
| 飞书 OAuth | 全部 | 飞书扫码登录（内部协作场景）|
| 生物识别 | 教师, 学生 | 设备指纹 / 刷脸（App端）|
| 硬件Token | SYSTEM | TOTP / FIDO2 安全密钥 |

**登录流程：**
```
用户输入账号 → 账号存在检查 → 认证方式路由
    │
    ├─ 密码登录：验证密码 → 检查密码强度/过期 → 密码错误计数
    ├─ SSO：重定向至IdP → 验证SAML/OIDC断言 → 会话建立
    ├─ OTP：发送验证码 → 验证OTP → 绑定设备标记
    └─ 飞书OAuth：授权回调 → 验证open_id → 会话建立

认证成功 → 生成会话Token → 记录登录日志 → 返回用户Profile
认证失败 → 记录失败日志 → 触发告警（>3次）→ 锁定账户（>5次）
```

**密码策略：**
| 策略项 | 要求 |
|--------|------|
| 最小长度 | 8位 |
| 复杂度 | 须包含：大写字母 + 小写字母 + 数字 + 特殊字符 |
| 有效期 | 90天（可配置）|
| 历史记录 | 最近5个密码不可复用 |
| 错误锁定 | 5次错误，锁定15分钟 |
| 账户解锁 | 管理员手动 / 邮件/短信验证码自助 |

**输出：**
```json
{
  "auth_result": {
    "success": true,
    "user_id": "USR-2026-00001",
    "user_type": "OFFICER",
    "session_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_at": "2026-05-23T20:30:00+08:00",
    "refresh_token": "rt_a1b2c3d4e5f6...",
    "mfa_completed": true,
    "mfa_method": "totp",
    "device_fingerprint": "fp_8f3a9b2c...",
    "ip_address": "203.0.113.42",
    "user_agent": "Mozilla/5.0..."
  },
  "risk_check": {
    "new_device": false,
    "new_location": true,
    "city": "Hong Kong",
    "risk_level": "low"
  }
}
```

---

### Function F-USER-003: 功能授权 (RBAC + ABAC)

**目的：** 细粒度控制用户对功能模块、数据范围和操作类型的访问权限

**角色权限矩阵（默认）：**

| 功能模块 | SCHOOL_ADMIN | OFFICER | TEACHER | PARENT | STUDENT | SYSTEM |
|----------|:-----------:|:-------:|:-------:|:------:|:-------:|:------:|
| 仪表板查看 | ✅ 全部 | ✅ 本职 | ✅ 本班 | ✅ 子女 | ✅ 本人 | ❌ |
| 出勤管理 | ✅ 全部 | ✅ 全部 | ✅ 本班 | ❌ | ❌ | ❌ |
| 家长查询处理 | ✅ 全部 | ✅ 全部 | ❌ | ❌ | ❌ | ❌ |
| 请假审批 | ✅ 全部 | ✅ 全部 | ✅ 本班 | 申请 | ❌ | ❌ |
| 费用收取 | ✅ 全部 | ✅ 全部 | ❌ | ❌ | ❌ | ❌ |
| 成绩管理 | ✅ 全部 | ✅ 查看 | ✅ 本班 | ✅ 子女 | ✅ 本人 | ❌ |
| DSE/考试管理 | ✅ 全部 | ✅ 操作 | ✅ 本班 | ❌ | ❌ | ❌ |
| 财务报销 | ✅ 审批 | ✅ 提交 | ❌ | ❌ | ❌ | ❌ |
| 资产盘点 | ✅ 全部 | ✅ 查看 | ❌ | ❌ | ❌ | ❌ |
| 用户管理 | ✅ 全部 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 系统配置 | ✅ 全部 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 审计日志 | ✅ 查看 | ❌ | ❌ | ❌ | ❌ | ✅ |

**数据范围控制（ABAC规则 — 评审报告修正 — 权限设计缺陷#1）：**

> **重要修正：** F-USER-003 原ABAC规则仅为概念性描述，实际实现须引入规则引擎（推荐使用 **Open Policy Agent (OPA)**），支持动态、细粒度的属性基访问控制策略。OPA以Rego语言编写策略，支持实时评估，无需重新部署即可更新策略。

| 维度 | 规则 |
|------|------|
| 班级范围 | 教师仅能操作所教班级的学生数据 |
| 子女范围 | 家长仅能查看所绑定子女的数据 |
| 时间范围 | 财务数据按学年隔离，历史数据仅读 |
| 字段脱敏 | 身份证号、联系方式对非授权角色脱敏显示 |
| 操作类型 | CREATE / READ / UPDATE / DELETE / EXPORT / PRINT |
| 紧急例外 | 学生安全紧急情况可临时提升访问权限，须事后审计 |

**输入：**
| 字段 | 类型 | 来源 | 描述 |
|------|------|------|------|
| user_id | String | System | 请求方用户ID |
| target_resource | String | 输入 | 目标资源（模块/数据实体）|
| target_id | String | 输入 | 目标记录ID |
| action | Enum | 输入 | `view`, `create`, `update`, `delete`, `export`, `print` |
| context | Object | 自动 | 请求上下文（IP, 设备, 时间, 班级, 关联学生）|

**授权决策流程：**
```
请求进入 → 检查账户状态（未禁用/未过期）→ 检查数据范围（ABAC）
    → 匹配角色权限（RBAC）→ 匹配操作权限 → 评估ABAC额外规则
    → 资源归属检查（本人/本班/本部门）→ 决定 Allow / Deny
    → 记录授权审计日志
```

**敏感字段界面展示策略（PDPO合规 — 用户模拟反馈A-03/A-04/D-05）：**
> 即使RBAC授权某用户可访问某字段，界面展示时仍须遵循最小可见原则（Minimum Disclosure Principle）。

| 字段类别 | 展示规则 | 查看条件 | 审计要求 |
|----------|---------|---------|---------|
| **香港身份证号** | 默认显示：`A123456(X)` 格式脱敏 | 点击「查看」→ 二次确认（密码或OTP）| 每次查看均记录至 F-USER-005 审计日志 |
| **电话号码** | 默认显示前3后4位：`912***567` | 点击「查看」→ 二次确认 | 每次查看均记录 |
| **完整地址** | 完全隐藏（不显示任何内容）| 仅紧急情况（如学生安全）经校务主任授权后查看 | 每次授权均记录理由 |
| **出生日期** | 显示年份+月份：`2011-03` | 默认可见 | 无 |
| **家长联系方式 | 仅教师/校务主任可见，显示同电话号码规则 | 同上 | 同上 |

> **实现说明：** 所有敏感字段的「查看」操作均触发 F-USER-005 审计日志写入，记录：请求方用户ID、目标字段、查看时间戳、请求IP地址。任何人均无权绕过此规则。

**家校通讯功能（用户模拟反馈C-02/D-05 — 新增）：**
> 教师与家长之间的双向通讯须通过系统内消息通道，禁止通过个人社交软件（WhatsApp/微信）处理校务相关事务。

| 功能 | 描述 |
|------|------|
| 教师→家长消息 | 教师可在学生详情页点击「联系家长」，发送系统消息 |
| 家长→教师消息 | 家长可通过微信门户「发送消息」功能联系老师 |
| 对话历史 | 所有系统内消息保留6个月，可供校务主任查阅（不包含内容，仅元数据）|
| 权限控制 | 教师仅能联系其所教班级的学生家长，不可跨班联系 |

**输出：**
```json
{
  "authorization_result": {
    "decision": "allow",
    "user_id": "USR-2026-00010",
    "role": "TEACHER",
    "resource": "STUDENT_RECORD",
    "record_id": "STU-2023-00456",
    "action": "read",
    "scope": {
      "scope_type": "class_based",
      "permitted_classes": ["2A", "2B"],
      "record_grade": "S2",
      "record_class": "2A"
    },
    "fields_visible": ["name_zh", "hkid_masked", "attendance_rate", "exam_scores"],
    "fields_hidden": ["phone", "address", "parent_phone"],
    "matched_policy": "RbacTeacherRead + AbacClassScope",
    "evaluated_at": "2026-05-23T08:35:00+08:00"
  }
}
```

---

### Function F-USER-004: 会话与 Token 管理

**目的：** 安全管理用户会话生命周期，支持主动登出、会话失效和Token刷新

**Token类型：**

| Token类型 | 用途 | 有效期 | 存储 |
|-----------|------|--------|------|
| Access Token | API鉴权 | 30分钟 | 内存/HttpOnly Cookie |
| Refresh Token | 续期Access Token | 7天 | HttpOnly Cookie |
| API Key | 系统间调用 | 可配置 | 加密存储 |
| SSO Assertion | 单点登录 | 8小时 | Session |

**会话管理功能：**
- 同时会话数量限制（同一用户最多3个并发会话）
- 强制登出（管理员/用户主动终止所有或指定会话）
- 异地登录检测（同一账户在新城市登录 → 推送告警）
- 长时间空闲自动登出（默认60分钟，可配置）
- Token主动作废（change_password / 权限变更 → 所有会话失效）

**输出：**
```json
{
  "sessions": [
    {
      "session_id": "SES-2026-00123-A",
      "device": "Chrome on Windows",
      "ip_address": "203.0.113.42",
      "location": "Hong Kong",
      "created_at": "2026-05-23T08:30:00+08:00",
      "last_active": "2026-05-23T09:15:00+08:00",
      "expires_at": "2026-05-23T14:30:00+08:00",
      "is_current": true
    },
    {
      "session_id": "SES-2026-00123-B",
      "device": "Feishu App on iOS",
      "ip_address": "198.51.100.17",
      "location": "Shenzhen",
      "created_at": "2026-05-22T18:00:00+08:00",
      "last_active": "2026-05-23T07:45:00+08:00",
      "expires_at": "2026-05-29T18:00:00+08:00",
      "is_current": false,
      "risk_alert": "new_location"
    }
  ],
  "active_session_count": 2,
  "max_allowed_sessions": 3
}
```

---

### Function F-USER-005: 审计日志与登录记录

**目的：** 记录所有身份认证事件和敏感操作，供安全审计与合规追溯

**登录事件记录：**

| 事件类型 | 触发条件 | 记录字段 |
|----------|----------|---------|
| `LOGIN_SUCCESS` | 认证成功 | user_id, IP, 设备, 地理位置, 认证方式 |
| `LOGIN_FAILED` | 密码/OTP错误 | user_id, IP, 错误类型, 失败次数 |
| `LOGIN_LOCKED` | 账户锁定 | user_id, IP, 锁定原因, 解锁时间 |
| `LOGOUT` | 用户主动登出 | user_id, session_id, 登出方式 |
| `SESSION_EXPIRED` | 会话超时 | user_id, session_id |
| `PASSWORD_CHANGED` | 密码更新 | user_id, 变更者, IP |
| `MFA_ENABLED` | MFA绑定成功 | user_id, MFA类型, IP |
| `UNAUTHORIZED_ACCESS` | 越权访问尝试 | user_id, 目标资源, 操作, 拒绝原因 |

**敏感操作审计：**

| 类别 | 记录操作 |
|------|---------|
| 用户管理 | 创建/修改/删除用户, 角色变更, 权限变更 |
| 数据导出/打印 | 批量导出学生资料, 打印成绩表 |
| 财务操作 | 费用减免, 退款, 报销审批 |
| 系统配置 | 开关功能模块, 修改业务规则 |
| **敏感字段查看（新增）** | **身份证号查看、电话号码查看、完整地址查看（需校务主任授权）** |

**家长通话记录规范（用户模拟反馈A-07 — 新增）：**
> 所有校务处人员与家长之间的通话，须在系统中留下结构化记录，不得仅以自由文本备注代替。

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| call_duration_minutes | Integer | **是** | 通话时长（分钟） |
| call_result | Enum | **是** | `resolved`（已解决）/ `follow_up_required`（需跟进）/ `escalated`（升级处理）|
| next_follow_up_date | Date | 条件（当call_result=follow_up_required时）| 下次跟进日期 |
| parent_sentiment | Enum | 可选 | `positive` / `neutral` / `negative`（家长情绪，用于服务质素分析）|

**输出：**
```json
{
  "audit_log": {
    "log_id": "AUD-2026-05-23-001234",
    "timestamp": "2026-05-23T08:35:42+08:00",
    "event_type": "UNAUTHORIZED_ACCESS",
    "severity": "medium",
    "actor": {
      "user_id": "USR-2026-00015",
      "role": "TEACHER",
      "name_zh": "李老師",
      "session_id": "SES-2026-00089-A"
    },
    "target": {
      "resource": "STUDENT_RECORD",
      "record_id": "STU-2023-00789",
      "student_name": "黃小明"
    },
    "action": "export",
    "decision": "denied",
    "reason": "student_not_in_assigned_class",
    "ip_address": "203.0.113.42",
    "user_agent": "Mozilla/5.0...",
    "metadata": {
      "requested_fields": ["hkid", "address", "parent_phone"],
      "permitted_fields": ["name_zh", "class"]
    }
  }
}
```

**日志保留策略：**
| 事件类型 | 保留期 | 存储位置 |
|----------|--------|---------|
| 登录事件 | 3年 | 主数据库 + SIEM |
| 权限变更 | 7年 | 主数据库 |
| 敏感数据操作 | 7年 | 主数据库 + SIEM |
| 系统管理操作 | 7年 | 主数据库 + SIEM |

---

### Function F-USER-006: 密码与凭证重置

**目的：** 为用户提供安全自助的密码找回和凭证重置渠道

**重置流程 — 邮箱验证码：**
```
用户请求重置 → 验证账号存在 → 发送重置链接至注册邮箱 
    → 用户点击链接（15分钟内有效）→ 验证Token 
    → 输入新密码 → 密码复杂度校验 → 更新密码 
    → 作废所有现有会话 → 发送确认邮件 → 记录审计日志
```

**重置流程 — 短信OTP：**
```
用户请求重置 → 验证账号 + 手机号 → 发送6位OTP 
    → 验证OTP（5分钟有效，3次错误锁定）→ 输入新密码 
    → 更新密码 → 作废所有现有会话 → 发送确认短信
```

**管理员代重置：**
- 仅 `SCHOOL_ADMIN` 或 `SYSTEM` 可执行
- 需要二次授权（密码 + 手机验证码）
- 被重置用户将收到邮件/短信通知
- 完整操作记录于审计日志

**家长密码重置特别说明（用户模拟反馈D-06）：**
> 家长用户的「家长密码」（用于多子女账号关联验证）独立于登录密码，找回流程如下：

| 找回方式 | 适用场景 | 验证方式 |
|----------|---------|---------|
| 短信OTP | 家长已绑定手机号 | 发送6位OTP至注册手机，验证后重置 |
| 到校办理 | 家长无法收到短信（如更换手机号）| 校务处人工验证身份后重置 |

**输出：**
```json
{
  "password_reset_result": {
    "reset_id": "PWR-2026-05-23-5678",
    "user_id": "USR-2026-00001",
    "method": "email_otp",
    "status": "completed",
    "email_sent_to": "c***f@school.edu.hk",
    "completed_at": "2026-05-23T08:40:00+08:00",
    "sessions_invalidated": 3,
    "notification_sent": true,
    "next_password_expires": "2026-08-21"
  }
}
```

---

### Function F-USER-007: 权限变更审批流程

**目的：** 对高风险权限变更（如授权他人超范围访问）进行审批控制

**需要审批的敏感权限操作（用户模拟反馈A-01 — 新增证明文件要求）：**

| 操作 | 触发条件 | 审批人 | 证明文件 | 二次认证 |
|------|----------|--------|---------|---------|
| 临时提升为校务主任 | 任何用户 | 校长 | 必须：人事任职通知 | **必须：短信OTP或硬件Token** |
| 跨班级数据访问授权 | 教师跨班查看 | 校务主任 | 必须：活动通知/工作安排证明 | **必须：短信OTP** |
| 数据导出权限授予 | 批量导出授权 | 校务主任 | 必须：数据使用说明 | **必须：短信OTP** |
| 系统管理员权限变更 | SYSTEM角色变更 | 校长 + 校务主任 | 必须：权限变更申请单 | **必须：硬件Token或双人短信OTP** |
| 家长账户关联学生解绑 | 账户异常 | 校务主任 | 必须：情况说明 | **必须：短信OTP** |

> **评审报告修正 — 权限设计缺陷#2：** 所有敏感权限变更审批均须二次认证（短信OTP或硬件Token），防止账号被盗后恶意提升权限。二次认证在审批人提交审批时触发，而非申请提交时。

> **证明文件规范：** 支持格式：PDF、JPG、PNG，单个文件≤10MB。审批人须审查附件后方可批准。无证明文件的申请将被系统自动退回。

**输出：**
```json
{
  "privilege_escalation": {
    "request_id": "ESC-2026-05-23-001",
    "requester": {
      "user_id": "USR-2026-00008",
      "name_zh": "陳主任",
      "role": "OFFICER"
    },
    "target_user": {
      "user_id": "USR-2026-00015",
      "name_zh": "李老師",
      "role": "TEACHER"
    },
    "requested_privilege": {
      "type": "cross_class_data_access",
      "target_classes": ["2A", "2B", "2C"],
      "duration": "2026-05-23 至 2026-06-30",
      "justification": "協助處理跨境學生活動報名"
    },
    "status": "pending_approval",
    "approvers": [
      {"role": "校務主任", "user_id": "USR-2026-00001", "status": "pending"}
    ],
    "created_at": "2026-05-23T09:00:00+08:00",
    "deadline": "2026-05-23T17:00:00+08:00"
  }
}
```

---

## 第七部分：Module 7 — AI助理及自动化

（原有第六部分顺延）

### Function F-AI-001: 自然语言查询理解 (NLU)

**意图分类：**
```
校車相關 (Bus):
├── 校車時間查詢 (bus_time)
├── 校車路線查詢 (bus_route)
├── 校車延誤通知 (bus_delay)
└── 申請校車服務 (bus_apply)

午膳相關 (Lunch):
├── 午膳餐單查詢 (lunch_menu)
├── 特殊飲食安排 (lunch_special)
└── 更改午膳 (lunch_change)

費用相關 (Fee):
├── 繳費方式 (payment_method)
├── 欠費查詢 (outstanding_fee)
└── 申請資助 (subsidy_apply)
```

**AI处理流程：**
```
用户输入 → 语言检测 → 意图分类 → 实体提取 → 槽位填充 
    ↓
意图明确？ → 是 → 匹配FAQ / 执行功能 / 生成回复
    ↓ (否)
置信度<0.8？ → 是 → 转人工处理
    ↓ (否)
多意图识别 → 请求澄清
```

---

### Function F-AI-002: FAQ智能匹配

**FAQ数据库结构：**
| 字段 | 类型 | 描述 |
|------|------|------|
| faq_id | String | 唯一ID |
| category | Enum | 主题类别 |
| question_zh | String | 繁体中文问题 |
| question_en | String | 英文问题 |
| answer | Object | 多格式答案 |
| keywords | Array | 搜索关键词 |
| trigger_intents | Array | 意图代码 |
| view_count | Integer | 浏览次数 |
| helpful_count | Integer | 反馈有用次数 |

**匹配算法：**
```python
def match_faq(query_vector, faq_vectors):
    # 1. 关键词精确匹配
    # 2. TF-IDF相似度
    # 3. 语义嵌入相似度（同义词）
    # 4. 基于意图的路由
    
    scores = []
    for faq in faq_database:
        keyword_score = keyword_match(query, faq.keywords)
        tfidf_score = cosine_similarity(query_tfidf, faq.tfidf)
        semantic_score = cosine_similarity(query_embedding, faq.embedding)
        intent_score = intent_match(query_intent, faq.trigger_intents)
        
        final_score = (
            keyword_score * 0.3 +
            tfidf_score * 0.2 +
            semantic_score * 0.3 +
            intent_score * 0.2
        )
        scores.append((faq, final_score))
    
    return sorted(scores, key=lambda x: x[1], reverse=True)
```

---

### Function F-AUTO-001: 周期性任务触发器

**任务触发配置：**
```yaml
scheduled_tasks:
  # 每日任务
  - name: "晨检仪表板刷新"
    trigger: "daily @ 06:30"
    action: "refresh_dashboard_data"
    
  - name: "家长查询摘要"
    trigger: "daily @ 18:00"
    action: "generate_inquiry_summary"
    
  # 每周任务  
  - name: "代课统计报告"
    trigger: "weekly: every_friday 16:00"
    action: "generate_absence_report"
    
  # 每月任务
  - name: "月费缴费提醒"
    trigger: "monthly: 15th 09:00"
    action: "send_fee_reminder"
```

---

### Function F-AUTO-002: 智能提醒系统

**提醒级别：**
| 级别 | 渠道 | 时机 | 升级 |
|------|------|------|------|
| INFO | App Push, SMS | 可配置 | 无 |
| NORMAL | App, Email, SMS | 可配置 | +24小时升级 |
| URGENT | App, SMS, 电话 | 立即 | +2小时升级 |
| CRITICAL | 全渠道+学校领导 | 立即 | 立即升级 |

**消息送达回执机制（用户模拟反馈P0-01 — 新增）：**
> 所有通过微信/App推送的重要通知，须建立消息送达回执机制，并对高优先级通知启用短信备用渠道。

| 功能 | 说明 |
|------|------|
| 送达回执 | 家长打开通知 → 系统标记"已读"，显示「家长已读」状态 |
| 未读跟进 | 24小时内未读 → 自动重发一次 + 短信备用 |
| 失败告警 | 推送持续失败 → 告警至校务处，显示「通知发送失败」|
| 短信备用 | 对高优先级通知（迟到/安全/紧急）同时发送短信，确保触达 |

**短信备用渠道规则（用户模拟反馈P0-01 — 新增）：**
> 以下场景须同时发送短信，确保通知触达：

| 场景 | 渠道优先级 |
|------|-----------|
| 学生校车延误 | 微信推送 → 短信备用 |
| 学生出勤异常（连续迟到/缺席）| 微信推送 → 短信备用 |
| 紧急通知（台风/停课等）| 短信优先 + 微信推送 |
| 成绩发布 | 微信推送（无备用）|
| 日常缴费提醒 | 微信推送（无备用）|

**Token健康检查（用户模拟反馈P0-01 — 新增）：**
> 系统每24小时自动检查微信渠道token有效性，异常时发送告警至校务主任。

| 检查频率 | 异常处理 |
|----------|---------|
| 每24小时 | 微信token异常 → 立即告警至校务主任（邮件+短信）|

---

### Function F-AI-003: OCR文档识别

**支持的文档类型：**
| 文档 | 提取字段 | 准确率目标 |
|------|---------|-----------|
| 出生证明书 | 姓名, 性别, 出生日期, 父母姓名 | >98% |
| 香港身份证 | 姓名, 身份证号, 出生日期, 性别 | >99% |
| 学校报告表 | 学生姓名, 班别, 各科成绩, 操行等级 | >95% |
| 医疗证明书 | 学生姓名, 医生姓名, 诊断, 建议休息日数 | >90% |
| 保险证书 | 保单号码, 生效日期, 到期日期, 受保人 | >98% |

---

## 第八部分：Module 5 — 整合及合规

### Function F-INT-001: WebSAMS数据同步

**同步模式：**
| 模式 | 频率 | 数据量 | 用途 |
|------|------|--------|------|
| 实时 | 事件驱动 | 小量 | 学生更新 |
| 定时 | 每日23:00 | 中量 | 出勤, 成绩 |
| 批量 | 每周/每月 | 大量 | 年度处理 |
| 按需 | 手动触发 | 可变 | 特定数据拉取 |

**同步数据域：**
```
学生资料 (Student Data)
├── 基本资料 ←→ 双向同步
├── 学籍资料 ←→ 双向同步
├── 出席记录 ←→ 学校 → WebSAMS
├── 成绩资料 ←→ 学校 → WebSAMS
└── 健康记录 ←→ 学校 → WebSAMS
```

---

### Function F-INT-002: eClass系统集成

**eClass API端点（消费）：**
```
GET  /api/attendance/students/{class_id}/{date}
GET  /api/attendance/student/{student_id}/history
POST /api/attendance/record
GET  /api/homework/class/{class_id}
GET  /api/homework/student/{student_id}
POST /api/homework
GET  /api/communication/messages/{user_type}
POST /api/communication/send
```

---

### Function F-COMP-001: 隐私条例合规检查

**数据分类：**
| 级别 | 描述 | 示例 | 处理规则 |
|------|------|------|----------|
| P1 | 高度敏感 | 健康资料, 身份证号, 家庭状况 | 加密, 双重授权, 完整审计 |
| P2 | 中度敏感 | 成绩, 奖惩记录, 联络方式 | 加密, 用途限制 |
| P3 | 一般资料 | 姓名, 班别, 出席率 | 标准保护 |

**合规检查：**
```python
def pdpo_compliance_check(action, data_class, user_role, purpose):
    checks = []
    
    # 目的限制 (Purpose Limitation)
    allowed_purposes = {
        "P1": ["education_administration", "healthcare", "emergency"],
        "P2": ["education_administration", "communication", "reporting"],
        "P3": ["education_administration", "communication", "public"]
    }
    checks.append(check_purpose_legitimate(...))
    
    # 资料最小化 (Data Minimization)
    checks.append(check_data_minimization(...))
    
    # 存取控制 (Access Control)
    checks.append(check_access_permission(...))
    
    # 保留期限 (Retention Period)
    checks.append(check_retention_compliance(...))
    
    return all(checks)
```

---

### Function F-COMP-002: 双人见证流程

**触发条件：**
| 条件 | 阈值 | 所需见证人 |
|------|------|-----------|
| 现金收取 | 任何金额 | 1名员工+1名见证人 |
| 现金支付 >HK$500 | >HK$500 | 2名授权员工 |
| 备用金补充 | 任何 | 2名授权员工 |
| 保险箱开启 | 任何 | 2名授权员工 |
| 支票签署 | 任何 | 2名授权签署人 |

---

### Function F-COMP-003: 审计日志管理

**记录的事件：**
| 类别 | 事件 | 保存期 |
|------|------|--------|
| 资料存取 | 查询、下载、打印个人资料 | 7年 |
| 资料修改 | 新增、更新、删除记录 | 7年 |
| 系统操作 | 登入、登出、权限变更 | 5年 |
| 财务交易 | 收款、付款、报销 | 7年 |
| 合规事件 | 同意书查阅、销毁记录 | 7年 |

---

### Function F-BACK-001: 自动备份管理

**备份计划：**
| 备份类型 | 频率 | 保存期 | 存储 |
|---------|------|--------|------|
| 每日增量 | 每日01:00 | 7天 | 本地+云端 |
| 每周完整 | 周日02:00 | 4周 | 本地+云端 |
| 每月完整 | 每月1日 | 12个月 | 云端（加密） |
| 学年结束 | 8月31日 | 7年 | 异地存档 |

---

## 第九部分：Module 8 — 多语言支持系统

### 8.1 模块概述

**Module 8 (Multilingual Support / i18n)** 是系统的横向基础设施模块，为所有功能模块提供多语言服务能力，确保系统能够服务香港多元语言环境下的所有用户。

**支持语言（评审报告修正 — 用户模拟反馈D-08）：**
- 🇭🇰 **繁体中文 (zh-HK)** — 香港本地默认语言，符合香港教育局官方文件标准
- 🇭🇰 **粤语口语 (zh-HK-Cantonese)** — **新增：** 家长/学生门户界面支持粤语口语表达（非正式书面语），系统自动识别粤语口语关键词并以口语语气回复，如「幾點到？」、「今日 lunch 係咩？」
- 🇨🇳 **简体中文 (zh-CN)** — 内地用户常用语言
- 🇬🇧 **英语 (en)** — 国际学生、外籍教师及跨境沟通场景

> **评审报告修正说明：** 原有 zh-HK 仅定义为繁体中文，现补充粤语口语（zh-HK-Cantonese）作为独立界面模式，适用于家长/学生微信门户。粤语口语模式不改变数据存储语言（所有数据以标准繁体中文存储），仅在展示层使用口语语气和常用粤语词汇。

**核心价值：**
- **一致性：** 统一的翻译管理，避免同一术语在不同模块出现不同翻译
- **可扩展性：** 模块化架构，支持未来新增语言（如粤语拼音、葡语）
- **上下文感知：** 根据用户角色和场景自动推荐语言
- **AI 增强：** 利用 LLM 提供上下文感知的智能翻译建议

**涉及函数：**
| 函数ID | 函数名称 | 优先级 |
|--------|---------|--------|
| F-I18N-001 | 多语言框架与翻译管理 | P0 |
| F-I18N-002 | 语言检测与自动切换 | P0 |
| F-I18N-003 | 实时内容翻译 (LLM) | P1 |
| F-I18N-004 | 区域化与格式本地化 (Locale) | P1 |

---

### Function F-I18N-001: 多语言框架与翻译管理

**函数ID：** F-I18N-001
**函数名称：** 多语言框架与翻译管理
**模块：** MOD-I18N-001 (Module 8)
**子模块：** 基础框架
**优先级：** P0
**责任人：** 系统架构团队

#### 功能描述

建立统一的多语言框架（i18n Framework），集中管理系统中所有用户可见文本的翻译，支持繁体中文、简体中文、英语三种语言，并为未来扩展新语言预留架构。

#### 用户故事

> **作为** 校务处同工，**我想要** 在系统中切换界面语言，**以便** 我能用自己熟悉的语言（繁体/简体/英文）进行日常工作，提升操作效率。

#### 业务规则

1. **翻译资源结构**
   - 每种语言对应一个独立的翻译资源文件（JSON / i18next 格式）
   - 翻译键（Translation Key）统一采用 `模块.子模块.概念` 命名规范，例如：`dashboard.attendance.title = "学生出勤概览"`
   - 翻译值不得包含占位符之外的任何业务逻辑

2. **语言覆盖要求**
   - 所有 P0 和 P1 优先级的用户界面文本必须有三种语言（zh-HK, zh-CN, en）的完整翻译
   - P2 及以下优先级的文本优先保证 zh-HK 和 zh-CN，可选 en

3. **翻译一致性**
   - 建立核心术语表（Glossary），确保相同概念在不同模块使用一致翻译
   - 关键业务术语（如学生状态、费用类型）须经专人审核

4. **翻译工作流**
   - 初始翻译 → AI 辅助审校 → 人工审核 → 发布上线
   - 翻译更新须记录版本历史，支持回滚

#### 用户界面与交互

| 场景 | 行为描述 |
|------|----------|
| **语言切换入口** | 页面右上角语言选择器，显示为国旗/地区图标（如 🇭🇰 / 🇨🇳 / 🇬🇧） |
| **切换响应** | 页面刷新后立即显示目标语言，无延迟加载翻译文件 |
| **默认语言** | 未登录用户默认显示 zh-HK；已登录用户使用其个人偏好语言 |
| **语言偏好保存** | 用户选择语言后，系统自动保存至用户配置，后续访问自动应用 |

#### 数据结构

**翻译资源文件结构：**
```json
{
  "zh-HK": {
    "dashboard": {
      "title": "智能校务仪表板",
      "attendance": {
        "title": "學生出勤概覽",
        "present": "已出席",
        "absent": "缺席",
        "late": "遲到",
        "early_leave": "早退"
      },
      "lunch": {
        "title": "午膳訂購彙總",
        "ordered": "已訂購",
        "pending": "待確認"
      }
    },
    "common": {
      "save": "儲存",
      "cancel": "取消",
      "confirm": "確認",
      "search": "搜尋"
    }
  },
  "zh-CN": {
    "dashboard": {
      "title": "智能校务仪表板",
      "attendance": {
        "title": "学生出勤概览",
        "present": "已出席",
        "absent": "缺席",
        "late": "迟到",
        "early_leave": "早退"
      },
      "lunch": {
        "title": "午膳订购汇总",
        "ordered": "已订购",
        "pending": "待确认"
      }
    },
    "common": {
      "save": "保存",
      "cancel": "取消",
      "confirm": "确认",
      "search": "搜索"
    }
  },
  "en": {
    "dashboard": {
      "title": "Smart School Admin Dashboard",
      "attendance": {
        "title": "Student Attendance Overview",
        "present": "Present",
        "absent": "Absent",
        "late": "Late",
        "early_leave": "Early Leave"
      },
      "lunch": {
        "title": "Lunch Order Summary",
        "ordered": "Ordered",
        "pending": "Pending Confirmation"
      }
    },
    "common": {
      "save": "Save",
      "cancel": "Cancel",
      "confirm": "Confirm",
      "search": "Search"
    }
  }
}
```

**翻译键注册表：**
```sql
CREATE TABLE translation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_path VARCHAR(200) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  priority VARCHAR(10) DEFAULT 'P1',  -- P0 | P1 | P2
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE | DEPRECATED | PENDING
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,  -- zh-HK | zh-CN | en
  value TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  translator_id UUID REFERENCES users(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(key_id, locale)
);

CREATE TABLE glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_en VARCHAR(100) NOT NULL,
  term_zh_hk VARCHAR(100),
  term_zh_cn VARCHAR(100),
  definition TEXT,
  domain VARCHAR(50),           -- education, finance, attendance
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/i18n/translations` | 获取指定语言的翻译资源 |
| GET | `/api/v1/i18n/translations/:locale` | 获取特定语言的完整翻译文件 |
| GET | `/api/v1/i18n/glossary` | 获取术语表 |
| POST | `/api/v1/i18n/translations` | 提交新翻译或更新（需审核） |
| PUT | `/api/v1/i18n/translations/:id/approve` | 审核通过翻译 |
| GET | `/api/v1/i18n/keys` | 列出所有翻译键及翻译状态 |
| GET | `/api/v1/i18n/keys/missing` | 获取缺失翻译的键列表 |

```typescript
// GET /api/v1/i18n/translations/:locale
interface GetTranslationsResponse {
  locale: 'zh-HK' | 'zh-CN' | 'en';
  version: string;        // 翻译文件版本号（基于最后更新时间）
  translations: Record<string, any>;  // 嵌套翻译对象
  missing_keys?: string[];  // 该语言缺失的键（用于调试）
}

// GET /api/v1/i18n/translations
interface GetAllTranslationsResponse {
  'zh-HK': Record<string, any>;
  'zh-CN': Record<string, any>;
  'en': Record<string, any>;
  generated_at: string;
}
```

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 用户可在界面右上角切换三种语言 | 手动切换并验证所有可见文本 |
| 2 | 语言偏好保存至用户配置 | 切换语言后登出再登录，验证默认语言 |
| 3 | 翻译文件按模块组织，无重复键 | 代码审查 + 自动化检测 |
| 4 | 翻译更新不需重新部署 | 通过管理界面更新翻译后立即生效 |
| 5 | 术语表覆盖所有核心业务术语（≥ 100条） | 术语表条目数量验证 |

---

### Function F-I18N-002: 语言检测与自动切换

**函数ID：** F-I18N-002
**函数名称：** 语言检测与自动切换
**模块：** MOD-I18N-001 (Module 8)
**子模块：** 语言检测
**优先级：** P0
**责任人：** 系统架构团队

#### 功能描述

根据用户的浏览器语言设置、IP 地理位置和历史偏好，自动检测并设置最佳界面语言，减少用户手动切换成本。

#### 业务规则

1. **语言检测优先级**
   - 第1优先：用户手动选择并保存的语言偏好（`user.preferred_locale`）
   - 第2优先：URL 参数 `?lang=zh-HK|zh-CN|en`
   - 第3优先：浏览器 `Accept-Language` 请求头
   - 第4优先：IP 地理位置（香港 → zh-HK，中国大陆 → zh-CN，其他 → en）
   - 第5优先：系统默认 zh-HK

2. **语言代码规范**
   - 支持：`zh-HK`（默认）、`zh-CN`、`en`
   - 旧版兼容：`zh-TW` → 自动映射至 `zh-HK`；`zh` → 根据检测结果映射

3. **自动切换提示**
   - 当系统自动检测到的语言与用户当前语言不同时，可选择显示切换提示横幅
   - 用户可选择"切换"或"保持当前语言"

#### 用户界面与交互

| 场景 | 行为描述 |
|------|----------|
| **新用户首次访问** | 根据浏览器语言自动设置界面语言，显示切换提示横幅 |
| **URL 带语言参数** | 优先使用 URL 参数，覆盖所有自动检测逻辑 |
| **切换提示横幅** | 显示"我们检测到您可能偏好 [语言]，是否切换？" |
| **语言不一致告警** | 管理后台显示语言使用分布统计 |

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 浏览器 Accept-Language 为 zh-CN 时自动显示简体中文 | 修改浏览器语言设置后访问 |
| 2 | URL `?lang=en` 参数优先于浏览器语言 | 携带参数访问并验证 |
| 3 | 用户手动切换后偏好被保存 | 切换语言 → 刷新页面 → 验证保持 |
| 4 | IP 位于内地时默认 zh-CN | 使用 VPN 模拟内地 IP 访问 |

---

### Function F-I18N-003: 实时内容翻译 (LLM)

**函数ID：** F-I18N-003
**函数名称：** 实时内容翻译 (LLM)
**模块：** MOD-I18N-001 (Module 8)
**子模块：** AI 翻译
**优先级：** P1
**责任人：** AI 团队

#### 功能描述

利用 LLM（Coze/OpenAI）提供实时智能翻译，不仅翻译文本，更根据上下文保持语气、专业术语一致性。适用于用户生成的动态内容（如家长留言、AI 回复）翻译。

#### 业务规则

1. **翻译场景**
   - 用户生成内容（UGC）的实时翻译
   - AI 助手的双语回复
   - 通知消息的多语言推送
   - 文档附件的文字提取后翻译

2. **质量要求**
   - 使用专门针对香港教育场景微调的 LLM
   - 翻译后须保留原文语义，不可遗漏关键信息
   - 专业术语须与系统术语表保持一致

3. **性能要求**
   - 实时翻译（< 3 秒）用于聊天场景
   - 批量翻译用于文档场景（< 30 秒/页）

4. **翻译缓存**
   - 相同内容相同语言对仅翻译一次，结果缓存
   - 缓存有效期：24 小时
   - 缓存键：`SHA256(original_text + source_locale + target_locale)`

#### 技术实现

```typescript
// 实时翻译服务
async function translateContent(
  text: string,
  sourceLocale: 'zh-HK' | 'zh-CN' | 'en',
  targetLocale: 'zh-HK' | 'zh-CN' | 'en'
): Promise<TranslationResult> {
  // 1. 检查缓存
  const cacheKey = generateCacheKey(text, sourceLocale, targetLocale);
  const cached = await redis.get(`i18n:cache:${cacheKey}`);
  if (cached) return JSON.parse(cached);

  // 2. 调用 LLM 翻译
  const result = await llm.translate({
    text,
    source: sourceLocale,
    target: targetLocale,
    context: 'school_admin_hk',  // 香港学校管理场景
    glossary: await getGlossary(sourceLocale, targetLocale)
  });

  // 3. 缓存结果
  await redis.setex(`i18n:cache:${cacheKey}`, 86400, JSON.stringify(result));

  return result;
}
```

#### API 接口

```typescript
// POST /api/v1/i18n/translate
interface TranslateRequest {
  text: string;
  source_locale: 'zh-HK' | 'zh-CN' | 'en';
  target_locale: 'zh-HK' | 'zh-CN' | 'en';
  use_cache?: boolean;  // default: true
}

interface TranslationResult {
  original: string;
  translated: string;
  source_locale: string;
  target_locale: string;
  confidence: number;
  cached: boolean;
  glossary_applied: number;  // 应用了多少条术语表条目
}

// POST /api/v1/i18n/translate/batch
interface BatchTranslateRequest {
  texts: string[];
  source_locale: string;
  target_locale: string;
}
```

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 相同内容第二次翻译命中缓存 | 日志验证 `cached: true` |
| 2 | 翻译应用术语表，专业术语一致 | 测试"旷课"→"Absence without leave" |
| 3 | 批量翻译支持最多 50 条/请求 | API 测试 |
| 4 | 翻译错误率 < 1%（人工抽检） | 随机抽样 100 条进行人工审核 |

---

### Function F-I18N-004: 区域化与格式本地化 (Locale)

**函数ID：** F-I18N-004
**函数名称：** 区域化与格式本地化 (Locale)
**模块：** MOD-I18N-001 (Module 8)
**子模块：** 格式本地化
**优先级：** P1
**责任人：** 系统架构团队

#### 功能描述

除文本翻译外，对数字、货币、日期、时间、文件大小等数据的显示格式进行本地化适配，确保符合各地区用户的阅读习惯。

#### 业务规则

| 数据类型 | zh-HK 格式 | zh-CN 格式 | en 格式 |
|----------|------------|------------|---------|
| **日期** | 2026年5月25日 / 25/05/2026 | 2026年5月25日 | May 25, 2026 |
| **时间** | 上午10:30 / 10:30 am | 上午10:30 / 10:30 AM | 10:30 AM |
| **货币** | HK$1,500 | ¥1,500 / RMB ¥1,500 | HK$1,500.00 |
| **数字** | 1,234.56 | 1,234.56 | 1,234.56 |
| **百分比** | 85.5% | 85.5% | 85.5% |
| **学号** | 保留原始格式（数字+字母） | 保留原始格式 | 保留原始格式 |
| **文件大小** | 1.5 MB / 2.3 GB | 1.5 MB / 2.3 GB | 1.5 MB / 2.3 GB |

#### 技术实现

```typescript
// 本地化格式化工具
import { format } from 'date-fns';
import { zhHK, zhCN, enUS } from 'date-fns/locale';

const localeConfigs = {
  'zh-HK': {
    dateFormat: 'yyyy年M月d日',
    timeFormat: 'a h:mm',
    currency: 'HKD',
    currencySymbol: 'HK$',
    locale: zhHK,
  },
  'zh-CN': {
    dateFormat: 'yyyy年M月d日',
    timeFormat: 'A h:mm',
    currency: 'CNY',
    currencySymbol: '¥',
    locale: zhCN,
  },
  'en': {
    dateFormat: 'MMMM d, yyyy',
    timeFormat: 'h:mm a',
    currency: 'HKD',
    currencySymbol: 'HK$',
    locale: enUS,
  }
};

// 使用示例
formatDate(date: Date, locale: string): string {
  const config = localeConfigs[locale];
  return format(date, config.dateFormat, { locale: config.locale });
}

formatCurrency(amount: number, locale: string): string {
  const config = localeConfigs[locale];
  return `${config.currencySymbol}${amount.toLocaleString(locale)}`;
}
```

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 日期格式符合各语言/地区习惯 | 切换语言后验证"2026年5月25日"等 |
| 2 | 货币符号正确显示 | 财务模块切换语言后验证 HK$ / ¥ |
| 3 | 数字格式统一（千位分隔符） | 切换语言后验证大数字显示 |
| 4 | PDF 导出内容与界面语言一致 | 生成报表验证语言和格式 |

---

## 第十部分：Module 9 — 新增功能 (v1.6.0 评审报告补全)

> **Module 9 (New Functions / v1.6.0)** 是基于功能评审报告（2026-06-06）的缺漏需求清单，新增的6个核心功能模块。其余9项缺漏需求（P2/P3优先级）列入未来版本计划。

### 10.1 模块概述

| 属性 | 描述 |
|------|------|
| 模块名称 | New Functions — v1.6.0 评审报告补全 (New Functions from Functional Review Report v1.6.0) |
| 模块ID | MOD-NEW-001 |
| 优先级 | P0/P1 |
| 用户 | 全体校务人员 |
| 评审依据 | 功能评审报告 REVIEW-FUNC-001（2026-06-06） |

---

### Function F-NEW-001: 一键灾难恢复与业务连续性

**函数ID：** F-NEW-001
**函数名称：** 一键灾难恢复与业务连续性
**模块：** MOD-NEW-001 (Module 9)
**子模块：** 灾难恢复
**优先级：** P0（评审报告P0优先级清单第15项）
**责任人：** 系统架构团队

#### 功能描述

提供一键灾难恢复能力，确保系统在遭遇硬件故障、数据损坏、网络攻击或人为误操作后，能够快速恢复业务运营，将RTO（恢复时间目标）控制在4小时以内，RPO（恢复点目标）控制在1小时以内。

#### 业务连续性目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| RTO（恢复时间目标）| ≤4小时 | 系统从故障到恢复可用的最长时间 |
| RPO（恢复点目标）| ≤1小时 | 数据丢失的最大时间窗口 |
| 备份成功率 | ≥99.9% | 每日备份任务成功率 |
| 恢复演练频率 | 每季度1次 | 季度灾难恢复演练验证 |
| 恢复验证时间 | ≤30分钟 | 恢复后数据完整性验证时间 |

#### 灾难恢复策略

| 层级 | 策略 | 触发条件 |
|------|------|---------|
| **L1 — 数据层** | PostgreSQL WAL（预写日志）+ PITR（时间点恢复） | 数据库损坏 |
| **L2 — 应用层** | Docker镜像快照 + 配置分离 | 应用崩溃或配置错误 |
| **L3 — 系统层** | 云快照（整机备份）+ 异地容灾 | 整机故障或硬件损坏 |
| **L4 — 网络层** | CDN + 多线路BGP failover | 网络攻击或线路中断 |

#### 一键恢复操作流程

```
灾难发生 → 告警触发（<1分钟）
    ↓
系统自动评估故障类型 → 选择恢复策略
    ↓
一键恢复执行：
  ├─ 确认恢复点（最近可用备份）→ 用户/管理员确认
  ├─ 自动执行恢复脚本
  ├─ 数据完整性校验（MD5/SHA-256）
  ├─ 服务可用性探测
  └─ 恢复完成通知（App + 短信）
    ↓
恢复报告自动生成 → 存档至审计日志
```

#### 数据恢复类型

| 恢复类型 | 适用场景 | 操作复杂度 | 预计耗时 |
|----------|---------|-----------|---------|
| 全量恢复（Full Restore）| 整机故障、勒索软件 | 高 | 2-4小时 |
| 数据库PITR | 误删数据、数据损坏 | 中 | 15-30分钟 |
| 文件级恢复 | 单个文件误删 | 低 | 5-15分钟 |
| 定时点回滚 | 错误批量操作 | 中 | 10-30分钟 |

#### 输出

```json
{
  "disaster_recovery_session": {
    "session_id": "DR-2026-06-06-001",
    "incident_type": "data_corruption",
    "triggered_at": "2026-06-06T14:30:00+08:00",
    "recovery_point": {
      "type": "pitr",
      "timestamp": "2026-06-06T13:30:00+08:00",
      "data_loss_minutes": 60,
      "backup_source": "cloud_backup_06_06_13:00"
    },
    "recovery_steps": [
      {"step": 1, "action": "validate_backup_integrity", "status": "completed", "duration_sec": 45},
      {"step": 2, "action": "restore_postgresql_pitr", "status": "completed", "duration_sec": 720},
      {"step": 3, "action": "validate_data_integrity", "status": "completed", "duration_sec": 180},
      {"step": 4, "action": "restart_application_services", "status": "completed", "duration_sec": 60}
    ],
    "total_duration_minutes": 17,
    "rto_achieved": true,
    "rpo_achieved": true,
    "notified_users": ["SCHOOL_ADMIN", "SYSTEM_ADMIN"],
    "recovery_report_url": "https://..."
  }
}
```

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 模拟数据库损坏后，30分钟内恢复至最近备份点 | 季度演练 |
| 2 | 恢复后数据完整性校验通过（MD5） | 自动执行 |
| 3 | 恢复完成后自动发送短信/App通知校务主任 | 功能验证 |
| 4 | 恢复日志完整存档至F-USER-005审计日志 | 日志审查 |

---

### Function F-NEW-002: 多渠道通知模板管理

**函数ID：** F-NEW-002
**函数名称：** 多渠道通知模板管理
**模块：** MOD-NEW-001 (Module 9)
**子模块：** 通知管理
**优先级：** P1（评审报告缺漏需求第12项）
**责任人：** AI 团队

#### 功能描述

集中管理学校向家长、学生、教师发送的所有通知模板，统一管理微信模板消息、短信（SMS）和邮件的内容格式、发送规则和变量替换，支持按通知类型、紧急程度、接收角色进行差异化模板配置。

#### 通知渠道

| 渠道 | 适用场景 | 字符限制 | 成本 |
|------|---------|---------|------|
| 微信模板消息 | 家长微信/App通知 | ≤600字 | 低 |
| 短信 (SMS) | 紧急通知、无App家长 | ≤160字（英文）/ 70字（中文）| 较高 |
| 邮件 | 正式文件、附件传输 | 无限制 | 低 |
| 飞书消息 | 内部教职员通知 | 无限制 | 免费 |
| App推送 | 有App的用户 | ≤300字 | 极低 |

#### 模板结构

```json
{
  "template_id": "TPL-BUS-DELAY-001",
  "name": "校车延误通知",
  "category": "bus",
  "urgency": "high",
  "channels": ["wechat", "sms"],
  "wechat": {
    "template_id": "wx_template_bus_delay",
    "title": "校车延误通知",
    "content": "亲爱的家长，您的孩子乘坐的校车（线路：{{route_name}}）预计延误{{delay_minutes}}分钟。\n延误原因：{{delay_reason}}\n预计到校时间：{{eta_time}}\n如有任何疑问，请联系校务处。",
    "variables": ["route_name", "delay_minutes", "delay_reason", "eta_time"],
    "fallback_channel": "sms"
  },
  "sms": {
    "content": "【学校通知】校车{{route_name}}延误{{delay_minutes}}分钟，预计{{eta_time}}到校。如需帮助请致电学校。",
    "variables": ["route_name", "delay_minutes", "eta_time"],
    "priority": "high"
  },
  "delivery_rules": {
    "min_interval_minutes": 30,
    "max_daily_per_parent": 5,
    "quiet_hours": "21:00-07:00"
  },
  "version": 3,
  "last_modified": "2026-05-20",
  "modified_by": "USR-2026-00001"
}
```

#### 模板分类

| 类别 | 示例模板 | 优先级 | 备用渠道 |
|------|---------|--------|---------|
| 校车通知 | 校车延误、到校确认、路线变更 | HIGH | SMS |
| 出勤通知 | 迟到提醒、缺席确认、异常预警 | HIGH | SMS |
| 成绩通知 | 成绩发布、成绩异常 | NORMAL | Email |
| 缴费通知 | 账单生成、逾期提醒、已缴确认 | NORMAL | Email |
| 活动通知 | 活动报名、活动取消、活动提醒 | NORMAL | Wechat |
| 紧急通知 | 台风停课、紧急疏散、食品安全 | CRITICAL | SMS + Call |
| 日常通知 | 午膳变更、校车开通、开学通知 | INFO | Wechat |

#### API 接口

```typescript
// GET /api/v1/notifications/templates
// POST /api/v1/notifications/templates
// PUT /api/v1/notifications/templates/:id
// POST /api/v1/notifications/send
interface SendNotificationRequest {
  template_id: string;
  recipient_group: 'parents' | 'teachers' | 'all' | 'specific_users';
  recipient_user_ids?: string[];
  variables: Record<string, string>;
  channel_override?: ('wechat' | 'sms' | 'email' | 'app')[];
  scheduled_at?: string;
}
```

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 同一模板可配置微信/短信/邮件三个渠道 | 手动创建模板并发送测试 |
| 2 | 模板变量正确替换，无遗漏 | 使用不同变量值发送测试通知 |
| 3 | 紧急通知自动切换SMS备用渠道 | 模拟推送失败场景 |
| 4 | 通知历史可在F-USER-005中查询 | 日志审查 |

---

### Function F-NEW-003: DSE放榜成绩追踪

**函数ID：** F-NEW-003
**函数名称：** DSE放榜成绩追踪
**模块：** MOD-NEW-001 (Module 9)
**子模块：** 考试管理
**优先级：** P1（评审报告缺漏需求第1项，周期性校务模块补充）
**责任人：** 教务团队

#### 功能描述

对接香港考试及评核局（HKEAA）DSE放榜系统，自动接收中六学生DSE考试成绩，追踪学生升学去向，生成统计分析报告，支持JUPAS申请状态追踪。

#### HKEAA数据对接

| 数据类型 | 对接方式 | 频率 | 说明 |
|----------|---------|------|------|
| DSE考试成绩 | HKEAA Secure Data Portal (SDP) | 放榜日（8月） | 加密CSV/JSON格式，学校凭授权码下载 |
| 成绩更正申请 | Email + 电话 | 按需 | 成绩公布后14天内可申请覆核 |
| 放榜指南 | HKEAA官网API | 每年更新 | 获取放榜流程、申请截止日期 |

#### 追踪功能

| 功能 | 描述 |
|------|------|
| 成绩自动入库 | HKEAA放榜后自动导入学生成绩，生成个人成绩单 |
| 成绩分布分析 | 全级/各班DSE成绩分布柱状图、平均分、标准差 |
| 大学联招追踪 | JUPAS申请状态（Band A/B/C志愿状态）自动更新 |
| 升学去向统计 | 学生最终就读大学/课程统计，匿名化处理 |
| 升学顾问报告 | 自动生成年度升学去向报告（供校务主任参考）|

#### 输出

```json
{
  "dse_result_tracking": {
    "academic_year": "2025-2026",
    "release_date": "2026-08-12",
    "total_s6_students": 180,
    "results_received": 175,
    "results_pending": 5,
    "by_subject_analysis": [
      {
        "subject": "中國語文",
        "candidates": 175,
        "level_5_plus_pct": "12.5%",
        "pass_rate": "98.3%",
        "school_avg": 4.2,
        "hkeaa_avg": 4.1
      }
    ],
    "jupas_status": {
      "applications_submitted": 165,
      "first_round_offers": 142,
      "acceptance_rate": "86.1%"
    },
    "offer_tracking": [
      {
        "student_id": "2023S10601",
        "student_name": "陳同學",
        "jupas_status": "confirmed_offer",
        "institution": "香港大學",
        "program": "內外全科醫學士",
        "offer_date": "2026-08-10"
      }
    ]
  }
}
```

---

### Function F-NEW-004: 年度预算编制与执行追踪

**函数ID：** F-NEW-004
**函数名称：** 年度预算编制与执行追踪
**模块：** MOD-NEW-001 (Module 9)
**子模块：** 财务管理
**优先级：** P1（评审报告缺漏需求第2项，财务资产模块补充）
**责任人：** 校务主任

#### 功能描述

为学校提供完整的年度预算编制、执行追踪和差异分析功能，支持多部门预算分配、实际支出实时比对、超支预警和预算调整审批流程。

#### 预算编制流程

```
校务主任发起预算 → 各部门提交预算申请（按类别）
    ↓
财务专员初审 → 校务主任/校董会审批
    ↓
预算分配确认 → 录入系统（按月/按季度拆分）
    ↓
执行中追踪 → 实际支出与预算比对
    ↓
季度/年度决算 → 预算执行报告
```

#### 预算科目分类

| 类别代码 | 描述 | 示例 |
|---------|------|------|
| STAFF | 人事费用 | 教职员薪金、津贴 |
| FACILITY | 设施维护 | 冷气、维修、水电 |
| ACADEMIC | 教务支出 | 试卷印刷、图书采购 |
| IT | 资讯科技 | 软件许可、设备更新 |
| ACTIVITY | 活动费用 | 课外活动、旅行 |
| SCHOLARSHIP | 奖助学金 | 奖学金、助学金 |
| ADMIN | 行政费用 | 文具、邮费、印刷 |
| CONTINGENCY | 应急储备 | 未预见支出 |

#### 预算执行追踪

| 功能 | 描述 |
|------|------|
| 实时执行率 | 各科目已用预算 / 分配预算，按月/季度可视化 |
| 超支预警 | 实际支出达到预算80%时黄色预警，100%时红色告警 |
| 预算调整 | 科目间调整须审批，不可超出总预算 |
| 执行报告 | 每月自动生成预算执行报告（PDF）|

#### 输出

```json
{
  "annual_budget": {
    "fiscal_year": "2026-2027",
    "total_allocated": 8500000.00,
    "total_spent": 2150000.00,
    "execution_rate": "25.3%",
    "by_category": [
      {
        "category": "STAFF",
        "allocated": 5800000.00,
        "spent": 1450000.00,
        "execution_rate": "25.0%",
        "monthly_forecast": 483333.00,
        "variance": 8333.00,
        "status": "on_track"
      },
      {
        "category": "IT",
        "allocated": 300000.00,
        "spent": 280000.00,
        "execution_rate": "93.3%",
        "status": "warning"
      }
    ],
    "adjustments": [
      {"date": "2026-10-15", "from_category": "ACTIVITY", "to_category": "IT", "amount": 50000.00, "approved_by": "校務主任"}
    ]
  }
}
```

---

### Function F-NEW-005: 自定义报表生成与定时推送

**函数ID：** F-NEW-005
**函数名称：** 自定义报表生成与定时推送
**模块：** MOD-NEW-001 (Module 9)
**子模块：** 报表中心
**优先级：** P1（评审报告缺漏需求第4项，AI助理模块补充）
**责任人：** AI 团队

#### 功能描述

为校务主任和各级管理人员提供自助式报表生成工具，支持拖拽式字段选择、多维度筛选和定时自动推送，减少人工报表制作工作量。

#### 报表生成器

| 功能 | 说明 |
|------|------|
| 字段选择 | 拖拽选择所需字段，支持多表关联（学生×成绩、出勤×班级）|
| 筛选条件 | 等值/范围/模糊匹配，支持AND/OR组合 |
| 排序规则 | 多字段排序，显示顺序可调 |
| 分组聚合 | 按班级/年级/月份/教师等维度聚合统计 |
| 图表类型 | 柱状图、饼图、折线图、数字仪表盘 |
| 导出格式 | PDF、Excel、CSV |

#### 预置报表模板

| 报表名称 | 周期 | 接收人 |
|---------|------|--------|
| 每日出勤摘要 | 每日 08:00 | 校务主任 |
| 每周出勤周报 | 每周一 09:00 | 校务主任、班主任 |
| 每月收费报告 | 每月1日 | 校务主任 |
| 学期成绩汇总 | 学期末 | 教务主任、校务主任 |
| 年度财务摘要 | 每学年末 | 校务主任、校董会 |
| DSE成绩分析 | 放榜后 | 教务主任、校长 |

#### 定时推送配置

| 配置项 | 说明 |
|--------|------|
| 推送频率 | 每日/每周/每月/每学期 |
| 推送时间 | 精确到小时（默认工作日09:00）|
| 推送格式 | PDF附件 + 正文摘要 |
| 推送渠道 | App通知 + 邮件 |
| 订阅管理 | 用户可订阅/退订各类型报表 |

#### 验收标准

| # | 验收条件 | 测试方法 |
|---|----------|----------|
| 1 | 用户可在30分钟内创建自定义出勤报表 | 用户测试 |
| 2 | 定时报表准时推送成功 | 连续运行30天验证 |
| 3 | 报表数据与系统数据一致 | 人工抽查比对 |

---

### Function F-NEW-006: 系统健康检查与自动诊断

**函数ID：** F-NEW-006
**函数名称：** 系统健康检查与自动诊断
**模块：** MOD-NEW-001 (Module 9)
**子模块：** 系统运维
**优先级：** P2（评审报告缺漏需求第3项，整合合规模块补充）
**责任人：** 系统管理员

#### 功能描述

对系统各组件（数据库、Web服务、AI引擎、第三方接口）进行持续健康监测，自动发现异常并触发告警，提供一键诊断报告，降低运维成本。

#### 健康检查维度

| 检查项 | 检查内容 | 健康阈值 | 告警级别 |
|--------|---------|---------|---------|
| 数据库连接 | PostgreSQL连接池状态 | 连接成功率 ≥ 99% | ERROR |
| 数据库性能 | 查询响应时间、慢查询数 | P95响应 < 500ms | WARNING |
| Web服务 | HTTP响应时间、错误率 | 5xx错误率 < 0.1% | ERROR |
| 磁盘空间 | 各挂载点使用率 | 使用率 < 85% | WARNING |
| 内存使用 | 各服务内存占用 | 使用率 < 90% | WARNING |
| AI服务 | LLM API响应时间 | < 5秒 | WARNING |
| 第三方接口 | WebSAMS/eClass API可用性 | 可用率 ≥ 98% | ERROR |
| 备份任务 | 每日备份是否成功完成 | 成功率 100% | ERROR |
| Token有效性 | 微信/飞书Access Token状态 | 有效期 > 24h | WARNING |

#### 自动诊断报告

```json
{
  "health_report": {
    "generated_at": "2026-06-06T08:00:00+08:00",
    "overall_status": "healthy",
    "checks": [
      {
        "component": "postgresql",
        "status": "healthy",
        "response_time_ms": 23,
        "connection_pool_used": "45/100",
        "slow_queries": 0
      },
      {
        "component": "wechat_api",
        "status": "warning",
        "access_token_expires_in_hours": 18,
        "last_successful_call": "2026-06-06T07:58:00+08:00",
        "recommendation": "Token将于6小时后过期，建议立即刷新"
      },
      {
        "component": "feishu_api",
        "status": "healthy",
        "last_successful_call": "2026-06-06T07:59:30+08:00"
      }
    ],
    "diagnostic_report_url": "https://..."
  }
}
```

#### 告警升级规则

| 告警级别 | 触发条件 | 通知对象 | 通知方式 | 升级条件 |
|----------|---------|---------|---------|---------|
| CRITICAL | 服务不可用/数据丢失 | 校务主任 + 系统管理员 | 短信 + 电话 | 无升级，立即响应 |
| ERROR | 单组件故障 | 系统管理员 | App + 短信 | 30分钟未响应升级至校务主任 |
| WARNING | 性能下降/资源紧张 | 系统管理员 | App推送 | 2小时未响应升级至校务主任 |
| INFO | 例行检查结果 | 系统管理员 | App推送 | 无升级 |

---

## 第十一部分：Module 10 — 长期规划功能（v1.6+）

> 以下功能在评审报告中标记为长期改进项（v1.6+），本次不纳入正式规格，但记录于此以便后续规划参考。

| 序号 | 功能 | 目标版本 | 评审报告位置 | 说明 |
|------|------|---------|------------|------|
| 1 | 多校区支持 | v2.0 | 边界场景未覆盖 | 跨校区数据隔离与汇总 |
| 2 | 独立家长App | v1.8 | 缺漏需求#6 | 独立App（非仅小程序）|
| 3 | BI数据看板 | v1.7 | 缺漏需求#13 | 高级数据分析与可视化 |
| 4 | 活动管理模块 | v1.6 | 缺漏需求#9 | 校内活动报名与签到 |
| 5 | 会议管理模块 | v1.6 | 缺漏需求#10 | 校务会议安排与纪要 |
| 6 | 文件管理模块 | v1.6 | 缺漏需求#11 | 校内文件共享与版本控制 |
| 7 | 采购供应链管理 | v1.7 | 缺漏需求#8 | 课本/文具采购订单管理 |
| 8 | 历史数据批量导入 | v1.6 | 缺漏需求#5 | 批量导入历史数据 |
| 9 | 第三方API网关 | v1.6 | 缺漏需求#14 | 统一管理第三方API接入 |

---

## 跨模块总结表

### 功能总表

| 模块 | 子模块 | 功能ID | 功能名称 | 优先级 |
|------|--------|--------|---------|--------|
| MOD-USER-001 | 用户管理 | F-USER-001 | 用户生命周期管理 | P0 |
| MOD-USER-001 | 认证 | F-USER-002 | 身份认证 | P0 |
| MOD-USER-001 | 授权 | F-USER-003 | 功能授权 (RBAC+ABAC) | P0 |
| MOD-USER-001 | 会话 | F-USER-004 | 会话与Token管理 | P0 |
| MOD-USER-001 | 审计 | F-USER-005 | 审计日志与登录记录 | P0 |
| MOD-USER-001 | 凭证 | F-USER-006 | 密码与凭证重置 | P0 |
| MOD-USER-001 | 审批 | F-USER-007 | 权限变更审批流程 | P1 |
| MOD-DAILY-001 | 出勤 | F-ATT-001 | 出勤统计 | P0 |
| MOD-DAILY-001 | 出勤 | F-ATT-002 | 迟到/早退记录 | P0 |
| MOD-DAILY-001 | 查询 | F-INQ-001 | 家长查询队列 | P0 |
| MOD-DAILY-001 | 查询 | F-INQ-002 | 快速回复模板 | P1 |
| MOD-DAILY-001 | 午膳 | F-LUNCH-001 | 午膳订购汇总 | P0 |
| MOD-DAILY-001 | 校车 | F-BUS-001 | 校车实时追踪 | P0 |
| MOD-DAILY-001 | 校车 | F-BUS-002 | 校车点大名记录 | P0 |
| MOD-DAILY-001 | 请假 | F-LEAVE-001 | 请假申请处理 | P0 |
| MOD-DAILY-001 | 收费 | F-FEE-001 | 费用收取追踪 | P0 |
| MOD-CYCL-001 | 注册 | F-ENRL-001 | 新生注册 | P0 |
| MOD-CYCL-001 | 注册 | F-ENRL-002 | AI辅助编班 | P0 |
| MOD-CYCL-001 | 注册 | F-ENRL-003 | 课本分发 | P1 |
| MOD-CYCL-001 | 考试 | F-EXAM-001 | DSE报考管理 | P0 |
| MOD-CYCL-001 | 考试 | F-EXAM-002 | 试卷管理 | P0 |
| MOD-CYCL-001 | 考试 | F-EXAM-003 | 特别考试安排 | P0 |
| MOD-CYCL-001 | 考试 | F-EXAM-004 | 成绩单生成发布 | P0 |
| MOD-CYCL-001 | 收生 | F-ADM-001 | 中一自行分配 | P0 |
| MOD-CYCL-001 | 收生 | F-ADM-002 | JUPAS联招管理 | P0 |
| MOD-CYCL-001 | 年终 | F-YREND-001 | 档案清理销毁 | P1 |
| MOD-CYCL-001 | 年终 | F-YREND-002 | 学年财务结算 | P0 |
| MOD-FIN-001 | 收费 | F-FIN-001 | 学费管理 | P0 |
| MOD-FIN-001 | 收费 | F-FIN-002 | 零用现金报销 | P0 |
| MOD-FIN-001 | 收费 | F-FIN-003 | 奖学金津贴申请 | P0 |
| MOD-FIN-001 | 资产 | F-ASSET-001 | 校产条码盘点 | P1 |
| MOD-FIN-001 | 资产 | F-ASSET-002 | 场地租借管理 | P1 |
| MOD-FIN-001 | 资产 | F-ASSET-003 | 设备保养管理 | P1 |
| MOD-FIN-001 | 供应商 | F-VEND-001 | 供应商注册评估 | P1 |
| MOD-AI-001 | NLP | F-AI-001 | 自然语言查询理解 | P0 |
| MOD-AI-001 | NLP | F-AI-002 | FAQ智能匹配 | P0 |
| MOD-AI-001 | 自动化 | F-AUTO-001 | 周期性任务触发器 | P0 |
| MOD-AI-001 | 自动化 | F-AUTO-002 | 智能提醒系统 | P0 |
| MOD-AI-001 | 文档 | F-AI-003 | OCR文档识别 | P1 |
| MOD-INT-001 | WebSAMS | F-INT-001 | WebSAMS数据同步 | P0 |
| MOD-INT-001 | eClass | F-INT-002 | eClass系统集成 | P0 |
| MOD-INT-001 | 合规 | F-COMP-001 | 隐私条例合规检查 | P0 |
| MOD-INT-001 | 合规 | F-COMP-002 | 双人见证流程 | P0 |
| MOD-INT-001 | 合规 | F-COMP-003 | 审计日志管理 | P0 |
| MOD-INT-001 | 备份 | F-BACK-001 | 自动备份管理 | P0 |

| MOD-INT-001 | 备份 | F-BACK-001 | 自动备份管理 | P0 |
| MOD-I18N-001 | 框架 | F-I18N-001 | 多语言框架与翻译管理 | P0 |
| MOD-I18N-001 | 检测 | F-I18N-002 | 语言检测与自动切换 | P0 |
| MOD-I18N-001 | 翻译 | F-I18N-003 | 实时内容翻译 (LLM) | P1 |
| MOD-I18N-001 | 格式 | F-I18N-004 | 区域化与格式本地化 | P1 |
| MOD-NEW-001 | 灾难恢复 | F-NEW-001 | 一键灾难恢复与业务连续性 | P0 |
| MOD-NEW-001 | 通知管理 | F-NEW-002 | 多渠道通知模板管理 | P1 |
| MOD-NEW-001 | 考试管理 | F-NEW-003 | DSE放榜成绩追踪 | P1 |
| MOD-NEW-001 | 财务管理 | F-NEW-004 | 年度预算编制与执行追踪 | P1 |
| MOD-NEW-001 | 报表中心 | F-NEW-005 | 自定义报表生成与定时推送 | P1 |
| MOD-NEW-001 | 系统运维 | F-NEW-006 | 系统健康检查与自动诊断 | P2 |

**总计：55个功能函数，涵盖9大模块**（v1.6.0新增Module 9：6项功能）

---

## 模块依赖关系

```
MOD-I18N-001 (多语言支持)
  └── 被所有业务模块依赖（基础层，横向支持）

MOD-USER-001 (用户与权限管理)
  └── 被所有业务模块依赖（基础层）

MOD-DAILY-001 (每日仪表板)
  ├── 依赖 → MOD-USER-001 (用户身份验证)
  ├── 依赖 → MOD-INT-001 (WebSAMS, eClass 数据)
  ├── 依赖 → MOD-AI-001 (AI查询理解)
  └── 输出 → MOD-FIN-001 (费用收取数据)

MOD-CYCL-001 (周期性校务)
  ├── 依赖 → MOD-USER-001 (用户身份验证)
  ├── 依赖 → MOD-DAILY-001 (出勤数据用于编班)
  ├── 依赖 → MOD-INT-001 (WebSAMS 学籍)
  ├── 依赖 → MOD-AI-001 (AI文档识别)
  └── 输出 → MOD-FIN-001 (考试费、奖学金)

MOD-FIN-001 (财务资产)
  ├── 依赖 → MOD-USER-001 (用户身份 + 审批流程)
  ├── 依赖 → MOD-CYCL-001 (周期性收费)
  ├── 依赖 → MOD-DAILY-001 (日常收款)
  └── 强合规 → MOD-INT-001 (PDPO, 双人见证)

MOD-AI-001 (AI助理)
  └── 被所有模块调用

MOD-INT-001 (整合合规)
  └── 被所有业务模块依赖

MOD-NEW-001 (新增功能/v1.6.0)
  ├── 依赖 → MOD-USER-001 (身份验证)
  ├── 依赖 → MOD-AI-001 (报表生成)
  ├── 依赖 → MOD-INT-001 (系统监控接口)
  └── 输出 → 通知给所有业务模块用户

模块依赖关系说明：
- MOD-USER-001 是所有模块的基础依赖，所有涉及用户身份的操作
  （登录、权限校验、数据归属判断）均依赖本模块
- MOD-I18N-001 为横向支持层，所有涉及用户界面文本、格式本地化的模块均依赖本模块
- MOD-AI-001 与 MOD-INT-001 为横向支撑层，被各业务模块调用
```

---



# 附录 A：文档版本管理 (Document Version Management)

## A.1 变更日志 (Changelog)

> 所有正式版本的变更必须记录于此。变更按发布日期倒序排列。

| 版本 | 发布日期 | 发布者 | 变更类型 | 变更摘要 | 审批人 |
|------|----------|--------|----------|----------|--------|
| **v1.6.0** | 2026-06-06 | 系统架构团队 | Minor | 依据功能评审报告（REVIEW-FUNC-001，2026-06-06）全面修订：**新增6项功能**（F-NEW-001至F-NEW-006）：一键灾难恢复与业务连续性(P0)、多渠道通知模板管理(P1)、DSE放榜成绩追踪(P1)、年度预算编制与执行追踪(P1)、自定义报表生成与定时推送(P1)、系统健康检查与自动诊断(P2)；**修正7项不合理业务点**：F-ATT-001批量撤销时限5分钟→15分钟、F-LEAVE-001病假自动批准增加AI核验机制、F-FIN-002零用现金限额改为动态CPI调整、F-BUS-001延误通知增加阈值配置(>10分钟)、F-USER-003 ABAC升级为OPA规则引擎、F-USER-007权限审批增加二次认证(OTP)、F-EXAM-004成绩撤回增加审计告警；**新增粤语口语界面**(zh-HK-Cantonese)；功能函数总数49→55，模块数8→9（新增Module 9）| （待填）|

| **v1.5.0** | 2026-06-05 | 系统架构团队 | Minor | 用户模拟反馈整合：基于 USER-SIMULATION-FEEDBACK.md v1.0.0（48条反馈）；增强F-USER-003敏感字段脱敏策略；F-USER-005新增家长通话记录规范；F-USER-007新增权限审批证明文件要求；F-USER-001新增家长密码强制设置；F-DASH-001新增仪表板自定义功能；F-ATT-001新增数据源独立状态、受影响学生列表、批量录入确认预览+撤销；F-INQ-001新增通话质量和满意度字段；F-LUNCH-001新增家长自助变更和截止时间规则；F-BUS-001新增乘搭学生列表、延误通知意外类型标签；F-LEAVE-001新增代课老师课时数显示、跟进提醒、审批进度条；F-FEE-001新增电子收据推送和缴费延迟提示；F-FIN-001新增欠费sub_status；F-FIN-002新增OCR金额视觉区分和双人见证实时推送；F-EXAM-004新增成绩自撤回、PDF导出、班级成绩分布图；F-ADM-002新增推荐信AI字数统计和写作辅助；F-AUTO-002新增消息送达回执、短信备用渠道、Token健康检查 | （待填）|
| **v1.4.0** | 2026-06-03 | 系统架构团队 | Minor | 新增数据库架构设计文档 (DB-SCHEMA.md) 和数据字典 (DATA-DICTIONARY.md)；定义60+数据表，涵盖7大模块；包含ER关系图、表结构定义、索引设计、外键关系、枚举值规范；数据字典定义数据项、业务规则、数据质量规则、敏感数据处理、数据保留政策 | （待填）|
| **v1.3.0** | 2026-05-25 | 系统架构团队 | Minor | 新增 Module 8 — 多语言支持系统：F-I18N-001 至 F-I18N-004（4个函数）；支持繁体中文(zh-HK)、简体中文(zh-CN)、英语(en)；涵盖翻译框架、语言检测、AI实时翻译、区域化格式本地化；功能函数总数 45→49 | （待填）|
| **v1.2.0** | 2026-05-24 | 系统架构团队 | Minor | 新增文档版本管理系统：SemVer 规范、版本修订规则、附录 A 变更记录；Module 4→7、Module 5→8 重新编号；功能函数总数 38→45 | （待填）|
| **v1.1.0** | 2026-05-24 | 系统架构团队 | Minor | 新增 Module 6 — 用户与权限管理系统：F-USER-001 至 F-USER-007（7个函数）；用户生命周期、身份认证、RBAC+ABAC授权、会话Token、审计日志、凭证重置、权限变更审批；MOD-USER-001 纳入模块依赖图 | （待填）|
| **v1.0.0** | 2026-05-23 | 系统架构团队 | Major | 初始版本发布。5大核心模块（Module 1–5），共 38 个功能函数，涵盖每日晨检、周期性校务、财务资产、AI助理、整合合规全部核心功能 | （待填）|

---

## A.2 版本历史详情 (Version History Detail)

### v1.6.0 — 2026-06-06 | 评审报告全面修订

**变更类型：** Minor
**变更者：** 系统架构团队
**评审依据：** `REVIEW-FUNC-001` 功能评审报告（2026-06-06，15项缺漏需求 + 7项不合理业务点）

**一、新增功能（6项）：**

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 新增 (Add) | Module 9（新增章节） | F-NEW-001 一键灾难恢复与业务连续性（P0）：RTO≤4h、RPO≤1h，L1-L4四级恢复策略，自动诊断与短信通知 |
| 2 | 新增 (Add) | Module 9（新增章节） | F-NEW-002 多渠道通知模板管理（P1）：微信/短信/邮件统一模板，变量替换，差异化渠道配置 |
| 3 | 新增 (Add) | Module 9（新增章节） | F-NEW-003 DSE放榜成绩追踪（P1）：HKEAA SDP对接，放榜自动入库，升学去向统计 |
| 4 | 新增 (Add) | Module 9（新增章节） | F-NEW-004 年度预算编制与执行追踪（P1）：8类预算科目，实时执行率，超支预警 |
| 5 | 新增 (Add) | Module 9（新增章节） | F-NEW-005 自定义报表生成与定时推送（P1）：拖拽式报表生成，6类预置模板，定时推送 |
| 6 | 新增 (Add) | Module 9（新增章节） | F-NEW-006 系统健康检查与自动诊断（P2）：9维度健康检查，CRITICAL/ERROR/WARNING三级告警，自动诊断报告 |

**二、业务逻辑修正（7项）：**

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 修正 (Modify) | F-ATT-001 | 批量撤销时限：5分钟 → 15分钟（评审报告业务逻辑不合理#1） |
| 2 | 修正 (Modify) | F-LEAVE-001 | 病假自动批准：增加AI辅助核验+随机抽查机制（评审报告业务逻辑不合理#2） |
| 3 | 修正 (Modify) | F-FIN-002 | 零用现金限额：由固定HK$3,000改为动态限额（CPI挂钩，公式调整）（评审报告业务逻辑不合理#3） |
| 4 | 修正 (Modify) | F-BUS-001 | 延误通知阈值：增加可配置阈值（默认>10分钟触发通知，>20分钟SMS备用）（评审报告业务逻辑不合理#4） |
| 5 | 修正 (Modify) | F-USER-003 | ABAC规则：由概念性描述升级为Open Policy Agent (OPA)规则引擎实现（评审报告权限设计缺陷#1） |
| 6 | 修正 (Modify) | F-USER-007 | 权限审批：所有敏感权限变更须二次认证（短信OTP或硬件Token）（评审报告权限设计缺陷#2） |
| 7 | 修正 (Modify) | F-EXAM-004 | 成绩撤回：撤回后自动触发审计告警推送给校务主任（评审报告业务逻辑不合理#3） |

**三、语言支持修正（1项）：**

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 修正 (Modify) | F-I18N-001 | 新增粤语口语界面(zh-HK-Cantonese)：家长/学生门户支持粤语口语语气（用户模拟反馈D-08） |

**四、模块与函数统计更新：**

| 指标 | v1.5.0 | v1.6.0 | 变化 |
|------|--------|--------|------|
| 功能函数总数 | 49 | **55** | +6 |
| 模块总数 | 8 | **9** | +1（新增Module 9）|
| P0功能数 | 约35 | **36** | +1（F-NEW-001）|

**五、附录更新：**

- 新增 Module 9（第十部分）：新增功能规格（F-NEW-001 至 F-NEW-006）
- 新增 Module 10（第十一部分）：长期规划功能清单（v1.6+）
- 更新跨模块总结表：功能总数49→55，模块8→9
- 更新模块依赖关系图：新增 MOD-NEW-001 依赖关系

**文档更新：**
- SPEC-COMPLETE.md 版本：v1.5.0 → **v1.6.0**
- archive/SPEC-SCHOOL-ADMIN-v1.5.0.md 已归档

---

### v1.5.0 — 2026-06-05 | 用户模拟反馈整合

**变更类型：** Minor
**变更者：** 系统架构团队
**参考文档：** `USER-SIMULATION-FEEDBACK.md` v1.0.0（48条反馈，2026-06-05审阅）

**新增/增强内容：**

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 增强 (Enhance) | F-USER-003 | 新增「敏感字段界面展示策略」：身份证号/电话/地址脱敏规则，默认A123456(X)格式，点击需二次确认；新增「家校通讯功能」：教师-家长系统内消息通道 |
| 2 | 增强 (Enhance) | F-USER-005 | 新增「家长通话记录规范」：必填字段（通话时长、下次跟进日期、家长情绪）；新增「敏感字段查看审计」类型 |
| 3 | 增强 (Enhance) | F-USER-007 | 新增权限审批「证明文件」要求：5类敏感权限操作均须上传支持文档（PDF/JPG/PNG，≤10MB）|
| 4 | 增强 (Enhance) | F-USER-001 | 新增家长首次注册强制设置「家长密码」规则，用于多子女账号关联验证 |
| 5 | 增强 (Enhance) | F-USER-006 | 新增家长密码（独立于登录密码）支持短信OTP找回 |
| 6 | 增强 (Enhance) | F-DASH-001 | 新增仪表板自定义功能：组件显示/隐藏、拖拽排序、紧急程度筛选 |
| 7 | 增强 (Enhance) | F-ATT-001 | 新增数据源独立状态展示（不合并为"部分成功"）；新增「受影响学生智能列表」；新增批量录入「确认预览页」+「5分钟内批量撤销」 |
| 8 | 增强 (Enhance) | F-INQ-001 | 新增通话时长、家长满意度等可选字段（电话渠道）|
| 9 | 增强 (Enhance) | F-LUNCH-001 | 新增家长自助午膳变更功能（微信门户）；新增更改截止时间规则（默认14:00）；新增截止前1小时提醒通知 |
| 10 | 增强 (Enhance) | F-BUS-001 | 新增「乘搭学生列表」+ 一键通知；新增延误通知「意外类型」标签；新增下一站预计到达时间 |
| 11 | 增强 (Enhance) | F-LEAVE-001 | 新增代课老师推荐显示当日已有课时数；新增跟进提醒设置；新增OCR进度提示；新增请假申请「审批进度状态条」 |
| 12 | 增强 (Enhance) | F-FEE-001 | 新增电子收据自动推送（App/邮件）；新增缴费延迟提示（显示「预计5分钟内更新」+上次缴费时间）|
| 13 | 增强 (Enhance) | F-FIN-001 | 新增欠费 sub_status 枚举（installment_plan / overdue / disputed）|
| 14 | 增强 (Enhance) | F-FIN-002 | 新增OCR金额视觉区分（黄色高亮 + 粗体红色复核提示 + 收据侧栏缩略图）；新增双人见证实时任务推送（见证人1完成自动通知见证人2）|
| 15 | 增强 (Enhance) | F-EXAM-004 | 新增教师成绩提交后48小时内可自行撤回修改；新增家长成绩单PDF导出；新增班级成绩分布柱状图 |
| 16 | 增强 (Enhance) | F-ADM-002 | 新增推荐信AI字数统计（建议300-500字）+ AI写作大纲建议 |
| 17 | 增强 (Enhance) | F-AUTO-002 | 新增消息送达回执机制；新增高优先级通知短信备用渠道；新增Token健康检查（每24小时）|

**合规更新：**
- PDPO合规：敏感字段脱敏策略（身份证号、电话、地址）已纳入RBAC+界面展示双重保护
- 财务合规：双人见证流程增加实时协同推送，避免操作不同步
- 审计合规：家长通话记录规范化、通话时长必填

**文档更新：**
- SPEC-COMPLETE.md 版本：v1.4.0 → v1.5.0
- USER-SIMULATION-FEEDBACK.md 版本：v1.0.0 → v1.0.0（已审阅）

---

### v1.3.0 — 2026-05-25 | 多语言支持系统添加

**变更类型：** Minor
**变更者：** 系统架构团队

**新增内容：**

- **Module 8: 多语言支持系统 (MOD-I18N-001)**
  - F-I18N-001: 多语言框架与翻译管理（P0）
    - 统一 i18n 框架，支持 zh-HK / zh-CN / en 三种语言
    - 翻译资源文件结构、翻译键注册表、术语表
  - F-I18N-002: 语言检测与自动切换（P0）
    - 5 级语言检测优先级（用户偏好 → URL参数 → 浏览器语言 → IP地理 → 默认）
  - F-I18N-003: 实时内容翻译 LLM（P1）
    - 基于 Coze/OpenAI 的上下文感知翻译，术语表集成，24h 缓存
  - F-I18N-004: 区域化与格式本地化（P1）
    - 日期/货币/数字格式本地化，香港/内地/英文格式标准

**依赖更新：**
- 新增 MOD-I18N-001 → 所有业务模块（横向依赖）
- 更新模块依赖图

**文档更新：**
- 功能函数总数：45 → 49
- 涵盖模块：7 → 8

---

### v1.4.0 — 2026-06-03 | 数据库架构设计与数据字典

**变更类型：** Minor
**变更者：** 系统架构团队

**新增内容：**

- **数据库架构设计文档 (DB-SCHEMA.md)**
  - 设计原则：3NF规范化、Audit First、Soft Delete、多租户、UUID主键、JSONB扩展
  - 命名规范：表/字段/索引/约束命名规则
  - ER实体关系图：7大模块60+表关系总览
  - 表结构定义：
    - 核心管理表 (3表)：schools, departments, academic_years
    - 用户权限表 (11表)：users, user_roles, permissions, sessions, audit_logs等
    - 学生班级表 (8表)：students, classes, teachers, parents等
    - 每日操作表 (12表)：attendance_records, lunch_orders, bus_tracking等
    - 周期性校务表 (4表)：enrollment_records, textbooks, exam_registrations等
    - 财务资产表 (12表)：fee_assessments, petty_cash, assets, vendors等
    - 系统表 (7表)：reminders, ai_knowledge_base, translations等
  - 索引设计：针对高频查询的索引策略
  - 外键关系：完整的实体关系映射

- **数据字典 (DATA-DICTIONARY.md)**
  - 核心实体数据定义：学校、用户、学生、班级字段详细说明
  - 枚举值规范：user_type, status, fee_type等所有枚举定义
  - 业务规则：格式校验、范围校验、唯一性、引用完整性
  - 数据质量规则：香港身份证格式、邮箱格式、电话格式等
  - 敏感数据处理：加密策略（AES-256）、哈希策略（bcrypt/argon2）
  - 数据保留政策：审计日志7年、学生记录离校后7年、会话30天等

**文档更新：**
- 新增配套文档：DB-SCHEMA.md（~37KB）、DATA-DICTIONARY.md（~10KB）
- SPEC-COMPLETE.md 版本更新：v1.3.0 → v1.4.0

---

### v1.2.0 — 2026-05-24 | 文档版本管理系统添加

**变更类型：** Minor
**变更者：** 系统架构团队

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 新增 (Add) | 文档头部 | 新增「文档版本信息」元数据表：版本号 v1.2.0、文档状态、维护人、审批人 |
| 2 | 新增 (Add) | 文档头部 | 新增「版本修订规则」：SemVer 格式（Major.Minor.Patch）、变更粒度规则、审批要求、分支策略 |
| 3 | 新增 (Add) | 附录 A | 新增「文档版本管理」附录：变更日志总表（A.1）、版本历史详情（A.2）、变更类型说明（A.3）、评审审批记录（A.4）、文件管理规范（A.5）|
| 4 | 新增 (Add) | 附录 A.2 | 新增「版本历史详情」：每个版本附带具体变更序号、类型、位置和描述 |
| 5 | 修正 (Patch) | 整体结构 | Module 4（AI助理）→ Module 7，Module 5（整合合规）→ Module 8；相应章节重新编号 |
| 6 | 修正 (Patch) | 跨模块总结表 | 功能函数总数：38 → 45；模块依赖图中 MOD-USER-001 作为基础依赖层 |

**新增功能函数：** 无（纯文档管理改进）

---

### v1.1.0 — 2026-05-24 | 用户与权限管理系统添加

**变更类型：** Minor
**变更者：** 系统架构团队

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 新增 (Add) | 第六部分（全新章节）| 新增 Module 6 — 用户与权限管理系统（MOD-USER-001，P0），作为所有业务模块的基础依赖层 |
| 2 | 新增 (Add) | Module 6 | F-USER-001 用户生命周期管理：用户注册/停用/角色分配/账户过期/离职自动处理/家长多子女绑定 |
| 3 | 新增 (Add) | Module 6 | F-USER-002 身份认证：密码/SSO/OTP/飞书OAuth/MFA，含登录风险检测与密码策略 |
| 4 | 新增 (Add) | Module 6 | F-USER-003 功能授权（RBAC+ABAC）：6种角色×功能模块权限矩阵、班级/子女/字段级数据范围控制 |
| 5 | 新增 (Add) | Module 6 | F-USER-004 会话与Token管理：Access/Refresh Token、并发会话限制（最多3个）、异地登录告警、空闲超时、Token主动作废 |
| 6 | 新增 (Add) | Module 6 | F-USER-005 审计日志与登录记录：8类登录事件、4类敏感操作、3–7年保留策略、SIEM集成 |
| 7 | 新增 (Add) | Module 6 | F-USER-006 密码与凭证重置：邮箱/短信OTP自助重置（15分钟有效）、管理员代重置（双验证）|
| 8 | 新增 (Add) | Module 6 | F-USER-007 权限变更审批流程：5类高风险权限操作需审批链，含有效期限制 |
| 9 | 更新 (Modify) | 跨模块总结表 | 新增7行功能记录；功能函数总数：38 → 45 |
| 10 | 更新 (Modify) | 模块依赖关系图 | 所有业务模块新增对 MOD-USER-001 的依赖 |

**新增功能函数：**
```
F-USER-001  用户生命周期管理       P0
F-USER-002  身份认证               P0
F-USER-003  功能授权 (RBAC+ABAC)   P0
F-USER-004  会话与Token管理         P0
F-USER-005  审计日志与登录记录      P0
F-USER-006  密码与凭证重置          P0
F-USER-007  权限变更审批流程        P1
```

---

### v1.0.0 — 2026-05-23 | 初始版本发布

**变更类型：** Major
**变更者：** 系统架构团队

| 序号 | 变更类型 | 位置 | 描述 |
|------|----------|------|------|
| 1 | 新增 (Add) | 第一部分 | 需求规格说明书：系统概述、4种用户角色（校务主任/校务处同工/教师/家长学生）、三大工作分类 |
| 2 | 新增 (Add) | 第二部分 | 系统架构设计：三层技术架构（用户界面/AI核心/集成数据）、核心实体关系（ER图）|
| 3 | 新增 (Add) | 第三部分 | Module 1 — 每日晨检仪表板（9个功能）：出勤统计、迟到早退记录、家长查询队列、快速回复模板（40+模板）、午膳订单汇总、校车实时追踪（GPS）、校车点名记录、请假申请处理、每日收费追踪 |
| 4 | 新增 (Add) | 第四部分 | Module 2 — 周期性校务管理（11个功能）：新生注册、AI辅助编班（6因素权重）、课本分发、DSE报考管理、试卷管理（6子流程）、特别考试安排（6类类型）、成绩单生成发布、中一自行分配学位、JUPAS联招管理、档案清理销毁（EDB保存期限）、学年财务结算 |
| 5 | 新增 (Add) | 第五部分 | Module 3 — 财务及资产管理（7个功能）：学费管理（7类费用）、零用现金报销（双人见证）、奖学金津贴申请（4类）、校产条码盘点（10类资产）、场地租借管理（5类场地）、设备保养管理（4类保养）、供应商注册评估（10类）|
| 6 | 新增 (Add) | 第七部分 | Module 4 — AI助理及自动化（5个功能）：NLU意图分类（12类意图树）、FAQ智能匹配（4维评分算法）、周期性任务触发器（YAML配置）、智能提醒系统（4级升级）、OCR文档识别（5类证件，准确率目标）|
| 7 | 新增 (Add) | 第八部分 | Module 5 — 整合及合规（6个功能）：WebSAMS数据同步（4种模式）、eClass API集成（7端点）、PDPO隐私合规检查（P1/P2/P3分类）、双人见证流程（5类触发）、审计日志管理（4类事件）、自动备份管理（4级策略）|
| 8 | 新增 (Add) | 跨模块总结 | 功能总表（38个函数）、模块依赖关系图（5模块依赖链）|

**初始功能函数：**
```
MOD-DAILY-001  [9]  F-ATT-001/002, F-INQ-001/002, F-LUNCH-001,
                   F-BUS-001/002, F-LEAVE-001, F-FEE-001
MOD-CYCL-001   [11] F-ENRL-001/002/003, F-EXAM-001/002/003/004,
                   F-ADM-001/002, F-YREND-001/002
MOD-FIN-001    [7]  F-FIN-001/002/003, F-ASSET-001/002/003, F-VEND-001
MOD-AI-001     [5]  F-AI-001/002/003, F-AUTO-001/002
MOD-INT-001    [6]  F-INT-001/002, F-COMP-001/002/003, F-BACK-001
───────────────────────────────────────────────────────────────────
Total: 38 functions across 5 modules
```

---

## A.3 变更类型说明 (Change Type Definitions)

| 变更类型代码 | 中文名称 | 说明 |
|------------|----------|------|
| `Major` | 重大版本 | 架构性重构、模块级变更，与前一版本不兼容 |
| `Minor` | 次要版本 | 新增功能、模块扩展，向后兼容 |
| `Patch` | 修订版本 | 文档修正、格式调整，不影响功能内容 |
| `Add` | 新增 | 在文档中添加新的内容（函数、模块、章节）|
| `Modify` | 修改 | 对现有内容进行更新、补充或调整 |
| `Delete` | 删除 | 从文档中移除内容（标记为废弃）|
| `Deprecate` | 弃用 | 标记某功能/模块为过时，保留记录但不推荐使用 |

---

## A.4 文档评审与审批记录 (Review & Approval Records)

| 版本 | 评审日期 | 评审人 | 角色 | 评审结果 | 备注 |
|------|----------|--------|------|----------|------|
| v1.6.0 | 2026-06-06 | 系统架构团队 | 系统架构团队 | 依据功能评审报告 REVIEW-FUNC-001 修订 | 新增6项功能/修正7项业务点 |
| v1.5.0 | 2026-06-05 | （待填）| 项目经理 | （待审批）| 用户模拟反馈整合 |
| v1.0.0 | 2026-05-23 | （待填）| 项目经理 | （待审批）| 初始版本提交 |

> **注：** 实际使用时，请将「（待填）/（待审批）」替换为实际评审人姓名及结果。

---

## A.5 文件管理规范 (File Management)

| 规范项 | 说明 |
|--------|------|
| **工作文件** | `SPEC-COMPLETE.md` 始终为最新可用版本（**可编辑**）|
| **归档位置** | `/docs/school-admin-system/archive/`（**只读快照**，禁止直接编辑）|
| **归档命名** | `SPEC-<项目>-v<Major>.<Minor>.<Patch>.md`，如 `SPEC-SCHOOL-ADMIN-v1.2.0.md` |
| **版本快照** | 每次正式发布须将当前文件复制一份至 `archive/`，文件名含完整版本号 |
| **保留策略** | 保留最近 **3 个正式版本**（Major + Minor）；超出移至 `archive/legacy/`；Patch 可覆盖删除；Major **永久保留** |
| **Git 集成** | 工作区受 `.gitignore` 保护，Git Tag 流程待后续集成（如迁移至独立代码仓库）|
| **分支策略** | 长期变更使用 `spec/<功能描述>` 命名分支（如 `spec/user-auth-module`），完成后合并至 `SPEC-COMPLETE.md` |
| **PR 要求** | 跨模块或 Minor 及以上变更须附带 `附录 A.2` 格式的变更说明，评审通过后方可合并 |
| **审阅要求** | Minor 及以上须 1 名评审人；Major 须 2 名评审人 |
| **争议处理** | 同一模块有冲突变更时，以最新 Changelog 记录为准，并通知相关评审人 |
| **发布检查清单** | 每次正式发布前须确认：Changelog 更新 ✓、版本号更新 ✓、快照已存至 archive ✓、审批记录已填 ✓ |

### 操作流程摘要

> 📝 编辑变更  →  更新 `SPEC-COMPLETE.md`
> 📋 记录变更  →  填写 `附录 A.1` + `A.2` + `A.4`
> 💾 归档快照  →  复制为 `archive/SPEC-...-v<X.Y.Z>.md`
> 🔢 更新版本号 →  文档头部 + `A.1` 表头
> ✅ 评审审批   →  `A.4` 填写评审人及结果
> 📢 通知相关方  →  校务主任 / 项目经理

---

**文档结束**
