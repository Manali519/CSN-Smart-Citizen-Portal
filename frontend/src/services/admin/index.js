import { apiRequest } from '../../api/client.js';
import { startTabSession, endTabSession } from '../../api/portalSession.js';

export async function adminLoginApi({ email, password }) {
  const res = await apiRequest('/api/admin/login', { method: 'POST', body: { email, password } });
  if (res?.success) startTabSession('admin', res.admin?.id);
  return res;
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
  endTabSession();
  return apiRequest('/api/admin/logout', { method: 'POST' });
}
