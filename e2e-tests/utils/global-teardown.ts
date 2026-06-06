/**
 * 全局 Teardown
 * - 清理测试状态
 * - 生成测试报告摘要
 */
export default async function globalTeardown() {
  console.log('[globalTeardown] Cleaning up test environment');
  // 可在此添加额外的清理逻辑，如：
  // - 清理测试数据
  // - 重置数据库状态
  // - 发送测试报告通知
}
