import crypto from 'crypto';

/**
 * Builds a short, human-readable reference like "CMP-8F2K91" or
 * "REQ-3TQ7ZP" that citizens can quote when following up, backed by
 * enough entropy that collisions are effectively impossible alongside
 * the schema's `unique: true` index.
 */
export function generateReferenceNo(prefix) {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}
