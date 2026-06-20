import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { FeeType } from './fee-type.entity';
import { FeeRecord } from './fee-record.entity';
import { FeeItem, FeeCollection, FeeReduction, FeeStatus } from './fee.entity';
import {
  CreateFeeTypeDto,
  UpdateFeeTypeDto,
  FeeTypeQueryDto,
  CreateFeeRecordDto,
  UpdateFeeRecordDto,
  FeeRecordQueryDto,
  CreateFeeItemDto,
  UpdateFeeItemDto,
  FeeItemQueryDto,
  CreateFeeCollectionDto,
  UpdateFeeCollectionDto,
  RecordPaymentDto,
  FeeCollectionQueryDto,
  CreateFeeReductionDto,
  ApproveReductionDto,
  FeeReductionQueryDto,
} from './dto/fee.dto';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeType)
    private readonly feeTypeRepository: Repository<FeeType>,
    @InjectRepository(FeeRecord)
    private readonly feeRecordRepository: Repository<FeeRecord>,
    @InjectRepository(FeeItem)
    private readonly feeItemRepository: Repository<FeeItem>,
    @InjectRepository(FeeCollection)
    private readonly feeCollectionRepository: Repository<FeeCollection>,
    @InjectRepository(FeeReduction)
    private readonly feeReductionRepository: Repository<FeeReduction>,
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

  async findAllFeeTypes(query: FeeTypeQueryDto): Promise<{
    data: FeeType[];
    total: number;
    page: number;
    pageSize: number;
  }> {
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
    const record = this.feeRecordRepository.create({
      ...createDto,
      paymentDate: createDto.paymentDate
        ? new Date(createDto.paymentDate)
        : null,
    } as FeeRecord);

    return this.feeRecordRepository.save(record);
  }

  async findAllFeeRecords(query: FeeRecordQueryDto): Promise<{
    data: FeeRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
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

  // ============ Fee Item Methods ============

  async createFeeItem(createDto: CreateFeeItemDto): Promise<FeeItem> {
    const item = this.feeItemRepository.create({
      ...createDto,
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
    } as FeeItem);
    return this.feeItemRepository.save(item);
  }

  async findAllFeeItems(query: FeeItemQueryDto): Promise<{
    data: FeeItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, schoolId, gradeId, category, schoolYear, semester, isActive, keyword } = query;

    const where: FindOptionsWhere<FeeItem> = {};

    if (schoolId) where.schoolId = schoolId;
    if (gradeId) where.gradeId = gradeId;
    if (category) where.category = category;
    if (schoolYear) where.schoolYear = schoolYear;
    if (semester) where.semester = semester;
    if (isActive !== undefined) where.isActive = isActive;
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    const [data, total] = await this.feeItemRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOneFeeItem(id: string): Promise<FeeItem> {
    const item = await this.feeItemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`费用项目 ID ${id} 不存在`);
    }
    return item;
  }

  async updateFeeItem(id: string, updateDto: UpdateFeeItemDto): Promise<FeeItem> {
    const item = await this.findOneFeeItem(id);
    Object.assign(item, updateDto);
    if (updateDto.dueDate) {
      item.dueDate = new Date(updateDto.dueDate);
    }
    return this.feeItemRepository.save(item);
  }

  async removeFeeItem(id: string): Promise<void> {
    const item = await this.findOneFeeItem(id);
    await this.feeItemRepository.remove(item);
  }

  // ============ Fee Collection Methods ============

  async createFeeCollection(createDto: CreateFeeCollectionDto): Promise<FeeCollection> {
    const feeItem = await this.findOneFeeItem(createDto.feeItemId);

    const collection = this.feeCollectionRepository.create({
      feeItemId: createDto.feeItemId,
      studentId: createDto.studentId,
      parentId: createDto.parentId,
      totalAmount: feeItem.amount,
      status: FeeStatus.PENDING,
      paymentDeadline: createDto.paymentDeadline
        ? new Date(createDto.paymentDeadline)
        : null,
      remark: createDto.remark,
    } as FeeCollection);

    return this.feeCollectionRepository.save(collection);
  }

  async findAllFeeCollections(query: FeeCollectionQueryDto): Promise<{
    data: FeeCollection[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, studentId, feeItemId, status, schoolYear, semester } = query;

    const where: FindOptionsWhere<FeeCollection> = {};

    if (studentId) where.studentId = studentId;
    if (feeItemId) where.feeItemId = feeItemId;
    if (status) where.status = status;

    const [data, total] = await this.feeCollectionRepository.findAndCount({
      where,
      relations: ['feeItem'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Filter by schoolYear/semester from feeItem if needed
    let filtered = data;
    if (schoolYear || semester) {
      filtered = data.filter((c) => {
        const item = c.feeItem as FeeItem;
        if (schoolYear && item?.schoolYear !== schoolYear) return false;
        if (semester && item?.semester !== semester) return false;
        return true;
      });
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOneFeeCollection(id: string): Promise<FeeCollection> {
    const collection = await this.feeCollectionRepository.findOne({
      where: { id },
      relations: ['feeItem'],
    });
    if (!collection) {
      throw new NotFoundException(`费用征收记录 ID ${id} 不存在`);
    }
    return collection;
  }

  async updateFeeCollection(
    id: string,
    updateDto: UpdateFeeCollectionDto,
  ): Promise<FeeCollection> {
    const collection = await this.findOneFeeCollection(id);
    Object.assign(collection, updateDto);
    if (updateDto.paymentDeadline) {
      collection.paymentDeadline = new Date(updateDto.paymentDeadline);
    }
    return this.feeCollectionRepository.save(collection);
  }

  async recordPayment(
    id: string,
    operatorId: string,
    recordPaymentDto: RecordPaymentDto,
  ): Promise<FeeCollection> {
    const collection = await this.findOneFeeCollection(id);
    const paidAmount = Number(collection.paidAmount) + recordPaymentDto.amount;
    const totalAmount = Number(collection.totalAmount);

    // Calculate remaining after reductions
    const reductionAmount = Number(collection.reductionAmount) || 0;
    const effectiveTotal = totalAmount - reductionAmount;

    collection.paidAmount = Math.min(paidAmount, effectiveTotal);
    collection.operatorId = operatorId;

    if (collection.paidAmount >= effectiveTotal) {
      collection.status = FeeStatus.PAID;
      collection.paidAt = new Date();
    } else if (collection.paidAmount > 0) {
      collection.status = FeeStatus.PARTIAL;
    }

    if (recordPaymentDto.remark) {
      collection.remark = recordPaymentDto.remark;
    }

    return this.feeCollectionRepository.save(collection);
  }

  async removeFeeCollection(id: string): Promise<void> {
    const collection = await this.findOneFeeCollection(id);
    await this.feeCollectionRepository.remove(collection);
  }

  // ============ Fee Reduction Methods ============

  async createFeeReduction(createDto: CreateFeeReductionDto): Promise<FeeReduction> {
    const collection = await this.findOneFeeCollection(createDto.feeCollectionId);

    const reduction = this.feeReductionRepository.create({
      ...createDto,
    } as FeeReduction);

    const saved = await this.feeReductionRepository.save(reduction);

    // Update collection reduction amount
    const reductions = await this.feeReductionRepository.find({
      where: { feeCollectionId: createDto.feeCollectionId, isApproved: true },
    });
    const totalReduction = reductions.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    collection.reductionAmount = totalReduction;
    await this.feeCollectionRepository.save(collection);

    return saved;
  }

  async findAllFeeReductions(query: FeeReductionQueryDto): Promise<{
    data: FeeReduction[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, studentId, feeCollectionId, reductionType, isApproved } = query;

    const where: FindOptionsWhere<FeeReduction> = {};

    if (studentId) where.studentId = studentId;
    if (feeCollectionId) where.feeCollectionId = feeCollectionId;
    if (reductionType) where.reductionType = reductionType;
    if (isApproved !== undefined) where.isApproved = isApproved;

    const [data, total] = await this.feeReductionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOneFeeReduction(id: string): Promise<FeeReduction> {
    const reduction = await this.feeReductionRepository.findOne({ where: { id } });
    if (!reduction) {
      throw new NotFoundException(`费用减免记录 ID ${id} 不存在`);
    }
    return reduction;
  }

  async approveFeeReduction(
    id: string,
    approverId: string,
    dto: ApproveReductionDto,
  ): Promise<FeeReduction> {
    const reduction = await this.findOneFeeReduction(id);

    if (reduction.isApproved) {
      throw new ConflictException('该减免申请已审批');
    }

    reduction.isApproved = true;
    reduction.approvedBy = approverId;
    reduction.approvedAt = new Date();
    if (dto.remark) {
      reduction.remark = dto.remark;
    }

    const saved = await this.feeReductionRepository.save(reduction);

    // Update collection reduction amount
    const collection = await this.findOneFeeCollection(reduction.feeCollectionId);
    const reductions = await this.feeReductionRepository.find({
      where: { feeCollectionId: reduction.feeCollectionId, isApproved: true },
    });
    const totalReduction = reductions.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    collection.reductionAmount = totalReduction;

    // Update status if fully paid after reduction
    const effectiveTotal = Number(collection.totalAmount) - totalReduction;
    if (Number(collection.paidAmount) >= effectiveTotal && effectiveTotal > 0) {
      collection.status = FeeStatus.PAID;
      collection.paidAt = new Date();
    }

    await this.feeCollectionRepository.save(collection);

    return saved;
  }

  async removeFeeReduction(id: string): Promise<void> {
    const reduction = await this.findOneFeeReduction(id);
    await this.feeReductionRepository.remove(reduction);
  }
}
