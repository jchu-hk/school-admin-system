/**
 * Token 存储和读取工具函数
 * 统一处理 token 的存储、读取、验证，防止 "undefined"/"null" 字符串问题
 */

const TOKEN_KEY = 'token'

/**
 * 验证 token 是否有效（非空、非 "undefined"、非 "null"）
 */
export function isValidToken(token: string | null): boolean {
  return token !== null && token !== '' && token !== 'undefined' && token !== 'null'
}

/**
 * 存储 token
 */
export function setToken(token: string | null | undefined): void {
  if (isValidToken(token)) {
    localStorage.setItem(TOKEN_KEY, token!)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * 获取 token
 */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (isValidToken(token)) {
    return token
  }
  // 如果是无效值，清除它
  if (token !== null) {
    localStorage.removeItem(TOKEN_KEY)
  }
  return null
}

/**
 * 清除 token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
