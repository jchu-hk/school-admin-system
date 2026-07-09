-- Direct SQL to create test users (run in postgres container)

-- Create test_admin (system_admin, no OTP)
INSERT INTO users (id, username, password, role, email, otp_enabled, created_at, updated_at)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'test_admin',
  '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYz12345678901234567890123456789',
  'system_admin',
  'test_admin@school.edu',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET 
  password = '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYz12345678901234567890123456789',
  otp_enabled = false,
  updated_at = NOW();

-- Create test_staff (school_staff, no OTP)
INSERT INTO users (id, username, password, role, email, otp_enabled, created_at, updated_at)
VALUES (
  '88888888-8888-8888-8888-888888888888',
  'test_staff',
  '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYz12345678901234567890123456789',
  'school_staff',
  'test_staff@school.edu',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET 
  password = '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYz12345678901234567890123456789',
  otp_enabled = false,
  updated_at = NOW();

-- Verify
SELECT username, role, email, otp_enabled FROM users WHERE username IN ('test_admin', 'test_staff');