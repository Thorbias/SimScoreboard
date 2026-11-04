/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth client ID for the Drive connection (ADR-0009), optional. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Google API key, restricted to the site's address, optional. */
  readonly VITE_GOOGLE_API_KEY?: string;
}
