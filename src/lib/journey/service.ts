import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  JourneyDiscoverer,
  JourneyDiscoveryResult,
  JourneyProjection,
  JourneyQuestion,
  JourneyView,
  ReturnArtifact,
} from "./types";

interface JourneyServiceOptions {
  dbPath?: string;
  now?: () => number;
  createId?: () => string;
  discover: JourneyDiscoverer;
}

interface JourneyRow {
  id: string;
  user_id: string;
  state: "PREPARING" | "AWAY" | "RETURNED";
  route_bias: string | null;
  created_at: number;
  depart_at: number;
  return_at: number;
  plan_seed: string;
  materialized_at: number | null;
  content_source: "live" | "none" | null;
  knowledge_source: "template" | "none" | null;
  source_fetched_at: number | null;
  question_title: string | null;
  question_url: string | null;
  question_summary: string | null;
  question_thumbnail_url: string | null;
  postcard_headline: string | null;
  postcard_body: string | null;
  artifact_id: string | null;
  artifact_type: ReturnArtifact["type"] | null;
  artifact_title: string | null;
  artifact_source_url: string | null;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function questionFromRow(row: JourneyRow): JourneyQuestion | null {
  if (!row.question_title || !row.question_url) return null;
  return {
    title: row.question_title,
    url: row.question_url,
    summary: row.question_summary ?? "",
    ...(row.question_thumbnail_url ? { thumbnailUrl: row.question_thumbnail_url } : {}),
  };
}

function artifactFromRow(row: JourneyRow): ReturnArtifact | null {
  if (!row.artifact_id || !row.artifact_type || !row.artifact_title || !row.artifact_source_url) {
    return null;
  }
  return {
    id: row.artifact_id,
    type: row.artifact_type,
    title: row.artifact_title,
    sourceUrl: row.artifact_source_url,
  };
}

export class JourneyService {
  private readonly db: DatabaseSync;
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(private readonly options: JourneyServiceOptions) {
    const dbPath = options.dbPath ?? path.join(process.cwd(), "data", "xieyao.sqlite");
    if (dbPath !== ":memory:") mkdirSync(path.dirname(dbPath), { recursive: true });
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.ensureSchema();
  }

  async getProjection(userId: string, oauthAccessToken: string): Promise<JourneyProjection> {
    let row = this.readCurrentRow(userId);
    if (!row) return { state: "AT_HOME", journey: null };

    const now = this.now();
    if (row.state === "PREPARING" && now >= row.depart_at) {
      this.db.prepare(`
        UPDATE journeys SET state = 'AWAY'
        WHERE id = ? AND user_id = ? AND state = 'PREPARING'
      `).run(row.id, userId);
      row = this.readCurrentRow(userId) ?? row;
    }

    if (now >= row.return_at && row.materialized_at === null) {
      let result: JourneyDiscoveryResult;
      try {
        result = await this.options.discover({
          userId,
          oauthAccessToken,
          routeBias: row.route_bias,
          planSeed: row.plan_seed,
        });
      } catch {
        result = {
          question: null,
          contentSource: "none",
          knowledgeSource: "none",
          sourceFetchedAt: now,
          postcardBody: "这趟没碰到值得带回来的新问题，但它还是按时回家了。",
        };
      }
      this.materialize(row.id, userId, result, now);
      row = this.readCurrentRow(userId) ?? row;
    }

    const view = this.toView(row);
    return { state: view.state, journey: view };
  }

  async start(
    userId: string,
    oauthAccessToken: string,
    routeBias: string | null,
  ): Promise<JourneyProjection> {
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "AT_HOME") return current;

    const now = this.now();
    const id = this.createId();
    const planSeed = `${id}:journey-v1`;
    const hash = hashString(planSeed);
    const durationMs = 180_000 + (hash % 120_001);
    const preparingMs = 15_000 + (hash % 15_001);

    try {
      this.db.prepare(`
        INSERT INTO journeys (
          id, user_id, state, route_bias, created_at, depart_at, return_at,
          plan_seed, engine_version
        ) VALUES (?, ?, 'PREPARING', ?, ?, ?, ?, ?, 'journey-v1')
      `).run(
        id,
        userId,
        routeBias,
        now,
        now + preparingMs,
        now + durationMs,
        planSeed,
      );
    } catch (error) {
      if (!String(error).includes("UNIQUE constraint failed")) throw error;
    }

    return this.getProjection(userId, oauthAccessToken);
  }

  async archive(userId: string, oauthAccessToken: string): Promise<JourneyProjection> {
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "RETURNED" || !current.journey) return current;
    this.db.prepare(`
      UPDATE journeys SET archived_at = ?
      WHERE id = ? AND user_id = ? AND state = 'RETURNED' AND archived_at IS NULL
    `).run(this.now(), current.journey.id, userId);
    return { state: "AT_HOME", journey: null };
  }

  async getJourney(
    userId: string,
    journeyId: string,
    oauthAccessToken: string,
  ): Promise<JourneyView | null> {
    await this.getProjection(userId, oauthAccessToken);
    const row = this.readRow(userId, journeyId, false);
    return row ? this.toView(row) : null;
  }

  close(): void {
    this.db.close();
  }

  private materialize(
    journeyId: string,
    userId: string,
    result: JourneyDiscoveryResult,
    materializedAt: number,
  ): void {
    const row = this.readRow(userId, journeyId, true);
    if (!row || row.materialized_at !== null) return;

    const question = result.question;
    const headline = question ? "它叼回来一个问题。" : "它空着爪子回来了。";
    const artifactId = question ? this.createId() : null;

    try {
      this.db.exec("BEGIN IMMEDIATE;");
      const latest = this.db.prepare(`
        SELECT materialized_at, return_at FROM journeys
        WHERE id = ? AND user_id = ? AND archived_at IS NULL
      `).get(journeyId, userId) as { materialized_at: number | null; return_at: number } | undefined;
      if (!latest || latest.materialized_at !== null) {
        this.db.exec("COMMIT;");
        return;
      }

      this.db.prepare(`
        INSERT OR IGNORE INTO journey_logs (
          journey_id, user_id, completed_at, question_title, question_url,
          question_summary, question_thumbnail_url, content_source,
          knowledge_source, source_fetched_at, result_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        journeyId,
        userId,
        latest.return_at,
        question?.title ?? null,
        question?.url ?? null,
        question?.summary ?? null,
        question?.thumbnailUrl ?? null,
        result.contentSource,
        result.knowledgeSource,
        result.sourceFetchedAt,
        result.postcardBody,
      );

      this.db.prepare(`
        INSERT OR IGNORE INTO journey_postcards (
          journey_id, user_id, headline, body, question_title, question_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        journeyId,
        userId,
        headline,
        result.postcardBody,
        question?.title ?? null,
        question?.url ?? null,
        latest.return_at,
      );

      if (question && artifactId) {
        this.db.prepare(`
          INSERT OR IGNORE INTO return_artifacts (
            id, owner_user_id, origin_journey_id, type, title,
            source_url, source_key, created_at
          ) VALUES (?, ?, ?, 'QUESTION_TICKET', ?, ?, ?, ?)
        `).run(
          artifactId,
          userId,
          journeyId,
          question.title,
          question.url,
          question.url,
          latest.return_at,
        );
      }

      this.db.prepare(`
        UPDATE journeys
        SET state = 'RETURNED', materialized_at = ?, returned_at = ?
        WHERE id = ? AND user_id = ? AND materialized_at IS NULL
      `).run(materializedAt, latest.return_at, journeyId, userId);
      this.db.exec("COMMIT;");
    } catch (error) {
      try {
        this.db.exec("ROLLBACK;");
      } catch {
        // No active transaction.
      }
      throw error;
    }
  }

  private toView(row: JourneyRow): JourneyView {
    const question = questionFromRow(row);
    return {
      id: row.id,
      state: row.state,
      routeBias: row.route_bias,
      createdAt: row.created_at,
      departAt: row.depart_at,
      returnAt: row.return_at,
      contentSource: row.content_source,
      knowledgeSource: row.knowledge_source,
      sourceFetchedAt: row.source_fetched_at,
      question,
      postcard:
        row.postcard_headline && row.postcard_body
          ? {
              headline: row.postcard_headline,
              body: row.postcard_body,
              question,
            }
          : null,
      artifact: artifactFromRow(row),
    };
  }

  private readCurrentRow(userId: string): JourneyRow | null {
    return this.readRow(userId, null, true);
  }

  private readRow(userId: string, journeyId: string | null, currentOnly: boolean): JourneyRow | null {
    const row = this.db.prepare(`
      SELECT
        j.id, j.user_id, j.state, j.route_bias, j.created_at, j.depart_at,
        j.return_at, j.plan_seed, j.materialized_at,
        l.content_source, l.knowledge_source, l.source_fetched_at,
        l.question_title, l.question_url, l.question_summary, l.question_thumbnail_url,
        p.headline AS postcard_headline, p.body AS postcard_body,
        a.id AS artifact_id, a.type AS artifact_type,
        a.title AS artifact_title, a.source_url AS artifact_source_url
      FROM journeys j
      LEFT JOIN journey_logs l ON l.journey_id = j.id
      LEFT JOIN journey_postcards p ON p.journey_id = j.id
      LEFT JOIN return_artifacts a ON a.origin_journey_id = j.id
      WHERE j.user_id = ?
        ${journeyId ? "AND j.id = ?" : ""}
        ${currentOnly ? "AND j.archived_at IS NULL" : ""}
      ORDER BY j.created_at DESC
      LIMIT 1
    `).get(...(journeyId ? [userId, journeyId] : [userId])) as JourneyRow | undefined;
    return row ?? null;
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS journeys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        state TEXT NOT NULL CHECK (state IN ('PREPARING', 'AWAY', 'RETURNED')),
        route_bias TEXT,
        created_at INTEGER NOT NULL,
        depart_at INTEGER NOT NULL,
        return_at INTEGER NOT NULL,
        plan_seed TEXT NOT NULL,
        engine_version TEXT NOT NULL,
        materialized_at INTEGER,
        returned_at INTEGER,
        archived_at INTEGER
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_journeys_one_current_per_user
        ON journeys(user_id) WHERE archived_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_journeys_user_created
        ON journeys(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS journey_logs (
        journey_id TEXT PRIMARY KEY REFERENCES journeys(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        completed_at INTEGER NOT NULL,
        question_title TEXT,
        question_url TEXT,
        question_summary TEXT,
        question_thumbnail_url TEXT,
        content_source TEXT NOT NULL,
        knowledge_source TEXT NOT NULL,
        source_fetched_at INTEGER NOT NULL,
        result_summary TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journey_postcards (
        journey_id TEXT PRIMARY KEY REFERENCES journeys(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        headline TEXT NOT NULL,
        body TEXT NOT NULL,
        question_title TEXT,
        question_url TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS return_artifacts (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        origin_journey_id TEXT NOT NULL UNIQUE REFERENCES journeys(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN (
          'QUESTION_TICKET', 'OPINION_FRAGMENT', 'RELATION_TICKET',
          'NEW_SCENT', 'ODDITY_SPECIMEN'
        )),
        title TEXT NOT NULL,
        source_url TEXT NOT NULL,
        source_key TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(owner_user_id, type, source_key)
      );
    `);
  }
}
