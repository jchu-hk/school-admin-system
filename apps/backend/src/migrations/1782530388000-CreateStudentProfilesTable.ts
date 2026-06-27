import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateStudentProfilesTable1782530388000 implements MigrationInterface {
  name = 'CreateStudentProfilesTable1782530388000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE enrollment_status_enum AS ENUM ('active', 'graduated', 'transferred', 'suspended', 'withdrawn');
    `);

    // Create student_profiles table
    await queryRunner.createTable(
      new Table({
        name: 'student_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'student_id', type: 'uuid', isUnique: true },
          // Enrollment Records
          { name: 'enrollment_date', type: 'date', isNullable: true },
          { name: 'enrollment_status', type: 'enum', enum: ['active', 'graduated', 'transferred', 'suspended', 'withdrawn'], default: "'active'" },
          { name: 'previous_school', type: 'varchar', length: '200', isNullable: true },
          { name: 'admission_grade', type: 'varchar', length: '20', isNullable: true },
          { name: 'current_grade', type: 'varchar', length: '20', isNullable: true },
          { name: 'graduation_date', type: 'date', isNullable: true },
          { name: 'enrollment_cert_no', type: 'varchar', length: '50', isNullable: true },
          // Health Summary
          { name: 'has_allergy', type: 'boolean', default: false },
          { name: 'allergens', type: 'text', isNullable: true },
          { name: 'has_long_term_medication', type: 'boolean', default: false },
          { name: 'long_term_medication_notes', type: 'text', isNullable: true },
          { name: 'has_sen', type: 'boolean', default: false },
          { name: 'sen_type', type: 'varchar', length: '200', isNullable: true },
          { name: 'emergency_contact_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'emergency_contact_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'emergency_contact_relation', type: 'varchar', length: '50', isNullable: true },
          // Grade Summary
          { name: 'latest_avg_score', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'total_grade_records', type: 'integer', default: 0 },
          // Archive Status
          { name: 'is_archived', type: 'boolean', default: false },
          { name: 'archived_at', type: 'timestamp', isNullable: true },
          { name: 'archive_reason', type: 'varchar', length: '200', isNullable: true },
          // Metadata
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'student_profiles',
      new TableForeignKey({
        name: 'FK_student_profiles_student_id',
        columnNames: ['student_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IDX_student_profiles_enrollment_status ON student_profiles(enrollment_status);
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_student_profiles_is_archived ON student_profiles(is_archived);
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_student_profiles_current_grade ON student_profiles(current_grade);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_student_profiles_current_grade;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_student_profiles_is_archived;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_student_profiles_enrollment_status;`);

    // Drop foreign key
    await queryRunner.query(`ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS FK_student_profiles_student_id;`);

    // Drop table
    await queryRunner.dropTable('student_profiles', true);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS enrollment_status_enum;`);
  }
}