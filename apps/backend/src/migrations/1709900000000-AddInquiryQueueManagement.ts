import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInquiryQueueManagement1709900000000 implements MigrationInterface {
  name = 'AddInquiryQueueManagement1709900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加新状态值 (auto_replied, escalated)
    await queryRunner.query(`
      ALTER TYPE "inquiry_status_enum" 
      ADD VALUE IF NOT EXISTS 'auto_replied';
    `);
    await queryRunner.query(`
      ALTER TYPE "inquiry_status_enum" 
      ADD VALUE IF NOT EXISTS 'escalated';
    `);

    // 2. 添加情绪分类枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "inquiry_sentiment_enum" AS ENUM ('neutral', 'positive', 'negative', 'angry');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. 添加超时警告级别枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "timeout_warning_level_enum" AS ENUM ('none', 'warning', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 4. 添加转交状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "transfer_status_enum" AS ENUM ('not_transferred', 'pending', 'accepted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 5. 添加新字段到 parent_inquiries 表
    await queryRunner.query(`
      ALTER TABLE "parent_inquiries"
      ADD COLUMN IF NOT EXISTS "sentiment" inquiry_sentiment_enum,
      ADD COLUMN IF NOT EXISTS "timeout_warning" timeout_warning_level_enum NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS "transfer_to" uuid,
      ADD COLUMN IF NOT EXISTS "transfer_status" transfer_status_enum NOT NULL DEFAULT 'not_transferred',
      ADD COLUMN IF NOT EXISTS "transfer_reason" text,
      ADD COLUMN IF NOT EXISTS "transferred_by" uuid;
    `);

    // 6. 添加外键约束（转移目标）
    await queryRunner.query(`
      ALTER TABLE "parent_inquiries"
      ADD CONSTRAINT "fk_inquiry_transfer_to"
      FOREIGN KEY ("transfer_to") REFERENCES "users"("id")
      ON DELETE SET NULL;
    `);

    // 7. 添加外键约束（转移发起人）
    await queryRunner.query(`
      ALTER TABLE "parent_inquiries"
      ADD CONSTRAINT "fk_inquiry_transferred_by"
      FOREIGN KEY ("transferred_by") REFERENCES "users"("id")
      ON DELETE SET NULL;
    `);

    // 8. 添加索引以优化队列查询
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_inquiries_timeout_warning"
      ON "parent_inquiries" ("timeout_warning")
      WHERE "timeout_warning" != 'none';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_inquiries_transfer_status"
      ON "parent_inquiries" ("transfer_status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_inquiries_escalation_required"
      ON "parent_inquiries" ("escalation_required")
      WHERE "escalation_required" = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_parent_inquiries_timeout_warning";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_parent_inquiries_transfer_status";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_parent_inquiries_escalation_required";`,
    );

    // 删除外键约束
    await queryRunner.query(
      `ALTER TABLE "parent_inquiries" DROP CONSTRAINT IF EXISTS "fk_inquiry_transfer_to";`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_inquiries" DROP CONSTRAINT IF EXISTS "fk_inquiry_transferred_by";`,
    );

    // 删除字段
    await queryRunner.query(`
      ALTER TABLE "parent_inquiries"
      DROP COLUMN IF EXISTS "sentiment",
      DROP COLUMN IF EXISTS "timeout_warning",
      DROP COLUMN IF EXISTS "transfer_to",
      DROP COLUMN IF EXISTS "transfer_status",
      DROP COLUMN IF EXISTS "transfer_reason",
      DROP COLUMN IF EXISTS "transferred_by";
    `);

    // 删除枚举类型（谨慎）
    await queryRunner.query(`DROP TYPE IF EXISTS "inquiry_sentiment_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "timeout_warning_level_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "transfer_status_enum";`);
  }
}
