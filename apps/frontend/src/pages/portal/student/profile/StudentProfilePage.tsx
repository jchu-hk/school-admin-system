import React, { useEffect, useState, useCallback } from 'react';
import ProfileInfoCard from './ProfileInfoCard';
import ProfileEditForm from './ProfileEditForm';
import {
  fetchProfile,
  updateProfile,
  StudentProfileData,
  ProfileUpdatePayload,
  ProfileApiError,
} from './api';
import './profile.css';

/**
 * StudentProfilePage — 学生门户个人档案页
 *
 * 页面结构:
 * ┌────────────────────────────────┐
 * │  👤 张小明                       │  ← ProfileInfoCard
 * │  学号: 2024010123               │
 * │  班级: 三年级一班                │
 * │  年级: 三年级                    │
 * ├────────────────────────────────┤
 * │  📝 个人信息                     │  ← ProfileEditForm
 * │  姓名       张小明         🔒   │
 * │  ...                           │
 * │  ────────────────────────────  │
 * │  联系电话  [ 13800138000  ] ✏️ │
 * │  ...                           │
 * │       [ 💾 保存修改 ]            │
 * └────────────────────────────────┘
 *
 * 页面状态:
 * - loading:   首次加载中 (骨架屏)
 * - loaded:    已加载，显示信息 (默认非编辑模式)
 * - editing:   编辑模式 (表单可编辑)
 * - saving:    保存中 (按钮禁用+加载状态)
 * - error:     加载/保存出错 (错误提示)
 * - not_found: 档案不存在
 */
type PageStatus = 'loading' | 'loaded' | 'error' | 'not_found';

const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── 加载数据 ──────────────────────────────────────

  const loadProfile = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const data = await fetchProfile();
      setProfile(data);
      setStatus('loaded');
    } catch (err) {
      if (err instanceof ProfileApiError && err.httpStatus === 404) {
        setStatus('not_found');
      } else {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : '加载个人信息失败',
        );
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── 保存 ──────────────────────────────────────────

  const handleSave = async (payload: ProfileUpdatePayload) => {
    if (!profile) return;

    const updated = await updateProfile(payload);
    setProfile(updated);
    setEditing(false);
  };

  // ── 渲染: 加载中 ──────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="profile-page">
        <div className="profile-page__skeleton">
          <div className="skeleton skeleton--avatar" />
          <div className="skeleton skeleton--line skeleton--line--short" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--line--long" />
        </div>
      </div>
    );
  }

  // ── 渲染: 出错 ────────────────────────────────────

  if (status === 'error') {
    return (
      <div className="profile-page">
        <div className="profile-page__error">
          <span className="profile-page__error-icon">⚠️</span>
          <p className="profile-page__error-text">
            {errorMessage ?? '加载个人档案失败'}
          </p>
          <button
            className="profile-page__retry-btn"
            onClick={loadProfile}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // ── 渲染: 不存在 ──────────────────────────────────

  if (status === 'not_found' || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-page__not-found">
          <span className="profile-page__not-found-icon">👤</span>
          <p>个人档案不存在</p>
          <p className="profile-page__not-found-hint">
            请联系班主任或学校管理员
          </p>
        </div>
      </div>
    );
  }

  // ── 渲染: 正常 ────────────────────────────────────

  return (
    <div className="profile-page">
      {/* 顶部: 信息卡片 */}
      <ProfileInfoCard profile={profile} />

      {/* 底部分隔 + 编辑入口按钮 (非编辑模式) */}
      {!editing && (
        <button
          className="profile-page__edit-btn"
          onClick={() => setEditing(true)}
        >
          ✏️ 编辑个人信息
        </button>
      )}

      {/* 编辑表单或只读信息摘要 */}
      {editing ? (
        <ProfileEditForm
          profile={profile}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="profile-page__readonly-fields">
          <h3 className="profile-form__title">📝 个人信息</h3>
          <div className="profile-form__locked-fields">
            <div className="profile-form__field">
              <span className="profile-form__field-label">联系电话</span>
              <span className="profile-form__field-value">
                {profile.phone || '未设置'}
              </span>
            </div>
            <div className="profile-form__field">
              <span className="profile-form__field-label">邮　箱</span>
              <span className="profile-form__field-value">
                {profile.email || '未设置'}
              </span>
            </div>
            <div className="profile-form__field">
              <span className="profile-form__field-label">紧急联系人</span>
              <span className="profile-form__field-value">
                {profile.emergency_contact || '未设置'}
              </span>
            </div>
            <div className="profile-form__field">
              <span className="profile-form__field-label">地　址</span>
              <span className="profile-form__field-value">
                {profile.address || '未设置'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
