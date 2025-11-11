// Quick test script to check if there are student elective selections in the database
require('dotenv').config();
const mongoose = require('mongoose');

const StudentElectiveSelectionSchema = new mongoose.Schema({
  studentId: String,
  electiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective' },
  semester: Number,
  track: String,
  selectedAt: Date,
  status: String
});

const StudentElectiveSelection = mongoose.model('StudentElectiveSelection', StudentElectiveSelectionSchema);

async function checkSelections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const count = await StudentElectiveSelection.countDocuments();
    console.log(`\n📊 Total student elective selections in database: ${count}`);
    
    if (count > 0) {
      const sample = await StudentElectiveSelection.find().limit(5);
      console.log('\n📋 Sample selections:');
      sample.forEach((sel, index) => {
        console.log(`  ${index + 1}. Student: ${sel.studentId}, Elective: ${sel.electiveId}, Semester: ${sel.semester}`);
      });
    } else {
      console.log('\n⚠️  NO STUDENT ELECTIVE SELECTIONS FOUND IN DATABASE!');
      console.log('   This is why "Electives Completed: 0" is showing.');
      console.log('   Students need to select electives first.');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSelections();
