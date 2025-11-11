import fetch from 'node-fetch';

async function testUsersAPI() {
  try {
    console.log('🧪 Testing /api/users endpoint\n');
    
    // First, login to get a token
    console.log('1️⃣ Logging in to get auth token...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@system.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const text = await loginResponse.text();
      console.error('Response:', text);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Logged in successfully\n');
    
    const token = loginData.token;
    if (!token) {
      console.error('❌ No token in response');
      console.log('Login response:', loginData);
      return;
    }
    
    // Now fetch users
    console.log('2️⃣ Fetching users from API...');
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      console.error('❌ Fetch users failed:', usersResponse.status, usersResponse.statusText);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log('✅ Users fetched successfully\n');
    
    const students = usersData.users?.filter(u => u.role === 'student') || [];
    console.log(`📊 Total students: ${students.length}\n`);
    
    console.log('🔍 Section field check:\n');
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Section VALUE: "${student.section}"`);
      console.log(`   Section TYPE: ${typeof student.section}`);
      console.log(`   Section EXISTS: ${student.hasOwnProperty('section')}`);
      console.log('');
    });
    
    // Section distribution
    const sectionCounts = students.reduce((acc, s) => {
      const section = s.section || 'UNDEFINED';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Section distribution:');
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`   ${section}: ${count}`);
    });
    
    console.log('\n\n📄 RAW JSON (first student):');
    if (students.length > 0) {
      console.log(JSON.stringify(students[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testUsersAPI();
