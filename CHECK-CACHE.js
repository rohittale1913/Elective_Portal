// 🚨 PASTE THIS IN BROWSER CONSOLE (F12) 🚨
// This will show you EXACTLY what's cached and causing the problem

console.clear();
console.log('🔍 CHECKING CACHED DATA...\n');

// Check localStorage
console.log('📦 localStorage contents:');
console.log('========================\n');

const keys = Object.keys(localStorage);
console.log(`Total items in localStorage: ${keys.length}\n`);

keys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`🔑 ${key}:`);
  
  if (key === 'students') {
    try {
      const students = JSON.parse(value);
      console.log(`   📊 ${students.length} students cached`);
      console.log(`   First 3 students:`);
      students.slice(0, 3).forEach((s, i) => {
        console.log(`     ${i + 1}. ${s.name}`);
        console.log(`        Section: "${s.section}" ${s.section === 'A' ? '⚠️ DEFAULT VALUE!' : '✅'}`);
      });
      
      // Section distribution
      const dist = students.reduce((acc, s) => {
        acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
        return acc;
      }, {});
      console.log(`   📈 Cached section distribution:`, dist);
      
      if (dist['A'] === students.length) {
        console.log(`   🚨 PROBLEM FOUND: All students have section "A" - this is OLD CACHED DATA!`);
      }
    } catch (e) {
      console.log(`   Value: ${value.substring(0, 100)}...`);
    }
  } else if (key === 'user' || key === 'authToken') {
    console.log(`   ${value ? '✅ Present' : '❌ Missing'}`);
  } else {
    try {
      const parsed = JSON.parse(value);
      console.log(`   ${Array.isArray(parsed) ? `Array (${parsed.length} items)` : typeof parsed}`);
    } catch {
      console.log(`   String (${value.length} chars)`);
    }
  }
  console.log('');
});

console.log('\n🧪 NOW TEST THE API:');
console.log('====================\n');

async function testAPIResponse() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.log('❌ No auth token - please login first!');
    return;
  }
  
  console.log('✅ Auth token found, fetching from API...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const students = data.users.filter(u => u.role === 'student');
    
    console.log(`✅ API returned ${students.length} students\n`);
    console.log('First 3 students from API:');
    students.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name}: Section "${s.section}"`);
    });
    
    const apiDist = students.reduce((acc, s) => {
      acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
      return acc;
    }, {});
    console.log('\n📈 API section distribution:', apiDist);
    
    // Compare with cached data
    const cachedStudents = localStorage.getItem('students');
    if (cachedStudents) {
      const cached = JSON.parse(cachedStudents);
      const cachedDist = cached.reduce((acc, s) => {
        acc[s.section || 'undefined'] = (acc[s.section || 'undefined'] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Cached section distribution:', cachedDist);
      
      if (JSON.stringify(apiDist) !== JSON.stringify(cachedDist)) {
        console.log('\n🚨 MISMATCH DETECTED!');
        console.log('   API has correct data but localStorage has OLD data!');
        console.log('\n✅ SOLUTION:');
        console.log('   localStorage.clear();');
        console.log('   Then refresh the page (Ctrl+Shift+R)');
      } else {
        console.log('\n✅ Cached data matches API data');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the test
testAPIResponse();

console.log('\n💡 TO FIX:');
console.log('   1. Run: localStorage.clear()');
console.log('   2. Press Ctrl+Shift+R (hard refresh)');
console.log('   3. Click "Refresh" button in admin panel');
