/**
 * 仪表板页面 - 占位组件
 */

import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../api/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const userInfo = tokenManager.getUserInfo();

  const handleLogout = async () => {
    try {
      await tokenManager.clearTokens();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使登出失败,也清除本地token
      tokenManager.clearTokens();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-900" />
              </div>
              <h1 className="text-xl font-bold">智能校务助理系统</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="text-sm">{userInfo?.username || '用户'}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded">
                  {userInfo?.role || 'OFFICER'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <User className="w-10 h-10 text-blue-900" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">欢迎回来!</h2>
            <p className="text-gray-600 mb-8">
              仪表板功能正在开发中...
            </p>
            <div className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg font-medium">
              {userInfo?.username || '用户'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}