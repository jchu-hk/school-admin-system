import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecruitmentInterviewTable1709900000003 implements MigrationInterface {
  name = 'CreateRecruitmentInterviewTable1709900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interview_status_enum" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interview_type_enum" AS ENUM ('ONSITE', 'ONLINE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "overall_recommendation_enum" AS ENUM ('STRONG_RECOMMEND', 'RECOMMEND', 'NO_COMMENT', 'NOT_RECOMMEND');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recruitment_interviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "interview_date" TIMESTAMP NOT NULL,
        "duration_minutes" integer NOT NULL DEFAULT 60,
        "interview_type" "interview_type_enum" NOT NULL DEFAULT 'ONSITE',
        "interviewers" jsonb NOT NULL DEFAULT '[]',
        "location" character varying(500),
        "meeting_link" character varying(500),
        "notes" text,
        "status" "interview_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "scores" jsonb NOT NULL DEFAULT '[]',
        "overall_recommendation" "overall_recommendation_enum",
        "final_notes" text,
        "cancellation_reason" text,
        "cancelled_by" uuid,
        "cancelled_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "completed_by" uuid,
        "school_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recruitment_interviews" PRIMARY KEY ("id")
      )
    `);

    // Indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interviews_application" ON "recruitment_interviews" ("application_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interviews_status" ON "recruitment_interviews" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interviews_date" ON "recruitment_interviews" ("interview_date")
    `);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "recruitment_interviews"
      ADD CONSTRAINT "FK_interviews_application"
      FOREIGN KEY ("application_id") REFERENCES "recruitment_applications"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recruitment_interviews" DROP CONSTRAINT IF EXISTS "FK_interviews_application"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "recruitment_interviews" CASCADE`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "interview_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interview_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "overall_recommendation_enum"`,
    );
  }
}
