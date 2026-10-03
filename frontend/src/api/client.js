// Empty in production: Vercel proxies /api to the Cloud Run backend (frontend/vercel.json).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Production photos are absolute Cloud Storage URLs; local-development photos are /uploads paths on the API.
export const assetUrl = (path) => (/^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`);

export async function apiRequest(path, { method = 'POST', body } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive the httpOnly session cookie
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
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
