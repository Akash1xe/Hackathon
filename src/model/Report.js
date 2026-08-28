import mongoose from 'mongoose';

const REPORT_STATUS_VALUES = ['submitted', 'in_review', 'assigned', 'in_progress', 'resolved', 'citizen_confirmed', 'disputed', 'reopened', 'rejected'];

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
    enum: REPORT_STATUS_VALUES,
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
      enum: REPORT_STATUS_VALUES
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
  evidenceAnalysis: {
    status: { type: String, enum: ['ai_verified', 'needs_review', 'suspicious', 'not_analyzed'], default: 'not_analyzed' },
    score: { type: Number, min: 0, max: 100, default: 0 },
    suggestedCategory: String,
    categoryMatch: Boolean,
    severity: { type: Number, min: 0, max: 100 },
    imageQuality: { type: String, enum: ['good', 'usable', 'poor', 'unknown'], default: 'unknown' },
    labels: [{ label: String, score: Number }],
    model: String,
    analyzedAt: Date
  },
  impactConfirmations: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  communityVerifications: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verdict: { type: String, enum: ['still_exists', 'no_longer_exists', 'incorrect'], required: true },
    distanceMeters: Number,
    createdAt: { type: Date, default: Date.now }
  }],
  risk: {
    score: { type: Number, min: 0, max: 100, default: 35 },
    label: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    factors: {
      aiSeverity: { type: Number, default: 0 },
      citizenImpact: { type: Number, default: 0 },
      reportAge: { type: Number, default: 0 },
      locationSensitivity: { type: Number, default: 0 },
      nearbyReports: { type: Number, default: 0 },
      recurrence: { type: Number, default: 0 }
    },
    calculatedAt: Date,
    overriddenByAdmin: { type: Boolean, default: false }
  },
  routing: {
    suggestedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    confidence: { type: Number, min: 0, max: 100 },
    reason: String,
    autoAssigned: { type: Boolean, default: false }
  },
  sla: {
    targetHours: Number,
    dueAt: Date,
    breachedAt: Date,
    escalatedAt: Date,
    escalationLevel: { type: Number, default: 0 }
  },
  resolutionEvidence: {
    images: [String],
    aiImprovementScore: { type: Number, min: 0, max: 100 },
    beforeProblemScore: { type: Number, min: 0, max: 100 },
    afterRepairScore: { type: Number, min: 0, max: 100 },
    assessment: { type: String, enum: ['likely_resolved', 'needs_review', 'unlikely_resolved'] },
    model: String,
    analyzedAt: Date
  },
  citizenFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    resolved: Boolean,
    comment: String,
    submittedAt: Date
  },
  appeals: [{
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    response: String
  }],
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'PublicAsset' },
  voice: {
    language: String,
    transcript: String
  },
  trust: {
    issueScore: { type: Number, min: 0, max: 100, default: 40 },
    resolutionScore: { type: Number, min: 0, max: 100, default: 0 },
    proofIntegrity: { type: Number, min: 0, max: 100, default: 20 }
  },
  reputationAwards: {
    validReportAt: Date,
    invalidReportAt: Date
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
ReportSchema.index({ 'sla.dueAt': 1, status: 1 });
ReportSchema.index({ asset: 1, createdAt: -1 });
ReportSchema.index({ title: 'text', description: 'text', 'location.address': 'text' });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export default Report;
