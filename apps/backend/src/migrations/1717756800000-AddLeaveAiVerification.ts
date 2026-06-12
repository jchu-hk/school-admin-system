import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddLeaveAiVerification1700000000003 implements MigrationInterface {
  name = 'AddLeaveAiVerification1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加AI核验结果字段 (jsonb)
    await queryRunner.addColumn(
      'leaves',
      new TableColumn({
        name: 'ai_verify_result',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // 添加医生证明验证结果字段 (jsonb)
    await queryRunner.addColumn(
      'leaves',
      new TableColumn({
        name: 'certificate_verify_result',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // 添加医生证明URL字段
    await queryRunner.addColumn(
      'leaves',
      new TableColumn({
        name: 'certificate_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    // 添加核验时间字段
    await queryRunner.addColumn(
      'leaves',
      new TableColumn({
        name: 'verified_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // 添加索引以提高核验查询性能
    await queryRunner.createIndex(
      'leaves',
      new TableIndex({
        name: 'IDX_LEAVE_AI_VERIFY_AT',
        columnNames: ['verified_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('leaves', 'IDX_LEAVE_AI_VERIFY_AT');
    await queryRunner.dropColumn('leaves', 'verified_at');
    await queryRunner.dropColumn('leaves', 'certificate_url');
    await queryRunner.dropColumn('leaves', 'certificate_verify_result');
    await queryRunner.dropColumn('leaves', 'ai_verify_result');
  }
}
