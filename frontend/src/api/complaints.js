import { apiRequest } from './client.js';

export function fetchMyComplaints(status) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/complaints/mine${query}`, { method: 'GET' });
}

export function submitComplaintFeedback(complaintId, { rating, comment }) {
  return apiRequest(`/api/complaints/${complaintId}/feedback`, { body: { rating, comment } });
}
