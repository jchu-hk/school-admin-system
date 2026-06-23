-- ============================================
-- 完整测试数据生成脚本
-- 创建时间: 2026-06-24
-- 用途: 补充学生、家长、教师、校务人员测试数据
-- ============================================

DO $$
DECLARE
  -- 密码哈希值 (bcrypt hash for "Admin123!")
  password_hash TEXT := '$2b$12$BDQT8MI5MWVDv6TGAnbt5eiN1th.aKzjZc2W.GMWueReInRGUGL4S';

  v_new_students INT := 0;
  v_new_parents INT := 0;
  v_new_teachers INT := 0;
  v_new_staff INT := 0;

  v_total_students INT := 0;
  v_total_parents INT := 0;
  v_total_teachers INT := 0;
  v_total_staff INT := 0;

BEGIN
  -- ============================================
  -- 1. 学生数据 (新增10个，总共15个)
  -- ============================================
  INSERT INTO users (
    id, username, name, role, email, phone,
    password, status, created_at, updated_at,
    class_name
  ) VALUES
    (
      '550e8400-e29b-41d4-a716-446655440006',
      'stu006', '孙小华', 'student',
      'stu006@school.com', '13800138006',
      password_hash, 'active', NOW(), NOW(),
      '中一A班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440007',
      'stu007', '周小强', 'student',
      'stu007@school.com', '13800138007',
      password_hash, 'active', NOW(), NOW(),
      '中一B班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440008',
      'stu008', '吴小美', 'student',
      'stu008@school.com', '13800138008',
      password_hash, 'active', NOW(), NOW(),
      '中二A班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440009',
      'stu009', '郑小龙', 'student',
      'stu009@school.com', '13800138009',
      password_hash, 'active', NOW(), NOW(),
      '中二B班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440010',
      'stu010', '钱小芳', 'student',
      'stu010@school.com', '13800138010',
      password_hash, 'active', NOW(), NOW(),
      '中三A班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440011',
      'stu011', '冯小强', 'student',
      'stu011@school.com', '13800138011',
      password_hash, 'active', NOW(), NOW(),
      '中一A班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440012',
      'stu012', '陈小芳', 'student',
      'stu012@school.com', '13800138012',
      password_hash, 'active', NOW(), NOW(),
      '中一B班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440013',
      'stu013', '林小龙', 'student',
      'stu013@school.com', '13800138013',
      password_hash, 'active', NOW(), NOW(),
      '中二A班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440014',
      'stu014', '黄小美', 'student',
      'stu014@school.com', '13800138014',
      password_hash, 'active', NOW(), NOW(),
      '中二B班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440015',
      'stu015', '赵小华', 'student',
      'stu015@school.com', '13800138015',
      password_hash, 'active', NOW(), NOW(),
      '中三A班'
    )
  ON CONFLICT (username) DO NOTHING;

  GET DIAGNOSTICS v_new_students = ROW_COUNT;
  RAISE NOTICE '新增学生: % 个', v_new_students;

  -- ============================================
  -- 2. 家长数据 (新增5个，总共8个)
  -- ============================================
  INSERT INTO users (
    id, username, name, role, email, phone,
    password, status, created_at, updated_at
  ) VALUES
    (
      '550e8400-e29b-41d4-a716-446655440101',
      'parent004', '陈父', 'parent',
      'parent004@school.com', '13900139001',
      password_hash, 'active', NOW(), NOW()
    ),
    (
      '550e8400-e29b-41d4-a716-446655440102',
      'parent005', '李母', 'parent',
      'parent005@school.com', '13900139002',
      password_hash, 'active', NOW(), NOW()
    ),
    (
      '550e8400-e29b-41d4-a716-446655440103',
      'parent006', '王母', 'parent',
      'parent006@school.com', '13900139003',
      password_hash, 'active', NOW(), NOW()
    ),
    (
      '550e8400-e29b-41d4-a716-446655440104',
      'parent007', '赵父', 'parent',
      'parent007@school.com', '13900139004',
      password_hash, 'active', NOW(), NOW()
    ),
    (
      '550e8400-e29b-41d4-a716-446655440105',
      'parent008', '周父', 'parent',
      'parent008@school.com', '13900139005',
      password_hash, 'active', NOW(), NOW()
    )
  ON CONFLICT (username) DO NOTHING;

  GET DIAGNOSTICS v_new_parents = ROW_COUNT;
  RAISE NOTICE '新增家长: % 个', v_new_parents;

  -- ============================================
  -- 3. 教师数据 (新增3个，总共6个)
  -- ============================================
  INSERT INTO users (
    id, username, name, role, email, phone,
    password, status, created_at, updated_at,
    class_name
  ) VALUES
    (
      '550e8400-e29b-41d4-a716-446655440201',
      'teacher_1b', '王老师(1B)', 'teacher',
      'teacher_1b@school.com', '13700137001',
      password_hash, 'active', NOW(), NOW(),
      '中一B班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440202',
      'teacher_2b', '赵老师(2B)', 'teacher',
      'teacher_2b@school.com', '13700137002',
      password_hash, 'active', NOW(), NOW(),
      '中二B班'
    ),
    (
      '550e8400-e29b-41d4-a716-446655440203',
      'teacher_3a', '孙老师(3A)', 'teacher',
      'teacher_3a@school.com', '13700137003',
      password_hash, 'active', NOW(), NOW(),
      '中三A班'
    )
  ON CONFLICT (username) DO NOTHING;

  GET DIAGNOSTICS v_new_teachers = ROW_COUNT;
  RAISE NOTICE '新增教师: % 个', v_new_teachers;

  -- ============================================
  -- 4. 校务人员 (新增1个，总共2个)
  -- ============================================
  INSERT INTO users (
    id, username, name, role, email, phone,
    password, status, created_at, updated_at
  ) VALUES
    (
      '550e8400-e29b-41d4-a716-446655440301',
      'staff2', '校务人员2', 'school_staff',
      'staff2@school.com', '13600136001',
      password_hash, 'active', NOW(), NOW()
    )
  ON CONFLICT (username) DO NOTHING;

  GET DIAGNOSTICS v_new_staff = ROW_COUNT;
  RAISE NOTICE '新增校务人员: % 个', v_new_staff;

  -- ============================================
  -- 5. 统计最终数据
  -- ============================================
  SELECT COUNT(*) INTO v_total_students FROM users WHERE role = 'student';
  SELECT COUNT(*) INTO v_total_parents FROM users WHERE role = 'parent';
  SELECT COUNT(*) INTO v_total_teachers FROM users WHERE role = 'teacher';
  SELECT COUNT(*) INTO v_total_staff FROM users WHERE role = 'school_staff';

  -- ============================================
  -- 6. 输出结果
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '测试数据生成完成';
  RAISE NOTICE '====================================';
  RAISE NOTICE '新增学生: % 个 (总共 % 个)', v_new_students, v_total_students;
  RAISE NOTICE '新增家长: % 个 (总共 % 个)', v_new_parents, v_total_parents;
  RAISE NOTICE '新增教师: % 个 (总共 % 个)', v_new_teachers, v_total_teachers;
  RAISE NOTICE '新增校务: % 个 (总共 % 个)', v_new_staff, v_total_staff;
  RAISE NOTICE '====================================';

END;
$$;