import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 创建门户审计日志表 portal_audit_logs
 *
 * 对应 FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md §6.3
 * 审计日志用于记录所有学生/家长门户操作，符合 PDPO 审计追踪要求
 *
 * 关键设计：
 * - 按月分区，便于历史数据归档
 * - 自动清理超过7年的数据（PDPO合规要求）
 * - 字段命中审计日志格式规范
 */
export class CreatePortalAuditLogsTable1782530800000
  implements MigrationInterface
{
  name = 'CreatePortalAuditLogsTable1782530800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 portal_audit_logs 分区主表
    await queryRunner.query(`
      CREATE TABLE portal_audit_logs (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        event_type varchar(50) NOT NULL,
        actor_id uuid NOT NULL,
        actor_role varchar(20) NOT NULL,
        target_id uuid DEFAULT NULL,
        target_type varchar(50) DEFAULT NULL,
        action varchar(20) NOT NULL,
        changes jsonb DEFAULT NULL,
        ip_address inet DEFAULT NULL,
        user_agent text DEFAULT NULL,
        result varchar(10) NOT NULL DEFAULT 'SUCCESS',
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portal_audit_logs" PRIMARY KEY (id, created_at)
      ) PARTITION BY RANGE (created_at);
    `);

    // 创建初始分区（按月）
    // 2026年7月分区（当前月）
    await queryRunner.query(`
      CREATE TABLE portal_audit_logs_2026_07
      PARTITION OF portal_audit_logs
      FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
    `);

    // 创建索引
    await queryRunner.query(`
      CREATE INDEX "IDX_portal_audit_logs_actor_id"
      ON portal_audit_logs (actor_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_portal_audit_logs_event_type"
      ON portal_audit_logs (event_type, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_portal_audit_logs_result"
      ON portal_audit_logs (result, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_portal_audit_logs_created_at"
      ON portal_audit_logs (created_at DESC);
    `);

    // 创建分区维护函数：自动创建下个月分区
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_next_portal_audit_log_partition()
      RETURNS void AS $$
      DECLARE
        partition_name text;
        next_month_start date;
        next_month_end date;
      BEGIN
        partition_name := 'portal_audit_logs_' || to_char(now() + interval '1 month', 'YYYY_MM');
        next_month_start := date_trunc('month', now() + interval '1 month');
        next_month_end := date_trunc('month', now() + interval '2 months');

        -- 检查分区是否已存在
        IF NOT EXISTS (
          SELECT 1 FROM pg_class WHERE relname = partition_name
        ) THEN
          EXECUTE format(
            'CREATE TABLE %I PARTITION OF portal_audit_logs FOR VALUES FROM (%L) TO (%L);',
            partition_name,
            next_month_start,
            next_month_end
          );
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 创建分区清理函数：删除超过7年的旧分区
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_portal_audit_log_partitions()
      RETURNS void AS $$
      DECLARE
        partition_rec record;
      BEGIN
        FOR partition_rec IN
          SELECT
            inhrelid::regclass::text as partition_name
          FROM pg_inherits
          WHERE
            inhparent = 'portal_audit_logs'::regclass
            AND split_part(inhrelid::regclass::text, 'portal_audit_logs_', 2) < to_char(now() - interval '7 years', 'YYYY_MM')
        LOOP
          EXECUTE format('DROP TABLE IF EXISTS %I', partition_rec.partition_name);
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS cleanup_old_portal_audit_log_partitions();
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS create_next_portal_audit_log_partition();
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portal_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portal_audit_logs_result"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portal_audit_logs_event_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portal_audit_logs_actor_id"`);

    // 删除所有分区
    await queryRunner.query(`
      DO $$ DECLARE
        partition_rec record;
      BEGIN
        FOR partition_rec IN
          SELECT inhrelid::regclass::text as partition_name
          FROM pg_inherits
          WHERE inhparent = 'portal_audit_logs'::regclass
        LOOP
          EXECUTE format('DROP TABLE IF EXISTS %I', partition_rec.partition_name);
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS portal_audit_logs`);
  }
}
