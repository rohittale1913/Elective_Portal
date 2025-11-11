import('dotenv').then(dotenv => dotenv.config());
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-system';

async function cleanupUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define User model
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Get all users
    const allUsers = await User.find({}).lean();
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    // Separate admins and students
    const admins = allUsers.filter(u => u.role === 'admin');
    const students = allUsers.filter(u => u.role === 'student');

    console.log(`👥 Breakdown:`);
    console.log(`   - Admins: ${admins.length}`);
    console.log(`   - Students: ${students.length}\n`);

    if (students.length === 0) {
      console.log('✅ No students to delete. Database is already clean!');
      await mongoose.disconnect();
      return;
    }

    // Show which students will be deleted
    console.log('🗑️  Students to be deleted:');
    students.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.email}) - Section: ${student.section || 'N/A'}`);
    });

    console.log('\n⚠️  WARNING: This will delete all student users!');
    console.log('⚠️  Admin accounts will be preserved.\n');

    // In a script, we'll just proceed
    // Delete all students
    const result = await User.deleteMany({ role: 'student' });
    console.log(`✅ Deleted ${result.deletedCount} student accounts\n`);

    // Also clean up StudentElective records
    const StudentElective = mongoose.model('StudentElective', new mongoose.Schema({}, { strict: false }));
    const selectionsResult = await StudentElective.deleteMany({});
    console.log(`✅ Deleted ${selectionsResult.deletedCount} student elective selections\n`);

    // Show remaining users
    const remainingUsers = await User.find({}).lean();
    console.log('📊 Remaining users in database:');
    remainingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\n✅ Cleanup complete! You can now register new students with section fields.');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupUsers();
