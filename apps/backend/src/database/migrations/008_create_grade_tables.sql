-- Migration: Fix #143, #144 - Create grade tables with proper foreign keys
-- Execute this SQL against the school_admin database
--
-- This migration creates the three grade-related tables:
-- 1. grade_records - Stores student grade records
-- 2. grade_reviews - Tracks grade review and approval history
-- 3. grade_audit_alerts - Monitors and alerts on grade anomalies
--
-- Fixes:
-- #143: Missing database migration files for grade tables
-- #144: Foreign key constraint configuration errors

BEGIN;

-- 1. Create enum types for grade_records (if not exists)
DO $$ BEGIN
  CREATE TYPE record_status_enum AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create enum types for grade_reviews (if not exists)
DO $$ BEGIN
  CREATE TYPE review_action_enum AS ENUM (
    'submit',
    'approve',
    'reject',
    'revoke',
    'return'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE review_level_enum AS ENUM (
    '1',
    '2',
    '3'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create enum types for grade_audit_alerts (if not exists)
DO $$ BEGIN
  CREATE TYPE alert_type_enum AS ENUM (
    'grade_revoked',
    'unusual_change',
    'deadline_approaching',
    'approval_delay'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: alert_severity and alert_status types already exist in the database
-- They are defined as: alert_severity (info, warning, critical)
--                       alert_status (open, acknowledged, resolved, dismissed)

-- 4. Create grade_records table (if not exists)
CREATE TABLE IF NOT EXISTS grade_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  teacher_id UUID,
  class_id UUID,
  academic_year VARCHAR(20) NOT NULL,
  term VARCHAR(20) NOT NULL,
  exam_name VARCHAR(100) NOT NULL,
  subjects JSONB DEFAULT '[]',
  overall_score DECIMAL(5,2) NOT NULL,
  class_rank INTEGER NOT NULL,
  grade_rank INTEGER NOT NULL,
  conduct_grade VARCHAR(10),
  attendance_rate VARCHAR(10),
  status record_status_enum DEFAULT 'draft',
  approval_level INTEGER DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP,
  approval_comment TEXT,
  submitted_at TIMESTAMP,
  can_revoke_until TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_by UUID,
  revoked_reason TEXT,
  report_batch VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT grade_records_student_id_fkey FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT grade_records_teacher_id_fkey FOREIGN KEY (teacher_id)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT grade_records_class_id_fkey FOREIGN KEY (class_id)
    REFERENCES classes(id) ON DELETE SET NULL,
  CONSTRAINT grade_records_approved_by_fkey FOREIGN KEY (approved_by)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT grade_records_revoked_by_fkey FOREIGN KEY (revoked_by)
    REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Create indexes for grade_records
CREATE INDEX IF NOT EXISTS idx_grade_records_student_id ON grade_records(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_teacher_id ON grade_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_class_id ON grade_records(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_status ON grade_records(status);
CREATE INDEX IF NOT EXISTS idx_grade_records_academic_year ON grade_records(academic_year);
CREATE INDEX IF NOT EXISTS idx_grade_records_term ON grade_records(term);
CREATE INDEX IF NOT EXISTS idx_grade_records_created_at ON grade_records(created_at DESC);

-- 6. Create grade_reviews table (if not exists)
CREATE TABLE IF NOT EXISTS grade_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_record_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  action review_action_enum NOT NULL,
  level review_level_enum NOT NULL,
  comment TEXT,
  previous_data JSONB DEFAULT '{}',
  new_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  CONSTRAINT grade_reviews_grade_record_id_fkey FOREIGN KEY (grade_record_id)
    REFERENCES grade_records(id) ON DELETE CASCADE,
  CONSTRAINT grade_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id)
    REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Create indexes for grade_reviews
CREATE INDEX IF NOT EXISTS idx_grade_reviews_grade_record_id ON grade_reviews(grade_record_id);
CREATE INDEX IF NOT EXISTS idx_grade_reviews_reviewer_id ON grade_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_grade_reviews_action ON grade_reviews(action);
CREATE INDEX IF NOT EXISTS idx_grade_reviews_level ON grade_reviews(level);
CREATE INDEX IF NOT EXISTS idx_grade_reviews_created_at ON grade_reviews(created_at DESC);

-- 8. Create grade_audit_alerts table (if not exists)
CREATE TABLE IF NOT EXISTS grade_audit_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_record_id UUID,
  grade_review_id UUID,
  type alert_type_enum NOT NULL,
  severity alert_severity DEFAULT 'info',
  status alert_status DEFAULT 'open',
  message TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  notified_user_ids JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP,
  acknowledgement_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT grade_audit_alerts_grade_record_id_fkey FOREIGN KEY (grade_record_id)
    REFERENCES grade_records(id) ON DELETE SET NULL,
  CONSTRAINT grade_audit_alerts_grade_review_id_fkey FOREIGN KEY (grade_review_id)
    REFERENCES grade_reviews(id) ON DELETE SET NULL,
  CONSTRAINT grade_audit_alerts_teacher_id_fkey FOREIGN KEY (teacher_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT grade_audit_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by)
    REFERENCES users(id) ON DELETE SET NULL
);

-- 9. Create indexes for grade_audit_alerts
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_grade_record_id ON grade_audit_alerts(grade_record_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_grade_review_id ON grade_audit_alerts(grade_review_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_teacher_id ON grade_audit_alerts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_type ON grade_audit_alerts(type);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_severity ON grade_audit_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_status ON grade_audit_alerts(status);
CREATE INDEX IF NOT EXISTS idx_grade_audit_alerts_created_at ON grade_audit_alerts(created_at DESC);

-- 10. Create trigger to update updated_at timestamp for grade_records
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_grade_records_updated_at ON grade_records;
CREATE TRIGGER update_grade_records_updated_at
  BEFORE UPDATE ON grade_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification queries (run these to verify the migration):
--
-- 1. Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('grade_records', 'grade_reviews', 'grade_audit_alerts');
--
-- 2. Check foreign keys:
-- SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('grade_records', 'grade_reviews', 'grade_audit_alerts')
-- ORDER BY tc.table_name, kcu.column_name;
--
-- 3. Check indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('grade_records', 'grade_reviews', 'grade_audit_alerts') ORDER BY tablename, indexname;
--
-- 4. Test insert (example):
-- INSERT INTO grade_records (student_id, teacher_id, class_id, academic_year, term, exam_name, subjects, overall_score, class_rank, grade_rank, status)
-- VALUES ('student_uuid', 'teacher_uuid', 'class_uuid', '2025-2026', 'Term 1', '期中考试', '[]'::jsonb, 85.00, 1, 5, 'draft') RETURNING id;