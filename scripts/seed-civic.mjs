import mongoose from 'mongoose';
import Department from '../src/model/Department.js';
import PublicAsset from '../src/model/PublicAsset.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samvid';

const departmentSeeds = [
  {
    name: 'Roads & Transport',
    description: 'Road surface, pothole, footpath, and traffic-infrastructure maintenance.',
    categories: ['pothole'],
    contactEmail: 'roads@samvid.local'
  },
  {
    name: 'Electrical & Public Works',
    description: 'Streetlights and public-property maintenance.',
    categories: ['streetlight', 'graffiti', 'other'],
    contactEmail: 'publicworks@samvid.local'
  },
  {
    name: 'Sanitation Services',
    description: 'Waste collection, dumping, and neighborhood sanitation.',
    categories: ['trash'],
    contactEmail: 'sanitation@samvid.local'
  },
  {
    name: 'Water Works',
    description: 'Water supply, leaks, drainage, and related civic assets.',
    categories: ['water_leak'],
    contactEmail: 'water@samvid.local'
  }
];

const assetSeeds = [
  {
    assetCode: 'SL-6287',
    name: 'Streetlight SL-6287',
    type: 'streetlight',
    category: 'streetlight',
    departmentName: 'Electrical & Public Works',
    coordinates: [77.3732, 28.6277],
    address: 'Sector 62 main road, Noida'
  },
  {
    assetCode: 'RD-6201',
    name: 'Road segment RD-6201',
    type: 'road',
    category: 'pothole',
    departmentName: 'Roads & Transport',
    coordinates: [77.3708, 28.6258],
    address: 'Fortis crossing, Sector 62, Noida'
  },
  {
    assetCode: 'WP-6210',
    name: 'Water point WP-6210',
    type: 'water',
    category: 'water_leak',
    departmentName: 'Water Works',
    coordinates: [77.3761, 28.6301],
    address: 'Electronic City metro approach, Noida'
  },
  {
    assetCode: 'WS-6204',
    name: 'Waste collection point WS-6204',
    type: 'waste',
    category: 'trash',
    departmentName: 'Sanitation Services',
    coordinates: [77.3687, 28.6292],
    address: 'Sector 62 community market, Noida'
  }
];

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8_000 });
  const departments = new Map();

  for (const seed of departmentSeeds) {
    const department = await Department.findOneAndUpdate(
      { name: seed.name },
      { $set: { ...seed, active: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    departments.set(department.name, department);
  }

  for (const seed of assetSeeds) {
    const department = departments.get(seed.departmentName);
    await PublicAsset.findOneAndUpdate(
      { assetCode: seed.assetCode },
      {
        $set: {
          name: seed.name,
          type: seed.type,
          location: { type: 'Point', coordinates: seed.coordinates, address: seed.address },
          department: department?._id,
          status: 'active',
          metadata: { defaultCategory: seed.category }
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${departmentSeeds.length} departments and ${assetSeeds.length} public assets.`);
} finally {
  await mongoose.disconnect();
}
