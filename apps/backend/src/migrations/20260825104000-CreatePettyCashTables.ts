import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * F-FIN-002 零用现金报销
 * 创建 petty_cash_configs（备用金配置）+ petty_cash_reimbursements（报销申请）
 * + petty_cash_transactions（备用金流水）
 * @see SPEC-SYSTEM-DESIGN §20.3 / DB-SCHEMA §20 / DATA-DICTIONARY §23
 */
export class CreatePettyCashTables20260825104000
  implements MigrationInterface
{
  name = 'CreatePettyCashTables20260825104000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. petty_cash_configs 表 - 备用金配置
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'petty_cash_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'academic_year_id',
            type: 'uuid',
          },
          {
            name: 'base_single_limit',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 3000,
          },
          {
            name: 'cpi_current',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 1.0,
          },
          {
            name: 'cpi_base',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 1.0,
          },
          {
            name: 'effective_single_limit',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'float_cap',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 5000,
          },
          {
            name: 'float_low_threshold',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 500,
          },
          {
            name: 'config_status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'archived'],
            default: "'pending'",
          },
          {
            name: 'confirmed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'confirmed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'petty_cash_configs',
      new TableIndex({ name: 'IDX_petty_cash_configs_year', columnNames: ['academic_year_id'] }),
    );

    // ============================================================
    // 2. petty_cash_reimbursements 表 - 零用现金报销申请
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'petty_cash_reimbursements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'transaction_no',
            type: 'varchar',
            length: '30',
            isUnique: true,
          },
          {
            name: 'applicant_id',
            type: 'uuid',
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'payee',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'receipt_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ocr_result',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
          {
            name: 'ocr_status',
            type: 'enum',
            enum: ['not_performed', 'ok', 'failed', 'match', 'mismatch'],
            default: "'not_performed'",
          },
          {
            name: 'single_limit',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'float_balance_before',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'witness_level',
            type: 'enum',
            enum: ['single', 'double', 'none'],
            default: "'single'",
          },
          {
            name: 'witness_verification_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'draft', 'ocra_pending', 'manual_amount', 'witness_required',
              'witness_in_progress', 'pending_approval', 'approved', 'paid',
              'rejected', 'cancelled', 'blocked',
            ],
            default: "'draft'",
          },
          {
            name: 'workflow_status',
            type: 'enum',
            enum: [
              'draft', 'ocra_pending', 'manual_amount', 'witness_required',
              'witness_in_progress', 'pending_approval', 'approved', 'paid',
              'rejected', 'cancelled', 'blocked',
            ],
            default: "'draft'",
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'paid_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'petty_cash_reimbursements',
      new TableIndex({ name: 'IDX_petty_cash_reimb_applicant', columnNames: ['applicant_id'] }),
    );
    await queryRunner.createIndex(
      'petty_cash_reimbursements',
      new TableIndex({ name: 'IDX_petty_cash_reimb_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'petty_cash_reimbursements',
      new TableIndex({ name: 'IDX_petty_cash_reimb_created', columnNames: ['created_at'] }),
    );

    // ============================================================
    // 3. petty_cash_transactions 表 - 备用金流水
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'petty_cash_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'academic_year_id',
            type: 'uuid',
          },
          {
            name: 'tx_type',
            type: 'enum',
            enum: ['top_up', 'expense'],
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'reimbursement_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'float_balance_after',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'reference_no',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'petty_cash_transactions',
      new TableIndex({ name: 'IDX_petty_cash_tx_year', columnNames: ['academic_year_id'] }),
    );
    await queryRunner.createIndex(
      'petty_cash_transactions',
      new TableIndex({ name: 'IDX_petty_cash_tx_reimb', columnNames: ['reimbursement_id'] }),
    );

    // ============================================================
    // 外键
    // ============================================================
    await queryRunner.createForeignKey(
      'petty_cash_configs',
      new TableForeignKey({
        columnNames: ['academic_year_id'],
        referencedTableName: 'academic_years',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_configs',
      new TableForeignKey({
        columnNames: ['confirmed_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_reimbursements',
      new TableForeignKey({
        columnNames: ['applicant_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_reimbursements',
      new TableForeignKey({
        columnNames: ['approved_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_reimbursements',
      new TableForeignKey({
        columnNames: ['witness_verification_id'],
        referencedTableName: 'witness_verifications',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_transactions',
      new TableForeignKey({
        columnNames: ['academic_year_id'],
        referencedTableName: 'academic_years',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_transactions',
      new TableForeignKey({
        columnNames: ['reimbursement_id'],
        referencedTableName: 'petty_cash_reimbursements',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'petty_cash_transactions',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('petty_cash_transactions', true);
    await queryRunner.dropTable('petty_cash_reimbursements', true);
    await queryRunner.dropTable('petty_cash_configs', true);
  }
}
