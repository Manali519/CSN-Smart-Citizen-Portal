import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { verifyMailer } from './utils/mailer.js';
import { createApp } from './app.js';

// 1. Register all schemas with Mongoose FIRST using ES import syntax
import "./models/User.js";
import "./models/Officer.js";
import "./models/Admin.js";
import "./models/Department.js";
import "./models/Complaint.js";
import "./models/ServiceRequest.js";
import "./models/Otp.js";
import "./models/TankerBooking.js";
import "./models/GarbageBooking.js";
async function main() {
  // 2. Establish connection to MongoDB
  await connectDB();

  // 3. Verify auxiliary services
  await verifyMailer();

  // 4. Initialize and start the application
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] Smart City Portal API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('[startup] Failed to start server:', err.message);
  process.exit(1);
});


