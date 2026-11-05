/**
 * A password dialog that code can wait for: `askPassword` opens it and resolves
 * with what the user entered, or null when they cancel. `PasswordDialog`, once
 * mounted in the app, shows it.
 */

export interface PasswordRequest {
  /** What the password is for: opening a league, saving it, choosing one. */
  purpose: 'open' | 'save' | 'choose';
  /** The name of the league, shown in the dialog. */
  leagueName?: string;
  /** Shown above the field, e.g. that the last password was wrong. */
  error?: string;
}

export interface PasswordAnswer {
  password: string;
  /** Keep the key on this device, so the password is not asked again. */
  remember: boolean;
}

export interface Pending {
  request: PasswordRequest;
  resolve: (answer: PasswordAnswer | null) => void;
}

let pending: Pending | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export function askPassword(
  request: PasswordRequest,
): Promise<PasswordAnswer | null> {
  // A second question while one is open replaces it; the first one is cancelled.
  pending?.resolve(null);
  return new Promise((resolve) => {
    pending = { request, resolve };
    notify();
  });
}

export function settle(answer: PasswordAnswer | null) {
  const current = pending;
  pending = null;
  notify();
  current?.resolve(answer);
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const snapshot = () => pending;
