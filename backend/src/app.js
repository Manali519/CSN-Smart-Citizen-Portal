import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import tankerRoutes from './routes/tankerRoutes.js';
import garbageRoutes from './routes/garbageRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { complaintConfig } from './config/complaint.config.js';
import { dbStatus } from './config/db.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          env.nodeEnv !== 'production' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        if (env.clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(Object.assign(new Error(`CORS blocked for origin: ${origin}`), { status: 403 }));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, status: 'ok', ...dbStatus(), time: new Date().toISOString() });
  });

  // Local photo storage (development only; production photos are served by Vercel Blob)
  if (!complaintConfig.blobToken) {
    app.use('/uploads', express.static(complaintConfig.uploadDir, { index: false, dotfiles: 'deny', maxAge: '7d' }));
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/tanker', tankerRoutes);
  app.use('/api/services/garbage-van', garbageRoutes);
  app.use('/api/officer', officerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/public', publicRoutes);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: `No route: ${req.method} ${req.path}` });
  });

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error('[error]', err);
    // Client errors (bad JSON, CORS, ...) keep their message; server errors are hidden in production.
    const hide = status >= 500 && env.nodeEnv === 'production';
    res.status(status).json({ success: false, message: hide ? 'Something went wrong. Please try again.' : err.message });
  });

  return app;
}
