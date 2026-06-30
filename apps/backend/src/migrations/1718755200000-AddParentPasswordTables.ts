import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentPasswordTables1718755200000 implements MigrationInterface {
  name = 'AddParentPasswordTables1718755200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "failed_attempts" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lockout_until" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "password_history" TEXT[],
      ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN DEFAULT false
    `);

    // Create parent_student_links table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_student_links" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "parent_id" uuid NOT NULL,
        "student_id" varchar(50) NOT NULL,
        "relationship" varchar(20) NOT NULL,
        "is_primary" boolean DEFAULT false,
        "verified_at" TIMESTAMP,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        UNIQUE("parent_id", "student_id"),
        CONSTRAINT "fk_parent_student_links_parent" FOREIGN KEY ("parent_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create temporary_passwords table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "temporary_passwords" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "code_hash" varchar(255) NOT NULL,
        "type" varchar(10) NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used" boolean DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_temporary_passwords_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create otp_requests table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "otp_requests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "phone" varchar(20),
        "email" varchar(100),
        "code_hash" varchar(255) NOT NULL,
        "type" varchar(20) NOT NULL,
        "attempts" INTEGER DEFAULT 0,
        "expires_at" timestamp NOT NULL,
        "used" boolean DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_otp_requests_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_student_links_parent"
      ON "parent_student_links"("parent_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_student_links_student"
      ON "parent_student_links"("student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_temporary_passwords_user"
      ON "temporary_passwords"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_otp_requests_user"
      ON "otp_requests"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_otp_requests_phone_date"
      ON "otp_requests"("phone", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_otp_requests_phone_date"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_otp_requests_user"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_temporary_passwords_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_parent_student_links_student"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_parent_student_links_parent"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "temporary_passwords"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_student_links"`);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "failed_attempts",
      DROP COLUMN IF EXISTS "lockout_until",
      DROP COLUMN IF EXISTS "password_history",
      DROP COLUMN IF EXISTS "must_change_password"
    `);
  }
}
