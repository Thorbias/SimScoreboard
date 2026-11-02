/**
 * Sign-in with Google (Google Identity Services, token model). Only the scope
 * for files the app creates itself is requested. The token lives in memory for
 * about an hour; nothing is stored.
 */
const SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface Gis {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string }) => void;
      }): TokenClient;
    };
  };
}

let loading: Promise<Gis> | null = null;
let token: { value: string; expires: number } | null = null;

const gis = () => (window as { google?: Gis }).google;

/** Loads Google's sign-in script; call early so a click can open the popup. */
export function preloadDriveAuth(): Promise<Gis> {
  const ready = gis();
  if (ready?.accounts) return Promise.resolve(ready);
  loading ??= new Promise<Gis>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => {
      const loaded = gis();
      if (loaded?.accounts) resolve(loaded);
      else reject(new Error('Google sign-in did not load'));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('Google sign-in could not be loaded'));
    };
    document.head.append(script);
  });
  return loading;
}

/** Asks for access to the files the app created; call from a click. */
export async function requestDriveToken(clientId: string): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const google = await preloadDriveAuth();
  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error ?? 'No access was granted'));
          return;
        }
        token = {
          value: response.access_token,
          expires: Date.now() + Number(response.expires_in ?? 3600) * 1000,
        };
        resolve(token.value);
      },
      error_callback: (error) => reject(new Error(error.type)),
    });
    client.requestAccessToken();
  });
}
