// k6 性能测试配置
// 运行: k6 run performance/api-load-test.js
// 
// 性能基准:
// - P95 响应时间 < 500ms
// - QPS >= 100
// - 成功率 >= 99%

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── 自定义指标 ───────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');
const dashboardDuration = new Trend('dashboard_duration');

// ── 测试配置 ─────────────────────────────────────────────────────────────────
export const options = {
  // 场景1: 负载测试 (30秒内从0增加到100并发)
  scenarios: {
    // 负载测试 - 目标 QPS >= 100
    load_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,           // 开始: 10 req/s
      timeUnit: '1s',
      preAllocatedVUs: 50,    // 预分配 50 VUs
      maxVUs: 200,            // 最多 200 VUs
      stages: [
        { duration: '30s', target: 50 },   // 30s内增加到50 req/s
        { duration: '1m', target: 100 },    // 1min内增加到100 req/s
        { duration: '2m', target: 100 },    // 保持100 req/s 2分钟
        { duration: '30s', target: 0 },     // 30s内降到0
      ],
    },

    // 场景2: 峰值测试 (模拟突发流量)
    stress_test: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 10,
      maxDuration: '30s',
    },
  },

  // 性能阈值
  thresholds: {
    // HTTP 错误率 < 1%
    http_req_failed: ['rate<0.01'],
    
    // P95 响应时间 < 500ms
    http_req_duration: ['p(95)<500'],
    
    // 自定义指标
    'errors': ['rate<0.01'],
    'login_duration': ['p(95)<1000'],   // 登录可以稍慢
    'api_duration': ['p(95)<500'],
    'dashboard_duration': ['p(95)<1000'],
  },

  // 排除 TLS 握手时间
  tlsAuth: {
    // 跳过 TLS 验证 (测试环境)
  },
};

// ── 测试数据 ─────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const TEST_USERS = [
  { username: 'admin', password: 'Test@2026' },
  { username: 'officer01', password: 'Test@2026' },
  { username: 'teacher01', password: 'Test@2026' },
  { username: 'parent01', password: 'Test@2026' },
];

// ── 辅助函数 ─────────────────────────────────────────────────────────────────
function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

function login() {
  const user = getRandomUser();
  const start = Date.now();
  
  const res = http.post(`${BASE_URL}/auth/login`, 
    JSON.stringify({ username: user.username, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    }
  );
  
  loginDuration.add(Date.now() - start);
  
  const success = check(res, {
    'login status 200': (r) => r.status === 200,
    'has accessToken': (r) => JSON.parse(r.body).accessToken !== undefined,
  });
  
  errorRate.add(!success);
  
  if (res.status === 200) {
    return JSON.parse(res.body).accessToken;
  }
  return null;
}

// ── 默认测试函数 (每个 VU 运行一次) ─────────────────────────────────────────
export default function () {
  // 1. 登录
  const token = login();
  
  if (!token) {
    sleep(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // 2. 获取用户列表
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/users`, { headers });
    apiDuration.add(Date.now() - start);
    
    const success = check(res, {
      'GET /users status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  }

  // 3. 获取请假列表
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/leaves`, { headers });
    apiDuration.add(Date.now() - start);
    
    const success = check(res, {
      'GET /leaves status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  }

  // 4. 获取仪表板数据
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/dashboard`, { headers });
    dashboardDuration.add(Date.now() - start);
    
    const success = check(res, {
      'GET /dashboard status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  }

  // 5. 获取出勤数据
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/attendance?date=${new Date().toISOString().split('T')[0]}`, { headers });
    apiDuration.add(Date.now() - start);
    
    const success = check(res, {
      'GET /attendance status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  }

  sleep(0.5); // 模拟用户思考时间
}

// ── 测试前准备 ────────────────────────────────────────────────────────────────
export function setup() {
  console.log(`[k6] Performance test starting against ${BASE_URL}`);
  console.log('[k6] Performance benchmarks:');
  console.log('  - P95 response time < 500ms');
  console.log('  - QPS >= 100');
  console.log('  - Success rate >= 99%');
  
  // 预热: 验证服务可用性
  const healthRes = http.get(`${BASE_URL.replace('/api/v1', '')}/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Service is not healthy: ${healthRes.status}`);
  }
  console.log('[k6] Service health check passed');
  
  return { baseUrl: BASE_URL };
}

// ── 测试后清理 ──────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log('[k6] Performance test completed');
  console.log('[k6] Summary available in JSON output');
}
