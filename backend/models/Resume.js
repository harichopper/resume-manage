const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // References the User collection
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  jobRole: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters'],
  },
  education: [{
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    year: { type: String, trim: true },
  }],
  experience: [{
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    duration: { type: String, trim: true },
  }],
  skills: [{
    type: String,
    trim: true,
  }],
  aiEnhanced: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Resume', ResumeSchema);