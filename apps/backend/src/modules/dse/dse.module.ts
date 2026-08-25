import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DseController } from './dse.controller';
import { DseService } from './dse.service';
import { DseEnrollmentModule } from './enrollment/dse-enrollment.module';
import { DseRelease } from './entities/dse-release.entity';
import { DseResult } from './entities/dse-result.entity';
import { DseReview } from './entities/dse-review.entity';
import { DseOfferTracking } from './entities/dse-offer-tracking.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    DseEnrollmentModule,
    TypeOrmModule.forFeature([
      DseRelease,
      DseResult,
      DseReview,
      DseOfferTracking,
      User,
    ]),
  ],
  controllers: [DseController],
  providers: [DseService],
  exports: [DseService],
})
export class DseModule {}
