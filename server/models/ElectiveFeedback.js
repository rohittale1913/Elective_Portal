import mongoose from 'mongoose';

const electiveFeedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousElective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elective',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  feedback: {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    wouldRecommend: {
      type: Boolean,
      required: true
    },
    improvements: {
      type: String
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
electiveFeedbackSchema.index({ student: 1, previousElective: 1 });
electiveFeedbackSchema.index({ previousElective: 1 });

export default mongoose.model('ElectiveFeedback', electiveFeedbackSchema);
