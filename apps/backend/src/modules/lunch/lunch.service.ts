import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, In, Between, MoreThan } from 'typeorm';
import {
  LunchOrder,
  LunchOrderStatus,
} from './lunch.entity';
import { LunchChange, LunchChangeType, LunchChangeStatus } from './lunch-change.entity';
import { LunchMenu, LunchMenuStatus } from './lunch-menu.entity';
import {
  CreateLunchOrderDto,
  UpdateLunchOrderDto,
  LunchOrderQueryDto,
} from './dto/lunch.dto';
import {
  CreateLunchChangeDto,
  LunchChangeQueryDto,
  ApproveLunchChangeDto,
  RejectLunchChangeDto,
  CreateLunchMenuDto,
  UpdateLunchMenuDto,
  LunchMenuQueryDto,
  SupplierReportQueryDto,
  PredictionQueryDto,
} from './dto/lunch-change.dto';

// 默认截止时间（14:00）
const DEFAULT_CUTOFF_HOUR = 14;

@Injectable()
export class LunchService {
  constructor(
    @InjectRepository(LunchOrder)
    private lunchOrderRepository: Repository<LunchOrder>,
    @InjectRepository(LunchChange)
    private lunchChangeRepository: Repository<LunchChange>,
    @InjectRepository(LunchMenu)
    private lunchMenuRepository: Repository<LunchMenu>,
  ) {}

  // ==================== 订单操作（保留原有） ====================

  async create(createDto: CreateLunchOrderDto): Promise<LunchOrder> {
    const quantity = createDto.quantity || 1;
    const totalAmount = createDto.menuPrice * quantity;

    const order = this.lunchOrderRepository.create({
      ...createDto,
      orderDate: new Date(createDto.orderDate),
      quantity,
      totalAmount,
      status: LunchOrderStatus.PENDING,
    });

    return this.lunchOrderRepository.save(order);
  }

  async findAll(
    query: LunchOrderQueryDto,
  ): Promise<{ orders: LunchOrder[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const queryBuilder = this.lunchOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.student', 'student')
      .leftJoinAndSelect('order.orderer', 'orderer')
      .leftJoinAndSelect('order.confirmer', 'confirmer');

    if (query.studentId) {
      queryBuilder.andWhere('order.studentId = :studentId', {
        studentId: query.studentId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.startDate) {
      queryBuilder.andWhere('order.orderDate >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('order.orderDate <= :endDate', {
        endDate: query.endDate,
      });
    }

    queryBuilder
      .orderBy('order.orderDate', 'DESC')
      .addOrderBy('order.createdAt', 'DESC');

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }

  async findOne(id: string): Promise<LunchOrder> {
    const order = await this.lunchOrderRepository.findOne({
      where: { id },
      relations: ['student', 'orderer', 'confirmer'],
    });

    if (!order) {
      throw new NotFoundException('午膳订单不存在');
    }

    return order;
  }

  async update(
    id: string,
    updateDto: UpdateLunchOrderDto,
    updatedBy: string,
  ): Promise<LunchOrder> {
    const order = await this.findOne(id);

    Object.assign(order, updateDto);

    if (updateDto.menuPrice || updateDto.quantity) {
      order.quantity = updateDto.quantity || order.quantity;
      order.totalAmount = order.menuPrice * order.quantity;
    }

    order.updatedBy = updatedBy;

    return this.lunchOrderRepository.save(order);
  }

  async confirm(id: string, confirmedBy: string): Promise<LunchOrder> {
    const order = await this.findOne(id);

    if (order.status !== LunchOrderStatus.PENDING) {
      throw new BadRequestException('只有待确认的订单可以确认');
    }

    order.status = LunchOrderStatus.CONFIRMED;
    order.confirmedBy = confirmedBy;
    order.confirmedAt = new Date();

    return this.lunchOrderRepository.save(order);
  }

  async cancel(id: string, cancelledBy: string): Promise<LunchOrder> {
    const order = await this.findOne(id);

    if (order.status === LunchOrderStatus.COMPLETED) {
      throw new BadRequestException('已完成的订单无法取消');
    }

    order.status = LunchOrderStatus.CANCELLED;
    order.updatedBy = cancelledBy;

    return this.lunchOrderRepository.save(order);
  }

  async complete(id: string): Promise<LunchOrder> {
    const order = await this.findOne(id);

    if (order.status !== LunchOrderStatus.CONFIRMED) {
      throw new BadRequestException('只有已确认的订单可以标记完成');
    }

    order.status = LunchOrderStatus.COMPLETED;

    return this.lunchOrderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.lunchOrderRepository.softDelete(id);
  }

  // ==================== 变更操作 ====================

  /**
   * 检查是否超过截止时间
   */
  private isAfterCutoff(date: Date = new Date(), cutoffHour = DEFAULT_CUTOFF_HOUR): boolean {
    const hour = date.getHours();
    return hour >= cutoffHour;
  }

  /**
   * 提交变更申请
   */
  async createChange(createDto: CreateLunchChangeDto): Promise<LunchChange> {
    const now = new Date();
    const cutoffTime = '14:00';

    // 超时自动拒绝
    const status = this.isAfterCutoff(now)
      ? LunchChangeStatus.AUTO_REJECTED
      : LunchChangeStatus.PENDING;

    const change = this.lunchChangeRepository.create({
      ...createDto,
      cutoffTime,
      status,
    });

    return this.lunchChangeRepository.save(change);
  }

  /**
   * 获取变更列表
   */
  async findAllChanges(
    query: LunchChangeQueryDto,
  ): Promise<{ changes: LunchChange[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const queryBuilder = this.lunchChangeRepository
      .createQueryBuilder('change')
      .leftJoinAndSelect('change.student', 'student')
      .leftJoinAndSelect('change.creator', 'creator')
      .leftJoinAndSelect('change.reviewer', 'reviewer');

    if (query.studentId) {
      queryBuilder.andWhere('change.studentId = :studentId', {
        studentId: query.studentId,
      });
    }

    if (query.changeType) {
      queryBuilder.andWhere('change.changeType = :changeType', {
        changeType: query.changeType,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('change.status = :status', { status: query.status });
    }

    if (query.startDate) {
      queryBuilder.andWhere('change.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('change.createdAt <= :endDate', {
        endDate: query.endDate,
      });
    }

    queryBuilder
      .orderBy('change.createdAt', 'DESC');

    const [changes, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { changes, total };
  }

  /**
   * 获取变更详情
   */
  async findOneChange(id: string): Promise<LunchChange> {
    const change = await this.lunchChangeRepository.findOne({
      where: { id },
      relations: ['student', 'creator', 'reviewer', 'order'],
    });

    if (!change) {
      throw new NotFoundException('变更记录不存在');
    }

    return change;
  }

  /**
   * 批准变更申请
   */
  async approveChange(
    id: string,
    reviewedBy: string,
    _dto?: ApproveLunchChangeDto,
  ): Promise<LunchChange> {
    const change = await this.findOneChange(id);

    if (change.status !== LunchChangeStatus.PENDING) {
      throw new BadRequestException('只有待审核的变更可以批准');
    }

    // 同步更新原订单
    if (change.orderId) {
      const order = await this.lunchOrderRepository.findOne({
        where: { id: change.orderId },
      });

      if (order) {
        if (change.changeType === LunchChangeType.CANCEL) {
          order.status = LunchOrderStatus.CANCELLED;
        } else if (change.changeType === LunchChangeType.MODIFY) {
          if (change.newItem) order.menuName = change.newItem;
          if (change.newQuantity) order.quantity = change.newQuantity;
          if (change.newPrice) {
            order.menuPrice = change.newPrice;
            order.totalAmount = change.newPrice * order.quantity;
          }
        }
        order.updatedBy = reviewedBy;
        await this.lunchOrderRepository.save(order);
      }
    } else if (change.changeType === LunchChangeType.ADD) {
      // 加单：创建新订单
      await this.lunchOrderRepository.save({
        studentId: change.studentId,
        orderedBy: change.createdBy,
        orderDate: new Date(),
        menuName: change.newItem,
        menuPrice: change.newPrice || 0,
        quantity: change.newQuantity || 1,
        totalAmount: (change.newPrice || 0) * (change.newQuantity || 1),
        status: LunchOrderStatus.CONFIRMED,
        createdBy: change.createdBy,
      });
    }

    change.status = LunchChangeStatus.APPROVED;
    change.reviewedBy = reviewedBy;
    change.reviewedAt = new Date();

    return this.lunchChangeRepository.save(change);
  }

  /**
   * 拒绝变更申请
   */
  async rejectChange(
    id: string,
    reviewedBy: string,
    dto: RejectLunchChangeDto,
  ): Promise<LunchChange> {
    const change = await this.findOneChange(id);

    if (change.status !== LunchChangeStatus.PENDING) {
      throw new BadRequestException('只有待审核的变更可以拒绝');
    }

    change.status = LunchChangeStatus.REJECTED;
    change.reviewedBy = reviewedBy;
    change.reviewedAt = new Date();
    change.rejectReason = dto.rejectReason;

    return this.lunchChangeRepository.save(change);
  }

  // ==================== 菜单操作 ====================

  async createMenu(createDto: CreateLunchMenuDto): Promise<LunchMenu> {
    const menu = this.lunchMenuRepository.create(createDto);
    return this.lunchMenuRepository.save(menu);
  }

  async findAllMenus(
    query: LunchMenuQueryDto,
  ): Promise<{ menus: LunchMenu[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const queryBuilder = this.lunchMenuRepository.createQueryBuilder('menu');

    if (query.supplier) {
      queryBuilder.andWhere('menu.supplier = :supplier', {
        supplier: query.supplier,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('menu.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('menu.createdAt', 'DESC');

    const [menus, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { menus, total };
  }

  async findOneMenu(id: string): Promise<LunchMenu> {
    const menu = await this.lunchMenuRepository.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('菜单项不存在');
    }
    return menu;
  }

  async updateMenu(
    id: string,
    updateDto: UpdateLunchMenuDto,
    updatedBy: string,
  ): Promise<LunchMenu> {
    const menu = await this.findOneMenu(id);
    Object.assign(menu, updateDto);
    menu.updatedBy = updatedBy;
    return this.lunchMenuRepository.save(menu);
  }

  async removeMenu(id: string): Promise<void> {
    await this.findOneMenu(id);
    await this.lunchMenuRepository.softDelete(id);
  }

  // ==================== 统计 & 报表 ====================

  async getStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalOrders: number;
    totalAmount: number;
    byStatus: Record<string, number>;
    byStudent: Record<string, { count: number; amount: number }>;
  }> {
    const queryBuilder = this.lunchOrderRepository.createQueryBuilder('order');

    if (startDate) {
      queryBuilder.andWhere('order.orderDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.orderDate <= :endDate', { endDate });
    }

    const orders = await queryBuilder.getMany();

    const totalOrders = orders.length;
    const totalAmount = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    const byStatus: Record<string, number> = {};
    orders.forEach((order) => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    });

    const byStudent: Record<string, { count: number; amount: number }> = {};
    orders.forEach((order) => {
      if (!byStudent[order.studentId]) {
        byStudent[order.studentId] = { count: 0, amount: 0 };
      }
      byStudent[order.studentId].count += 1;
      byStudent[order.studentId].amount += Number(order.totalAmount);
    });

    return { totalOrders, totalAmount, byStatus, byStudent };
  }

  /**
   * 供应商报表
   */
  async getSupplierReport(
    query: SupplierReportQueryDto,
  ): Promise<{
    suppliers: Array<{
      supplier: string;
      totalOrders: number;
      totalAmount: number;
      byStatus: Record<string, number>;
    }>;
    grandTotal: { orders: number; amount: number };
  }> {
    const queryBuilder = this.lunchOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.student', 'student');

    queryBuilder.andWhere('order.orderDate >= :startDate', {
      startDate: query.startDate,
    });
    queryBuilder.andWhere('order.orderDate <= :endDate', {
      endDate: query.endDate,
    });

    if (query.supplier) {
      queryBuilder.andWhere('order.menuName LIKE :supplier', {
        supplier: `%${query.supplier}%`,
      });
    }

    const orders = await queryBuilder.getMany();

    // 按供应商分组（从菜品名中提取供应商标签，或按menuName前缀分组）
    const supplierMap: Record<
      string,
      { totalOrders: number; totalAmount: number; byStatus: Record<string, number> }
    > = {};

    orders.forEach((order) => {
      // 简单策略：按 menuName 第一段作为供应商名
      // 实际场景中建议在 lunch_orders 中增加 supplier 字段
      const supplier = this.extractSupplier(order.menuName);
      if (!supplierMap[supplier]) {
        supplierMap[supplier] = { totalOrders: 0, totalAmount: 0, byStatus: {} };
      }
      supplierMap[supplier].totalOrders += 1;
      supplierMap[supplier].totalAmount += Number(order.totalAmount);
      supplierMap[supplier].byStatus[order.status] =
        (supplierMap[supplier].byStatus[order.status] || 0) + 1;
    });

    const suppliers = Object.entries(supplierMap).map(([supplier, data]) => ({
      supplier,
      ...data,
    }));

    const grandTotal = orders.reduce(
      (acc, o) => ({
        orders: acc.orders + 1,
        amount: acc.amount + Number(o.totalAmount),
      }),
      { orders: 0, amount: 0 },
    );

    return { suppliers, grandTotal };
  }

  /**
   * 简单供应商提取（按菜单名前缀）
   * 实际建议：lunch_orders 关联 lunch_menu，从菜单表读取 supplier
   */
  private extractSupplier(menuName: string): string {
    // 格式: "供应商名-菜品名" 或直接返回 "默认供应商"
    const parts = menuName.split('-');
    return parts.length > 1 ? parts[0].trim() : '默认供应商';
  }

  /**
   * 预订预测
   * 基于最近28天历史数据的加权移动平均
   */
  async getPrediction(query: PredictionQueryDto): Promise<{
    predictions: Array<{
      date: string;
      predictedOrders: number;
      predictedAmount: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
    basedOnDays: number;
  }> {
    const days = query.days || 7;
    const historyDays = 28;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - historyDays * 24 * 60 * 60 * 1000);

    const queryBuilder = this.lunchOrderRepository
      .createQueryBuilder('order')
      .select("DATE(order.orderDate)", 'orderDate')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.totalAmount)', 'amount')
      .where('order.orderDate >= :startDate', {
        startDate: startDate.toISOString().split('T')[0],
      })
      .andWhere('order.orderDate <= :endDate', {
        endDate: endDate.toISOString().split('T')[0],
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [LunchOrderStatus.CONFIRMED, LunchOrderStatus.COMPLETED],
      })
      .groupBy("DATE(order.orderDate)")
      .orderBy("DATE(order.orderDate)", 'ASC');

    const dailyData: Array<{ orderDate: string; count: string; amount: string }> =
      await queryBuilder.getRawMany();

    if (dailyData.length < 7) {
      // 数据不足，返回默认值
      const predictions = [];
      for (let i = 1; i <= days; i++) {
        const date = new Date(endDate.getTime() + i * 24 * 60 * 60 * 1000);
        predictions.push({
          date: date.toISOString().split('T')[0],
          predictedOrders: 0,
          predictedAmount: 0,
          confidence: 'low' as const,
        });
      }
      return { predictions, basedOnDays: dailyData.length };
    }

    // 计算加权平均（近期权重更高）
    const weights = dailyData.map((_, i) => (i + 1) / dailyData.length);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const avgOrders =
      dailyData.reduce((sum, d, i) => sum + Number(d.count) * weights[i], 0) /
      totalWeight;
    const avgAmount =
      dailyData.reduce((sum, d, i) => sum + Number(d.amount || 0) * weights[i], 0) /
      totalWeight;

    // 生成预测
    const predictions = [];
    for (let i = 1; i <= days; i++) {
      const date = new Date(endDate.getTime() + i * 24 * 60 * 60 * 1000);
      // 预测值 = 移动平均 * 趋势因子（简化：使用 ±10% 波动）
      const variance = 0.9 + Math.random() * 0.2;
      const predictedOrders = Math.round(avgOrders * variance);
      const predictedAmount = Math.round(avgAmount * variance * 100) / 100;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (dailyData.length >= 21) confidence = 'high';
      else if (dailyData.length >= 14) confidence = 'medium';

      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedOrders,
        predictedAmount,
        confidence,
      });
    }

    return { predictions, basedOnDays: dailyData.length };
  }

  /**
   * 获取当日截止状态
   */
  async getCutoffStatus(): Promise<{
    cutoffTime: string;
    isAfterCutoff: boolean;
    pendingChangesCount: number;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const pendingCount = await this.lunchChangeRepository.count({
      where: {
        status: LunchChangeStatus.PENDING,
      },
    });

    return {
      cutoffTime: '14:00',
      isAfterCutoff: this.isAfterCutoff(now),
      pendingChangesCount: pendingCount,
    };
  }

  /**
   * 定时任务：批量自动拒绝超时变更
   */
  async autoRejectExpiredChanges(): Promise<number> {
    const now = new Date();

    // 查找所有超过截止时间仍未审核的变更
    // 截止时间=当日14:00，在14:00之后查询当天14:00之前创建的pending变更
    const today = now.toISOString().split('T')[0];
    const cutoffDateTime = new Date(`${today}T14:00:00`);

    const result = await this.lunchChangeRepository
      .createQueryBuilder('change')
      .update(LunchChange)
      .set({
        status: LunchChangeStatus.AUTO_REJECTED,
        rejectReason: '超过每日截止时间（14:00），系统自动拒绝',
        reviewedAt: now,
        updatedAt: now,
      })
      .where('change.status = :status', { status: LunchChangeStatus.PENDING })
      .andWhere('change.createdAt < :cutoff', { cutoff: cutoffDateTime })
      .execute();

    return result.affected || 0;
  }

  /**
   * 获取结算金额（保留原有）
   */
  async getSettlement(
    startDate: string,
    endDate: string,
  ): Promise<{
    totalOrders: number;
    confirmedOrders: number;
    cancelledOrders: number;
    settlementAmount: number;
  }> {
    const queryBuilder = this.lunchOrderRepository
      .createQueryBuilder('order')
      .where('order.orderDate >= :startDate', { startDate })
      .andWhere('order.orderDate <= :endDate', { endDate });

    const orders = await queryBuilder.getMany();

    const totalOrders = orders.length;
    const confirmedOrders = orders.filter(
      (o) => o.status === LunchOrderStatus.CONFIRMED,
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === LunchOrderStatus.CANCELLED,
    ).length;

    const settlementAmount = orders
      .filter(
        (o) =>
          o.status === LunchOrderStatus.CONFIRMED ||
          o.status === LunchOrderStatus.COMPLETED,
      )
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return { totalOrders, confirmedOrders, cancelledOrders, settlementAmount };
  }
}
