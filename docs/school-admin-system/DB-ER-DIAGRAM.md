# 数据库 ER 关系图
## Smart School Admin AI System — Entity Relationship Diagram

> 本文档使用 [Mermaid](https://mermaid.js.org/) ER 图语法绘制。推荐使用支持 Mermaid 预览的编辑器（如 VS Code + Mermaid 插件、Typora、Notion、飞书文档等）查看完整图形。

---

## 1. 核心实体关系图 (Core ER Diagram)

```mermaid
erDiagram
    SCHOOL ||--o{ DEPARTMENT : has
    SCHOOL ||--o{ ACADEMIC_YEAR : has
    SCHOOL ||--o{ USER : has
    SCHOOL ||--o{ STUDENT : has
    SCHOOL ||--o{ TEACHER : has
    SCHOOL ||--o{ PARENT : has
    SCHOOL ||--o{ ATTENDANCE_RECORD : records
    SCHOOL ||--o{ LUNCH_ORDER : has
    SCHOOL ||--o{ BUS_TRACKING : tracks
    SCHOOL ||--o{ LEAVE_APPLICATION : records
    SCHOOL ||--o{ FEE_RECORD : has
    SCHOOL ||--o{ ENROLLMENT_RECORD : processes
    SCHOOL ||--o{ FEE_ASSESSMENT : has
    SCHOOL ||--o{ PETTY_CASH : has
    SCHOOL ||--o{ ASSET : manages
    SCHOOL ||--o{ VENDOR : has
    SCHOOL ||--o{ REMINDER : schedules
    SCHOOL ||--o{ AI_KB : contains
    SCHOOL ||--o{ TRANSLATION : contains
    SCHOOL ||--o{ SYSTEM_CONFIG : stores
    SCHOOL ||--o{ AUDIT_LOG : records

    DEPARTMENT ||--o{ USER : employs
    DEPARTMENT ||--o{ TEACHER : employs
    DEPARTMENT ||--o{ CLASS : belongs_to

    USER ||--o{ USER_ROLE_ASSIGNMENT : assigned
    USER ||--o{ AUTH_METHOD : owns
    USER ||--o{ SESSION : creates
    USER ||--o{ AUDIT_LOG : performs
    USER ||--o{ TEACHER : is
    USER ||--o{ PARENT : is

    USER_ROLE }|--o{ USER_ROLE_ASSIGNMENT : assigned_to
    USER_ROLE ||--o{ ROLE_PERMISSION : has
    USER_ROLE ||--o{ PERMISSION : grants

    PERMISSION ||--o{ ROLE_PERMISSION : assigned_to

    ACADEMIC_YEAR ||--o{ CLASS : creates
    ACADEMIC_YEAR ||--o{ STUDENT : enrolls
    ACADEMIC_YEAR ||--o{ LUNCH_ORDER : for
    ACADEMIC_YEAR ||--o{ ATTENDANCE_RECORD : for
    ACADEMIC_YEAR ||--o{ ENROLLMENT_RECORD : for
    ACADEMIC_YEAR ||--o{ FEE_ASSESSMENT : for

    STUDENT ||--o{ ATTENDANCE_RECORD : has
    STUDENT ||--o{ LATE_EARLY_RECORD : has
    STUDENT ||--o{ LEAVE_APPLICATION : applies
    STUDENT ||--o{ LUNCH_ORDER_ITEM : orders
    STUDENT ||--o{ FEE_ASSESSMENT : has
    STUDENT ||--o{ EXAM_REGISTRATION : registers
    STUDENT ||--o{ PARENT_STUDENT_LINK : linked_to
    STUDENT ||--o{ CLASS_ALLOCATION : allocated_to
    STUDENT ||--o{ PARENT_INQUIRY : queried_by
    STUDENT ||--o{ BUS_SUBSCRIPTION : subscribes

    CLASS ||--o{ ATTENDANCE_RECORD : records
    CLASS ||--o{ LATE_EARLY_RECORD : records
    CLASS ||--o{ LUNCH_ORDER : places
    CLASS ||--o{ LEAVE_APPLICATION : contains
    CLASS ||--o{ FEE_RECORD : tracks
    CLASS ||--o{ CLASS_ALLOCATION : contains
    CLASS ||--o{ ENROLLMENT_RECORD : assigned_to
    CLASS }|--o| TEACHER : homeroom

    TEACHER ||--o{ CLASS_TEACHER : assigned
    CLASS ||--o{ CLASS_TEACHER : has

    PARENT ||--o{ PARENT_STUDENT_LINK : links
    PARENT ||--o{ PARENT_INQUIRY : submits

    PARENT_STUDENT_LINK }|--|| STUDENT : links

    LUNCH_ORDER ||--o{ LUNCH_ORDER_ITEM : contains

    BUS_TRACKING ||--o{ BUS_STOP_RECORD : has

    PARENT_INQUIRY ||--o{ INQUIRY_REPLY : replied_by
    INQUIRY_REPLY }|--|| USER : authored_by

    USER_ROLE_ASSIGNMENT {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        uuid school_id FK
        timestamp assigned_at
        timestamp expires_at
    }

    USER {
        uuid id PK
        uuid school_id FK
        varchar user_type
        varchar user_code UK
        varchar name_zh
        varchar email
        boolean is_active
        timestamp deleted_at
        timestamp created_at
    }

    USER_ROLE {
        uuid id PK
        uuid school_id FK
        varchar code UK
        varchar name
        boolean is_system
    }

    PERMISSION {
        uuid id PK
        varchar module
        varchar code UK
        varchar name_zh
        varchar action
    }

    SCHOOL {
        uuid id PK
        varchar school_code UK
        varchar name_zh
        varchar edb_school_code
        boolean is_active
        jsonb settings
        timestamp created_at
    }

    DEPARTMENT {
        uuid id PK
        uuid school_id FK
        varchar name_zh
        uuid parent_id FK
        boolean is_academic
    }

    ACADEMIC_YEAR {
        uuid id PK
        uuid school_id FK
        varchar year_code UK
        date start_date
        date end_date
        varchar status
        timestamp created_at
    }

    STUDENT {
        uuid id PK
        uuid school_id FK
        varchar student_id UK
        varchar name_zh
        date date_of_birth
        varchar gender
        boolean is_sen
        jsonb sen_details
        boolean is_active
        timestamp created_at
    }

    CLASS {
        uuid id PK
        uuid school_id FK
        uuid academic_year_id FK
        varchar class_code UK
        varchar grade
        int max_capacity
        int current_enrollment
        boolean is_active
        timestamp created_at
    }

    CLASS_ALLOCATION {
        uuid id PK
        uuid student_id FK
        uuid class_id FK
        uuid academic_year_id FK
        varchar allocation_id
        jsonb allocation_factors
        boolean is_primary
        timestamp enrolled_at
    }

    TEACHER {
        uuid id PK
        uuid user_id FK
        uuid school_id FK
        varchar teacher_id UK
        jsonb subjects
        boolean is_active
    }

    CLASS_TEACHER {
        uuid id PK
        uuid class_id FK
        uuid teacher_id FK
        varchar role
        date effective_from
        boolean is_active
    }

    PARENT {
        uuid id PK
        uuid user_id FK
        uuid school_id FK
        varchar parent_id UK
        varchar name_zh
        varchar relation
        boolean is_primary_contact
    }

    PARENT_STUDENT_LINK {
        uuid id PK
        uuid parent_id FK
        uuid student_id FK
        varchar link_type
        boolean is_active
        timestamp verified_at
    }

    ATTENDANCE_RECORD {
        uuid id PK
        uuid student_id FK
        uuid class_id FK
        date date
        varchar status
        varchar source
        int consecutive_days
        boolean alert_triggered
        varchar alert_level
        timestamp created_at
    }

    LATE_EARLY_RECORD {
        uuid id PK
        uuid student_id FK
        uuid class_id FK
        date date
        varchar type
        timestamp recorded_time
        int duration_minutes
        boolean pattern_triggered
        boolean parent_notified
        timestamp created_at
    }

    LUNCH_ORDER {
        uuid id PK
        uuid class_id FK
        uuid academic_year_id FK
        date date UK
        int total_orders
        decimal total_amount
        varchar status
        timestamp created_at
    }

    LUNCH_ORDER_ITEM {
        uuid id PK
        uuid lunch_order_id FK
        uuid student_id FK
        varchar menu_item
        int quantity
        decimal total_price
        varchar status
    }

    BUS_TRACKING {
        uuid id PK
        uuid school_id FK
        varchar bus_id
        date date
        varchar trip_type
        timestamp actual_departure
        timestamp actual_arrival
        varchar status
        int delay_minutes
        timestamp last_updated_at
    }

    BUS_STOP_RECORD {
        uuid id PK
        uuid bus_tracking_id FK
        varchar stop_name
        int stop_order UK
        timestamp actual_time
        int passengers_on
        boolean is_completed
    }

    BUS_SUBSCRIPTION {
        uuid id PK
        uuid student_id FK
        varchar bus_route_id
        varchar subscription_type
        varchar pickup_stop
        date effective_from
        boolean is_active
    }

    LEAVE_APPLICATION {
        uuid id PK
        uuid student_id FK
        uuid class_id FK
        varchar application_no UK
        varchar leave_type
        date start_date
        date end_date
        decimal total_days
        varchar status
        uuid reviewed_by FK
        timestamp created_at
    }

    FEE_RECORD {
        uuid id PK
        uuid class_id FK
        varchar record_no UK
        varchar fee_type
        date date
        decimal total_collected
        varchar status
        timestamp created_at
    }

    PARENT_INQUIRY {
        uuid id PK
        uuid parent_id FK
        uuid student_id FK
        varchar inquiry_no UK
        varchar category
        text content
        varchar priority
        varchar status
        uuid assigned_to FK
        timestamp created_at
    }

    INQUIRY_REPLY {
        uuid id PK
        uuid inquiry_id FK
        uuid author_id FK
        varchar author_type
        text content
        boolean is_ai_generated
        boolean parent_viewed
        timestamp created_at
    }

    ENROLLMENT_RECORD {
        uuid id PK
        uuid school_id FK
        uuid academic_year_id FK
        varchar application_no UK
        varchar student_name_zh
        date date_of_birth
        varchar enrollment_type
        varchar status
        boolean websams_synced
        timestamp created_at
    }

    TEXTBOOK {
        uuid id PK
        uuid school_id FK
        uuid academic_year_id FK
        varchar isbn
        varchar title_zh
        varchar subject
        varchar grade
        decimal price
        boolean is_active
    }

    EXAM_REGISTRATION {
        uuid id PK
        uuid student_id FK
        uuid academic_year_id FK
        varchar exam_type UK
        int exam_year
        jsonb subjects_registered
        varchar registration_status
        boolean fees_paid
        timestamp created_at
    }

    FEE_ASSESSMENT {
        uuid id PK
        uuid student_id FK
        uuid academic_year_id FK
        varchar assessment_no UK
        varchar subsidy_eligibility
        decimal total_annual
        decimal total_paid
        decimal total_outstanding
        varchar status
        timestamp created_at
    }

    FEE_ITEM {
        uuid id PK
        uuid fee_assessment_id FK
        varchar fee_type
        decimal annual_amount
        decimal edb_subsidy
        decimal net_payable
        varchar status
    }

    PETTY_CASH_TRANSACTION {
        uuid id PK
        uuid school_id FK
        varchar transaction_no UK
        varchar transaction_type
        decimal amount
        varchar payee
        text description
        varchar category
        boolean dual_authorized
        decimal float_balance_after
        uuid created_by FK
        timestamp created_at
    }

    ASSET {
        uuid id PK
        uuid school_id FK
        varchar asset_code UK
        varchar name_zh
        varchar category
        varchar location
        date purchase_date
        decimal purchase_price
        varchar status
        uuid responsible_person_id FK
        timestamp created_at
    }

    ASSET_BARCODE {
        uuid id PK
        uuid asset_id FK
        varchar barcode UK
        varchar barcode_type
        timestamp generated_at
        boolean is_active
    }

    VENDOR {
        uuid id PK
        uuid school_id FK
        varchar vendor_code UK
        varchar name_zh
        varchar business_registration
        varchar phone
        varchar status
        timestamp created_at
    }

    REMINDER {
        uuid id PK
        uuid school_id FK
        varchar reminder_type
        varchar title
        date due_date
        varchar priority
        uuid assigned_to FK
        varchar status
        uuid created_by FK
        timestamp created_at
    }

    AI_KNOWLEDGE_BASE {
        uuid id PK
        uuid school_id FK
        text question_zh
        text answer_zh
        varchar category
        jsonb keywords
        int hit_count
        boolean is_active
        uuid created_by FK
        timestamp created_at
    }

    TRANSLATION {
        uuid id PK
        uuid school_id FK
        varchar key UK
        varchar module
        text zh_hk
        text zh_cn
        text en
        varchar source
        boolean is_verified
        timestamp created_at
    }

    SYSTEM_CONFIG {
        uuid id PK
        uuid school_id FK
        varchar config_key UK
        jsonb config_value
        text description
        uuid updated_by FK
        timestamp created_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid school_id FK
        uuid user_id FK
        uuid session_id FK
        varchar action
        varchar resource_type
        uuid resource_id
        jsonb changes
        varchar status
        timestamp created_at
    }

    SESSION {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        varchar ip_address
        boolean mfa_verified
        timestamp started_at
        timestamp last_activity_at
        timestamp expires_at
        varchar termination_reason
    }

    AUTH_METHOD {
        uuid id PK
        uuid user_id FK
        varchar method_type
        varchar identifier
        boolean is_primary
        boolean is_verified
        boolean is_active
        timestamp created_at
    }
