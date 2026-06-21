-- =====================================================
-- School Admin System - Dashboard Test Data v2
-- 智能校务助理系统 - 仪表板测试数据 v2
-- =====================================================
-- 生成日期: 2026-06-21
-- 用途: 准备测试数据以展示仪表板功能
-- 执行: docker exec -i school-admin-postgres psql -U school_admin -d school_admin < seed-dashboard-data-v2.sql
-- =====================================================

SET datestyle = 'ISO, DMY';

-- =====================================================
-- 获取现有school_id和academic_year_id
-- =====================================================
DO $$
DECLARE
    v_school_id UUID;
    v_academic_year_id UUID;
BEGIN
    -- 获取school_id (从users表中获取)
    SELECT school_id INTO v_school_id FROM users LIMIT 1;

    -- 获取academic_year_id (从classes表中获取)
    SELECT academic_year_id INTO v_academic_year_id FROM classes LIMIT 1;

    RAISE NOTICE 'School ID: %', v_school_id;
    RAISE NOTICE 'Academic Year ID: %', v_academic_year_id;
END $$;

-- =====================================================
-- 1. 班级数据 (Classes)
-- =====================================================
INSERT INTO classes (school_id, name, grade, class_code, academic_year_id, capacity, is_active, created_at, updated_at)
SELECT
    school_id,
    '中一A班',
    'S1',
    '1A',
    academic_year_id,
    40,
    true,
    NOW(),
    NOW()
FROM (SELECT school_id, academic_year_id FROM classes LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '1A')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO classes (school_id, name, grade, class_code, academic_year_id, capacity, is_active, created_at, updated_at)
SELECT
    school_id,
    '中一B班',
    'S1',
    '1B',
    academic_year_id,
    40,
    true,
    NOW(),
    NOW()
FROM (SELECT school_id, academic_year_id FROM classes LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '1B')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO classes (school_id, name, grade, class_code, academic_year_id, capacity, is_active, created_at, updated_at)
SELECT
    school_id,
    '中二A班',
    'S2',
    '2A',
    academic_year_id,
    40,
    true,
    NOW(),
    NOW()
FROM (SELECT school_id, academic_year_id FROM classes LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '2A')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO classes (school_id, name, grade, class_code, academic_year_id, capacity, is_active, created_at, updated_at)
SELECT
    school_id,
    '中二B班',
    'S2',
    '2B',
    academic_year_id,
    40,
    true,
    NOW(),
    NOW()
FROM (SELECT school_id, academic_year_id FROM classes LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '2B')
ON CONFLICT (class_code) DO NOTHING;

INSERT INTO classes (school_id, name, grade, class_code, academic_year_id, capacity, is_active, created_at, updated_at)
SELECT
    school_id,
    '中三A班',
    'S3',
    '3A',
    academic_year_id,
    40,
    true,
    NOW(),
    NOW()
FROM (SELECT school_id, academic_year_id FROM classes LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = '3A')
ON CONFLICT (class_code) DO NOTHING;

-- =====================================================
-- 2. 学生数据 (通过users表，role='student')
-- =====================================================
INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024001',
    '陳大文',
    's2024001@school.edu',
    '13800138020',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.', -- Admin123!
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024001')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024002',
    '李小明',
    's2024002@school.edu',
    '13800138021',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024002')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024003',
    '王小美',
    's2024003@school.edu',
    '13800138022',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024003')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024004',
    '張家豪',
    's2024004@school.edu',
    '13800138023',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024004')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024005',
    '劉雅婷',
    's2024005@school.edu',
    '13800138024',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024005')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024006',
    '黃志強',
    's2024006@school.edu',
    '13800138025',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024006')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024007',
    '林小娟',
    's2024007@school.edu',
    '13800138026',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024007')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (school_id, user_type, username, name, email, phone, role, status, password, created_at, updated_at)
SELECT
    school_id,
    'student',
    's2024008',
    '鄭傑輝',
    's2024008@school.edu',
    '13800138027',
    'student',
    'active',
    '$2b$12$7sgmKQSuz5F1Oe0/Fwi3d.1t63EvF228gXooyVP2PBbpYS/7EYjZ.',
    NOW(),
    NOW()
FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's2024008')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 3. 今日出勤记录 (Attendances) - 2026-06-21
-- =====================================================
-- 获取班级ID
WITH class_ids AS (
    SELECT
        CASE WHEN class_code = '1A' THEN id END AS class_1a_id,
        CASE WHEN class_code = '1B' THEN id END AS class_1b_id,
        CASE WHEN class_code = '2A' THEN id END AS class_2a_id,
        CASE WHEN class_code = '2B' THEN id END AS class_2b_id,
        CASE WHEN class_code = '3A' THEN id END AS class_3a_id
    FROM classes
    WHERE class_code IN ('1A', '1B', '2A', '2B', '3A')
)
SELECT * FROM class_ids;

-- 插入出勤记录
INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'present',
    '07:45:00',
    '15:30:00',
    NULL,
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024001' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'late',
    '08:15:00',
    '15:30:00',
    '迟到30分钟',
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024002' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'present',
    '07:50:00',
    '15:30:00',
    NULL,
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024003' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'present',
    '07:55:00',
    '15:30:00',
    NULL,
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024004' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'present',
    '08:00:00',
    '15:30:00',
    NULL,
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024005' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'leave_early',
    '07:40:00',
    '14:00:00',
    '早退-牙医预约',
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024006' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'present',
    '07:48:00',
    '15:30:00',
    NULL,
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024007' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

INSERT INTO attendances (user_id, class_id, date, type, status, check_in_time, check_out_time, notes, created_at, updated_at)
SELECT
    u.id,
    c.id,
    '2026-06-21',
    'check_in',
    'absent',
    NULL,
    NULL,
    '病假-已获批准',
    NOW(),
    NOW()
FROM users u, classes c
WHERE u.username = 's2024008' AND c.class_code = '1A'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. 家长查询记录 (Inquiries)
-- =====================================================
INSERT INTO inquiries (school_id, parent_id, inquiry_type, subject, description, status, priority, submitted_at, assigned_to, resolved_at, created_at, updated_at)
SELECT
    school_id,
    (SELECT id FROM users WHERE role = 'parent' LIMIT 1),
    'attendance',
    '出勤問題',
    '請問為什麼我的孩子昨天的出勤記錄顯示為缺勤？',
    'pending',
    'urgent',
    NOW(),
    (SELECT id FROM users WHERE role = 'school_staff' LIMIT 1),
    NULL,
    NOW(),
    NOW()
FROM users LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO inquiries (school_id, parent_id, inquiry_type, subject, description, status, priority, submitted_at, assigned_to, resolved_at, created_at, updated_at)
SELECT
    school_id,
    (SELECT id FROM users WHERE role = 'parent' LIMIT 1),
    'finance',
    '學費繳費',
    '我想詢問下學期的學費標準是否有調整',
    'pending',
    'normal',
    NOW(),
    NULL,
    NULL,
    NOW(),
    NOW()
FROM users LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO inquiries (school_id, parent_id, inquiry_type, subject, description, status, priority, submitted_at, assigned_to, resolved_at, created_at, updated_at)
SELECT
    school_id,
    (SELECT id FROM users WHERE role = 'parent' LIMIT 1),
    'general',
    '校服問題',
    '學校是否有指定的校服供應商？',
    'pending',
    'low',
    NOW(),
    NULL,
    NULL,
    NOW(),
    NOW()
FROM users LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. 校车状态 (Bus Records) - 今日
-- =====================================================
INSERT INTO bus_records (bus_number, bus_route, driver_name, driver_phone, status, arrival_time, departure_time, capacity, current_passengers, notes, date, created_at, updated_at)
VALUES
('BUS01', '路線A-九龍東', '張司機', '13800901001', 'arrived', '07:25:00', '16:00:00', 45, 38, '正常運作', '2026-06-21', NOW(), NOW()),
('BUS02', '路線B-新界東', '李司機', '13800901002', 'arrived', '07:30:00', '16:05:00', 45, 42, '正常運作', '2026-06-21', NOW(), NOW()),
('BUS03', '路線C-港島區', '王司機', '13800901003', 'arrived', '07:20:00', '15:55:00', 40, 35, '正常運作', '2026-06-21', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. 午餐订单 (Lunch Orders) - 2026-06-21
-- =====================================================
-- 为1A班添加午餐订单
INSERT INTO lunch_orders (class_id, date, total_orders, special_diet_orders, supplier, status, created_at, updated_at)
SELECT
    id,
    '2026-06-21',
    8,
    1,
    '美味膳食',
    'confirmed',
    NOW(),
    NOW()
FROM classes WHERE class_code = '1A'
ON CONFLICT DO NOTHING;

-- 为1B班添加午餐订单
INSERT INTO lunch_orders (class_id, date, total_orders, special_diet_orders, supplier, status, created_at, updated_at)
SELECT
    id,
    '2026-06-21',
    4,
    0,
    '美味膳食',
    'confirmed',
    NOW(),
    NOW()
FROM classes WHERE class_code = '1B'
ON CONFLICT DO NOTHING;

-- 为2A班添加午餐订单
INSERT INTO lunch_orders (class_id, date, total_orders, special_diet_orders, supplier, status, created_at, updated_at)
SELECT
    id,
    '2026-06-21',
    4,
    1,
    '美味膳食',
    'confirmed',
    NOW(),
    NOW()
FROM classes WHERE class_code = '2A'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. 请假申请 (Leaves)
-- =====================================================
INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, status, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at)
SELECT
    id,
    'sick',
    '2026-06-21',
    '2026-06-22',
    2,
    '發燒，醫生建議休息兩天',
    'approved',
    NOW() - INTERVAL '2 hours',
    (SELECT id FROM users WHERE role = 'school_staff' LIMIT 1),
    NOW() - INTERVAL '1 hour',
    NULL,
    NOW(),
    NOW()
FROM users WHERE username = 's2024008'
ON CONFLICT DO NOTHING;

INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, status, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at)
SELECT
    id,
    'personal',
    '2026-06-21',
    '2026-06-21',
    0.5,
    '牙醫預約',
    'approved',
    NOW() - INTERVAL '5 hours',
    (SELECT id FROM users WHERE role = 'school_staff' LIMIT 1),
    NOW() - INTERVAL '4 hours',
    NULL,
    NOW(),
    NOW()
FROM users WHERE username = 's2024006'
ON CONFLICT DO NOTHING;

INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, status, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at)
SELECT
    id,
    'sick',
    '2026-06-21',
    '2026-06-23',
    3,
    '發燒，需要在家休息',
    'pending',
    NOW() - INTERVAL '3 hours',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
FROM users WHERE username = 'student1'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. 学费管理数据 (Fee Records - 类型为tuition)
-- =====================================================
INSERT INTO fee_records (school_id, user_id, fee_type_id, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%學費%' LIMIT 1),
    50000.00,
    'paid',
    '2024-09-15',
    '2024-09-10',
    'bank_transfer',
    'REC001',
    NOW(),
    NOW()
FROM users WHERE username = 's2024001'
ON CONFLICT DO NOTHING;

INSERT INTO fee_records (school_id, user_id, fee_type_id, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%學費%' LIMIT 1),
    50000.00,
    'partial',
    '2024-09-15',
    '2024-09-08',
    'cash',
    'REC002',
    NOW(),
    NOW()
FROM users WHERE username = 's2024003'
ON CONFLICT DO NOTHING;

INSERT INTO fee_records (school_id, user_id, fee_type_id, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%學費%' LIMIT 1),
    50000.00,
    'overdue',
    '2024-09-15',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
FROM users WHERE username = 'student1'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. 其他费用记录 (Fee Records - 其他类型)
-- =====================================================
INSERT INTO fee_records (school_id, user_id, fee_type_id, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%校服%' LIMIT 1),
    1500.00,
    'paid',
    '2024-09-01',
    '2024-08-25',
    'cash',
    'FR001',
    NOW(),
    NOW()
FROM users WHERE username = 's2024001'
ON CONFLICT DO NOTHING;

INSERT INTO fee_records (school_id, user_id, fee_type_id, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%課本%' LIMIT 1),
    2500.00,
    'paid',
    '2024-09-01',
    '2024-08-28',
    'fps',
    'FR002',
    NOW(),
    NOW()
FROM users WHERE username = 's2024002'
ON CONFLICT DO NOTHING;

INSERT INTO fee_records (school_id, user_id, fee_type_id, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%雜費%' LIMIT 1),
    1000.00,
    'paid',
    '2024-09-01',
    '2024-08-30',
    'bank_transfer',
    'FR003',
    NOW(),
    NOW()
FROM users WHERE username = 's2024003'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. 奖学金数据 (Scholarships)
-- =====================================================
INSERT INTO scholarships (school_id, user_id, scholarship_type_id, amount, award_type, status, awarded_date, certificate_number, notes, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%學業%' OR name LIKE '%獎學金%' LIMIT 1),
    5000.00,
    'cash',
    'awarded',
    '2024-10-15',
    'SCH001',
    '2024-2025學年第一學期成績優異',
    NOW(),
    NOW()
FROM users WHERE username = 's2024001'
ON CONFLICT DO NOTHING;

INSERT INTO scholarships (school_id, user_id, scholarship_type_id, amount, award_type, status, awarded_date, certificate_number, notes, created_at, updated_at)
SELECT
    school_id,
    id,
    (SELECT id FROM fee_types WHERE name LIKE '%品行%' OR name LIKE '%獎學金%' LIMIT 1),
    2000.00,
    'book_voucher',
    'awarded',
    '2024-10-15',
    'SCH002',
    '2024-2025學年第一學期品行優異',
    NOW(),
    NOW()
FROM users WHERE username = 's2024002'
ON CONFLICT DO NOTHING;

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
SELECT '今日出勤记录', COUNT(*) FROM attendances WHERE date = '2026-06-21'
UNION ALL
SELECT '家长查询', COUNT(*) FROM inquiries WHERE status = 'pending'
UNION ALL
SELECT '校车', COUNT(*) FROM bus_records WHERE date = '2026-06-21' AND status = 'arrived'
UNION ALL
SELECT '午餐订单', COUNT(*) FROM lunch_orders WHERE date = '2026-06-21'
UNION ALL
SELECT '待审批请假', COUNT(*) FROM leaves WHERE status = 'pending'
UNION ALL
SELECT '学费记录', COUNT(*) FROM fee_records
UNION ALL
SELECT '奖学金', COUNT(*) FROM scholarships;

SELECT '=== 今日出勤概览 (2026-06-21) ===' as info;
SELECT
    c.name as 班级,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as 出勤,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as 迟到,
    COUNT(CASE WHEN a.status = 'leave_early' THEN 1 END) as 早退,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as 缺勤,
    COUNT(*) as 总人数
FROM attendances a
JOIN classes c ON a.class_id = c.id
WHERE a.date = '2026-06-21'
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
    SUM(CASE WHEN leave_type = 'sick' THEN 1 ELSE 0 END)
FROM leaves
WHERE status = 'pending'
UNION ALL
SELECT
    '逾期学费',
    COUNT(*),
    0
FROM fee_records
WHERE payment_status = 'overdue';

SELECT '✅ 测试数据准备完成！' as info;

-- 显示测试账号信息
SELECT '=== 测试账号信息 ===' as info;
SELECT username, name, role, email FROM users WHERE username IN ('admin', 'staff1', 'parent1', 'student1', 'teacher1', 's2024001', 's2024002', 's2024003', 's2024004', 's2024005', 's2024006', 's2024007', 's2024008') ORDER BY role;