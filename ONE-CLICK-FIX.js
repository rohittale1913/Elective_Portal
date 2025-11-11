// 🚨 ONE-CLICK FIX FOR SECTION PROBLEM 🚨
// PASTE THIS IN BROWSER CONSOLE (Press F12, go to Console tab, paste this)

(async function fixSections() {
  console.clear();
  console.log('%c🚨 FIXING SECTION DISPLAY ISSUE 🚨', 'font-size: 20px; color: #ff6b6b; font-weight: bold;');
  console.log('\n');
  
  // Step 1: Clear old cache
  console.log('%cSTEP 1: Clearing old cached data...', 'color: #4CAF50; font-weight: bold;');
  const oldStudents = localStorage.getItem('students');
  if (oldStudents) {
    const parsed = JSON.parse(oldStudents);
    console.log(`  Found ${parsed.length} cached students`);
    if (parsed[0]) {
      console.log(`  Example: ${parsed[0].name} - Section: "${parsed[0].section}"`);
    }
  }
  
  localStorage.clear();
  sessionStorage.clear();
  console.log('  ✅ Cache cleared!\n');
  
  // Step 2: Test API
  console.log('%cSTEP 2: Testing API response...', 'color: #4CAF50; font-weight: bold;');
  
  // Try to get token from login
  let token = prompt('Please enter admin email (or press Cancel if already logged in):');
  let password = null;
  
  if (token) {
    password = prompt('Enter admin password:');
    
    // Login
    try {
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: token, password })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.token;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        console.log('  ✅ Logged in successfully!\n');
      } else {
        console.log('  ❌ Login failed. Make sure you\'re logged in and try again.');
        return;
      }
    } catch (e) {
      console.log('  ❌ Login error:', e.message);
      return;
    }
  } else {
    // Check for existing token
    token = localStorage.getItem('authToken');
    if (!token) {
      console.log('  ❌ No auth token found. Please login first.');
      console.log('  Run this script again after logging in.');
      return;
    }
  }
  
  // Fetch users
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`  ❌ API Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const students = data.users.filter(u => u.role === 'student');
    
    console.log(`  ✅ API returned ${students.length} students\n`);
    
    // Show first 5
    console.log('  First 5 students:');
    students.slice(0, 5).forEach((s, i) => {
      const sectionColor = s.section ? '#4CAF50' : '#ff6b6b';
      console.log(`%c  ${i + 1}. ${s.name}: Section ${s.section || 'MISSING'}`, `color: ${sectionColor}`);
    });
    
    // Distribution
    const dist = students.reduce((acc, s) => {
      acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n  📊 Section distribution:', dist);
    
    const allHaveSections = students.every(s => s.section);
    
    if (allHaveSections) {
      console.log('\n%c✅ SUCCESS! API is returning section data correctly!', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
    } else {
      console.log('\n%c⚠️ WARNING: Some students missing sections in database', 'color: #ffa500; font-size: 16px; font-weight: bold;');
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return;
  }
  
  // Step 3: Reload
  console.log('\n%cSTEP 3: Reloading page...', 'color: #4CAF50; font-weight: bold;');
  console.log('  The page will reload in 3 seconds...');
  console.log('  After reload, sections should display correctly!\n');
  
  setTimeout(() => {
    window.location.reload();
  }, 3000);
  
})();
