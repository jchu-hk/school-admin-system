import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('bus_routes')
export class BusRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'start_point', length: 200 })
  startPoint: string;

  @Column({ name: 'end_point', length: 200 })
  endPoint: string;

  @Column({ name: 'via_stops', type: 'text', nullable: true })
  viaStops: string; // JSON array of stop names

  @Column({
    name: 'estimated_duration',
    type: 'int',
    comment: '预计时长（分钟）',
  })
  estimatedDuration: number;

  @Column({ name: 'max_capacity', type: 'int', default: 40 })
  maxCapacity: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

export enum BusDirection {
  MORNING = 'morning', // 上学（家→学校）
  AFTERNOON = 'afternoon', // 放学（学校→家）
}

@Entity('bus_schedules')
export class BusSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id' })
  routeId: string;

  @ManyToOne(() => BusRoute)
  @JoinColumn({ name: 'route_id' })
  route: BusRoute;

  @Column({
    type: 'enum',
    enum: BusDirection,
  })
  direction: BusDirection;

  @Column({ name: 'departure_time', type: 'time' })
  departureTime: string;

  @Column({ name: 'arrival_time', type: 'time' })
  arrivalTime: string;

  @Column({ name: 'weekdays', length: 50, comment: '星期设置，如 1,2,3,4,5' })
  weekdays: string; // e.g. "1,2,3,4,5" for Mon-Fri

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

export enum BusRecordStatus {
  SCHEDULED = 'scheduled', // 已安排
  BOARDED = 'boarded', // 已上车
  ABSENT = 'absent', // 未上车（缺席）
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

@Entity('bus_records')
export class BusRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'schedule_id' })
  scheduleId: string;

  @ManyToOne(() => BusSchedule)
  @JoinColumn({ name: 'schedule_id' })
  schedule: BusSchedule;

  @Column({ name: 'route_id' })
  routeId: string;

  @ManyToOne(() => BusRoute)
  @JoinColumn({ name: 'route_id' })
  route: BusRoute;

  @Column({ name: 'ride_date', type: 'date' })
  rideDate: Date;

  @Column({
    type: 'enum',
    enum: BusDirection,
  })
  direction: BusDirection;

  @Column({
    type: 'enum',
    enum: BusRecordStatus,
    default: BusRecordStatus.SCHEDULED,
  })
  status: BusRecordStatus;

  @Column({ name: 'boarded_at', type: 'timestamp', nullable: true })
  boardedAt: Date;

  @Column({ name: 'picked_up_at', type: 'timestamp', nullable: true })
  pickedUpAt: Date;

  @Column({ name: 'pickup_stop', length: 200, nullable: true })
  pickupStop: string;

  @Column({ name: 'dropoff_stop', length: 200, nullable: true })
  dropoffStop: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
