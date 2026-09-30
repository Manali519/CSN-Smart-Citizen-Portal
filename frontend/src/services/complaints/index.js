import { apiRequest } from '../../api/client.js';

export function fetchMyComplaints(status) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/complaints/mine${query}`, { method: 'GET' });
}

export function submitComplaintFeedback(complaintId, { rating, comment }) {
  return apiRequest(`/api/complaints/${complaintId}/feedback`, { body: { rating, comment } });
}

export function registerComplaint(payload) {
  return apiRequest('/api/complaints', { method: 'POST', body: payload });
}
