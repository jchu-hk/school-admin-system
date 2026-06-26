-- ============================================
-- 出勤和查询综合测试数据生成脚本
-- 创建时间: 2026-06-26
-- 用途: 为Issue #157和#160生成测试数据
-- ============================================

DO $$
DECLARE
  today_date DATE := CURRENT_DATE;
  
  -- 学生ID列表（从seed-full-test-data.sql获取）
  student_ids UUID[] := ARRAY[
    '550e8400-e29b-41d4-a716-446655440001',  -- stu001
    '550e8400-e29b-41d4-a716-446655440002',  -- stu002
    '550e8400-e29b-41d4-a716-446655440003',  -- stu003
    '550e8400-e29b-41d4-a716-446655440004',  -- stu004
    '550e8400-e29b-41d4-a716-446655440005',  -- stu005
    '550e8400-e29b-41d4-a716-446655440006',  -- stu006
    '550e8400-e29b-41d4-a716-446655440007',  -- stu007
    '550e8400-e29b-41d4-a716-446655440008',  -- stu008
    '550e8400-e29b-41d4-a716-446655440009',  -- stu009
    '550e8400-e29b-41d4-a716-446655440010',  -- stu010
    '550e8400-e29b-41d4-a716-446655440011',  -- stu011
    '550e8400-e29b-41d4-a716-446655440012',  -- stu012
    '550e8400-e29b-41d4-a716-446655440013',  -- stu013
    '550e8400-e29b-41d4-a716-446655440014',  -- stu014
    '550e8400-e29b-41d4-a716-446655440015'   -- stu015
  ];
  
  -- 家长ID列表
  parent_ids UUID[] := ARRAY[
    '550e8400-e29b-41d4-a716-446655440020',  -- parent001
    '550e8400-e29b-41d4-a716-446655440021',  -- parent002
    '550e8400-e29b-41d4-a716-446655440022',  -- parent003
    '550e8400-e29b-41d4-a716-446655440023'   -- parent004
  ];
  
  school_id UUID := '550e8400-e29b-41d4-a716-446655440000';
  
  attendance_id UUID;
  inquiry_id UUID;
  counter INT := 0;
BEGIN
  -- ============================================
  -- 1. 出勤数据 (Issue #157)
  -- ============================================
  
  -- 清空今天的出勤数据
  DELETE FROM attendances WHERE attendance_date = today_date;
  
  -- 为每个学生创建出勤记录
  FOR counter IN 1..15 LOOP
    attendance_id := gen_random_uuid();
    
    -- 随机分配出勤状态
    CASE counter % 5
      WHEN 0 THEN -- 缺勤
        INSERT INTO attendances (
          id, student_id, attendance_date, status, 
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_ids[counter], today_date, 'absent',
          'manual', 'success', 'system', NOW()
        );
      WHEN 1 THEN -- 迟到
        INSERT INTO attendances (
          id, student_id, attendance_date, status, check_in_time,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_ids[counter], today_date, 'late', '08:55:00',
          'manual', 'success', 'system', NOW()
        );
      WHEN 2 THEN -- 病假
        INSERT INTO attendances (
          id, student_id, attendance_date, status,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_ids[counter], today_date, 'sick_leave',
          'manual', 'success', 'system', NOW()
        );
      WHEN 3 THEN -- 早退
        INSERT INTO attendances (
          id, student_id, attendance_date, status, check_in_time, check_out_time,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_ids[counter], today_date, 'leave_early', '08:30:00', '14:00:00',
          'manual', 'success', 'system', NOW()
        );
      ELSE -- 正常出勤
        INSERT INTO attendances (
          id, student_id, attendance_date, status, check_in_time,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_ids[counter], today_date, 'present', '08:30:00',
          'manual', 'success', 'system', NOW()
        );
    END CASE;
  END LOOP;
  
  RAISE NOTICE '已创建15条出勤记录，日期: %', today_date;
  
  -- ============================================
  -- 2. 家长查询数据 (Issue #160)
  -- ============================================
  
  -- 清空测试查询数据
  DELETE FROM inquiries WHERE inquiry_no LIKE 'TEST-%';
  
  -- 创建测试查询
  FOR counter IN 1..4 LOOP
    inquiry_id := gen_random_uuid();
    
    INSERT INTO inquiries (
      id, inquiry_no, school_id, parent_id, inquiry_type,
      subject, content, channel, priority, status,
      parent_submitted_at, created_at
    ) VALUES (
      inquiry_id,
      'TEST-' || to_char(today_date, 'YYYYMMDD') || '-' || to_char(counter, 'FM000'),
      school_id,
      parent_ids[counter],
      CASE counter
        WHEN 1 THEN 'attendance'
        WHEN 2 THEN 'finance'
        WHEN 3 THEN 'academic'
        ELSE 'general'
      END,
      CASE counter
        WHEN 1 THEN '校车时间查询'
        WHEN 2 THEN '学费缴费方式'
        WHEN 3 THEN '成绩查询'
        ELSE '午餐菜单查询'
      END,
      CASE counter
        WHEN 1 THEN '请问明天校车的到达时间是多少？'
        WHEN 2 THEN '请问下学期的学费可以通过什么方式缴纳？'
        WHEN 3 THEN '您好，我想查询孩子最近的考试成绩'
        ELSE '请问本周的午餐菜单是什么？'
      END,
      'app',
      'normal',
      'pending',
      NOW() - (INTERVAL '1 hour' * counter),
      NOW()
    );
  END LOOP;
  
  RAISE NOTICE '已创建4条家长查询测试数据';
END $$;

-- ============================================
-- 验证数据
-- ============================================

-- 出勤统计
SELECT 
  '出勤统计' as type,
  status,
  COUNT(*) as count
FROM attendances
WHERE attendance_date = CURRENT_DATE
GROUP BY status
ORDER BY status;

-- 查询统计
SELECT 
  '查询统计' as type,
  inquiry_type as category,
  status,
  COUNT(*) as count
FROM inquiries
GROUP BY inquiry_type, status
ORDER BY inquiry_type, status;

-- 总计
SELECT 
  '总计' as type,
  '出勤总数' as metric,
  COUNT(*) as count
FROM attendances
WHERE attendance_date = CURRENT_DATE;

SELECT 
  '总计' as type,
  '查询总数' as metric,
  COUNT(*) as count
FROM inquiries;