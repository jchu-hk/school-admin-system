import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * 创建预算管理相关表
 * 对应 Issue #174: 年度预算编制与执行追踪
 */
export class CreateBudgetTables1751300000000 implements MigrationInterface {
  name = 'CreateBudgetTables1751300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建预算状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "budget_status_enum" AS ENUM (
          'draft', 'pending_approval', 'approved', 'in_progress',
          'completed', 'adjusted', 'rejected'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建预算科目枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "budget_category_enum" AS ENUM (
          'personnel', 'personnel_salary', 'personnel_allowance', 'personnel_provident_fund',
          'operation', 'operation_utilities', 'operation_insurance', 'operation_maintenance',
          'operation_conservancy', 'operation_security', 'operation_admin',
          'teaching', 'teaching_textbooks', 'teaching_equipment', 'teaching_it',
          'teaching_extracurricular',
          'facility', 'facility_rental', 'facility_transport', 'facility_food', 'facility_medical',
          'development', 'development_training', 'development_reform',
          'other', 'other_subsidy', 'other_legal', 'other_reserve'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建支出状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "expense_status_enum" AS ENUM (
          'pending', 'approved', 'rejected', 'paid', 'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建支出类别枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "expense_category_enum" AS ENUM (
          'personnel', 'operation', 'teaching', 'facility', 'development', 'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建调整类型枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "budget_adjust_type_enum" AS ENUM ('add', 'reduce', 'transfer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ========== 创建 budgets 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'budgets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'fiscal_year', type: 'int' },
          { name: 'department_id', type: 'uuid', isNullable: true },
          {
            name: 'department_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'budget_category_enum',
            default: "'other'",
          },
          { name: 'name', type: 'varchar', length: '200' },
          { name: 'description', type: 'text', isNullable: true },
          {
            name: 'approved_amount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'allocated_amount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'committed_amount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'actual_spent',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'remaining_amount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          { name: 'status', type: 'budget_status_enum', default: "'draft'" },
          { name: 'submission_date', type: 'date', isNullable: true },
          { name: 'approval_date', type: 'date', isNullable: true },
          { name: 'approved_by', type: 'uuid', isNullable: true },
          { name: 'approval_comment', type: 'text', isNullable: true },
          { name: 'overspend_warning', type: 'boolean', default: false },
          {
            name: 'overspend_threshold',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          { name: 'remark', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'budgets',
      new TableIndex({
        name: 'idx_budgets_fiscal_year',
        columnNames: ['fiscal_year'],
      }),
    );
    await queryRunner.createIndex(
      'budgets',
      new TableIndex({ name: 'idx_budgets_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'budgets',
      new TableIndex({
        name: 'idx_budgets_category',
        columnNames: ['category'],
      }),
    );
    await queryRunner.createIndex(
      'budgets',
      new TableIndex({
        name: 'idx_budgets_department',
        columnNames: ['department_id'],
      }),
    );

    // ========== 创建 budget_expenses 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'budget_expenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'budget_id', type: 'uuid' },
          { name: 'fiscal_year', type: 'int' },
          { name: 'expense_date', type: 'date' },
          { name: 'description', type: 'varchar', length: '200' },
          { name: 'category', type: 'expense_category_enum' },
          { name: 'amount', type: 'decimal', precision: 14, scale: 2 },
          {
            name: 'invoice_no',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'vendor_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          { name: 'status', type: 'expense_status_enum', default: "'pending'" },
          { name: 'approved_by', type: 'uuid', isNullable: true },
          { name: 'approved_at', type: 'timestamp', isNullable: true },
          { name: 'receipt_url', type: 'text', isNullable: true },
          { name: 'remark', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'created_by', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'budget_expenses',
      new TableIndex({
        name: 'idx_expenses_budget',
        columnNames: ['budget_id'],
      }),
    );
    await queryRunner.createIndex(
      'budget_expenses',
      new TableIndex({
        name: 'idx_expenses_fiscal_year',
        columnNames: ['fiscal_year'],
      }),
    );
    await queryRunner.createIndex(
      'budget_expenses',
      new TableIndex({
        name: 'idx_expenses_category',
        columnNames: ['category'],
      }),
    );
    await queryRunner.createIndex(
      'budget_expenses',
      new TableIndex({ name: 'idx_expenses_status', columnNames: ['status'] }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'budget_expenses',
      new TableForeignKey({
        name: 'fk_expenses_budget',
        columnNames: ['budget_id'],
        referencedTableName: 'budgets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ========== 创建 budget_adjustments 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'budget_adjustments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'budget_id', type: 'uuid' },
          { name: 'fiscal_year', type: 'int' },
          { name: 'adjust_type', type: 'budget_adjust_type_enum' },
          { name: 'adjust_amount', type: 'decimal', precision: 14, scale: 2 },
          { name: 'reason', type: 'text' },
          {
            name: 'status',
            type: 'budget_status_enum',
            default: "'pending_approval'",
          },
          { name: 'approved_by', type: 'uuid', isNullable: true },
          { name: 'approval_date', type: 'date', isNullable: true },
          { name: 'approval_comment', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'created_by', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'budget_adjustments',
      new TableIndex({
        name: 'idx_adjustments_budget',
        columnNames: ['budget_id'],
      }),
    );
    await queryRunner.createIndex(
      'budget_adjustments',
      new TableIndex({
        name: 'idx_adjustments_fiscal_year',
        columnNames: ['fiscal_year'],
      }),
    );
    await queryRunner.createIndex(
      'budget_adjustments',
      new TableIndex({
        name: 'idx_adjustments_status',
        columnNames: ['status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'budget_adjustments',
      new TableForeignKey({
        name: 'fk_adjustments_budget',
        columnNames: ['budget_id'],
        referencedTableName: 'budgets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    await queryRunner.dropForeignKey(
      'budget_adjustments',
      'fk_adjustments_budget',
    );
    await queryRunner.dropForeignKey('budget_expenses', 'fk_expenses_budget');

    // 删除表
    await queryRunner.dropTable('budget_adjustments');
    await queryRunner.dropTable('budget_expenses');
    await queryRunner.dropTable('budgets');

    // 删除枚举
    await queryRunner.query('DROP TYPE IF EXISTS "budget_adjust_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "expense_category_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "expense_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "budget_category_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "budget_status_enum"');
  }
}
