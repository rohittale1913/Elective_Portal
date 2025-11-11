import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from './models/User.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const checkStudentSections = async () => {
  try {
    await connectDB();

    // Get all students
    const allStudents = await User.find({ role: 'student' })
      .select('name email rollNumber department semester section')
      .sort({ department: 1, rollNumber: 1 });

    console.log('\n📊 Student Section Report:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Students: ${allStudents.length}\n`);

    if (allStudents.length === 0) {
      console.log('⚠️  No students found in database.');
    } else {
      console.log('Student Details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      allStudents.forEach((student, index) => {
        const section = student.section || '❌ NOT ASSIGNED';
        const roll = student.rollNumber || 'N/A';
        console.log(`${index + 1}. ${student.name.padEnd(25)} | Roll: ${String(roll).padEnd(10)} | Dept: ${(student.department || 'N/A').padEnd(30)} | Sem: ${student.semester || 'N/A'} | Section: ${section}`);
      });

      // Section statistics
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Section Distribution:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const sectionStats = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$section', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      sectionStats.forEach(stat => {
        const sectionName = stat._id || '❌ NOT ASSIGNED';
        console.log(`Section ${String(sectionName).padEnd(15)}: ${stat.count} student(s)`);
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Check for students without sections
      const withoutSection = allStudents.filter(s => !s.section);
      if (withoutSection.length > 0) {
        console.log('⚠️  Students without sections:');
        withoutSection.forEach(s => {
          console.log(`   - ${s.name} (${s.email})`);
        });
        console.log(`\n💡 Run 'node update-student-sections.js' to assign sections to these students.\n`);
      } else {
        console.log('✅ All students have sections assigned!\n');
      }
    }

  } catch (error) {
    console.error('❌ Error checking sections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the check
checkStudentSections();
