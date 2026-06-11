import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { LunchOrder, LunchOrderStatus } from './lunch.entity';
import { CreateLunchOrderDto, UpdateLunchOrderDto, LunchOrderQueryDto } from './dto/lunch.dto';

@Injectable()
export class LunchService {
  constructor(
    @InjectRepository(LunchOrder)
    private lunchOrderRepository: Repository<LunchOrder>,
  ) {}

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

  async findAll(query: LunchOrderQueryDto): Promise<{ orders: LunchOrder[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const queryBuilder = this.lunchOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.student', 'student')
      .leftJoinAndSelect('order.orderer', 'orderer')
      .leftJoinAndSelect('order.confirmer', 'confirmer');

    if (query.studentId) {
      queryBuilder.andWhere('order.studentId = :studentId', { studentId: query.studentId });
    }

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.startDate) {
      queryBuilder.andWhere('order.orderDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('order.orderDate <= :endDate', { endDate: query.endDate });
    }

    queryBuilder.orderBy('order.orderDate', 'DESC').addOrderBy('order.createdAt', 'DESC');

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

  async update(id: string, updateDto: UpdateLunchOrderDto, updatedBy: string): Promise<LunchOrder> {
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

  /**
   * 获取午膳订单统计
   */
  async getStats(startDate?: string, endDate?: string): Promise<{
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
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

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
   * 获取指定日期范围内的结算金额
   */
  async getSettlement(startDate: string, endDate: string): Promise<{
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
    const confirmedOrders = orders.filter((o) => o.status === LunchOrderStatus.CONFIRMED).length;
    const cancelledOrders = orders.filter((o) => o.status === LunchOrderStatus.CANCELLED).length;

    // 只结算已确认且未取消的订单
    const settlementAmount = orders
      .filter((o) => o.status === LunchOrderStatus.CONFIRMED || o.status === LunchOrderStatus.COMPLETED)
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return { totalOrders, confirmedOrders, cancelledOrders, settlementAmount };
  }
}
