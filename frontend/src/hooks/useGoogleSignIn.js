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

/**
 * Loads Google Identity Services and renders their official "Sign in
 * with Google" button into `buttonRef`. When the person completes
 * sign-in, `onCredential(idToken)` fires with the signed JWT credential
 * - that token is only trusted once the backend verifies it
 * (see server/src/utils/googleAuth.js). Nothing here should be treated
 * as "the user is authenticated" on its own.
 */
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
