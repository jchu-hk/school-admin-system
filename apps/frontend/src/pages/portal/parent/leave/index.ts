/**
 * 家长版请假管理 barrel export
 */
export { default as ParentLeavePage } from './ParentLeavePage';
export { default as ParentProfileView } from './ParentProfileView';
export { default as LeaveFormModal } from './LeaveFormModal';
export { default as LeaveCard } from './LeaveCard';
export { default as LeaveStatusBadge } from './LeaveStatusBadge';

export {
  createParentLeave,
  fetchParentLeaveList,
  fetchParentLeaveDetail,
  cancelParentLeave,
  fetchChildProfile,
  maskPhone,
  maskStudentId,
  maskName,
  maskAddress,
  ParentLeaveApiError,
} from './api';

export type {
  ParentLeaveType,
  LeaveStatus,
  LeaveRecord,
  ParentLeaveFormData,
  LeaveListData,
  CreateLeaveResult,
  ChildProfile,
} from './api';
