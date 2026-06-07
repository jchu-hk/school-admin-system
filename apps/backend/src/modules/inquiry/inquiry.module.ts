import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { ParentInquiry } from './inquiry.entity';
import { InquiryReply } from './reply.entity';
import { QuickReplyTemplate } from './template.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParentInquiry, InquiryReply, QuickReplyTemplate]),
    AuditModule,
    NotificationModule,
  ],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule {}
