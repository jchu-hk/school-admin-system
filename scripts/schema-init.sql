--
-- PostgreSQL database dump
--

\restrict 3dRLrjdZVMOO8hRJuCQP6vfQDIoHA9Gzax6ZTcortewueYwGUBrOh82bEIph7sW

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: attendances_attendance_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendances_attendance_type_enum AS ENUM (
    'check_in',
    'check_out',
    'manual'
);


--
-- Name: attendances_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendances_status_enum AS ENUM (
    'present',
    'absent',
    'late',
    'leave_early',
    'sick_leave',
    'personal_leave',
    'official_leave'
);


--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'user_create',
    'user_update',
    'user_delete',
    'user_restore',
    'user_status_change',
    'user_password_reset',
    'permission_change',
    'login',
    'logout',
    'attendance_check_in',
    'attendance_check_out',
    'leave_apply',
    'leave_approve',
    'leave_reject',
    'fee_create',
    'fee_update',
    'inquiry_create',
    'inquiry_reply'
);


--
-- Name: inquiry_priority_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inquiry_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: inquiry_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inquiry_status_enum AS ENUM (
    'pending',
    'in_progress',
    'resolved',
    'escalated',
    'closed'
);


--
-- Name: leaves_leave_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leaves_leave_type_enum AS ENUM (
    'sick_leave',
    'personal_leave',
    'official_leave',
    'annual_leave',
    'other'
);


--
-- Name: leaves_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leaves_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: otp_session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.otp_session_status AS ENUM (
    'active',
    'expired',
    'used'
);


--
-- Name: otp_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.otp_type AS ENUM (
    'sms',
    'email',
    'google_authenticator',
    'ukey'
);


--
-- Name: subsidy_eligibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subsidy_eligibility_enum AS ENUM (
    'full_subsidy',
    'half_subsidy',
    'none',
    'pending'
);


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'admin',
    'staff',
    'teacher',
    'student',
    'parent'
);


--
-- Name: user_role_new; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_new AS ENUM (
    'system_admin',
    'school_director',
    'school_staff',
    'teacher',
    'parent',
    'student'
);


--
-- Name: user_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


--
-- Name: user_status_new; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status_new AS ENUM (
    'active',
    'inactive',
    'disabled'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    teacher_id uuid,
    class_id character varying(100),
    attendance_date date NOT NULL,
    check_in_time time without time zone,
    check_out_time time without time zone,
    status public.attendances_status_enum DEFAULT 'present'::public.attendances_status_enum NOT NULL,
    attendance_type public.attendances_attendance_type_enum DEFAULT 'check_in'::public.attendances_attendance_type_enum NOT NULL,
    remark text,
    approver_id uuid,
    approved_at timestamp with time zone,
    reminder_sent boolean DEFAULT false,
    reminder_sent_at timestamp with time zone,
    created_by character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(100),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    sync_source character varying(50) DEFAULT 'MANUAL'::character varying,
    sync_status character varying(50) DEFAULT 'SUCCESS'::character varying,
    device_id character varying(100),
    device_name character varying(200),
    batch_id uuid,
    can_revoke_until timestamp with time zone
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    operatorid uuid,
    action public.audit_action NOT NULL,
    description text,
    ip character varying(50),
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    academic_year character varying(9),
    grade_level character varying(20),
    homeroom_teacher_id uuid,
    assistant_teacher_id uuid,
    max_students integer DEFAULT 40,
    current_student_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    school_id uuid,
    department_id uuid,
    room character varying(50),
    year character varying(9),
    description text
);


--
-- Name: fee_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    fee_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0,
    payment_date date,
    payment_method character varying(50),
    status character varying(20) DEFAULT 'unpaid'::character varying,
    academic_year character varying(9),
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fee_name character varying(200) NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    due_date date,
    academic_year character varying(9),
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    inquiry_type character varying(50),
    subject character varying(255),
    content text NOT NULL,
    parent_id uuid,
    student_id uuid,
    status public.inquiry_status_enum DEFAULT 'pending'::public.inquiry_status_enum,
    priority public.inquiry_priority_enum DEFAULT 'medium'::public.inquiry_priority_enum,
    assigned_to uuid,
    school_id uuid,
    is_ai_processed boolean DEFAULT false,
    ai_intent character varying(100),
    is_escalated boolean DEFAULT false,
    escalation_reason text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: inquiry_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiry_replies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    inquiry_id uuid NOT NULL,
    content text NOT NULL,
    replier_id uuid,
    is_official_reply boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    applicant_id uuid NOT NULL,
    leave_type public.leaves_leave_type_enum NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    total_days integer NOT NULL,
    total_hours integer,
    reason text NOT NULL,
    status public.leaves_status_enum DEFAULT 'pending'::public.leaves_status_enum,
    substitute_teacher_id uuid,
    substitute_teacher_class_hours integer,
    approver_id uuid,
    approved_at timestamp with time zone,
    approval_comment text,
    attachment_url character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    application_no character varying(20),
    school_id uuid,
    student_id uuid,
    class_id uuid,
    ocr_status character varying(30),
    medical_cert_required boolean DEFAULT false,
    parent_submitted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    director_comment text,
    admin_recorded_by uuid,
    admin_recorded_at timestamp with time zone,
    ai_review_flagged boolean DEFAULT false,
    ai_review_note text,
    ai_verify_result character varying(30),
    certificate_verify_result character varying(30),
    certificate_url text,
    verified_at timestamp with time zone,
    follow_up_date date,
    follow_up_content text,
    checked_in_at timestamp with time zone,
    checked_in_by uuid,
    parent_notified boolean DEFAULT false,
    class_teacher_notified boolean DEFAULT false,
    bus_admin_notified boolean DEFAULT false,
    current_approval_level character varying(30)
);


--
-- Name: lunch_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lunch_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    class_id character varying(100),
    order_date date NOT NULL,
    meal_type character varying(20) DEFAULT 'regular'::character varying,
    menu_item_id uuid,
    notes text,
    status character varying(20) DEFAULT 'confirmed'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    otp_type public.otp_type DEFAULT 'email'::public.otp_type,
    is_enabled boolean DEFAULT false,
    secret character varying(255),
    phone_number character varying(20),
    email character varying(100),
    ukey_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    phone character varying(20),
    email character varying(100),
    code_hash character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    attempts integer DEFAULT 0,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    otp_code character varying(10),
    otp_type public.otp_type,
    status public.otp_session_status DEFAULT 'active'::public.otp_session_status,
    expires_at timestamp with time zone NOT NULL,
    failed_attempts integer DEFAULT 0,
    operation_type character varying(50) NOT NULL,
    operation_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_trusted_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_trusted_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    session_id character varying(100) NOT NULL,
    ip_address character varying(50),
    user_agent character varying(255),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: parent_student_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent_student_links (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_id uuid NOT NULL,
    student_id uuid NOT NULL,
    relationship character varying(50),
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module character varying(50) NOT NULL,
    code character varying(100) NOT NULL,
    name_zh character varying(100) NOT NULL,
    name_en character varying(100),
    description text,
    resource_type character varying(50),
    action character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scholarship_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scholarship_applications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    scholarship_name character varying(200) NOT NULL,
    application_date date NOT NULL,
    amount numeric(10,2),
    status character varying(20) DEFAULT 'pending'::character varying,
    academic_year character varying(9),
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_code character varying(20) NOT NULL,
    name_zh character varying(200) NOT NULL,
    name_en character varying(200),
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token text,
    ip character varying(50),
    user_agent text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: temporary_passwords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temporary_passwords (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    code_hash character varying(255) NOT NULL,
    type character varying(10) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_role_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_role_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid,
    school_id uuid,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name character varying(100),
    failed_attempts integer DEFAULT 0,
    lockout_until timestamp with time zone,
    password_history text[],
    must_change_password boolean DEFAULT false,
    subsidy_eligibility character varying(20) DEFAULT 'none'::character varying,
    subsidy_start_date date,
    subsidy_end_date date,
    related_student_id uuid,
    student_id uuid,
    enrollment_date date,
    graduation_date date,
    previous_school character varying(200),
    home_address text,
    date_of_birth date,
    gender character varying(10),
    emergency_contact character varying(100),
    emergency_phone character varying(20),
    password_expires_at timestamp with time zone,
    last_login timestamp with time zone,
    last_password_change timestamp with time zone,
    is_first_login boolean DEFAULT true,
    role public.user_role_new DEFAULT 'student'::public.user_role_new,
    status public.user_status_new DEFAULT 'active'::public.user_status_new,
    hk_id character varying(20),
    whatsapp character varying(20),
    class_name character varying(50),
    otp_secret character varying(255),
    otp_enabled boolean DEFAULT false,
    last_login_at timestamp with time zone,
    last_login_ip character varying(50),
    created_by uuid,
    updated_by uuid,
    subsidy_certificate_no character varying(50),
    deleted_at timestamp with time zone
);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: fee_records fee_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_records
    ADD CONSTRAINT fee_records_pkey PRIMARY KEY (id);


--
-- Name: fees fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fees_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: inquiry_replies inquiry_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_replies
    ADD CONSTRAINT inquiry_replies_pkey PRIMARY KEY (id);


--
-- Name: leaves leaves_application_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_application_no_key UNIQUE (application_no);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- Name: lunch_orders lunch_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lunch_orders
    ADD CONSTRAINT lunch_orders_pkey PRIMARY KEY (id);


--
-- Name: otp_configs otp_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_configs
    ADD CONSTRAINT otp_configs_pkey PRIMARY KEY (id);


--
-- Name: otp_requests otp_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_requests
    ADD CONSTRAINT otp_requests_pkey PRIMARY KEY (id);


--
-- Name: otp_sessions otp_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_sessions
    ADD CONSTRAINT otp_sessions_pkey PRIMARY KEY (id);


--
-- Name: otp_trusted_sessions otp_trusted_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_trusted_sessions
    ADD CONSTRAINT otp_trusted_sessions_pkey PRIMARY KEY (id);


--
-- Name: parent_student_links parent_student_links_parent_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student_links
    ADD CONSTRAINT parent_student_links_parent_id_student_id_key UNIQUE (parent_id, student_id);


--
-- Name: parent_student_links parent_student_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student_links
    ADD CONSTRAINT parent_student_links_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_module_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_module_code_key UNIQUE (module, code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: scholarship_applications scholarship_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_applications
    ADD CONSTRAINT scholarship_applications_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: schools schools_school_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_school_code_key UNIQUE (school_code);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: temporary_passwords temporary_passwords_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_passwords
    ADD CONSTRAINT temporary_passwords_pkey PRIMARY KEY (id);


--
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id);


--
-- Name: user_role_assignments user_role_assignments_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_hk_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hk_id_key UNIQUE (hk_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_attendances_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendances_date ON public.attendances USING btree (attendance_date);


--
-- Name: idx_attendances_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendances_student ON public.attendances USING btree (student_id);


--
-- Name: idx_fee_records_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_records_student ON public.fee_records USING btree (student_id);


--
-- Name: idx_inquiries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_status ON public.inquiries USING btree (status);


--
-- Name: idx_leaves_applicant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaves_applicant ON public.leaves USING btree (applicant_id);


--
-- Name: idx_leaves_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaves_dates ON public.leaves USING btree (start_date, end_date);


--
-- Name: idx_otp_requests_phone_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_requests_phone_date ON public.otp_requests USING btree (phone, created_at);


--
-- Name: idx_otp_requests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_requests_user ON public.otp_requests USING btree (user_id);


--
-- Name: idx_parent_student_links_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parent_student_links_parent ON public.parent_student_links USING btree (parent_id);


--
-- Name: idx_parent_student_links_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parent_student_links_student ON public.parent_student_links USING btree (student_id);


--
-- Name: idx_temporary_passwords_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temporary_passwords_user ON public.temporary_passwords USING btree (user_id);


--
-- Name: attendances attendances_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: attendances attendances_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: attendances attendances_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);


--
-- Name: fee_records fee_records_fee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_records
    ADD CONSTRAINT fee_records_fee_id_fkey FOREIGN KEY (fee_id) REFERENCES public.fees(id);


--
-- Name: fee_records fee_records_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_records
    ADD CONSTRAINT fee_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: classes fk_assistant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT fk_assistant FOREIGN KEY (assistant_teacher_id) REFERENCES public.users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: classes fk_homeroom; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT fk_homeroom FOREIGN KEY (homeroom_teacher_id) REFERENCES public.users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: inquiries inquiries_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: inquiries inquiries_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id);


--
-- Name: inquiries inquiries_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: inquiry_replies inquiry_replies_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_replies
    ADD CONSTRAINT inquiry_replies_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: inquiry_replies inquiry_replies_replier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_replies
    ADD CONSTRAINT inquiry_replies_replier_id_fkey FOREIGN KEY (replier_id) REFERENCES public.users(id);


--
-- Name: leaves leaves_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id);


--
-- Name: leaves leaves_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: leaves leaves_substitute_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_substitute_teacher_id_fkey FOREIGN KEY (substitute_teacher_id) REFERENCES public.users(id);


--
-- Name: lunch_orders lunch_orders_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lunch_orders
    ADD CONSTRAINT lunch_orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: otp_configs otp_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_configs
    ADD CONSTRAINT otp_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: otp_requests otp_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_requests
    ADD CONSTRAINT otp_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: otp_sessions otp_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_sessions
    ADD CONSTRAINT otp_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: otp_trusted_sessions otp_trusted_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_trusted_sessions
    ADD CONSTRAINT otp_trusted_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parent_student_links parent_student_links_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student_links
    ADD CONSTRAINT parent_student_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id);


--
-- Name: parent_student_links parent_student_links_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student_links
    ADD CONSTRAINT parent_student_links_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: scholarship_applications scholarship_applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_applications
    ADD CONSTRAINT scholarship_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: temporary_passwords temporary_passwords_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_passwords
    ADD CONSTRAINT temporary_passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id);


--
-- Name: user_role_assignments user_role_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3dRLrjdZVMOO8hRJuCQP6vfQDIoHA9Gzax6ZTcortewueYwGUBrOh82bEIph7sW

