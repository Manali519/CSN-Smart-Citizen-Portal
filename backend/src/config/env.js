import 'dotenv/config';

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  mongodbUri: required('MONGODB_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  googleClientId: required('GOOGLE_CLIENT_ID'),

  smtp: {
    host: required('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    fromName: process.env.MAIL_FROM_NAME || 'Smart City Portal',
  },

  otp: {
    length: Number(process.env.OTP_LENGTH || 6),
    expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60),
  },
};
