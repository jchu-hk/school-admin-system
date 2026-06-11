import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BusRoute,
  BusSchedule,
  BusRecord,
  BusRecordStatus,
  BusDirection,
} from './bus.entity';
import {
  CreateBusRouteDto,
  UpdateBusRouteDto,
  CreateBusScheduleDto,
  UpdateBusScheduleDto,
  CreateBusRecordDto,
  UpdateBusRecordDto,
  BusRecordQueryDto,
} from './dto/bus.dto';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(BusRoute)
    private busRouteRepository: Repository<BusRoute>,
    @InjectRepository(BusSchedule)
    private busScheduleRepository: Repository<BusSchedule>,
    @InjectRepository(BusRecord)
    private busRecordRepository: Repository<BusRecord>,
  ) {}

  // ==================== Routes ====================

  async createRoute(createDto: CreateBusRouteDto): Promise<BusRoute> {
    const route = this.busRouteRepository.create({
      ...createDto,
      viaStops: createDto.viaStops ? JSON.stringify(createDto.viaStops) : null,
    });
    return this.busRouteRepository.save(route);
  }

  async findAllRoutes(): Promise<BusRoute[]> {
    return this.busRouteRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findRouteById(id: string): Promise<BusRoute> {
    const route = await this.busRouteRepository.findOne({ where: { id } });
    if (!route) throw new NotFoundException('校车路线不存在');
    return route;
  }

  async updateRoute(id: string, updateDto: UpdateBusRouteDto): Promise<BusRoute> {
    const route = await this.findRouteById(id);
    Object.assign(route, updateDto);
    return this.busRouteRepository.save(route);
  }

  async deleteRoute(id: string): Promise<void> {
    await this.findRouteById(id);
    await this.busRouteRepository.softDelete(id);
  }

  // ==================== Schedules ====================

  async createSchedule(createDto: CreateBusScheduleDto): Promise<BusSchedule> {
    await this.findRouteById(createDto.routeId);
    const schedule = this.busScheduleRepository.create({
      ...createDto,
      effectiveFrom: new Date(createDto.effectiveFrom),
      effectiveTo: createDto.effectiveTo ? new Date(createDto.effectiveTo) : null,
    });
    return this.busScheduleRepository.save(schedule);
  }

  async findSchedulesByRoute(routeId: string): Promise<BusSchedule[]> {
    return this.busScheduleRepository.find({
      where: { routeId, isActive: true },
      relations: ['route'],
      order: { departureTime: 'ASC' },
    });
  }

  async findScheduleById(id: string): Promise<BusSchedule> {
    const schedule = await this.busScheduleRepository.findOne({
      where: { id },
      relations: ['route'],
    });
    if (!schedule) throw new NotFoundException('校车时刻表不存在');
    return schedule;
  }

  async updateSchedule(id: string, updateDto: UpdateBusScheduleDto): Promise<BusSchedule> {
    const schedule = await this.findScheduleById(id);
    if (updateDto.effectiveFrom) {
      updateDto.effectiveFrom = new Date(updateDto.effectiveFrom) as any;
    }
    if (updateDto.effectiveTo) {
      updateDto.effectiveTo = new Date(updateDto.effectiveTo) as any;
    }
    Object.assign(schedule, updateDto);
    return this.busScheduleRepository.save(schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.findScheduleById(id);
    await this.busScheduleRepository.softDelete(id);
  }

  // ==================== Records ====================

  async createRecord(createDto: CreateBusRecordDto): Promise<BusRecord> {
    const record = this.busRecordRepository.create({
      ...createDto,
      rideDate: new Date(createDto.rideDate),
      status: BusRecordStatus.SCHEDULED,
    });
    return this.busRecordRepository.save(record);
  }

  async findAllRecords(query: BusRecordQueryDto): Promise<{ records: BusRecord[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const queryBuilder = this.busRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.student', 'student')
      .leftJoinAndSelect('record.schedule', 'schedule')
      .leftJoinAndSelect('record.route', 'route');

    if (query.studentId) {
      queryBuilder.andWhere('record.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.status) {
      queryBuilder.andWhere('record.status = :status', { status: query.status });
    }
    if (query.direction) {
      queryBuilder.andWhere('record.direction = :direction', { direction: query.direction });
    }
    if (query.startDate) {
      queryBuilder.andWhere('record.rideDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('record.rideDate <= :endDate', { endDate: query.endDate });
    }

    queryBuilder.orderBy('record.rideDate', 'DESC').addOrderBy('record.createdAt', 'DESC');

    const [records, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { records, total };
  }

  async findRecordById(id: string): Promise<BusRecord> {
    const record = await this.busRecordRepository.findOne({
      where: { id },
      relations: ['student', 'schedule', 'route'],
    });
    if (!record) throw new NotFoundException('校车记录不存在');
    return record;
  }

  async updateRecord(id: string, updateDto: UpdateBusRecordDto): Promise<BusRecord> {
    const record = await this.findRecordById(id);
    Object.assign(record, updateDto);
    return this.busRecordRepository.save(record);
  }

  async board(id: string): Promise<BusRecord> {
    const record = await this.findRecordById(id);
    if (record.status !== BusRecordStatus.SCHEDULED) {
      throw new BadRequestException('只有已安排的记录可以标记上车');
    }
    record.status = BusRecordStatus.BOARDED;
    record.boardedAt = new Date();
    return this.busRecordRepository.save(record);
  }

  async absent(id: string): Promise<BusRecord> {
    const record = await this.findRecordById(id);
    if (record.status !== BusRecordStatus.SCHEDULED) {
      throw new BadRequestException('只有已安排的记录可以标记缺席');
    }
    record.status = BusRecordStatus.ABSENT;
    return this.busRecordRepository.save(record);
  }

  async complete(id: string): Promise<BusRecord> {
    const record = await this.findRecordById(id);
    if (![BusRecordStatus.BOARDED].includes(record.status)) {
      throw new BadRequestException('只有已上车的记录可以标记完成');
    }
    record.status = BusRecordStatus.COMPLETED;
    record.pickedUpAt = new Date();
    return this.busRecordRepository.save(record);
  }

  async cancelRecord(id: string): Promise<BusRecord> {
    const record = await this.findRecordById(id);
    if (record.status === BusRecordStatus.COMPLETED) {
      throw new BadRequestException('已完成的记录无法取消');
    }
    record.status = BusRecordStatus.CANCELLED;
    return this.busRecordRepository.save(record);
  }

  async deleteRecord(id: string): Promise<void> {
    await this.findRecordById(id);
    await this.busRecordRepository.softDelete(id);
  }

  // ==================== Stats ====================

  async getStats(startDate?: string, endDate?: string): Promise<{
    totalRecords: number;
    byStatus: Record<string, number>;
    byDirection: Record<string, number>;
    boardingRate: number;
  }> {
    const queryBuilder = this.busRecordRepository.createQueryBuilder('record');

    if (startDate) {
      queryBuilder.andWhere('record.rideDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('record.rideDate <= :endDate', { endDate });
    }

    const records = await queryBuilder.getMany();

    const totalRecords = records.length;
    const byStatus: Record<string, number> = {};
    const byDirection: Record<string, number> = {};

    records.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byDirection[r.direction] = (byDirection[r.direction] || 0) + 1;
    });

    const boardedOrCompleted = records.filter(
      (r) => r.status === BusRecordStatus.BOARDED || r.status === BusRecordStatus.COMPLETED,
    ).length;
    const boardingRate = totalRecords > 0 ? (boardedOrCompleted / totalRecords) * 100 : 0;

    return { totalRecords, byStatus, byDirection, boardingRate: Math.round(boardingRate * 100) / 100 };
  }

  async getStudentStats(
    studentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRides: number;
    boardedRides: number;
    absentRides: number;
    boardingRate: number;
  }> {
    const queryBuilder = this.busRecordRepository
      .createQueryBuilder('record')
      .where('record.studentId = :studentId', { studentId });

    if (startDate) {
      queryBuilder.andWhere('record.rideDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('record.rideDate <= :endDate', { endDate });
    }

    const records = await queryBuilder.getMany();

    const totalRides = records.length;
    const boardedRides = records.filter(
      (r) => r.status === BusRecordStatus.BOARDED || r.status === BusRecordStatus.COMPLETED,
    ).length;
    const absentRides = records.filter((r) => r.status === BusRecordStatus.ABSENT).length;
    const boardingRate = totalRides > 0 ? (boardedRides / totalRides) * 100 : 0;

    return {
      totalRides,
      boardedRides,
      absentRides,
      boardingRate: Math.round(boardingRate * 100) / 100,
    };
  }
}
