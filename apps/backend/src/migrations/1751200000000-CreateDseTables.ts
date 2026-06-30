import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * 创建DSE成绩追踪相关表
 * 对应 Issue #172: DSE放榜成绩追踪
 */
export class CreateDseTables1751200000000 implements MigrationInterface {
  name = 'CreateDseTables1751200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建放榜记录状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_release_status_enum" AS ENUM (
          'pending', 'importing', 'imported', 'reviewed', 'published'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建DSE等级枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_level_enum" AS ENUM (
          '5++', '5+', '5', '4', '3', '2', '1', 'U', 'Absent', 'Not Attended'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建DSE成绩状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_result_status_enum" AS ENUM (
          'pending', 'imported', 'review_requested', 'review_in_progress',
          'review_completed', 'published'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建覆核状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_review_status_enum" AS ENUM (
          'pending', 'approved', 'rejected', 'submitted_to_hkeaa',
          'hkeaa_reviewing', 'hkeaa_completed', 'result_updated'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建覆核类型枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "dse_review_type_enum" AS ENUM ('view_recheck', 'regrade');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建JUPAS状态枚举
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_status_enum" AS ENUM (
          'not_applied', 'application_submitted', 'band_a_offered',
          'band_b_offered', 'band_c_offered', 'confirmed',
          'conditional_offer', 'rejected', 'deferred',
          'withdrawn', 'awaiting_result'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ========== 创建 dse_releases 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'dse_releases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'academic_year', type: 'varchar', length: '20' },
          { name: 'release_date', type: 'date' },
          {
            name: 'release_status',
            type: 'dse_release_status_enum',
            default: "'pending'",
          },
          { name: 'release_year', type: 'int' },
          { name: 'import_deadline', type: 'date', isNullable: true },
          { name: 'review_deadline', type: 'date', isNullable: true },
          { name: 'remark', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_releases',
      new TableIndex({
        name: 'idx_dse_releases_academic_year',
        columnNames: ['academic_year'],
      }),
    );
    await queryRunner.createIndex(
      'dse_releases',
      new TableIndex({
        name: 'idx_dse_releases_release_year',
        columnNames: ['release_year'],
      }),
    );
    await queryRunner.createIndex(
      'dse_releases',
      new TableIndex({
        name: 'idx_dse_releases_status',
        columnNames: ['release_status'],
      }),
    );

    // ========== 创建 dse_results 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'dse_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'release_id', type: 'uuid' },
          { name: 'student_id', type: 'uuid' },
          { name: 'student_name', type: 'varchar', length: '100' },
          {
            name: 'class_name',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'hkeaa_candidate_no',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'chinese_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'english_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'math_compulsory_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'math_extended_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'liberal_studies_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'elective_1_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'elective_1_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'elective_1_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'elective_2_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'elective_2_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'elective_2_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'elective_3_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'elective_3_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'elective_3_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          { name: 'best_five_total', type: 'int', isNullable: true },
          { name: 'raw_data', type: 'jsonb', isNullable: true },
          {
            name: 'result_status',
            type: 'dse_result_status_enum',
            default: "'pending'",
          },
          { name: 'published_to_parent', type: 'boolean', default: false },
          { name: 'remark', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_release',
        columnNames: ['release_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_student',
        columnNames: ['student_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_class',
        columnNames: ['class_name'],
      }),
    );
    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_status',
        columnNames: ['result_status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'dse_results',
      new TableForeignKey({
        name: 'fk_dse_results_release',
        columnNames: ['release_id'],
        referencedTableName: 'dse_releases',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ========== 创建 dse_reviews 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'dse_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'dse_result_id', type: 'uuid' },
          { name: 'applicant_id', type: 'uuid' },
          { name: 'review_type', type: 'dse_review_type_enum' },
          { name: 'subject_name', type: 'varchar', length: '100' },
          { name: 'reason', type: 'text' },
          {
            name: 'hkeaa_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'status',
            type: 'dse_review_status_enum',
            default: "'pending'",
          },
          { name: 'approver_id', type: 'uuid', isNullable: true },
          { name: 'approval_remark', type: 'text', isNullable: true },
          {
            name: 'hkeaa_new_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          { name: 'hkeaa_result_remark', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_reviews',
      new TableIndex({
        name: 'idx_dse_reviews_dse_result',
        columnNames: ['dse_result_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_reviews',
      new TableIndex({
        name: 'idx_dse_reviews_status',
        columnNames: ['status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'dse_reviews',
      new TableForeignKey({
        name: 'fk_dse_reviews_result',
        columnNames: ['dse_result_id'],
        referencedTableName: 'dse_results',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ========== 创建 dse_offer_tracking 表 ==========
    await queryRunner.createTable(
      new Table({
        name: 'dse_offer_tracking',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'dse_result_id', type: 'uuid' },
          { name: 'student_id', type: 'uuid' },
          { name: 'student_name_anonymized', type: 'varchar', length: '50' },
          {
            name: 'class_name',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'jupas_status',
            type: 'jupas_status_enum',
            default: "'not_applied'",
          },
          {
            name: 'jupas_application_no',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'institution_anonymized',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'program_anonymized',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          { name: 'enrollment_year', type: 'int', isNullable: true },
          { name: 'offer_date', type: 'date', isNullable: true },
          { name: 'remark', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dse_offer_tracking',
      new TableIndex({
        name: 'idx_dse_offer_dse_result',
        columnNames: ['dse_result_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_offer_tracking',
      new TableIndex({
        name: 'idx_dse_offer_student',
        columnNames: ['student_id'],
      }),
    );
    await queryRunner.createIndex(
      'dse_offer_tracking',
      new TableIndex({
        name: 'idx_dse_offer_class',
        columnNames: ['class_name'],
      }),
    );
    await queryRunner.createIndex(
      'dse_offer_tracking',
      new TableIndex({
        name: 'idx_dse_offer_jupas',
        columnNames: ['jupas_status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'dse_offer_tracking',
      new TableForeignKey({
        name: 'fk_dse_offer_result',
        columnNames: ['dse_result_id'],
        referencedTableName: 'dse_results',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    await queryRunner.dropForeignKey(
      'dse_offer_tracking',
      'fk_dse_offer_result',
    );
    await queryRunner.dropForeignKey('dse_reviews', 'fk_dse_reviews_result');
    await queryRunner.dropForeignKey('dse_results', 'fk_dse_results_release');

    // 删除表
    await queryRunner.dropTable('dse_offer_tracking');
    await queryRunner.dropTable('dse_reviews');
    await queryRunner.dropTable('dse_results');
    await queryRunner.dropTable('dse_releases');

    // 删除枚举
    await queryRunner.query('DROP TYPE IF EXISTS "jupas_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_review_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_review_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_result_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_level_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dse_release_status_enum"');
  }
}
