// Session token storage helpers
// Phase 2: replace localStorage with a more secure mechanism (httpOnly cookie via BFF)

import type { AuthSession } from "./types";

const SESSION_KEY = "fps_session";

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getToken(): string | null {
  return loadSession()?.token ?? null;
}
