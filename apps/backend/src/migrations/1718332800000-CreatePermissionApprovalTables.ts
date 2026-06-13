import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionApprovalTables1718332800000
  implements MigrationInterface
{
  name = 'CreatePermissionApprovalTables1718332800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permission_approval_requests table
    await queryRunner.query(`
      CREATE TABLE "permission_approval_requests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "requester_id" uuid NOT NULL,
        "target_user_id" uuid NOT NULL,
        "change_type" varchar NOT NULL,
        "role_id" uuid,
        "permission_ids" json,
        "request_reason" varchar NOT NULL,
        "valid_from" timestamp,
        "valid_until" timestamp,
        "status" varchar NOT NULL DEFAULT 'pending',
        "current_step" int NOT NULL DEFAULT 0,
        "total_steps" int NOT NULL DEFAULT 2,
        "risk_level" varchar NOT NULL DEFAULT 'medium',
        "rejection_reason" varchar,
        "school_id" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_target_user" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    // Create permission_approval_steps table
    await queryRunner.query(`
      CREATE TABLE "permission_approval_steps" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "request_id" uuid NOT NULL,
        "step_order" int NOT NULL,
        "approver_role" varchar NOT NULL,
        "approver_id" uuid,
        "status" varchar NOT NULL DEFAULT 'pending',
        "comment" varchar,
        "approved_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_request" FOREIGN KEY ("request_id") REFERENCES "permission_approval_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_approver" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_approval_request_requester" ON "permission_approval_requests"("requester_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_approval_request_target" ON "permission_approval_requests"("target_user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_approval_request_status" ON "permission_approval_requests"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_approval_request_school" ON "permission_approval_requests"("school_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_approval_step_request" ON "permission_approval_steps"("request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_approval_step_approver" ON "permission_approval_steps"("approver_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_approval_step_status" ON "permission_approval_steps"("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_approval_step_status"`);
    await queryRunner.query(`DROP INDEX "idx_approval_step_approver"`);
    await queryRunner.query(`DROP INDEX "idx_approval_step_request"`);
    await queryRunner.query(`DROP INDEX "idx_approval_request_school"`);
    await queryRunner.query(`DROP INDEX "idx_approval_request_status"`);
    await queryRunner.query(`DROP INDEX "idx_approval_request_target"`);
    await queryRunner.query(`DROP INDEX "idx_approval_request_requester"`);
    await queryRunner.query(`DROP TABLE "permission_approval_steps"`);
    await queryRunner.query(`DROP TABLE "permission_approval_requests"`);
  }
}