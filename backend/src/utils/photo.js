import sharp from 'sharp';
import { perceptualHash } from './phash.js';

// Uploaded photos are re-encoded before they are stored. sharp drops all metadata on output, so the camera's
// EXIF data (exact GPS position, device model, capture time) never reaches the public photo URL.
// The complaint location is read from the original upload first (utils/location.js).
const MAX_INPUT_PIXELS = 40_000_000; // rejects decompression bombs
const STORED_MAX_PX = 2048;
const AI_MAX_PX = 768;

const invalidImage = (cause) => Object.assign(new Error('Invalid image file'), { status: 400, cause });

/** Opens an upload upright: .rotate() applies the EXIF orientation of phone photos. */
const open = (buffer) => sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();

const toJpeg = (image, maxPx) =>
  image.clone().resize(maxPx, maxPx, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();

/** A photo ready to store: JPEG, at most 2048 px, no metadata. Throws an Error with .status 400 if undecodable. */
export async function cleanPhoto(buffer) {
  try {
    return await toJpeg(open(buffer), STORED_MAX_PX);
  } catch (cause) {
    throw invalidImage(cause);
  }
}

/**
 * Everything a complaint needs from its photo: the clean copy to store, a smaller copy for the AI check and the
 * perceptual hash for duplicate detection. Throws an Error with .status 400 if the image cannot be decoded.
 */
export async function processComplaintPhoto(buffer) {
  try {
    const image = open(buffer);
    const [stored, preview, phash] = await Promise.all([
      toJpeg(image, STORED_MAX_PX),
      toJpeg(image, AI_MAX_PX),
      perceptualHash(image.clone()),
    ]);
    return { stored, preview, phash };
  } catch (cause) {
    throw invalidImage(cause);
  }
}
