import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * F-EXAM-002 试卷管理
 * 创建 exam_papers(试卷) + exam_paper_requests(印刷申请) + exam_paper_distributions(分发/回收)
 * @see SPEC-SYSTEM-DESIGN §18.3 / DB-SCHEMA
 */
export class CreatePaperManagementTables20260825103300
  implements MigrationInterface
{
  name = 'CreatePaperManagementTables20260825103300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. exam_paper_requests 表 - 试卷印刷申请（F-EXAM-002a/b）
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'exam_paper_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'exam_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'request_code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'class_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'required_count',
            type: 'int',
          },
          {
            name: 'ordered_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'supplier',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'order_no',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'approved', 'ordered', 'received', 'cancelled'],
            default: "'draft'",
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
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
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
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

    // 唯一索引：申请单号
    await queryRunner.createIndex(
      'exam_paper_requests',
      new TableIndex({
        name: 'idx_exam_paper_requests_request_code',
        columnNames: ['request_code'],
        isUnique: true,
      }),
    );
    // 索引：exam_id / class_id / status
    await queryRunner.createIndex(
      'exam_paper_requests',
      new TableIndex({
        name: 'idx_exam_paper_requests_exam_id',
        columnNames: ['exam_id'],
      }),
    );
    await queryRunner.createIndex(
      'exam_paper_requests',
      new TableIndex({
        name: 'idx_exam_paper_requests_class_id',
        columnNames: ['class_id'],
      }),
    );
    await queryRunner.createIndex(
      'exam_paper_requests',
      new TableIndex({
        name: 'idx_exam_paper_requests_status',
        columnNames: ['status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'exam_paper_requests',
      new TableForeignKey({
        name: 'fk_exam_paper_requests_exam',
        columnNames: ['exam_id'],
        referencedTableName: 'exams',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_paper_requests',
      new TableForeignKey({
        name: 'fk_exam_paper_requests_class',
        columnNames: ['class_id'],
        referencedTableName: 'classes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_paper_requests',
      new TableForeignKey({
        name: 'fk_exam_paper_requests_approved_by',
        columnNames: ['approved_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_paper_requests',
      new TableForeignKey({
        name: 'fk_exam_paper_requests_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============================================================
    // 2. exam_papers 表 - 试卷（F-EXAM-002c~f）
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'exam_papers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'exam_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'paper_code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'paper_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'paper_type',
            type: 'enum',
            enum: ['normal', 'braille', 'large_print', 'separate_room'],
            default: "'normal'",
          },
          {
            name: 'print_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'supplier',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'order_no',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'seal_no',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'custody_chain',
            type: 'jsonb',
            default: "'[]'::jsonb",
          },
          {
            name: 'storage_location',
            type: 'enum',
            enum: ['safe', 'room', 'other'],
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'required',
              'print_ordered',
              'printed',
              'sealed',
              'in_safe',
              'distributed',
              'used',
              'returned',
              'archived',
              'destroyed',
              'rejected',
              'cancelled',
              'lost',
            ],
            default: "'required'",
          },
          {
            name: 'destroy_approved_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'destroy_approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'retention_until',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'remark',
            type: 'text',
            isNullable: true,
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
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
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

    // 唯一索引：试卷编码
    await queryRunner.createIndex(
      'exam_papers',
      new TableIndex({
        name: 'idx_exam_papers_paper_code',
        columnNames: ['paper_code'],
        isUnique: true,
      }),
    );
    // 索引：exam_id / subject / status
    await queryRunner.createIndex(
      'exam_papers',
      new TableIndex({
        name: 'idx_exam_papers_exam_id',
        columnNames: ['exam_id'],
      }),
    );
    await queryRunner.createIndex(
      'exam_papers',
      new TableIndex({
        name: 'idx_exam_papers_subject',
        columnNames: ['subject'],
      }),
    );
    await queryRunner.createIndex(
      'exam_papers',
      new TableIndex({
        name: 'idx_exam_papers_status',
        columnNames: ['status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'exam_papers',
      new TableForeignKey({
        name: 'fk_exam_papers_exam',
        columnNames: ['exam_id'],
        referencedTableName: 'exams',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_papers',
      new TableForeignKey({
        name: 'fk_exam_papers_destroy_approved_by',
        columnNames: ['destroy_approved_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_papers',
      new TableForeignKey({
        name: 'fk_exam_papers_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============================================================
    // 3. exam_paper_distributions 表 - 试卷分发/回收记录（F-EXAM-002e/f）
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'exam_paper_distributions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'paper_id',
            type: 'uuid',
          },
          {
            name: 'exam_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'invigilator_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'distributed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'distributed_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'signature',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'returned_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'returned_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'return_status',
            type: 'enum',
            enum: ['pending', 'partial', 'complete', 'missing'],
            default: "'pending'",
          },
          {
            name: 'destroyed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'note',
            type: 'text',
            isNullable: true,
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
        ],
      }),
      true,
    );

    // 索引：paper_id / invigilator_id / return_status
    await queryRunner.createIndex(
      'exam_paper_distributions',
      new TableIndex({
        name: 'idx_exam_paper_distributions_paper_id',
        columnNames: ['paper_id'],
      }),
    );
    await queryRunner.createIndex(
      'exam_paper_distributions',
      new TableIndex({
        name: 'idx_exam_paper_distributions_invigilator_id',
        columnNames: ['invigilator_id'],
      }),
    );
    await queryRunner.createIndex(
      'exam_paper_distributions',
      new TableIndex({
        name: 'idx_exam_paper_distributions_return_status',
        columnNames: ['return_status'],
      }),
    );

    // 外键
    await queryRunner.createForeignKey(
      'exam_paper_distributions',
      new TableForeignKey({
        name: 'fk_exam_paper_distributions_paper',
        columnNames: ['paper_id'],
        referencedTableName: 'exam_papers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_paper_distributions',
      new TableForeignKey({
        name: 'fk_exam_paper_distributions_exam',
        columnNames: ['exam_id'],
        referencedTableName: 'exams',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_paper_distributions',
      new TableForeignKey({
        name: 'fk_exam_paper_distributions_invigilator',
        columnNames: ['invigilator_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'exam_paper_distributions',
      new TableForeignKey({
        name: 'fk_exam_paper_distributions_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    await queryRunner.dropForeignKey(
      'exam_paper_distributions',
      'fk_exam_paper_distributions_created_by',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_distributions',
      'fk_exam_paper_distributions_invigilator',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_distributions',
      'fk_exam_paper_distributions_exam',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_distributions',
      'fk_exam_paper_distributions_paper',
    );
    await queryRunner.dropForeignKey(
      'exam_papers',
      'fk_exam_papers_created_by',
    );
    await queryRunner.dropForeignKey(
      'exam_papers',
      'fk_exam_papers_destroy_approved_by',
    );
    await queryRunner.dropForeignKey(
      'exam_papers',
      'fk_exam_papers_exam',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_requests',
      'fk_exam_paper_requests_created_by',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_requests',
      'fk_exam_paper_requests_approved_by',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_requests',
      'fk_exam_paper_requests_class',
    );
    await queryRunner.dropForeignKey(
      'exam_paper_requests',
      'fk_exam_paper_requests_exam',
    );

    // 删除表
    await queryRunner.dropTable('exam_paper_distributions', true);
    await queryRunner.dropTable('exam_papers', true);
    await queryRunner.dropTable('exam_paper_requests', true);
  }
}
