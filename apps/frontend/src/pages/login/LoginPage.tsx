import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * LoginPage — portal-app 统一登录页
 *
 * 学生和家长共用此入口，选择角色后使用对应的用户名密码登录。
 * 登录成功后把 JWT token 存入 localStorage，然后跳转到来源页或默认页。
 */
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.message || '登录失败，请检查账号密码');
        setLoading(false);
        return;
      }

      const token = body.access_token || body.token;
      if (!token) {
        setError('登录响应异常，请联系管理员');
        setLoading(false);
        return;
      }

      localStorage.setItem('auth_token', token);

      // 从 URL 参数获取 redirect（如果有的话）
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/attendance/qr';
      window.location.href = redirect;
    } catch (err) {
      setError('网络错误，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏫</span>
        </div>
        <h1 style={styles.title}>学校门户</h1>
        <p style={styles.subtitle}>
          {role === 'student' ? '学生考勤 & 门户' : '家长门户'}
        </p>

        <form onSubmit={handleLogin} style={styles.form}>
          {/* 角色切换 */}
          <div style={styles.roleSwitch}>
            <button
              type="button"
              style={{
                ...styles.roleBtn,
                ...(role === 'student' ? styles.roleBtnActive : {}),
              }}
              onClick={() => setRole('student')}
            >
              学生登录
            </button>
            <button
              type="button"
              style={{
                ...styles.roleBtn,
                ...(role === 'parent' ? styles.roleBtnActive : {}),
              }}
              onClick={() => setRole('parent')}
            >
              家长登录
            </button>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>账号</label>
            <input
              style={styles.input}
              type="text"
              placeholder="输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>密码</label>
            <input
              style={styles.input}
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? '登录中…' : '登 录'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            使用学校提供的账号登录
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Inline styles (mobile-first) ────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    borderRadius: 16,
    padding: '32px 24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94a3b8',
    margin: '0 0 24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  roleSwitch: {
    display: 'flex',
    gap: 8,
    marginBottom: 4,
  },
  roleBtn: {
    flex: 1,
    padding: '10px 0',
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    background: '#fff',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  roleBtnActive: {
    borderColor: '#667eea',
    background: '#eef2ff',
    color: '#4338ca',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
  },
  input: {
    padding: '12px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
  },
  submitBtn: {
    padding: '14px 0',
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 4,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
  },
};

export default LoginPage;
