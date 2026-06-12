import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInquiryIntentAndEscalationHistory20250612130000 implements MigrationInterface {
  name = 'AddInquiryIntentAndEscalationHistory20250612130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加意图分类字段到 inquiries 表
    await queryRunner.query(`
      ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "intent_type" varchar(50)
      ADD COLUMN IF NOT EXISTS "intent_confidence" decimal(3,2)
      ADD COLUMN IF NOT EXISTS "intent_keywords" text
    `);

    // 创建升级历史表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inquiry_escalation_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inquiry_id" uuid NOT NULL,
        "escalation_reason" text NOT NULL,
        "escalation_category" varchar(100) NOT NULL,
        "original_priority" varchar(50) NOT NULL,
        "new_priority" varchar(50) NOT NULL,
        "triggered_keywords" text,
        "notified_users" text,
        "is_manual" boolean DEFAULT false,
        "triggered_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_escalation_inquiry" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE,
        CONSTRAINT "PK_escalation_history" PRIMARY KEY ("id")
      )
    `);

    // 添加注释
    await queryRunner.query(`COMMENT ON COLUMN "inquiries"."intent_type" IS 'AI识别的意图类型'`);
    await queryRunner.query(`COMMENT ON COLUMN "inquiries"."intent_confidence" IS 'AI意图置信度 0-1'`);
    await queryRunner.query(`COMMENT ON COLUMN "inquiries"."intent_keywords" IS '意图匹配关键词'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inquiries" DROP COLUMN IF EXISTS "intent_type"`);
    await queryRunner.query(`ALTER TABLE "inquiries" DROP COLUMN IF EXISTS "intent_confidence"`);
    await queryRunner.query(`ALTER TABLE "inquiries" DROP COLUMN IF EXISTS "intent_keywords"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inquiry_escalation_history"`);
  }
}
