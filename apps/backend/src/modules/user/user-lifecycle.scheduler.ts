import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserLifecycleService } from './user-lifecycle.service';

/**
 * Scheduler for user lifecycle tasks
 * Handles periodic tasks like account expiry warnings
 */
@Injectable()
export class UserLifecycleScheduler {
  constructor(
    private readonly userLifecycleService: UserLifecycleService,
  ) {}

  /**
   * Run daily at 9:00 AM to check for expiring accounts
   * Sends warnings for accounts expiring in 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiringAccounts() {
    try {
      const result = await this.userLifecycleService.handleExpiringAccounts();
      console.log(
        `[UserLifecycleScheduler] Processed ${result.warningsSent} expiry warnings`,
      );
    } catch (error) {
      console.error(
        '[UserLifecycleScheduler] Error processing expiring accounts:',
        error,
      );
    }
  }
}