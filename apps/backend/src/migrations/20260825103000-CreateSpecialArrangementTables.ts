import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * F-EXAM-003 特别考试安排
 * 创建 special_exam_arrangements（安排单）+ special_arrangement_approvals（多级审批记录）
 * @see SPEC-SYSTEM-DESIGN §18.4 / DB-SCHEMA（新增表）
 */
export class CreateSpecialArrangementTables20260825103000
  implements MigrationInterface
{
  name = 'CreateSpecialArrangementTables20260825103000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. special_exam_arrangements 表 - 特别考试安排单
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'special_exam_arrangements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'arrangement_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'student_id',
            type: 'uuid',
          },
          {
            name: 'exam_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'paper_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'exam_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'sen_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sen_severity',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'arrangements',
            type: 'jsonb',
            default: "'[]'::jsonb",
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'draft',
              'pending_approval',
              'approved',
              'active',
              'completed',
              'rejected',
              'cancelled',
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
            name: 'hkeaa_approved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
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

    // 唯一索引：安排单号
    await queryRunner.createIndex(
      'special_exam_arrangements',
      new TableIndex({
        name: 'idx_special_exam_arrangements_arrangement_id',
        columnNames: ['arrangement_id'],
        isUnique: true,
      }),
    );
    // 索引：student_id / exam_id / status
    await queryRunner.createIndex(
      'special_exam_arrangements',
      new TableIndex({
        name: 'idx_special_exam_arrangements_student_id',
        columnNames: ['student_id'],
      }),
    );
    await queryRunner.createIndex(
      'special_exam_arrangements',
      new TableIndex({
        name: 'idx_special_exam_arrangements_exam_id',
        columnNames: ['exam_id'],
      }),
    );
    await queryRunner.createIndex(
      'special_exam_arrangements',
      new TableIndex({
        name: 'idx_special_exam_arrangements_status',
        columnNames: ['status'],
      }),
    );

    // 外键：student_id -> students.id, exam_id -> exams.id, approved_by -> users.id, created_by -> users.id
    await queryRunner.createForeignKey(
      'special_exam_arrangements',
      new TableForeignKey({
        name: 'fk_special_exam_arrangements_student',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'special_exam_arrangements',
      new TableForeignKey({
        name: 'fk_special_exam_arrangements_exam',
        columnNames: ['exam_id'],
        referencedTableName: 'exams',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'special_exam_arrangements',
      new TableForeignKey({
        name: 'fk_special_exam_arrangements_approved_by',
        columnNames: ['approved_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'special_exam_arrangements',
      new TableForeignKey({
        name: 'fk_special_exam_arrangements_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============================================================
    // 2. special_arrangement_approvals 表 - 特别安排审批记录（多级）
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'special_arrangement_approvals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'arrangement_id',
            type: 'uuid',
          },
          {
            name: 'approver_type',
            type: 'enum',
            enum: ['school', 'hkeaa'],
          },
          {
            name: 'approval_level',
            type: 'int',
            default: 1,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'approval_ref',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'approver_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamptz',
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
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

    // 索引：arrangement_id / approver_type
    await queryRunner.createIndex(
      'special_arrangement_approvals',
      new TableIndex({
        name: 'idx_special_arrangement_approvals_arrangement_id',
        columnNames: ['arrangement_id'],
      }),
    );
    await queryRunner.createIndex(
      'special_arrangement_approvals',
      new TableIndex({
        name: 'idx_special_arrangement_approvals_approver_type',
        columnNames: ['approver_type'],
      }),
    );

    // 外键：arrangement_id -> special_exam_arrangements.id (CASCADE), approver_id -> users.id
    await queryRunner.createForeignKey(
      'special_arrangement_approvals',
      new TableForeignKey({
        name: 'fk_special_arrangement_approvals_arrangement',
        columnNames: ['arrangement_id'],
        referencedTableName: 'special_exam_arrangements',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'special_arrangement_approvals',
      new TableForeignKey({
        name: 'fk_special_arrangement_approvals_approver',
        columnNames: ['approver_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    await queryRunner.dropForeignKey(
      'special_arrangement_approvals',
      'fk_special_arrangement_approvals_approver',
    );
    await queryRunner.dropForeignKey(
      'special_arrangement_approvals',
      'fk_special_arrangement_approvals_arrangement',
    );
    await queryRunner.dropForeignKey(
      'special_exam_arrangements',
      'fk_special_exam_arrangements_created_by',
    );
    await queryRunner.dropForeignKey(
      'special_exam_arrangements',
      'fk_special_exam_arrangements_approved_by',
    );
    await queryRunner.dropForeignKey(
      'special_exam_arrangements',
      'fk_special_exam_arrangements_exam',
    );
    await queryRunner.dropForeignKey(
      'special_exam_arrangements',
      'fk_special_exam_arrangements_student',
    );

    // 删除表
    await queryRunner.dropTable('special_arrangement_approvals', true);
    await queryRunner.dropTable('special_exam_arrangements', true);
  }
}
