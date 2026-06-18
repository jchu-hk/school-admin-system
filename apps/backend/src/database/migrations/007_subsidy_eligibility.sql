-- Migration: Issue #101 - Student Subsidy Eligibility Fields
-- Execute this SQL against the school_admin database

BEGIN;

-- 1. Create enum type for subsidy eligibility
DO $$ BEGIN
  CREATE TYPE subsidy_eligibility_enum AS ENUM (
    'full_subsidy',
    'half_subsidy',
    'none',
    'pending'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add subsidy eligibility fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subsidy_eligibility subsidy_eligibility_enum DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subsidy_start_date DATE,
  ADD COLUMN IF NOT EXISTS subsidy_end_date DATE,
  ADD COLUMN IF NOT EXISTS subsidy_certificate_no VARCHAR(50);

-- 3. Create index for faster subsidy queries
CREATE INDEX IF NOT EXISTS idx_users_subsidy_eligibility ON users(subsidy_eligibility);

COMMIT;
