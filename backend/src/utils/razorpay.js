import crypto from 'crypto';
import { env } from '../config/env.js';

const API_BASE = 'https://api.razorpay.com/v1';
const REQUEST_TIMEOUT_MS = 10000;

/** This module is wired for Razorpay Test Mode only; live keys are refused. */
const TEST_KEY_PREFIX = 'rzp_test_';

export function isRazorpayConfigured() {
  const { keyId, keySecret } = env.razorpay;
  return Boolean(keyId && keySecret && keyId.startsWith(TEST_KEY_PREFIX));
}

function authHeader() {
  const { keyId, keySecret } = env.razorpay;
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

/** Calls the Razorpay REST API and throws an Error carrying a safe status on failure. */
async function razorpayRequest(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: authHeader(),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    const err = new Error('Payment gateway is unreachable. Please try again.');
    err.status = 502;
    err.cause = cause;
    throw err;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.description || `Razorpay request failed (${res.status})`);
    err.status = 502;
    err.gatewayCode = data?.error?.code;
    throw err;
  }
  return data;
}

/** @param {{ amount: number, receipt: string, notes?: Record<string,string> }} params amount in paise */
export function createOrder({ amount, receipt, notes = {} }) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: { amount, currency: env.razorpay.currency, receipt, notes, payment_capture: 1 },
  });
}

export function fetchPayment(paymentId) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

export function capturePayment(paymentId, amount) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST',
    body: { amount, currency: env.razorpay.currency },
  });
}

/** Checkout signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret), compared in constant time. */
export function isValidPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
