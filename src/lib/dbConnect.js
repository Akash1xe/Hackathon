import mongoose from 'mongoose';

const cached = globalThis.__samvidMongo || { connection: null, promise: null };
globalThis.__samvidMongo = cached;

export default async function dbConnect() {
  if (cached.connection) return cached.connection;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.');

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8_000,
      maxPoolSize: 10
    });
  }

  try {
    cached.connection = await cached.promise;
    return cached.connection;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
