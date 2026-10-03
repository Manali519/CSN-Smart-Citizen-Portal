import multer from 'multer';

export const IMAGE_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(), // buffer needed for EXIF + forwarding to the ML service
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 10 },
  fileFilter: (_req, file, cb) =>
    IMAGE_EXT[file.mimetype] ? cb(null, true) : cb(new Error('Only JPEG, PNG or WebP images are allowed.')),
});

/** Parses a multipart form with a single image in `field` into req.file / req.body. */
function uploadImage(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();
      const tooBig = err.code === 'LIMIT_FILE_SIZE';
      return res.status(tooBig ? 413 : 400).json({
        success: false,
        code: 'BAD_IMAGE',
        message: tooBig ? 'Photo must be 8 MB or smaller.' : err.message,
      });
    });
  };
}

export const uploadComplaintImage = uploadImage('image');
export const uploadProofImage = uploadImage('proof');

/** Detects the real image type from magic bytes; the client-declared mimetype is not trusted. */
export function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
