import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LunchMenuStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('lunch_menu')
export class LunchMenu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'available_days', type: 'simple-array', nullable: true })
  availableDays: string; // 逗号分隔，如 "1,2,3,4,5"

  @Column({ name: 'supplier', length: 200, nullable: true })
  supplier: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: LunchMenuStatus,
    default: LunchMenuStatus.ACTIVE,
  })
  status: LunchMenuStatus;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
