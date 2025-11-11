// Quick API test to check what's actually being returned
import('dotenv').then(dotenv => dotenv.config());

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoints...\n');
    
    // Test 1: Check what /api/users returns
    console.log('=== TEST 1: Fetching /api/users ===');
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGU2OWJlNjJjZjkwMjdjMDQ3ZjY5ZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczODIyNzk5MSwiZXhwIjoxNzM4ODMyNzkxfQ.W3v-example-token'
      }
    });
    
    if (!response.ok) {
      console.log('❌ API call failed:', response.status);
      console.log('Try logging in again to get a fresh token');
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response received');
    console.log('📊 Total users:', data.users?.length || 0);
    
    // Check first 3 students
    const students = data.users?.filter(u => u.role === 'student') || [];
    console.log('👥 Total students:', students.length);
    console.log('\n📋 First 3 students with section data:');
    students.slice(0, 3).forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.name}`);
      console.log(`   ID: ${student._id}`);
      console.log(`   Section in response: "${student.section}"`);
      console.log(`   Section type: ${typeof student.section}`);
      console.log(`   Has section property: ${student.hasOwnProperty('section')}`);
      console.log(`   Roll: ${student.rollNumber}`);
      console.log(`   Dept: ${student.department}`);
    });
    
    // Section distribution
    const sectionDist = students.reduce((acc, s) => {
      const section = s.section || 'undefined';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    console.log('\n📊 Section distribution in API response:', sectionDist);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend server is running on port 5000');
    console.log('2. You are logged in as admin');
    console.log('3. Update the Bearer token above with your actual token');
  }
}

testAPI();
