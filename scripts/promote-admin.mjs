import mongoose from 'mongoose';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run admin:promote -- citizen@example.com');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing from .env.local.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8_000 });
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
