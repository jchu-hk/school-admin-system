import { APIRequestContext, request } from '@playwright/test';

/**
 * API 客户端工具
 * 提供 API 请求封装，支持 JWT 认证和重试
 */
export class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 设置认证 Token
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * 获取当前 Token
   */
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken };
  }

  /**
   * 清除 Token
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * 获取默认请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Test-Environment': process.env.TEST_ENV || 'dev',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  /**
   * 通用 GET 请求
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string>,
    options?: { retries?: number; expectedStatus?: number },
  ): Promise<{ status: number; body: T }> {
    const ctx = await request.newContext({ baseURL: this.baseURL });
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    let attempts = 0;
    const maxRetries = options?.retries ?? 0;
    const expectedStatus = options?.expectedStatus ?? 200;

    while (attempts <= maxRetries) {
      const response = await ctx.get(url.toString(), {
        headers: this.getHeaders(),
      });
      if (response.status() === expectedStatus || attempts === maxRetries) {
        const body = await response.json().catch(() => null);
        await ctx.dispose();
        return { status: response.status(), body: body as T };
      }
      attempts++;
      await this.delay(1000 * attempts);
    }
    await ctx.dispose();
    return { status: 0, body: null as T };
  }

  /**
   * 通用 POST 请求
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: { retries?: number; expectedStatus?: number },
  ): Promise<{ status: number; body: T }> {
    const ctx = await request.newContext({ baseURL: this.baseURL });

    let attempts = 0;
    const maxRetries = options?.retries ?? 0;
    const expectedStatus = options?.expectedStatus ?? 201;

    while (attempts <= maxRetries) {
      const response = await ctx.post(`${this.baseURL}${endpoint}`, {
        headers: this.getHeaders(),
        data: data ? JSON.stringify(data) : undefined,
      });
      if (response.status() === expectedStatus || attempts === maxRetries) {
        const body = await response.json().catch(() => null);
        await ctx.dispose();
        return { status: response.status(), body: body as T };
      }
      attempts++;
      await this.delay(1000 * attempts);
    }
    await ctx.dispose();
    return { status: 0, body: null as T };
  }

  /**
   * 通用 PUT 请求
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Promise<{ status: number; body: T }> {
    const ctx = await request.newContext({ baseURL: this.baseURL });
    const response = await ctx.put(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(),
      data: data ? JSON.stringify(data) : undefined,
    });
    const body = await response.json().catch(() => null);
    await ctx.dispose();
    return { status: response.status(), body: body as T };
  }

  /**
   * 通用 DELETE 请求
   */
  async delete<T = unknown>(endpoint: string): Promise<{ status: number; body: T }> {
    const ctx = await request.newContext({ baseURL: this.baseURL });
    const response = await ctx.delete(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(),
    });
    const body = await response.json().catch(() => null);
    await ctx.dispose();
    return { status: response.status(), body: body as T };
  }

  /**
   * 登录并保存 Token
   */
  async login(username: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; userType: string; name: string };
  }> {
    const ctx = await request.newContext({ baseURL: this.baseURL });
    const response = await ctx.post(`${this.baseURL}/auth/login`, {
      data: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    if (response.status() !== 200) {
      throw new Error(`Login failed: ${response.status()} - ${await response.text()}`);
    }

    const body = await response.json();
    this.accessToken = body.accessToken;
    this.refreshToken = body.refreshToken;
    await ctx.dispose();

    return {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      user: body.user,
    };
  }

  /**
   * 刷新 Token
   */
  async refresh(): Promise<{ accessToken: string }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    const ctx = await request.newContext({ baseURL: this.baseURL });
    const response = await ctx.post(`${this.baseURL}/auth/refresh`, {
      data: JSON.stringify({ refreshToken: this.refreshToken }),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    const body = await response.json();
    this.accessToken = body.accessToken;
    await ctx.dispose();
    return { accessToken: body.accessToken };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 导出默认实例
export const apiClient = new ApiClient(
  process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
);
