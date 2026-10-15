import { apiRequest } from '../../api/client.js';
import { startTabSession, endTabSession } from '../../api/portalSession.js';

export async function officerLoginApi(payload) {
  const res = await apiRequest('/api/officer/login', {
    method: 'POST',
    body: payload,
  });
  if (res?.success) startTabSession('officer', res.officer?.officerId);
  return res;
}

export function officerLogoutApi() {
  endTabSession();
  return apiRequest('/api/officer/logout', { method: 'POST' });
}

/** Requests for the logged-in officer's department (taken from the session cookie). */
export function fetchDepartmentRequests() {
  return apiRequest('/api/officer/requests', { method: 'GET' });
}

export function acceptOfficerRequest({ requestId, type }) {
  return apiRequest('/api/officer/accept', {
    method: 'POST',
    body: { requestId, type },
  });
}

export function completeOfficerRequest({ requestId, type }) {
  return apiRequest('/api/officer/complete', {
    method: 'POST',
    body: { requestId, type },
  });
}

export function submitServiceRating({ requestId, type, rating, review }) {
  return apiRequest('/api/officer/rate', {
    method: 'POST',
    body: { requestId, type, rating, review },
  });
}
