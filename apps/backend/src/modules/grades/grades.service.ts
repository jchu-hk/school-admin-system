import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Grade } from './grade.entity'
import { CreateGradeDto, QueryGradesDto } from './dto/grade.dto'

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
  ) {}

  async create(dto: CreateGradeDto): Promise<Grade> {
    const grade = this.gradeRepository.create({ ...dto, gradedAt: new Date() })
    return this.gradeRepository.save(grade)
  }

  async findAll(query: QueryGradesDto) {
    const page = parseInt(query.page || '1')
    const pageSize = parseInt(query.pageSize || '10')
    const qb = this.gradeRepository.createQueryBuilder('g').leftJoinAndSelect('g.student', 's')
    if (query.studentId) qb.andWhere('g.studentId = :id', { id: query.studentId })
    if (query.courseId) qb.andWhere('g.courseId = :id', { id: query.courseId })
    if (query.term) qb.andWhere('g.term = :term', { term: query.term })
    const [data, total] = await qb.skip((page-1)*pageSize).take(pageSize).getManyAndCount()
    return { data, total, page, pageSize }
  }

  async getStudentStats(studentId: string, term: string) {
    const grades = await this.gradeRepository.find({ where: { studentId, term } })
    return {
      total: grades.length,
      average: grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0,
    }
  }

  async findOne(id: string): Promise<Grade> {
    const g = await this.gradeRepository.findOne({ where: { id }, relations: ['student', 'teacher'] })
    if (!g) throw new NotFoundException('Grade not found')
    return g
  }

  async update(id: string, dto: Partial<CreateGradeDto>): Promise<Grade> {
    const g = await this.findOne(id)
    Object.assign(g, dto)
    return this.gradeRepository.save(g)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.gradeRepository.delete(id)
  }
}
