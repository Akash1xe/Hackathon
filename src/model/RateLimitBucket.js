import mongoose from 'mongoose';

const RateLimitBucketSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }
}, { versionKey: false });

RateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimitBucket || mongoose.model('RateLimitBucket', RateLimitBucketSchema);
