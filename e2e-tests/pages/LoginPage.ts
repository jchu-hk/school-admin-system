import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 登录页面 Page Object
 * 负责所有登录相关操作
 */
export class LoginPage extends BasePage {
  // ── 元素定位器 ────────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly feishuLoginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly languageSwitcher: Locator;

  // OTP 登录 (家长)
  readonly otpTab: Locator;
  readonly phoneInput: Locator;
  readonly sendOtpButton: Locator;
  readonly otpInput: Locator;
  readonly verifyOtpButton: Locator;

  // 注册链接
  readonly registerLink: Locator;

  // 账号锁定提示
  readonly accountLockedMessage: Locator;
  readonly lockCountdown: Locator;

  constructor(page: Page) {
    super(page, '/login', 'LoginPage');

    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error-message');
    this.feishuLoginButton = page.getByTestId('feishu-login');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
    this.languageSwitcher = page.getByTestId('language-switcher');
    this.otpTab = page.getByTestId('otp-login-tab');
    this.phoneInput = page.getByTestId('phone-input');
    this.sendOtpButton = page.getByTestId('send-otp');
    this.otpInput = page.getByTestId('otp-input');
    this.verifyOtpButton = page.getByTestId('verify-otp');
    this.registerLink = page.getByTestId('register-link');
    this.accountLockedMessage = page.getByTestId('account-locked-message');
    this.lockCountdown = page.getByTestId('lock-countdown');
  }

  /**
   * 通用登录方法
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // 等待页面跳转或错误出现
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 以校务主任身份登录
   */
  async loginAsAdmin(username?: string, password?: string): Promise<void> {
    await this.login(
      username || process.env.ADMIN_USERNAME || 'admin',
      password || process.env.ADMIN_PASSWORD || 'Test@2026',
    );
  }

  /**
   * 以校务处同工身份登录
   */
  async loginAsOfficer(username?: string, password?: string): Promise<void> {
    await this.login(
      username || process.env.OFFICER_USERNAME || 'officer01',
      password || process.env.OFFICER_PASSWORD || 'Test@2026',
    );
  }

  /**
   * 以教师身份登录
   */
  async loginAsTeacher(username?: string, password?: string): Promise<void> {
    await this.login(
      username || process.env.TEACHER_USERNAME || 'teacher01',
      password || process.env.TEACHER_PASSWORD || 'Test@2026',
    );
  }

  /**
   * 以家长身份登录
   */
  async loginAsParent(username?: string, password?: string): Promise<void> {
    await this.login(
      username || process.env.PARENT_USERNAME || 'parent01',
      password || process.env.PARENT_PASSWORD || 'Test@2026',
    );
  }

  /**
   * 验证登录失败错误消息
   */
  async expectLoginError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * 验证登录成功 (页面跳转到 dashboard)
   */
  async expectLoginSuccess(redirectUrl: string = '/dashboard'): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(redirectUrl));
  }

  /**
   * 点击飞书登录
   */
  async clickFeishuLogin(): Promise<void> {
    await this.safeClick(this.feishuLoginButton);
  }

  /**
   * 切换到 OTP 登录 (家长短信登录)
   */
  async switchToOtpLogin(): Promise<void> {
    await this.safeClick(this.otpTab);
  }

  /**
   * 发送 OTP
   */
  async sendOtp(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
    await this.safeClick(this.sendOtpButton);
  }

  /**
   * 使用 OTP 验证登录
   */
  async verifyOtp(otp: string): Promise<void> {
    await this.otpInput.fill(otp);
    await this.safeClick(this.verifyOtpButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证账号锁定状态
   */
  async expectAccountLocked(minutes: number = 15): Promise<void> {
    await expect(this.accountLockedMessage).toBeVisible();
    await expect(this.errorMessage).toContainText('帳戶已鎖定');
    await expect(this.errorMessage).toContainText(String(minutes));
  }

  /**
   * 点击忘记密码
   */
  async clickForgotPassword(): Promise<void> {
    await this.safeClick(this.forgotPasswordLink);
  }

  /**
   * 切换语言
   */
  async switchLanguage(lang: 'zh-HK' | 'zh-CN' | 'en'): Promise<void> {
    await this.safeClick(this.languageSwitcher);
    await this.page.getByTestId(`lang-${lang}`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证页面元素完整加载
   */
  async expectPageLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}
