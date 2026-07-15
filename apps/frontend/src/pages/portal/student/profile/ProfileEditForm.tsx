import React, { useState } from 'react';
import type { StudentProfileData, ProfileUpdatePayload } from './api';

interface ProfileEditFormProps {
  profile: StudentProfileData;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
  /** Called when the user cancels editing */
  onCancel?: () => void;
}

/**
 * ProfileEditForm — 个人档案编辑表单
 *
 * 布局结构:
 * ┌─────────────────────────────────────┐
 * │ 📝 个人信息                          │
 * ├─────────────────────────────────────┤
 * │ 姓名       张小明            🔒     │
 * │ 学号       2024010123       🔒     │
 * │ 性别       男                🔒     │
 * │ 出生日期   2016-03-15       🔒     │
 * │ 班级       三年级一班         🔒     │
 * │ ───────────────────────────         │
 * │ 联系电话  [ 13800138000  ]  ✏️     │
 * │ 邮  箱    [ xm@school.com ] ✏️     │
 * │ 紧急联系人 [ 张伟  138...  ] ✏️     │
 * │ 地  址    [ XX路XX号     ] ✏️      │
 * ├─────────────────────────────────────┤
 * │       [ 💾 保存修改 ]  [ 取消 ]      │
 * └─────────────────────────────────────┘
 */
const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onSave,
  onCancel,
}) => {
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const [emergencyContact, setEmergencyContact] = useState(
    profile.emergency_contact ?? '',
  );
  const [address, setAddress] = useState(profile.address ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 锁定字段 ──────────────────────────────────────

  const lockedFields: Array<{ label: string; value: string }> = [
    { label: '姓名', value: profile.name },
    { label: '学号', value: profile.student_id },
    { label: '性别', value: profile.gender },
    { label: '出生日期', value: profile.birth_date },
    { label: '班级', value: profile.class_name },
    { label: '年级', value: profile.grade },
  ];

  // ── 提交 ──────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: ProfileUpdatePayload = {
      phone: phone.trim(),
      email: email.trim(),
      emergency_contact: emergencyContact.trim(),
      address: address.trim(),
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '保存失败，请稍后重试',
      );
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    phone !== (profile.phone ?? '') ||
    email !== (profile.email ?? '') ||
    emergencyContact !== (profile.emergency_contact ?? '') ||
    address !== (profile.address ?? '');

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {/* ── 标题 ── */}
      <h3 className="profile-form__title">📝 个人信息</h3>

      {/* ── 锁定字段列表 ── */}
      <div className="profile-form__locked-fields">
        {lockedFields.map((f) => (
          <div className="profile-form__field" key={f.label}>
            <span className="profile-form__field-label">{f.label}</span>
            <span className="profile-form__field-value">{f.value}</span>
            <span className="profile-form__field-lock" title="不可编辑">
              🔒
            </span>
          </div>
        ))}
      </div>

      {/* ── 分隔线 ── */}
      <div className="profile-form__divider" />

      {/* ── 可编辑字段 ── */}
      <div className="profile-form__editable-fields">
        <div className="profile-form__field">
          <label className="profile-form__field-label" htmlFor="profile-phone">
            联系电话
          </label>
          <input
            id="profile-phone"
            className="profile-form__input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入联系电话"
            maxLength={20}
          />
          <span className="profile-form__field-edit" title="可编辑">
            ✏️
          </span>
        </div>

        <div className="profile-form__field">
          <label className="profile-form__field-label" htmlFor="profile-email">
            邮　箱
          </label>
          <input
            id="profile-email"
            className="profile-form__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱地址"
            maxLength={100}
          />
          <span className="profile-form__field-edit" title="可编辑">
            ✏️
          </span>
        </div>

        <div className="profile-form__field">
          <label
            className="profile-form__field-label"
            htmlFor="profile-emergency"
          >
            紧急联系人
          </label>
          <input
            id="profile-emergency"
            className="profile-form__input"
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="姓名 + 电话，如 张伟 13800138000"
            maxLength={50}
          />
          <span className="profile-form__field-edit" title="可编辑">
            ✏️
          </span>
        </div>

        <div className="profile-form__field">
          <label
            className="profile-form__field-label"
            htmlFor="profile-address"
          >
            地　址
          </label>
          <input
            id="profile-address"
            className="profile-form__input"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="请输入家庭住址"
            maxLength={200}
          />
          <span className="profile-form__field-edit" title="可编辑">
            ✏️
          </span>
        </div>
      </div>

      {/* ── 错误提示 ── */}
      {error && (
        <div className="profile-form__error">
          <span className="profile-form__error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── 操作按钮 ── */}
      <div className="profile-form__actions">
        <button
          type="submit"
          className="profile-form__btn profile-form__btn--save"
          disabled={saving || !hasChanges}
        >
          {saving ? '保存中…' : '💾 保存修改'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="profile-form__btn profile-form__btn--cancel"
            onClick={onCancel}
            disabled={saving}
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
};

export default ProfileEditForm;
