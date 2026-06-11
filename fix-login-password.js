const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'school_admin',
  password: 'school_admin123',
  database: 'school_admin',
});

async function diagnoseAndFix() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // 列出所有用户
    const users = await client.query(
      `SELECT id, username, name, role, status, "otpEnabled"
       FROM users
       WHERE "deletedAt" IS NULL
       ORDER BY "createdAt" DESC`
    );

    console.log('Existing users:');
    if (users.rows.length > 0) {
      users.rows.forEach(user => {
        const otpStatus = user.otpEnabled ? '✓ OTP enabled' : '✗ No OTP';
        const requiresOtp = ['teacher', 'school_director', 'system_admin'].includes(user.role);
        const otpRequired = requiresOtp ? '⚠️  OTP REQUIRED' : '✓ No OTP needed';
        console.log(`  - ${user.username.padEnd(20)} | ${user.role.padEnd(15)} | ${user.status.padEnd(8)} | ${otpStatus.padEnd(15)} | ${otpRequired}`);
      });
    } else {
      console.log('  No users found');
    }

    // 检查test用户是否存在
    const existingTest = await client.query(
      "SELECT id FROM users WHERE username = 'test' AND \"deletedAt\" IS NULL"
    );

    if (existingTest.rows.length > 0) {
      console.log('\n✓ Test user already exists.');
      console.log('\n📝 Test account details:');
      console.log('  Username: test');
      console.log('  Password: test123');
      console.log('  Role: school_staff');
      console.log('  Status: active');
      console.log('  OTP: NOT required for login');
      console.log('\n💡 This account can login directly without OTP verification.');
    } else {
      // 创建test用户
      const hashedPassword = await bcrypt.hash('test123', 12);
      const passwordExpiresAt = new Date();
      passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);

      const insertResult = await client.query(
        `INSERT INTO users (username, name, role, status, password, "passwordExpiresAt", "otpEnabled", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id, username, name, role, status, "otpEnabled"`,
        ['test', '测试用户', 'school_staff', 'active', hashedPassword, passwordExpiresAt, false]
      );

      const newUser = insertResult.rows[0];

      console.log('\n✓ Test user created successfully!');
      console.log('\n📝 Test account details:');
      console.log(`  Username: ${newUser.username}`);
      console.log(`  Password: test123`);
      console.log(`  Name: ${newUser.name}`);
      console.log(`  Role: ${newUser.role}`);
      console.log(`  Status: ${newUser.status}`);
      console.log(`  OTP: NOT required (otpEnabled = false)`);
      console.log(`\n💡 This account can login directly without OTP verification.`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY: Available Test Account');
    console.log('='.repeat(60));
    console.log('\n✓ Login Information:');
    console.log('  Username: test');
    console.log('  Password: test123');
    console.log('  Role: school_staff');
    console.log('  OTP: NOT required');
    console.log('\n✓ How to use:');
    console.log('  1. Go to login page');
    console.log('  2. Enter username: test');
    console.log('  3. Enter password: test123');
    console.log('  4. Login (no OTP needed)');
    console.log('\n✓ Notes:');
    console.log('  - school_staff role does NOT require OTP verification');
    console.log('  - Password expires in 90 days');
    console.log('  - User is active and ready to use');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

diagnoseAndFix();