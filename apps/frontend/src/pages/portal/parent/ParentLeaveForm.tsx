/**
 * ParentLeaveForm — 家长代请假表单（含孩子选择器）
 *
 * UI 原型 Section 21.4-21.5: 家长门户 — 请假管理
 *
 * 与 LeaveFormModal 的区别:
 * 1. 表单顶部显示 "为 {孩子姓名} 提交请假"
 * 2. 孩子选择器作为第一部分（自动绑定当前孩子，可切换）
 * 3. 提交时数据包含 studentId
 *
 * 复用 leave/api.ts 的类型定义
 */

import React, { useState, useRef } from 'react';
import type { ChildInfo } from './api';
import type { ParentLeaveType, ParentLeaveFormData } from './leave/api';

// ── Constants ────────────────────────────────────────────

const LEAVE_TYPE_OPTIONS: Array<{
  value: ParentLeaveType;
  label: string;
  icon: string;
}> = [
  { value: 'sick', label: '病假', icon: '🤒' },
  { value: 'personal', label: '事假', icon: '🏠' },
  { value: 'family', label: '家庭假', icon: '👨‍👩‍👧‍👦' },
  { value: 'other', label: '其他', icon: '📄' },
];

// ── Props ────────────────────────────────────────────────

interface ParentLeaveFormProps {
  /** 当前选中的孩子（表单预设） */
  currentChild: ChildInfo;
  /** 所有关联的孩子列表 */
  childrenList: ChildInfo[];
  /** 提交回调 */
  onSubmit: (data: ParentLeaveFormData) => Promise<void>;
  /** 关闭表单 */
  onClose: () => void;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

// ── Validation ───────────────────────────────────────────

interface FormErrors {
  studentId?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

function validate(data: ParentLeaveFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.studentId) {
    errors.studentId = '请选择请假的孩子';
  }

  if (!data.leaveType) {
    errors.leaveType = '请选择请假类型';
  }

  if (!data.startDate) {
    errors.startDate = '请选择开始日期';
  }

  if (!data.endDate) {
    errors.endDate = '请选择结束日期';
  }

  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    errors.endDate = '结束日期不能早于开始日期';
  }

  if (!data.reason || data.reason.trim().length < 2) {
    errors.reason = '请输入请假原因（至少2个字）';
  }

  if (data.reason && data.reason.length > 500) {
    errors.reason = '请假原因不能超过500字';
  }

  return errors;
}

// ── Component ────────────────────────────────────────────

/**
 * 家长代请假表单
 *
 * @example
 * ```tsx
 * <ParentLeaveForm
 *   currentChild={currentChild}
 *   childrenList={childrenList}
 *   onSubmit={handleSubmit}
 *   onClose={() => setShowForm(false)}
 *   isSubmitting={isSubmitting}
 * />
 * ```
 */
const ParentLeaveForm: React.FC<ParentLeaveFormProps> = ({
  currentChild,
  childrenList,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  const [studentId, setStudentId] = useState(currentChild.id);
  const [leaveType, setLeaveType] = useState<ParentLeaveType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 今天日期 ──
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // ── 选定孩子信息 ──
  const selectedChild = childrenList.find((c) => c.id === studentId);

  // ── 计算天数 ──
  const computedDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
        )
      : 0;

  // ── 提交 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const formData: ParentLeaveFormData = {
      studentId,
      leaveType: leaveType as ParentLeaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      contactPhone: contactPhone.trim() || undefined,
      attachment: attachment ?? undefined,
    };

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : '提交失败，请稍后重试',
      );
    }
  };

  // ── 清除附件 ──
  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pl-overlay" onClick={onClose}>
      <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── 标题栏 ── */}
        <div className="pl-modal__header">
          <h2 className="pl-modal__title">
            为 {selectedChild?.name ?? '孩子'} 提交请假
          </h2>
          <button
            className="pl-modal__close-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <form className="pl-form" onSubmit={handleSubmit} noValidate>
          {/* ── 孩子选择 ── */}
          <div className="pl-form__field">
            <label className="pl-form__label">请假孩子 *</label>
            {childrenList.length <= 1 ? (
              <div className="pl-form__child-info">
                <span className="pl-form__child-icon">🧒</span>
                <span>{selectedChild?.name}</span>
                <span className="pl-form__child-class">
                  {selectedChild?.class_name}
                </span>
              </div>
            ) : (
              <select
                className="pl-form__select"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setErrors((prev) => ({ ...prev, studentId: undefined }));
                }}
              >
                {childrenList.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} - {child.class_name}
                  </option>
                ))}
              </select>
            )}
            {errors.studentId && (
              <p className="pl-form__error">{errors.studentId}</p>
            )}
          </div>

          {/* ── 请假类型 ── */}
          <div className="pl-form__field">
            <label className="pl-form__label">请假类型 *</label>
            <div className="pl-form__type-options">
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`pl-form__type-btn ${
                    leaveType === opt.value ? 'pl-form__type-btn--active' : ''
                  }`}
                  onClick={() => {
                    setLeaveType(opt.value);
                    setErrors((prev) => ({ ...prev, leaveType: undefined }));
                  }}
                >
                  <span className="pl-form__type-icon">{opt.icon}</span>
                  <span className="pl-form__type-text">{opt.label}</span>
                </button>
              ))}
            </div>
            {errors.leaveType && (
              <p className="pl-form__error">{errors.leaveType}</p>
            )}
          </div>

          {/* ── 日期选择 ── */}
          <div className="pl-form__field pl-form__date-row">
            <div className="pl-form__date-group">
              <label className="pl-form__label" htmlFor="plf-start-date">
                开始日期 *
              </label>
              <input
                id="plf-start-date"
                type="date"
                className="pl-form__input"
                value={startDate}
                min={todayStr}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
              />
              {errors.startDate && (
                <p className="pl-form__error">{errors.startDate}</p>
              )}
            </div>

            <div className="pl-form__date-sep">→</div>

            <div className="pl-form__date-group">
              <label className="pl-form__label" htmlFor="plf-end-date">
                结束日期 *
              </label>
              <input
                id="plf-end-date"
                type="date"
                className="pl-form__input"
                value={endDate}
                min={startDate || todayStr}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
              />
              {errors.endDate && (
                <p className="pl-form__error">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* ── 天数提示 ── */}
          {computedDays > 0 && (
            <p className="pl-form__days-hint">
              共 {computedDays} 天
              {computedDays > 3 && (
                <span className="pl-form__days-warning">
                  （超过3天需校务主任终审）
                </span>
              )}
            </p>
          )}

          {/* ── 请假原因 ── */}
          <div className="pl-form__field">
            <label className="pl-form__label" htmlFor="plf-reason">
              请假原因 *
            </label>
            <textarea
              id="plf-reason"
              className="pl-form__textarea"
              value={reason}
              placeholder="请输入请假原因..."
              rows={4}
              maxLength={500}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
            />
            <div className="pl-form__char-count">{reason.length}/500</div>
            {errors.reason && (
              <p className="pl-form__error">{errors.reason}</p>
            )}
          </div>

          {/* ── 附件上传 ── */}
          <div className="pl-form__field">
            <label className="pl-form__label">附件（可选）</label>
            <div className="pl-form__upload">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                className="pl-form__file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setAttachment(file);
                }}
              />
              <span className="pl-form__upload-btn">📎 选择文件</span>
              {attachment && (
                <span className="pl-form__file-name">
                  {attachment.name}
                  <button
                    type="button"
                    className="pl-form__file-remove"
                    onClick={clearAttachment}
                    aria-label="移除附件"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <p className="pl-form__hint">
              支持 JPG / PNG / PDF / DOC，单个文件不超过10MB
            </p>
          </div>

          {/* ── 联系电话 ── */}
          <div className="pl-form__field">
            <label className="pl-form__label" htmlFor="plf-phone">
              联系电话（可选）
            </label>
            <input
              id="plf-phone"
              type="tel"
              className="pl-form__input"
              value={contactPhone}
              placeholder="请假期间可联系的手机号"
              maxLength={20}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          {/* ── 提交错误 ── */}
          {submitError && (
            <div className="pl-form__submit-error">{submitError}</div>
          )}

          {/* ── 操作按钮 ── */}
          <div className="pl-form__actions">
            <button
              type="button"
              className="pl-form__cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="pl-form__submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? '提交中…'
                : `✅ 为 ${selectedChild?.name ?? '孩子'} 提交请假`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentLeaveForm;
