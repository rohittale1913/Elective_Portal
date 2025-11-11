import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  rollNumber: {
    type: String,
    required: function() { return this.role === 'student'; },
    unique: true,
    sparse: true // Allow multiple null values for admin users
  },
  rollNo: { // Alternative field name for rollNumber
    type: String,
    sparse: true
  },
  mobile: {
    type: String,
    sparse: true
  },
  section: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  department: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  semester: {
    type: Number,
    required: function() { return this.role === 'student'; },
    min: 1,
    max: 8
  },
  isNewUser: {
    type: Boolean,
    default: true
  },
  preferences: {
    interests: [String],
    careerGoals: String,
    difficulty: {
      type: String,
      enum: ['easy', 'balanced', 'challenging'],
      default: 'balanced'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
