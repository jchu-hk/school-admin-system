import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteAndAuditLogs1717670400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 deletedAt 字段到 users 表
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN deletedAt timestamp NULL
    `);

    // 创建 audit_logs 表
    await queryRunner.query(`
      CREATE TYPE audit_action AS ENUM (
        'user_create',
        'user_update',
        'user_delete',
        'user_restore',
        'user_status_change',
        'user_password_reset',
        'permission_change'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        operatorId uuid NULL,
        action audit_action NOT NULL,
        description text NULL,
        ip varchar(50) NULL,
        requestParams json NULL,
        responseStatus int NULL,
        createdAt timestamp NOT NULL DEFAULT now()
      )
    `);

    // 创建索引
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_operatorId ON audit_logs(operatorId)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_action ON audit_logs(action)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_createdAt ON audit_logs(createdAt)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 audit_logs 表
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action`);

    // 删除 users 表的 deletedAt 字段
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS deletedAt`,
    );
  }
}
