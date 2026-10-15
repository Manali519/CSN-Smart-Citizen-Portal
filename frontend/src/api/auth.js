import { apiRequest } from './client.js';
import { startTabSession, endTabSession } from './portalSession.js';

/** Binds this tab to the citizen whose sign-in just succeeded. */
async function citizenSignIn(request) {
  const res = await request;
  if (res?.user?.id) startTabSession('citizen', res.user.id);
  return res;
}

export function registerCitizen(payload) {
  return apiRequest('/api/auth/register', { body: payload });
}

export function verifyRegistrationOtp({ email, otp }) {
  return citizenSignIn(apiRequest('/api/auth/register/verify-otp', { body: { email, otp } }));
}

export function resendRegistrationOtp({ email }) {
  return apiRequest('/api/auth/register/resend-otp', { body: { email } });
}

export function loginWithPassword({ email, password }) {
  return citizenSignIn(apiRequest('/api/auth/login', { body: { email, password } }));
}

export function loginWithGoogle({ googleIdToken }) {
  return citizenSignIn(apiRequest('/api/auth/login/google', { body: { googleIdToken } }));
}

export function getCurrentUser() {
  return apiRequest('/api/auth/me', { method: 'GET' });
}

export function completeProfile(payload) {
  return apiRequest('/api/auth/profile', { method: 'PUT', body: payload });
}

export function logout() {
  endTabSession();
  return apiRequest('/api/auth/logout', { method: 'POST' });
}
