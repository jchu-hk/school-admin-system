import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * F-ADM-001 SSPA 中一自行分配学位
 * 创建 sspa_batches / sspa_applications / sspa_scores 三张收生（admissions）域表。
 * 独立于教师招聘（recruitment）模块，两者不相交。
 * @see SPEC-SYSTEM-DESIGN §19.5 / DB-SCHEMA §19 / DATA-DICTIONARY §22.9-22.11
 */
export class CreateSspaTables20260825110000 implements MigrationInterface {
  name = 'CreateSspaTables20260825110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. 枚举类型
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sspa_batch_status_enum" AS ENUM
          ('draft','open','scoring','announced','registered','archived');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sspa_result_enum" AS ENUM
          ('accepted','waitlist','rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sspa_edb_enum" AS ENUM
          ('offered','not_offered','pending');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sspa_app_status_enum" AS ENUM
          ('applied','screened','scored','offered','confirmed','registered','withdrawn');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sspa_criterion_enum" AS ENUM
          ('academic','interview','sibling','alumni','achievement','principal_discretion');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ============================================================
    // 2. sspa_batches 批次
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sspa_batches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "year" character varying(9) NOT NULL,
        "name" character varying(100) NOT NULL,
        "scoring_weights" jsonb NOT NULL,
        "seats" smallint NOT NULL,
        "open_at" date,
        "interview_date" date,
        "announcement_date" date,
        "status" "sspa_batch_status_enum" NOT NULL DEFAULT 'draft',
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sspa_batches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sspa_batches_year" UNIQUE ("year")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sspa_batches_status" ON "sspa_batches" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sspa_batches" ADD CONSTRAINT "FK_sspa_batches_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id")`,
    );

    // ============================================================
    // 3. sspa_applications 申请
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sspa_applications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "batch_id" uuid NOT NULL,
        "application_no" character varying(30) NOT NULL,
        "application_id" uuid,
        "student_name_zh" character varying(100) NOT NULL,
        "date_of_birth" date NOT NULL,
        "hk_id" character varying(20),
        "parent_name" character varying(100) NOT NULL,
        "parent_phone" character varying(20) NOT NULL,
        "school_of_origin" character varying(100),
        "sibling_enrolled" boolean NOT NULL DEFAULT false,
        "parent_alumni" boolean NOT NULL DEFAULT false,
        "other_achievements" text,
        "total_score" numeric(6,2),
        "rank" integer,
        "result" "sspa_result_enum",
        "edb_result" "sspa_edb_enum",
        "offer_confirmed" boolean NOT NULL DEFAULT false,
        "confirmed_at" TIMESTAMPTZ,
        "status" "sspa_app_status_enum" NOT NULL DEFAULT 'applied',
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sspa_applications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sspa_applications_no" UNIQUE ("application_no")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sspa_app_batch" ON "sspa_applications" ("batch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sspa_app_result" ON "sspa_applications" ("result")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sspa_app_status" ON "sspa_applications" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sspa_applications" ADD CONSTRAINT "FK_sspa_app_batch" FOREIGN KEY ("batch_id") REFERENCES "sspa_batches"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sspa_applications" ADD CONSTRAINT "FK_sspa_app_student_app" FOREIGN KEY ("application_id") REFERENCES "student_applications"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sspa_applications" ADD CONSTRAINT "FK_sspa_app_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id")`,
    );

    // ============================================================
    // 4. sspa_scores 评分明细
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sspa_scores" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "criterion" "sspa_criterion_enum" NOT NULL,
        "score" numeric(5,2) NOT NULL,
        "max_score" numeric(5,2) NOT NULL,
        "scored_by" uuid,
        "note" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sspa_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sspa_scores_app_criterion" UNIQUE ("application_id", "criterion")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sspa_scores_scored_by" ON "sspa_scores" ("scored_by")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sspa_scores" ADD CONSTRAINT "FK_sspa_scores_app" FOREIGN KEY ("application_id") REFERENCES "sspa_applications"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sspa_scores" ADD CONSTRAINT "FK_sspa_scores_scored_by" FOREIGN KEY ("scored_by") REFERENCES "users"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sspa_scores" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sspa_applications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sspa_batches" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sspa_criterion_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sspa_app_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sspa_edb_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sspa_result_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sspa_batch_status_enum"`);
  }
}
