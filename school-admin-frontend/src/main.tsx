import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { I18nProvider } from './i18n'

async function enableMocking() {
  // 只在开发环境启用 MSW
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    
    // 启动 worker
    return worker.start({
      onUnhandledRequest: 'bypass', // 未处理的请求直接放行
    })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>,
  )
})
