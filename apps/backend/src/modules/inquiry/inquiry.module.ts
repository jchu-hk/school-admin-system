import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { Inquiry, InquiryReply } from './inquiry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry, InquiryReply])],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule {}
