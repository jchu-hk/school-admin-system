import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentTables1709436000000 implements MigrationInterface {
  name = 'CreateStudentTables1709436000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create academic_years enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "academic_year_status_enum" AS ENUM ('active', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create gender enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Create student_status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "student_status_enum" AS ENUM ('active', 'graduated', 'withdrawn', 'transferred');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 4. Create allocation_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "allocation_type_enum" AS ENUM ('main', 'elective', 'temporary');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 5. Create academic_years table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "academic_years" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "year" varchar(9) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "is_current" boolean NOT NULL DEFAULT false,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_academic_years_year" UNIQUE ("year"),
        CONSTRAINT "PK_academic_years" PRIMARY KEY ("id")
      )
    `);

    // 6. Create students table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" varchar(10) NOT NULL,
        "name_zh" varchar(100) NOT NULL,
        "name_en" varchar(100),
        "gender" gender_enum NOT NULL,
        "birth_date" date NOT NULL,
        "address" text,
        "phone" varchar(20),
        "email" varchar(255),
        "admission_date" date NOT NULL,
        "status" student_status_enum NOT NULL DEFAULT 'active',
        "guardian_name" varchar(100),
        "guardian_phone" varchar(20),
        "guardian_relationship" varchar(50),
        "emergency_contact" varchar(100),
        "emergency_phone" varchar(20),
        "hk_id" varchar(20),
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "UQ_students_student_id" UNIQUE ("student_id"),
        CONSTRAINT "PK_students" PRIMARY KEY ("id")
      )
    `);

    // 7. Create student_id_sequences table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_id_sequences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "academic_year" varchar(9) NOT NULL,
        "last_sequence" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_student_id_sequences_year" UNIQUE ("academic_year"),
        CONSTRAINT "PK_student_id_sequences" PRIMARY KEY ("id")
      )
    `);

    // 8. Create class_allocations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "class_allocations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "academic_year" varchar(9) NOT NULL,
        "allocation_type" allocation_type_enum NOT NULL DEFAULT 'main',
        "effective_date" date NOT NULL,
        "end_date" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_class_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_class_allocations_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_class_allocations_class" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_class_allocations_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // 9. Create student_users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "is_primary_account" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_student_users_student" UNIQUE ("student_id"),
        CONSTRAINT "UQ_student_users_user" UNIQUE ("user_id"),
        CONSTRAINT "PK_student_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_student_users_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_student_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // 10. Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_students_student_id" ON "students" ("student_id");
      CREATE INDEX IF NOT EXISTS "IDX_students_name_zh" ON "students" ("name_zh");
      CREATE INDEX IF NOT EXISTS "IDX_students_status" ON "students" ("status");
      CREATE INDEX IF NOT EXISTS "IDX_class_allocations_student_id" ON "class_allocations" ("student_id");
      CREATE INDEX IF NOT EXISTS "IDX_class_allocations_class_id" ON "class_allocations" ("class_id");
      CREATE INDEX IF NOT EXISTS "IDX_class_allocations_academic_year" ON "class_allocations" ("academic_year");
    `);

    // 11. Insert default academic year if not exists
    await queryRunner.query(`
      INSERT INTO "academic_years" ("year", "start_date", "end_date", "is_current", "status")
      VALUES ('2026-2027', '2026-09-01', '2027-08-31', true, 'active')
      ON CONFLICT ("year") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "class_allocations" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "student_id_sequences" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "students" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_years" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "allocation_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "student_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "academic_year_status_enum"`);
  }
}
