import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { verifyMailer } from './utils/mailer.js';
import { createApp } from './app.js';

async function main() {
  await connectDB();
  await verifyMailer();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Smart City Portal API listening on port ${env.port}`);
  });

  // Cloud Run sends SIGTERM before replacing the instance: finish in-flight requests, then close the DB.
  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[startup] Failed to start server:', err.message);
  process.exit(1);
});


