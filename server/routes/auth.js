import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, semester, rollNumber, rollNo, section, mobile, registrationNumber } = req.body;

    console.log('📝 Registration attempt:', { 
      email, 
      role, 
      rollNumber, 
      rollNo, 
      department, 
      semester,
      section,
      mobile,
      registrationNumber
    });

    // Use rollNumber if provided, otherwise fallback to rollNo or registrationNumber
    const finalRollNumber = rollNumber || rollNo || registrationNumber;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (role === 'student' && (!finalRollNumber || !department || !semester)) {
      return res.status(400).json({ 
        message: 'Roll number, department, and semester are required for students' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'Email or registration number already exists' });
    }

    // Check if roll number already exists for students
    if (role === 'student' && finalRollNumber) {
      const existingRollNumber = await User.findOne({ rollNumber: finalRollNumber });
      if (existingRollNumber) {
        console.log('❌ Roll number already exists:', finalRollNumber);
        return res.status(400).json({ message: 'Email or registration number already exists' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      rollNumber: role === 'student' ? finalRollNumber : undefined,
      department: role === 'student' ? department : undefined,
      semester: role === 'student' ? semester : undefined,
      section: role === 'student' ? section : undefined,
      mobile: mobile || undefined
    });

    await user.save();
    console.log('✅ User created successfully:', { email, rollNumber: finalRollNumber });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        section: user.section,
        mobile: user.mobile,
        rollNumber: user.rollNumber,
        isNewUser: user.isNewUser
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        section: user.section,
        mobile: user.mobile,
        rollNumber: user.rollNumber,
        isNewUser: user.isNewUser,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        section: user.section,
        mobile: user.mobile,
        rollNumber: user.rollNumber,
        isNewUser: user.isNewUser,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, department, semester, preferences, isNewUser, rollNo, rollNumber, section, email, mobile } = req.body;
    
    console.log('Profile update request:', { name, department, semester, rollNo, rollNumber, section, email, mobile });
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (semester) updateData.semester = semester;
    if (section) updateData.section = section;
    if (rollNo) updateData.rollNo = rollNo;
    if (rollNumber) updateData.rollNumber = rollNumber;
    if (mobile) updateData.mobile = mobile;
    if (preferences) updateData.preferences = preferences;
    if (typeof isNewUser === 'boolean') updateData.isNewUser = isNewUser;

    console.log('Update data prepared:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated successfully:', user.email);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        section: user.section,
        rollNo: user.rollNo,
        rollNumber: user.rollNumber,
        mobile: user.mobile,
        isNewUser: user.isNewUser,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      type: error.name 
    });
  }
});

export default router;
