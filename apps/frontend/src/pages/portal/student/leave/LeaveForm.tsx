import React, { useState, useRef } from 'react';
import type { StudentLeaveType, LeaveFormData } from './api';

// ── Constants ────────────────────────────────────────────

const LEAVE_TYPE_OPTIONS: Array<{ value: StudentLeaveType; label: string; icon: string }> = [
  { value: 'sick', label: '病假', icon: '🤒' },
  { value: 'personal', label: '事假', icon: '🏠' },
  { value: 'family', label: '家庭假', icon: '👨‍👩‍👧‍👦' },
  { value: 'other', label: '其他', icon: '📄' },
];

// ── Props ────────────────────────────────────────────────

interface LeaveFormProps {
  /** 表单提交回调 */
  onSubmit: (data: LeaveFormData) => Promise<void>;
  /** 关闭表单 */
  onClose: () => void;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

// ── Validation ───────────────────────────────────────────

interface FormErrors {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

function validate(data: LeaveFormData): FormErrors {
  const errors: FormErrors = {};

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
 * LeaveForm — 请假申请表单
 *
 * 包含字段:
 *   - 请假类型（单选卡片）
 *   - 开始日期 / 结束日期
 *   - 请假原因（文本域）
 *   - 附件上传（可选）
 *   - 联系电话（可选）
 *
 * @example
 * ```tsx
 * <LeaveForm
 *   onSubmit={async (data) => { await createLeave(data); }}
 *   onClose={() => setShowForm(false)}
 * />
 * ```
 */
const LeaveForm: React.FC<LeaveFormProps> = ({
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  const [leaveType, setLeaveType] = useState<StudentLeaveType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 获取今天日期字符串 (YYYY-MM-DD) ──
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // ── 计算总天数 ──
  const computedDays =
    startDate && endDate
      ? Math.max(1, Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime())
          / (1000 * 60 * 60 * 24)
        ) + 1)
      : 0;

  // ── 提交前验证 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const formData: LeaveFormData = {
      leaveType: leaveType as StudentLeaveType,
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
    <div className="leave-form-overlay" onClick={onClose}>
      <div
        className="leave-form-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 标题栏 ── */}
        <div className="leave-form__header">
          <h2 className="leave-form__title">提交请假申请</h2>
          <button
            className="leave-form__close-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <form className="leave-form" onSubmit={handleSubmit} noValidate>
          {/* ── 请假类型 ── */}
          <div className="leave-form__field">
            <label className="leave-form__label">请假类型 *</label>
            <div className="leave-form__type-options">
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`leave-form__type-btn ${
                    leaveType === opt.value ? 'leave-form__type-btn--active' : ''
                  }`}
                  onClick={() => {
                    setLeaveType(opt.value);
                    setErrors((prev) => ({ ...prev, leaveType: undefined }));
                  }}
                >
                  <span className="leave-form__type-icon">{opt.icon}</span>
                  <span className="leave-form__type-text">{opt.label}</span>
                </button>
              ))}
            </div>
            {errors.leaveType && (
              <p className="leave-form__error">{errors.leaveType}</p>
            )}
          </div>

          {/* ── 日期选择 ── */}
          <div className="leave-form__field leave-form__date-row">
            <div className="leave-form__date-group">
              <label className="leave-form__label" htmlFor="leave-start-date">
                开始日期 *
              </label>
              <input
                id="leave-start-date"
                type="date"
                className="leave-form__input"
                value={startDate}
                min={todayStr}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
              />
              {errors.startDate && (
                <p className="leave-form__error">{errors.startDate}</p>
              )}
            </div>

            <div className="leave-form__date-sep">→</div>

            <div className="leave-form__date-group">
              <label className="leave-form__label" htmlFor="leave-end-date">
                结束日期 *
              </label>
              <input
                id="leave-end-date"
                type="date"
                className="leave-form__input"
                value={endDate}
                min={startDate || todayStr}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
              />
              {errors.endDate && (
                <p className="leave-form__error">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* ── 天数提示 ── */}
          {computedDays > 0 && (
            <p className="leave-form__days-hint">
              共 {computedDays} 天
              {computedDays > 3 && (
                <span className="leave-form__days-warning">
                  （超过3天需校务主任终审）
                </span>
              )}
            </p>
          )}

          {/* ── 请假原因 ── */}
          <div className="leave-form__field">
            <label className="leave-form__label" htmlFor="leave-reason">
              请假原因 *
            </label>
            <textarea
              id="leave-reason"
              className="leave-form__textarea"
              value={reason}
              placeholder="请输入请假原因..."
              rows={4}
              maxLength={500}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
            />
            <div className="leave-form__char-count">
              {reason.length}/500
            </div>
            {errors.reason && (
              <p className="leave-form__error">{errors.reason}</p>
            )}
          </div>

          {/* ── 附件上传 ── */}
          <div className="leave-form__field">
            <label className="leave-form__label">附件（可选）</label>
            <div className="leave-form__upload">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                className="leave-form__file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setAttachment(file);
                }}
              />
              <span className="leave-form__upload-btn">📎 选择文件</span>
              {attachment && (
                <span className="leave-form__file-name">
                  {attachment.name}
                  <button
                    type="button"
                    className="leave-form__file-remove"
                    onClick={clearAttachment}
                    aria-label="移除附件"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <p className="leave-form__hint">
              支持 JPG / PNG / PDF / DOC，单个文件不超过10MB
            </p>
          </div>

          {/* ── 联系电话 ── */}
          <div className="leave-form__field">
            <label className="leave-form__label" htmlFor="leave-phone">
              联系电话（可选）
            </label>
            <input
              id="leave-phone"
              type="tel"
              className="leave-form__input"
              value={contactPhone}
              placeholder="请假期间可联系的手机号"
              maxLength={20}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          {/* ── 提交错误 ── */}
          {submitError && (
            <div className="leave-form__submit-error">{submitError}</div>
          )}

          {/* ── 操作按钮 ── */}
          <div className="leave-form__actions">
            <button
              type="button"
              className="leave-form__cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="leave-form__submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中…' : '✅ 提交请假'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;
