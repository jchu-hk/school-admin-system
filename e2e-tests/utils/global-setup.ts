import * as fs from 'fs';
import * as path from 'path';

/**
 * 全局 Setup
 * - 确保 .env 文件存在
 * - 确保报告目录存在
 * - 清理旧的测试状态
 */
export default async function globalSetup() {
  // 确保 .env 存在 (从 .env.example 复制)
  const envPath = path.resolve(__dirname, '../../.env');
  const envExamplePath = path.resolve(__dirname, '../../.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('[globalSetup] .env file created from .env.example');
  }

  // 确保报告目录存在
  const reportDirs = [
    path.resolve(__dirname, '../../reports/html'),
    path.resolve(__dirname, '../../reports/junit'),
    path.resolve(__dirname, '../../reports/allure'),
    path.resolve(__dirname, '../../reports/screenshots'),
    path.resolve(__dirname, '../../playwright/.auth'),
  ];

  for (const dir of reportDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('[globalSetup] Test environment ready');
}
