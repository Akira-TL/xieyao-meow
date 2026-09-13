import { randomUUID } from "node:crypto";

interface OAuthSessionStoreOptions {
  now?: () => number;
  createId?: () => string;
}

export interface StoredOAuthSession {
  accessToken: string;
  expiresAt: number;
}

export interface CreatedOAuthSession {
  id: string;
  expiresAt: number;
}

export class OAuthSessionStore {
  private readonly sessions = new Map<string, StoredOAuthSession>();
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(options: OAuthSessionStoreOptions = {}) {
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
  }

  create(accessToken: string, expiresInSeconds: number): CreatedOAuthSession {
    if (!accessToken.trim()) throw new Error("OAuth access token is required");
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new Error("OAuth session expiry must be positive");
    }

    const id = this.createId();
    const expiresAt = this.now() + Math.floor(expiresInSeconds * 1000);
    this.sessions.set(id, { accessToken, expiresAt });
    return { id, expiresAt };
  }

  get(id: string): StoredOAuthSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (session.expiresAt <= this.now()) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }
}
