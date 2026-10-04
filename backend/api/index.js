// Vercel Function entry point: every request is rewritten here (backend/vercel.json) and handled by the Express app.
// The MongoDB connection is opened on the first request and reused while the instance stays warm.
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const app = createApp();

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, message: 'Service temporarily unavailable. Please try again.' }));
  }
  return app(req, res);
}
