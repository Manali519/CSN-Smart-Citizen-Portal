import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import requestRoutes from './routes/requestRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
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
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '20kb' })); // small limit - this API only ever accepts short form fields
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/requests', requestRoutes);

  // 404 for anything unmatched
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `No route: ${req.method} ${req.path}` });
  });

  // Centralized error handler - keeps stack traces out of API responses.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err);
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: env.nodeEnv === 'production' ? 'Something went wrong. Please try again.' : err.message,
    });
  });

  return app;
}
