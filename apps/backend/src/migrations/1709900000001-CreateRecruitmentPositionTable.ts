import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecruitmentPositionTable1709900000001 implements MigrationInterface {
  name = 'CreateRecruitmentPositionTable1709900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for position status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "position_status_enum" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create enum type for employment type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "employment_type_enum" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create recruitment_positions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recruitment_positions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(200) NOT NULL,
        "subject" character varying(100) NOT NULL,
        "employment_type" "employment_type_enum" NOT NULL DEFAULT 'FULL_TIME',
        "salary_min" decimal(10,2) NOT NULL,
        "salary_max" decimal(10,2) NOT NULL,
        "salary_currency" character varying(10) NOT NULL DEFAULT 'HKD',
        "location" character varying(500) NOT NULL,
        "requirements" jsonb NOT NULL DEFAULT '[]',
        "responsibilities" jsonb NOT NULL DEFAULT '[]',
        "benefits" jsonb NOT NULL DEFAULT '[]',
        "application_deadline" date NOT NULL,
        "status" "position_status_enum" NOT NULL DEFAULT 'DRAFT',
        "application_count" integer NOT NULL DEFAULT 0,
        "published_at" TIMESTAMP,
        "paused_at" TIMESTAMP,
        "closed_at" TIMESTAMP,
        "school_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recruitment_positions" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_positions_status" ON "recruitment_positions" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_positions_subject" ON "recruitment_positions" ("subject")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_positions_employment_type" ON "recruitment_positions" ("employment_type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_positions_deadline" ON "recruitment_positions" ("application_deadline")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "recruitment_positions" CASCADE`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "position_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "employment_type_enum"`);
  }
}
