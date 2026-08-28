import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { startLocalMongo } from './start-local-mongo.mjs';

const database = await startLocalMongo();
const mongoUri = database.getUri('samvid');
console.log(`Local MongoDB is ready at ${mongoUri}`);

const nextBinary = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const next = spawn(process.execPath, [nextBinary, 'dev', '--turbopack'], {
  env: {
    ...process.env,
    MONGODB_URI: mongoUri,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  },
  stdio: 'inherit'
});

let stopping = false;

async function shutdown(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (next.exitCode === null) next.kill(signal);
  await database.stop();
  process.exit(exitCode);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
next.once('exit', (code) => void shutdown('SIGTERM', code ?? 1));
