require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  // Define user schema
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    department: String,
    semester: Number,
    section: String,
    rollNumber: String,
    rollNo: String
  });

  const User = mongoose.model('User', userSchema);

  try {
    // Get all users
    const users = await User.find({});
    console.log('📊 Total users in database:', users.length);
    console.log('');

    // Separate by role
    const students = users.filter(u => u.role === 'student');
    const admins = users.filter(u => u.role === 'admin');
    
    console.log('👥 Students:', students.length);
    console.log('👤 Admins:', admins.length);
    console.log('');

    if (students.length > 0) {
      console.log('📋 First 5 students:');
      students.slice(0, 5).forEach((student, idx) => {
        console.log(`  ${idx + 1}. ${student.name}`);
        console.log(`     ID: ${student._id}`);
        console.log(`     Email: ${student.email}`);
        console.log(`     Department: ${student.department || 'N/A'}`);
        console.log(`     Section: ${student.section || 'N/A'}`);
        console.log(`     Semester: ${student.semester || 'N/A'}`);
        console.log(`     Roll Number: ${student.rollNumber || student.rollNo || 'N/A'}`);
        console.log('');
      });

      // Department distribution
      const deptDist = students.reduce((acc, s) => {
        const dept = s.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});
      console.log('🏢 Department distribution:');
      Object.entries(deptDist).forEach(([dept, count]) => {
        console.log(`  ${dept}: ${count}`);
      });
      console.log('');

      // Section distribution
      const secDist = students.reduce((acc, s) => {
        const sec = s.section || 'null/undefined';
        acc[sec] = (acc[sec] || 0) + 1;
        return acc;
      }, {});
      console.log('📝 Section distribution:');
      Object.entries(secDist).forEach(([sec, count]) => {
        console.log(`  ${sec}: ${count}`);
      });
    } else {
      console.log('❌ No students found in database!');
    }

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
