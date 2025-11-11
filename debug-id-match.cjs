require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
  });
  
  const selectionSchema = new mongoose.Schema({
    studentId: mongoose.Schema.Types.ObjectId,
    electiveId: mongoose.Schema.Types.ObjectId,
    semester: Number,
    status: String
  });

  const User = mongoose.model('User', userSchema);
  const StudentElectiveSelection = mongoose.model('StudentElectiveSelection', selectionSchema);

  try {
    // Get first 5 students
    const students = await User.find({ role: 'student' }).limit(5);
    console.log('📋 First 5 Students:');
    students.forEach((s, idx) => {
      console.log(`  ${idx + 1}. ${s.name}`);
      console.log(`     ID: ${s._id.toString()}`);
      console.log(`     ID Type: ${typeof s._id}`);
    });
    console.log('');

    // Get first 5 selections
    const selections = await StudentElectiveSelection.find({}).limit(5);
    console.log('📊 First 5 Elective Selections:');
    selections.forEach((sel, idx) => {
      console.log(`  ${idx + 1}. Selection ID: ${sel._id}`);
      console.log(`     Student ID: ${sel.studentId.toString()}`);
      console.log(`     Student ID Type: ${typeof sel.studentId}`);
      console.log(`     Semester: ${sel.semester}`);
    });
    console.log('');

    // Check if any student IDs match
    console.log('🔍 Checking ID Matches:');
    let matchCount = 0;
    const studentIds = students.map(s => s._id.toString());
    const selectionStudentIds = selections.map(sel => sel.studentId.toString());
    
    console.log('Student IDs:', studentIds);
    console.log('Selection Student IDs:', selectionStudentIds);
    console.log('');

    studentIds.forEach(studentId => {
      const hasSelections = selectionStudentIds.includes(studentId);
      const student = students.find(s => s._id.toString() === studentId);
      console.log(`${student.name} (${studentId}): ${hasSelections ? '✅ HAS selections' : '❌ NO selections'}`);
      if (hasSelections) matchCount++;
    });

    console.log('');
    console.log(`📊 Match Summary: ${matchCount} out of ${students.length} students have selections`);

    // Now check what frontend will receive
    console.log('\n📡 Simulating Frontend API Response:');
    const apiSelections = await StudentElectiveSelection.find({}).limit(10);
    
    console.log('First 3 selections as API would return:');
    apiSelections.slice(0, 3).forEach((sel, idx) => {
      console.log(`  ${idx + 1}.`);
      console.log(`     _id: "${sel._id.toString()}"`);
      console.log(`     studentId: "${sel.studentId.toString()}"`);
      console.log(`     electiveId: "${sel.electiveId.toString()}"`);
      console.log(`     Type check: studentId is ${typeof sel.studentId}`);
      console.log(`     After .toString(): ${typeof sel.studentId.toString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
