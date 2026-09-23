/**
 * Decodes the payload of a Google Identity Services JWT credential.
 *
 * IMPORTANT: this is client-side decoding for display/prefill purposes
 * ONLY - it does not check the token's signature, expiry, or audience.
 * Never trust this for anything security-relevant. The same raw
 * `credential` string is sent to the backend as `googleIdToken`, and the
 * backend re-verifies it properly with google-auth-library before
 * trusting any of these fields.
 */
export function decodeGoogleCredentialForDisplay(credential) {
  try {
    const payloadBase64 = credential.split('.')[1];
    const json = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    return {
      email: payload.email || '',
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
    };
  } catch {
    return { email: '', firstName: '', lastName: '' };
  }
}
