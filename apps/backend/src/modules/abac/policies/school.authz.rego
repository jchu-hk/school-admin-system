# school.authz - 智能校务助理系统 ABAC 权限规则
# Package: school.authz
# Version: 1.0.0
# Description: 基于属性的访问控制（ABAC）细粒度权限规则
# 适用标准: PDPO 香港隐私条例 / NIST ABAC Guidelines

package school.authz

import future.keywords.if
import future.keywords.in

# ============================================================
# 全局默认策略
# ============================================================

# 默认拒绝所有未明确允许的请求
default allow = false

# ============================================================
# 规则1: 教师只能查看本班学生数据
# Rule 1: Teachers can only view students in their assigned class
# ============================================================
# 逻辑说明:
# - 教师角色 (TEACHER)
# - 操作类型: read (读取)
# - 资源类型: student (学生档案)
# - 约束条件: 学生的班级ID必须在教师所教的班级列表中
# ============================================================

teacher_can_read_own_class_students if {
    input.role == "TEACHER"
    input.action == "read"
    input.resource == "student"
    teacher_class_ids := input.user.classIds
    teacher_class_ids[_] == input.resourceData.classId
}

# 教师可以查看本班学生的分数
teacher_can_read_own_class_scores if {
    input.role == "TEACHER"
    input.action == "read"
    input.resource == "score"
    teacher_class_ids := input.user.classIds
    teacher_class_ids[_] == input.resourceData.classId
}

# 教师可以查看本班的考勤记录
teacher_can_read_own_class_attendance if {
    input.role == "TEACHER"
    input.action == "read"
    input.resource == "attendance"
    teacher_class_ids := input.user.classIds
    teacher_class_ids[_] == input.resourceData.classId
}

# 教师可以提交本班学生的请假申请
teacher_can_create_own_class_leave if {
    input.role == "TEACHER"
    input.action == "create"
    input.resource == "leave"
    teacher_class_ids := input.user.classIds
    teacher_class_ids[_] == input.resourceData.classId
}

# ============================================================
# 规则2: 家长只能查看自己关联的学生数据
# Rule 2: Parents can only view data of their linked students
# ============================================================
# 逻辑说明:
# - 家长角色 (PARENT)
# - 操作类型: read (读取)
# - 资源类型: student (学生档案) / score (成绩) / attendance (考勤)
# - 约束条件: 学生的家长ID必须与当前用户ID匹配
# ============================================================

parent_can_read_own_student_profile if {
    input.role == "PARENT"
    input.action == "read"
    input.resource == "student"
    parent_student_ids := input.user.relatedStudentIds
    parent_student_ids[_] == input.resourceData.studentId
}

parent_can_read_own_student_scores if {
    input.role == "PARENT"
    input.action == "read"
    input.resource == "score"
    parent_student_ids := input.user.relatedStudentIds
    parent_student_ids[_] == input.resourceData.studentId
}

parent_can_read_own_student_attendance if {
    input.role == "PARENT"
    input.action == "read"
    input.resource == "attendance"
    parent_student_ids := input.user.relatedStudentIds
    parent_student_ids[_] == input.resourceData.studentId
}

# 家长可以创建自己孩子的请假申请
parent_can_create_own_student_leave if {
    input.role == "PARENT"
    input.action == "create"
    input.resource == "leave"
    parent_student_ids := input.user.relatedStudentIds
    parent_student_ids[_] == input.resourceData.studentId
}

# ============================================================
# 规则3: 财务人员工作时间限制
# Rule 3: Finance staff work-hour restrictions
# ============================================================
# 逻辑说明:
# - 财务人员角色 (FINANCE_STAFF)
# - 资源类型: finance (财务数据)
# - 约束条件:
#   - 当前时间必须在 09:00 - 18:00 之间
#   - 当前日期必须是周一至周五（工作日）
# ============================================================

finance_staff_work_hours_access if {
    input.role == "FINANCE_STAFF"
    input.resource == "finance"
    current_time := input.currentTime
    current_weekday := input.weekday

    # 时间格式: "HH:MM" (如 "09:30")
    time_ge(current_time, "09:00")
    time_le(current_time, "18:00")
    weekday_in_workdays(current_weekday)
}

# 财务人员工作时间外需要校务主任额外授权
finance_staff_after_hours_with_override if {
    input.role == "FINANCE_STAFF"
    input.resource == "finance"
    input.user.hasOverride == true
}

# ============================================================
# 规则4: 批量数据导出需要校务主任权限
# Rule 4: Bulk data export requires school director privilege
# ============================================================
# 逻辑说明:
# - 校务主任角色 (SCHOOL_DIRECTOR)
# - 操作类型: export (批量导出)
# - 资源类型: student / score / attendance / finance / report
# ============================================================

school_director_can_export_all_data if {
    input.role == "SCHOOL_DIRECTOR"
    input.action == "export"
}

school_director_can_export_finance if {
    input.role == "SCHOOL_DIRECTOR"
    input.action == "export"
    input.resource == "finance"
}

# ============================================================
# 通用权限规则
# ============================================================

# 校务主任拥有全部读写权限
school_director_full_access if {
    input.role == "SCHOOL_DIRECTOR"
    input.action in ["read", "create", "update", "delete", "export", "print"]
}

# 校务处同工拥有业务范围内权限
officer_business_scope if {
    input.role == "OFFICER"
    input.action in ["read", "create", "update"]
    input.resource in ["student", "attendance", "leave", "inquiry", "notification"]
}

# 系统管理员拥有系统级全部权限
system_admin_full_access if {
    input.role == "SYSTEM_ADMIN"
    input.action in ["read", "create", "update", "delete", "export", "print", "admin"]
}

# ============================================================
# 辅助函数 (Functions)
# ============================================================

# 时间比较: time >= threshold
time_ge(time_str, threshold) if {
    time_str >= threshold
}

# 时间比较: time <= threshold
time_le(time_str, threshold) if {
    time_str <= threshold
}

# 判断是否为工作日 (周一至周五)
weekday_in_workdays(w) if {
    w in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}

# ============================================================
# 最终 allow 决策规则
# ============================================================

allow if {
    # 校务主任全权限
    school_director_full_access
}

allow if {
    # 教师本班学生访问
    teacher_can_read_own_class_students
}

allow if {
    # 教师本班分数访问
    teacher_can_read_own_class_scores
}

allow if {
    # 教师本班考勤访问
    teacher_can_read_own_class_attendance
}

allow if {
    # 教师提交本班请假
    teacher_can_create_own_class_leave
}

allow if {
    # 家长查看自己孩子档案
    parent_can_read_own_student_profile
}

allow if {
    # 家长查看自己孩子成绩
    parent_can_read_own_student_scores
}

allow if {
    # 家长查看自己孩子考勤
    parent_can_read_own_student_attendance
}

allow if {
    # 家长提交孩子请假
    parent_can_create_own_student_leave
}

allow if {
    # 财务工作时间访问
    finance_staff_work_hours_access
}

allow if {
    # 财务工作时间外需特殊授权
    finance_staff_after_hours_with_override
}

allow if {
    # 校务主任批量导出
    school_director_can_export_all_data
}

allow if {
    # 校务主任财务导出
    school_director_can_export_finance
}

allow if {
    # 校务处同工业业务范围
    officer_business_scope
}

allow if {
    # 系统管理员全权限
    system_admin_full_access
}
