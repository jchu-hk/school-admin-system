import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { InquiryIntentService } from './inquiry-intent.service';
import { InquiryEscalationService } from './inquiry-escalation.service';
import { Inquiry, InquiryReply } from './inquiry.entity';
import { InquiryEscalationHistory } from './inquiry-escalation-history.entity';
import { User } from '../user/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inquiry, InquiryReply, User, InquiryEscalationHistory]),
    NotificationModule,
  ],
  controllers: [InquiryController],
  providers: [InquiryService, InquiryIntentService, InquiryEscalationService],
  exports: [InquiryService, InquiryIntentService],
})
export class InquiryModule {}
