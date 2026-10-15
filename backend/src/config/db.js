import mongoose from 'mongoose';
import { env } from './env.js';

// Small pool: each Vercel Function instance holds its own connections and Atlas M0 allows 500 in total.
// 10 s covers the SRV DNS lookup + TLS handshake of a cold start without hitting the function's maxDuration.
export const DB_OPTIONS = { dbName: 'smart_city', serverSelectionTimeoutMS: 10000, maxPoolSize: 5 };

// Serverless functions cannot serve requests without the database, so they always fail fast like production.
const failHard = env.nodeEnv === 'production' || Boolean(process.env.VERCEL);

// Maps the usual Atlas connection failures to a short code (safe to show on /api/health) and a fix (logged).
const DB_ERRORS = [
  [/bad auth|authentication failed/i, 'DB_AUTH_FAILED', 'Atlas rejected the username/password in MONGODB_URI. Check the Database Access user and URL-encode special characters in the password.'],
  [/whitelist|ip access list|IP that isn't/i, 'DB_IP_NOT_ALLOWED', 'Atlas Network Access blocks Vercel. Add 0.0.0.0/0 to the IP Access List.'],
  [/querySrv|ENOTFOUND|ENODATA|EREFUSED/i, 'DB_HOST_NOT_FOUND', 'The cluster host in MONGODB_URI could not be resolved. Copy the connection string again from Atlas -> Connect -> Drivers.'],
  [/Invalid scheme|Invalid connection string|URI must|malformed/i, 'DB_URI_INVALID', 'MONGODB_URI is malformed. It must start with mongodb+srv:// and have no quotes or spaces.'],
  [/timed out|ETIMEDOUT|ECONNREFUSED|ReplicaSetNoPrimary/i, 'DB_UNREACHABLE', 'Timed out reaching Atlas. Usually 0.0.0.0/0 is missing from the IP Access List, or the cluster is paused.'],
];

let connecting = null;
let lastError = null;

export function describeDbError(err) {
  const text = `${err?.name} ${err?.message} ${err?.cause?.message ?? ''}`;
  const [, code, hint] = DB_ERRORS.find(([pattern]) => pattern.test(text)) ?? [null, 'DB_ERROR', err?.message];
  return { code, hint };
}

/** Connection state for the health check: connected, connecting, or the code of the last failure. */
export function dbStatus() {
  if (mongoose.connection.readyState === 1) return { db: 'connected' };
  return lastError ? { db: 'error', dbError: lastError.code } : { db: 'disconnected' };
}

/**
 * Connects to MongoDB Atlas once per process and reuses the connection (warm serverless instances call this on
 * every request). Production and Vercel throw when the database is unreachable; local development logs and keeps serving.
 */
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  connecting ??= mongoose
    .connect(env.mongodbUri, DB_OPTIONS)
    .then((conn) => {
      lastError = null;
      console.log(`[db] MongoDB connected: ${conn.connection.host}`);
    })
    .catch((err) => {
      connecting = null; // let the next request retry
      lastError = describeDbError(err);
      console.error(`[db] MongoDB connection failed (${lastError.code}): ${err.message}\n[db] Fix: ${lastError.hint}`);
      if (failHard) throw err;
    });
  return connecting;
}
