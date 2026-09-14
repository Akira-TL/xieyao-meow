import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { CatProfile, CatProfilePatch } from "@/lib/profile/types";
import { createDefaultCatProfile, normalizeCatName } from "@/lib/profile/types";

interface AccountStoreOptions {
  dbPath?: string;
  now?: () => number;
  createId?: () => string;
  createSessionId?: () => string;
}

export interface StoredOAuthSession {
  userId: string;
  accessToken: string;
  expiresAt: number;
}

export interface CreatedOAuthSession {
  id: string;
  userId: string;
  expiresAt: number;
}

export type AnonymousProfileClaimResult =
  | "claimed"
  | "formal-profile-kept"
  | "already-consumed"
  | "conflict";

interface ProfileRow {
  cat_name: string;
  appearance_id: string | null;
  created_at: number;
  updated_at: number;
}

interface AnonymousProfileRow extends ProfileRow {
  consumed_at: number | null;
  consumed_by_user_id: string | null;
}

export class AccountStore {
  private readonly db: DatabaseSync;
  private readonly now: () => number;
  private readonly createId: () => string;
  private readonly createSessionId: () => string;
  private readonly hasLegacyProfiles: boolean;

  constructor(options: AccountStoreOptions = {}) {
    const dbPath = options.dbPath ?? path.join(process.cwd(), "data", "xieyao.sqlite");
    if (dbPath !== ":memory:") mkdirSync(path.dirname(dbPath), { recursive: true });

    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
    this.createSessionId = options.createSessionId ?? randomUUID;
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.ensureSchema();
    this.hasLegacyProfiles = Boolean(
      this.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'cat_profiles'").get(),
    );
  }

  resolveOrCreateOAuthUser(provider: string, providerSubject: string): string {
    const normalizedProvider = provider.trim();
    const normalizedSubject = providerSubject.trim();
    if (!normalizedProvider || !normalizedSubject) {
      throw new Error("OAuth provider and provider subject are required");
    }

    const existing = this.db.prepare(`
      SELECT user_id
      FROM oauth_identities
      WHERE provider = ? AND provider_subject = ?
    `).get(normalizedProvider, normalizedSubject) as { user_id: string } | undefined;
    if (existing) return existing.user_id;

    const now = this.now();
    const userId = this.createId();
    try {
      this.db.exec("BEGIN IMMEDIATE;");
      const raced = this.db.prepare(`
        SELECT user_id
        FROM oauth_identities
        WHERE provider = ? AND provider_subject = ?
      `).get(normalizedProvider, normalizedSubject) as { user_id: string } | undefined;
      if (raced) {
        this.db.exec("COMMIT;");
        return raced.user_id;
      }
      this.db.prepare(`
        INSERT INTO app_users (id, created_at, updated_at)
        VALUES (?, ?, ?)
      `).run(userId, now, now);
      this.db.prepare(`
        INSERT INTO oauth_identities (
          provider, provider_subject, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(normalizedProvider, normalizedSubject, userId, now, now);
      this.db.exec("COMMIT;");
      return userId;
    } catch (error) {
      this.rollbackQuietly();
      throw error;
    }
  }

  createSession(userId: string, accessToken: string, expiresInSeconds: number): CreatedOAuthSession {
    if (!accessToken.trim()) throw new Error("OAuth access token is required");
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new Error("OAuth session expiry must be positive");
    }
    this.requireUser(userId);

    const id = this.createSessionId();
    const now = this.now();
    const expiresAt = now + Math.floor(expiresInSeconds * 1000);
    this.db.prepare(`
      INSERT INTO oauth_sessions (id, user_id, access_token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, accessToken, expiresAt, now);
    return { id, userId, expiresAt };
  }

  getSession(id: string): StoredOAuthSession | null {
    if (!id.trim()) return null;
    const row = this.db.prepare(`
      SELECT user_id, access_token, expires_at
      FROM oauth_sessions
      WHERE id = ?
    `).get(id) as { user_id: string; access_token: string; expires_at: number } | undefined;
    if (!row) return null;
    if (row.expires_at <= this.now()) {
      this.deleteSession(id);
      return null;
    }
    return {
      userId: row.user_id,
      accessToken: row.access_token,
      expiresAt: row.expires_at,
    };
  }

  deleteSession(id: string): void {
    this.db.prepare("DELETE FROM oauth_sessions WHERE id = ?").run(id);
  }

  getUserProfile(userId: string): CatProfile {
    this.requireUser(userId);
    const row = this.readProfile("user_cat_profiles", "user_id", userId);
    if (row) return this.profileFromRow(row);

    const profile = createDefaultCatProfile(this.now());
    this.insertUserProfile(userId, profile);
    return profile;
  }

  updateUserProfile(userId: string, patch: CatProfilePatch): CatProfile {
    const current = this.getUserProfile(userId);
    const next = this.applyProfilePatch(current, patch);
    this.db.prepare(`
      UPDATE user_cat_profiles
      SET cat_name = ?, appearance_id = ?, updated_at = ?
      WHERE user_id = ?
    `).run(next.catName, next.appearanceId, next.updatedAt, userId);
    return next;
  }

  getAnonymousProfile(anonymousId: string): CatProfile {
    this.requireAnonymousId(anonymousId);
    this.migrateLegacyAnonymousProfile(anonymousId);
    const row = this.readAnonymousProfile(anonymousId);
    if (row) return this.profileFromRow(row);

    const profile = createDefaultCatProfile(this.now());
    this.insertAnonymousProfile(anonymousId, profile);
    return profile;
  }

  updateAnonymousProfile(anonymousId: string, patch: CatProfilePatch): CatProfile {
    this.requireAnonymousId(anonymousId);
    const current = this.getAnonymousProfile(anonymousId);
    const row = this.readAnonymousProfile(anonymousId);
    if (row?.consumed_at !== null) {
      throw new Error("Anonymous profile has already been consumed");
    }
    const next = this.applyProfilePatch(current, patch);
    this.db.prepare(`
      UPDATE anonymous_cat_profiles
      SET cat_name = ?, appearance_id = ?, updated_at = ?
      WHERE anonymous_id = ?
    `).run(next.catName, next.appearanceId, next.updatedAt, anonymousId);
    return next;
  }

  claimAnonymousProfile(anonymousId: string, userId: string): AnonymousProfileClaimResult {
    this.requireAnonymousId(anonymousId);
    this.requireUser(userId);
    this.migrateLegacyAnonymousProfile(anonymousId);

    const defaultProfile = createDefaultCatProfile(this.now());
    try {
      this.db.exec("BEGIN IMMEDIATE;");
      this.db.prepare(`
        INSERT OR IGNORE INTO anonymous_cat_profiles (
          anonymous_id, cat_name, appearance_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        anonymousId,
        defaultProfile.catName,
        defaultProfile.appearanceId,
        defaultProfile.createdAt,
        defaultProfile.updatedAt,
      );

      const anonymous = this.readAnonymousProfile(anonymousId);
      if (!anonymous) throw new Error("Anonymous profile disappeared during claim");
      if (anonymous.consumed_at !== null) {
        this.db.exec("COMMIT;");
        return anonymous.consumed_by_user_id === userId ? "already-consumed" : "conflict";
      }

      const existingFormal = this.readProfile("user_cat_profiles", "user_id", userId);
      let result: AnonymousProfileClaimResult = "formal-profile-kept";
      if (!existingFormal) {
        this.insertUserProfile(userId, this.profileFromRow(anonymous));
        result = "claimed";
      }

      this.db.prepare(`
        UPDATE anonymous_cat_profiles
        SET consumed_at = ?, consumed_by_user_id = ?, updated_at = ?
        WHERE anonymous_id = ? AND consumed_at IS NULL
      `).run(this.now(), userId, this.now(), anonymousId);
      this.db.exec("COMMIT;");
      return result;
    } catch (error) {
      this.rollbackQuietly();
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS oauth_identities (
        provider TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (provider, provider_subject)
      );
      CREATE INDEX IF NOT EXISTS idx_oauth_identities_user_id
        ON oauth_identities(user_id);
      CREATE TABLE IF NOT EXISTS oauth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id
        ON oauth_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires_at
        ON oauth_sessions(expires_at);
      CREATE TABLE IF NOT EXISTS user_cat_profiles (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        cat_name TEXT NOT NULL,
        appearance_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS anonymous_cat_profiles (
        anonymous_id TEXT PRIMARY KEY,
        cat_name TEXT NOT NULL,
        appearance_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        consumed_at INTEGER,
        consumed_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL
      );
    `);
  }

  private requireUser(userId: string): void {
    const row = this.db.prepare("SELECT 1 FROM app_users WHERE id = ?").get(userId);
    if (!row) throw new Error("Unknown user");
  }

  private requireAnonymousId(anonymousId: string): void {
    if (!anonymousId.trim()) throw new Error("Anonymous profile id is required");
  }

  private readProfile(table: string, keyColumn: string, key: string): ProfileRow | null {
    const row = this.db.prepare(`
      SELECT cat_name, appearance_id, created_at, updated_at
      FROM ${table}
      WHERE ${keyColumn} = ?
    `).get(key) as ProfileRow | undefined;
    return row ?? null;
  }

  private readAnonymousProfile(anonymousId: string): AnonymousProfileRow | null {
    const row = this.db.prepare(`
      SELECT cat_name, appearance_id, created_at, updated_at, consumed_at, consumed_by_user_id
      FROM anonymous_cat_profiles
      WHERE anonymous_id = ?
    `).get(anonymousId) as AnonymousProfileRow | undefined;
    return row ?? null;
  }

  private profileFromRow(row: ProfileRow): CatProfile {
    return {
      catName: row.cat_name,
      appearanceId: row.appearance_id as CatProfile["appearanceId"],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private applyProfilePatch(current: CatProfile, patch: CatProfilePatch): CatProfile {
    return {
      ...current,
      ...(patch.catName === undefined ? null : { catName: normalizeCatName(patch.catName) }),
      ...(patch.appearanceId === undefined ? null : { appearanceId: patch.appearanceId }),
      updatedAt: this.now(),
    };
  }

  private insertUserProfile(userId: string, profile: CatProfile): void {
    this.db.prepare(`
      INSERT INTO user_cat_profiles (
        user_id, cat_name, appearance_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(userId, profile.catName, profile.appearanceId, profile.createdAt, profile.updatedAt);
  }

  private insertAnonymousProfile(anonymousId: string, profile: CatProfile): void {
    this.db.prepare(`
      INSERT INTO anonymous_cat_profiles (
        anonymous_id, cat_name, appearance_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      anonymousId,
      profile.catName,
      profile.appearanceId,
      profile.createdAt,
      profile.updatedAt,
    );
  }

  private migrateLegacyAnonymousProfile(anonymousId: string): void {
    if (!this.hasLegacyProfiles || this.readAnonymousProfile(anonymousId)) return;
    const legacy = this.db.prepare(`
      SELECT cat_name, appearance_id, created_at, updated_at
      FROM cat_profiles
      WHERE subject_id = ?
    `).get(`anon:${anonymousId}`) as ProfileRow | undefined;
    if (!legacy) return;
    this.db.prepare(`
      INSERT OR IGNORE INTO anonymous_cat_profiles (
        anonymous_id, cat_name, appearance_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      anonymousId,
      legacy.cat_name,
      legacy.appearance_id,
      legacy.created_at,
      legacy.updated_at,
    );
  }

  private rollbackQuietly(): void {
    try {
      this.db.exec("ROLLBACK;");
    } catch {
      // No active transaction.
    }
  }
}
