import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPermissionAuditLog20260627130632 implements MigrationInterface {
    name = 'AddPermissionAuditLog20260627130632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "permission_audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "operator_id" uuid NOT NULL,
                "target_user_id" uuid NOT NULL,
                "old_permissions" jsonb NOT NULL,
                "new_permissions" jsonb NOT NULL,
                "remark" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9876543210fedcba" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_operator_id" ON "permission_audit_logs" ("operator_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_target_user_id" ON "permission_audit_logs" ("target_user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_created_at" ON "permission_audit_logs" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_audit_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_target_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_operator_id"`);
        await queryRunner.query(`DROP TABLE "permission_audit_logs"`);
    }
}
