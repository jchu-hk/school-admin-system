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
    private readonly schoolInfoRepository: Repository<SchoolInfo>,
  ) {}

  async create(createDto: CreateSchoolInfoDto, userId?: string): Promise<SchoolInfo> {
    if (createDto.schoolCode) {
      const existing = await this.schoolInfoRepository.findOne({
        where: { schoolCode: createDto.schoolCode },
      });
      if (existing) {
        throw new ConflictException(`学校代码 ${createDto.schoolCode} 已存在`);
      }
    }

    const school = this.schoolInfoRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    } as any);
    return this.schoolInfoRepository.save(school);
  }

  async findAll(query: SchoolInfoQueryDto) {
    const { page = 1, pageSize = 20, schoolType, keyword, isActive } = query;

    const where: FindOptionsWhere<SchoolInfo> = {};

    if (schoolType) {
      where.schoolType = schoolType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    const skip = (page - 1) * pageSize;
    const rows = await this.schoolInfoRepository
      .createQueryBuilder('school')
      .where(where)
      .orderBy('school.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return { data: rows[0] as any, total: rows[1], page, pageSize };
  }

  async findOne(id: string): Promise<SchoolInfo> {
    const school = await this.schoolInfoRepository.findOne({ where: { id } });
    if (!school) {
      throw new NotFoundException(`学校 ID ${id} 不存在`);
    }
    return school;
  }

  async findActive(): Promise<SchoolInfo[]> {
    return this.schoolInfoRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateSchoolInfoDto,
    userId?: string,
  ): Promise<SchoolInfo> {
    const school = await this.findOne(id);

    if (updateDto.schoolCode && updateDto.schoolCode !== school.schoolCode) {
      const existing = await this.schoolInfoRepository.findOne({
        where: { schoolCode: updateDto.schoolCode },
      });
      if (existing) {
        throw new ConflictException(`学校代码 ${updateDto.schoolCode} 已存在`);
      }
    }

    Object.assign(school, updateDto);
    if (userId) {
      school.updatedBy = userId;
    }
    return this.schoolInfoRepository.save(school);
  }

  async remove(id: string): Promise<void> {
    const school = await this.findOne(id);
    await this.schoolInfoRepository.remove(school);
  }
}
