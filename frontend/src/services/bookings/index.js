import { apiRequest } from '../../api/client.js';

export function fetchWaterSources() {
  return apiRequest('/api/tanker/sources', { method: 'GET' });
}

export function bookWaterTanker(payload) {
  return apiRequest('/api/tanker/book', { method: 'POST', body: payload });
}

export function fetchMyTankerBookings() {
  return apiRequest('/api/tanker/my-bookings', { method: 'GET' });
}

export function fetchTankerTracking(bookingId) {
  return apiRequest(`/api/tanker/track/${bookingId}`, { method: 'GET' });
}

export function updateTankerBookingStatus(bookingId, status) {
  return apiRequest(`/api/tanker/update-status/${bookingId}`, { method: 'POST', body: { status } });
}

export function bookGarbageVan(payload) {
  return apiRequest('/api/services/garbage-van/book', { method: 'POST', body: payload });
}

export function fetchMyGarbageBookings() {
  return apiRequest('/api/services/garbage-van/my-bookings', { method: 'GET' });
}
