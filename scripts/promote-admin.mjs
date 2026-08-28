import mongoose from 'mongoose';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run admin:promote -- citizen@example.com');
  process.exit(1);
}
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samvid';

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8_000 });
  const result = await mongoose.connection.collection('users').findOneAndUpdate(
    { email },
    { $set: { role: 'admin', active: true, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    console.error(`No registered user found for ${email}.`);
    process.exitCode = 1;
  } else {
    console.log(`${email} is now a Samvid administrator.`);
  }
} finally {
  await mongoose.disconnect();
}
