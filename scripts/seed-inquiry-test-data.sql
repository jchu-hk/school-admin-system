-- ============================================
-- 家长查询测试数据生成脚本
-- 创建时间: 2026-06-26
-- 用途: 为家长查询功能生成测试数据
-- ============================================

DO $$
DECLARE
  parent_ids UUID[] := ARRAY[
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440023'
  ];
  school_id UUID := 'default-school-id';
BEGIN
  -- 创建几个待处理的查询
  INSERT INTO inquiries (
    id, inquiry_no, school_id, parent_id, inquiry_type, 
    subject, content, channel, priority, status,
    parent_submitted_at, created_at
  ) VALUES
    (gen_random_uuid(), 'INQ-20260626-A001', school_id, parent_ids[1], 'attendance',
     '校车时间查询', '请问明天校车的到达时间是多少？我的孩子在中一A班。', 
     'app', 'normal', 'pending', NOW() - INTERVAL '2 hours', NOW()),
     
    (gen_random_uuid(), 'INQ-20260626-A002', school_id, parent_ids[2], 'finance',
     '学费缴费方式', '请问下学期的学费可以通过什么方式缴纳？', 
     'app', 'normal', 'pending', NOW() - INTERVAL '30 minutes', NOW()),
     
    (gen_random_uuid(), 'INQ-20260626-A003', school_id, parent_ids[3], 'academic',
     '成绩查询', '您好，我想查询孩子最近的考试成绩，请问在哪里可以看到？', 
     'app', 'normal', 'pending', NOW() - INTERVAL '15 minutes', NOW()),
     
    (gen_random_uuid(), 'INQ-20260626-A004', school_id, parent_ids[4], 'general',
     '午餐菜单查询', '请问本周的午餐菜单是什么？', 
     'phone', 'normal', 'processing', NOW() - INTERVAL '1 hour', NOW());
  
  RAISE NOTICE '已创建4条家长查询测试数据';
END $$;

-- 查询验证
SELECT 
  inquiry_no,
  inquiry_type as category,
  status,
  priority,
  parent_submitted_at
FROM inquiries
ORDER BY parent_submitted_at DESC;