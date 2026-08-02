import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './controllers/profile.controller';
import { LeaveController } from './controllers/leave.controller';
import { ProfileService } from './services/profile.service';
import { LeaveService } from './services/leave.service';
import { LeaveRequest } from './entities/leave-request.entity';
import { User } from '../user/user.entity';
import { Student } from '../student/student.entity';
import { ParentStudentLink } from '../auth/entities/parent-student-link.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest, User, Student, ParentStudentLink]),
    AuditModule,
  ],
  controllers: [ProfileController, LeaveController],
  providers: [ProfileService, LeaveService],
  exports: [ProfileService, LeaveService],
})
export class PortalModule {}
