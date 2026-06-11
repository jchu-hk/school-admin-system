import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">出错了</h2>
            
            {/* 显示详细错误信息 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left overflow-auto max-h-96">
              <h3 className="font-semibold text-red-800 mb-2">错误详情：</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap break-all">
                {this.state.error?.toString()}
              </pre>
              
              {this.state.errorInfo && (
                <>
                  <h3 className="font-semibold text-red-800 mt-4 mb-2">组件堆栈：</h3>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">
              页面加载出现问题，请刷新页面重试。
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.href = '/login'
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg transition"
              >
                返回登录
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
