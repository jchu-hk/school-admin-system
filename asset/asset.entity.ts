import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum AssetStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  LOST = 'lost',
}

export enum AssetCategory {
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  SPORTS = 'sports',
  AUDIO_VISUAL = 'audio_visual',
  COMPUTER = 'computer',
  OFFICE = 'office',
  LABORATORY = 'laboratory',
  LIBRARY = 'library',
  VEHICLE = 'vehicle',
  OTHER = 'other',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({
    type: 'enum',
    enum: AssetCategory,
    name: 'category',
    default: AssetCategory.OTHER,
  })
  category: AssetCategory;

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int', default: 1, name: 'available_quantity' })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'supplier' })
  supplier: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.AVAILABLE,
  })
  status: AssetStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('asset_rentals')
export class AssetRental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ name: 'borrower_id' })
  borrowerId: string;

  @Column({ name: 'borrower_name', type: 'varchar', length: 100 })
  borrowerName: string;

  @Column({ name: 'borrower_department', type: 'varchar', length: 100, nullable: true })
  borrowerDepartment: string;

  @Column({ name: 'lend_date', type: 'date' })
  lendDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: Date;

  @Column({ name: 'renter_id', nullable: true })
  renterId: string;

  @Column({ name: 'renter_name', type: 'varchar', length: 100, nullable: true })
  renterName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'lent', 'returned', 'overdue', 'rejected'],
    default: 'pending',
    name: 'status',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'text', nullable: true, name: 'return_note' })
  returnNote: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
