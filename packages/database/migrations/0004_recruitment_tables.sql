-- Migration: recruitment module tables
-- Module 14 - Teacher Recruitment Management (F-RECRUIT-001 to F-RECRUIT-005)

BEGIN;

-- ============================================================
-- recruitment_positions: Job position management
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT')),
    salary_min DECIMAL(10,2) NOT NULL,
    salary_max DECIMAL(10,2) NOT NULL,
    salary_currency VARCHAR(3) DEFAULT 'HKD',
    location VARCHAR(200),
    requirements JSONB DEFAULT '[]',
    responsibilities JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    application_deadline DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED')),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruitment_positions_school ON recruitment_positions(school_id);
CREATE INDEX idx_recruitment_positions_status ON recruitment_positions(status);
CREATE INDEX idx_recruitment_positions_deadline ON recruitment_positions(application_deadline);

-- ============================================================
-- recruitment_applications: Applicant CV collection & screening
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES recruitment_positions(id) NOT NULL,
    applicant_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    cv_url VARCHAR(500),
    cover_letter TEXT,
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'OFFER')),
    screening_notes TEXT,
    screened_by UUID REFERENCES users(id),
    screened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruitment_applications_position ON recruitment_applications(position_id);
CREATE INDEX idx_recruitment_applications_status ON recruitment_applications(status);

-- ============================================================
-- recruitment_interviews: Interview scheduling & evaluation
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES recruitment_applications(id) NOT NULL,
    interview_date TIMESTAMPTZ NOT NULL,
    interviewers UUID[] DEFAULT '{}',
    interview_type VARCHAR(20) NOT NULL CHECK (interview_type IN ('ONLINE', 'ONSITE')),
    meeting_link VARCHAR(500),
    location VARCHAR(200),
    duration_minutes INT DEFAULT 60,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruitment_interviews_application ON recruitment_interviews(application_id);
CREATE INDEX idx_recruitment_interviews_date ON recruitment_interviews(interview_date);

-- ============================================================
-- recruitment_interview_scores: Interview evaluation scores
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_interview_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES recruitment_interviews(id) NOT NULL,
    interviewer_id UUID REFERENCES users(id) NOT NULL,
    criterion VARCHAR(100) NOT NULL,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruitment_interview_scores_interview ON recruitment_interview_scores(interview_id);

-- ============================================================
-- recruitment_offers: Offer & approval workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES recruitment_applications(id) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    position VARCHAR(200) NOT NULL,
    benefits_package JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'SIGNED')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    signed_document_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruitment_offers_application ON recruitment_offers(application_id);
CREATE INDEX idx_recruitment_offers_status ON recruitment_offers(status);

-- ============================================================
-- recruitment_onboarding: Onboarding checklist & account setup
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES recruitment_offers(id) NOT NULL,
    teacher_profile_id UUID REFERENCES users(id),
    checklist JSONB DEFAULT '[]',
    system_account_created BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'TEACHER',
    default_permissions JSONB DEFAULT '[]',
    onboarding_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (onboarding_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruitment_onboarding_offer ON recruitment_onboarding(offer_id);
CREATE INDEX idx_recruitment_onboarding_status ON recruitment_onboarding(onboarding_status);

COMMIT;
