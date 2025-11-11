require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    department: String,
    semester: Number
  });
  
  const electiveSchema = new mongoose.Schema({
    name: String,
    code: String,
    track: String,
    category: [String],
    semester: Number
  });
  
  const selectionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    electiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective' },
    semester: Number,
    track: String,
    category: [String],
    status: { type: String, default: 'selected' },
    selectedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  });

  const User = mongoose.model('User', userSchema);
  const Elective = mongoose.model('Elective', electiveSchema);
  const StudentElectiveSelection = mongoose.model('StudentElectiveSelection', selectionSchema);

  try {
    // Get current students
    const students = await User.find({ role: 'student' });
    console.log(`📋 Found ${students.length} current students`);
    
    // Get electives
    const electives = await Elective.find({});
    console.log(`📚 Found ${electives.length} electives\n`);

    if (electives.length === 0) {
      console.error('❌ No electives in database! Cannot create selections.');
      process.exit(1);
    }

    // Delete old selections that don't match current students
    const currentStudentIds = students.map(s => s._id);
    const deleteResult = await StudentElectiveSelection.deleteMany({
      studentId: { $nin: currentStudentIds }
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old selections (from deleted students)\n`);

    // Check existing selections for current students
    const existingSelections = await StudentElectiveSelection.find({
      studentId: { $in: currentStudentIds }
    });
    console.log(`✅ Current students have ${existingSelections.length} existing selections\n`);

    if (existingSelections.length > 0) {
      console.log('✅ Students already have selections! No need to create new ones.');
      console.log('\n📊 Sample existing selections:');
      existingSelections.slice(0, 5).forEach((sel, idx) => {
        const student = students.find(s => s._id.toString() === sel.studentId.toString());
        console.log(`  ${idx + 1}. ${student?.name || 'Unknown'} - Semester ${sel.semester}`);
      });
      process.exit(0);
    }

    // Create selections for students who don't have any
    console.log('🎯 Creating elective selections for students...\n');
    
    const newSelections = [];
    let createdCount = 0;

    for (const student of students) {
      // Give each student 1-3 random electives from their semester or nearby
      const numElectives = Math.floor(Math.random() * 3) + 1; // 1-3 electives
      const studentSemester = student.semester || 5;
      
      // Get electives suitable for this semester (±1 semester)
      const suitableElectives = electives.filter(e => 
        !e.semester || Math.abs(e.semester - studentSemester) <= 1
      );

      if (suitableElectives.length === 0) continue;

      // Randomly select electives
      const selectedElectives = [];
      for (let i = 0; i < numElectives && i < suitableElectives.length; i++) {
        const randomIndex = Math.floor(Math.random() * suitableElectives.length);
        const elective = suitableElectives[randomIndex];
        
        // Avoid duplicates
        if (!selectedElectives.find(e => e._id.toString() === elective._id.toString())) {
          selectedElectives.push(elective);
        }
      }

      // Create selections
      for (const elective of selectedElectives) {
        newSelections.push({
          studentId: student._id,
          electiveId: elective._id,
          semester: studentSemester,
          track: elective.track || 'General',
          category: elective.category || ['Departmental'],
          status: 'selected',
          selectedAt: new Date(),
          createdAt: new Date()
        });
        createdCount++;
      }

      console.log(`  ✅ ${student.name}: ${selectedElectives.length} elective(s)`);
    }

    // Insert all selections
    if (newSelections.length > 0) {
      await StudentElectiveSelection.insertMany(newSelections);
      console.log(`\n🎉 Successfully created ${createdCount} elective selections!`);
      console.log(`📊 ${students.length} students now have electives\n`);
      
      // Verify
      const finalCount = await StudentElectiveSelection.countDocuments({});
      console.log(`✅ Total selections in database: ${finalCount}`);
    } else {
      console.log('\n⚠️  No selections created (students may already have them)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
