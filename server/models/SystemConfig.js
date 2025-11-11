import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  // There should only be one config document
  configId: {
    type: String,
    default: 'main',
    unique: true
  },
  departments: [{
    type: String
  }],
  sections: [{
    type: String
  }],
  semesters: [{
    type: Number
  }],
  electiveCategories: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
systemConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('SystemConfig', systemConfigSchema);
