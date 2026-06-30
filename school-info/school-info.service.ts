import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { SchoolInfo } from './school-info.entity';
import {
  CreateSchoolInfoDto,
  UpdateSchoolInfoDto,
  SchoolInfoQueryDto,
} from './dto/school-info.dto';

@Injectable()
export class SchoolInfoService {
  constructor(
    @InjectRepository(SchoolInfo)
    private readonly repo: Repository<SchoolInfo>,
  ) {}

  async create(dto: CreateSchoolInfoDto, userId?: string): Promise<SchoolInfo> {
    if (dto.schoolCode) {
      const existing = await this.repo.findOne({ where: { schoolCode: dto.schoolCode } });
      if (existing) {
        throw new ConflictException(`学校代码 ${dto.schoolCode} 已存在`);
      }
    }
    const data = { ...dto, createdBy: userId, updatedBy: userId };
    const school = this.repo.create(data as unknown as Partial<SchoolInfo>);
    return this.repo.save(school);
  }

  async findAll(query: SchoolInfoQueryDto) {
    const { page = 1, pageSize = 20, schoolType, keyword, isActive } = query;
    const where: FindOptionsWhere<SchoolInfo> = {};
    if (schoolType) where.schoolType = schoolType;
    if (isActive !== undefined) where.isActive = isActive;
    if (keyword) where.name = Like(`%${keyword}%`);
    const skip = (page - 1) * pageSize;
    const qb = this.repo.createQueryBuilder('s');
    Object.entries(where).forEach(([key, val]) => {
      qb.andWhere(`s.${key} = :${key}`, { [key]: val });
    });
    qb.orderBy('s.created_at', 'DESC').skip(skip).take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data: data as SchoolInfo[], total, page, pageSize };
  }

  async findOne(id: string): Promise<SchoolInfo> {
    const school = await this.repo.findOne({ where: { id } });
    if (!school) throw new NotFoundException(`学校 ID ${id} 不存在`);
    return school;
  }

  async findActive(): Promise<SchoolInfo[]> {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async update(id: string, dto: UpdateSchoolInfoDto, userId?: string): Promise<SchoolInfo> {
    const school = await this.findOne(id);
    if (dto.schoolCode && dto.schoolCode !== school.schoolCode) {
      const existing = await this.repo.findOne({ where: { schoolCode: dto.schoolCode } });
      if (existing) throw new ConflictException(`学校代码 ${dto.schoolCode} 已存在`);
    }
    Object.assign(school, dto);
    if (userId) school.updatedBy = userId;
    return this.repo.save(school);
  }

  async remove(id: string): Promise<void> {
    const school = await this.findOne(id);
    await this.repo.remove(school);
  }
}
