import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * 创建 DSE 报考管理相关表（F-EXAM-001）
 * 对应 Issue #357 / SPEC-SYSTEM-DESIGN §18.2、DB-SCHEMA 模块18
 * 表：dse_exam_batches（报考批次）、dse_subjects（科目字典）、dse_registrations（报考记录）
 */
export class CreateDseEnrollmentTables1782531200000
  implements MigrationInterface {
  name = 'CreateDseEnrollmentTables1782531200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------- 枚举类型 ----------
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_batch_status_enum" AS ENUM (
          'draft', 'open', 'ongoing', 'closed', 'submitted', 'confirmed', 'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_subject_category_enum" AS ENUM (
          'A_core', 'A_elective', 'B', 'C'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_registration_status_enum" AS ENUM (
          'draft', 'prepared', 'late', 'submitted', 'hkeaa_confirmed', 'withdrawn', 'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ---------- dse_exam_batches ----------
    await queryRunner.createTable(
      new Table({
        name: 'dse_exam_batches',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'academic_year', type: 'varchar', length: '9' },
          { name: 'batch_code', type: 'varchar', length: '50' },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'open_at', type: 'timestamptz' },
          { name: 'close_at', type: 'timestamptz' },
          {
            name: 'late_fee_per_subject',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 560.0,
          },
          {
            name: 'min_subjects',
            type: 'smallint',
            default: 6,
          },
          {
            name: 'max_subjects',
            type: 'smallint',
            default: 8,
          },
          {
            name: 'require_declaration',
            type: 'boolean',
            default: true,
          },
          { name: 'require_photo', type: 'boolean', default: true },
          {
            name: 'status',
            type: 'dse_batch_status_enum',
            default: "'draft'",
          },
          { name: 'submitted_at', type: 'timestamptz', isNullable: true },
          { name: 'confirmed_at', type: 'timestamptz', isNullable: true },
          { name: 'hkeaa_ref', type: 'varchar', length: '100', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_exam_batches',
      new TableIndex({
        name: 'idx_dse_batches_academic_year',
        columnNames: ['academic_year'],
      }),
    );
    await queryRunner.createIndex(
      'dse_exam_batches',
      new TableIndex({
        name: 'idx_dse_batches_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'dse_exam_batches',
      new TableIndex({
        name: 'uq_dse_batches_batch_code',
        columnNames: ['batch_code'],
        isUnique: true,
      }),
    );

    // ---------- dse_subjects ----------
    await queryRunner.createTable(
      new Table({
        name: 'dse_subjects',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'subject_code', type: 'varchar', length: '20' },
          { name: 'subject_name_zh', type: 'varchar', length: '100' },
          { name: 'subject_name_en', type: 'varchar', length: '100' },
          { name: 'category', type: 'dse_subject_category_enum' },
          { name: 'is_core', type: 'boolean', default: false },
          { name: 'language', type: 'varchar', length: '10', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_subjects',
      new TableIndex({
        name: 'uq_dse_subjects_subject_code',
        columnNames: ['subject_code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'dse_subjects',
      new TableIndex({
        name: 'idx_dse_subjects_category',
        columnNames: ['category'],
      }),
    );
    await queryRunner.createIndex(
      'dse_subjects',
      new TableIndex({
        name: 'idx_dse_subjects_is_core',
        columnNames: ['is_core'],
      }),
    );

    // 科目字典种子数据（Category A/B/C）
    const subjectSeeds: Array<[string, string, string, string, boolean, string]> = [
      // Category A 核心
      ['CN', '中國語文', 'Chinese Language', 'A_core', true, '中文'],
      ['EN', '英國語文', 'English Language', 'A_core', true, '英文'],
      ['MA', '數學（必修部分）', 'Mathematics (Compulsory Part)', 'A_core', true, '中文'],
      ['CS', '公民與社會發展', 'Citizenship and Social Development', 'A_core', true, '中文'],
      // Category A 选修
      ['BIO', '生物', 'Biology', 'A_elective', false, '中文'],
      ['CHE', '化學', 'Chemistry', 'A_elective', false, '中文'],
      ['PHY', '物理', 'Physics', 'A_elective', false, '中文'],
      ['ECO', '經濟', 'Economics', 'A_elective', false, '中文'],
      ['BA', '企業、會計與財務概論', 'Business, Accounting and Financial Studies', 'A_elective', false, '中文'],
      ['HIST', '中國歷史', 'Chinese History', 'A_elective', false, '中文'],
      ['GEO', '地理', 'Geography', 'A_elective', false, '中文'],
      ['ICTC', '資訊及通訊科技', 'Information and Communication Technology', 'A_elective', false, '中文'],
      // Category B 应用学习
      ['APL_APP', '應用學習課程 - 應用運動科學', 'ApL - Applied Sport Science', 'B', false, '中文'],
      ['APL_FIN', '應用學習課程 - 金融實務', 'ApL - Financial Practice', 'B', false, '中文'],
      // Category C 其他语言
      ['FREN', '法語', 'French', 'C', false, '法文'],
      ['JAPN', '日語', 'Japanese', 'C', false, '日文'],
    ];
    for (const [code, zh, en, category, isCore, language] of subjectSeeds) {
      await queryRunner.query(
        `INSERT INTO "dse_subjects"
          ("subject_code", "subject_name_zh", "subject_name_en", "category", "is_core", "language", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [code, zh, en, category, isCore, language],
      );
    }

    // ---------- dse_registrations ----------
    await queryRunner.createTable(
      new Table({
        name: 'dse_registrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'batch_id', type: 'uuid' },
          { name: 'student_id', type: 'uuid' },
          { name: 'registration_id', type: 'varchar', length: '50' },
          { name: 'student_no', type: 'varchar', length: '50' },
          { name: 'hkdse_no', type: 'varchar', length: '30', isNullable: true },
          { name: 'subject_selections', type: 'jsonb', default: "'[]'" },
          { name: 'total_subjects', type: 'smallint' },
          { name: 'special_arrangements', type: 'jsonb', default: "'{}'" },
          { name: 'has_special_needs', type: 'boolean', default: false },
          { name: 'declaration_signed', type: 'boolean', default: false },
          { name: 'photo_url', type: 'varchar', length: '255', isNullable: true },
          { name: 'is_late', type: 'boolean', default: false },
          {
            name: 'late_fee_total',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0.0,
          },
          {
            name: 'status',
            type: 'dse_registration_status_enum',
            default: "'draft'",
          },
          { name: 'submitted_at', type: 'timestamptz', isNullable: true },
          { name: 'confirmed_at', type: 'timestamptz', isNullable: true },
          { name: 'withdraw_reason', type: 'text', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_registrations',
      new TableIndex({
        name: 'idx_dse_registrations_batch',
        columnNames: ['batch_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_registrations',
      new TableIndex({
        name: 'idx_dse_registrations_student',
        columnNames: ['student_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_registrations',
      new TableIndex({
        name: 'idx_dse_registrations_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'dse_registrations',
      new TableIndex({
        name: 'uq_dse_registrations_registration_id',
        columnNames: ['registration_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'dse_registrations',
      new TableIndex({
        name: 'uq_dse_registrations_batch_student',
        columnNames: ['batch_id', 'student_id'],
        isUnique: true,
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'dse_registrations',
      new TableForeignKey({
        name: 'fk_dse_reg_batch',
        columnNames: ['batch_id'],
        referencedTableName: 'dse_exam_batches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'dse_registrations',
      new TableForeignKey({
        name: 'fk_dse_reg_student',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'dse_registrations',
      new TableForeignKey({
        name: 'fk_dse_reg_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'dse_registrations',
      new TableForeignKey({
        name: 'fk_dse_reg_updated_by',
        columnNames: ['updated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'dse_exam_batches',
      new TableForeignKey({
        name: 'fk_dse_batch_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'dse_exam_batches',
      new TableForeignKey({
        name: 'fk_dse_batch_updated_by',
        columnNames: ['updated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('dse_exam_batches', 'fk_dse_batch_updated_by');
    await queryRunner.dropForeignKey('dse_exam_batches', 'fk_dse_batch_created_by');
    await queryRunner.dropForeignKey('dse_registrations', 'fk_dse_reg_updated_by');
    await queryRunner.dropForeignKey('dse_registrations', 'fk_dse_reg_created_by');
    await queryRunner.dropForeignKey('dse_registrations', 'fk_dse_reg_student');
    await queryRunner.dropForeignKey('dse_registrations', 'fk_dse_reg_batch');

    await queryRunner.dropTable('dse_registrations');
    await queryRunner.dropTable('dse_subjects');
    await queryRunner.dropTable('dse_exam_batches');

    await queryRunner.query('DROP TYPE IF EXISTS "dse_registration_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_subject_category_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_batch_status_enum"');
  }
}
