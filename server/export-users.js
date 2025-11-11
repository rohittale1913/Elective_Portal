const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Elective = require('./models/Elective');
const StudentElective = require('./models/StudentElective');

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

const exportUserData = async () => {
  try {
    console.log('=== ELECTIVE SELECTION SYSTEM - USER DATA EXPORT ===\n');

    // Get all users
    const users = await User.find({}).select('-password');
    console.log(`📊 Total Users: ${users.length}`);
    console.log('👥 USERS:');
    console.log('─'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      if (user.department) console.log(`   🏢 Department: ${user.department}`);
      if (user.semester) console.log(`   📅 Semester: ${user.semester}`);
      console.log(`   🆔 ID: ${user._id}`);
      console.log(`   📝 Created: ${user.createdAt?.toLocaleDateString() || 'N/A'}`);
      console.log(`   🆕 New User: ${user.isNewUser ? 'Yes' : 'No'}`);
      if (user.preferences && user.preferences.interests?.length > 0) {
        console.log(`   🎯 Interests: ${user.preferences.interests.join(', ')}`);
      }
      console.log('');
    });

    // Get all electives
    const electives = await Elective.find({});
    console.log(`📚 Total Electives: ${electives.length}`);
    console.log('📖 ELECTIVES:');
    console.log('─'.repeat(80));
    
    electives.forEach((elective, index) => {
      console.log(`${index + 1}. ${elective.name} (${elective.code})`);
      console.log(`   📝 Description: ${elective.description}`);
      console.log(`   🏢 Department: ${elective.department}`);
      console.log(`   📅 Semester: ${elective.semester}`);
      console.log(`   🎯 Track: ${elective.track}`);
      console.log(`   📚 Category: ${elective.category} - ${elective.electiveCategory}`);
      console.log(`   ⭐ Credits: ${elective.credits}`);
      if (elective.image) console.log(`   🖼️ Has Image: Yes`);
      if (elective.selectionDeadline) {
        console.log(`   ⏰ Selection Deadline: ${new Date(elective.selectionDeadline).toLocaleDateString()}`);
      }
      console.log(`   🆔 ID: ${elective._id}`);
      console.log('');
    });

    // Get all student selections
    const selections = await StudentElective.find({}).populate('studentId', 'name email').populate('electiveId', 'name code');
    console.log(`🎯 Total Selections: ${selections.length}`);
    if (selections.length > 0) {
      console.log('📝 STUDENT SELECTIONS:');
      console.log('─'.repeat(80));
      
      selections.forEach((selection, index) => {
        const studentName = selection.studentId?.name || 'Unknown Student';
        const electiveName = selection.electiveId?.name || 'Unknown Elective';
        const electiveCode = selection.electiveId?.code || 'N/A';
        
        console.log(`${index + 1}. ${studentName} → ${electiveName} (${electiveCode})`);
        console.log(`   📅 Semester: ${selection.semester}`);
        console.log(`   📊 Status: ${selection.status}`);
        console.log(`   📝 Selected At: ${selection.createdAt?.toLocaleDateString() || 'N/A'}`);
        console.log(`   🆔 Selection ID: ${selection._id}`);
        console.log('');
      });
    }

    // Summary statistics
    console.log('📊 SUMMARY STATISTICS:');
    console.log('─'.repeat(80));
    
    const adminCount = users.filter(u => u.role === 'admin').length;
    const studentCount = users.filter(u => u.role === 'student').length;
    const departmentGroups = {};
    const semesterGroups = {};
    
    users.forEach(user => {
      if (user.department) {
        departmentGroups[user.department] = (departmentGroups[user.department] || 0) + 1;
      }
      if (user.semester) {
        semesterGroups[user.semester] = (semesterGroups[user.semester] || 0) + 1;
      }
    });

    console.log(`👑 Admins: ${adminCount}`);
    console.log(`🎓 Students: ${studentCount}`);
    console.log(`📚 Electives: ${electives.length}`);
    console.log(`🎯 Active Selections: ${selections.length}`);
    
    console.log('\n🏢 USERS BY DEPARTMENT:');
    Object.entries(departmentGroups).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count} users`);
    });
    
    console.log('\n📅 USERS BY SEMESTER:');
    Object.entries(semesterGroups).forEach(([sem, count]) => {
      console.log(`   Semester ${sem}: ${count} students`);
    });

    const electivesByCategory = {};
    electives.forEach(elective => {
      const category = elective.electiveCategory;
      electivesByCategory[category] = (electivesByCategory[category] || 0) + 1;
    });
    
    console.log('\n📖 ELECTIVES BY CATEGORY:');
    Object.entries(electivesByCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} electives`);
    });

    // Selection statistics
    const selectionsByStatus = {};
    selections.forEach(selection => {
      selectionsByStatus[selection.status] = (selectionsByStatus[selection.status] || 0) + 1;
    });
    
    if (Object.keys(selectionsByStatus).length > 0) {
      console.log('\n🎯 SELECTIONS BY STATUS:');
      Object.entries(selectionsByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} selections`);
      });
    }

    // Export to JSON files
    const userData = {
      users: users.map(u => u.toObject()),
      electives: electives.map(e => e.toObject()),
      selections: selections.map(s => s.toObject()),
      summary: {
        totalUsers: users.length,
        adminCount,
        studentCount,
        totalElectives: electives.length,
        totalSelections: selections.length,
        departmentGroups,
        semesterGroups,
        electivesByCategory,
        selectionsByStatus,
        exportDate: new Date().toISOString()
      }
    };

    // Write to file
    const fs = require('fs');
    const path = require('path');
    
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user-data-export-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(userData, null, 2));
    
    console.log(`\n💾 Data exported to: ${filepath}`);
    console.log('\n✅ Export completed successfully!');

  } catch (error) {
    console.error('❌ Error exporting user data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

const runExport = async () => {
  await connectDB();
  await exportUserData();
};

runExport();
