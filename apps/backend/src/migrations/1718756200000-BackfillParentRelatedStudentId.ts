import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillParentRelatedStudentId1718756200000 implements MigrationInterface {
  name = 'BackfillParentRelatedStudentId1718756200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update parent users' related_student_id from parent_student_links
    // Cast student_id to uuid since the column type is uuid but student_id is varchar in the link table
    await queryRunner.query(`
      UPDATE users
      SET related_student_id = (
        SELECT psl.student_id::uuid
        FROM parent_student_links psl
        WHERE psl.parent_id = users.id
          AND psl.is_primary = true
        LIMIT 1
      )
      WHERE users.role = 'parent'
        AND users.related_student_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET related_student_id = NULL
      WHERE users.role = 'parent'
    `);
  }
}
