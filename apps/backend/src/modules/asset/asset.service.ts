import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Between } from 'typeorm';
import { Asset, AssetRental, AssetStatus } from './asset.entity';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetQueryDto,
  CreateAssetRentalDto,
  UpdateAssetRentalDto,
  ApproveRentalDto,
  ReturnRentalDto,
  AssetRentalQueryDto,
} from './dto/asset.dto';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetRental)
    private readonly rentalRepository: Repository<AssetRental>,
  ) {}

  // ============ Asset Methods ============

  async createAsset(createDto: CreateAssetDto): Promise<Asset> {
    // Check for duplicate code
    const existing = await this.assetRepository.findOne({
      where: { code: createDto.code, schoolId: createDto.schoolId },
    });

    if (existing) {
      throw new ConflictException(`资产编号 ${createDto.code} 已存在`);
    }

    const asset = this.assetRepository.create({
      ...createDto,
      purchaseDate: createDto.purchaseDate
        ? new Date(createDto.purchaseDate)
        : null,
      availableQuantity: createDto.quantity || 1,
    } as Asset);

    return this.assetRepository.save(asset);
  }

  async findAllAssets(query: AssetQueryDto): Promise<{
    data: Asset[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, schoolId, category, status, location, keyword, isActive } =
      query;

    const where: FindOptionsWhere<Asset> = {};

    if (schoolId) where.schoolId = schoolId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (location) where.location = location;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await this.assetRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Filter by keyword if provided
    let filtered = data;
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = data.filter(
        (asset) =>
          asset.name.toLowerCase().includes(lowerKeyword) ||
          asset.code.toLowerCase().includes(lowerKeyword) ||
          (asset.brand && asset.brand.toLowerCase().includes(lowerKeyword)) ||
          (asset.model && asset.model.toLowerCase().includes(lowerKeyword)) ||
          (asset.serialNumber &&
            asset.serialNumber.toLowerCase().includes(lowerKeyword)),
      );
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOneAsset(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`资产 ID ${id} 不存在`);
    }
    return asset;
  }

  async updateAsset(id: string, updateDto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOneAsset(id);

    // Check for duplicate code if updating
    if (updateDto.code && updateDto.code !== asset.code) {
      const existing = await this.assetRepository.findOne({
        where: { code: updateDto.code, schoolId: asset.schoolId },
      });
      if (existing) {
        throw new ConflictException(`资产编号 ${updateDto.code} 已存在`);
      }
    }

    Object.assign(asset, updateDto);

    if (updateDto.purchaseDate) {
      asset.purchaseDate = new Date(updateDto.purchaseDate);
    }

    return this.assetRepository.save(asset);
  }

  async removeAsset(id: string): Promise<void> {
    const asset = await this.findOneAsset(id);
    await this.assetRepository.remove(asset);
  }

  async getAssetStatistics(schoolId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const assets = await this.assetRepository.find({ where: { schoolId } });

    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + Number(asset.value), 0);

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    assets.forEach((asset) => {
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
      byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    });

    return { totalAssets, totalValue, byStatus, byCategory };
  }

  // ============ Asset Rental Methods ============

  async createRental(createDto: CreateAssetRentalDto, renterId: string, renterName: string): Promise<AssetRental> {
    // Check if asset exists and is available
    const asset = await this.findOneAsset(createDto.assetId);

    if (asset.status !== AssetStatus.AVAILABLE) {
      throw new BadRequestException(`资产 ${asset.name} 当前不可用`);
    }

    if (asset.availableQuantity < (createDto.quantity || 1)) {
      throw new BadRequestException(
        `资产 ${asset.name} 可用数量不足，当前可用: ${asset.availableQuantity}`,
      );
    }

    const rental = this.rentalRepository.create({
      ...createDto,
      lendDate: new Date(createDto.lendDate),
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
      renterId,
      renterName,
      quantity: createDto.quantity || 1,
      status: 'pending',
    } as AssetRental);

    return this.rentalRepository.save(rental);
  }

  async findAllRentals(query: AssetRentalQueryDto): Promise<{
    data: AssetRental[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, assetId, borrowerId, status, keyword, startDate, endDate } =
      query;

    const where: FindOptionsWhere<AssetRental> = {};

    if (assetId) where.assetId = assetId;
    if (borrowerId) where.borrowerId = borrowerId;
    if (status) where.status = status;

    let dateCondition: any = undefined;
    if (startDate && endDate) {
      dateCondition = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.rentalRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Filter by keyword if provided
    let filtered = data;
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = data.filter(
        (rental) =>
          rental.borrowerName.toLowerCase().includes(lowerKeyword) ||
          rental.borrowerDepartment?.toLowerCase().includes(lowerKeyword) ||
          rental.purpose?.toLowerCase().includes(lowerKeyword),
      );
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOneRental(id: string): Promise<AssetRental> {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      relations: [],
    });
    if (!rental) {
      throw new NotFoundException(`租借记录 ID ${id} 不存在`);
    }
    return rental;
  }

  async approveRental(
    id: string,
    renterId: string,
    renterName: string,
    dto: ApproveRentalDto,
  ): Promise<AssetRental> {
    const rental = await this.findOneRental(id);

    if (rental.status !== 'pending') {
      throw new BadRequestException('只能审批待处理的借出申请');
    }

    const asset = await this.findOneAsset(rental.assetId);

    if (asset.availableQuantity < rental.quantity) {
      throw new BadRequestException(`资产 ${asset.name} 可用数量不足`);
    }

    // Update rental
    rental.status = 'approved';
    rental.renterId = renterId;
    rental.renterName = renterName;
    if (dto.dueDate) {
      rental.dueDate = new Date(dto.dueDate);
    }
    if (dto.note) {
      rental.note = dto.note;
    }

    const saved = await this.rentalRepository.save(rental);

    // Update asset availability
    asset.availableQuantity -= rental.quantity;
    if (asset.availableQuantity === 0) {
      asset.status = AssetStatus.IN_USE;
    }
    await this.assetRepository.save(asset);

    return saved;
  }

  async lendAsset(id: string): Promise<AssetRental> {
    const rental = await this.findOneRental(id);

    if (rental.status !== 'approved') {
      throw new BadRequestException('只能发放已审批的借出申请');
    }

    rental.status = 'lent';
    return this.rentalRepository.save(rental);
  }

  async returnAsset(id: string, dto: ReturnRentalDto): Promise<AssetRental> {
    const rental = await this.findOneRental(id);

    if (!['lent', 'overdue'].includes(rental.status)) {
      throw new BadRequestException('只能归还已借出的资产');
    }

    const quantity = dto.quantity || rental.quantity;

    if (quantity > rental.quantity) {
      throw new BadRequestException('归还数量不能大于借出数量');
    }

    // Update rental
    rental.status = 'returned';
    rental.returnDate = new Date();
    rental.returnNote = dto.returnNote;
    if (quantity < rental.quantity) {
      rental.quantity = quantity;
    }

    const saved = await this.rentalRepository.save(rental);

    // Update asset availability
    const asset = await this.findOneAsset(rental.assetId);
    asset.availableQuantity += quantity;

    // Check if asset should be available again
    if (asset.status === AssetStatus.IN_USE && asset.availableQuantity > 0) {
      asset.status = AssetStatus.AVAILABLE;
    }

    await this.assetRepository.save(asset);

    return saved;
  }

  async rejectRental(id: string, note: string): Promise<AssetRental> {
    const rental = await this.findOneRental(id);

    if (rental.status !== 'pending') {
      throw new BadRequestException('只能拒绝待处理的借出申请');
    }

    rental.status = 'rejected';
    rental.note = note;

    return this.rentalRepository.save(rental);
  }

  async removeRental(id: string): Promise<void> {
    const rental = await this.findOneRental(id);
    await this.rentalRepository.remove(rental);
  }

  async updateRental(id: string, updateDto: UpdateAssetRentalDto): Promise<AssetRental> {
    const rental = await this.findOneRental(id);

    Object.assign(rental, updateDto);

    if (updateDto.dueDate) {
      rental.dueDate = new Date(updateDto.dueDate);
    }
    if (updateDto.returnDate) {
      rental.returnDate = new Date(updateDto.returnDate);
    }

    return this.rentalRepository.save(rental);
  }

  async getOverdueRentals(): Promise<AssetRental[]> {
    const now = new Date();
    return this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.status IN (:...statuses)', { statuses: ['lent', 'approved'] })
      .andWhere('rental.dueDate < :now', { now })
      .getMany();
  }

  async updateOverdueRentals(): Promise<number> {
    const overdueRentals = await this.getOverdueRentals();

    for (const rental of overdueRentals) {
      if (rental.status === 'lent') {
        rental.status = 'overdue';
        await this.rentalRepository.save(rental);
      }
    }

    return overdueRentals.length;
  }
}
