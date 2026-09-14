import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { CatProfile, CatProfilePatch } from "./types";
import { createDefaultCatProfile, normalizeCatName } from "./types";

interface CatProfileRow {
  cat_name: string;
  appearance_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CatProfileStoreOptions {
  dbPath?: string;
  flushDelayMs?: number;
}

export class CatProfileStore {
  private readonly db: DatabaseSync;
  private readonly flushDelayMs: number;
  private readonly pending = new Map<string, CatProfile>();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(options: CatProfileStoreOptions = {}) {
    const dbPath = options.dbPath ?? path.join(process.cwd(), "data", "xieyao.sqlite");
    if (dbPath !== ":memory:") mkdirSync(path.dirname(dbPath), { recursive: true });
    this.flushDelayMs = options.flushDelayMs ?? 750;
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        subject_id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cat_profiles (
        subject_id TEXT PRIMARY KEY REFERENCES users(subject_id) ON DELETE CASCADE,
        cat_name TEXT NOT NULL,
        appearance_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  get(subjectId: string): CatProfile {
    const queued = this.pending.get(subjectId);
    if (queued) return queued;

    const row = this.db.prepare(`
      SELECT cat_name, appearance_id, created_at, updated_at
      FROM cat_profiles
      WHERE subject_id = ?
    `).get(subjectId) as CatProfileRow | undefined;

    if (row) {
      return {
        catName: row.cat_name,
        appearanceId: row.appearance_id as CatProfile["appearanceId"],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const profile = createDefaultCatProfile();
    this.pending.set(subjectId, profile);
    this.scheduleFlush();
    return profile;
  }

  update(subjectId: string, patch: CatProfilePatch): CatProfile {
    const current = this.get(subjectId);
    const now = Date.now();
    const next: CatProfile = {
      ...current,
      ...(patch.catName === undefined ? null : { catName: normalizeCatName(patch.catName) }),
      ...(patch.appearanceId === undefined ? null : { appearanceId: patch.appearanceId }),
      updatedAt: now,
    };
    this.pending.set(subjectId, next);
    this.scheduleFlush();
    return next;
  }

  flush(): void {
    if (this.pending.size === 0) return;
    const entries = [...this.pending.entries()];
    this.pending.clear();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const upsertUser = this.db.prepare(`
      INSERT INTO users (subject_id, created_at, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(subject_id) DO UPDATE SET updated_at = excluded.updated_at
    `);
    const upsertProfile = this.db.prepare(`
      INSERT INTO cat_profiles (subject_id, cat_name, appearance_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(subject_id) DO UPDATE SET
        cat_name = excluded.cat_name,
        appearance_id = excluded.appearance_id,
        updated_at = excluded.updated_at
    `);

    try {
      this.db.exec("BEGIN IMMEDIATE;");
      for (const [subjectId, profile] of entries) {
        upsertUser.run(subjectId, profile.createdAt, profile.updatedAt);
        upsertProfile.run(
          subjectId,
          profile.catName,
          profile.appearanceId,
          profile.createdAt,
          profile.updatedAt,
        );
      }
      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      for (const [subjectId, profile] of entries) {
        if (!this.pending.has(subjectId)) this.pending.set(subjectId, profile);
      }
      this.scheduleFlush();
      throw error;
    }
  }

  close(): void {
    this.flush();
    this.db.close();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      try {
        this.flush();
      } catch (error) {
        console.error(
          "[profile-store] failed to flush profile batch",
          error instanceof Error ? error.message : "unknown error",
        );
      }
    }, this.flushDelayMs);
    this.flushTimer.unref?.();
  }
}
