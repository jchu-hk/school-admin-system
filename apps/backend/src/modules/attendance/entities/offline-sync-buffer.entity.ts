import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 离线缓存同步状态 */
export enum OfflineSyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  FAILED = 'failed',
  DUPLICATE = 'duplicate',
  INVALID_SIGNATURE = 'invalid_signature',
  EXPIRED = 'expired',
}

/**
 * 离线同步缓冲区
 *
 * 闸机/扫码设备离线模式下的签到缓存。
 * 设备网络恢复后批量推送至服务端校验写入。
 *
 * 表名: offline_sync_buffer
 *
 * 参考: FSD-QR-ATT-001 §3 F-ATTQR-002 (离线容灾)
 */
@Entity('offline_sync_buffer')
@Index(['deviceId', 'synced'])
@Index(['synced', 'createdAt'])
export class OfflineSyncBuffer {
  @ApiProperty({ description: '缓存记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '客户端缓存ID（设备本地生成的UUID）' })
  @Column({ name: 'cache_id', type: 'uuid', nullable: true })
  cacheId: string;

  @ApiProperty({ description: '设备标识' })
  @Column({ name: 'device_id', length: 128 })
  deviceId: string;

  @ApiProperty({ description: '设备名称' })
  @Column({ name: 'device_name', length: 200, nullable: true })
  deviceName: string;

  @ApiProperty({ description: '扫码位置' })
  @Column({ name: 'scanner_location', length: 100, nullable: true })
  scannerLocation: string;

  @ApiProperty({ description: 'QR原始内容' })
  @Column({ name: 'qr_raw', type: 'text' })
  qrRaw: string;

  /** QR内容SHA256哈希（去重） */
  @Column({ name: 'qr_raw_hash', length: 64, nullable: true })
  qrRawHash: string;

  /** QR中的学生ID */
  @Column({ name: 'qr_student_id', type: 'uuid', nullable: true })
  qrStudentId: string;

  @ApiProperty({ description: '设备本地扫码时间' })
  @Column({ name: 'scanned_at', type: 'timestamptz' })
  scannedAt: Date;

  @ApiProperty({ description: '缓存时间' })
  @Column({ name: 'cached_at', type: 'timestamptz', nullable: true })
  cachedAt: Date;

  /** 是否已同步 */
  @Column({ name: 'synced', default: false })
  synced: boolean;

  /** 同步状态 */
  @Column({
    type: 'varchar',
    length: 30,
    name: 'sync_status',
    default: 'pending',
  })
  syncStatus: string;

  @ApiProperty({ description: '同步时间' })
  @Column({ name: 'synced_at', type: 'timestamptz', nullable: true })
  syncedAt: Date;

  @ApiProperty({ description: '同步结果: success / duplicate / expired' })
  @Column({ name: 'sync_result', length: 20, nullable: true })
  syncResult: string;

  @ApiProperty({ description: '同步失败原因' })
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @ApiProperty({ description: '重试次数' })
  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @ApiProperty({ description: '生成的签到记录ID' })
  @Column({ name: 'attendance_id', type: 'uuid', nullable: true })
  attendanceId: string;

  @ApiProperty({ description: '原始请求体JSON' })
  @Column({ name: 'raw_request', type: 'jsonb', nullable: true })
  rawRequest: Record<string, any>;

  @ApiProperty({ description: '校验详情（调试用）' })
  @Column({ name: 'validation_detail', type: 'jsonb', nullable: true })
  validationDetail: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
