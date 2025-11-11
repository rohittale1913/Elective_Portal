import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function fixMissingSections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all students
    const students = await User.find({ role: 'student' });
    console.log(`📊 Found ${students.length} students\n`);

    console.log('🔍 Checking which students are missing section field...\n');
    
    let missingCount = 0;
    const studentsToUpdate = [];

    for (const student of students) {
      // Check if section field exists in the document
      const hasSection = student.section !== undefined && student.section !== null && student.section !== '';
      
      console.log(`${hasSection ? '✅' : '❌'} ${student.name} (${student.rollNumber})`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Section in DB: "${student.section}" (type: ${typeof student.section}, exists: ${student.hasOwnProperty('section')})`);
      console.log(`   Department: ${student.department}, Semester: ${student.semester}\n`);
      
      if (!hasSection) {
        missingCount++;
        studentsToUpdate.push(student);
      }
    }

    console.log(`\n📈 Summary: ${missingCount} students are missing section field\n`);

    if (missingCount > 0) {
      console.log('🔧 Would you like to assign sections to these students?');
      console.log('   This script will assign sections based on roll numbers:');
      console.log('   - Roll numbers 1-30: Section A');
      console.log('   - Roll numbers 31-60: Section B');
      console.log('   - Roll numbers 61+: Section C\n');

      // Auto-assign sections based on roll number
      let updated = 0;
      
      for (const student of studentsToUpdate) {
        const rollNum = parseInt(student.rollNumber) || 0;
        let assignedSection = 'A'; // Default
        
        if (rollNum >= 1 && rollNum <= 30) {
          assignedSection = 'A';
        } else if (rollNum >= 31 && rollNum <= 60) {
          assignedSection = 'B';
        } else if (rollNum >= 61) {
          assignedSection = 'C';
        }

        console.log(`   Assigning ${student.name} (Roll: ${student.rollNumber}) → Section ${assignedSection}`);
        
        // Update using findByIdAndUpdate to ensure the field is saved
        await User.findByIdAndUpdate(
          student._id,
          { $set: { section: assignedSection } },
          { new: true }
        );
        
        updated++;
      }

      console.log(`\n✅ Updated ${updated} students with section assignments\n`);

      // Verify the updates
      console.log('🔍 Verifying updates...\n');
      const verifyStudents = await User.find({ role: 'student' }).select('-password');
      
      const sectionCounts = verifyStudents.reduce((acc, s) => {
        const section = s.section || 'MISSING';
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Final Section Distribution:');
      console.log(sectionCounts);
      
      console.log('\n✅ All done! Students now have sections assigned.\n');
    } else {
      console.log('✅ All students already have sections assigned!\n');
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMissingSections();
