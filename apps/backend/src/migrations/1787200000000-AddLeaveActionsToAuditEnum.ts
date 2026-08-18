import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 新增请假审计动作 → audit_logs.action 枚举
 *
 * 背景（Issue #262 BUG-A）：门户电子请假模块写审计日志时使用了
 * leave_apply / leave_approve / leave_reject / leave_cancel 四个动作，
 * 但 audit_logs.action 的枚举类型（`audit_logs_action_enum` / `audit_action`）
 * 缺少这些值，导致提交/撤回/审批/驳回写审计时 PG 抛
 * `invalid input value for enum ...` 而整体 500。
 *
 * 本迁移幂等地补齐枚举值，兼容两种历史类型命名：
 *   - 存量生产库：TypeORM 自动同步生成的 `audit_logs_action_enum`
 *   - 全新按迁移部署：`1717670400000` 创建的 `audit_action`
 *
 * 设计对齐：DB-SCHEMA §4.3 / §7.6（audit_action 含 leave_apply/leave_approve/leave_reject）
 * 以及 audit-log.entity AuditAction 枚举中的 leave_cancel。
 */
export class AddLeaveActionsToAuditEnum1787200000000
  implements MigrationInterface
{
  name = 'AddLeaveActionsToAuditEnum1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 幂等地补齐 audit_logs.action 枚举的请假动作值。
    // 通过 DO 块动态解析 audit_logs.action 实际使用的枚举类型名，
    // 并对其 4 个缺少的 leave 值依次 ADD VALUE IF NOT EXISTS。
    await queryRunner.query(`
      DO $$
      DECLARE
        _type_name text;
        _sql       text;
      BEGIN
        -- 解析 audit_logs.action 列关联的枚举类型名（含 default 兜底）
        SELECT COALESCE(t.typname, 'audit_logs_action_enum')
          INTO _type_name
          FROM pg_attribute a
          JOIN pg_class c ON c.oid = a.attrelid
          JOIN pg_type  t ON t.oid  = a.atttypid
          JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE c.relname = 'audit_logs'
           AND a.attname = 'action'
         LIMIT 1;

        -- 依次补齐 4 个请假动作值（幂等）
        FOREACH _sql IN ARRAY ARRAY[
          format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_apply''', _type_name),
          format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_approve''', _type_name),
          format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_reject''', _type_name),
          format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_cancel''', _type_name)
        ] LOOP
          EXECUTE _sql;
        END LOOP;
      END $$;
    `);

    // 兜底：即便 audit_logs.action 未解析到枚举类型（例如全新建库走 1717670400000 的 audit_action），
    // 也确保两个候选类型都存在请假值，保证幂等与一致性。
    await queryRunner.query(`
      DO $$
      DECLARE
        _type_name text;
        _sql       text;
      BEGIN
        FOREACH _type_name IN ARRAY ARRAY['audit_logs_action_enum', 'audit_action'] LOOP
          IF EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = _type_name AND t.typtype = 'e'
          ) THEN
            FOREACH _sql IN ARRAY ARRAY[
              format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_apply''', _type_name),
              format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_approve''', _type_name),
              format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_reject''', _type_name),
              format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''leave_cancel''', _type_name)
            ] LOOP
              EXECUTE _sql;
            END LOOP;
          END IF;
        END LOOP;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL 不支持从枚举中删除值（无原生 ALTER TYPE DROP VALUE），
    // 回滚需重建枚举类型并迁移数据，风险极高，故此处不执行删除。
    // 需要的回滚手段：人工重建 audit_logs_action_enum / audit_action 枚举。
    return;
  }
}
