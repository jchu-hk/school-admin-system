/**
 * 门户角色枚举
 */
export enum PortalRole {
  STUDENT = 'student',
  PARENT = 'parent',
  STAFF = 'staff',
}

/**
 * 门户权限范围
 */
export enum PermissionScope {
  SELF = 'self',
  LINKED_CHILDREN = 'linked_children',
  GLOBAL = 'global',
}
