export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/** Small wrapper around fetch: sends/receives JSON, includes the session cookie, throws on non-2xx with the server's message. */
export async function apiRequest(path, { method = 'POST', body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive the httpOnly session cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.code;
    error.fieldErrors = data?.errors || [];
    error.data = data;
    throw error;
  }

  return data;
}
