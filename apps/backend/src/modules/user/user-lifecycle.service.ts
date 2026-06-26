import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User, UserStatus, UserRole } from './user.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationUrgency } from '../notification/template.entity';

/**
 * Service for handling user lifecycle events (departure, graduation, account expiry)
 */
@Injectable()
export class UserLifecycleService {
  private readonly logger = new Logger(UserLifecycleService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Check and handle expiring accounts (30-day warning)
   * Should be run daily via cron
   */
  async handleExpiringAccounts(): Promise<{ warningsSent: number }> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.passwordExpiresAt <= :expiryDate', { expiryDate: thirtyDaysFromNow })
      .andWhere('user.passwordExpiresAt > :now', { now: new Date() })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getMany();

    let warningsSent = 0;

    for (const user of expiringUsers) {
      const daysUntilExpiry = Math.ceil(
        (user.passwordExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      // Send warning notification
      await this.notificationService.sendNotification(
        {
          recipientIds: [user.id],
          title: '账户即将过期',
          content: `您的账户将在${daysUntilExpiry}天后过期，请及时联系校务处续期。`,
          recipientType: 'system',
          urgency: NotificationUrgency.HIGH,
        },
        undefined,
        undefined,
      );

      // Notify school admins
      const adminUsers = await this.userRepository.find({
        where: [
          { role: UserRole.SYSTEM_ADMIN },
          { role: UserRole.SCHOOL_DIRECTOR },
        ],
      });

      if (adminUsers.length > 0) {
        const adminIds = adminUsers.map((admin) => admin.id);
        await this.notificationService.sendNotification(
          {
            recipientIds: adminIds,
            title: '用户账户即将过期',
            content: `用户 ${user.name} (${user.username}) 的账户将在${daysUntilExpiry}天后过期。`,
            recipientType: 'system',
            urgency: NotificationUrgency.NORMAL,
          },
          undefined,
          undefined,
        );
      }

      // Log audit
      await this.auditService.log({
        userId: 'SYSTEM',
        action: 'USER_EXPIRY_WARNING_SENT',
        resourceType: 'USER',
        resourceId: user.id,
        details: {
          username: user.username,
          daysUntilExpiry,
          passwordExpiresAt: user.passwordExpiresAt,
        },
      });

      warningsSent++;
      this.logger.log(
        `Sent expiry warning to user ${user.username} (${daysUntilExpiry} days left)`,
      );
    }

    this.logger.log(`Processed ${warningsSent} expiring account warnings`);
    return { warningsSent };
  }

  /**
   * Handle staff departure - disable account and revoke permissions
   * @param userId User ID of the departing staff
   * @param departureDate Departure date
   * @param reason Reason for departure
   */
  async handleStaffDeparture(
    userId: string,
    departureDate: Date,
    reason?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (
      user.role !== UserRole.SCHOOL_STAFF &&
      user.role !== UserRole.SCHOOL_DIRECTOR &&
      user.role !== UserRole.TEACHER
    ) {
      throw new Error('User is not a staff member');
    }

    // Disable account
    user.status = UserStatus.DISABLED;
    await this.userRepository.save(user);

    // Log audit
    await this.auditService.log({
      userId: 'SYSTEM',
      action: 'USER_DEPARTURE',
      resourceType: 'USER',
      resourceId: user.id,
      details: {
        username: user.username,
        name: user.name,
        role: user.role,
        departureDate,
        reason,
      },
    });

    // Notify school admins
    const adminUsers = await this.userRepository.find({
      where: [
        { role: UserRole.SYSTEM_ADMIN },
        { role: UserRole.SCHOOL_DIRECTOR },
      ],
    });

    if (adminUsers.length > 0) {
      const adminIds = adminUsers.map((admin) => admin.id);
      await this.notificationService.sendNotification(
        {
          recipientIds: adminIds,
          title: '员工离职处理',
          content: `员工 ${user.name} (${user.username}) 已离职，账户已自动停用。离职日期: ${departureDate.toISOString().split('T')[0]}`,
          recipientType: 'system',
          urgency: NotificationUrgency.HIGH,
        },
        undefined,
        undefined,
      );
    }

    this.logger.log(`Handled departure for staff ${user.username}`);
    return user;
  }

  /**
   * Handle student graduation - archive account but keep for records
   * @param userId User ID of the graduating student
   * @param graduationDate Graduation date
   */
  async handleStudentGraduation(
    userId: string,
    graduationDate: Date,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.STUDENT) {
      throw new Error('User is not a student');
    }

    // Archive account (disable but keep for records)
    user.status = UserStatus.DISABLED;
    await this.userRepository.save(user);

    // Log audit
    await this.auditService.log({
      userId: 'SYSTEM',
      action: 'USER_GRADUATION',
      resourceType: 'USER',
      resourceId: user.id,
      details: {
        username: user.username,
        name: user.name,
        className: user.className,
        graduationDate,
      },
    });

    // Notify school admins
    const adminUsers = await this.userRepository.find({
      where: [
        { role: UserRole.SYSTEM_ADMIN },
        { role: UserRole.SCHOOL_DIRECTOR },
      ],
    });

    if (adminUsers.length > 0) {
      const adminIds = adminUsers.map((admin) => admin.id);
      await this.notificationService.sendNotification(
        {
          recipientIds: adminIds,
          title: '学生毕业归档',
          content: `学生 ${user.name} (${user.username}) 已毕业，账户已归档。班级: ${user.className}`,
          recipientType: 'system',
          urgency: NotificationUrgency.NORMAL,
        },
        undefined,
        undefined,
      );
    }

    this.logger.log(`Handled graduation for student ${user.username}`);
    return user;
  }

  /**
   * Get statistics on expiring and expired accounts
   */
  async getExpiryStatistics(): Promise<{
    expiringIn30Days: number;
    expiringIn7Days: number;
    expired: number;
  }> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const now = new Date();

    const [expiringIn30Days, expiringIn7Days, expired] = await Promise.all([
      this.userRepository.count({
        where: {
          passwordExpiresAt: LessThan(thirtyDaysFromNow),
          status: UserStatus.ACTIVE,
        },
      }),
      this.userRepository.count({
        where: {
          passwordExpiresAt: LessThan(sevenDaysFromNow),
          status: UserStatus.ACTIVE,
        },
      }),
      this.userRepository.count({
        where: {
          passwordExpiresAt: LessThan(now),
          status: UserStatus.ACTIVE,
        },
      }),
    ]);

    return {
      expiringIn30Days,
      expiringIn7Days,
      expired,
    };
  }
}