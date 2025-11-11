import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import User from './models/User.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const diagnoseSection = async () => {
  try {
    await connectDB();

    // Get Sahil's record from database
    const sahil = await User.findOne({ email: 'sahil@gmail.com' });
    
    if (!sahil) {
      console.log('❌ User sahil@gmail.com not found in database');
      return;
    }

    console.log('🔍 DATABASE RECORD FOR: Sahil (sahil@gmail.com)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Raw MongoDB Document:');
    console.log(JSON.stringify(sahil.toObject(), null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check specific fields
    console.log('\n📊 FIELD-BY-FIELD ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name:         ${sahil.name}`);
    console.log(`Email:        ${sahil.email}`);
    console.log(`Roll Number:  ${sahil.rollNumber}`);
    console.log(`Department:   ${sahil.department}`);
    console.log(`Semester:     ${sahil.semester}`);
    console.log(`Section:      ${sahil.section} ${sahil.section ? '✅' : '❌ MISSING'}`);
    console.log(`Mobile:       ${sahil.mobile || 'Not set'}`);
    console.log(`Role:         ${sahil.role}`);
    
    // Check if section field exists in schema
    console.log('\n🔧 SCHEMA FIELD CHECK:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const doc = sahil.toObject();
    console.log(`section field exists: ${doc.hasOwnProperty('section')}`);
    console.log(`section value: "${doc.section}"`);
    console.log(`section type: ${typeof doc.section}`);
    
    // Test what .select('-password') returns
    console.log('\n🧪 TESTING .select("-password") OUTPUT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const sahilWithoutPassword = await User.findOne({ email: 'sahil@gmail.com' }).select('-password');
    console.log(JSON.stringify(sahilWithoutPassword, null, 2));
    
    console.log('\n✅ Section in .select("-password") result:', sahilWithoutPassword.section);
    
    // Get all students and check section field
    console.log('\n📋 ALL STUDENTS SECTION STATUS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const allStudents = await User.find({ role: 'student' }).select('-password');
    
    allStudents.forEach((student, index) => {
      const sectionStatus = student.section ? `✅ ${student.section}` : '❌ MISSING';
      console.log(`${index + 1}. ${student.name.padEnd(25)} | Roll: ${String(student.rollNumber).padEnd(10)} | Section: ${sectionStatus}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

diagnoseSection();
