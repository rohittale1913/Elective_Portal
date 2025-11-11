import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from './models/User.js';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

const updateStudentSections = async () => {
  try {
    await connectDB();

    // Find all students without a section or with section = null/undefined
    const studentsWithoutSection = await User.find({
      role: 'student',
      $or: [
        { section: { $exists: false } },
        { section: null },
        { section: '' }
      ]
    });

    console.log('\n📊 Database Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total students without section: ${studentsWithoutSection.length}`);
    
    if (studentsWithoutSection.length === 0) {
      console.log('✅ All students already have sections assigned!');
      await mongoose.disconnect();
      rl.close();
      return;
    }

    console.log('\nStudents needing section assignment:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    studentsWithoutSection.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.email}) - Roll: ${student.rollNumber || 'N/A'} - Dept: ${student.department}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Ask user what they want to do
    console.log('Update Options:');
    console.log('1. Assign a default section to ALL students (e.g., "A")');
    console.log('2. Assign sections based on roll number pattern');
    console.log('3. Assign sections based on department');
    console.log('4. Exit without making changes');
    console.log('');

    const choice = await question('Enter your choice (1-4): ');

    if (choice === '1') {
      // Option 1: Default section for all
      const defaultSection = await question('Enter default section (e.g., A, B, C): ');
      
      if (!defaultSection.trim()) {
        console.log('❌ Invalid section. Exiting...');
        await mongoose.disconnect();
        rl.close();
        return;
      }

      const confirm = await question(`\n⚠️  This will assign section "${defaultSection.toUpperCase()}" to ${studentsWithoutSection.length} student(s). Continue? (yes/no): `);
      
      if (confirm.toLowerCase() === 'yes') {
        const result = await User.updateMany(
          {
            role: 'student',
            $or: [
              { section: { $exists: false } },
              { section: null },
              { section: '' }
            ]
          },
          { $set: { section: defaultSection.toUpperCase() } }
        );

        console.log(`\n✅ Updated ${result.modifiedCount} student(s) with section "${defaultSection.toUpperCase()}"`);
      } else {
        console.log('❌ Update cancelled.');
      }

    } else if (choice === '2') {
      // Option 2: Section based on roll number
      console.log('\nAssigning sections based on roll number ranges...');
      const sectionA = await question('Enter roll number range for Section A (e.g., 1-20): ');
      const sectionB = await question('Enter roll number range for Section B (e.g., 21-40): ');
      const defaultForRest = await question('Enter default section for remaining students (e.g., C): ');

      // Parse ranges
      const parseRange = (range) => {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        return { start, end };
      };

      const rangeA = parseRange(sectionA);
      const rangeB = parseRange(sectionB);

      let updatedCount = 0;

      for (const student of studentsWithoutSection) {
        const rollNum = student.rollNumber ? parseInt(student.rollNumber.replace(/\D/g, '')) : null;
        let assignedSection = defaultForRest.toUpperCase();

        if (rollNum) {
          if (rollNum >= rangeA.start && rollNum <= rangeA.end) {
            assignedSection = 'A';
          } else if (rollNum >= rangeB.start && rollNum <= rangeB.end) {
            assignedSection = 'B';
          }
        }

        await User.updateOne(
          { _id: student._id },
          { $set: { section: assignedSection } }
        );
        console.log(`✅ Updated ${student.name} (Roll: ${student.rollNumber}) → Section ${assignedSection}`);
        updatedCount++;
      }

      console.log(`\n✅ Updated ${updatedCount} student(s) based on roll number ranges`);

    } else if (choice === '3') {
      // Option 3: Section based on department
      console.log('\nAssigning sections based on department...');
      
      // Get unique departments
      const departments = [...new Set(studentsWithoutSection.map(s => s.department))];
      console.log(`\nDepartments found: ${departments.join(', ')}`);

      const deptSections = {};
      for (const dept of departments) {
        const section = await question(`Enter section for ${dept} students: `);
        deptSections[dept] = section.toUpperCase();
      }

      let updatedCount = 0;

      for (const student of studentsWithoutSection) {
        const section = deptSections[student.department] || 'A';
        
        await User.updateOne(
          { _id: student._id },
          { $set: { section } }
        );
        console.log(`✅ Updated ${student.name} (${student.department}) → Section ${section}`);
        updatedCount++;
      }

      console.log(`\n✅ Updated ${updatedCount} student(s) based on departments`);

    } else {
      console.log('❌ Update cancelled. No changes made.');
    }

    // Show final statistics
    console.log('\n📊 Final Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const sectionStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    sectionStats.forEach(stat => {
      const sectionName = stat._id || 'Not Assigned';
      console.log(`Section ${sectionName}: ${stat.count} student(s)`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error updating sections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    rl.close();
  }
};

// Run the update
updateStudentSections();
