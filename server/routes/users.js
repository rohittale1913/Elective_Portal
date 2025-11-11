import express from 'express';
import User from '../models/User.js';
import StudentElective from '../models/StudentElective.js';
import { auth, isAdmin, isStudent } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Manually remove password field from each user
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    // Debug: Log section data for students
    const students = usersWithoutPassword.filter(u => u.role === 'student');
    console.log('\n🔍 [/api/users] Fetching users...');
    console.log(`📊 Total users: ${usersWithoutPassword.length}, Students: ${students.length}`);
    
    if (students.length > 0) {
      console.log('🎓 Sample student data (first 3) WITH SECTION:');
      students.slice(0, 3).forEach(s => {
        console.log(`  - ${s.name}:`);
        console.log(`    · section value: "${s.section}" (type: ${typeof s.section})`);
        console.log(`    · section exists: ${s.hasOwnProperty('section')}`);
        console.log(`    · rollNumber: ${s.rollNumber}`);
        console.log(`    · ALL KEYS:`, Object.keys(s));
      });
      
      const sectionCounts = students.reduce((acc, s) => {
        const section = s.section || 'UNDEFINED';
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 Section distribution:', sectionCounts);
      
      // LOG THE EXACT JSON BEING SENT
      console.log('\n📤 EXACT JSON being sent for first student:');
      console.log(JSON.stringify(students[0], null, 2));
    }

    res.json({ users: usersWithoutPassword });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to see their own profile or admins to see any profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user (admin only or own profile)
router.put('/:id', auth, async (req, res) => {
  try {
    // Only allow users to update their own profile or admins to update any profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, department, semester, section, rollNo, rollNumber, preferences, isNewUser } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (semester) updateData.semester = semester;
    if (section) updateData.section = section;
    if (rollNo) updateData.rollNo = rollNo;
    if (rollNumber) updateData.rollNumber = rollNumber;
    if (preferences) updateData.preferences = preferences;
    if (typeof isNewUser === 'boolean') updateData.isNewUser = isNewUser;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student selections (student only)
router.get('/student/selections', auth, isStudent, async (req, res) => {
  try {
    console.log('📥 Fetching selections for student:', req.user.id);
    
    // Find all selections for this student
    const selections = await StudentElective.find({ 
      studentId: req.user.id 
    })
    .populate('electiveId', 'name code credits track category electiveCategory semester')
    .sort({ semester: 1, selectedAt: 1 });

    console.log('✅ Found', selections.length, 'selections for student:', req.user.id);
    
    res.json({
      success: true,
      selections: selections,
      count: selections.length
    });
  } catch (error) {
    console.error('❌ Get student selections error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
