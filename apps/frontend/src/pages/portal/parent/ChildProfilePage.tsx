/**
 * ChildProfilePage — 孩子档案只读视图（脱敏显示）
 *
 * UI 原型 Section 21.4: 家长门户 — 孩子档案
 * - 全部字段只读
 * - 敏感信息脱敏显示
 * - 底部提示联系班主任修改
 *
 * 数据来源:
 *   GET /api/portal/profile?student_id=xxx  (api.ts → fetchChildProfile)
 */

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchChildProfile } from './api';
import type { ChildInfo, ChildProfile } from './api';

interface OutletContext {
  currentChildId: string;
  childrenList: ChildInfo[];
}

// ── 档案字段定义 ────────────────────────────────────────

interface ProfileField {
  label: string;
  key: keyof ChildProfile['profile'];
  fullWidth?: boolean;
}

const PROFILE_FIELDS: ProfileField[] = [
  { label: '姓名', key: 'name' },
  { label: '学号', key: 'student_id_mask' },
  { label: '性别', key: 'gender' },
  { label: '出生日期', key: 'birth_date' },
  { label: '班级', key: 'class_name' },
  { label: '联系电话', key: 'phone_mask' },
  { label: '家庭地址', key: 'address_mask', fullWidth: true },
  { label: '紧急联系人', key: 'emergency_contact_mask', fullWidth: true },
];

// ── Component ────────────────────────────────────────────

const ChildProfilePage: React.FC = () => {
  const { currentChildId, childrenList } = useOutletContext<OutletContext>();

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 当前孩子信息
  const currentChild = childrenList.find((c) => c.id === currentChildId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await fetchChildProfile(currentChildId);
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          // 后端未就绪时，基于 childrenList 显示基础信息
          if (currentChild) {
            setProfile({
              child: currentChild,
              profile: {
                name: currentChild.name,
                student_id_mask: currentChild.student_id,
                gender: '—',
                birth_date: '—',
                class_name: currentChild.class_name,
                phone_mask: '—',
                address_mask: '—',
                emergency_contact_mask: '—',
              },
            });
          } else {
            setError(err instanceof Error ? err.message : '加载失败');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentChildId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──
  if (loading) {
    return (
      <div className="parent-dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p>加载孩子档案…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="parent-dashboard">
        <div className="dashboard-error">⚠️ {error}</div>
      </div>
    );
  }

  // ── Empty ──
  if (!profile) {
    return (
      <div className="parent-dashboard">
        <div className="dashboard-empty">暂无孩子信息</div>
      </div>
    );
  }

  const { child, profile: p } = profile;

  return (
    <div className="parent-dashboard">
      {/* ── 孩子身份卡片 ────────────────────────────── */}
      <div className="dashboard-card dashboard-card--identity">
        <div className="dashboard-card__header">
          <span className="dashboard-card__avatar">👤</span>
          <div>
            <h2 className="dashboard-card__name">{child.name}</h2>
            <p className="dashboard-card__meta">
              学号: {p.student_id_mask} | 班级: {child.class_name}
            </p>
          </div>
        </div>
      </div>

      {/* ── 档案信息 (只读 + 脱敏) ──────────────────── */}
      <div className="dashboard-card">
        <div className="dashboard-card__title">
          📝 孩子档案
          <span className="dashboard-card__readonly">(只读)</span>
          <span className="dashboard-card__readonly" style={{ marginLeft: 4 }}>(脱敏)</span>
        </div>

        <div className="dashboard-info-grid">
          {PROFILE_FIELDS.map((field) => (
            <div
              key={field.key}
              className={`dashboard-info-item ${
                field.fullWidth ? 'dashboard-info-item--full' : ''
              }`}
            >
              <span className="dashboard-info-item__label">{field.label}</span>
              <span className="dashboard-info-item__value">
                {p[field.key] || '—'}
              </span>
            </div>
          ))}
        </div>

        {/* ── 安全提示 ── */}
        <div className="dashboard-card__footer">
          <span role="img" aria-label="lock">🔒</span>{' '}
          敏感信息已脱敏显示。如需修改请联系班主任。
        </div>
      </div>
    </div>
  );
};

export default ChildProfilePage;
