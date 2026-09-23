import { apiRequest } from './client.js';

export function registerCitizen(payload) {
  return apiRequest('/api/auth/register', { body: payload });
}

export function verifyRegistrationOtp({ email, otp }) {
  return apiRequest('/api/auth/register/verify-otp', { body: { email, otp } });
}

export function resendRegistrationOtp({ email }) {
  return apiRequest('/api/auth/register/resend-otp', { body: { email } });
}

export function loginWithPassword({ email, password }) {
  return apiRequest('/api/auth/login', { body: { email, password } });
}

export function loginWithGoogle({ googleIdToken }) {
  return apiRequest('/api/auth/login/google', { body: { googleIdToken } });
}

export function getCurrentUser() {
  return apiRequest('/api/auth/me', { method: 'GET' });
}

export function completeProfile(payload) {
  return apiRequest('/api/auth/profile', { method: 'PUT', body: payload });
}

export function logout() {
  return apiRequest('/api/auth/logout', { method: 'POST' });
}
