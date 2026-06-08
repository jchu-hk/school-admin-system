-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Core Management Tables
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_code VARCHAR(20) UNIQUE NOT NULL,
    name_zh VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    address TEXT,
    phone VARCHAR(20),
    fax VARCHAR(20),
    edb_school_code VARCHAR(20),
    websams_org_unit VARCHAR(100),
    academic_year_start DATE,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    code VARCHAR(20),
    parent_id UUID REFERENCES departments(id),
    is_academic BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, code)
);

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    year_code VARCHAR(9) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    term1_start DATE,
    term1_end DATE,
    term2_start DATE,
    term2_end DATE,
    term3_start DATE,
    term3_end DATE,
    status VARCHAR(20) DEFAULT 'planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, year_code)
);

-- 2. Users & Access Control Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    user_code VARCHAR(50) UNIQUE NOT NULL,
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    hkid VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(1),
    nationality VARCHAR(50),
    address TEXT,
    department_id UUID REFERENCES departments(id),
    employment_type VARCHAR(20),
    account_expiry_date DATE,
    profile_photo_url VARCHAR(500),
    language_preference VARCHAR(10) DEFAULT 'zh-HK',
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_users_school_type ON users(school_id, user_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_code ON users(user_code);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(30) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, code)
);

CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    role_id UUID REFERENCES user_roles(id) NOT NULL,
    school_id UUID REFERENCES schools(id) NOT NULL,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    reason VARCHAR(255),
    UNIQUE(user_id, role_id)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    resource_type VARCHAR(50),
    action VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module, code)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES user_roles(id) NOT NULL,
    permission_id UUID REFERENCES permissions(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE TABLE auth_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    method_type VARCHAR(20) NOT NULL,
    identifier VARCHAR(255),
    credential_hash TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    school_id UUID REFERENCES schools(id) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    auth_method VARCHAR(20),
    mfa_verified BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    terminated_at TIMESTAMPTZ,
    termination_reason VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success',
    failure_reason VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_school_time ON audit_logs(school_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);

-- 3. Students & Classes Tables
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    hkid VARCHAR(20),
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(1) NOT NULL,
    nationality VARCHAR(50),
    home_address TEXT,
    birth_country VARCHAR(50),
    birth_place VARCHAR(50),
    ethnicity VARCHAR(50),
    religion VARCHAR(50),
    language_home VARCHAR(50),
    photo_url VARCHAR(500),
    enrollment_date DATE,
    graduation_date DATE,
    academic_year_id UUID REFERENCES academic_years(id),
    is_sen BOOLEAN DEFAULT false,
    sen_type VARCHAR(50),
    sen_details JSONB,
    medical_conditions JSONB,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_academic_year ON students(school_id, academic_year_id);
CREATE INDEX idx_students_sen ON students(school_id, is_sen);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    class_code VARCHAR(10) NOT NULL,
    grade VARCHAR(3) NOT NULL,
    class_name_zh VARCHAR(50),
    class_name_en VARCHAR(50),
    class_type VARCHAR(20) DEFAULT 'regular',
    max_capacity INT DEFAULT 40,
    current_enrollment INT DEFAULT 0,
    homeroom_teacher_id UUID,
    assistant_teacher_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, academic_year_id, class_code)
);

CREATE TABLE class_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    allocation_id VARCHAR(30),
    allocation_factors JSONB,
    balance_score DECIMAL(5,2),
    is_primary BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, class_id, academic_year_id, is_primary)
);

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    school_id UUID REFERENCES schools(id) NOT NULL,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    qualifications JSONB,
    subjects JSONB,
    teaching_years INT,
    is_class_teacher BOOLEAN DEFAULT false,
    employment_start_date DATE,
    employment_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE classes ADD CONSTRAINT fk_classes_homeroom_teacher FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id);
ALTER TABLE classes ADD CONSTRAINT fk_classes_assistant_teacher FOREIGN KEY (assistant_teacher_id) REFERENCES teachers(id);

CREATE TABLE class_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) NOT NULL,
    teacher_id UUID REFERENCES teachers(id) NOT NULL,
    role VARCHAR(20) DEFAULT 'homeroom',
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, teacher_id, role, effective_from)
);

CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    school_id UUID REFERENCES schools(id) NOT NULL,
    parent_id VARCHAR(20) UNIQUE NOT NULL,
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    hkid VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    relation VARCHAR(20),
    occupation VARCHAR(100),
    employer VARCHAR(200),
    is_primary_contact BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES parents(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    school_id UUID REFERENCES schools(id) NOT NULL,
    link_type VARCHAR(20) DEFAULT 'parent',
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_id, student_id, link_type)
);

-- 4. Daily Operations Tables
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    source VARCHAR(20),
    source_id VARCHAR(100),
    excused_reason VARCHAR(100),
    excused_detail TEXT,
    excused_document_url VARCHAR(500),
    parent_notified BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMPTZ,
    consecutive_days INT DEFAULT 0,
    alert_triggered BOOLEAN DEFAULT false,
    alert_level VARCHAR(20),
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE INDEX idx_attendance_school_date ON attendance_records(school_id, date DESC);
CREATE INDEX idx_attendance_class_date ON attendance_records(class_id, date DESC);

CREATE TABLE late_early_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    recorded_time TIMESTAMPTZ NOT NULL,
    threshold_time TIME NOT NULL,
    duration_minutes INT,
    reason_category VARCHAR(50),
    reason_detail TEXT,
    parent_notified BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMPTZ,
    pattern_triggered BOOLEAN DEFAULT false,
    pattern_description VARCHAR(100),
    counselor_notified BOOLEAN DEFAULT false,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date, type)
);

CREATE INDEX idx_late_early_student ON late_early_records(student_id, date DESC);

CREATE TABLE lunch_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    date DATE NOT NULL,
    total_orders INT DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ,
    supplier VARCHAR(100),
    delivery_time TIME,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, date)
);

CREATE INDEX idx_lunch_date ON lunch_orders(school_id, date DESC);

CREATE TABLE lunch_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lunch_order_id UUID REFERENCES lunch_orders(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    menu_item VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(8,2),
    dietary_restrictions VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ordered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lunch_order_id, student_id)
);

CREATE TABLE bus_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    bus_id VARCHAR(20) NOT NULL,
    bus_plate VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    route_name VARCHAR(50),
    date DATE NOT NULL,
    trip_type VARCHAR(10),
    scheduled_departure TIME,
    actual_departure TIMESTAMPTZ,
    scheduled_arrival TIME,
    actual_arrival TIMESTAMPTZ,
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    current_location VARCHAR(200),
    status VARCHAR(20),
    delay_minutes INT DEFAULT 0,
    delay_reason TEXT,
    last_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bus_date ON bus_tracking(school_id, date DESC, trip_type);

CREATE TABLE bus_stop_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_tracking_id UUID REFERENCES bus_tracking(id) NOT NULL,
    stop_name VARCHAR(100) NOT NULL,
    stop_order INT NOT NULL,
    scheduled_time TIME,
    actual_time TIMESTAMPTZ,
    passengers_on INT DEFAULT 0,
    passengers_off INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bus_tracking_id, stop_order)
);

CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    application_no VARCHAR(20) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1),
    reason TEXT,
    document_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    parent_submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    reviewed_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leave_student ON leave_applications(student_id, start_date DESC);
CREATE INDEX idx_leave_status ON leave_applications(school_id, status);

CREATE TABLE fee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    record_no VARCHAR(20) UNIQUE NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    fee_type VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(200),
    total_students INT,
    total_collected DECIMAL(12,2) DEFAULT 0,
    total_outstanding DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_date ON fee_records(school_id, date DESC);

CREATE TABLE parent_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    inquiry_no VARCHAR(20) UNIQUE NOT NULL,
    parent_id UUID REFERENCES parents(id) NOT NULL,
    student_id UUID REFERENCES students(id),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    parent_submitted_at TIMESTAMPTZ NOT NULL,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    satisfaction_rating INT,
    satisfaction_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiry_status ON parent_inquiries(school_id, status);
CREATE INDEX idx_inquiry_parent ON parent_inquiries(parent_id, created_at DESC);

CREATE TABLE inquiry_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID REFERENCES parent_inquiries(id) NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    author_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT false,
    parent_viewed BOOLEAN DEFAULT false,
    parent_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiry_reply_inquiry ON inquiry_replies(inquiry_id, created_at ASC);

CREATE TABLE quick_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cyclical Operations Tables
CREATE TABLE enrollment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    application_no VARCHAR(20) UNIQUE NOT NULL,
    student_name_zh VARCHAR(100) NOT NULL,
    student_name_en VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(1) NOT NULL,
    school_of_origin VARCHAR(200),
    parent_name VARCHAR(100) NOT NULL,
    parent_id VARCHAR(20) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    special_education_needs BOOLEAN DEFAULT false,
    enrollment_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted',
    class_assigned_id UUID REFERENCES classes(id),
    assigned_at TIMESTAMPTZ,
    remarks TEXT,
    websams_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE textbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    isbn VARCHAR(20),
    title_zh VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    subject VARCHAR(50) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    publisher VARCHAR(100),
    price DECIMAL(8,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exam_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    exam_type VARCHAR(30) NOT NULL,
    exam_year INT NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    subjects_registered JSONB NOT NULL,
    special_arrangements JSONB,
    registration_status VARCHAR(20) DEFAULT 'draft',
    fees_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, exam_type, exam_year)
);

-- 6. Finance & Assets Tables
CREATE TABLE fee_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    assessment_no VARCHAR(20) UNIQUE NOT NULL,
    subsidy_eligibility VARCHAR(20),
    total_annual DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    total_outstanding DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fee_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_assessment_id UUID REFERENCES fee_assessments(id) NOT NULL,
    fee_type VARCHAR(20) NOT NULL,
    annual_amount DECIMAL(10,2) DEFAULT 0,
    edb_subsidy DECIMAL(10,2) DEFAULT 0,
    net_payable DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE petty_cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    transaction_no VARCHAR(20) UNIQUE NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payee VARCHAR(200),
    description TEXT NOT NULL,
    category VARCHAR(50),
    receipt_url VARCHAR(500),
    dual_authorized BOOLEAN DEFAULT false,
    float_balance_after DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    vendor_code VARCHAR(20) UNIQUE NOT NULL,
    name_zh VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    business_registration VARCHAR(50),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    service_categories JSONB,
    bank_account VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    asset_code VARCHAR(30) UNIQUE NOT NULL,
    name_zh VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    supplier_id UUID REFERENCES vendors(id),
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'active',
    responsible_person_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    barcode_type VARCHAR(20) DEFAULT 'QR',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    printed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. System Tables
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    reminder_type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    due_date DATE NOT NULL,
    due_time TIME,
    priority VARCHAR(10) DEFAULT 'normal',
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    question_zh TEXT NOT NULL,
    question_en TEXT,
    answer_zh TEXT NOT NULL,
    answer_en TEXT,
    category VARCHAR(50) NOT NULL,
    keywords JSONB,
    hit_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    key VARCHAR(200) NOT NULL,
    module VARCHAR(50) NOT NULL,
    zh_hk TEXT,
    zh_cn TEXT,
    en TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, key)
);

CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, config_key)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t.table_name, t.table_name);
    END LOOP;
END $$;
