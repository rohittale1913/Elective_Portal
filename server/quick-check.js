import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const userSchema = new mongoose.Schema({}, { strict: false }); // Allow any fields
const User = mongoose.model('TempUser', userSchema, 'users'); // Use existing 'users' collection

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function quickCheck() {
  try {
    console.log(`🔌 Connecting to: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Get raw users
    const users = await User.find({ role: 'student' }).limit(5).lean();
    
    console.log(`📊 Found ${users.length} students\n`);
    
    users.forEach((user, i) => {
      console.log(`━━━ Student ${i + 1}: ${user.name} ━━━`);
      console.log(`Section: "${user.section}" (type: ${typeof user.section}, exists: ${user.hasOwnProperty('section')})`);
      console.log(`Roll: ${user.rollNumber}, Dept: ${user.department}`);
      console.log(`All fields: ${Object.keys(user).join(', ')}\n`);
    });

    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickCheck();
