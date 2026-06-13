# school.authz.tests - Rego 单元测试
# 测试 OPA v0.65.x 内置的opa test命令

package school.authz

# ============================================================
# 规则1测试: 教师只能查看本班学生数据
# ============================================================

test_teacher_can_read_own_class_students_success if {
    allow with input as {
        "role": "TEACHER",
        "action": "read",
        "resource": "student",
        "user": {
            "id": "user-001",
            "classIds": ["1A", "2B"]
        },
        "resourceData": {
            "classId": "1A",
            "studentId": "stu-001"
        }
    }
}

test_teacher_cannot_read_other_class_students if {
    not allow with input as {
        "role": "TEACHER",
        "action": "read",
        "resource": "student",
        "user": {
            "id": "user-001",
            "classIds": ["1A", "2B"]
        },
        "resourceData": {
            "classId": "3C",
            "studentId": "stu-002"
        }
    }
}

test_teacher_cannot_read_without_class_id if {
    not allow with input as {
        "role": "TEACHER",
        "action": "read",
        "resource": "student",
        "user": {
            "id": "user-001",
            "classIds": ["1A"]
        },
        "resourceData": {}
    }
}

test_teacher_can_read_own_class_attendance if {
    allow with input as {
        "role": "TEACHER",
        "action": "read",
        "resource": "attendance",
        "user": {
            "id": "user-001",
            "classIds": ["1A"]
        },
        "resourceData": {
            "classId": "1A"
        }
    }
}

test_teacher_can_create_leave_for_own_class if {
    allow with input as {
        "role": "TEACHER",
        "action": "create",
        "resource": "leave",
        "user": {
            "id": "user-001",
            "classIds": ["1A"]
        },
        "resourceData": {
            "classId": "1A"
        }
    }
}

# ============================================================
# 规则2测试: 家长只能查看自己关联的学生数据
# ============================================================

test_parent_can_read_own_student_profile_success if {
    allow with input as {
        "role": "PARENT",
        "action": "read",
        "resource": "student",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001", "stu-002"]
        },
        "resourceData": {
            "studentId": "stu-001"
        }
    }
}

test_parent_cannot_read_other_student_profile if {
    not allow with input as {
        "role": "PARENT",
        "action": "read",
        "resource": "student",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001"]
        },
        "resourceData": {
            "studentId": "stu-999"
        }
    }
}

test_parent_can_read_own_student_scores if {
    allow with input as {
        "role": "PARENT",
        "action": "read",
        "resource": "score",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001"]
        },
        "resourceData": {
            "studentId": "stu-001"
        }
    }
}

test_parent_cannot_read_other_student_scores if {
    not allow with input as {
        "role": "PARENT",
        "action": "read",
        "resource": "score",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001"]
        },
        "resourceData": {
            "studentId": "stu-002"
        }
    }
}

test_parent_can_read_own_student_attendance if {
    allow with input as {
        "role": "PARENT",
        "action": "read",
        "resource": "attendance",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001"]
        },
        "resourceData": {
            "studentId": "stu-001"
        }
    }
}

test_parent_can_create_leave_for_own_student if {
    allow with input as {
        "role": "PARENT",
        "action": "create",
        "resource": "leave",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001"]
        },
        "resourceData": {
            "studentId": "stu-001"
        }
    }
}

# ============================================================
# 规则3测试: 财务人员工作时间限制
# ============================================================

test_finance_staff_work_hours_weekday_9am if {
    allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "09:00",
        "weekday": "Monday"
    }
}

test_finance_staff_work_hours_weekday_12pm if {
    allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "12:30",
        "weekday": "Wednesday"
    }
}

test_finance_staff_work_hours_weekday_5pm if {
    allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "17:59",
        "weekday": "Friday"
    }
}

test_finance_staff_work_hours_weekday_6pm_boundary if {
    allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "18:00",
        "weekday": "Friday"
    }
}

test_finance_staff_denied_before_9am if {
    not allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "08:59",
        "weekday": "Monday"
    }
}

test_finance_staff_denied_after_6pm if {
    not allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "18:01",
        "weekday": "Monday"
    }
}

test_finance_staff_denied_weekend_saturday if {
    not allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "10:00",
        "weekday": "Saturday"
    }
}

test_finance_staff_denied_weekend_sunday if {
    not allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001"},
        "currentTime": "14:00",
        "weekday": "Sunday"
    }
}

test_finance_staff_with_override_can_access if {
    allow with input as {
        "role": "FINANCE_STAFF",
        "action": "read",
        "resource": "finance",
        "user": {"id": "finance-001", "hasOverride": true},
        "currentTime": "20:00",
        "weekday": "Saturday"
    }
}

# ============================================================
# 规则4测试: 批量数据导出需要校务主任权限
# ============================================================

test_school_director_can_export_students if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "export",
        "resource": "student",
        "user": {"id": "director-001"}
    }
}

test_school_director_can_export_finance if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "export",
        "resource": "finance",
        "user": {"id": "director-001"}
    }
}

test_school_director_can_export_attendance if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "export",
        "resource": "attendance",
        "user": {"id": "director-001"}
    }
}

test_school_director_can_export_report if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "export",
        "resource": "report",
        "user": {"id": "director-001"}
    }
}

test_teacher_cannot_export_students if {
    not allow with input as {
        "role": "TEACHER",
        "action": "export",
        "resource": "student",
        "user": {
            "id": "teacher-001",
            "classIds": ["1A"]
        }
    }
}

test_parent_cannot_export_students if {
    not allow with input as {
        "role": "PARENT",
        "action": "export",
        "resource": "student",
        "user": {
            "id": "parent-001",
            "relatedStudentIds": ["stu-001"]
        }
    }
}

test_finance_staff_cannot_export_students if {
    not allow with input as {
        "role": "FINANCE_STAFF",
        "action": "export",
        "resource": "student",
        "user": {"id": "finance-001"}
    }
}

# ============================================================
# 通用权限测试
# ============================================================

test_school_director_full_access_read if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "read",
        "resource": "any_resource",
        "user": {"id": "director-001"}
    }
}

test_school_director_full_access_create if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "create",
        "resource": "any_resource",
        "user": {"id": "director-001"}
    }
}

test_school_director_full_access_delete if {
    allow with input as {
        "role": "SCHOOL_DIRECTOR",
        "action": "delete",
        "resource": "any_resource",
        "user": {"id": "director-001"}
    }
}

test_officer_can_read_student if {
    allow with input as {
        "role": "OFFICER",
        "action": "read",
        "resource": "student",
        "user": {"id": "officer-001"}
    }
}

test_officer_can_create_attendance if {
    allow with input as {
        "role": "OFFICER",
        "action": "create",
        "resource": "attendance",
        "user": {"id": "officer-001"}
    }
}

test_officer_cannot_export if {
    not allow with input as {
        "role": "OFFICER",
        "action": "export",
        "resource": "student",
        "user": {"id": "officer-001"}
    }
}

test_system_admin_full_access if {
    allow with input as {
        "role": "SYSTEM_ADMIN",
        "action": "admin",
        "resource": "system_config",
        "user": {"id": "admin-001"}
    }
}

# ============================================================
# 默认拒绝测试
# ============================================================

test_default_deny_unknown_role if {
    not allow with input as {
        "role": "UNKNOWN_ROLE",
        "action": "read",
        "resource": "student",
        "user": {"id": "unknown-001"}
    }
}

test_default_deny_no_input if {
    not allow with input as {}
}
