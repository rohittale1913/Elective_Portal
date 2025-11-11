import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import User model
import User from './server/models/User.js';

async function testSectionField() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch users with role student
    console.log('📡 Fetching students from database...\n');
    const users = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Total students found: ${users.length}\n`);

    // Check section field for each student
    console.log('🔍 Section field analysis:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Section VALUE: "${user.section}"`);
      console.log(`   Section TYPE: ${typeof user.section}`);
      console.log(`   Section EXISTS: ${user.hasOwnProperty('section')}`);
      console.log(`   Section in object: ${'section' in user}`);
      console.log(`   All keys:`, Object.keys(user));
      console.log('');
    });

    // Section distribution
    const sectionCounts = users.reduce((acc, u) => {
      const section = u.section || 'UNDEFINED';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Section distribution:');
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`   ${section}: ${count}`);
    });

    // Now test what happens when we remove password
    console.log('\n\n🧪 Testing password removal (like API does):\n');
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    
    console.log('First user after password removal:');
    console.log(`   Section VALUE: "${usersWithoutPassword[0].section}"`);
    console.log(`   Section TYPE: ${typeof usersWithoutPassword[0].section}`);
    console.log(`   Section EXISTS: ${usersWithoutPassword[0].hasOwnProperty('section')}`);
    console.log(`   All keys:`, Object.keys(usersWithoutPassword[0]));

    // JSON stringify test
    console.log('\n\n🧪 Testing JSON.stringify (like res.json() does):\n');
    const jsonString = JSON.stringify({ users: usersWithoutPassword });
    const parsed = JSON.parse(jsonString);
    
    console.log('First student after JSON round-trip:');
    console.log(`   Section VALUE: "${parsed.users[0].section}"`);
    console.log(`   Section TYPE: ${typeof parsed.users[0].section}`);
    console.log(`   Section EXISTS: ${parsed.users[0].hasOwnProperty('section')}`);

    console.log('\n\n📄 RAW JSON (first student):');
    console.log(JSON.stringify(parsed.users[0], null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSectionField();
