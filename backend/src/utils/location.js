import exifr from 'exifr';
import { complaintConfig } from '../config/complaint.config.js';

const { bbox } = complaintConfig;

export const isValidPoint = (p) =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
  Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 && !(p.lat === 0 && p.lng === 0);

export const inCity = ({ lat, lng }) =>
  lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat;

/** GPS coordinates embedded in the photo by the phone camera, or null. */
export async function gpsFromExif(buffer) {
  try {
    const g = await exifr.gps(buffer);
    if (g) return { lat: g.latitude, lng: g.longitude };
  } catch {
    // no / unreadable EXIF
  }
  return null;
}

// Form fields arrive as strings; '' must not become 0.
export const toNum = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v));
