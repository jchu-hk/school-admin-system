-- =====================================================
-- School Admin System - Dashboard Test Data v4
-- 智能校务助理系统 - 仪表板测试数据 v4
-- =====================================================
-- 生成日期: 2026-06-21
-- 执行: docker exec -i school-admin-postgres psql -U school_admin -d school_admin < seed-dashboard-data-v4.sql
-- =====================================================

SET datestyle = 'ISO, DMY';

-- =====================================================
-- 1. 班级数据 (Classes) - 如果不存在则创建
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '1A') THEN
        INSERT INTO classes (name, grade, class_code, academic_year_id, capacity, is_active, created_by, created_at, updated_by, updated_at)
        VALUES ('中一A班', 'S1', '1A', (SELECT academic_year_id FROM classes LIMIT 1), 40, true, 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '1B') THEN
        INSERT INTO classes (name, grade, class_code, academic_year_id, capacity, is_active, created_by, created_at, updated_by, updated_at)
        VALUES ('中一B班', 'S1', '1B', (SELECT academic_year_id FROM classes LIMIT 1), 40, true, 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '2A') THEN
        INSERT INTO classes (name, grade, class_code, academic_year_id, capacity, is_active, created_by, created_at, updated_by, updated_at)
        VALUES ('中二A班', 'S2', '2A', (SELECT academic_year_id FROM classes LIMIT 1), 40, true, 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '2B') THEN
        INSERT INTO classes (name, grade, class_code, academic_year_id, capacity, is_active, created_by, created_at, updated_by, updated_at)
        VALUES ('中二B班', 'S2', '2B', (SELECT academic_year_id FROM classes LIMIT 1), 40, true, 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '3A') THEN
        INSERT INTO classes (name, grade, class_code, academic_year_id, capacity, is_active, created_by, created_at, updated_by, updated_at)
        VALUES ('中三A班', 'S3', '3A', (SELECT academic_year_id FROM classes LIMIT 1), 40, true, 'admin', NOW(), 'admin', NOW());
    END IF;
END $$;

-- =====================================================
-- 2. 学生数据 (Users - role='student')
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024001') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024001', '陳大文', 's2024001@school.edu', '13800138020', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024002') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024002', '李小明', 's2024002@school.edu', '13800138021', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024003') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024003', '王小美', 's2024003@school.edu', '13800138022', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024004') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024004', '張家豪', 's2024004@school.edu', '13800138023', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024005') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024005', '劉雅婷', 's2024005@school.edu', '13800138024', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024006') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024006', '黃志強', 's2024006@school.edu', '13800138025', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024007') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024007', '林小娟', 's2024007@school.edu', '13800138026', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024008') THEN
        INSERT INTO users (username, name, email, phone, role, status, password, className, created_by, created_at, updated_by, updated_at)
        VALUES ('s2024008', '鄭傑輝', 's2024008@school.edu', '13800138027', 'student', 'active', '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', '1A', 'admin', NOW(), 'admin', NOW());
    END IF;
END $$;

-- =====================================================
-- 3. 今日出勤记录 (Attendances) - 2026-06-21
-- =====================================================
INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'present',
    '07:45:00',
    '15:30:00',
    NULL,
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024001' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'late',
    '08:15:00',
    '15:30:00',
    '迟到30分钟',
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024002' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'present',
    '07:50:00',
    '15:30:00',
    NULL,
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024003' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'present',
    '07:55:00',
    '15:30:00',
    NULL,
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024004' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'present',
    '08:00:00',
    '15:30:00',
    NULL,
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024005' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'leave_early',
    '07:40:00',
    '14:00:00',
    '早退-牙医预约',
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024006' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'present',
    '07:48:00',
    '15:30:00',
    NULL,
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024007' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    c.id::text,
    '2026-06-21',
    'check_in',
    'absent',
    NULL,
    NULL,
    '病假-已获批准',
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u, classes c
WHERE u.username = 's2024008' AND c.class_code = '1A'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

-- =====================================================
-- 4. 家长查询记录 (Inquiries)
-- =====================================================
INSERT INTO inquiries (parent_id, inquiry_type, priority, is_urgent, title, content, status, assigned_to, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'general', 'urgent', true, '出勤問題', '請問為什麼我的孩子昨天的出勤記錄顯示為缺勤？', 'pending', (SELECT id FROM users WHERE role = 'school_staff' LIMIT 1), NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO inquiries (parent_id, inquiry_type, priority, is_urgent, title, content, status, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'finance', 'normal', false, '學費繳費', '我想詢問下學期的學費標準是否有調整', 'pending', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO inquiries (parent_id, inquiry_type, priority, is_urgent, title, content, status, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'general', 'low', false, '校服問題', '學校是否有指定的校服供應商？', 'pending', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. 午餐订单 (Lunch Orders) - 2026-06-21
-- =====================================================
INSERT INTO lunch_orders (student_id, ordered_by, order_date, menu_name, menu_price, quantity, total_amount, status, notes, created_by, created_at, updated_by, updated_at)
SELECT
    u.id,
    u.id,
    '2026-06-21',
    '标准午餐',
    25.00,
    1,
    25.00,
    'confirmed',
    NULL,
    'admin',
    NOW(),
    'admin',
    NOW()
FROM users u
WHERE u.username IN ('s2024001', 's2024002', 's2024003', 's2024004', 's2024005', 's2024006', 's2024007')
AND NOT EXISTS (SELECT 1 FROM lunch_orders lo WHERE lo.student_id = u.id AND lo.order_date = '2026-06-21');

-- =====================================================
-- 6. 请假申请 (Leaves)
-- =====================================================
INSERT INTO leaves (applicant_id, leave_type, start_date, end_date, total_days, reason, status, approver_id, approved_at, created_by, created_at, updated_by, updated_at)
SELECT
    id,
    'sick',
    '2026-06-21',
    '2026-06-22',
    2,
    '發燒，醫生建議休息兩天',
    'approved',
    (SELECT id FROM users WHERE role = 'school_staff' LIMIT 1),
    NOW() - INTERVAL '1 hour',
    'admin',
    NOW() - INTERVAL '2 hours',
    'admin',
    NOW() - INTERVAL '1 hour'
FROM users
WHERE username = 's2024008'
AND NOT EXISTS (SELECT 1 FROM leaves l WHERE l.applicant_id = users.id AND l.start_date = '2026-06-21');

INSERT INTO leaves (applicant_id, leave_type, start_date, end_date, total_days, reason, status, approver_id, approved_at, created_by, created_at, updated_by, updated_at)
SELECT
    id,
    'personal',
    '2026-06-21',
    '2026-06-21',
    1,
    '牙醫預約',
    'approved',
    (SELECT id FROM users WHERE role = 'school_staff' LIMIT 1),
    NOW() - INTERVAL '4 hours',
    'admin',
    NOW() - INTERVAL '5 hours',
    'admin',
    NOW() - INTERVAL '4 hours'
FROM users
WHERE username = 's2024006'
AND NOT EXISTS (SELECT 1 FROM leaves l WHERE l.applicant_id = users.id AND l.start_date = '2026-06-21');

INSERT INTO leaves (applicant_id, leave_type, start_date, end_date, total_days, reason, status, created_by, created_at, updated_by, updated_at)
SELECT
    id,
    'sick',
    '2026-06-21',
    '2026-06-23',
    3,
    '發燒，需要在家休息',
    'pending',
    'admin',
    NOW() - INTERVAL '3 hours',
    'admin',
    NOW() - INTERVAL '3 hours'
FROM users
WHERE username = 'student1'
AND NOT EXISTS (SELECT 1 FROM leaves l WHERE l.applicant_id = users.id AND l.start_date = '2026-06-21');

-- =====================================================
-- 验证数据创建结果
-- =====================================================
SELECT '=== 数据统计 ===' as info;

SELECT '班级' as type, COUNT(*) as count FROM classes WHERE is_active = true
UNION ALL
SELECT '学生', COUNT(*) FROM users WHERE role = 'student'
UNION ALL
SELECT '家长', COUNT(*) FROM users WHERE role = 'parent'
UNION ALL
SELECT '今日出勤记录', COUNT(*) FROM attendances WHERE attendance_date = '2026-06-21'
UNION ALL
SELECT '家长查询', COUNT(*) FROM inquiries WHERE status = 'pending'
UNION ALL
SELECT '午餐订单', COUNT(*) FROM lunch_orders WHERE order_date = '2026-06-21'
UNION ALL
SELECT '待审批请假', COUNT(*) FROM leaves WHERE status = 'pending';

SELECT '=== 今日出勤概览 (2026-06-21) ===' as info;
SELECT
    c.name as 班级,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as 出勤,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as 迟到,
    COUNT(CASE WHEN a.status = 'leave_early' THEN 1 END) as 早退,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as 缺勤,
    COUNT(*) as 总人数
FROM attendances a
JOIN classes c ON a.class_id::uuid = c.id
WHERE a.attendance_date = '2026-06-21'
GROUP BY c.id, c.name
ORDER BY c.class_code;

SELECT '=== 待处理项目 ===' as info;
SELECT
    '家长查询' as 类型,
    COUNT(*) as 数量,
    SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as 紧急
FROM inquiries
WHERE status = 'pending'
UNION ALL
SELECT
    '请假申请',
    COUNT(*),
    0
FROM leaves
WHERE status = 'pending';

SELECT '=== 测试账号信息 ===' as info;
SELECT username, name, role, email, classname FROM users WHERE username IN ('admin', 'staff1', 'parent1', 'student1', 'teacher1', 's2024001', 's2024002', 's2024003', 's2024004', 's2024005', 's2024006', 's2024007', 's2024008') ORDER BY role;

SELECT '✅ 测试数据准备完成！' as info;

-- 显示今日仪表板数据汇总
SELECT '=== 今日仪表板数据汇总 ===' as info;
SELECT
    (SELECT ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) FROM attendances WHERE attendance_date = '2026-06-21') as 出勤率,
    (SELECT COUNT(*) FROM attendances WHERE attendance_date = '2026-06-21' AND status = 'late') as 迟到人数,
    (SELECT COUNT(*) FROM inquiries WHERE status = 'pending') as 待处理查询,
    (SELECT COUNT(*) FROM lunch_orders WHERE order_date = '2026-06-21') as 今日午餐订单,
    (SELECT COUNT(*) FROM leaves WHERE status = 'pending') as 待审批请假;