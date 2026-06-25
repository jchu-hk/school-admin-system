-- Migration: Add grades tables for Issue #141
-- Grade management module tables

-- Create enum types
DO $$ BEGIN
    CREATE TYPE grade_type AS ENUM ('quiz', 'exam', 'assignment', 'project');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE grade_scale AS ENUM ('A', 'B', 'C', 'D', 'F');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grades table (individual subject grades)
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID NOT NULL,
    term VARCHAR(20) NOT NULL,
    type grade_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2),
    grade grade_scale,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE
);

-- Grade records table (complete student report cards)
CREATE TABLE IF NOT EXISTS grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    term VARCHAR(20) NOT NULL,
    exam_name VARCHAR(200) NOT NULL,
    subjects JSONB DEFAULT '[]',
    overall_score DECIMAL(5,2) NOT NULL,
    class_rank INTEGER NOT NULL DEFAULT 0,
    grade_rank INTEGER NOT NULL DEFAULT 0,
    conduct_grade VARCHAR(10),
    attendance_rate VARCHAR(20),
    status record_status DEFAULT 'draft',
    approval_level INTEGER DEFAULT 0,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    can_revoke_until TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revoked_reason TEXT,
    report_batch VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grade reviews table
CREATE TABLE IF NOT EXISTS grade_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_record_id UUID REFERENCES grade_records(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    review_type VARCHAR(50) NOT NULL,
    review_comment TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grade audit alerts table
CREATE TABLE IF NOT EXISTS grade_audit_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL,
    severity alert_severity DEFAULT 'info',
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status alert_status DEFAULT 'open',
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_term ON grades(term);
CREATE INDEX IF NOT EXISTS idx_grade_records_student ON grade_records(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_teacher ON grade_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_class ON grade_records(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_academic_year ON grade_records(academic_year);
CREATE INDEX IF NOT EXISTS idx_grade_records_status ON grade_records(status);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_status ON grade_audit_alerts(status);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_severity ON grade_audit_alerts(severity);
