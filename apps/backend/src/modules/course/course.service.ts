import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Course } from './course.entity';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
} from './dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    // Check if course code already exists
    const existingCourse = await this.courseRepository.findOne({
      where: { code: createCourseDto.code },
    });

    if (existingCourse) {
      throw new ConflictException(`课程代码 ${createCourseDto.code} 已存在`);
    }

    const course = this.courseRepository.create(createCourseDto);
    return this.courseRepository.save(course);
  }

  async findAll(query: CourseQueryDto): Promise<{
    data: Course[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, keyword, grade, subject, status } = query;

    const where: FindOptionsWhere<Course> = {};

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    if (grade) {
      where.grade = grade;
    }

    if (subject) {
      where.subject = subject;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await this.courseRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException(`课程 ID ${id} 不存在`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);

    // Check if new code conflicts with existing courses
    if (updateCourseDto.code && updateCourseDto.code !== course.code) {
      const existingCourse = await this.courseRepository.findOne({
        where: { code: updateCourseDto.code },
      });

      if (existingCourse) {
        throw new ConflictException(`课程代码 ${updateCourseDto.code} 已存在`);
      }
    }

    Object.assign(course, updateCourseDto);
    return this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
  }

  async updateEnrollment(id: string, enrolled: number): Promise<Course> {
    const course = await this.findOne(id);
    course.enrolled = enrolled;
    return this.courseRepository.save(course);
  }

  async findByGrade(grade: string): Promise<Course[]> {
    return this.courseRepository.find({
      where: { grade, status: 'active' },
      order: { subject: 'ASC' },
    });
  }

  async findBySubject(subject: string): Promise<Course[]> {
    return this.courseRepository.find({
      where: { subject, status: 'active' },
      order: { grade: 'ASC' },
    });
  }

  async findByTeacher(teacher: string): Promise<Course[]> {
    return this.courseRepository.find({
      where: { teacher, status: 'active' },
      order: { schedule: 'ASC' },
    });
  }
}
