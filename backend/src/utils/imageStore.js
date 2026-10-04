import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { put, del } from '@vercel/blob';
import { complaintConfig } from '../config/complaint.config.js';
import { IMAGE_EXT } from '../middleware/upload.js';

/**
 * Complaint photos live in a Vercel Blob store when BLOB_READ_WRITE_TOKEN is set (production: Vercel Functions
 * have no persistent disk), otherwise under UPLOAD_DIR and served by the API at /uploads (local development).
 * Object names are random UUIDs, so the public URLs cannot be guessed.
 */
const { blobToken, uploadDir } = complaintConfig;

/** Stores an image under <folder>/ and returns its public URL plus a key for removeImage(). */
export async function saveImage(buffer, imageType, folder) {
  const key = `${folder}/${crypto.randomUUID()}${IMAGE_EXT[imageType]}`;

  if (blobToken) {
    const blob = await put(key, buffer, {
      access: 'public',
      contentType: imageType,
      addRandomSuffix: false,
      cacheControlMaxAge: 604800,
      token: blobToken,
    });
    return { key: blob.url, url: blob.url };
  }

  if (process.env.VERCEL) {
    throw new Error('Photo storage is not configured: connect a Vercel Blob store to the backend project.');
  }
  const filePath = path.join(uploadDir, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { key, url: `/uploads/${key}` };
}

/** Best-effort cleanup of an image whose complaint was never saved. */
export async function removeImage(key) {
  if (!key) return;
  const removal = blobToken ? del(key, { token: blobToken }) : fs.unlink(path.join(uploadDir, key));
  await removal.catch(() => {});
}
