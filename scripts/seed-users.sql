-- =====================================================
-- School Admin System v0.3.2 - Test Environment Seed
-- 适用于 Mac mini Docker 部署
-- 执行: docker exec -i school-admin-postgres psql -U school_admin -d school_admin < seed-users.sql
-- =====================================================

-- 清理现有测试数据（谨慎使用）
-- DELETE FROM users WHERE username IN ('admin', 'staff1', 'teacher1', 'parent1', 'student1');

-- =====================================================
-- ⚠️ 密码变更警告: 以下所有 ON CONFLICT DO UPDATE 会覆盖密码！
-- 如果通过 API/UI 修改密码，种子脚本重新运行会重置回 Admin123!
-- 如需修改密码，同步更新 bcrypt hash
-- =====================================================

-- 管理员账号 (system_admin - 需要OTP)
INSERT INTO users (
    id, username, name, email, phone, role, status, password,
    failed_attempts, lockout_until, password_history, must_change_password,
    created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    '系统管理员',
    'admin@school.edu',
    '13800138000',
    'system_admin',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', -- Admin123!
    0, null, '{}', false,
    NOW(), NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    status = 'active',
    failed_attempts = 0,
    lockout_until = null,
    must_change_password = false;

-- 校务人员 (school_staff - 直接登录，无OTP)
INSERT INTO users (
    id, username, name, email, phone, role, status, password,
    failed_attempts, lockout_until, password_history, must_change_password,
    created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'staff1',
    '校务人员',
    'staff1@school.edu',
    '13800138001',
    'school_staff',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', -- Admin123!
    0, null, '{}', false,
    NOW(), NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    status = 'active';

-- 教师 (teacher - 需要OTP)
INSERT INTO users (
    id, username, name, email, phone, role, status, password,
    failed_attempts, lockout_until, password_history, must_change_password,
    created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'teacher1',
    '测试教师',
    'teacher1@school.edu',
    '13800138002',
    'teacher',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    0, null, '{}', false,
    NOW(), NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    status = 'active';

-- 家长 (parent - 直接登录，首次需设置密码)
INSERT INTO users (
    id, username, name, email, phone, role, status, password,
    failed_attempts, lockout_until, password_history, must_change_password,
    created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    'parent1',
    '测试家长',
    'parent1@example.com',
    '13800138003',
    'parent',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    0, null, '{}', true,  -- must_change_password = true
    NOW(), NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    must_change_password = true;

-- 学生 (student - 直接登录，带资助资格)
INSERT INTO users (
    id, username, name, email, phone, role, status, password,
    failed_attempts, lockout_until, password_history, must_change_password,
    subsidy_eligibility, subsidy_start_date, subsidy_end_date, subsidy_certificate_no,
    created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440005',
    'student1',
    '测试学生',
    'student1@school.edu',
    '13800138004',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    0, null, '{}', false,
    'full_subsidy', '2024-09-01', '2025-08-31', 'CERT-2024-001',
    NOW(), NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    subsidy_eligibility = EXCLUDED.subsidy_eligibility;

-- 验证创建结果
SELECT 
    username,
    name,
    role,
    status,
    must_change_password as need_set_pwd,
    subsidy_eligibility,
    COALESCE(failed_attempts, 0) as failed,
    CASE WHEN lockout_until IS NOT NULL THEN 'LOCKED' ELSE 'OK' END as lock_status
FROM users 
WHERE username IN ('admin', 'staff1', 'teacher1', 'parent1', 'student1')
ORDER BY 
    CASE role 
        WHEN 'system_admin' THEN 1
        WHEN 'school_staff' THEN 2
        WHEN 'teacher' THEN 3
        WHEN 'parent' THEN 4
        WHEN 'student' THEN 5
    END;
