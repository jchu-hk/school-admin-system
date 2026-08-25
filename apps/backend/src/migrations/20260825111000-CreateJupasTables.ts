import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * F-ADM-002 JUPAS 大学联招管理
 * 创建 jupas_applications / jupas_choices / jupas_reference_letters / jupas_appeals 四张收生（admissions）域表。
 * 与 SSPA（F-ADM-001）同域；独立于教师招聘（recruitment）。
 * 放榜后状态由 dse_offer_tracking.jupas_status 承载，申请期数据由本模块承载。
 * @see SPEC-SYSTEM-DESIGN §19.6 / §10.4 / DB-SCHEMA §19 / DATA-DICTIONARY §22
 */
export class CreateJupasTables20260825111000 implements MigrationInterface {
  name = 'CreateJupasTables20260825111000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. 枚举类型
    // ============================================================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_ref_status_enum" AS ENUM
          ('pending','in_progress','submitted');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_app_status_enum" AS ENUM
          ('collecting','draft','submitted','announced','archived');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_choice_status_enum" AS ENUM
          ('draft','confirmed','applied','offered','declined');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_letter_type_enum" AS ENUM
          ('teacher','principal','school');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_letter_status_enum" AS ENUM
          ('draft','in_review','submitted','returned');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "jupas_appeal_status_enum" AS ENUM
          ('received','under_review','resolved','dismissed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ============================================================
    // 2. jupas_applications 申请主表
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jupas_applications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "jupas_id" character varying(50) NOT NULL,
        "academic_year" character varying(9) NOT NULL,
        "student_id" uuid NOT NULL,
        "jupas_application_no" character varying(30) NOT NULL,
        "choices_count" smallint NOT NULL DEFAULT 0,
        "school_reference_status" "jupas_ref_status_enum" NOT NULL DEFAULT 'pending',
        "submission_deadline" date,
        "status" "jupas_app_status_enum" NOT NULL DEFAULT 'collecting',
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jupas_applications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_jupas_applications_id" UNIQUE ("jupas_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_app_year" ON "jupas_applications" ("academic_year")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_app_student" ON "jupas_applications" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_app_status" ON "jupas_applications" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_applications" ADD CONSTRAINT "FK_jupas_app_student" FOREIGN KEY ("student_id") REFERENCES "students"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_applications" ADD CONSTRAINT "FK_jupas_app_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_applications" ADD CONSTRAINT "FK_jupas_app_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id")`,
    );

    // ============================================================
    // 3. jupas_choices 志愿
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jupas_choices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "priority" smallint NOT NULL,
        "institution" character varying(100) NOT NULL,
        "program" character varying(150) NOT NULL,
        "program_code" character varying(30) NOT NULL,
        "status" "jupas_choice_status_enum" NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jupas_choices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_jupas_choices_app_priority" UNIQUE ("application_id", "priority")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_choices_program" ON "jupas_choices" ("program_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_choices" ADD CONSTRAINT "FK_jupas_choices_app" FOREIGN KEY ("application_id") REFERENCES "jupas_applications"("id")`,
    );

    // ============================================================
    // 4. jupas_reference_letters 推荐信
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jupas_reference_letters" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "letter_type" "jupas_letter_type_enum" NOT NULL,
        "teacher_id" uuid NOT NULL,
        "subject" character varying(50),
        "content" text,
        "word_count" integer,
        "status" "jupas_letter_status_enum" NOT NULL DEFAULT 'draft',
        "ai_suggestion" jsonb,
        "letter_stats" jsonb,
        "deadline" date,
        "submitted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jupas_reference_letters" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_letters_app" ON "jupas_reference_letters" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_letters_teacher" ON "jupas_reference_letters" ("teacher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_letters_status" ON "jupas_reference_letters" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_reference_letters" ADD CONSTRAINT "FK_jupas_letters_app" FOREIGN KEY ("application_id") REFERENCES "jupas_applications"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_reference_letters" ADD CONSTRAINT "FK_jupas_letters_teacher" FOREIGN KEY ("teacher_id") REFERENCES "users"("id")`,
    );

    // ============================================================
    // 5. jupas_appeals 上诉
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jupas_appeals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "reason" text NOT NULL,
        "evidence" jsonb NOT NULL DEFAULT '[]',
        "status" "jupas_appeal_status_enum" NOT NULL DEFAULT 'received',
        "reviewed_by" uuid,
        "resolution" text,
        "resolved_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jupas_appeals" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_appeals_app" ON "jupas_appeals" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jupas_appeals_status" ON "jupas_appeals" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_appeals" ADD CONSTRAINT "FK_jupas_appeals_app" FOREIGN KEY ("application_id") REFERENCES "jupas_applications"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jupas_appeals" ADD CONSTRAINT "FK_jupas_appeals_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "jupas_appeals" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jupas_reference_letters" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jupas_choices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jupas_applications" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jupas_appeal_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jupas_letter_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jupas_letter_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jupas_choice_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jupas_app_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jupas_ref_status_enum"`);
  }
}
