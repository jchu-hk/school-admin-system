import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController, NotificationTemplateController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification, NotificationRecipient } from './notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationRecipient])],
  controllers: [NotificationController, NotificationTemplateController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
