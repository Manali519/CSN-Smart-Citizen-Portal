import { apiRequest } from '../../api/client.js';

export function fetchPaymentConfig() {
  return apiRequest('/api/payments/config', { method: 'GET' });
}

export function createPaymentOrder(payload) {
  return apiRequest('/api/payments/orders', { method: 'POST', body: payload });
}

export function verifyPayment(payload) {
  return apiRequest('/api/payments/verify', { method: 'POST', body: payload });
}

export function fetchMyPayments() {
  return apiRequest('/api/payments/my-payments', { method: 'GET' });
}
