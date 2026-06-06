import { faker } from '@faker-js/faker';

/**
 * 测试班级数据
 */
export const testClasses = [
  { code: '1A', level: 'S1', year: 1, studentCount: 30 },
  { code: '1B', level: 'S1', year: 1, studentCount: 28 },
  { code: '2A', level: 'S2', year: 2, studentCount: 30 },
  { code: '2B', level: 'S2', year: 2, studentCount: 29 },
  { code: '3A', level: 'S3', year: 3, studentCount: 30 },
  { code: '3B', level: 'S3', year: 3, studentCount: 31 },
  { code: '4A', level: 'S4', year: 4, studentCount: 28 },
  { code: '5A', level: 'S5', year: 5, studentCount: 30 },
  { code: '6A', level: 'S6', year: 6, studentCount: 27 },
];

/**
 * 测试学生数据 (2A班示例)
 */
export const testStudents2A = [
  { studentId: '2023S20101', name: '王小明', gender: 'M', hasSEN: false },
  { studentId: '2023S20102', name: '李晓华', gender: 'F', hasSEN: false },
  { studentId: '2023S20103', name: '陈俊杰', gender: 'M', hasSEN: true },
  { studentId: '2023S20104', name: '张雅琳', gender: 'F', hasSEN: false },
  { studentId: '2023S20105', name: '刘志强', gender: 'M', hasSEN: false },
];

/**
 * 出勤状态
 */
export const attendanceStatuses = {
  present: 'present',
  absent: 'absent',
  late: 'late',
  earlyLeave: 'early_leave',
  exempt: 'exempt',
};

/**
 * 请假类型
 */
export const leaveTypes = {
  sick: {
    code: 'sick',
    label: '病假',
    labelEn: 'Sick Leave',
    maxDaysWithoutCertificate: 2,
    requiresCertificate: true,
  },
  personal: {
    code: 'personal',
    label: '事假',
    labelEn: 'Personal Leave',
    maxDaysWithoutCertificate: 3,
    requiresCertificate: false,
  },
  official: {
    code: 'official',
    label: '公假',
    labelEn: 'Official Leave',
    maxDaysWithoutCertificate: 30,
    requiresCertificate: true,
  },
  compassionate: {
    code: 'compassionate',
    label: '丧假',
    labelEn: 'Compassionate Leave',
    maxDaysWithoutCertificate: 7,
    requiresCertificate: true,
  },
};

/**
 * 请假申请样本数据
 */
export const leaveApplications = {
  // 正常病假申请 (<=2天，无需证明)
  validSickLeave: {
    studentId: '2023S20101',
    leaveType: leaveTypes.sick.code,
    startDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
    reason: '轻微感冒',
    hasCertificate: false,
  },

  // 病假 >2天，需医生证明
  sickLeaveWithCertificate: {
    studentId: '2023S20102',
    leaveType: leaveTypes.sick.code,
    startDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })(),
    reason: '支气管炎',
    hasCertificate: true,
    certificateNumber: 'MC-2026-001',
  },

  // 事假申请
  personalLeave: {
    studentId: '2023S20103',
    leaveType: leaveTypes.personal.code,
    startDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })(),
    reason: '家庭事务',
    hasCertificate: false,
  },

  // 边界: 病假3天无证明 (应被拒绝)
  invalidSickLeaveNoCert: {
    studentId: '2023S20104',
    leaveType: leaveTypes.sick.code,
    startDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
    reason: '旅行',
    hasCertificate: false,
  },
};

/**
 * 费用数据样本
 */
export const feeData = {
  tuition: {
    name: '学费',
    amount: 15000,
    currency: 'HKD',
    type: 'tuition',
  },
  textbook: {
    name: '课本费',
    amount: 185,
    currency: 'HKD',
    type: 'textbook',
  },
  lunch: {
    name: '午膳费',
    amount: 50,
    currency: 'HKD',
    type: 'lunch',
    perDay: true,
  },
};

/**
 * 通知模板测试数据
 */
export const notificationTemplates = {
  busDelay: {
    name: '校车延误通知',
    category: 'bus',
    channels: ['wechat', 'sms'],
    variables: ['studentName', 'routeName', 'delayMinutes', 'newETA'],
  },
  attendanceAlert: {
    name: '出勤异常提醒',
    category: 'attendance',
    channels: ['wechat'],
    variables: ['studentName', 'status', 'date'],
  },
  feeReminder: {
    name: '缴费提醒',
    category: 'fee',
    channels: ['wechat', 'sms', 'email'],
    variables: ['studentName', 'amount', 'dueDate'],
  },
};

/**
 * 批量出勤记录 (2A班)
 */
export function generateBatchAttendanceRecords(count: number = 30) {
  return Array.from({ length: count }, (_, i) => {
    const statuses = ['present', 'late', 'absent'];
    const weights = [0.85, 0.1, 0.05];
    const rand = Math.random();
    let status = statuses[0];
    let cumWeight = 0;
    for (let j = 0; j < weights.length; j++) {
      cumWeight += weights[j];
      if (rand <= cumWeight) {
        status = statuses[j];
        break;
      }
    }
    return {
      studentId: `2023S20${String(i + 1).padStart(3, '0')}`,
      status,
    };
  });
}
