/**
 * ParentProfileView — 孩子档案只读查看页面
 *
 * UI 原型 Section 21: 家长门户 — 孩子档案只读
 *
 * 功能:
 *   - 调用 GET /api/portal/profile?student_id=xxx 获取脱敏档案
 *   - 展示孩子的身份卡片（姓名、班级、学号脱敏）
 *   - 展示基本信息表格（已脱敏：手机号、地址、紧急联系人）
 *   - 数据不可编辑（仅展示）
 *   - 后端未就绪时使用前端模拟脱敏（T18 脱敏函数）
 *
 * 与 ParentDashboard 复用相同的档案展示逻辑，
 * 但独立为请假管理场景下的"查看档案"入口。
 */

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ChildInfo } from '../api';
import {
  fetchChildProfile,
  maskPhone,
  maskStudentId,
  maskName,
  maskAddress,
} from './api';
import type { ChildProfile } from './api';

// ── Outlet Context Type ──────────────────────────────────

interface OutletContext {
  currentChildId: string;
  childrenList: ChildInfo[];
}

// ── Component ────────────────────────────────────────────

const ParentProfileView: React.FC = () => {
  const { currentChildId, childrenList } = useOutletContext<OutletContext>();

  const currentChild = childrenList.find((c) => c.id === currentChildId);

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!currentChildId) {
      setLoading(false);
      setError('请先选择一个孩子');
      return;
    }

    (async () => {
      try {
        const data = await fetchChildProfile(currentChildId);
        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        // 后端未就绪 → 前端模拟脱敏（T18 复用）
        if (!cancelled) {
          const displayName = currentChild?.name ?? '未知';
          const studentId = currentChild?.student_id ?? '0000000000';
          const className = currentChild?.class_name ?? '未知班级';

          setProfile({
            child: {
              id: currentChildId,
              name: displayName,
              class_name: className,
              student_id: studentId,
            },
            profile: {
              name: displayName,
              student_id_mask: maskStudentId(studentId),
              gender: '—',
              birth_date: '—',
              class_name: className,
              phone_mask: maskPhone('—'),
              address_mask: maskAddress('—'),
              emergency_contact_mask: maskName('—'),
            },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentChildId, currentChild]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>加载档案信息...</p>
      </div>
    );
  }

  // ── 未选择孩子 ──
  if (!currentChildId) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-card__title">📊 孩子档案</div>
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            请先选择一个孩子
          </p>
          <p style={{ fontSize: '13px' }}>
            在顶部孩子切换器中选择孩子后查看档案信息
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return <div className="dashboard-error">⚠️ {error}</div>;
  }

  // ── Empty ──
  if (!profile) {
    return <div className="dashboard-empty">暂无档案信息</div>;
  }

  const { child, profile: p } = profile;

  return (
    <div className="parent-dashboard">
      {/* ── 孩子身份卡片 ── */}
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

      {/* ── 基本信息（只读 + 脱敏） ── */}
      <div className="dashboard-card">
        <div className="dashboard-card__title">
          📝 基本信息
          <span className="dashboard-card__readonly">(只读)</span>
        </div>

        <div className="dashboard-info-grid">
          <div className="dashboard-info-item">
            <span className="dashboard-info-item__label">姓名</span>
            <span className="dashboard-info-item__value">{p.name}</span>
          </div>

          <div className="dashboard-info-item">
            <span className="dashboard-info-item__label">学号</span>
            <span className="dashboard-info-item__value">
              {p.student_id_mask}
            </span>
          </div>

          <div className="dashboard-info-item">
            <span className="dashboard-info-item__label">性别</span>
            <span className="dashboard-info-item__value">{p.gender}</span>
          </div>

          <div className="dashboard-info-item">
            <span className="dashboard-info-item__label">出生日期</span>
            <span className="dashboard-info-item__value">{p.birth_date}</span>
          </div>

          <div className="dashboard-info-item">
            <span className="dashboard-info-item__label">班级</span>
            <span className="dashboard-info-item__value">{p.class_name}</span>
          </div>

          <div className="dashboard-info-item">
            <span className="dashboard-info-item__label">联系电话</span>
            <span className="dashboard-info-item__value">{p.phone_mask}</span>
          </div>

          <div className="dashboard-info-item dashboard-info-item--full">
            <span className="dashboard-info-item__label">家庭地址</span>
            <span className="dashboard-info-item__value">{p.address_mask}</span>
          </div>

          <div className="dashboard-info-item dashboard-info-item--full">
            <span className="dashboard-info-item__label">紧急联系人</span>
            <span className="dashboard-info-item__value">
              {p.emergency_contact_mask}
            </span>
          </div>
        </div>

        <div className="dashboard-card__footer">
          ℹ️ 如需修改请联系班主任
        </div>
      </div>
    </div>
  );
};

export default ParentProfileView;
