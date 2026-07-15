import React from 'react';
import { useQrCode } from './useQrCode';
import { QrCodeBox } from './QrCodeBox';
import { QrStatusBanner } from './QrStatusBanner';

/**
 * QrDisplayPage — 学生QR展示主页面
 *
 * 页面结构 (Mobile-first):
 * ┌────────────────────────────────┐
 * │  📍 学生姓名: 张小明            │
 * │     班级: 三年级一班            │
 * │     日期: 2026-07-14           │
 * ├────────────────────────────────┤
 * │  [状态提示条 Banner]            │
 * ├────────────────────────────────┤
 * │                                │
 * │         ┌──────────┐           │
 * │         │  QR 码   │           │
 * │         │ (250x250)│           │
 * │         └──────────┘           │
 * │                                │
 * │      ⏱ 二维码剩余 23秒         │
 * │      ████████░░░░░░░░          │
 * │                                │
 * │    ℹ️ 请在校门闸机处展示         │
 * │      此二维码仅本次有效          │
 * └────────────────────────────────┘
 */
const QrDisplayPage: React.FC = () => {
  const [state, actions] = useQrCode();

  const {
    status,
    qrCodeData,
    countdown,
    errorMessage,
    checkedInAt,
    isOffline,
    student,
  } = state;

  // ── 格式化日期 ──
  const todayStr = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(new Date());

  return (
    <div className="qr-page">
      {/* ── 身份信息栏 ── */}
      <header className="qr-header">
        <div className="qr-header__avatar">
          {student?.name?.charAt(0) ?? '?'}
        </div>
        <div className="qr-header__info">
          <h1 className="qr-header__name">
            {student?.name ?? '加载中…'}
          </h1>
          <p className="qr-header__class">
            {student?.class_name ?? ''}
          </p>
          <p className="qr-header__date">{todayStr}</p>
        </div>
      </header>

      {/* ── 状态提示条 ── */}
      <QrStatusBanner
        status={status}
        isOffline={isOffline}
        errorMessage={errorMessage}
        checkedInAt={checkedInAt}
        onDismissError={actions.dismissError}
      />

      {/* ── QR码 / 已签到区域 ── */}
      <main className="qr-main">
        <QrCodeBox
          qrCodeData={qrCodeData}
          status={status}
          countdown={countdown}
          onRefresh={actions.refresh}
        />

        {/* ── 提示文字 (非已签到状态) ── */}
        {status !== 'checked_in' && (
          <div className="qr-hint">
            <p>请在校门闸机处展示此二维码</p>
            <p className="qr-hint__sub">此二维码仅本次有效，30秒后自动刷新</p>
          </div>
        )}
      </main>

      {/* ── 手动刷新按钮 ── */}
      {status === 'active' && (
        <div className="qr-footer">
          <button
            className="qr-refresh-btn"
            onClick={actions.refresh}
          >
            ⟳ 手动刷新二维码
          </button>
        </div>
      )}
    </div>
  );
};

export default QrDisplayPage;
