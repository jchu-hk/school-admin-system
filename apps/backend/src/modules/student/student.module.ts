import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Student,
  AcademicYear,
  StudentIdSequence,
  ClassAllocation,
} from './student.entity';
import { StudentService } from './student.service';
import {
  StudentController,
  ClassStudentController,
  AcademicYearController,
} from './student.controller';
import { Class } from '../user/class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      AcademicYear,
      StudentIdSequence,
      ClassAllocation,
      Class,
    ]),
  ],
  controllers: [
    StudentController,
    ClassStudentController,
    AcademicYearController,
  ],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
