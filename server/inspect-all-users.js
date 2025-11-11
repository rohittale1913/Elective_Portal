import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function inspectAllUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL users without any filter
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('❌ No users found in database!\n');
      await mongoose.disconnect();
      return;
    }

    console.log('👥 All users in database:\n');
    
    for (const user of allUsers) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: "${user.role}" (type: ${typeof user.role})`);
      console.log(`Roll Number: "${user.rollNumber}"`);
      console.log(`Department: "${user.department}"`);
      console.log(`Semester: ${user.semester}`);
      console.log(`Section: "${user.section}" (exists: ${user.hasOwnProperty('section')}, type: ${typeof user.section})`);
      console.log(`Mobile: "${user.mobile}"`);
      console.log(`ID: ${user._id}`);
      console.log('');
    }

    // Group by role
    const byRole = allUsers.reduce((acc, user) => {
      const role = user.role || 'UNDEFINED';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Users by role:');
    console.log(byRole);
    console.log('');

    // Check sections for all users
    const withSection = allUsers.filter(u => u.section && u.section !== '');
    const withoutSection = allUsers.filter(u => !u.section || u.section === '');

    console.log('📊 Section status:');
    console.log(`  - Users WITH section: ${withSection.length}`);
    console.log(`  - Users WITHOUT section: ${withoutSection.length}`);
    console.log('');

    if (withSection.length > 0) {
      const sectionCounts = withSection.reduce((acc, u) => {
        acc[u.section] = (acc[u.section] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 Section distribution (for users with sections):');
      console.log(sectionCounts);
    }

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectAllUsers();
