import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function startLocalMongo() {
  const databasePath = path.join(process.cwd(), '.local-mongo');
  await mkdir(databasePath, { recursive: true });

  return MongoMemoryServer.create({
    instance: {
      dbName: 'samvid',
      dbPath: databasePath,
      ip: '127.0.0.1',
      port: 27017,
      storageEngine: 'wiredTiger'
    }
  });
}
