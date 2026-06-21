-- =====================================================
-- School Admin System - Dashboard Test Data
-- 智能校务助理系统 - 仪表板测试数据
-- =====================================================
-- 生成日期: 2026-06-21
-- 用途: 准备测试数据以展示仪表板功能
-- 执行: docker exec -i school-admin-postgres psql -U school_admin -d school_admin < seed-dashboard-data.sql
-- =====================================================

-- 设置日期为今天
SET datestyle = 'ISO, DMY';

-- =====================================================
-- 1. 班级数据 (Classes)
-- =====================================================
INSERT INTO classes (id, school_id, academic_year_id, class_code, grade, class_name_zh, class_name_en, max_capacity, current_enrollment, is_active, created_at, updated_at) VALUES
('c001', '550e8400-e29b-41d4-a716-446655440001', 'y001', '1A', 'S1', '中一A班', 'Form 1A', 40, 38, true, NOW(), NOW()),
('c002', '550e8400-e29b-41d4-a716-446655440001', 'y001', '1B', 'S1', '中一B班', 'Form 1B', 40, 37, true, NOW(), NOW()),
('c003', '550e8400-e29b-41d4-a716-446655440001', 'y001', '2A', 'S2', '中二A班', 'Form 2A', 40, 39, true, NOW(), NOW()),
('c004', '550e8400-e29b-41d4-a716-446655440001', 'y001', '2B', 'S2', '中二B班', 'Form 2B', 40, 36, true, NOW(), NOW()),
('c005', '550e8400-e29b-41d4-a716-446655440001', 'y001', '3A', 'S3', '中三A班', 'Form 3A', 40, 35, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. 教师数据 (Teachers)
-- =====================================================
INSERT INTO teachers (id, user_id, school_id, teacher_id, qualifications, subjects, teaching_years, is_class_teacher, employment_start_date, is_active, created_at, updated_at) VALUES
('t001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'T001', '["理學士", "教育文憑"]', '["數學", "物理"]', 8, true, '2018-09-01', true, NOW(), NOW()),
('t002', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'T002', '["文學士", "教育文憑"]', '["中文", "歷史"]', 5, true, '2021-09-01', true, NOW(), NOW()),
('t003', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'T003', '["理學士", "教育文憑"]', '["英文", "地理"]', 12, false, '2014-09-01', true, NOW(), NOW()),
('t004', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'T004', '["文學士", "教育文憑"]', '["經濟", "通識"]', 10, true, '2016-09-01', true, NOW(), NOW()),
('t005', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'T005', '["理學士", "教育文憑"]', '["生物", "化學"]', 7, false, '2019-09-01', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 创建教师对应的users记录
INSERT INTO users (id, school_id, user_type, user_code, name_zh, name_en, email, phone, date_of_birth, gender, is_active, created_at, updated_at) VALUES
('u002', '550e8400-e29b-41d4-a716-446655440001', 'teacher', 'T002', '李老師', 'Lee Chi Ming', 'teacher2@school.edu', '13800138010', '1985-03-15', 'M', true, NOW(), NOW()),
('u003', '550e8400-e29b-41d4-a716-446655440001', 'teacher', 'T003', '陳老師', 'Chan Mei Ling', 'teacher3@school.edu', '13800138011', '1980-07-22', 'F', true, NOW(), NOW()),
('u004', '550e8400-e29b-41d4-a716-446655440001', 'teacher', 'T004', '王老師', 'Wang Wei', 'teacher4@school.edu', '13800138012', '1982-11-08', 'M', true, NOW(), NOW()),
('u005', '550e8400-e29b-41d4-a716-446655440001', 'teacher', 'T005', '張老師', 'Zhang Li', 'teacher5@school.edu', '13800138013', '1988-05-30', 'F', true, NOW(), NOW())
ON CONFLICT (user_code) DO NOTHING;

-- 更新teachers的user_id引用
UPDATE teachers SET user_id = 'u002' WHERE teacher_id = 'T002';
UPDATE teachers SET user_id = 'u003' WHERE teacher_id = 'T003';
UPDATE teachers SET user_id = 'u004' WHERE teacher_id = 'T004';
UPDATE teachers SET user_id = 'u005' WHERE teacher_id = 'T005';

-- 分配班主任
UPDATE classes SET homeroom_teacher_id = 't001' WHERE class_code = '1A';
UPDATE classes SET homeroom_teacher_id = 't002' WHERE class_code = '1B';
UPDATE classes SET homeroom_teacher_id = 't003' WHERE class_code = '2A';
UPDATE classes SET homeroom_teacher_id = 't004' WHERE class_code = '2B';
UPDATE classes SET homeroom_teacher_id = 't005' WHERE class_code = '3A';

-- =====================================================
-- 3. 学生数据 (Students)
-- =====================================================
INSERT INTO students (id, school_id, student_id, hkid, name_zh, name_en, date_of_birth, gender, nationality, home_address, photo_url, enrollment_date, is_active, created_at, updated_at) VALUES
-- 中一A班
('s001', '550e8400-e29b-41d4-a716-446655440001', '2024001', 'A123456(7)', '陳大文', 'Chen Tai Man', '2012-05-15', 'M', '香港', '香港九龍黃大仙區', NULL, '2024-09-01', true, NOW(), NOW()),
('s002', '550e8400-e29b-41d4-a716-446655440001', '2024002', 'A234567(8)', '李小明', 'Lee Siu Ming', '2012-08-22', 'M', '香港', '香港新界荃灣區', NULL, '2024-09-01', true, NOW(), NOW()),
('s003', '550e8400-e29b-41d4-a716-446655440001', '2024003', 'A345678(9)', '王小美', 'Wang Siu Mei', '2012-03-10', 'F', '香港', '香港九龍觀塘區', NULL, '2024-09-01', true, NOW(), NOW()),
('s004', '550e8400-e29b-41d4-a716-446655440001', '2024004', 'A456789(0)', '張家豪', 'Cheung Ka Ho', '2012-11-28', 'M', '香港', '香港港島東區', NULL, '2024-09-01', true, NOW(), NOW()),
('s005', '550e8400-e29b-41d4-a716-446655440001', '2024005', 'A567890(1)', '劉雅婷', 'Lau Nga Ting', '2012-07-05', 'F', '香港', '香港新界沙田區', NULL, '2024-09-01', true, NOW(), NOW()),
('s006', '550e8400-e29b-41d4-a716-446655440001', '2024006', 'A678901(2)', '黃志強', 'Wong Chi Keung', '2012-02-14', 'M', '香港', '香港九龍深水埗區', NULL, '2024-09-01', true, NOW(), NOW()),
('s007', '550e8400-e29b-41d4-a716-446655440001', '2024007', 'A789012(3)', '林小娟', 'Lam Siu Kuen', '2012-09-19', 'F', '香港', '香港新界屯門區', NULL, '2024-09-01', true, NOW(), NOW()),
('s008', '550e8400-e29b-41d4-a716-446655440001', '2024008', 'A890123(4)', '鄭傑輝', 'Cheng Kit Fai', '2012-04-03', 'M', '香港', '香港九龍黃大仙區', NULL, '2024-09-01', true, NOW(), NOW()),
-- 中一B班
('s009', '550e8400-e29b-41d4-a716-446655440001', '2024009', 'B123456(7)', '吳美玲', 'Ng Mei Ling', '2012-06-17', 'F', '香港', '香港港島中西區', NULL, '2024-09-01', true, NOW(), NOW()),
('s010', '550e8400-e29b-41d4-a716-446655440001', '2024010', 'B234567(8)', '周子軒', 'Chau Tsz Hin', '2012-10-12', 'M', '香港', '香港新界大埔區', NULL, '2024-09-01', true, NOW(), NOW()),
('s011', '550e8400-e29b-41d4-a716-446655440001', '2024011', 'B345678(9)', '徐文傑', 'Tsui Man Kit', '2012-01-25', 'M', '香港', '香港九龍城區', NULL, '2024-09-01', true, NOW(), NOW()),
('s012', '550e8400-e29b-41d4-a716-446655440001', '2024012', 'B456789(0)', '孫詩雅', 'Suen Si Nga', '2012-12-08', 'F', '香港', '香港新界元朗區', NULL, '2024-09-01', true, NOW(), NOW()),
-- 中二A班
('s013', '550e8400-e29b-41d4-a716-446655440001', '2023013', 'C123456(7)', '馬振東', 'Ma Chun Tung', '2011-05-20', 'M', '香港', '香港九龍觀塘區', NULL, '2023-09-01', true, NOW(), NOW()),
('s014', '550e8400-e29b-41d4-a716-446655440001', '2023014', 'C234567(8)', '梁淑芬', 'Leung Suk Fan', '2011-08-15', 'F', '香港', '香港新界荃灣區', NULL, '2023-09-01', true, NOW(), NOW()),
('s015', '550e8400-e29b-41d4-a716-446655440001', '2023015', 'C345678(9)', '郭家俊', 'Kwok Ka Chun', '2011-03-28', 'M', '香港', '香港港島東區', NULL, '2023-09-01', true, NOW(), NOW()),
('s016', '550e8400-e29b-41d4-a716-446655440001', '2023016', 'C456789(0)', '何詠欣', 'Ho Wing Yan', '2011-11-02', 'F', '香港', '香港九龍深水埗區', NULL, '2023-09-01', true, NOW(), NOW()),
-- 中二B班
('s017', '550e8400-e29b-41d4-a716-446655440001', '2023017', 'D123456(7)', '羅志誠', 'Lo Chi Shing', '2011-07-11', 'M', '香港', '香港新界沙田區', NULL, '2023-09-01', true, NOW(), NOW()),
('s018', '550e8400-e29b-41d4-a716-446655440001', '2023018', 'D234567(8)', '蘇美琪', 'So Mei Kei', '2011-02-23', 'F', '香港', '香港港島中西區', NULL, '2023-09-01', true, NOW(), NOW()),
('s019', '550e8400-e29b-41d4-a716-446655440001', '2023019', 'D345678(9)', '楊志榮', 'Yeung Chi Wing', '2011-09-30', 'M', '香港', '香港新界屯門區', NULL, '2023-09-01', true, NOW(), NOW()),
-- 中三A班
('s020', '550e8400-e29b-41d4-a716-446655440001', '2022020', 'E123456(7)', '劉詩婷', 'Lau Sze Ting', '2010-06-08', 'F', '香港', '香港九龍黃大仙區', NULL, '2022-09-01', true, NOW(), NOW()),
('s021', '550e8400-e29b-41d4-a716-446655440001', '2022021', 'E234567(8)', '謝文龍', 'Tse Man Lung', '2010-10-15', 'M', '香港', '香港新界大埔區', NULL, '2022-09-01', true, NOW(), NOW()),
('s022', '550e8400-e29b-41d4-a716-446655440001', '2022022', 'E345678(9)', '陳慧琳', 'Chan Wai Lam', '2010-04-22', 'F', '香港', '香港九龍城區', NULL, '2022-09-01', true, NOW(), NOW()),
('s023', '550e8400-e29b-41d4-a716-446655440001', '2022023', 'E456789(0)', '鄭志豪', 'Cheng Chi Ho', '2010-12-03', 'M', '香港', '香港新界元朗區', NULL, '2022-09-01', true, NOW(), NOW())
ON CONFLICT (student_id) DO NOTHING;

-- =====================================================
-- 4. 班级分配 (Class Allocations)
-- =====================================================
INSERT INTO class_allocations (id, school_id, academic_year_id, student_id, class_id, allocation_id, is_primary, enrolled_at, created_at, updated_at) VALUES
-- 中一A班
('ca001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's001', 'c001', 'A001', true, '2024-09-01', NOW(), NOW()),
('ca002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's002', 'c001', 'A002', true, '2024-09-01', NOW(), NOW()),
('ca003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's003', 'c001', 'A003', true, '2024-09-01', NOW(), NOW()),
('ca004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's004', 'c001', 'A004', true, '2024-09-01', NOW(), NOW()),
('ca005', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's005', 'c001', 'A005', true, '2024-09-01', NOW(), NOW()),
('ca006', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's006', 'c001', 'A006', true, '2024-09-01', NOW(), NOW()),
('ca007', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's007', 'c001', 'A007', true, '2024-09-01', NOW(), NOW()),
('ca008', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's008', 'c001', 'A008', true, '2024-09-01', NOW(), NOW()),
-- 中一B班
('ca009', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's009', 'c002', 'B001', true, '2024-09-01', NOW(), NOW()),
('ca010', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's010', 'c002', 'B002', true, '2024-09-01', NOW(), NOW()),
('ca011', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's011', 'c002', 'B003', true, '2024-09-01', NOW(), NOW()),
('ca012', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's012', 'c002', 'B004', true, '2024-09-01', NOW(), NOW()),
-- 中二A班
('ca013', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's013', 'c003', 'C001', true, '2023-09-01', NOW(), NOW()),
('ca014', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's014', 'c003', 'C002', true, '2023-09-01', NOW(), NOW()),
('ca015', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's015', 'c003', 'C003', true, '2023-09-01', NOW(), NOW()),
('ca016', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's016', 'c003', 'C004', true, '2023-09-01', NOW(), NOW()),
-- 中二B班
('ca017', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's017', 'c004', 'D001', true, '2023-09-01', NOW(), NOW()),
('ca018', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's018', 'c004', 'D002', true, '2023-09-01', NOW(), NOW()),
('ca019', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's019', 'c004', 'D003', true, '2023-09-01', NOW(), NOW()),
-- 中三A班
('ca020', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's020', 'c005', 'E001', true, '2022-09-01', NOW(), NOW()),
('ca021', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's021', 'c005', 'E002', true, '2022-09-01', NOW(), NOW()),
('ca022', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's022', 'c005', 'E003', true, '2022-09-01', NOW(), NOW()),
('ca023', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's023', 'c005', 'E004', true, '2022-09-01', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. 家长数据 (Parents) - 关联学生
-- =====================================================
INSERT INTO parents (id, user_id, school_id, parent_id, relationship, occupation, phone_primary, phone_secondary, email_primary, email_secondary, is_primary_contact, is_active, created_at, updated_at) VALUES
('p001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'P001', 'father', '工程師', '13800138020', NULL, 'parent1@example.com', NULL, true, true, NOW(), NOW()),
('p002', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'P002', 'mother', '教師', '13800138021', NULL, 'parent2@example.com', NULL, true, true, NOW(), NOW()),
('p003', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'P003', 'father', '商人', '13800138022', NULL, 'parent3@example.com', NULL, true, true, NOW(), NOW()),
('p004', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'P004', 'mother', '家庭主婦', '13800138023', NULL, 'parent4@example.com', NULL, true, true, NOW(), NOW()),
('p005', uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'P005', 'father', '醫生', '13800138024', NULL, 'parent5@example.com', NULL, true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 创建更多家长对应的users记录
INSERT INTO users (id, school_id, user_type, user_code, name_zh, name_en, email, phone, date_of_birth, gender, is_active, created_at, updated_at) VALUES
('u006', '550e8400-e29b-41d4-a716-446655440001', 'parent', 'P002', '李小明父親', 'Lee Siu Ming Father', 'parent2@example.com', '13800138021', '1975-08-22', 'M', true, NOW(), NOW()),
('u007', '550e8400-e29b-41d4-a716-446655440001', 'parent', 'P003', '王小美母親', 'Wang Siu Mei Mother', 'parent3@example.com', '13800138022', '1980-03-10', 'F', true, NOW(), NOW()),
('u008', '550e8400-e29b-41d4-a716-446655440001', 'parent', 'P004', '張家豪父親', 'Cheung Ka Ho Father', 'parent4@example.com', '13800138023', '1978-11-28', 'M', true, NOW(), NOW()),
('u009', '550e8400-e29b-41d4-a716-446655440001', 'parent', 'P005', '劉雅婷母親', 'Lau Nga Ting Mother', 'parent5@example.com', '13800138024', '1982-07-05', 'F', true, NOW(), NOW())
ON CONFLICT (user_code) DO NOTHING;

-- 更新parents的user_id引用
UPDATE parents SET user_id = 'u006' WHERE parent_id = 'P002';
UPDATE parents SET user_id = 'u007' WHERE parent_id = 'P003';
UPDATE parents SET user_id = 'u008' WHERE parent_id = 'P004';
UPDATE parents SET user_id = 'u009' WHERE parent_id = 'P005';

-- 学生-家长关联
INSERT INTO student_parent_relations (id, school_id, student_id, parent_id, relationship, custody_type, is_primary_contact, is_emergency_contact, created_at, updated_at) VALUES
('spr001', '550e8400-e29b-41d4-a716-446655440001', 's001', 'p001', '父子', 'joint', true, true, NOW(), NOW()),
('spr002', '550e8400-e29b-41d4-a716-446655440001', 's002', 'p002', '母女', 'joint', true, true, NOW(), NOW()),
('spr003', '550e8400-e29b-41d4-a716-446655440001', 's003', 'p003', '父女', 'sole', true, true, NOW(), NOW()),
('spr004', '550e8400-e29b-41d4-a716-446655440001', 's004', 'p004', '母子', 'joint', true, true, NOW(), NOW()),
('spr005', '550e8400-e29b-41d4-a716-446655440001', 's005', 'p005', '母女', 'joint', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. 今日出勤记录 (Student Attendance) - 2026-06-21
-- =====================================================
INSERT INTO student_attendance (id, school_id, academic_year_id, class_id, student_id, attendance_date, attendance_type, arrival_time, departure_time, status, notes, created_at, updated_at) VALUES
-- 中一A班: 8人出勤，正常
('att001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's001', '2026-06-21', 'present', '07:45:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's002', '2026-06-21', 'late', '08:15:00', '15:30:00', 'late', '迟到30分钟', NOW(), NOW()),
('att003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's003', '2026-06-21', 'present', '07:50:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's004', '2026-06-21', 'present', '07:55:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att005', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's005', '2026-06-21', 'present', '08:00:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att006', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's006', '2026-06-21', 'leave_early', '07:40:00', '14:00:00', 'leave_early', '早退-牙医预约', NOW(), NOW()),
('att007', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's007', '2026-06-21', 'present', '07:48:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att008', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', 's008', '2026-06-21', 'absent', NULL, NULL, 'absent', '病假-已获批准', NOW(), NOW()),
-- 中一B班: 4人出勤，1人迟到
('att009', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c002', 's009', '2026-06-21', 'present', '07:50:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att010', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c002', 's010', '2026-06-21', 'late', '08:20:00', '15:30:00', 'late', '迟到40分钟', NOW(), NOW()),
('att011', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c002', 's011', '2026-06-21', 'present', '07:55:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att012', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c002', 's012', '2026-06-21', 'present', '08:00:00', '15:30:00', 'present', NULL, NOW(), NOW()),
-- 中二A班: 4人出勤，1人早退
('att013', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c003', 's013', '2026-06-21', 'present', '07:45:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att014', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c003', 's014', '2026-06-21', 'present', '07:50:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att015', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c003', 's015', '2026-06-21', 'leave_early', '07:40:00', '13:00:00', 'leave_early', '早退-体育比赛', NOW(), NOW()),
('att016', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c003', 's016', '2026-06-21', 'present', '07:55:00', '15:30:00', 'present', NULL, NOW(), NOW()),
-- 中二B班: 3人出勤，全部正常
('att017', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c004', 's017', '2026-06-21', 'present', '07:48:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att018', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c004', 's018', '2026-06-21', 'present', '07:52:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att019', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c004', 's019', '2026-06-21', 'present', '07:45:00', '15:30:00', 'present', NULL, NOW(), NOW()),
-- 中三A班: 4人出勤，1人缺勤
('att020', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c005', 's020', '2026-06-21', 'present', '07:50:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att021', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c005', 's021', '2026-06-21', 'absent', NULL, NULL, 'absent', '病假-发烧', NOW(), NOW()),
('att022', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c005', 's022', '2026-06-21', 'present', '07:55:00', '15:30:00', 'present', NULL, NOW(), NOW()),
('att023', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c005', 's023', '2026-06-21', 'present', '07:40:00', '15:30:00', 'present', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. 教师考勤记录 (Staff Attendance) - 2026-06-21
-- =====================================================
INSERT INTO staff_attendance (id, school_id, staff_id, attendance_date, check_in_time, check_out_time, status, work_type, notes, created_at, updated_at) VALUES
('sta001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2026-06-21', '07:30:00', '17:00:00', 'present', 'regular', NULL, NOW(), NOW()),
('sta002', '550e8400-e29b-41d4-a716-446655440001', 't001', '2026-06-21', '07:40:00', '16:30:00', 'present', 'regular', NULL, NOW(), NOW()),
('sta003', '550e8400-e29b-41d4-a716-446655440001', 't002', '2026-06-21', '07:35:00', '16:00:00', 'present', 'regular', NULL, NOW(), NOW()),
('sta004', '550e8400-e29b-41d4-a716-446655440001', 't003', '2026-06-21', '07:45:00', NULL, 'late', 'regular', '迟到15分钟', NOW(), NOW()),
('sta005', '550e8400-e29b-41d4-a716-446655440001', 't004', '2026-06-21', '07:30:00', '16:30:00', 'present', 'regular', NULL, NOW(), NOW()),
('sta006', '550e8400-e29b-41d4-a716-446655440001', 't005', '2026-06-21', NULL, NULL, 'absent', 'sick', '病假', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. 家长查询记录 (Parent Queries)
-- =====================================================
INSERT INTO parent_queries (id, school_id, parent_id, student_id, query_type, subject, description, status, priority, submitted_at, assigned_to, resolved_at, created_at, updated_at) VALUES
('pq001', '550e8400-e29b-41d4-a716-446655440001', 'p001', 's001', 'attendance', '出勤問題', '請問為什麼我的孩子昨天的出勤記錄顯示為缺勤？', 'pending', 'urgent', NOW(), '550e8400-e29b-41d4-a716-446655440002', NULL, NOW(), NOW()),
('pq002', '550e8400-e29b-41d4-a716-446655440001', 'p002', 's002', 'finance', '學費繳費', '我想詢問下學期的學費標準是否有調整', 'pending', 'normal', NOW(), NULL, NULL, NOW(), NOW()),
('pq003', '550e8400-e29b-41d4-a716-446655440001', 'p003', 's003', 'general', '校服問題', '學校是否有指定的校服供應商？', 'pending', 'low', NOW(), NULL, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. 校车状态 (School Bus Status)
-- =====================================================
INSERT INTO school_bus_status (id, school_id, bus_number, bus_route, driver_name, driver_phone, status, arrival_time, departure_time, capacity, current_passengers, notes, created_at, updated_at) VALUES
('bus001', '550e8400-e29b-41d4-a716-446655440001', 'BUS01', '路線A-九龍東', '張司機', '13800901001', 'arrived', '07:25:00', '16:00:00', 45, 38, '正常運作', NOW(), NOW()),
('bus002', '550e8400-e29b-41d4-a716-446655440001', 'BUS02', '路線B-新界東', '李司機', '13800901002', 'arrived', '07:30:00', '16:05:00', 45, 42, '正常運作', NOW(), NOW()),
('bus003', '550e8400-e29b-41d4-a716-446655440001', 'BUS03', '路線C-港島區', '王司機', '13800901003', 'arrived', '07:20:00', '15:55:00', 40, 35, '正常運作', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. 午餐订单 (Lunch Orders) - 2026-06-21
-- =====================================================
INSERT INTO lunch_orders (id, school_id, academic_year_id, class_id, order_date, total_orders, special_diet_orders, supplier, status, created_at, updated_at) VALUES
('lo001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c001', '2026-06-21', 8, 1, '美味膳食', 'confirmed', NOW(), NOW()),
('lo002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c002', '2026-06-21', 4, 0, '美味膳食', 'confirmed', NOW(), NOW()),
('lo003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c003', '2026-06-21', 4, 1, '美味膳食', 'confirmed', NOW(), NOW()),
('lo004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c004', '2026-06-21', 3, 0, '美味膳食', 'confirmed', NOW(), NOW()),
('lo005', '550e8400-e29b-41d4-a716-446655440001', 'y001', 'c005', '2026-06-21', 4, 1, '美味膳食', 'confirmed', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. 请假申请 (Leave Applications)
-- =====================================================
INSERT INTO leave_applications (id, school_id, academic_year_id, applicant_id, applicant_type, leave_type, start_date, end_date, total_days, reason, status, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at) VALUES
('la001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's008', 'student', 'sick', '2026-06-21', '2026-06-22', 2, '發燒，醫生建議休息兩天', 'approved', NOW() - INTERVAL '2 hours', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 hour', NULL, NOW(), NOW()),
('la002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's006', 'student', 'personal', '2026-06-21', '2026-06-21', 0.5, '牙醫預約', 'approved', NOW() - INTERVAL '5 hours', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '4 hours', NULL, NOW(), NOW()),
('la003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 't005', 'teacher', 'sick', '2026-06-21', '2026-06-22', 2, '身體不適，醫生建議休息', 'approved', NOW() - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '20 hours', NULL, NOW(), NOW()),
('la004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's021', 'student', 'sick', '2026-06-21', '2026-06-23', 3, '發燒，需要在家休息', 'pending', NOW() - INTERVAL '3 hours', NULL, NULL, NULL, NOW(), NOW()),
('la005', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's015', 'student', 'other', '2026-06-21', '2026-06-21', 0.5, '校際體育比賽', 'approved', NOW() - INTERVAL '6 hours', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '5 hours', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. 学费管理数据 (Tuition Fees)
-- =====================================================
INSERT INTO tuition_fees (id, school_id, academic_year_id, student_id, grade_level, fee_type, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at) VALUES
('tf001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's001', 'S1', 'tuition', 50000.00, 'paid', '2024-09-15', '2024-09-10', 'bank_transfer', 'REC001', NOW(), NOW()),
('tf002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's002', 'S1', 'tuition', 50000.00, 'paid', '2024-09-15', '2024-09-12', 'bank_transfer', 'REC002', NOW(), NOW()),
('tf003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's003', 'S1', 'tuition', 50000.00, 'partial', '2024-09-15', '2024-09-08', 'cash', 'REC003', NOW(), NOW()),
('tf004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's013', 'S2', 'tuition', 52000.00, 'paid', '2024-09-15', '2024-09-10', 'fps', 'REC004', NOW(), NOW()),
('tf005', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's020', 'S3', 'tuition', 54000.00, 'overdue', '2024-09-15', NULL, NULL, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. 费用管理数据 (Other Fees)
-- =====================================================
INSERT INTO fee_records (id, school_id, academic_year_id, student_id, fee_category, fee_name, amount, payment_status, due_date, paid_date, payment_method, receipt_number, created_at, updated_at) VALUES
('fr001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's001', 'uniform', '校服費', 1500.00, 'paid', '2024-09-01', '2024-08-25', 'cash', 'FR001', NOW(), NOW()),
('fr002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's002', 'textbook', '課本費', 2500.00, 'paid', '2024-09-01', '2024-08-28', 'fps', 'FR002', NOW(), NOW()),
('fr003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's003', 'miscellaneous', '雜費', 1000.00, 'paid', '2024-09-01', '2024-08-30', 'bank_transfer', 'FR003', NOW(), NOW()),
('fr004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's013', 'uniform', '校服費', 1500.00, 'pending', '2024-09-01', NULL, NULL, NULL, NOW(), NOW()),
('fr005', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's020', 'activity', '活動費', 800.00, 'paid', '2024-09-01', '2024-08-20', 'cash', 'FR005', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 14. 奖学金管理数据 (Scholarships)
-- =====================================================
INSERT INTO scholarship_records (id, school_id, academic_year_id, student_id, scholarship_type, scholarship_name, amount, award_type, status, awarded_date, certificate_number, notes, created_at, updated_at) VALUES
('sr001', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's001', 'academic', '學業成績優異獎', 5000.00, 'cash', 'awarded', '2024-10-15', 'SCH001', '2024-2025學年第一學期成績優異', NOW(), NOW()),
('sr002', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's002', 'behavior', '品行良好獎', 2000.00, 'book_voucher', 'awarded', '2024-10-15', 'SCH002', '2024-2025學年第一學期品行優異', NOW(), NOW()),
('sr003', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's013', 'academic', '學業成績優異獎', 5000.00, 'cash', 'awarded', '2024-10-15', 'SCH003', '2024-2025學年第一學期成績優異', NOW(), NOW()),
('sr004', '550e8400-e29b-41d4-a716-446655440001', 'y001', 's020', 'special', '體育傑出獎', 3000.00, 'cash', 'awarded', '2024-10-15', 'SCH004', '校際田徑比賽第三名', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 验证数据创建结果
-- =====================================================
SELECT '=== 数据统计 ===' as info;

SELECT '班级' as type, COUNT(*) as count FROM classes WHERE is_active = true
UNION ALL
SELECT '学生', COUNT(*) FROM students WHERE is_active = true
UNION ALL
SELECT '教师', COUNT(*) FROM teachers WHERE is_active = true
UNION ALL
SELECT '家长', COUNT(*) FROM parents WHERE is_active = true
UNION ALL
SELECT '今日出勤记录', COUNT(*) FROM student_attendance WHERE attendance_date = '2026-06-21'
UNION ALL
SELECT '教师考勤记录', COUNT(*) FROM staff_attendance WHERE attendance_date = '2026-06-21'
UNION ALL
SELECT '家长查询', COUNT(*) FROM parent_queries WHERE status = 'pending'
UNION ALL
SELECT '校车', COUNT(*) FROM school_bus_status WHERE status = 'arrived'
UNION ALL
SELECT '午餐订单', SUM(total_orders) FROM lunch_orders WHERE order_date = '2026-06-21'
UNION ALL
SELECT '待审批请假', COUNT(*) FROM leave_applications WHERE status = 'pending';

SELECT '=== 今日出勤概览 (2026-06-21) ===' as info;
SELECT
    c.class_name_zh as 班级,
    COUNT(CASE WHEN sa.status = 'present' THEN 1 END) as 出勤,
    COUNT(CASE WHEN sa.status = 'late' THEN 1 END) as 迟到,
    COUNT(CASE WHEN sa.status = 'leave_early' THEN 1 END) as 早退,
    COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as 缺勤,
    COUNT(*) as 总人数
FROM student_attendance sa
JOIN classes c ON sa.class_id = c.id
WHERE sa.attendance_date = '2026-06-21'
GROUP BY c.class_code, c.class_name_zh
ORDER BY c.class_code;

SELECT '=== 待处理项目 ===' as info;
SELECT
    '家长查询' as 类型,
    COUNT(*) as 数量,
    SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as 紧急
FROM parent_queries
WHERE status = 'pending'
UNION ALL
SELECT
    '请假申请',
    COUNT(*),
    SUM(CASE WHEN leave_type = 'sick' THEN 1 ELSE 0 END)
FROM leave_applications
WHERE status = 'pending'
UNION ALL
SELECT
    '逾期学费',
    COUNT(*),
    0
FROM tuition_fees
WHERE payment_status = 'overdue';

SELECT '✅ 测试数据准备完成！' as info;