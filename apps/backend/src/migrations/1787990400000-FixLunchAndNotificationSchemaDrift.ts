import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * fix(#374): 修复 lunch_changes / notifications 的 schema 漂移
 *
 * 背景：生产库 synchronize=false，下列表仅通过实体层定义，缺少对应 migration，
 * 导致定时任务每日报错：
 *
 * 1. lunch_changes.created_by             — 缺列，13:00 午膳变更提醒
 *    （column LunchChange.created_by does not exist）时读取失败。
 * 2. lunch_changes.updated_by             — 与实体对齐一并补齐（实体存在该列）。
 * 3. lunch_menu.created_by / updated_by   — 实体存在但历史迁移未建，按实体补齐。
 * 4. notifications.school_id              — 缺列，09:00 账号生命周期
 *    （column "school_id" of relation "notifications" does not exist）发送通知失败。
 *
 * 说明：
 * - 全部使用 ADD COLUMN IF NOT EXISTS，保证在已经被 dev synchronize 创建过列的
 *   库上重复执行也安全（与 1782530900000 迁移的幂等风格一致）。
 * - notifications.school_id 设为 nullable：lifecycle scheduler 调用
 *   sendNotification(dto, undefined, undefined) 时 schoolId 恒为 undefined，
 *   列为 nullable 才不会因 NOT NULL 约束插入失败（实体已同步改为 nullable）。
 * - 不执行任何 drop/truncate 等破坏性操作。
 */
export class FixLunchAndNotificationSchemaDrift1787990400000
  implements MigrationInterface
{
  name = 'FixLunchAndNotificationSchemaDrift1787990400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ 1. lunch_changes 补齐审计列 ============
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "lunch_changes"
        ADD COLUMN IF NOT EXISTS "created_by" uuid,
        ADD COLUMN IF NOT EXISTS "updated_by" uuid
    `);

    // created_by 在实体中为 NOT NULL。先补列（nullable），对已有历史行回填后再施加
    // NOT NULL；回填仅依赖必然存在的 id，不假设 reviewed_by 等其它列存在
    // （历史库表结构可能与实体不一致）。若已存在 NOT NULL 则跳过。
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='lunch_changes' AND column_name='created_by' AND is_nullable='YES'
        ) THEN
          UPDATE "lunch_changes" SET "created_by" = "id" WHERE "created_by" IS NULL;
          ALTER TABLE "lunch_changes" ALTER COLUMN "created_by" SET NOT NULL;
        END IF;
      END $$;
    `);

    // ============ 2. lunch_menu 补齐审计列（按实体对齐）============
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "lunch_menu"
        ADD COLUMN IF NOT EXISTS "created_by" uuid,
        ADD COLUMN IF NOT EXISTS "updated_by" uuid
    `);

    // ============ 3. notifications 补齐 school_id（nullable）============
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "notifications"
        ADD COLUMN IF NOT EXISTS "school_id" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 逆序回滚（仅移除本迁移新增的列；不触碰其他列/表）
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "notifications" DROP COLUMN IF EXISTS "school_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "lunch_menu" DROP COLUMN IF EXISTS "updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "lunch_menu" DROP COLUMN IF EXISTS "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "lunch_changes" DROP COLUMN IF EXISTS "updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "lunch_changes" DROP COLUMN IF EXISTS "created_by"`,
    );
  }
}
