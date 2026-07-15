/**
 * 通知中心页面（占位）
 * 后续由 T21 任务完整实现
 */
const NotificationCenter: React.FC = () => {
  return (
    <div className="parent-dashboard">
      <div className="dashboard-card">
        <div className="dashboard-card__title">🔔 通知中心</div>
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>通知中心即将上线</p>
          <p style={{ fontSize: '13px' }}>学校通知、请假审批结果等消息将在此处汇总</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
