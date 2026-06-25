import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolDirectorRole1718756100000 implements MigrationInterface {
  name = 'AddSchoolDirectorRole1718756100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert school_director role
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "description", "is_system")
      VALUES (
        '10000000-0000-0000-0000-000000000006',
        'school_director',
        '校长',
        true
      )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles" WHERE "name" = 'school_director'
    `);
  }
}
