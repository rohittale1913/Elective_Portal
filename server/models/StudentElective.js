import mongoose from 'mongoose';

const studentElectiveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  elective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elective',
    required: true
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
  status: {
    type: String,
    enum: ['selected', 'completed', 'dropped'],
    default: 'selected'
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  selectedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Ensure a student can't select the same elective twice
studentElectiveSchema.index({ student: 1, elective: 1 }, { unique: true });

// Index for better query performance
studentElectiveSchema.index({ student: 1, semester: 1 });
studentElectiveSchema.index({ elective: 1 });

export default mongoose.model('StudentElective', studentElectiveSchema);
