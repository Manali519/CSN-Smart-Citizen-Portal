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
