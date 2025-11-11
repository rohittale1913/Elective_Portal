// 🚨 FIX SECTION FILTER - PASTE IN BROWSER CONSOLE 🚨
// Open browser console (F12), paste this entire code, and press Enter

(async function fixSectionFilter() {
  console.clear();
  console.log('%c🔧 FIXING SECTION FILTER', 'font-size: 20px; color: #4CAF50; font-weight: bold;');
  console.log('\n');
  
  // Step 1: Check current state
  console.log('%cSTEP 1: Checking Current State', 'color: #2196F3; font-weight: bold;');
  
  const studentsInStorage = localStorage.getItem('students');
  if (studentsInStorage) {
    const students = JSON.parse(studentsInStorage);
    console.log(`📦 Found ${students.length} students in localStorage`);
    
    const sectionDist = students.reduce((acc, s) => {
      acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Section distribution:', sectionDist);
    
    if (students.every(s => !s.section || s.section === 'undefined')) {
      console.log('❌ PROBLEM: No students have section data!');
    } else if (students.every(s => s.section === 'A')) {
      console.log('⚠️ PROBLEM: All students have section = "A" (default value)');
    } else {
      console.log('✅ Students have section data');
    }
  } else {
    console.log('📦 No students in localStorage');
  }
  console.log('\n');
  
  // Step 2: Clear cache and fetch fresh data
  console.log('%cSTEP 2: Clearing Cache & Fetching Fresh Data', 'color: #2196F3; font-weight: bold;');
  
  const authToken = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (!authToken) {
    console.log('❌ Not logged in. Please login first.');
    return;
  }
  
  // Clear only data cache, keep auth
  console.log('🗑️ Clearing cached data...');
  localStorage.removeItem('students');
  localStorage.removeItem('users');
  localStorage.removeItem('electives');
  localStorage.removeItem('tracks');
  console.log('✅ Cache cleared\n');
  
  // Fetch fresh users from API
  console.log('📡 Fetching fresh user data from API...');
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const allUsers = data.users || [];
    console.log(`✅ Fetched ${allUsers.length} users from API\n`);
    
    const students = allUsers.filter(u => u.role === 'student');
    console.log(`👥 Students: ${students.length}`);
    
    // Show first 5 students
    console.log('\n📋 First 5 students:');
    students.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name}: Section "${s.section || 'MISSING'}"`);
    });
    
    // Section distribution
    const apiSectionDist = students.reduce((acc, s) => {
      acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
      return acc;
    }, {});
    console.log('\n📊 API Section distribution:', apiSectionDist);
    
    if (students.every(s => !s.section)) {
      console.log('\n❌ CRITICAL: API is not returning section field!');
      console.log('   The backend needs to be fixed.');
      console.log('   Check server/routes/users.js');
      return;
    }
    
    // Convert to student format and save
    console.log('\n💾 Saving students to localStorage...');
    const studentsData = students.map(user => ({
      id: user._id || user.id,
      name: user.name,
      rollNumber: user.rollNumber || user.rollNo,
      email: user.email,
      department: user.department,
      yearOfStudy: Math.ceil((user.semester || 1) / 2),
      semester: user.semester || 1,
      section: user.section, // Keep exact value from API
      cgpa: user.cgpa || 0,
      completedCredits: user.completedCredits || 0,
      profile: user.preferences || {
        interests: [],
        careerGoals: [],
        preferredLearningStyle: ''
      }
    }));
    
    localStorage.setItem('students', JSON.stringify(studentsData));
    console.log('✅ Students saved to localStorage\n');
    
    // Verify saved data
    const verifyDist = studentsData.reduce((acc, s) => {
      acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Saved section distribution:', verifyDist);
    
    // Step 3: Reload page
    console.log('\n%cSTEP 3: Reloading Page', 'color: #2196F3; font-weight: bold;');
    console.log('The page will reload in 2 seconds...');
    console.log('After reload, the section filter should work!\n');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();

console.log('\n%c📝 After reload:', 'color: #FF9800; font-weight: bold;');
console.log('1. Go to Admin > Students page');
console.log('2. Click the "Section" dropdown');
console.log('3. Select a section (A, B, or C)');
console.log('4. The student list should filter correctly!');
