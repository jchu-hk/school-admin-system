import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * 创建 PDPO 合规模块表（F-COMP-001）
 * 对应 SPEC-SYSTEM-DESIGN §17.4 / DB-SCHEMA 模块17
 * 表：compliance_checks（合规检查记录）、data_access_requests（资料当事人权利申请）、
 *     consent_records（同意记录）
 */
export class CreateComplianceTables1787900000000
  implements MigrationInterface {
  name = 'CreateComplianceTables1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------- 枚举类型 ----------
    const enumDefs: Array<[string, string[]]> = [
      ['data_class_enum', ['P1', 'P2', 'P3']],
      ['check_decision_enum', ['allow', 'deny']],
      ['risk_level_enum', ['low', 'medium', 'high']],
      [
        'dar_request_type_enum',
        ['access', 'correction', 'erasure'],
      ],
      [
        'dar_status_enum',
        [
          'submitted', 'under_review', 'approved',
          'completed', 'rejected', 'withdrawn',
        ],
      ],
      [
        'dar_data_scope_enum',
        [
          'all', 'student_profile', 'health', 'financial',
          'attendance', 'result', 'message', 'other',
        ],
      ],
      [
        'consent_type_enum',
        [
          'data_processing', 'communication', 'health_data',
          'third_party_sharing', 'emergency_contact', 'sync_push',
        ],
      ],
      [
        'consent_status_enum',
        ['granted', 'revoked', 'expired'],
      ],
      [
        'consent_channel_enum',
        ['portal', 'paper', 'phone', 'manual'],
      ],
      [
        'consent_granter_enum',
        ['self', 'parent_guardian'],
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

    // ---------- compliance_checks ----------
    await queryRunner.createTable(
      new Table({
        name: 'compliance_checks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'action', type: 'varchar', length: '50' },
          { name: 'data_class', type: 'data_class_enum' },
          { name: 'purpose', type: 'varchar', length: '50' },
          { name: 'user_id', type: 'uuid', isNullable: true },
          {
            name: 'user_role',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'resource_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'requested_fields',
            type: 'jsonb',
            default: "'[]'",
          },
          { name: 'decision', type: 'check_decision_enum' },
          {
            name: 'reason',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          { name: 'check_items', type: 'jsonb', default: "'[]'" },
          {
            name: 'risk_level',
            type: 'risk_level_enum',
            default: "'low'",
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'compliance_checks',
      new TableIndex({
        name: 'idx_compliance_user',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'compliance_checks',
      new TableIndex({
        name: 'idx_compliance_decision',
        columnNames: ['decision'],
      }),
    );
    await queryRunner.createIndex(
      'compliance_checks',
      new TableIndex({
        name: 'idx_compliance_data_class',
        columnNames: ['data_class'],
      }),
    );
    await queryRunner.createIndex(
      'compliance_checks',
      new TableIndex({
        name: 'idx_compliance_created_at',
        columnNames: ['created_at'],
      }),
    );

    // ---------- data_access_requests ----------
    await queryRunner.createTable(
      new Table({
        name: 'data_access_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'request_type', type: 'dar_request_type_enum' },
          { name: 'data_scope', type: 'dar_data_scope_enum' },
          { name: 'subject_id', type: 'uuid' },
          {
            name: 'justification',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requester_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'dar_status_enum',
            default: "'submitted'",
          },
          {
            name: 'reviewer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'review_note',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'response_payload',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'response_due_at',
            type: 'timestamptz',
            isNullable: true,
          },
          { name: 'school_id', type: 'varchar', length: '100' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'data_access_requests',
      new TableIndex({
        name: 'idx_dar_subject',
        columnNames: ['subject_id'],
      }),
    );
    await queryRunner.createIndex(
      'data_access_requests',
      new TableIndex({
        name: 'idx_dar_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'data_access_requests',
      new TableIndex({
        name: 'idx_dar_request_type',
        columnNames: ['request_type'],
      }),
    );

    // ---------- consent_records ----------
    await queryRunner.createTable(
      new Table({
        name: 'consent_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'subject_id', type: 'uuid' },
          { name: 'consent_type', type: 'consent_type_enum' },
          {
            name: 'status',
            type: 'consent_status_enum',
            default: "'granted'",
          },
          {
            name: 'granter',
            type: 'consent_granter_enum',
            default: "'self'",
          },
          {
            name: 'channel',
            type: 'consent_channel_enum',
            default: "'portal'",
          },
          { name: 'granted_at', type: 'timestamptz' },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
          { name: 'version', type: 'integer', default: 1 },
          {
            name: 'student_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'consent_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recorded_by_id',
            type: 'uuid',
            isNullable: true,
          },
          { name: 'school_id', type: 'varchar', length: '100' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'consent_records',
      new TableIndex({
        name: 'idx_consent_subject',
        columnNames: ['subject_id'],
      }),
    );
    await queryRunner.createIndex(
      'consent_records',
      new TableIndex({
        name: 'idx_consent_type_status',
        columnNames: ['consent_type', 'status'],
      }),
    );

    // ---------- 外键 ----------
    await queryRunner.createForeignKey(
      'compliance_checks',
      new TableForeignKey({
        name: 'fk_compliance_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'data_access_requests',
      new TableForeignKey({
        name: 'fk_dar_subject',
        columnNames: ['subject_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'data_access_requests',
      new TableForeignKey({
        name: 'fk_dar_requester',
        columnNames: ['requester_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'data_access_requests',
      new TableForeignKey({
        name: 'fk_dar_reviewer',
        columnNames: ['reviewer_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'consent_records',
      new TableForeignKey({
        name: 'fk_consent_subject',
        columnNames: ['subject_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'consent_records',
      new TableForeignKey({
        name: 'fk_consent_recorded_by',
        columnNames: ['recorded_by_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('consent_records', 'fk_consent_recorded_by');
    await queryRunner.dropForeignKey('consent_records', 'fk_consent_subject');
    await queryRunner.dropForeignKey('data_access_requests', 'fk_dar_reviewer');
    await queryRunner.dropForeignKey('data_access_requests', 'fk_dar_requester');
    await queryRunner.dropForeignKey('data_access_requests', 'fk_dar_subject');
    await queryRunner.dropForeignKey('compliance_checks', 'fk_compliance_user');

    await queryRunner.dropTable('consent_records');
    await queryRunner.dropTable('data_access_requests');
    await queryRunner.dropTable('compliance_checks');

    await queryRunner.query('DROP TYPE IF EXISTS "consent_granter_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "consent_channel_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "consent_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "consent_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dar_data_scope_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dar_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "dar_request_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "risk_level_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "check_decision_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "data_class_enum"');
  }
}
