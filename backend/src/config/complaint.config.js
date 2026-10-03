import 'dotenv/config';
import { fileURLToPath } from 'url';
import { MAX_HAMMING_DISTANCE } from '../utils/phash.js';

const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

// CITY_BBOX = "minLng,minLat,maxLng,maxLat"  (default: Chhatrapati Sambhajinagar)
const bbox = (process.env.CITY_BBOX || '75.20,19.78,75.50,19.98').split(',').map(Number);
if (bbox.length !== 4 || bbox.some(Number.isNaN)) {
  throw new Error('CITY_BBOX must be "minLng,minLat,maxLng,maxLat"');
}

export const complaintConfig = {
  ml: {
    // 127.0.0.1 rather than localhost: Node may resolve localhost to ::1 while uvicorn listens on IPv4.
    url: (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, ''),
    apiKey: process.env.ML_API_KEY || '',
    timeoutMs: num(process.env.ML_TIMEOUT_MS, 20000),
  },
  bbox: { minLng: bbox[0], minLat: bbox[1], maxLng: bbox[2], maxLat: bbox[3] },
  dailyLimit: num(process.env.DAILY_COMPLAINT_LIMIT, 10),
  // pHash distance <= this => duplicate. Capped because the banded lookup in utils/phash.js relies on it.
  dupHammingMax: Math.min(num(process.env.DUP_HAMMING_MAX, MAX_HAMMING_DISTANCE), MAX_HAMMING_DISTANCE),
  // Production: Cloud Storage bucket for photos. Development: local folder served at /uploads.
  gcsBucket: (process.env.GCS_BUCKET || '').trim(),
  uploadDir: process.env.UPLOAD_DIR || fileURLToPath(new URL('../../uploads', import.meta.url)),
};
