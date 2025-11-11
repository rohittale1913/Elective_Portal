/**
 * LOCAL DEVELOPMENT SERVER
 * 
 * This server replicates the Vercel serverless function for local development.
 * It provides the same API endpoints with proper CORS and error handling.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// ================================
// DATABASE CONNECTION
// ================================

mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-system', 
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((error) => {
  console.error('❌ Database connection error:', error);
});

// ================================
// DATABASE SCHEMAS & MODELS
// ================================

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  rollNumber: String,
  studentId: String,
  department: String,
  semester: Number,
  role: { 
    type: String, 
    enum: ['admin', 'student'], 
    default: 'student' 
  },
  profile: {
    year: Number,
    cgpa: Number,
    track: String,
    interests: [String]
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const electiveSchema = new mongoose.Schema({
  name: String,
  code: String,
  department: String,
  semester: Number,
  credits: Number,
  description: String,
  instructor: String,
  maxStudents: Number,
  track: String,
  electiveCategory: String,
  image: String,
  deadline: Date,
  schedule: {
    day: String,
    time: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Elective = mongoose.models.Elective || mongoose.model('Elective', electiveSchema);

// ================================
// AUTHENTICATION MIDDLEWARE
// ================================

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ================================
// API ROUTES
// ================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Local development server is running',
    timestamp: new Date().toISOString()
  });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department, semester } = req.body;

    console.log('📝 Registration attempt:', { email, role, rollNumber });

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (role === 'student' && (!rollNumber || !department || !semester)) {
      return res.status(400).json({ 
        error: 'Roll number, department, and semester are required for students' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    if (role === 'student') {
      const existingRollNumber = await User.findOne({ rollNumber });
      if (existingRollNumber) {
        return res.status(400).json({ error: 'Roll number already exists' });
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      rollNumber: role === 'student' ? rollNumber : undefined,
      department: role === 'student' ? department : undefined,
      semester: role === 'student' ? semester : undefined
    });

    await newUser.save();
    console.log('✅ User created successfully:', email);

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        rollNumber: newUser.rollNumber,
        department: newUser.department,
        semester: newUser.semester
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('👤 Found user:', { email: user.email, role: user.role });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber,
      department: req.user.department,
      semester: req.user.semester,
      profile: req.user.profile
    }
  });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: user.role,
      department: user.department,
      semester: user.semester,
      registrationDate: user.createdAt,
      profile: user.profile
    }));

    res.json({
      users: formattedUsers,
      totalCount: users.length,
      studentCount: users.filter(u => u.role === 'student').length,
      adminCount: users.filter(u => u.role === 'admin').length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all electives
app.get('/api/electives', async (req, res) => {
  try {
    const electives = await Elective.find({}).sort({ name: 1 });

    const formattedElectives = electives.map(elective => ({
      id: elective._id,
      name: elective.name,
      code: elective.code,
      description: elective.description,
      credits: elective.credits,
      department: elective.department,
      semester: elective.semester,
      instructor: elective.instructor,
      maxStudents: elective.maxStudents,
      track: elective.track,
      electiveCategory: elective.electiveCategory,
      image: elective.image,
      deadline: elective.deadline,
      schedule: elective.schedule,
      createdAt: elective.createdAt
    }));

    res.json({
      electives: formattedElectives,
      totalCount: electives.length
    });
  } catch (error) {
    console.error('Error fetching electives:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/users',
      'GET /api/electives'
    ]
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log(`🚀 Local development server running on http://localhost:${PORT}`);
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💾 Connected to database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-system'}`);
});

module.exports = app;
