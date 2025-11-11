async function test() {
  try {
    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    console.log('✅ Logged in successfully\n');
    
    // Fetch users
    const usersRes = await fetch('http://localhost:5000/api/users', {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });
    
    const usersData = await usersRes.json();
    const students = usersData.users.filter(u => u.role === 'student');
    
    console.log(`📊 Total students: ${students.length}`);
    console.log(`✅ Students WITH section: ${students.filter(s => s.section).length}`);
    console.log(`❌ Students WITHOUT section: ${students.filter(s => !s.section).length}\n`);
    
    console.log('📋 Section distribution:');
    const sectionCounts = students.reduce((acc, s) => {
      const section = s.section || 'MISSING';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    console.log(sectionCounts);
    
    console.log('\n🔍 First 5 students:');
    students.slice(0, 5).forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (Roll: ${s.rollNumber})`);
      console.log(`   Section: "${s.section}" | Department: ${s.department}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
