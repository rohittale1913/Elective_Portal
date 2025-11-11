import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from './models/User.js';
import Elective from './models/Elective.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Elective.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@college.edu',
      password: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Created admin user: admin@college.edu / admin123');

    // Create student user
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = new User({
      name: 'John Doe',
      email: 'student@college.edu',
      password: studentPassword,
      rollNumber: '2021CS001',
      role: 'student',
      department: 'Computer Science',
      semester: 5
    });
    await student.save();
    console.log('Created student user: student@college.edu / student123 (Roll: 2021CS001)');

    // No hardcoded electives - admins will create them through the interface
    console.log('Database setup complete - no hardcoded electives created.');
    console.log('Database seeded successfully!');
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin: admin@college.edu / admin123');
    console.log('Student: student@college.edu / student123');
    console.log('========================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
};

runSeed();
