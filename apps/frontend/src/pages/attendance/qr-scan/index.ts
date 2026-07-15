/**
 * QR 扫码签到页面 — 导出入口
 *
 * 页面结构:
 * - QrScanPage: 扫码签到主页面（教职工手持终端扫码）
 * - CameraScanBox: 摄像头扫码组件（四角扫描框）
 * - ScanResultToast: 扫描结果弹窗（成功/失败/过期/伪造）
 * - RecentScans: 最近签到列表
 * - useCameraScan: 摄像头管理与扫码逻辑 Hook
 */

export { default as QrScanPage } from './QrScanPage';
export { default as CameraScanBox } from './CameraScanBox';
export { default as ScanResultToast } from './ScanResultToast';
export { default as RecentScans } from './RecentScans';
export { useCameraScan } from './useCameraScan';
export type {
  ScanStatus,
  ScanResultData,
  RecentScan,
} from './useCameraScan';
