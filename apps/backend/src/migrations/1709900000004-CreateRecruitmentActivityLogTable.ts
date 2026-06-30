import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecruitmentActivityLogTable1709900000004 implements MigrationInterface {
  name = 'CreateRecruitmentActivityLogTable1709900000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "activity_type_enum" AS ENUM (
          'STATUS_CHANGE', 'NOTE_ADDED', 'INTERVIEW_SCHEDULED',
          'INTERVIEW_CANCELLED', 'INTERVIEW_COMPLETED', 'SCORE_SUBMITTED',
          'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_DECLINED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recruitment_activity_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "activity_type" "activity_type_enum" NOT NULL,
        "performed_by" character varying(100),
        "description" text NOT NULL,
        "old_value" character varying(50),
        "new_value" character varying(50),
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recruitment_activity_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activity_logs_application"
      ON "recruitment_activity_logs" ("application_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activity_logs_type"
      ON "recruitment_activity_logs" ("activity_type")
    `);

    await queryRunner.query(`
      ALTER TABLE "recruitment_activity_logs"
      ADD CONSTRAINT "FK_activity_logs_application"
      FOREIGN KEY ("application_id")
      REFERENCES "recruitment_applications"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recruitment_activity_logs" DROP CONSTRAINT IF EXISTS "FK_activity_logs_application"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "recruitment_activity_logs" CASCADE`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_type_enum"`);
  }
}
