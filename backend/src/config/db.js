import mongoose from 'mongoose';
import { env } from './env.js';

// Small pool: each Vercel Function instance holds its own connections and Atlas M0 allows 500 in total.
export const DB_OPTIONS = { dbName: 'smart_city', serverSelectionTimeoutMS: 6000, maxPoolSize: 5 };

let connecting = null;

/**
 * Connects to MongoDB Atlas once per process and reuses the connection (warm serverless instances call this on
 * every request). Production throws when the database is unreachable; development logs and keeps serving.
 */
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  connecting ??= mongoose
    .connect(env.mongodbUri, DB_OPTIONS)
    .then((conn) => console.log(`[db] MongoDB connected: ${conn.connection.host}`))
    .catch((err) => {
      connecting = null; // let the next request retry
      if (env.nodeEnv === 'production') throw err;
      console.error(`[db] MongoDB connection failed: ${err.message}`);
    });
  return connecting;
}
