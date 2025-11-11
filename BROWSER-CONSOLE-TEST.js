// PASTE THIS IN YOUR BROWSER CONSOLE (F12)
// This will test if the API is returning sections

(async () => {
    try {
        // Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' })
        });
        const { token } = await loginRes.json();
        console.log('✅ Logged in');
        
        // Get users
        const usersRes = await fetch('http://localhost:5000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const { users } = await usersRes.json();
        
        const students = users.filter(u => u.role === 'student');
        const withSection = students.filter(s => s.section);
        
        console.log(`\n📊 RESULTS:`);
        console.log(`Total Students: ${students.length}`);
        console.log(`WITH Section: ${withSection.length}`);
        console.log(`WITHOUT Section: ${students.length - withSection.length}`);
        
        console.log(`\n📈 Section Distribution:`);
        const dist = students.reduce((acc, s) => {
            const sec = s.section || 'MISSING';
            acc[sec] = (acc[sec] || 0) + 1;
            return acc;
        }, {});
        console.table(dist);
        
        console.log(`\n👥 Sample Students:`);
        students.slice(0, 5).forEach(s => {
            console.log(`${s.name} (${s.rollNumber}): Section "${s.section}"`);
        });
        
        if (withSection.length > 0) {
            console.log(`\n✅✅✅ SUCCESS! Sections are being returned by API!`);
            console.log(`Now refresh your admin panel with Ctrl+Shift+R`);
        } else {
            console.log(`\n❌ PROBLEM: API is NOT returning sections!`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
