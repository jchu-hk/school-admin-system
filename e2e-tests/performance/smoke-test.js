// k6 冒烟测试 - 验证核心 API 响应时间基准
// 运行: k6 run performance/smoke-test.js
// 
// 目标: 验证关键 API 在单用户/低并发下的响应时间

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

// 响应时间趋势
const loginTrend = new Trend('login');
const apiTrend = new Trend('api_call');

export const options = {
  vus: 5,
  duration: '30s',
  
  thresholds: {
    // 所有 API 响应 < 500ms
    'http_req_duration': ['p(95)<500'],
    'login': ['p(95)<1000'],
    'api_call': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  // 登录
  const start1 = Date.now();
  const loginRes = http.post(`${BASE_URL}/auth/login`, 
    JSON.stringify({ username: 'admin', password: 'Test@2026' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginTrend.add(Date.now() - start1);
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).accessToken !== undefined,
  });
  
  if (loginRes.status !== 200) return;
  
  const token = JSON.parse(loginRes.body).accessToken;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 调用各 API
  const endpoints = [
    '/users',
    '/leaves',
    '/attendance',
    '/dashboard',
    '/notifications',
    '/finance/fees',
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    const res = http.get(`${BASE_URL}${endpoint}`, { headers });
    apiTrend.add(Date.now() - start);
    
    check(res, {
      [`${endpoint} returns 200`]: (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function setup() {
  console.log(`[smoke] Testing ${BASE_URL}`);
}
