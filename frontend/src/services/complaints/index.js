import { apiRequest } from '../../api/client.js';

export function fetchComplaintCategories() {
  return apiRequest('/api/complaints/categories', { method: 'GET' });
}

/** formData: category, description, image, and optionally lat, lng, locationSource ('gps' | 'manual'). */
export function registerComplaint(formData) {
  return apiRequest('/api/complaints', { method: 'POST', body: formData });
}

export function fetchMyComplaints(status) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/complaints/mine${query}`, { method: 'GET' });
}

export function submitComplaintFeedback(complaintId, { rating, comment }) {
  return apiRequest(`/api/complaints/${complaintId}/feedback`, { body: { rating, comment } });
}

/** Officer / admin queue. */
export function fetchComplaintQueue({ status, limit = 200 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.set('status', status);
  return apiRequest(`/api/complaints/queue?${params}`, { method: 'GET' });
}

/** Officer marks a complaint complete; remarks and proof photo are optional. */
export function resolveComplaint(complaintId, { remarks, proof }) {
  const fd = new FormData();
  if (remarks) fd.append('remarks', remarks);
  if (proof) fd.append('proof', proof);
  return apiRequest(`/api/complaints/${complaintId}/resolve`, { method: 'PATCH', body: fd });
}

/** Admin: decision is 'approve' | 'reject'. */
export function reviewComplaint(complaintId, decision) {
  return apiRequest(`/api/complaints/${complaintId}/review`, { method: 'PATCH', body: { decision } });
}
