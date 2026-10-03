import { apiRequest } from './client.js';

export function fetchMyRequests() {
  return apiRequest('/api/requests/mine', { method: 'GET' });
}
