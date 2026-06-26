-- ============================================
-- 出勤测试数据生成脚本
-- 创建时间: 2026-06-26
-- 用途: 为今天的仪表盘生成出勤数据
-- ============================================

-- 获取今天日期
DO $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  -- 清空今天的出勤数据（如果存在）
  DELETE FROM attendances WHERE attendance_date = today_date;
  
  -- 为每个学生创建今天的出勤记录
  -- 假设有15个学生，随机生成出勤状态
  
  -- 中一A班学生（5个）
  INSERT INTO attendances (
    id, student_id, class_id, attendance_date, status, 
    check_in_time, sync_source, sync_status, created_by, created_at
  ) VALUES
    -- 出勤 (3个)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'class-1a-id', today_date, 'present', 
     '08:30:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'class-1a-id', today_date, 'present', 
     '08:25:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'class-1a-id', today_date, 'present', 
     '08:35:00', 'manual', 'success', 'system', NOW()),
    -- 迟到 (1个)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 'class-1a-id', today_date, 'late', 
     '09:05:00', 'manual', 'success', 'system', NOW()),
    -- 病假 (1个)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', 'class-1a-id', today_date, 'sick_leave', 
     NULL, 'manual', 'success', 'system', NOW()),
    
    -- 中一B班学生（3个）
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'class-1b-id', today_date, 'present', 
     '08:28:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'class-1b-id', today_date, 'present', 
     '08:32:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', 'class-1b-id', today_date, 'absent', 
     NULL, 'manual', 'success', 'system', NOW()),
    
    -- 中二A班学生（4个）
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', 'class-2a-id', today_date, 'present', 
     '08:20:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', 'class-2a-id', today_date, 'present', 
     '08:40:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440012', 'class-2a-id', today_date, 'late', 
     '08:50:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440013', 'class-2a-id', today_date, 'present', 
     '08:22:00', 'manual', 'success', 'system', NOW()),
    
    -- 中二B班学生（3个）
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440014', 'class-2b-id', today_date, 'present', 
     '08:30:00', 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440015', 'class-2b-id', today_date, 'personal_leave', 
     NULL, 'manual', 'success', 'system', NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440016', 'class-2b-id', today_date, 'present', 
     '08:27:00', 'manual', 'success', 'system', NOW());
  
  RAISE NOTICE '已创建15条出勤记录，日期: %', today_date;
END $$;

-- 统计验证
SELECT 
  attendance_date,
  status,
  COUNT(*) as count
FROM attendances
WHERE attendance_date = CURRENT_DATE
GROUP BY attendance_date, status
ORDER BY status;