import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let scriptLoadingPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

export function useGoogleSignIn(onCredential) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID in .env).');
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callbackRef.current(response.credential),
        });
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            width: 320,
          });
        }
        setReady(true);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  return { buttonRef, ready, error };
}

/**
 * Decodes a Google Identity Services JWT for display/prefill ONLY: no signature, expiry or audience check.
 * The raw credential is sent to the backend as `googleIdToken`, which verifies it before trusting anything.
 */
export function decodeGoogleCredentialForDisplay(credential) {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { email: payload.email || '', firstName: payload.given_name || '', lastName: payload.family_name || '' };
  } catch {
    return { email: '', firstName: '', lastName: '' };
  }
}
