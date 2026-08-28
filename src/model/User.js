import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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
    select: false
  },
  role: {
    type: String,
    enum: ['citizen', 'admin'],
    default: 'citizen'
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: String,
  active: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date,
  reputation: {
    score: { type: Number, default: 0, min: 0 },
    tier: { type: String, enum: ['newcomer', 'contributor', 'trusted', 'civic_champion'], default: 'newcomer' },
    validReports: { type: Number, default: 0 },
    invalidReports: { type: Number, default: 0 },
    resolvedReports: { type: Number, default: 0 },
    communityValidations: { type: Number, default: 0 },
    usefulConfirmations: { type: Number, default: 0 }
  }
}, { timestamps: true });

UserSchema.index({ role: 1, active: 1 });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

export default UserModel;
