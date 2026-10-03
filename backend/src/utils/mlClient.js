import { complaintConfig } from '../config/complaint.config.js';

const { ml } = complaintConfig;
const headers = ml.apiKey ? { 'X-API-Key': ml.apiKey } : {};

/**
 * Sends the photo, description and category to the FastAPI CLIP service.
 * Throws an Error with .status set to the HTTP status on a non-2xx reply.
 */
export async function validateComplaint({ buffer, mimetype, text, category }) {
  const form = new FormData();
  form.append('category', category);
  form.append('text', text);
  form.append('image', new Blob([buffer], { type: mimetype }), 'upload');

  const res = await fetch(`${ml.url}/validate-complaint`, {
    method: 'POST',
    body: form,
    headers,
    signal: AbortSignal.timeout(ml.timeoutMs),
  });
  if (!res.ok) {
    const err = new Error(`ML service responded ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const flagsOk = ['valid', 'image_match', 'text_match'].every((k) => typeof data?.[k] === 'boolean');
  if (!flagsOk || !/^[0-9a-f]{16}$/.test(data.phash)) {
    throw new Error('ML service returned an unexpected response');
  }
  return data;
}
