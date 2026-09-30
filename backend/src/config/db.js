import mongoose from 'mongoose';
import { env } from './env.js';

// Establishes connection to MongoDB Atlas using the URI in .env
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      dbName: 'smart_city',
      serverSelectionTimeoutMS: 6000,
    });

    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection notice: ${error.message}`);
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};
