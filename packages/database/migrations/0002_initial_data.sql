-- Insert default system permissions
INSERT INTO permissions (module, code, name_zh, name_en, action) VALUES
('user', 'user.manage', '用户管理', 'User Management', 'manage'),
('user', 'user.view', '查看用户', 'View User', 'view'),
('user', 'user.create', '创建用户', 'Create User', 'create'),
('user', 'user.update', '更新用户', 'Update User', 'update'),
('user', 'user.delete', '删除用户', 'Delete User', 'delete'),
('role', 'role.manage', '角色管理', 'Role Management', 'manage'),
('role', 'role.view', '查看角色', 'View Role', 'view'),
('role', 'role.create', '创建角色', 'Create Role', 'create'),
('role', 'role.update', '更新角色', 'Update Role', 'update'),
('role', 'role.delete', '删除角色', 'Delete Role', 'delete'),
('student', 'student.manage', '学生管理', 'Student Management', 'manage'),
('student', 'student.view', '查看学生', 'View Student', 'view'),
('student', 'student.create', '创建学生', 'Create Student', 'create'),
('student', 'student.update', '更新学生', 'Update Student', 'update'),
('student', 'student.delete', '删除学生', 'Delete Student', 'delete'),
('attendance', 'attendance.manage', '考勤管理', 'Attendance Management', 'manage'),
('attendance', 'attendance.view', '查看考勤', 'View Attendance', 'view'),
('attendance', 'attendance.create', '创建考勤', 'Create Attendance', 'create'),
('attendance', 'attendance.update', '更新考勤', 'Update Attendance', 'update'),
('attendance', 'attendance.delete', '删除考勤', 'Delete Attendance', 'delete'),
('fee', 'fee.manage', '收费管理', 'Fee Management', 'manage'),
('fee', 'fee.view', '查看收费', 'View Fee', 'view'),
('fee', 'fee.create', '创建收费', 'Create Fee', 'create'),
('fee', 'fee.update', '更新收费', 'Update Fee', 'update'),
('fee', 'fee.delete', '删除收费', 'Delete Fee', 'delete'),
('inquiry', 'inquiry.manage', '查询管理', 'Inquiry Management', 'manage'),
('inquiry', 'inquiry.view', '查看查询', 'View Inquiry', 'view'),
('inquiry', 'inquiry.reply', '回复查询', 'Reply Inquiry', 'reply'),
('system', 'system.manage', '系统管理', 'System Management', 'manage'),
('system', 'system.config', '系统配置', 'System Configuration', 'config'),
('system', 'system.log', '系统日志', 'System Logs', 'view');

-- Insert default system roles
INSERT INTO user_roles (school_id, name, code, description, is_system, is_active) VALUES
('00000000-0000-0000-0000-000000000000', '超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', true, true),
('00000000-0000-0000-0000-000000000000', '学校管理员', 'school_admin', '学校管理员，拥有本校所有管理权限', true, true),
('00000000-0000-0000-0000-000000000000', '教师', 'teacher', '教师角色，拥有学生、考勤相关权限', true, true),
('00000000-0000-0000-0000-000000000000', '家长', 'parent', '家长角色，拥有查看自己孩子相关信息权限', true, true);

-- Assign all permissions to super admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur CROSS JOIN permissions p WHERE ur.code = 'super_admin';

-- Insert default system school (for global configuration)
INSERT INTO schools (id, school_code, name_zh, name_en, is_active) VALUES
('00000000-0000-0000-0000-000000000000', 'SYS001', '系统全局', 'System Global', true);

-- Insert default system configs
INSERT INTO system_configs (school_id, config_key, config_value, description) VALUES
('00000000-0000-0000-0000-000000000000', 'system.name', '"智能校园管理系统"', '系统名称'),
('00000000-0000-0000-0000-000000000000', 'system.version', '"1.0.0"', '系统版本'),
('00000000-0000-0000-0000-000000000000', 'attendance.late_threshold', '10', '迟到阈值（分钟）'),
('00000000-0000-0000-0000-000000000000', 'attendance.absent_threshold', '30', '缺席阈值（分钟）'),
('00000000-0000-0000-0000-000000000000', 'notification.sms.enabled', 'false', '是否启用短信通知'),
('00000000-0000-0000-0000-000000000000', 'notification.email.enabled', 'true', '是否启用邮件通知'),
('00000000-0000-0000-0000-000000000000', 'notification.app.enabled', 'true', '是否启用APP通知');
