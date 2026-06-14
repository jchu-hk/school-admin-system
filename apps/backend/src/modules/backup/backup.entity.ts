import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 备份状态枚举
 */
export enum BackupStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * 备份类型枚举
 */
export enum BackupType {
  MANUAL = 'manual', // 手动备份
  SCHEDULED = 'scheduled', // 定时备份
}

/**
 * 备份记录实体
 * 记录每次备份的执行情况和元数据
 */
@Entity('backup_records')
export class BackupRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  backupNo: string; // 备份编号，如 BK-20260614-001

  @Column({ type: 'enum', enum: BackupType, default: BackupType.SCHEDULED })
  type: BackupType;

  @Column({ type: 'enum', enum: BackupStatus, default: BackupStatus.PENDING })
  @Index()
  status: BackupStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string; // 备份文件路径

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileSize: string; // 文件大小（人类可读格式）

  @Column({ type: 'bigint', nullable: true })
  fileSizeBytes: number; // 文件大小（字节数）

  @Column({ type: 'varchar', length: 50, nullable: true })
  checksum: string; // MD5校验和

  @Column({ type: 'varchar', length: 100 })
  databaseName: string; // 备份的数据库名称

  @Column({ type: 'varchar', length: 200, nullable: true })
  databaseHost: string; // 数据库主机

  @Column({ type: 'text', nullable: true })
  errorMessage: string; // 错误信息

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date; // 开始时间

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // 完成时间

  @Column({ type: 'int', nullable: true })
  durationSeconds: number; // 执行时长（秒）

  @Column({ type: 'uuid', nullable: true })
  triggeredBy: string; // 触发者用户ID（手动备份时）

  @Column({ type: 'text', nullable: true })
  metadata: string; // 其他元数据（JSON格式）

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
