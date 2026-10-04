// Duplicate-photo lookup without scanning every complaint.
// The 64-bit perceptual hash is split into 6 bands. Two hashes that differ in at most 5 bits must share
// at least one identical band (pigeonhole), so only complaints with a matching band need a full comparison.
const BAND_BITS = [11, 11, 11, 11, 10, 10];
export const MAX_HAMMING_DISTANCE = BAND_BITS.length - 1;

/** "a1b2..." (16 hex chars) -> ["0:3f2", "1:7a", ...], stored in Complaint.imageHashBands. */
export function hashBands(hex) {
  let value = BigInt(`0x${hex}`);
  return BAND_BITS.map((bits, i) => {
    const band = value & ((1n << BigInt(bits)) - 1n);
    value >>= BigInt(bits);
    return `${i}:${band.toString(16)}`;
  });
}

export function hammingDistance(a, b) {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let bits = 0;
  while (x) {
    bits += Number(x & 1n);
    x >>= 1n;
  }
  return bits;
}

// pHash (same algorithm as Python's imagehash.phash): 32x32 greyscale -> 2D DCT -> 8x8 lowest frequencies ->
// one bit per coefficient above their median -> 16 hex chars.
const SIZE = 32;
const LOW = 8;
const COS = Array.from({ length: LOW }, (_, k) =>
  Array.from({ length: SIZE }, (_, n) => Math.cos((Math.PI * k * (2 * n + 1)) / (2 * SIZE)))
);

/** @param {import('sharp').Sharp} image an (EXIF-rotated) sharp pipeline */
export async function perceptualHash(image) {
  const { data, info } = await image
    .removeAlpha()
    .toColourspace('b-w')
    .resize(SIZE, SIZE, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = (y, x) => data[(y * SIZE + x) * info.channels];

  const coeffs = [];
  for (let ky = 0; ky < LOW; ky++) {
    for (let kx = 0; kx < LOW; kx++) {
      let sum = 0;
      for (let y = 0; y < SIZE; y++) {
        let row = 0;
        for (let x = 0; x < SIZE; x++) row += px(y, x) * COS[kx][x];
        sum += row * COS[ky][y];
      }
      coeffs.push(sum);
    }
  }

  const sorted = [...coeffs].sort((a, b) => a - b);
  const median = (sorted[LOW * LOW / 2 - 1] + sorted[LOW * LOW / 2]) / 2;
  const bits = coeffs.reduce((acc, c) => (acc << 1n) | (c > median ? 1n : 0n), 0n);
  return bits.toString(16).padStart(16, '0');
}
