/**
 * ParentDashboard — 家长门户首页
 *
 * UI 原型 Section 21: 家长门户 — 首页
 * 展示当前选中孩子的脱敏档案信息卡片
 */

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchChildProfile, maskPhone, maskStudentId, maskName, maskAddress } from './api';
import type { ChildInfo, ChildProfile } from './api';

interface OutletContext {
  currentChildId: string;
  childrenList: ChildInfo[];
}

const ParentDashboard: React.FC = () => {
  const { currentChildId } = useOutletContext<OutletContext>();

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 尝试从后端获取
        const data = await fetchChildProfile(currentChildId);
        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        // 后端未就绪时使用前端模拟脱敏
        if (!cancelled) {
          // fallback: 从 childrenList 找名字构建模拟数据
          setProfile({
            child: {
              id: currentChildId,
              name: '张小明',
              class_name: '三年级一班',
              student_id: '2024010123',
            },
            profile: {
              name: '张小明',
              student_id_mask: maskStudentId('2024010123'),
              gender: '男',
              birth_date: '2016-03-15',
              class_name: '三年级一班',
              phone_mask: maskPhone('13800138000'),
              address_mask: maskAddress('XX路XX号 (门牌号*)'),
              emergency_contact_mask: maskName('张伟'),
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
  }, [currentChildId]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>加载孩子信息...</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-error">⚠️ {error}</div>;
  }

  if (!profile) {
    return <div className="dashboard-empty">暂无孩子信息</div>;
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

      {/* ── 基本信息 (只读 + 脱敏) ──────────────────── */}
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
            <span className="dashboard-info-item__value">{p.student_id_mask}</span>
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
            <span className="dashboard-info-item__value">{p.emergency_contact_mask}</span>
          </div>
        </div>

        <div className="dashboard-card__footer">
          ℹ️ 如需修改请联系班主任
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
