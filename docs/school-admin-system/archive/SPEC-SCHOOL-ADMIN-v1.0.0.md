# 智能校务助理系统 — 完整功能规格书
## Smart School Admin AI System — Complete Functional Specification

---

### 📋 文档版本信息

| 字段 | 内容 |
|------|------|
| 文档名称 | 智能校务助理系统 — 完整功能规格书 |
| 文档编号 | SPEC-SCHOOL-ADMIN-001 |
| 当前版本 | **v1.2.0** |
| 文档状态 | 已核准 (Approved) |
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

**总计：45个功能函数，涵盖7大模块**

---

## 模块依赖关系

```
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

模块依赖关系说明：
- MOD-USER-001 是所有模块的基础依赖，所有涉及用户身份的操作
  （登录、权限校验、数据归属判断）均依赖本模块
- MOD-AI-001 与 MOD-INT-001 为横向支撑层，被各业务模块调用
```

---


