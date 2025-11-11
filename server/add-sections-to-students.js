import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define User schema inline to avoid import issues
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  rollNumber: String,
  rollNo: String,
  mobile: String,
  section: String,
  role: String,
  department: String,
  semester: Number,
  isNewUser: Boolean,
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function addSectionsToStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI}\n`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL users
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('❌ No users found! Make sure MongoDB is running and has data.\n');
      await mongoose.disconnect();
      return;
    }

    // Filter students (users with role='student')
    const students = allUsers.filter(u => u.role === 'student');
    console.log(`👥 Students found: ${students.length}\n`);

    if (students.length === 0) {
      console.log('❌ No students found in database!\n');
      await mongoose.disconnect();
      return;
    }

    console.log('🔍 Current section status:\n');
    const withSection = students.filter(s => s.section && s.section !== '');
    const withoutSection = students.filter(s => !s.section || s.section === '');
    
    console.log(`  ✅ Students WITH section: ${withSection.length}`);
    console.log(`  ❌ Students WITHOUT section: ${withoutSection.length}\n`);

    if (withoutSection.length === 0) {
      console.log('✅ All students already have sections!\n');
      await mongoose.disconnect();
      return;
    }

    console.log('🔧 Assigning sections to students without sections...\n');
    console.log('Assignment logic:');
    console.log('  - Roll 1-30 → Section A');
    console.log('  - Roll 31-60 → Section B');
    console.log('  - Roll 61+ → Section C\n');

    let updateCount = 0;
    
    for (const student of withoutSection) {
      const rollNum = parseInt(student.rollNumber) || 0;
      let assignedSection = 'A'; // Default
      
      if (rollNum >= 1 && rollNum <= 30) {
        assignedSection = 'A';
      } else if (rollNum >= 31 && rollNum <= 60) {
        assignedSection = 'B';
      } else if (rollNum >= 61) {
        assignedSection = 'C';
      }

      console.log(`   ${student.name} (Roll: ${student.rollNumber}) → Section ${assignedSection}`);
      
      // Update using updateOne to ensure it saves
      await User.updateOne(
        { _id: student._id },
        { $set: { section: assignedSection, updatedAt: new Date() } }
      );
      
      updateCount++;
    }

    console.log(`\n✅ Updated ${updateCount} students with section assignments\n`);

    // Verify the updates
    console.log('🔍 Verifying updates...\n');
    const updatedStudents = await User.find({ role: 'student' });
    
    const finalWithSection = updatedStudents.filter(s => s.section && s.section !== '');
    const finalWithoutSection = updatedStudents.filter(s => !s.section || s.section === '');
    
    console.log(`  ✅ Students WITH section: ${finalWithSection.length}`);
    console.log(`  ❌ Students WITHOUT section: ${finalWithoutSection.length}\n`);

    // Show section distribution
    const sectionCounts = updatedStudents.reduce((acc, s) => {
      const section = s.section || 'MISSING';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Final Section Distribution:');
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`   Section ${section}: ${count} students`);
    });

    console.log('\n✅ Migration complete! All students now have sections.\n');
    console.log('🔄 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Refresh the admin panel in your browser');
    console.log('   3. Clear browser cache if needed (Ctrl+Shift+Delete)\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addSectionsToStudents();
