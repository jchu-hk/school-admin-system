import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * 创建系统配置表、用户表和日志表
 * 对应 Issue #164: 数据库表缺失
 */
export class CreateSystemTables1709000000000 implements MigrationInterface {
  name = 'CreateSystemTables1709000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建配置类型枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "system_config_type_enum" AS ENUM ('string', 'number', 'boolean', 'json');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建日志级别枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "system_log_level_enum" AS ENUM ('info', 'warn', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建系统用户角色枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "system_user_role_enum" AS ENUM ('admin', 'teacher', 'staff', 'parent', 'student');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建系统用户状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "system_user_status_enum" AS ENUM ('active', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建 system_configs 表
    await queryRunner.createTable(
      new Table({
        name: 'system_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'system_config_type_enum',
            default: "'string'",
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    // 创建 system_logs 表
    await queryRunner.createTable(
      new Table({
        name: 'system_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'level',
            type: 'enum',
            enumName: 'system_log_level_enum',
            default: "'info'",
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'module',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
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

    // 创建 system_users 表
    await queryRunner.createTable(
      new Table({
        name: 'system_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enumName: 'system_user_role_enum',
            default: "'staff'",
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'system_user_status_enum',
            default: "'active'",
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_login_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'department',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'system_configs',
      new TableIndex({
        name: 'IDX_system_configs_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'system_logs',
      new TableIndex({
        name: 'IDX_system_logs_level',
        columnNames: ['level'],
      }),
    );

    await queryRunner.createIndex(
      'system_logs',
      new TableIndex({
        name: 'IDX_system_logs_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'system_logs',
      new TableIndex({
        name: 'IDX_system_logs_module',
        columnNames: ['module'],
      }),
    );

    await queryRunner.createIndex(
      'system_users',
      new TableIndex({
        name: 'IDX_system_users_role',
        columnNames: ['role'],
      }),
    );

    await queryRunner.createIndex(
      'system_users',
      new TableIndex({
        name: 'IDX_system_users_status',
        columnNames: ['status'],
      }),
    );

    // 添加表注释
    await queryRunner.query(`
      COMMENT ON TABLE system_configs IS '系统配置表 - 存储系统级配置项';
      COMMENT ON TABLE system_logs IS '系统日志表 - 记录系统操作和错误日志';
      COMMENT ON TABLE system_users IS '系统用户表 - 存储系统管理员和教职员工账户';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('system_users', 'IDX_system_users_status');
    await queryRunner.dropIndex('system_users', 'IDX_system_users_role');
    await queryRunner.dropIndex('system_logs', 'IDX_system_logs_module');
    await queryRunner.dropIndex('system_logs', 'IDX_system_logs_created_at');
    await queryRunner.dropIndex('system_logs', 'IDX_system_logs_level');
    await queryRunner.dropIndex(
      'system_configs',
      'IDX_system_configs_category',
    );

    // 删除表
    await queryRunner.dropTable('system_users');
    await queryRunner.dropTable('system_logs');
    await queryRunner.dropTable('system_configs');

    // 删除枚举类型
    await queryRunner.query('DROP TYPE IF EXISTS "system_user_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "system_user_role_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "system_log_level_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "system_config_type_enum"');
  }
}
