import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeItem, FeeCollection, FeeReduction, FeeStatus } from './fee.entity';
import {
  CreateFeeItemDto,
  UpdateFeeItemDto,
  CreateFeeCollectionDto,
  UpdateFeeCollectionDto,
  PayFeeDto,
  CreateFeeReductionDto,
  ApproveFeeReductionDto,
} from './dto/fee.dto';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeItem)
    private itemRepository: Repository<FeeItem>,
    @InjectRepository(FeeCollection)
    private collectionRepository: Repository<FeeCollection>,
    @InjectRepository(FeeReduction)
    private reductionRepository: Repository<FeeReduction>,
  ) {}

  // ===== FeeItem =====

  async findAllItems(
    page: number = 1,
    limit: number = 10,
    schoolId?: string,
    gradeId?: string,
    schoolYear?: string,
    semester?: string,
    isActive?: boolean,
  ) {
    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .where('item.deletedAt IS NULL');

    if (schoolId) {
      queryBuilder.andWhere('item.schoolId = :schoolId', { schoolId });
    }
    if (gradeId) {
      queryBuilder.andWhere('item.gradeId = :gradeId', { gradeId });
    }
    if (schoolYear) {
      queryBuilder.andWhere('item.schoolYear = :schoolYear', { schoolYear });
    }
    if (semester) {
      queryBuilder.andWhere('item.semester = :semester', { semester });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('item.isActive = :isActive', { isActive });
    }

    const [items, total] = await queryBuilder
      .orderBy('item.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findItemById(id: string): Promise<FeeItem> {
    const item = await this.itemRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('费用项目不存在');
    }
    return item;
  }

  async createItem(dto: CreateFeeItemDto): Promise<FeeItem> {
    const item = this.itemRepository.create(dto);
    return this.itemRepository.save(item);
  }

  async updateItem(id: string, dto: UpdateFeeItemDto): Promise<FeeItem> {
    const item = await this.findItemById(id);
    Object.assign(item, dto);
    return this.itemRepository.save(item);
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.findItemById(id);
    await this.itemRepository.softRemove(item);
  }

  // ===== FeeCollection =====

  async findAllCollections(
    page: number = 1,
    limit: number = 10,
    studentId?: string,
    parentId?: string,
    status?: FeeStatus,
    schoolId?: string,
  ) {
    const queryBuilder = this.collectionRepository
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.feeItem', 'feeItem')
      .leftJoinAndSelect('collection.parent', 'parent')
      .leftJoinAndSelect('collection.operator', 'operator')
      .where('collection.deletedAt IS NULL');

    if (studentId) {
      queryBuilder.andWhere('collection.studentId = :studentId', { studentId });
    }
    if (parentId) {
      queryBuilder.andWhere('collection.parentId = :parentId', { parentId });
    }
    if (status) {
      queryBuilder.andWhere('collection.status = :status', { status });
    }
    if (schoolId) {
      queryBuilder.andWhere('feeItem.schoolId = :schoolId', { schoolId });
    }

    const [collections, total] = await queryBuilder
      .orderBy('collection.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { collections, total };
  }

  async findCollectionById(id: string): Promise<FeeCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['feeItem', 'parent', 'operator'],
    });
    if (!collection) {
      throw new NotFoundException('费用收取记录不存在');
    }
    return collection;
  }

  async createCollection(dto: CreateFeeCollectionDto): Promise<FeeCollection> {
    const item = await this.findItemById(dto.feeItemId);

    const collection = this.collectionRepository.create({
      ...dto,
      totalAmount: item.amount,
      status: FeeStatus.PENDING,
      paidAmount: 0,
    });

    return this.collectionRepository.save(collection);
  }

  async updateCollection(
    id: string,
    dto: UpdateFeeCollectionDto,
    operatorId?: string,
  ): Promise<FeeCollection> {
    const collection = await this.findCollectionById(id);

    if (dto.status && dto.status !== collection.status) {
      if (dto.status === FeeStatus.PAID) {
        collection.paidAt = new Date();
        dto.paidAmount =
          Number(collection.totalAmount) -
          Number(collection.reductionAmount || 0);
      }
    }

    Object.assign(collection, dto);
    if (operatorId) {
      collection.operatorId = operatorId;
    }

    return this.collectionRepository.save(collection);
  }

  async payFee(
    id: string,
    dto: PayFeeDto,
    operatorId: string,
  ): Promise<FeeCollection> {
    const collection = await this.findCollectionById(id);

    if (collection.status === FeeStatus.PAID) {
      throw new BadRequestException('该费用已缴清');
    }

    const reductionAmount = Number(collection.reductionAmount || 0);
    const newPaidAmount = Number(collection.paidAmount) + dto.amount;
    const remainingAmount =
      Number(collection.totalAmount) - reductionAmount - newPaidAmount;

    if (newPaidAmount + reductionAmount > Number(collection.totalAmount)) {
      throw new BadRequestException('支付金额超出应缴金额');
    }

    collection.paidAmount = newPaidAmount;
    collection.operatorId = operatorId;

    if (remainingAmount <= 0) {
      collection.status = FeeStatus.PAID;
      collection.paidAt = new Date();
    } else {
      collection.status = FeeStatus.PARTIAL;
    }

    if (dto.remark) {
      collection.remark = dto.remark;
    }

    return this.collectionRepository.save(collection);
  }

  async deleteCollection(id: string): Promise<void> {
    const collection = await this.findCollectionById(id);
    await this.collectionRepository.softRemove(collection);
  }

  // ===== FeeReduction =====

  async findAllReductions(
    page: number = 1,
    limit: number = 10,
    studentId?: string,
  ) {
    const queryBuilder = this.reductionRepository
      .createQueryBuilder('reduction')
      .leftJoinAndSelect('reduction.feeCollection', 'feeCollection')
      .where('reduction.deletedAt IS NULL');

    if (studentId) {
      queryBuilder.andWhere('reduction.studentId = :studentId', { studentId });
    }

    const [reductions, total] = await queryBuilder
      .orderBy('reduction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { reductions, total };
  }

  async findReductionById(id: string): Promise<FeeReduction> {
    const reduction = await this.reductionRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['feeCollection', 'approver'],
    });
    if (!reduction) {
      throw new NotFoundException('减免记录不存在');
    }
    return reduction;
  }

  async createReduction(dto: CreateFeeReductionDto): Promise<FeeReduction> {
    const _collection = await this.findCollectionById(dto.feeCollectionId);

    const reduction = this.reductionRepository.create({
      ...dto,
      isApproved: false,
    });

    return this.reductionRepository.save(reduction);
  }

  async approveReduction(
    id: string,
    dto: ApproveFeeReductionDto,
    approverId: string,
  ): Promise<FeeReduction> {
    const reduction = await this.findReductionById(id);

    if (reduction.isApproved) {
      throw new BadRequestException('该减免已审核，无法重复操作');
    }

    reduction.isApproved = dto.isApproved ?? true;
    reduction.approvedBy = approverId;
    reduction.approvedAt = new Date();
    if (dto.remark) {
      reduction.remark = dto.remark;
    }

    const savedReduction = await this.reductionRepository.save(reduction);

    if (savedReduction.isApproved) {
      // 更新收费记录的减免金额
      const collection = await this.findCollectionById(
        reduction.feeCollectionId,
      );
      const existingReductions = await this.reductionRepository
        .createQueryBuilder('r')
        .where('r.feeCollectionId = :feeCollectionId', {
          feeCollectionId: reduction.feeCollectionId,
        })
        .andWhere('r.isApproved = :isApproved', { isApproved: true })
        .getMany();

      const totalReduction = existingReductions.reduce(
        (sum, r) => sum + Number(r.amount),
        0,
      );

      collection.reductionAmount = totalReduction;

      // 如果减免后金额为0，自动标记为已缴
      if (
        Number(collection.totalAmount) - totalReduction <=
        Number(collection.paidAmount)
      ) {
        collection.status = FeeStatus.PAID;
        collection.paidAt = new Date();
      }

      await this.collectionRepository.save(collection);
    }

    return savedReduction;
  }

  async deleteReduction(id: string): Promise<void> {
    const reduction = await this.findReductionById(id);
    await this.reductionRepository.softRemove(reduction);
  }

  // ===== Stats =====

  async getFeeStats(schoolId?: string): Promise<{
    totalStudents: number;
    paidCount: number;
    pendingCount: number;
    partialCount: number;
    overdueCount: number;
    totalAmount: number;
    paidAmount: number;
    reductionAmount: number;
  }> {
    const qb = this.collectionRepository
      .createQueryBuilder('collection')
      .leftJoin('collection.feeItem', 'feeItem')
      .where('collection.deletedAt IS NULL');

    if (schoolId) {
      qb.andWhere('feeItem.schoolId = :schoolId', { schoolId });
    }

    const collections = await qb.getMany();

    const totalAmount = collections.reduce(
      (sum, c) => sum + Number(c.totalAmount),
      0,
    );
    const paidAmount = collections.reduce(
      (sum, c) => sum + Number(c.paidAmount),
      0,
    );
    const reductionAmount = collections.reduce(
      (sum, c) => sum + Number(c.reductionAmount || 0),
      0,
    );

    const paidCount = collections.filter(
      (c) => c.status === FeeStatus.PAID,
    ).length;
    const pendingCount = collections.filter(
      (c) => c.status === FeeStatus.PENDING,
    ).length;
    const partialCount = collections.filter(
      (c) => c.status === FeeStatus.PARTIAL,
    ).length;
    const overdueCount = collections.filter(
      (c) => c.status === FeeStatus.OVERDUE,
    ).length;

    return {
      totalStudents: collections.length,
      paidCount,
      pendingCount,
      partialCount,
      overdueCount,
      totalAmount,
      paidAmount,
      reductionAmount,
    };
  }
}
