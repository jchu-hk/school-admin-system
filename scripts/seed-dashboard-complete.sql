-- =====================================================
-- Dashboard Test Data Generator
-- 生成仪表板所需测试数据
-- =====================================================
-- 日期: 2026-06-21
-- =====================================================

SET datestyle = 'ISO, DMY';

-- =====================================================
-- 1. 今日出勤记录 (Attendances) - 2026-06-21
-- =====================================================

-- 中一A班 (class_id: aea48363-5f9c-48a4-8b6f-a5bfba623db0)
INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
VALUES
('29e999e3-7844-46eb-a249-44a18a6f982d', 'aea48363-5f9c-48a4-8b6f-a5bfba623db0', '2026-06-21', 'check_in', 'present', '07:45:00', '15:30:00', NULL, 'admin', NOW(), 'admin', NOW()),
('0133b92f-269b-4880-a4ab-ac51a0d2c6e1', 'aea48363-5f9c-48a4-8b6f-a5bfba623db0', '2026-06-21', 'check_in', 'present', '07:50:00', '15:30:00', NULL, 'admin', NOW(), 'admin', NOW()),
('3512932d-8ef4-435a-b690-d8e6966b6973', 'aea48363-5f9c-48a4-8b6f-a5bfba623db0', '2026-06-21', 'check_in', 'late', '08:15:00', '15:30:00', '迟到30分钟', 'admin', NOW(), 'admin', NOW()),
('d66f9810-6c8a-4e4e-9fc9-d566e7aa1e7f', 'aea48363-5f9c-48a4-8b6f-a5bfba623db0', '2026-06-21', 'check_in', 'present', '07:55:00', '15:30:00', NULL, 'admin', NOW(), 'admin', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'aea48363-5f9c-48a4-8b6f-a5bfba623db0', '2026-06-21', 'check_in', 'leave_early', '07:40:00', '14:00:00', '早退-牙医预约', 'admin', NOW(), 'admin', NOW())
ON CONFLICT DO NOTHING;

-- 中一B班 (class_id: a9cd8bcb-39e2-44d2-be4e-c91a98f56af4)
INSERT INTO attendances (student_id, class_id, attendance_date, attendance_type, status, check_in_time, check_out_time, remark, created_by, created_at, updated_by, updated_at)
SELECT
    u.id, 'a9cd8bcb-39e2-44d2-be4e-c91a98f56af4', '2026-06-21', 'check_in', 'present', '07:48:00', '15:30:00', NULL, 'admin', NOW(), 'admin', NOW()
FROM users u WHERE u.username = 'stu001'
AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.student_id = u.id AND a.attendance_date = '2026-06-21');

-- =====================================================
-- 2. 家长查询记录 (Inquiries) - 添加更多测试数据
-- =====================================================
INSERT INTO inquiries (parent_id, inquiry_type, priority, is_urgent, title, content, status, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'attendance', 'urgent', true, '出勤記錄問題', '我的孩子今天早上有到校，但系統顯示缺勤，請幫忙核查', 'pending', NOW(), NOW()),
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'finance', 'normal', false, '學費繳費查詢', '想了解下學期學費的繳費方式和截止日期', 'pending', NOW(), NOW()),
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'general', 'low', false, '校服尺碼更換', '之前訂購的校服尺碼偏小，可以更換嗎？', 'pending', NOW(), NOW()),
((SELECT id FROM users WHERE role = 'parent' LIMIT 1), 'academic', 'normal', false, '成績查詢', '想了解孩子的期中考試成績', 'pending', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. 请假申请 (Leaves) - 待审批
-- =====================================================
INSERT INTO leaves (applicant_id, leave_type, start_date, end_date, total_days, reason, status, created_by, created_at, updated_by, updated_at)
VALUES
((SELECT id FROM users WHERE role = 'student' LIMIT 1), 'sick', '2026-06-22', '2026-06-23', 2, '發燒，需要在家休息兩天', 'pending', 'admin', NOW(), 'admin', NOW()),
((SELECT id FROM users WHERE role = 'student' LIMIT 1), 'personal', '2026-06-21', '2026-06-21', 1, '家庭原因需要請假一天', 'pending', 'admin', NOW(), 'admin', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. 午餐订单 (Lunch Orders) - 今日
-- =====================================================
INSERT INTO lunch_orders (student_id, ordered_by, order_date, menu_name, menu_price, quantity, total_amount, status, notes, created_by, created_at, updated_by, updated_at)
VALUES
('29e999e3-7844-46eb-a249-44a18a6f982d', '29e999e3-7844-46eb-a249-44a18a6f982d', '2026-06-21', '標準午餐', 25.00, 1, 25.00, 'confirmed', NULL, 'admin', NOW(), 'admin', NOW()),
('0133b92f-269b-4880-a4ab-ac51a0d2c6e1', '0133b92f-269b-4880-a4ab-ac51a0d2c6e1', '2026-06-21', '標準午餐', 25.00, 1, 25.00, 'confirmed', NULL, 'admin', NOW(), 'admin', NOW()),
('3512932d-8ef4-435a-b690-d8e6966b6973', '3512932d-8ef4-435a-b690-d8e6966b6973', '2026-06-21', '素食午餐', 25.00, 1, 25.00, 'confirmed', '素食要求', 'admin', NOW(), 'admin', NOW()),
('d66f9810-6c8a-4e4e-9fc9-d566e7aa1e7f', 'd66f9810-6c8a-4e4e-9fc9-d566e7aa1e7f', '2026-06-21', '標準午餐', 25.00, 1, 25.00, 'confirmed', NULL, 'admin', NOW(), 'admin', NOW()),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '2026-06-21', '清真午餐', 28.00, 1, 28.00, 'confirmed', '清真食品要求', 'admin', NOW(), 'admin', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 验证数据创建结果
-- =====================================================
SELECT '=== 仪表板数据统计 ===' as info;

SELECT 
    '今日出勤記錄' as type, COUNT(*) as count FROM attendances WHERE attendance_date = '2026-06-21'
UNION ALL
SELECT '家長查詢', COUNT(*) FROM inquiries WHERE status = 'pending'
UNION ALL
SELECT '待審批請假', COUNT(*) FROM leaves WHERE status = 'pending'
UNION ALL
SELECT '今日午餐訂單', COUNT(*) FROM lunch_orders WHERE order_date = '2026-06-21';

SELECT '=== 今日出勤概覽 (2026-06-21) ===' as info;
SELECT
    c.name as 班級,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as 出勤,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as 遲到,
    COUNT(CASE WHEN a.status = 'leave_early' THEN 1 END) as 早退,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as 缺勤,
    COUNT(*) as 總人數
FROM attendances a
JOIN classes c ON a.class_id = c.id::text OR a.class_id = c.id
WHERE a.attendance_date = '2026-06-21'
GROUP BY c.id, c.name
ORDER BY c.class_code;

SELECT '=== 待處理項目 ===' as info;
SELECT 
    '緊急家長查詢' as type, COUNT(*) as count 
FROM inquiries WHERE status = 'pending' AND priority = 'urgent'
UNION ALL
SELECT '一般家長查詢', COUNT(*) 
FROM inquiries WHERE status = 'pending' AND priority = 'normal'
UNION ALL
SELECT '病假申請', COUNT(*) 
FROM leaves WHERE status = 'pending' AND leave_type = 'sick'
UNION ALL
SELECT '事假申請', COUNT(*) 
FROM leaves WHERE status = 'pending' AND leave_type = 'personal';

SELECT '=== 午餐訂單統計 ===' as info;
SELECT 
    SUM(total_amount) as 總金額,
    COUNT(*) as 訂單數量,
    SUM(CASE WHEN notes IS NOT NULL THEN 1 ELSE 0 END) as 特殊要求
FROM lunch_orders WHERE order_date = '2026-06-21';

SELECT '✅ 測試數據準備完成！' as info;