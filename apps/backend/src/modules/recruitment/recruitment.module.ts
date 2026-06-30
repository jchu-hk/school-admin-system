import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentPosition } from './recruitment-position.entity';
import { RecruitmentPositionService } from './recruitment-position.service';
import { RecruitmentPositionController } from './recruitment-position.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecruitmentPosition])],
  controllers: [RecruitmentPositionController],
  providers: [RecruitmentPositionService],
  exports: [RecruitmentPositionService],
})
export class RecruitmentModule {}
