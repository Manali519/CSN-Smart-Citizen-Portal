import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { verifyMailer } from './utils/mailer.js';
import { createApp } from './app.js';

async function main() {
  await connectDB();
  await verifyMailer();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] Smart City Portal API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('[startup] Failed to start server:', err.message);
  process.exit(1);
});


