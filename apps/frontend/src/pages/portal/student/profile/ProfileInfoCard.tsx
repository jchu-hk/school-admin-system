import React from 'react';
import type { StudentProfileData } from './api';

interface ProfileInfoCardProps {
  profile: StudentProfileData;
}

/**
 * ProfileInfoCard — 个人信息卡片
 *
 * 展示学生头像、姓名、班级、年级等基础信息
 * 为 ProfileEditForm 提供上下文
 *
 * ┌────────────────────────────────┐
 * │  👤 张小明                      │
 * │  学号: 2024010123              │
 * │  班级: 三年级一班               │
 * │  年级: 三年级                   │
 * └────────────────────────────────┘
 */
const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ profile }) => {
  const initials = profile.name?.charAt(0) ?? '?';

  return (
    <div className="profile-card profile-card--header">
      <div className="profile-card__avatar">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="profile-card__avatar-img"
          />
        ) : (
          <span className="profile-card__avatar-initials">{initials}</span>
        )}
      </div>
      <div className="profile-card__info">
        <h2 className="profile-card__name">{profile.name}</h2>
        <dl className="profile-card__meta">
          <div className="profile-card__meta-row">
            <dt>学号</dt>
            <dd>{profile.student_id}</dd>
          </div>
          <div className="profile-card__meta-row">
            <dt>班级</dt>
            <dd>{profile.class_name}</dd>
          </div>
          <div className="profile-card__meta-row">
            <dt>年级</dt>
            <dd>{profile.grade}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
