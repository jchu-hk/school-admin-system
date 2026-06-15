import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * 创建备份记录表 (backup_records)
 * 对应 Issue #87: F-BACK-001 自动备份管理
 */
export class CreateBackupRecordsTable1718450000000 implements MigrationInterface {
  name = 'CreateBackupRecordsTable1718450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建备份状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "backup_status_enum" AS ENUM ('pending', 'running', 'success', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建备份类型枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "backup_type_enum" AS ENUM ('manual', 'scheduled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建备份记录表
    await queryRunner.createTable(
      new Table({
        name: 'backup_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'backup_no',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'backup_type_enum',
            default: "'scheduled'",
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'backup_status_enum',
            default: "'pending'",
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'file_size_bytes',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'checksum',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'database_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'database_host',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration_seconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'triggered_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'backup_records',
      new TableIndex({
        name: 'IDX_backup_records_backup_no',
        columnNames: ['backup_no'],
      }),
    );

    await queryRunner.createIndex(
      'backup_records',
      new TableIndex({
        name: 'IDX_backup_records_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'backup_records',
      new TableIndex({
        name: 'IDX_backup_records_created_at',
        columnNames: ['created_at'],
      }),
    );

    // 添加备注
    await queryRunner.query(`
      COMMENT ON TABLE backup_records IS '数据库备份记录表 - 对应 Issue #87: F-BACK-001 自动备份管理';
      COMMENT ON COLUMN backup_records.backup_no IS '备份编号，格式: BK-YYYYMMDD-XXXX';
      COMMENT ON COLUMN backup_records.type IS '备份类型: manual=手动备份, scheduled=定时备份';
      COMMENT ON COLUMN backup_records.status IS '备份状态: pending=等待中, running=执行中, success=成功, failed=失败';
      COMMENT ON COLUMN backup_records.file_path IS '备份文件存储路径';
      COMMENT ON COLUMN backup_records.file_size IS '备份文件大小 (人类可读格式)';
      COMMENT ON COLUMN backup_records.file_size_bytes IS '备份文件大小 (字节数)';
      COMMENT ON COLUMN backup_records.checksum IS 'MD5 校验和，用于验证备份完整性';
      COMMENT ON COLUMN backup_records.database_name IS '备份的数据库名称';
      COMMENT ON COLUMN backup_records.database_host IS '数据库主机地址';
      COMMENT ON COLUMN backup_records.error_message IS '备份失败时的错误信息';
      COMMENT ON COLUMN backup_records.started_at IS '备份开始时间';
      COMMENT ON COLUMN backup_records.completed_at IS '备份完成时间';
      COMMENT ON COLUMN backup_records.duration_seconds IS '备份执行耗时 (秒)';
      COMMENT ON COLUMN backup_records.triggered_by IS '触发备份的用户ID (手动备份时)';
      COMMENT ON COLUMN backup_records.metadata IS '其他元数据 (JSON格式)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'backup_records',
      'IDX_backup_records_created_at',
    );
    await queryRunner.dropIndex('backup_records', 'IDX_backup_records_status');
    await queryRunner.dropIndex(
      'backup_records',
      'IDX_backup_records_backup_no',
    );
    await queryRunner.dropTable('backup_records');
    await queryRunner.query('DROP TYPE IF EXISTS "backup_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "backup_status_enum"');
  }
}
