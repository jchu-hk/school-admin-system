import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LunchChange, LunchChangeStatus } from './lunch-change.entity';

/**
 * 午膳变更定时任务
 * 1. 每日 14:00：自动拒绝超时的待审核变更
 * 2. 每日 13:00：提醒有 pending 变更的家长（通过 NotificationService）
 */
@Injectable()
export class LunchReminderScheduler {
  private readonly logger = new Logger(LunchReminderScheduler.name);

  constructor(
    @InjectRepository(LunchChange)
    private lunchChangeRepository: Repository<LunchChange>,
  ) {}

  /**
   * 每日 14:00：批量自动拒绝超时变更
   * 规则：当天 14:00 之前提交的 pending 变更 → auto_rejected
   */
  @Cron('0 14 * * *', { name: 'lunch-change-auto-reject' })
  async handleAutoReject(): Promise<void> {
    this.logger.log('【Cron】开始执行午膳变更自动拒绝任务...');

    try {
      const today = new Date().toISOString().split('T')[0];
      const cutoffDateTime = new Date(`${today}T14:00:00`);

      const result = await this.lunchChangeRepository
        .createQueryBuilder('change')
        .update(LunchChange)
        .set({
          status: LunchChangeStatus.AUTO_REJECTED,
          rejectReason: '超过每日截止时间（14:00），系统自动拒绝',
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where('change.status = :status', {
          status: LunchChangeStatus.PENDING,
        })
        .andWhere('change.createdAt < :cutoff', { cutoff: cutoffDateTime })
        .execute();

      const count = result.affected || 0;
      this.logger.log(`【Cron】午膳变更自动拒绝任务完成，拒绝了 ${count} 条变更`);
    } catch (error) {
      this.logger.error(`【Cron】午膳变更自动拒绝任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 每日 13:00：提醒通知
   * 通知所有有待审核变更的家长/申请人
   * 注：实际发送依赖 NotificationService，此处记录日志
   */
  @Cron('0 13 * * *', { name: 'lunch-change-reminder' })
  async handleReminder(): Promise<void> {
    this.logger.log('【Cron】开始执行午膳变更提醒任务...');

    try {
      // 查找所有 pending 状态的变更
      const pendingChanges = await this.lunchChangeRepository.find({
        where: { status: LunchChangeStatus.PENDING },
        relations: ['creator'],
      });

      if (pendingChanges.length === 0) {
        this.logger.log('【Cron】当前无待审核的午膳变更，跳过提醒');
        return;
      }

      // 收集需要通知的用户
      const userMap: Record<string, number> = {};
      pendingChanges.forEach((change) => {
        const userId = change.createdBy;
        if (userId) {
          userMap[userId] = (userMap[userId] || 0) + 1;
        }
      });

      const notifiedUsers = Object.keys(userMap);
      this.logger.log(
        `【Cron】午膳变更提醒任务完成，待通知用户 ${notifiedUsers.length} 人，` +
        `共计 ${pendingChanges.length} 条待审变更`,
      );

      // TODO: 实际发送微信/飞书通知
      // 可通过 NotificationService.sendBatch 发送
      // for (const userId of notifiedUsers) {
      //   await notificationService.send({ userId, template: 'lunch_change_reminder', ... })
      // }
    } catch (error) {
      this.logger.error(`【Cron】午膳变更提醒任务失败: ${error.message}`, error.stack);
    }
  }
}
