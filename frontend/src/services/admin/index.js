import { apiRequest } from '../../api/client.js';

export function adminLoginApi({ email, password }) {
  return apiRequest('/api/admin/login', { method: 'POST', body: { email, password } });
}

export function fetchAdminProfile() {
  return apiRequest('/api/admin/me', { method: 'GET' });
}

/** weeks: 1-12; rating: 1-5 or '' for all. */
export function fetchAdminStats({ weeks, rating }) {
  const params = new URLSearchParams({ weeks: String(weeks) });
  if (rating) params.set('rating', String(rating));
  return apiRequest(`/api/admin/stats?${params}`, { method: 'GET' });
}

export function adminLogoutApi() {
  return apiRequest('/api/admin/logout', { method: 'POST' });
}
