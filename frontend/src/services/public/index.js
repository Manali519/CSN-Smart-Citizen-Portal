import { apiRequest } from '../../api/client.js';

/** Login-free city statistics (same shape as the admin overview). weeks: 1-12; rating: 1-5 or ''. */
export function fetchPublicStats({ weeks, rating }) {
  const params = new URLSearchParams({ weeks: String(weeks) });
  if (rating) params.set('rating', String(rating));
  return apiRequest(`/api/public/stats?${params}`, { method: 'GET' });
}

/** Login-free complaint locations with status and category only. */
export function fetchComplaintMap() {
  return apiRequest('/api/public/complaint-map', { method: 'GET' });
}
