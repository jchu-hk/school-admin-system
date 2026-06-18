-- Migration: Issue #98 - Tuition Installment Payment Feature
-- Execute this SQL against the school_admin database

BEGIN;

-- 1. Create enum types
DO $$ BEGIN
  CREATE TYPE installment_plan_status_enum AS ENUM (
    'pending_review',
    'active',
    'completed',
    'cancelled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE installment_schedule_status_enum AS ENUM (
    'pending',
    'paid',
    'overdue',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tuition_payments_sub_status_enum AS ENUM (
    'installment_plan',
    'overdue',
    'disputed',
    'paid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add fields to tuition_payments table
ALTER TABLE tuition_payments
  ADD COLUMN IF NOT EXISTS sub_status tuition_payments_sub_status_enum,
  ADD COLUMN IF NOT EXISTS installment_plan_id UUID,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id);

-- 3. Create installment_plans table
CREATE TABLE IF NOT EXISTS installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tuition_payment_id UUID NOT NULL REFERENCES tuition_payments(id),
  student_id UUID NOT NULL,
  student_name VARCHAR(100),
  parent_id UUID NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  installment_count INTEGER NOT NULL DEFAULT 1 CHECK (installment_count >= 2 AND installment_count <= 12),
  installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'pending_review',
  review_notes TEXT,
  review_by UUID REFERENCES users(id),
  review_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create installment_schedules table
CREATE TABLE IF NOT EXISTS installment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  paid_transaction_id UUID,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create installment_plan_reviews table
CREATE TABLE IF NOT EXISTS installment_plan_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  attachment_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_installment_plans_payment ON installment_plans(tuition_payment_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_student ON installment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_parent ON installment_plans(parent_id);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_due_status ON installment_schedules(due_date, status);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_plan ON installment_schedules(plan_id);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_sub_status ON tuition_payments(sub_status);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_installment_plan ON tuition_payments(installment_plan_id);

COMMIT;
