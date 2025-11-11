const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing /api/users endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/users');
    
    if (!response.ok) {
      console.log('❌ API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received!');
    console.log('📊 Total users:', data.length);
    
    // Check first 3 students for section field
    const students = data.filter(u => u.role === 'student').slice(0, 5);
    
    console.log('\n📋 First 5 Students:\n');
    students.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Section: ${s.section || '❌ MISSING'}`);
      console.log(`   Role: ${s.role}`);
      console.log('');
    });
    
    // Check if ANY students have section field
    const studentsWithSection = data.filter(u => u.role === 'student' && u.section);
    const totalStudents = data.filter(u => u.role === 'student').length;
    
    console.log('\n📈 Section Statistics:');
    console.log(`Total students: ${totalStudents}`);
    console.log(`With section field: ${studentsWithSection.length}`);
    console.log(`Missing section: ${totalStudents - studentsWithSection.length}`);
    
    if (studentsWithSection.length === 0) {
      console.log('\n❌ PROBLEM: API is NOT returning section field!');
    } else if (studentsWithSection.length < totalStudents) {
      console.log('\n⚠️ WARNING: Some students missing section field!');
    } else {
      console.log('\n✅ SUCCESS: All students have section field!');
      
      // Show distribution
      const distribution = {};
      studentsWithSection.forEach(s => {
        distribution[s.section] = (distribution[s.section] || 0) + 1;
      });
      console.log('Section distribution:', distribution);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
