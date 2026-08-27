import mongoose from 'mongoose';

const ResponsibleAreaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true
  },
  coordinates: {
    type: [[[Number]]],
    required: true
  }
}, { _id: false });

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  categories: [{
    type: String,
    enum: ['pothole', 'streetlight', 'trash', 'graffiti', 'water_leak', 'other']
  }],
  contactEmail: {
    type: String
  },
  contactPhone: {
    type: String
  },
  supervisors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  responsibleArea: {
    type: ResponsibleAreaSchema,
    default: undefined
  },
  active: {
    type: Boolean,
    default: true
  },
}, { timestamps: true });

// Index for geospatial queries if you want to find departments by area
DepartmentSchema.index({ "responsibleArea": "2dsphere" });
DepartmentSchema.index({ active: 1, categories: 1 });

const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

export default Department;
