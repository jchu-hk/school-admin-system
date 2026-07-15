/**
 * 门户权限标识常量
 * 对应 FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md §4
 */
export const PORTAL_PERMISSIONS = {
  // Student 权限
  PROFILE_VIEW_SELF: 'profile:view:self',
  PROFILE_UPDATE_SELF: 'profile:update:self',
  ATTENDANCE_VIEW_SELF: 'attendance:view:self',
  ATTENDANCE_QR_GENERATE: 'attendance:qr:generate',
  LEAVE_CREATE_SELF: 'leave:create:self',
  LEAVE_VIEW_SELF: 'leave:view:self',
  LEAVE_CANCEL_SELF: 'leave:cancel:self',
  GRADE_VIEW_SELF: 'grade:view:self',
  TIMETABLE_VIEW_SELF: 'timetable:view:self',
  NOTICE_VIEW: 'notice:view',

  // Parent 权限
  PROFILE_VIEW_LINKED_CHILDREN: 'profile:view:linked_children',
  ATTENDANCE_VIEW_LINKED_CHILDREN: 'attendance:view:linked_children',
  LEAVE_VIEW_LINKED_CHILDREN: 'leave:view:linked_children',
  LEAVE_CREATE_LINKED_CHILDREN: 'leave:create:linked_children',
  GRADE_VIEW_LINKED_CHILDREN: 'grade:view:linked_children',
  PAYMENT_OPERATE_LINKED_CHILDREN: 'payment:operate:linked_children',
  EMERGENCY_UPDATE_LINKED_CHILDREN: 'emergency:update:linked_children',
};

/**
 * 角色 → 权限映射
 * 定义每个角色拥有的权限列表
 */
export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  student: [
    PORTAL_PERMISSIONS.PROFILE_VIEW_SELF,
    PORTAL_PERMISSIONS.PROFILE_UPDATE_SELF,
    PORTAL_PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PORTAL_PERMISSIONS.ATTENDANCE_QR_GENERATE,
    PORTAL_PERMISSIONS.LEAVE_CREATE_SELF,
    PORTAL_PERMISSIONS.LEAVE_VIEW_SELF,
    PORTAL_PERMISSIONS.LEAVE_CANCEL_SELF,
    PORTAL_PERMISSIONS.GRADE_VIEW_SELF,
    PORTAL_PERMISSIONS.TIMETABLE_VIEW_SELF,
    PORTAL_PERMISSIONS.NOTICE_VIEW,
  ],
  parent: [
    PORTAL_PERMISSIONS.PROFILE_VIEW_LINKED_CHILDREN,
    PORTAL_PERMISSIONS.ATTENDANCE_VIEW_LINKED_CHILDREN,
    PORTAL_PERMISSIONS.LEAVE_VIEW_LINKED_CHILDREN,
    PORTAL_PERMISSIONS.LEAVE_CREATE_LINKED_CHILDREN,
    PORTAL_PERMISSIONS.GRADE_VIEW_LINKED_CHILDREN,
    PORTAL_PERMISSIONS.PAYMENT_OPERATE_LINKED_CHILDREN,
    PORTAL_PERMISSIONS.NOTICE_VIEW,
    PORTAL_PERMISSIONS.EMERGENCY_UPDATE_LINKED_CHILDREN,
  ],
};

/**
 * 门户菜单配置
 * 每个菜单项包含菜单信息及所需权限
 */
export interface PortalMenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  requiredPermissions: string[];
}

export const PORTAL_MENUS: PortalMenuItem[] = [
  {
    key: 'profile',
    label: '个人档案',
    icon: 'user',
    path: '/portal/profile',
    requiredPermissions: [
      PORTAL_PERMISSIONS.PROFILE_VIEW_SELF,
      PORTAL_PERMISSIONS.PROFILE_VIEW_LINKED_CHILDREN,
    ],
  },
  {
    key: 'attendance',
    label: '考勤记录',
    icon: 'calendar-check',
    path: '/portal/attendance',
    requiredPermissions: [
      PORTAL_PERMISSIONS.ATTENDANCE_VIEW_SELF,
      PORTAL_PERMISSIONS.ATTENDANCE_VIEW_LINKED_CHILDREN,
    ],
  },
  {
    key: 'qr-code',
    label: '我的QR码签入',
    icon: 'qrcode',
    path: '/portal/qr-code',
    requiredPermissions: [PORTAL_PERMISSIONS.ATTENDANCE_QR_GENERATE],
  },
  {
    key: 'leave',
    label: '电子请假',
    icon: 'file-text',
    path: '/portal/leave',
    requiredPermissions: [
      PORTAL_PERMISSIONS.LEAVE_CREATE_SELF,
      PORTAL_PERMISSIONS.LEAVE_VIEW_SELF,
      PORTAL_PERMISSIONS.LEAVE_CREATE_LINKED_CHILDREN,
    ],
  },
  {
    key: 'grades',
    label: '成绩查询',
    icon: 'award',
    path: '/portal/grades',
    requiredPermissions: [
      PORTAL_PERMISSIONS.GRADE_VIEW_SELF,
      PORTAL_PERMISSIONS.GRADE_VIEW_LINKED_CHILDREN,
    ],
  },
  {
    key: 'timetable',
    label: '课表查询',
    icon: 'clock',
    path: '/portal/timetable',
    requiredPermissions: [PORTAL_PERMISSIONS.TIMETABLE_VIEW_SELF],
  },
  {
    key: 'notice',
    label: '校历/通告',
    icon: 'bell',
    path: '/portal/notice',
    requiredPermissions: [PORTAL_PERMISSIONS.NOTICE_VIEW],
  },
  {
    key: 'payment',
    label: '校内缴费',
    icon: 'credit-card',
    path: '/portal/payment',
    requiredPermissions: [PORTAL_PERMISSIONS.PAYMENT_OPERATE_LINKED_CHILDREN],
  },
  {
    key: 'emergency',
    label: '紧急联络',
    icon: 'phone',
    path: '/portal/emergency',
    requiredPermissions: [PORTAL_PERMISSIONS.EMERGENCY_UPDATE_LINKED_CHILDREN],
  },
];
