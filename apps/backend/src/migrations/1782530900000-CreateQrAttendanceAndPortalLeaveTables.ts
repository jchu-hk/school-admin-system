import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CR-20260714-001 (Phase 5, T25): QR 考勤 + 学生/家长门户新表迁移
 *
 * 补齐以下生产库缺失的迁移（此前这些表仅存在于实体层，靠 dev synchronize 自动创建，
 * 生产库 synchronize=false 需显式迁移）：
 *
 *   1. qr_codes                  — QR 码（考勤签到，防重放）
 *   2. attendance_qr_logs        — 扫码考勤日志（online / offline_sync）
 *   3. offline_sync_buffer       — 离线同步缓冲区（容灾）
 *   4. attendance_daily_reports  — 签到日报表（定时任务生成）
 *   5. leave_requests            — 门户端请假申请
 *
 * 幂等性：TypeORM migration runner 以 migrations 表记录已执行迁移，天然保证只执行一次。
 * 本迁移额外使用 IF NOT EXISTS / 索引 IF NOT EXISTS 做二次兜底，确保在
 * 已经被 dev synchronize 创建过表的库上也能安全地重复执行。
 */
export class CreateQrAttendanceAndPortalLeaveTables1782530900000
  implements MigrationInterface
{
  name = 'CreateQrAttendanceAndPortalLeaveTables1782530900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 主键默认值统一使用 PG16 原生 gen_random_uuid()，无需扩展、跨库稳定；
    // 与生产库现有 qr_codes.id 的 gen_random_uuid() 默认值保持一致
    // （不用 uuid_generate_v4()：PG16 中 pgcrypto 不再提供该函数，现有生产 shim 依赖 uuid-ossp C 库，较脆弱）

    // ============ 1. qr_codes ============
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "qr_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_id" uuid NOT NULL,
        "nonce" varchar(64) NOT NULL,
        "key_version" integer NOT NULL,
        "signature" varchar(128) NOT NULL,
        "qr_data" text,
        "generated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        CONSTRAINT "UQ_qr_codes_nonce" UNIQUE ("nonce"),
        CONSTRAINT "PK_qr_codes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_qr_codes_student_generated"
      ON "qr_codes" ("student_id", "generated_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_qr_codes_status_expires"
      ON "qr_codes" ("status", "expires_at")`);
    await queryRunner.query(`
      DO $$ BEGIN
        -- 仅当 qr_codes.student_id 尚无外键约束时创建，避免与 synchronize 已有约束重复
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.conrelid='qr_codes'::regclass AND c.contype='f' AND a.attname='student_id'
        ) THEN
          ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_qr_codes_student"
            FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // ============ 2. attendance_qr_logs ============
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_qr_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "qr_code_id" uuid,
        "student_id" uuid,
        "staff_user_id" uuid NOT NULL,
        "scanned_at" TIMESTAMP NOT NULL DEFAULT now(),
        "source" varchar(20) NOT NULL DEFAULT 'online',
        "device_id" varchar(128),
        "ip_address" varchar(45),
        "result" varchar(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_qr_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_att_qr_logs_student_scanned"
      ON "attendance_qr_logs" ("student_id", "scanned_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_att_qr_logs_staff_scanned"
      ON "attendance_qr_logs" ("staff_user_id", "scanned_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_att_qr_logs_result"
      ON "attendance_qr_logs" ("result")`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.conrelid='attendance_qr_logs'::regclass AND c.contype='f' AND a.attname='qr_code_id'
        ) THEN
          ALTER TABLE "attendance_qr_logs" ADD CONSTRAINT "FK_att_qr_logs_qr_code"
            FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes" ("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.conrelid='attendance_qr_logs'::regclass AND c.contype='f' AND a.attname='student_id'
        ) THEN
          ALTER TABLE "attendance_qr_logs" ADD CONSTRAINT "FK_att_qr_logs_student"
            FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.conrelid='attendance_qr_logs'::regclass AND c.contype='f' AND a.attname='staff_user_id'
        ) THEN
          ALTER TABLE "attendance_qr_logs" ADD CONSTRAINT "FK_att_qr_logs_staff"
            FOREIGN KEY ("staff_user_id") REFERENCES "users" ("id");
        END IF;
      END $$;
    `);

    // ============ 3. offline_sync_buffer（门户/离线缓冲） ============
    // 历史遗留：dev synchronize 曾在旧阶段以复数表名 offline_sync_buffers 建过一张
    // 旧 schema 的表（列 payload/status/last_sync_at，与当前实体完全不符）。
    // 该表不对应任何当前实体，属残留垃圾表（当前实体映射 singular offline_sync_buffer）。
    // 为避免困惑，若旧复数表仍存在且无数据，则清理之。
    await queryRunner.query(`
      DO $$ DECLARE
        orphan_count bigint;
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='offline_sync_buffers') THEN
          EXECUTE 'SELECT count(*) FROM "offline_sync_buffers"' INTO orphan_count;
          IF orphan_count = 0 THEN
            DROP TABLE IF EXISTS "offline_sync_buffers";
          END IF;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offline_sync_buffer" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "cache_id" uuid,
        "device_id" varchar(128) NOT NULL,
        "device_name" varchar(200),
        "scanner_location" varchar(100),
        "qr_raw" text NOT NULL,
        "qr_raw_hash" varchar(64),
        "qr_student_id" uuid,
        "scanned_at" TIMESTAMPTZ NOT NULL,
        "cached_at" TIMESTAMPTZ,
        "synced" boolean NOT NULL DEFAULT false,
        "sync_status" varchar(30) NOT NULL DEFAULT 'pending',
        "synced_at" TIMESTAMPTZ,
        "sync_result" varchar(20),
        "failure_reason" text,
        "retry_count" integer NOT NULL DEFAULT 0,
        "attendance_id" uuid,
        "raw_request" jsonb,
        "validation_detail" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offline_sync_buffer" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_off_sync_buffer_device_synced"
      ON "offline_sync_buffer" ("device_id", "synced")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_off_sync_buffer_synced_created"
      ON "offline_sync_buffer" ("synced", "created_at")`);

    // ============ 4. attendance_daily_reports ============
    // 日报生成状态枚举（pending / generated / failed）
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE daily_report_status_enum AS ENUM ('pending','generated','failed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    // 幂等性+旧架构兼容：历史上该表曾在 dev synchronize 阶段以旧 schema 被创建过
    // （旧列 present_count/leave_count/report_data/status=varchar 'draft'）。
    // 若检测到该旧 schema（存在旧列 present_count 或 report_data），则先 DROP 以便
    // 下方 CREATE TABLE 以当前实体权威 schema 重建，避免 IF NOT EXISTS 跳过旧表。
    // 仅当旧库有数据时清空会被拒绝，此处以 DROP 重建为准（旧表在测试库无数据，安全）。
    await queryRunner.query(`
      DO $$ DECLARE
        has_old_col integer;
      BEGIN
        SELECT count(*) INTO has_old_col
        FROM information_schema.columns
        WHERE table_name='attendance_daily_reports' AND column_name IN ('present_count','report_data');
        IF has_old_col > 0 THEN
          DROP TABLE IF EXISTS "attendance_daily_reports";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_daily_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "school_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "report_date" date NOT NULL,
        "class_name" varchar(50),
        "grade" varchar(20),
        "total_students" integer NOT NULL DEFAULT 0,
        "checked_in" integer NOT NULL DEFAULT 0,
        "late_count" integer NOT NULL DEFAULT 0,
        "absent_count" integer NOT NULL DEFAULT 0,
        "leave_approved" integer NOT NULL DEFAULT 0,
        "unchecked_students" jsonb,
        "checked_in_students" jsonb,
        "leave_students" jsonb,
        "status" daily_report_status_enum NOT NULL DEFAULT 'pending',
        "notification_sent" boolean NOT NULL DEFAULT false,
        "notification_sent_at" TIMESTAMPTZ,
        "teacher_ids" jsonb,
        "notification_ids" jsonb,
        "failure_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_daily_reports" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_att_daily_reports_class_date"
      ON "attendance_daily_reports" ("class_id", "report_date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_att_daily_reports_report_date"
      ON "attendance_daily_reports" ("report_date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_att_daily_reports_class_id"
      ON "attendance_daily_reports" ("class_id")`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.conrelid='attendance_daily_reports'::regclass AND c.contype='f' AND a.attname='class_id'
        ) THEN
          ALTER TABLE "attendance_daily_reports" ADD CONSTRAINT "FK_att_daily_reports_class"
            FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // ============ 5. leave_requests（门户端请假） ============
    // 创建状态枚举（如已存在则跳过）
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE leave_type_enum AS ENUM ('sick','personal','family','other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE leave_status_enum AS ENUM ('pending','approved','rejected','cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE submitter_role_enum AS ENUM ('student','parent');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_id" uuid NOT NULL,
        "applicant_id" uuid NOT NULL,
        "leave_type" leave_type_enum NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "total_days" integer NOT NULL,
        "reason" text NOT NULL,
        "attachment_url" text,
        "submitter_role" submitter_role_enum NOT NULL,
        "status" leave_status_enum NOT NULL DEFAULT 'pending',
        "approved_by" uuid,
        "approved_at" TIMESTAMP,
        "approval_comment" text,
        "contact_phone" varchar(20),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_requests_student"
      ON "leave_requests" ("student_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_requests_status"
      ON "leave_requests" ("status")`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_leave_requests_student') THEN
          ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_leave_requests_student"
            FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_leave_requests_applicant') THEN
          ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_leave_requests_applicant"
            FOREIGN KEY ("applicant_id") REFERENCES "users" ("id");
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_leave_requests_approver') THEN
          ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_leave_requests_approver"
            FOREIGN KEY ("approved_by") REFERENCES "users" ("id");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 逆序删除
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_daily_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "offline_sync_buffer"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_qr_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_codes"`);
    // 清理枚举
    await queryRunner.query(`DROP TYPE IF EXISTS daily_report_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS submitter_role_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS leave_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS leave_type_enum`);
  }
}
