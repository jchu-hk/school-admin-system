import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { FeeType } from './fee-type.entity';
import { FeeRecord } from './fee-record.entity';
import {
  CreateFeeTypeDto,
  UpdateFeeTypeDto,
  FeeTypeQueryDto,
  CreateFeeRecordDto,
  UpdateFeeRecordDto,
  FeeRecordQueryDto,
} from './dto/fee.dto';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeType)
    private readonly feeTypeRepository: Repository<FeeType>,
    @InjectRepository(FeeRecord)
    private readonly feeRecordRepository: Repository<FeeRecord>,
  ) {}

  // ============ Fee Type Methods ============

  async createFeeType(createDto: CreateFeeTypeDto): Promise<FeeType> {
    const existing = await this.feeTypeRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new ConflictException(`费用类型代码 ${createDto.code} 已存在`);
    }

    const feeType = this.feeTypeRepository.create(createDto);
    return this.feeTypeRepository.save(feeType);
  }

  async findAllFeeTypes(
    query: FeeTypeQueryDto,
  ): Promise<{ data: FeeType[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, isActive, keyword } = query;

    const where: FindOptionsWhere<FeeType> = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    const [data, total] = await this.feeTypeRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOneFeeType(id: string): Promise<FeeType> {
    const feeType = await this.feeTypeRepository.findOne({ where: { id } });
    if (!feeType) {
      throw new NotFoundException(`费用类型 ID ${id} 不存在`);
    }
    return feeType;
  }

  async updateFeeType(
    id: string,
    updateDto: UpdateFeeTypeDto,
  ): Promise<FeeType> {
    const feeType = await this.findOneFeeType(id);

    if (updateDto.code && updateDto.code !== feeType.code) {
      const existing = await this.feeTypeRepository.findOne({
        where: { code: updateDto.code },
      });
      if (existing) {
        throw new ConflictException(`费用类型代码 ${updateDto.code} 已存在`);
      }
    }

    Object.assign(feeType, updateDto);
    return this.feeTypeRepository.save(feeType);
  }

  async removeFeeType(id: string): Promise<void> {
    const feeType = await this.findOneFeeType(id);
    await this.feeTypeRepository.remove(feeType);
  }

  // ============ Fee Record Methods ============

  async createFeeRecord(createDto: CreateFeeRecordDto): Promise<FeeRecord> {
    const feeType = await this.findOneFeeType(createDto.feeTypeId);

    const record = this.feeRecordRepository.create({
      ...createDto,
      feeTypeName: createDto.feeTypeName || feeType.name,
      paymentDate: createDto.paymentDate ? new Date(createDto.paymentDate) : null,
    } as FeeRecord);

    return this.feeRecordRepository.save(record);
  }

  async findAllFeeRecords(
    query: FeeRecordQueryDto,
  ): Promise<{ data: FeeRecord[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, grade, feeType, status, keyword } = query;

    const where: FindOptionsWhere<FeeRecord> = {};

    if (grade) where.grade = grade;
    if (feeType) where.feeTypeName = feeType;
    if (status) where.status = status;

    const [data, total] = await this.feeRecordRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    let filtered = data;
    if (keyword) {
      filtered = data.filter((r) =>
        r.studentName.toLowerCase().includes(keyword.toLowerCase()),
      );
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOneFeeRecord(id: string): Promise<FeeRecord> {
    const record = await this.feeRecordRepository.findOne({
      where: { id },
      relations: ['feeType'],
    });
    if (!record) {
      throw new NotFoundException(`费用记录 ID ${id} 不存在`);
    }
    return record;
  }

  async updateFeeRecord(
    id: string,
    updateDto: UpdateFeeRecordDto,
  ): Promise<FeeRecord> {
    const record = await this.findOneFeeRecord(id);
    Object.assign(record, updateDto);
    if (updateDto.paymentDate) {
      record.paymentDate = new Date(updateDto.paymentDate);
    }
    return this.feeRecordRepository.save(record);
  }

  async removeFeeRecord(id: string): Promise<void> {
    const record = await this.findOneFeeRecord(id);
    await this.feeRecordRepository.remove(record);
  }
}
