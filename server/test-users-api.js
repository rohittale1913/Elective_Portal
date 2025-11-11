// Test script to verify the /users API endpoint returns section field
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function testUsersEndpoint() {
  try {
    console.log('🧪 Testing /users endpoint for section field...\n');

    // First, login as admin to get a token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@college.edu',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Make sure the server is running and admin user exists.');
      console.log('Response:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful!\n');

    // Now fetch all users
    console.log('2️⃣ Fetching all users...');
    const usersResponse = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      console.log('❌ Failed to fetch users.');
      console.log('Response:', await usersResponse.text());
      return;
    }

    const usersData = await usersResponse.json();
    const students = usersData.users.filter(u => u.role === 'student');
    
    console.log(`✅ Fetched ${students.length} students\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Student Section Field Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    students.forEach((student, index) => {
      const hasSection = student.section !== undefined && student.section !== null;
      const sectionValue = student.section || '❌ MISSING';
      const status = hasSection ? '✅' : '❌';
      
      console.log(`${index + 1}. ${status} ${student.name.padEnd(25)} | Roll: ${String(student.rollNumber || 'N/A').padEnd(10)} | Section: ${sectionValue}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const withSection = students.filter(s => s.section);
    const withoutSection = students.filter(s => !s.section);
    
    console.log(`\n✅ Students WITH section: ${withSection.length}`);
    console.log(`❌ Students WITHOUT section: ${withoutSection.length}`);
    
    if (withoutSection.length > 0) {
      console.log('\n⚠️  WARNING: Some students are missing section field in API response!');
      console.log('This means the backend is not properly returning section data.');
    } else {
      console.log('\n🎉 SUCCESS: All students have section field in API response!');
    }

    // Show sample raw data
    if (students.length > 0) {
      console.log('\n📋 Sample Raw User Object (first student):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(students[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testUsersEndpoint();
