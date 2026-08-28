import mongoose from 'mongoose';

const PublicAssetSchema = new mongoose.Schema({
  assetCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['streetlight', 'road', 'water', 'waste', 'park', 'public_property', 'other'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String, required: true, trim: true }
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  installedAt: Date,
  lastRepairedAt: Date,
  status: { type: String, enum: ['active', 'maintenance', 'retired'], default: 'active' },
  metadata: { type: Map, of: String }
}, { timestamps: true });

PublicAssetSchema.index({ location: '2dsphere' });
PublicAssetSchema.index({ type: 1, status: 1 });

export default mongoose.models.PublicAsset || mongoose.model('PublicAsset', PublicAssetSchema);
