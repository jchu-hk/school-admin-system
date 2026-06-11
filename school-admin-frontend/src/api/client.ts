import axios, { AxiosError } from 'axios'
import { getToken, removeToken } from '../utils/tokenService'

// 创建一个全局 navigate 函数引用
let globalNavigate: ((path: string) => void) | null = null

// 设置全局 navigate 函数（在 App 初始化时调用）
export function setGlobalNavigate(navigate: (path: string) => void) {
  globalNavigate = navigate
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401错误，统一跳转登录
    if (error.response?.status === 401) {
      removeToken()
      if (globalNavigate) {
        globalNavigate('/login')
      } else {
        // 如果 navigate 还未设置，使用 window.location 作为后备
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 导出isAxiosError静态方法
export const isAxiosError = axios.isAxiosError

export default apiClient
