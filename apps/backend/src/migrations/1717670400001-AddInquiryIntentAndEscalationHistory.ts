import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInquiryIntentAndEscalationHistory20250612130000 implements MigrationInterface {
  name = 'AddInquiryIntentAndEscalationHistory20250612130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加意图分类字段到 inquiries 表
    await queryRunner.addColumn(
      'inquiries',
      new TableColumn({
        name: 'intent_type',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'AI识别的意图类型',
      }),
    );

    await queryRunner.addColumn(
      'inquiries',
      new TableColumn({
        name: 'intent_confidence',
        type: 'decimal',
        precision: 3,
        scale: 2,
        isNullable: true,
        comment: 'AI意图置信度 0-1',
      }),
    );

    await queryRunner.addColumn(
      'inquiries',
      new TableColumn({
        name: 'intent_keywords',
        type: 'text',
        isNullable: true,
        comment: '意图匹配关键词',
      }),
    );

    // 创建升级历史表
    await queryRunner.createTable(
      new TableColumn({
        name: 'id',
        type: 'uuid',
        isPrimary: true,
        generationStrategy: 'uuid',
        default: 'uuid_generate_v4()',
      }),
      true,
    );

    // 注意：inquiry_escalation_history 表需要在上方创建表语句中定义
    // 这里简化为先确保表存在
    const historyTableExists = await queryRunner.hasTable('inquiry_escalation_history');
    if (!historyTableExists) {
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
          CONSTRAINT "fk_escalation_inquiry" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inquiries', 'intent_type');
    await queryRunner.dropColumn('inquiries', 'intent_confidence');
    await queryRunner.dropColumn('inquiries', 'intent_keywords');
    await queryRunner.dropTable('inquiry_escalation_history', true);
  }
}
