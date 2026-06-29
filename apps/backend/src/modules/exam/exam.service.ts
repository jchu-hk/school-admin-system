import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { Exam } from './exam.entity';
import { CreateExamDto, UpdateExamDto, ExamQueryDto } from './dto/exam.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  async create(createDto: CreateExamDto): Promise<Exam> {
    const exam = this.examRepository.create({
      ...createDto,
      examDate: new Date(createDto.examDate),
    } as Exam);
    return this.examRepository.save(exam);
  }

  async findAll(query: ExamQueryDto): Promise<{
    data: Exam[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      subject,
      className,
      status,
      examType,
      startDate,
      endDate,
    } = query;

    const where: FindOptionsWhere<Exam> = {};

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    if (subject) {
      where.subject = subject;
    }
    if (className) {
      where.className = className;
    }
    if (status) {
      where.status = status;
    }
    if (examType) {
      where.examType = examType;
    }
    if (startDate && endDate) {
      where.examDate = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.examRepository.findAndCount({
      where,
      order: { examDate: 'DESC', startTime: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`考试记录 ID ${id} 不存在`);
    }
    return exam;
  }

  async update(id: string, updateDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);
    if (updateDto.examDate) {
      (updateDto as any).examDate = new Date(updateDto.examDate);
    }
    Object.assign(exam, updateDto);
    return this.examRepository.save(exam);
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.examRepository.remove(exam);
  }

  async findByDate(date: string): Promise<Exam[]> {
    return this.examRepository.find({
      where: { examDate: new Date(date) },
      order: { startTime: 'ASC' },
    });
  }

  async findByClass(classId: string): Promise<Exam[]> {
    return this.examRepository.find({
      where: { classId },
      order: { examDate: 'DESC' },
    });
  }

  async findBySubject(subject: string): Promise<Exam[]> {
    return this.examRepository.find({
      where: { subject },
      order: { examDate: 'DESC' },
    });
  }

  async getStats(): Promise<{
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  }> {
    const [total, scheduled, ongoing, completed, cancelled] = await Promise.all(
      [
        this.examRepository.count(),
        this.examRepository.count({ where: { status: 'scheduled' as any } }),
        this.examRepository.count({ where: { status: 'ongoing' as any } }),
        this.examRepository.count({ where: { status: 'completed' as any } }),
        this.examRepository.count({ where: { status: 'cancelled' as any } }),
      ],
    );
    return { total, scheduled, ongoing, completed, cancelled };
  }
}
