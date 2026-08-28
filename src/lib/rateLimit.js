import { createHash } from 'node:crypto';
import dbConnect from './dbConnect.js';
import RateLimitBucket from '../model/RateLimitBucket.js';

export async function checkRateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const resetAt = (bucket + 1) * windowMs;
  const digest = createHash('sha256').update(String(key)).digest('hex').slice(0, 40);
  const bucketId = `${digest}:${bucket}`;
  await dbConnect();

  let record;
  try {
    record = await RateLimitBucket.findByIdAndUpdate(
      bucketId,
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } },
      { new: true, upsert: true, setDefaultsOnInsert: true, lean: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    record = await RateLimitBucket.findByIdAndUpdate(bucketId, { $inc: { count: 1 } }, { new: true, lean: true });
  }

  const count = Number(record?.count || 1);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}
