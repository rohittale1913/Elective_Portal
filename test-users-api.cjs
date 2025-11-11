// Node.js built-in fetch (available in Node 18+)
const API_BASE = 'http://localhost:5000/api';

async function testUsersAPI() {
  console.log('🧪 Testing /api/users endpoint...\n');

  try {
    // First, login as admin to get token
    console.log('🔐 Step 1: Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@system.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    console.log('📊 Login response:', loginData);
    
    if (!loginData.success && !loginData.token) {
      console.error('❌ Login failed:', loginData.message || loginData);
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log('   Role:', loginData.user.role);
    console.log('   Token:', loginData.token.substring(0, 30) + '...\n');

    const token = loginData.token;

    // Now fetch users
    console.log('👥 Step 2: Fetching users from API...');
    const usersResponse = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      console.error('❌ Users API failed:', usersResponse.status, usersResponse.statusText);
      const errorText = await usersResponse.text();
      console.error('Error details:', errorText);
      process.exit(1);
    }

    const usersData = await usersResponse.json();
    console.log('✅ Users API responded successfully!\n');
    console.log('📊 Response structure:');
    console.log('   - success:', usersData.success);
    console.log('   - users count:', usersData.users?.length || 0);
    console.log('');

    if (usersData.users && usersData.users.length > 0) {
      const students = usersData.users.filter(u => u.role === 'student');
      console.log('👥 Students in response:', students.length);
      console.log('');

      console.log('📋 First 3 students from API:');
      students.slice(0, 3).forEach((student, idx) => {
        console.log(`  ${idx + 1}. ${student.name}`);
        console.log(`     ID: ${student._id || student.id}`);
        console.log(`     Department: ${student.department || 'N/A'}`);
        console.log(`     Section: ${student.section || 'N/A'}`);
        console.log(`     Semester: ${student.semester || 'N/A'}`);
        console.log('');
      });

      // Section distribution
      const secDist = students.reduce((acc, s) => {
        const sec = s.section || 'null/undefined';
        acc[sec] = (acc[sec] || 0) + 1;
        return acc;
      }, {});
      console.log('📝 Section distribution from API:');
      Object.entries(secDist).forEach(([sec, count]) => {
        console.log(`  ${sec}: ${count}`);
      });
      console.log('');

      console.log('✅ API is working correctly!');
      console.log('✅ Frontend should receive', students.length, 'students');
    } else {
      console.error('❌ No users in API response!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure the backend server is running on port 5000');
    process.exit(1);
  }
}

testUsersAPI();
