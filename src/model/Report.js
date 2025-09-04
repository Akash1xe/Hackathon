const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['pothole', 'streetlight', 'trash', 'graffiti', 'water_leak', 'other']
  },
  status: {
    type: String,
    enum: ['submitted', 'in_review', 'assigned', 'in_progress', 'resolved', 'rejected'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  images: [{
    type: String // URLs to uploaded images
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    assignedAt: Date
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['submitted', 'in_review', 'assigned', 'in_progress', 'resolved', 'rejected']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a geospatial index for location-based queries
ReportSchema.index({ "location.coordinates": "2dsphere" });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export default Report;
