import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GradesController } from './grades.controller'
import { GradesService } from './grades.service'
import { Grade } from './grade.entity'
import { User } from '../user/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Grade, User])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
