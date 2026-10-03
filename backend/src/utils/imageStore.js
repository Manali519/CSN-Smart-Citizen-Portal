import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';
import { complaintConfig } from '../config/complaint.config.js';
import { IMAGE_EXT } from '../middleware/upload.js';

/**
 * Complaint photos live in a Cloud Storage bucket when GCS_BUCKET is set (production: Cloud Run's disk is
 * not persistent), otherwise under UPLOAD_DIR and served by the API at /uploads (local development).
 * Object names are random UUIDs, so the public URLs cannot be guessed.
 */
const { gcsBucket, uploadDir } = complaintConfig;
const bucket = gcsBucket ? new Storage().bucket(gcsBucket) : null;

/** Stores an image under <folder>/ and returns its public URL plus a key for removeImage(). */
export async function saveImage(buffer, imageType, folder) {
  const key = `${folder}/${crypto.randomUUID()}${IMAGE_EXT[imageType]}`;

  if (bucket) {
    await bucket.file(key).save(buffer, {
      resumable: false,
      contentType: imageType,
      metadata: { cacheControl: 'public, max-age=604800, immutable' },
    });
    return { key, url: `https://storage.googleapis.com/${bucket.name}/${key}` };
  }

  const filePath = path.join(uploadDir, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { key, url: `/uploads/${key}` };
}

/** Best-effort cleanup of an image whose complaint was never saved. */
export async function removeImage(key) {
  if (!key) return;
  const removal = bucket ? bucket.file(key).delete() : fs.unlink(path.join(uploadDir, key));
  await removal.catch(() => {});
}
