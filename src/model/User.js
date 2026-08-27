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
  lastLoginAt: Date
}, { timestamps: true });

UserSchema.index({ role: 1, active: 1 });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

export default UserModel;
