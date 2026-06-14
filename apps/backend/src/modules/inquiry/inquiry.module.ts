import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { InquiryFaqService } from './inquiry-faq.service';
import { ParentInquiry } from './inquiry.entity';
import { InquiryFaq } from './inquiry-faq.entity';
import { InquiryReply } from './reply.entity';
import { QuickReplyTemplate } from './template.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParentInquiry, InquiryFaq, InquiryReply, QuickReplyTemplate]),
    AuditModule,
    NotificationModule,
  ],
  controllers: [InquiryController],
  providers: [InquiryService, InquiryFaqService],
  exports: [InquiryService, InquiryFaqService],
})
export class InquiryModule {}
