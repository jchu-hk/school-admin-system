import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * 创建DSE模块的4张核心表
 * 对应 Issue #178: DSE模块Bug修复 - 数据库迁移缺失
 */
export class CreateDseTables1782530500000 implements MigrationInterface {
  name = 'CreateDseTables1782530500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. dse_releases 表 - DSE放榜记录
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'dse_releases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'academic_year',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'release_date',
            type: 'date',
          },
          {
            name: 'release_status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'release_year',
            type: 'int',
          },
          {
            name: 'import_deadline',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'review_deadline',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'remark',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 唯一索引：学年
    await queryRunner.createIndex(
      'dse_releases',
      new TableIndex({
        name: 'idx_dse_releases_academic_year',
        columnNames: ['academic_year'],
        isUnique: true,
      }),
    );

    // ============================================================
    // 2. dse_results 表 - DSE成绩记录
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'dse_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'release_id',
            type: 'uuid',
          },
          {
            name: 'student_id',
            type: 'uuid',
          },
          {
            name: 'student_name',
            type: 'varchar',
            length: '100',
          },
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
          {
            name: 'best_five_total',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'raw_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'result_status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'published_to_parent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'remark',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 索引：release_id
    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_release_id',
        columnNames: ['release_id'],
      }),
    );

    // 索引：student_id
    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_student_id',
        columnNames: ['student_id'],
      }),
    );

    // 唯一索引：每个放榜批次每个学生只有一条记录
    await queryRunner.createIndex(
      'dse_results',
      new TableIndex({
        name: 'idx_dse_results_release_student',
        columnNames: ['release_id', 'student_id'],
        isUnique: true,
      }),
    );

    // 外键：dse_results.release_id -> dse_releases.id
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

    // 外键：dse_results.student_id -> users.id
    await queryRunner.createForeignKey(
      'dse_results',
      new TableForeignKey({
        name: 'fk_dse_results_student',
        columnNames: ['student_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // ============================================================
    // 3. dse_reviews 表 - DSE成绩覆核申请
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'dse_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'dse_result_id',
            type: 'uuid',
          },
          {
            name: 'applicant_id',
            type: 'uuid',
          },
          {
            name: 'review_type',
            type: 'varchar',
          },
          {
            name: 'subject_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'reason',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'hkeaa_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'hkeaa_new_level',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'hkeaa_result_remark',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'approver_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approval_remark',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 外键：dse_reviews.dse_result_id -> dse_results.id
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

    // 外键：dse_reviews.applicant_id -> users.id
    await queryRunner.createForeignKey(
      'dse_reviews',
      new TableForeignKey({
        name: 'fk_dse_reviews_applicant',
        columnNames: ['applicant_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // ============================================================
    // 4. dse_offer_tracking 表 - 升学去向追踪
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'dse_offer_tracking',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'dse_result_id',
            type: 'uuid',
          },
          {
            name: 'student_id',
            type: 'uuid',
          },
          {
            name: 'student_name_anonymized',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'class_name',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'jupas_status',
            type: 'varchar',
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
          {
            name: 'enrollment_year',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'offer_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'remark',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 索引：dse_result_id
    await queryRunner.createIndex(
      'dse_offer_tracking',
      new TableIndex({
        name: 'idx_dse_offer_tracking_result_id',
        columnNames: ['dse_result_id'],
      }),
    );

    // 索引：student_id
    await queryRunner.createIndex(
      'dse_offer_tracking',
      new TableIndex({
        name: 'idx_dse_offer_tracking_student_id',
        columnNames: ['student_id'],
      }),
    );

    // 外键：dse_offer_tracking.dse_result_id -> dse_results.id
    await queryRunner.createForeignKey(
      'dse_offer_tracking',
      new TableForeignKey({
        name: 'fk_dse_offer_tracking_result',
        columnNames: ['dse_result_id'],
        referencedTableName: 'dse_results',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 外键：dse_offer_tracking.student_id -> users.id
    await queryRunner.createForeignKey(
      'dse_offer_tracking',
      new TableForeignKey({
        name: 'fk_dse_offer_tracking_student',
        columnNames: ['student_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    await queryRunner.dropForeignKey(
      'dse_offer_tracking',
      'fk_dse_offer_tracking_student',
    );
    await queryRunner.dropForeignKey(
      'dse_offer_tracking',
      'fk_dse_offer_tracking_result',
    );
    await queryRunner.dropForeignKey('dse_reviews', 'fk_dse_reviews_applicant');
    await queryRunner.dropForeignKey('dse_reviews', 'fk_dse_reviews_result');
    await queryRunner.dropForeignKey('dse_results', 'fk_dse_results_student');
    await queryRunner.dropForeignKey('dse_results', 'fk_dse_results_release');

    // 删除表
    await queryRunner.dropTable('dse_offer_tracking', true);
    await queryRunner.dropTable('dse_reviews', true);
    await queryRunner.dropTable('dse_results', true);
    await queryRunner.dropTable('dse_releases', true);
  }
}
