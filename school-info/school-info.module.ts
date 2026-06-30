import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolInfo } from './school-info.entity';
import { SchoolInfoController } from './school-info.controller';
import { SchoolInfoService } from './school-info.service';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolInfo])],
  controllers: [SchoolInfoController],
  providers: [SchoolInfoService],
  exports: [SchoolInfoService],
})
export class SchoolInfoModule {}
