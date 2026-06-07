# OPA ABAC Policy Bundle
# Smart School Admin System

package school.authz

import future.keywords.if
import future.keywords.in

default allow := false

# ========================
# User Authentication
# ========================
allow if {
    input.action == "auth:login"
    input.user_id != ""
    input.school_id != ""
}

# ========================
# Leave Application Access
# ========================

# 家长可以创建自己孩子的请假申请
allow if {
    input.action == "leave:create"
    input.user_role == "parent"
    input.school_id != ""
    input.student_id != ""
}

# 家长只能查看自己关联学生的请假记录
allow if {
    input.action == "leave:read"
    input.user_role == "parent"
    input.school_id != ""
    # 验证学生关联关系
    data.school[input.school_id].parent_student_links[input.user_id][input.student_id]
}

# 班主任可以查看和审批自己班级的请假申请
allow if {
    input.action == "leave:approve"
    input.user_role == "teacher"
    input.school_id != ""
    data.school[input.school_id].class_teachers[input.user_id][input.class_id]
}

# 校务人员可以处理所有请假申请
allow if {
    input.action == "leave:approve"
    input.user_role == "school_staff"
    input.school_id != ""
}

# 校务主任可以审批所有申请
allow if {
    input.action in ["leave:approve", "leave:reject", "leave:checkin"]
    input.user_role == "school_director"
    input.school_id != ""
}

# 系统管理员拥有全部权限
allow if {
    input.user_role == "system_admin"
    input.action != "auth:login"
}

# ========================
# Parent Inquiry Access
# ========================

# 家长可以提交查询
allow if {
    input.action == "inquiry:create"
    input.user_role == "parent"
    input.school_id != ""
}

# 家长只能查看自己的查询
allow if {
    input.action == "inquiry:read"
    input.user_role == "parent"
    input.inquiry_parent_id == input.user_id
}

# 校务人员可以处理所有查询
allow if {
    input.action in ["inquiry:reply", "inquiry:close"]
    input.user_role in ["school_staff", "school_director"]
    input.school_id != ""
}

# ========================
# Permission Approval Access
# ========================

allow if {
    input.action == "permission:request"
    input.user_role in ["school_admin", "school_staff", "system_admin"]
    input.school_id != ""
}

allow if {
    input.action == "permission:approve"
    input.user_role == "school_admin"
    input.risk_level != "high"
    input.school_id != ""
}

allow if {
    input.action == "permission:approve"
    input.user_role == "system_admin"
}

# ========================
# OTP Management
# ========================

allow if {
    input.action == "otp:bind"
    input.user_id != ""
}

allow if {
    input.action == "otp:verify"
    input.user_id != ""
    input.user_status == "active"
}

allow if {
    input.action == "otp:verify"
    input.user_status == "disabled"
    input.message == "Account is locked due to too many failed attempts"
}

# ========================
# Notification Access
# ========================

allow if {
    input.action == "notification:read"
    input.user_id != ""
    input.recipient_id == input.user_id
}

allow if {
    input.action == "notification:send"
    input.user_role in ["school_staff", "school_director", "system_admin", "teacher"]
    input.school_id != ""
}
