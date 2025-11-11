// Direct MongoDB query to see exact data
require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const students = await User.find({ role: 'student' }).lean();
    
    console.log(`📊 Total students: ${students.length}\n`);
    console.log('=== STUDENTS WITH SECTIONS ===\n');
    
    students.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   section value: "${s.section}"`);
      console.log(`   section type: ${typeof s.section}`);
      console.log(`   _id: ${s._id}`);
      console.log('');
    });
    
    const sectionDist = students.reduce((acc, s) => {
      const section = s.section || 'NO_SECTION';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Section Distribution:');
    console.log(sectionDist);
    console.log('');
    
    console.log('=== FIRST STUDENT RAW JSON ===');
    console.log(JSON.stringify(students[0], null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
