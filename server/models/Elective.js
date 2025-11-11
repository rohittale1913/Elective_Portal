import mongoose from 'mongoose';

const electiveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  track: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elective'
  }],
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  department: {
    type: String,
    required: true
  },
  // For Open Category electives - which department offers this elective
  offeredBy: {
    type: String,
    required: function() {
      return this.category === 'Open';
    }
  },
  // For Open Category electives - which departments can take this elective
  eligibleDepartments: [{
    type: String,
    required: function() {
      return this.category === 'Open';
    }
  }],
  subjectType: {
    type: String,
    enum: ['Theory', 'Practical', 'Theory+Practical'],
    default: 'Theory'
  },
  category: {
    type: String,
    enum: ['Humanities', 'Departmental', 'Open'],
    required: true
  },
  electiveCategory: {
    type: String,
    enum: ['Core', 'Elective', 'Lab'],
    default: 'Elective'
  },
  infoImage: {
    type: String, // Base64 encoded image or file path
  },
  selectionDeadline: {
    type: Date
  },
  futureOptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elective'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
electiveSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
electiveSchema.index({ semester: 1, department: 1, electiveCategory: 1 });
electiveSchema.index({ track: 1 });
electiveSchema.index({ code: 1 });

export default mongoose.model('Elective', electiveSchema);
