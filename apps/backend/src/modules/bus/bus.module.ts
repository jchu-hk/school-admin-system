import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusController } from './bus.controller';
import { BusService } from './bus.service';
import { BusRoute, BusSchedule, BusRecord } from './bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusRoute, BusSchedule, BusRecord])],
  controllers: [BusController],
  providers: [BusService],
  exports: [BusService],
})
export class BusModule {}
