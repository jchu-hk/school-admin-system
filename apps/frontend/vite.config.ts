import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // portal-app 独立 SPA（QR考勤 + 学生/家长门户），根路径 base（``/``）,
  // 路由前缀为 /attendance/* 与 /portal/* —— DO NOT use /school-admin (admin-app 专属)。
  // React Router basename 在 src/main.tsx 中使用 <BrowserRouter>（默认 basename='/'）。
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 时间戳命名以打破 Coze CDN 缓存（与 admin-app 部署约定一致）
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash]-20260707[extname]',
        chunkFileNames: 'assets/[name]-[hash]-20260707.js',
        entryFileNames: 'assets/[name]-[hash]-20260707.js',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
