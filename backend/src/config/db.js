import mongoose from 'mongoose';
import { env } from './env.js';

// Establishes connection to MongoDB Atlas using the URI in .env
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      dbName: 'smart_city',
    });

    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};
