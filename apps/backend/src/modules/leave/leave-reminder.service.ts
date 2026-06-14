import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  LeaveReminder,
  ReminderStatus,
  ReminderType,
} from './leave-reminder.entity';
import { LeaveApplication } from './leave.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationUrgency } from '../notification/template.entity';

/** 默认提前提醒小时数 */
const DEFAULT_REMINDER_HOURS_BEFORE = 24;

@Injectable()
export class LeaveReminderService {
  private readonly logger = new Logger(LeaveReminderService.name);

  constructor(
    @InjectRepository(LeaveReminder)
    private reminderRepository: Repository<LeaveReminder>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 请假审批通过后，创建提醒任务
   * @param _application 请假申请实体（已包含 relations）
   * @param hoursBefore 提前多少小时提醒（默认24小时）
   */
  async createReminderOnApproval(
    _application: LeaveApplication,
    hoursBefore: number = DEFAULT_REMINDER_HOURS_BEFORE,
  ): Promise<LeaveReminder> {
    // 计算提醒时间：请假开始前 X 小时
    const startTime = new Date(_application.startDate).getTime();
    const remindAt = new Date(startTime - hoursBefore * 60 * 60 * 1000);

    // 如果提醒时间已过，不创建（防止已过期的提醒）
    if (remindAt <= new Date()) {
      this.logger.warn(
        `[LeaveReminder] 提醒时间已过，跳过创建: leaveId=${_application.id}`,
      );
      return null;
    }

    // 获取家长用户ID（需要从 _application.parentId 或通过 student.parentId 获取）
    const recipientIds = await this.getParentRecipientIds(_application);

    const reminder = this.reminderRepository.create({
      leaveRequestId: _application.id,
      schoolId: _application.schoolId,
      type: ReminderType.LEAVE_START,
      title: `【请假提醒】${_application.student?.name || '学生'}的请假即将开始`,
      content: this.buildReminderContent(_application),
      remindAt,
      status: ReminderStatus.PENDING,
      recipientIds: JSON.stringify(recipientIds),
    });

    const saved = await this.reminderRepository.save(reminder);
    this.logger.log(
      `[LeaveReminder] 创建请假开始提醒: leaveId=${_application.id}, remindAt=${remindAt.toISOString()}`,
    );
    return saved;
  }

  /**
   * 构建提醒内容
   */
  private buildReminderContent(_application: LeaveApplication): string {
    const startDate = new Date(_application.startDate).toLocaleDateString(
      'zh-HK',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );
    const endDate = new Date(_application.endDate).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const studentName = _application.student?.name || application.studentId;
    const leaveTypeMap: Record<string, string> = {
      sick: '病假',
      personal: '事假',
      compassionate: '丧假',
      other: '其他',
    };
    const leaveTypeText =
      leaveTypeMap[_application.leaveType] || application.leaveType;

    return [
      `学生姓名：${studentName}`,
      `请假类型：${leaveTypeText}`,
      `请假时间：${startDate} 至 ${endDate}（共${_application.totalDays}天）`,
      `请假原因：${_application.reason || '未填写'}`,
      ``,
      `请提前做好准备，如有变化请及时联系学校。`,
    ].join('\n');
  }

  /**
   * 获取家长接收人ID列表
   * 实际应通过 student.parentId 查询，这里预留接口
   */
  private async getParentRecipientIds(
    _application: LeaveApplication,
  ): Promise<string[]> {
    // TODO: 实际应通过 studentId 查询该学生的家长 userId
    // 例如: SELECT user_id FROM student_parents WHERE student_id = ?
    // 目前返回空数组，由 NotificationService 处理
    return [];
  }

  /**
   * 查询待发送的提醒（定时任务调用）
   * @param limit 每次最多处理数量
   */
  async getPendingReminders(limit: number = 100): Promise<LeaveReminder[]> {
    return this.reminderRepository.find({
      where: {
        status: ReminderStatus.PENDING,
        remindAt: LessThanOrEqual(new Date()),
      },
      order: { remindAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * 发送单个提醒
   */
  async sendReminder(reminder: LeaveReminder): Promise<void> {
    try {
      const recipientIds = reminder.recipientIds
        ? JSON.parse(reminder.recipientIds)
        : [];

      const notification = await this.notificationService.sendNotification(
        {
          recipientIds,
          title: reminder.title,
          content: reminder.content,
          recipientType: 'parent',
          urgency: NotificationUrgency.NORMAL,
          relatedEntityType: 'leave__application',
          relatedEntityId: reminder.leaveRequestId,
        },
        undefined, // 发送者（系统通知）
        reminder.schoolId,
      );

      // 更新提醒状态
      await this.reminderRepository.update(reminder.id, {
        status: ReminderStatus.SENT,
        sentAt: new Date(),
        notificationId: notification?.id,
      });

      this.logger.log(
        `[LeaveReminder] 发送请假提醒成功: reminderId=${reminder.id}`,
      );
    } catch (error) {
      this.logger.error(
        `[LeaveReminder] 发送请假提醒失败: reminderId=${reminder.id}, error=${error.message}`,
      );
      // 不更新状态，下次重试
    }
  }

  /**
   * 取消某个请假申请的所有提醒
   * 请假被取消/拒绝时调用
   */
  async cancelReminders(
    leaveRequestId: string,
    reason: string = '请假已取消或拒绝',
  ): Promise<number> {
    const result = await this.reminderRepository.update(
      { leaveRequestId, status: ReminderStatus.PENDING },
      {
        status: ReminderStatus.CANCELLED,
        cancelledReason: reason,
      },
    );
    this.logger.log(
      `[LeaveReminder] 取消请假提醒: leaveId=${leaveRequestId}, count=${result.affected}`,
    );
    return result.affected;
  }

  /**
   * 批量处理待发送提醒（定时任务主入口）
   */
  async processPendingReminders(limit: number = 100): Promise<{
    processed: number;
    failed: number;
  }> {
    const pending = await this.getPendingReminders(limit);
    let processed = 0;
    let failed = 0;

    for (const reminder of pending) {
      try {
        await this.sendReminder(reminder);
        processed++;
      } catch (error) {
        failed++;
        this.logger.error(
          `[LeaveReminder] 处理提醒失败: reminderId=${reminder.id}, error=${error.message}`,
        );
      }
    }

    return { processed, failed };
  }

  /**
   * 删除某个请假申请的所有提醒（请假彻底结束时清理）
   */
  async deleteRemindersByLeave(leaveRequestId: string): Promise<void> {
    await this.reminderRepository.delete({ leaveRequestId });
  }

  /**
   * 获取某个请假申请的所有提醒
   */
  async getRemindersByLeave(leaveRequestId: string): Promise<LeaveReminder[]> {
    return this.reminderRepository.find({
      where: { leaveRequestId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 定时任务：每小时检查待发送提醒
   * 在 AppModule 或 ScheduleModule 中注册 Cron
   */
  // 注意：NestJS 需要 @nestjs/schedule 支持。运行时通过外部 cron 或手动调用
  // 在生产环境中，建议使用 @Cron() 装饰器或外部调度器
}
