const mongoose = require('mongoose');

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
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // GeoJSON format for polygon
      default: undefined
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries if you want to find departments by area
DepartmentSchema.index({ "responsibleArea": "2dsphere" });

const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

export default Department;
