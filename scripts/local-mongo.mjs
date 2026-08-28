import process from 'node:process';
import { startLocalMongo } from './start-local-mongo.mjs';

const database = await startLocalMongo();

console.log(`Local MongoDB is ready at ${database.getUri('samvid')}`);

async function shutdown(signal) {
  console.log(`\n${signal} received; stopping local MongoDB...`);
  await database.stop();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await new Promise(() => {});
