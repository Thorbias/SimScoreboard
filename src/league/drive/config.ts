/**
 * Google Drive is optional (ADR-0009): the client ID and the API key belong to
 * whoever runs the site and are set when it is built. Without both, the
 * interface offers no Drive.
 */
export interface DriveConfig {
  clientId: string;
  apiKey: string;
}

export function readDriveConfig(env: {
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_GOOGLE_API_KEY?: string;
}): DriveConfig | null {
  const clientId = env.VITE_GOOGLE_CLIENT_ID?.trim();
  const apiKey = env.VITE_GOOGLE_API_KEY?.trim();
  return clientId && apiKey ? { clientId, apiKey } : null;
}

export const driveConfig: DriveConfig | null = readDriveConfig(import.meta.env);
