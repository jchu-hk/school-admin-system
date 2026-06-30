import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecruitmentApplicationTable1709900000002
  implements MigrationInterface
{
  name = 'CreateRecruitmentApplicationTable1709900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for application status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "application_status_enum" AS ENUM ('NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'OFFER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create recruitment_applications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recruitment_applications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "application_number" character varying(50) NOT NULL,
        "position_id" uuid NOT NULL,
        "applicant_name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "cv_url" character varying(500),
        "cv_filename" character varying(255),
        "cover_letter" text,
        "education" jsonb NOT NULL DEFAULT '[]',
        "experience" jsonb NOT NULL DEFAULT '[]',
        "status" "application_status_enum" NOT NULL DEFAULT 'NEW',
        "screening_notes" text,
        "rejection_reason" text,
        "rejected_by" uuid,
        "rejected_at" TIMESTAMP,
        "school_id" uuid,
        "submitted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recruitment_applications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_application_number" UNIQUE ("application_number")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_position" ON "recruitment_applications" ("position_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_status" ON "recruitment_applications" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_email" ON "recruitment_applications" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_submitted" ON "recruitment_applications" ("submitted_at")
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "recruitment_applications"
      ADD CONSTRAINT "FK_applications_position"
      FOREIGN KEY ("position_id") REFERENCES "recruitment_positions"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recruitment_applications" DROP CONSTRAINT IF EXISTS "FK_applications_position"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "recruitment_applications" CASCADE`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "application_status_enum"`,
    );
  }
}
