import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  referenceId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
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
      required: true,
      trim: true
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
    comment: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  adminComment: {
    type: String,
    trim: true
  },
  resolutionNote: {
    type: String,
    trim: true
  },
  resolvedAt: Date,
  deletedAt: Date
}, { timestamps: true });

ReportSchema.pre('validate', function setReferenceId(next) {
  if (!this.referenceId) {
    const date = new Date();
    const year = String(date.getUTCFullYear()).slice(-2);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.referenceId = `SAM-${year}-${random}`;
  }
  next();
});

// Create a geospatial index for location-based queries
ReportSchema.index({ location: '2dsphere' });
ReportSchema.index({ submittedBy: 1, createdAt: -1 });
ReportSchema.index({ status: 1, category: 1, createdAt: -1 });
ReportSchema.index({ title: 'text', description: 'text', 'location.address': 'text' });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export default Report;
