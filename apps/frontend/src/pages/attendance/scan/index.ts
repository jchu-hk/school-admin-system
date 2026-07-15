/**
 * QR 扫码签到页面导出入口
 *
 * 文件结构:
 * - ScanPage:         扫码签到主页面
 * - CameraScanner:    摄像头预览 + 扫码框组件
 * - ScanResultToast:  扫描结果弹窗组件
 * - RecentScans:      最近签到列表组件
 * - useQrScanner:     摄像头管理与扫码逻辑 Hook
 * - api:              scan API 调用封装
 */

export { default as ScanPage } from './ScanPage';
export { default as CameraScanner } from './CameraScanner';
export { default as ScanResultToast } from './ScanResultToast';
export { default as RecentScans } from './RecentScans';
export { useQrScanner } from './useQrScanner';
export type {
  ScanStatus,
  ScanResultData,
  RecentScan,
} from './useQrScanner';
