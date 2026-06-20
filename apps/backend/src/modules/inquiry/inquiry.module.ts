import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { InquiryFaqService } from './inquiry-faq.service';
import { InquiryEscalationService } from './inquiry-escalation.service';
import { ParentInquiry } from './inquiry.entity';
import { InquiryFaq } from './inquiry-faq.entity';
import { InquiryReply } from './reply.entity';
import { QuickReplyTemplate } from './template.entity';
import { InquiryEscalationHistory } from './inquiry-escalation-history.entity';
import { User } from '../user/user.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentInquiry,
      InquiryFaq,
      InquiryReply,
      QuickReplyTemplate,
      InquiryEscalationHistory,
      User,
    ]),
    AuditModule,
    NotificationModule,
  ],
  controllers: [InquiryController],
  providers: [InquiryService, InquiryFaqService, InquiryEscalationService],
  exports: [InquiryService, InquiryFaqService, InquiryEscalationService],
})
export class InquiryModule {}
