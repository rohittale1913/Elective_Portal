import('dotenv').then(dotenv => dotenv.config());
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-system';

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define User model
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      rollNumber: String,
      mobile: String,
      section: String,
      role: { type: String, enum: ['student', 'admin'], default: 'student' },
      department: String,
      semester: Number,
      isNewUser: { type: Boolean, default: true },
      preferences: Object,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema);

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users\n');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@system.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Created admin user:');
    console.log(`   Email: admin@system.com`);
    console.log(`   Password: admin123\n`);

    // Create sample students with sections
    const students = [
      { name: 'Sahil Sukhdeve', email: 'sahil@example.com', rollNumber: '59', section: 'A', department: 'Artificial Intelligence', semester: 5 },
      { name: 'Rohit Tale', email: 'rohit@example.com', rollNumber: '54', section: 'A', department: 'Artificial Intelligence', semester: 5 },
      { name: 'Pratik Parise', email: 'pratik@example.com', rollNumber: '39', section: 'B', department: 'Artificial Intelligence', semester: 3 },
      { name: 'Prajwal Halmare', email: 'prajwal@example.com', rollNumber: '21', section: 'A', department: 'Artificial Intelligence', semester: 4 },
      { name: 'Nakul Badwaik', email: 'nakul@example.com', rollNumber: '17', section: 'C', department: 'Artificial Intelligence', semester: 5 },
      { name: 'Roshan Manekar', email: 'roshan@example.com', rollNumber: '56', section: 'B', department: 'Artificial Intelligence', semester: 6 },
      { name: 'Pranay Ramteke', email: 'pranay@example.com', rollNumber: '35', section: 'B', department: 'Artificial Intelligence', semester: 3 },
      { name: 'Ritesh Gaure', email: 'ritesh@example.com', rollNumber: '51', section: 'B', department: 'Artificial Intelligence', semester: 3 },
      { name: 'Parth Tarange', email: 'parth@example.com', rollNumber: '28', section: 'B', department: 'Artificial Intelligence', semester: 3 },
      { name: 'Pranjay Madave', email: 'pranjay@example.com', rollNumber: '64', section: 'B', department: 'Artificial Intelligence', semester: 3 },
    ];

    const studentPassword = await bcrypt.hash('student123', 10);

    console.log('✅ Creating sample students with sections:\n');

    for (const studentData of students) {
      const student = await User.create({
        ...studentData,
        password: studentPassword,
        mobile: '9876543210',
        role: 'student',
        isNewUser: false,
        preferences: {
          interests: [],
          careerGoals: '',
          difficulty: 'balanced'
        }
      });

      console.log(`   ✓ ${student.name} - Section ${student.section} (${student.department})`);
    }

    // Show statistics
    const allStudents = await User.find({ role: 'student' }).lean();
    const sectionDist = allStudents.reduce((acc, s) => {
      const section = s.section || 'UNDEFINED';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Summary:');
    console.log(`   Total users created: ${await User.countDocuments()}`);
    console.log(`   - Admins: 1`);
    console.log(`   - Students: ${allStudents.length}`);
    console.log(`\n📈 Section distribution:`);
    Object.entries(sectionDist).forEach(([section, count]) => {
      console.log(`   - Section ${section}: ${count} students`);
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@system.com');
    console.log('     Password: admin123');
    console.log('\n   Students (all have same password):');
    console.log('     Password: student123');
    console.log('     Example: sahil@example.com / student123');

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
