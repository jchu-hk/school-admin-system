import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

export enum AssetStatus {
  AVAILABLE = 'available',      // 可用
  IN_USE = 'in_use',           // 使用中
  MAINTENANCE = 'maintenance', // 维护中
  RETIRED = 'retired',         // 已报废
  LOST = 'lost',               // 丢失
}

export enum AssetCategory {
  ELECTRONICS = 'electronics',       // 电子设备
  FURNITURE = 'furniture',           // 家具
  SPORTS = 'sports',                 // 体育用品
  AUDIO_VISUAL = 'audio_visual',     // 音视频设备
  COMPUTER = 'computer',             // 计算机设备
  OFFICE = 'office',                 // 办公用品
  LABORATORY = 'laboratory',         // 实验室设备
  LIBRARY = 'library',               // 图书资料
  VEHICLE = 'vehicle',               // 车辆
  OTHER = 'other',                   // 其他
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
  code: string;  // 资产编号/条码

  @Column({
    type: 'enum',
    enum: AssetCategory,
    name: 'category',
    default: AssetCategory.OTHER,
  })
  category: AssetCategory;

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand: string;  // 品牌

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;  // 型号

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber: string;  // 序列号

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int', default: 1, name: 'available_quantity' })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;  // 资产价值

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;  // 单位 (个、台、套等)

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'supplier' })
  supplier: string;  // 供应商

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;  // 存放位置

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
  borrowerId: string;  // 借用人ID (用户ID)

  @Column({ name: 'borrower_name', type: 'varchar', length: 100 })
  borrowerName: string;  // 借用人姓名

  @Column({ name: 'borrower_department', type: 'varchar', length: 100, nullable: true })
  borrowerDepartment: string;  // 借用人部门

  @Column({ name: 'lend_date', type: 'date' })
  lendDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: Date;

  @Column({ name: 'renter_id', nullable: true })
  renterId: string;  // 经办人ID

  @Column({ name: 'renter_name', type: 'varchar', length: 100, nullable: true })
  renterName: string;  // 经办人姓名

  @Column({ type: 'int', default: 1 })
  quantity: number;  // 借用数量

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'lent', 'returned', 'overdue', 'rejected'],
    default: 'pending',
    name: 'status',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  purpose: string;  // 借用用途

  @Column({ type: 'text', nullable: true })
  note: string;  // 备注

  @Column({ type: 'text', nullable: true, name: 'return_note' })
  returnNote: string;  // 归还备注

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
