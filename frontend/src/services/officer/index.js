import { apiRequest } from '../../api/client.js';

export function officerLoginApi(payload) {
  return apiRequest('/api/officer/login', {
    method: 'POST',
    body: payload,
  });
}

export function fetchDepartmentRequests(department) {
  return apiRequest(`/api/officer/requests?department=${encodeURIComponent(department)}`, {
    method: 'GET',
  });
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
