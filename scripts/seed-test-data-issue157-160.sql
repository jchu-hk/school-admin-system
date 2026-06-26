-- ============================================
-- 简化版测试数据生成脚本
-- 创建时间: 2026-06-26
-- 用途: 为Issue #157和#160生成测试数据
-- 使用动态查询获取学生和家长ID
-- ============================================

DO $$
DECLARE
  today_date DATE := CURRENT_DATE;
  school_id UUID := '550e8400-e29b-41d4-a716-446655440000';
  
  -- 动态获取的学生ID
  student_ids UUID[];
  parent_ids UUID[];
  
  -- 遍历用的变量
  student_id UUID;
  parent_id UUID;
  attendance_id UUID;
  inquiry_id UUID;
  counter INT := 0;
  status_text TEXT;
BEGIN
  -- ============================================
  -- 1. 获取学生和家长ID列表
  -- ============================================
  
  -- 获取学生ID
  SELECT array_agg(id) INTO student_ids
  FROM users 
  WHERE role = 'student' 
    AND status = 'active'
  ORDER BY id
  LIMIT 15;
  
  -- 获取家长ID
  SELECT array_agg(id) INTO parent_ids
  FROM users 
  WHERE role = 'parent' 
    AND status = 'active'
  ORDER BY id
  LIMIT 4;
  
  RAISE NOTICE '找到 % 个学生，% 个家长', array_length(student_ids, 1), COALESCE(array_length(parent_ids, 1), 0);
  
  -- ============================================
  -- 2. 出勤数据 (Issue #157)
  -- ============================================
  
  IF student_ids IS NOT NULL AND array_length(student_ids, 1) > 0 THEN
    -- 清空今天的出勤数据
    DELETE FROM attendances WHERE attendance_date = today_date;
    
    -- 为每个学生创建出勤记录
    FOREACH student_id IN ARRAY student_ids LOOP
      counter := counter + 1;
      attendance_id := gen_random_uuid();
      
      -- 根据counter分配不同的出勤状态
      CASE counter % 5
        WHEN 0 THEN 
          status_text := 'absent';
        WHEN 1 THEN 
          status_text := 'late';
        WHEN 2 THEN 
          status_text := 'sick_leave';
        WHEN 3 THEN 
          status_text := 'leave_early';
        ELSE 
          status_text := 'present';
      END CASE;
      
      -- 插入出勤记录
      IF status_text = 'present' THEN
        INSERT INTO attendances (
          id, student_id, attendance_date, status, check_in_time,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_id, today_date, status_text, '08:30:00',
          'manual', 'success', 'system', NOW()
        );
      ELSIF status_text = 'late' THEN
        INSERT INTO attendances (
          id, student_id, attendance_date, status, check_in_time,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_id, today_date, status_text, '08:55:00',
          'manual', 'success', 'system', NOW()
        );
      ELSE
        INSERT INTO attendances (
          id, student_id, attendance_date, status,
          sync_source, sync_status, created_by, created_at
        ) VALUES (
          attendance_id, student_id, today_date, status_text,
          'manual', 'success', 'system', NOW()
        );
      END IF;
    END LOOP;
    
    RAISE NOTICE '已创建 % 条出勤记录，日期: %', counter, today_date;
  ELSE
    RAISE NOTICE '未找到学生数据，跳过出勤记录创建';
  END IF;
  
  -- ============================================
  -- 3. 家长查询数据 (Issue #160)
  -- ============================================
  
  -- 清空测试查询数据
  DELETE FROM inquiries WHERE inquiry_no LIKE 'TEST-%';
  
  -- 创建4条测试查询（即使没有家长数据）
  counter := 0;
  
  FOR counter IN 1..4 LOOP
    inquiry_id := gen_random_uuid();
    
    -- 如果有家长数据，使用真实家长ID；否则使用系统ID
    IF parent_ids IS NOT NULL AND array_length(parent_ids, 1) >= counter THEN
      parent_id := parent_ids[counter];
    ELSE
      parent_id := '550e8400-e29b-41d4-a716-446655440020'; -- 使用默认ID
    END IF;
    
    INSERT INTO inquiries (
      id, inquiry_no, school_id, parent_id, inquiry_type,
      subject, content, channel, priority, status,
      parent_submitted_at, created_at
    ) VALUES (
      inquiry_id,
      'TEST-' || to_char(today_date, 'YYYYMMDD') || '-' || to_char(counter, 'FM000'),
      school_id,
      parent_id,
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
WHERE inquiry_no LIKE 'TEST-%'
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
FROM inquiries
WHERE inquiry_no LIKE 'TEST-%';