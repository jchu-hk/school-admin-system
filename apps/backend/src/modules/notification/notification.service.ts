import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async sendNotification(
    recipientId: string,
    title: string,
    content: string,
    senderId?: string,
  ): Promise<void> {
    console.log(
      `[NotificationService] Sending notification to ${recipientId}: ${title}`,
    );
  }

  async sendBulkNotification(
    recipientIds: string[],
    title: string,
    content: string,
    senderId?: string,
  ): Promise<void> {
    console.log(
      `[NotificationService] Sending bulk notification to ${recipientIds.length} recipients: ${title}`,
    );
  }
}