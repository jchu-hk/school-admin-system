/**
 * 路由配置
 */

import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { tokenManager } from '../api/auth';

// 懒加载组件
const LoginPage = lazy(() => import('../pages/LoginPage'));
const OTPPage = lazy(() => import('../pages/OTPPage'));

// 简单的Dashboard占位组件
const Dashboard = lazy(() => import('../pages/Dashboard'));

// 加载中组件
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
    <div className="text-white text-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p>加载中...</p>
    </div>
  </div>
);

// 受保护路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = tokenManager.getAccessToken();
  const isExpired = tokenManager.isTokenExpired();

  if (!token || isExpired) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/otp',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <OTPPage />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <Dashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}