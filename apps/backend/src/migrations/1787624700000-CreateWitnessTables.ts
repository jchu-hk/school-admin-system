import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * 创建双人见证模块表（F-COMP-002）
 * 对应 SPEC-SYSTEM-DESIGN §17 / DB-SCHEMA 模块17
 * 表：witness_verifications（见证单）、witness_steps（见证步骤）
 */
export class CreateWitnessTables1787624700000
  implements MigrationInterface {
  name = 'CreateWitnessTables1787624700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------- 枚举类型 ----------
    const enumDefs: Array<[string, string[]]> = [
      [
        'witness_type_enum',
        [
          'cash_receipt', 'cash_payment', 'petty_cash',
          'safe_open', 'cheque_sign',
        ],
      ],
      [
        'witness_status_enum',
        [
          'triggered', 'await_first', 'await_second',
          'completed', 'escalated', 'rejected', 'cancelled',
        ],
      ],
      [
        'witness_step_status_enum',
        ['pending', 'approved', 'rejected'],
      ],
    ];
    for (const [enumName, values] of enumDefs) {
      const valuesLiteral = values.map((v) => `'${v}'`).join(', ');
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${enumName}" AS ENUM (${valuesLiteral});
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    // ---------- witness_verifications ----------
    await queryRunner.createTable(
      new Table({
        name: 'witness_verifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'witness_type', type: 'witness_type_enum' },
          {
            name: 'amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'HKD'",
          },
          {
            name: 'business_ref',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'requester_id', type: 'uuid' },
          { name: 'witness_1_id', type: 'uuid', isNullable: true },
          { name: 'witness_2_id', type: 'uuid', isNullable: true },
          {
            name: 'required_witnesses',
            type: 'integer',
            default: 2,
          },
          {
            name: 'status',
            type: 'witness_status_enum',
            default: "'triggered'",
          },
          {
            name: 'escalation_notified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'completed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'school_id', type: 'varchar' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'witness_verifications',
      new TableIndex({
        name: 'idx_witness_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'witness_verifications',
      new TableIndex({
        name: 'idx_witness_business_ref',
        columnNames: ['business_ref'],
      }),
    );
    await queryRunner.createIndex(
      'witness_verifications',
      new TableIndex({
        name: 'idx_witness_witness_1',
        columnNames: ['witness_1_id'],
      }),
    );
    await queryRunner.createIndex(
      'witness_verifications',
      new TableIndex({
        name: 'idx_witness_witness_2',
        columnNames: ['witness_2_id'],
      }),
    );

    // ---------- witness_steps ----------
    await queryRunner.createTable(
      new Table({
        name: 'witness_steps',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'verification_id', type: 'uuid' },
          { name: 'step_order', type: 'integer' },
          { name: 'witness_id', type: 'uuid' },
          {
            name: 'otp_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'witness_step_status_enum',
            default: "'pending'",
          },
          {
            name: 'comment',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'decided_at',
            type: 'timestamptz',
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'witness_steps',
      new TableIndex({
        name: 'uq_witness_steps_verification_order',
        columnNames: ['verification_id', 'step_order'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'witness_steps',
      new TableIndex({
        name: 'idx_witness_steps_witness',
        columnNames: ['witness_id'],
      }),
    );

    // ---------- 外键 ----------
    await queryRunner.createForeignKey(
      'witness_verifications',
      new TableForeignKey({
        name: 'fk_witness_requester',
        columnNames: ['requester_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'witness_verifications',
      new TableForeignKey({
        name: 'fk_witness_witness_1',
        columnNames: ['witness_1_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'witness_verifications',
      new TableForeignKey({
        name: 'fk_witness_witness_2',
        columnNames: ['witness_2_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'witness_steps',
      new TableForeignKey({
        name: 'fk_witness_steps_verification',
        columnNames: ['verification_id'],
        referencedTableName: 'witness_verifications',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'witness_steps',
      new TableForeignKey({
        name: 'fk_witness_steps_witness',
        columnNames: ['witness_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('witness_steps', 'fk_witness_steps_witness');
    await queryRunner.dropForeignKey('witness_steps', 'fk_witness_steps_verification');
    await queryRunner.dropForeignKey('witness_verifications', 'fk_witness_witness_2');
    await queryRunner.dropForeignKey('witness_verifications', 'fk_witness_witness_1');
    await queryRunner.dropForeignKey('witness_verifications', 'fk_witness_requester');

    await queryRunner.dropTable('witness_steps');
    await queryRunner.dropTable('witness_verifications');

    await queryRunner.query('DROP TYPE IF EXISTS "witness_step_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "witness_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "witness_type_enum"');
  }
}
