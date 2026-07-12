import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class AddTestUsers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminPassword = await bcrypt.hash('TestPass123!', 10);
    const staffPassword = await bcrypt.hash('TestPass123!', 10);

    // Create test admin without OTP
    await queryRunner.query(
      `INSERT INTO users (id, username, password, role, email, otp_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET password = $3, otp_enabled = $6`,
      [
        '99999999-9999-9999-9999-999999999999',
        'test_admin',
        adminPassword,
        'system_admin',
        'test_admin@school.edu',
        false
      ]
    );

    // Create test staff without OTP
    await queryRunner.query(
      `INSERT INTO users (id, username, password, role, email, otp_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET password = $3, otp_enabled = $6`,
      [
        '88888888-8888-8888-8888-888888888888',
        'test_staff',
        staffPassword,
        'school_staff',
        'test_staff@school.edu',
        false
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE username IN ($1, $2)`, ['test_admin', 'test_staff']);
  }
}