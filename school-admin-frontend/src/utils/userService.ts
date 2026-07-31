/**
 * User 存储和读取工具函数
 * 统一处理用户信息的存储、读取、验证，防止 "undefined"/"null" 字符串问题
 */

const USER_KEY = 'user'

export interface UserInfo {
  id: string
  username: string
  name: string
  role: string
}

/**
 * 验证 user 对象是否有效
 */
function isValidUser(user: unknown): user is UserInfo {
  if (!user || typeof user !== 'object') return false
  const u = user as Record<string, unknown>
  return (
    typeof u.id === 'string' &&
    u.id !== '' &&
    u.id !== 'undefined' &&
    u.id !== 'null' &&
    typeof u.username === 'string' &&
    typeof u.name === 'string' &&
    typeof u.role === 'string'
  )
}

/**
 * 存储用户信息
 */
export function setUser(user: UserInfo | null | undefined): void {
  if (user && isValidUser(user)) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

/**
 * 获取用户信息
 */
export function getUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw || raw === 'undefined' || raw === 'null') {
      localStorage.removeItem(USER_KEY)
      return null
    }
    const user = JSON.parse(raw)
    if (isValidUser(user)) {
      return user
    }
    localStorage.removeItem(USER_KEY)
    return null
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

/**
 * 获取用户角色
 */
export function getUserRole(): string | null {
  const user = getUser()
  return user?.role ?? null
}

/**
 * 清除用户信息
 */
export function removeUser(): void {
  localStorage.removeItem(USER_KEY)
}
