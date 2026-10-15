import { fileURLToPath } from 'url';
import { MAX_HAMMING_DISTANCE } from '../utils/phash.js';
import './env.js'; // loads backend/.env before the variables below are read

const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

// CITY_BBOX = "minLng,minLat,maxLng,maxLat"  (default: Chhatrapati Sambhajinagar)
const bbox = (process.env.CITY_BBOX || '75.20,19.78,75.50,19.98').split(',').map(Number);
if (bbox.length !== 4 || bbox.some(Number.isNaN)) {
  throw new Error('CITY_BBOX must be "minLng,minLat,maxLng,maxLat"');
}

export const complaintConfig = {
  // Google Gemini API (see utils/gemini.js). Without GEMINI_API_KEY, or when the API is unreachable or
  // rate-limited, complaints are held for admin review instead of being auto-routed.
  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || '').trim(),
    model: (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),
    timeoutMs: num(process.env.AI_TIMEOUT_MS, 30000),
    threshold: num(process.env.AI_FUSION_THRESHOLD, 0.6),
    wImage: num(process.env.AI_W_IMAGE, 0.5),
    wText: num(process.env.AI_W_TEXT, 0.5),
  },
  bbox: { minLng: bbox[0], minLat: bbox[1], maxLng: bbox[2], maxLat: bbox[3] },
  dailyLimit: num(process.env.DAILY_COMPLAINT_LIMIT, 10),
  // pHash distance <= this => duplicate. Capped because the banded lookup in utils/phash.js relies on it.
  dupHammingMax: Math.min(num(process.env.DUP_HAMMING_MAX, MAX_HAMMING_DISTANCE), MAX_HAMMING_DISTANCE),
  // Production: Vercel Blob store for photos (BLOB_READ_WRITE_TOKEN is added when a Blob store is connected to
  // the Vercel project). Development: local folder served at /uploads.
  blobToken: (process.env.BLOB_READ_WRITE_TOKEN || '').trim(),
  uploadDir: process.env.UPLOAD_DIR || fileURLToPath(new URL('../../uploads', import.meta.url)),
};
