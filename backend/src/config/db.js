import mongoose from 'mongoose';
import { env } from './env.js';

export const DB_OPTIONS = { dbName: 'smart_city', serverSelectionTimeoutMS: 6000 };

/** Connects to MongoDB Atlas. Production refuses to start without a database; development keeps serving. */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongodbUri, DB_OPTIONS);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (env.nodeEnv === 'production') throw err;
    console.error(`[db] MongoDB connection failed: ${err.message}`);
  }
}
