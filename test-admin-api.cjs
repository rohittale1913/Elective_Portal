require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  // Define schemas
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
  });
  
  const selectionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    electiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective' },
    semester: Number,
    track: String,
    category: [String],
    status: String,
    selectedAt: Date,
    createdAt: Date
  });

  const User = mongoose.model('User', userSchema);
  const StudentElectiveSelection = mongoose.model('StudentElectiveSelection', selectionSchema);

  try {
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found');
      process.exit(1);
    }
    
    console.log('👤 Admin user found:', admin.name, admin.email);
    console.log('🆔 Admin ID:', admin._id.toString());
    console.log('');

    // Get all selections (simulating admin API call)
    const selections = await StudentElectiveSelection.find({});
    
    console.log('📊 Total selections found:', selections.length);
    console.log('');

    if (selections.length > 0) {
      console.log('📋 First 10 selections (raw data):');
      selections.slice(0, 10).forEach((sel, idx) => {
        const studentId = sel.studentId?.toString() || 'N/A';
        const electiveId = sel.electiveId?.toString() || 'N/A';
        
        console.log(`  ${idx + 1}. Selection ID: ${sel._id}`);
        console.log(`     Student ID: ${studentId}`);
        console.log(`     Elective ID: ${electiveId}`);
        console.log(`     Semester: ${sel.semester}, Status: ${sel.status || 'N/A'}`);
        console.log('');
      });

      // Group by student ID
      const byStudent = selections.reduce((acc, sel) => {
        const studentId = sel.studentId?.toString() || 'unknown';
        if (!acc[studentId]) {
          acc[studentId] = {
            count: 0,
            semesters: []
          };
        }
        acc[studentId].count++;
        acc[studentId].semesters.push(sel.semester);
        return acc;
      }, {});

      console.log('👥 Students with selection counts:');
      console.log(`Total unique students: ${Object.keys(byStudent).length}`);
      Object.entries(byStudent).slice(0, 15).forEach(([id, data]) => {
        console.log(`  • Student ${id}: ${data.count} selection(s) in semesters ${data.semesters.join(', ')}`);
      });
    }

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
