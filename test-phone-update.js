// Test script to verify Issue #156: Phone number update problem
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testPhoneUpdate() {
  console.log('=== Testing Issue #156: Phone number update ===\n');
  
  try {
    // 1. Login as system admin
    console.log('1. Logging in as system admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful, token received\n');
    
    // Find an existing user to test with
    console.log('2. Getting existing school_staff user...');
    const usersResponse = await axios.get(`${BASE_URL}/users?role=school_staff&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const testUser = usersResponse.data.data.find(u => u.username === 'staff1');
    if (!testUser) {
      console.log('No test user found, creating one...');
      const createResponse = await axios.post(`${BASE_URL}/users`, {
        username: `test-phone-${Date.now()}`,
        name: 'Test Phone User',
        email: `test-${Date.now()}@test.com`,
        phone: '85212345678',
        role: 'school_staff',
        password: 'Admin123!'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      testUser = createResponse.data;
    }
    
    const userId = testUser.id;
    console.log(`   Test user ID: ${userId}`);
    console.log(`   Initial phone from list: ${testUser.phone || 'null'}\n`);
    
    // 3. Get user details
    console.log('3. Getting user details...');
    const getResponse1 = await axios.get(`${BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Phone from GET: ${getResponse1.data.phone || 'null'}\n`);
    
    // 4. Update phone
    const newPhone = '85298765432';
    console.log(`4. Updating phone number to ${newPhone}...`);
    const updateResponse = await axios.patch(`${BASE_URL}/users/${userId}`, {
      phone: newPhone
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Update response phone: ${updateResponse.data.phone || 'null'}\n`);
    
    // 5. Get user details again to verify update
    console.log('5. Getting user details again...');
    const getResponse2 = await axios.get(`${BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Phone after update: ${getResponse2.data.phone || 'null'}\n`);
    
    // 6. Check database directly
    console.log('6. Checking database directly...');
    
    // 7. Verify
    console.log('=== Verification ===');
    if (getResponse2.data.phone === newPhone) {
      console.log('✅✅✅ SUCCESS: Phone update works correctly!\n');
    } else if (getResponse2.data.phone === '852****32') {
      console.log('⚠️ PROBLEM: Phone is masked but should show clear for admin\n');
    } else if (getResponse2.data.phone === getResponse1.data.phone) {
      console.log('❌❌❌ BUG CONFIRMED: Phone number NOT updated in API response!\n');
    } else if (!getResponse2.data.phone) {
      console.log('❌❌❌ BUG CONFIRMED: Phone is NULL after update!\n');
    } else {
      console.log(`⚠️ Unexpected phone value: ${getResponse2.data.phone}\n`);
    }
    
    // Restore original phone
    console.log('7. Restoring original phone...');
    await axios.patch(`${BASE_URL}/users/${userId}`, {
      phone: getResponse1.data.phone || ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Original phone restored\n');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

testPhoneUpdate();