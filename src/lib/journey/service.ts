import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { resolveDatabasePath } from "@/lib/persistence/database-path";

import type {
  JourneyAtlasEntry,
  JourneyAtlasView,
  JourneyDiscoverer,
  JourneyDiscoveryResult,
  JourneyPostcard,
  JourneyProjection,
  JourneyQuestion,
  JourneyView,
  PersonaMemoryView,
  ReturnArtifact,
} from "./types";

interface JourneyServiceOptions {
  dbPath?: string;
  now?: () => number;
  createId?: () => string;
  timeScale?: number;
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

interface JourneyUserStateRow {
  next_eligible_at: number | null;
  queued_route_bias: string | null;
}

interface AtlasRow {
  journey_id: string;
  route_bias: string | null;
  completed_at: number;
  content_source: "live" | "none";
  question_title: string | null;
  question_url: string | null;
  question_summary: string | null;
  question_thumbnail_url: string | null;
  postcard_headline: string;
  postcard_body: string;
  artifact_id: string | null;
  artifact_type: ReturnArtifact["type"] | null;
  artifact_title: string | null;
  artifact_source_url: string | null;
}

const MINUTE = 60_000;
const MAX_OFFLINE_COMPLETIONS = 3;

function hashString(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rangedMs(seed: string, minMs: number, maxMs: number): number {
  return minMs + (hashString(seed) % (maxMs - minMs + 1));
}

function scaleMs(value: number, timeScale: number): number {
  return Math.max(1_000, Math.round(value * timeScale));
}

function journeyDurationMs(sequence: number, seed: string, timeScale: number): number {
  if (sequence <= 1) return scaleMs(rangedMs(seed, 3 * MINUTE, 5 * MINUTE), timeScale);
  if (sequence === 2) return scaleMs(rangedMs(seed, 10 * MINUTE, 20 * MINUTE), timeScale);
  if (sequence === 3) return scaleMs(rangedMs(seed, 20 * MINUTE, 40 * MINUTE), timeScale);
  return scaleMs(rangedMs(seed, 30 * MINUTE, 90 * MINUTE), timeScale);
}

function restDurationMs(seed: string, timeScale: number): number {
  return scaleMs(rangedMs(`${seed}:rest`, 30 * MINUTE, 90 * MINUTE), timeScale);
}

function questionFromRow(row: Pick<JourneyRow, "question_title" | "question_url" | "question_summary" | "question_thumbnail_url">): JourneyQuestion | null {
  if (!row.question_title || !row.question_url) return null;
  return {
    title: row.question_title,
    url: row.question_url,
    summary: row.question_summary ?? "",
    ...(row.question_thumbnail_url ? { thumbnailUrl: row.question_thumbnail_url } : {}),
  };
}

function artifactFromRow(row: Pick<JourneyRow, "artifact_id" | "artifact_type" | "artifact_title" | "artifact_source_url">): ReturnArtifact | null {
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
  private readonly timeScale: number;

  constructor(private readonly options: JourneyServiceOptions) {
    const dbPath = resolveDatabasePath(options.dbPath);
    if (dbPath !== ":memory:") mkdirSync(path.dirname(dbPath), { recursive: true });
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
    this.timeScale = Math.min(1, Math.max(0.01, options.timeScale ?? 1));
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.ensureSchema();
  }

  async getProjection(userId: string, oauthAccessToken: string): Promise<JourneyProjection> {
    const now = this.now();
    let completedThisRequest = 0;

    for (let guard = 0; guard < 12; guard += 1) {
      let row = this.readCurrentRow(userId);
      if (!row) {
        const userState = this.readUserState(userId);
        const journeyCount = this.countJourneys(userId);
        if (
          journeyCount > 0 &&
          userState.next_eligible_at !== null &&
          userState.next_eligible_at <= now
        ) {
          this.createJourney(userId, userState.queued_route_bias, userState.next_eligible_at);
          continue;
        }
        return this.homeProjection(userId, now);
      }

      if (row.state === "PREPARING" && now >= row.depart_at) {
        this.db.prepare(`
          UPDATE journeys SET state = 'AWAY'
          WHERE id = ? AND user_id = ? AND state = 'PREPARING'
        `).run(row.id, userId);
        row = this.readCurrentRow(userId) ?? row;
      }

      if (now >= row.return_at && row.materialized_at === null) {
        const result = await this.discoverOrEmpty(userId, oauthAccessToken, row, now);
        this.materialize(row.id, userId, result, now);
        completedThisRequest += 1;
        row = this.readCurrentRow(userId) ?? row;

        if (completedThisRequest >= MAX_OFFLINE_COMPLETIONS) {
          this.archiveJourney(row.id, userId, now);
          this.deferAfterCatchUp(userId, now, row.plan_seed);
          return this.homeProjection(userId, now);
        }
      }

      if (row.state === "RETURNED") {
        const userState = this.readUserState(userId);
        if (
          userState.next_eligible_at !== null &&
          userState.next_eligible_at <= now
        ) {
          this.archiveJourney(row.id, userId, userState.next_eligible_at);
          this.createJourney(userId, userState.queued_route_bias, userState.next_eligible_at);
          continue;
        }
      }

      const userState = this.readUserState(userId);
      return {
        state: row.state,
        journey: this.toView(row),
        resting: false,
        queuedRouteBias: userState.queued_route_bias,
        nextJourneyAt: userState.next_eligible_at,
      };
    }

    throw new Error("Journey catch-up exceeded safety guard");
  }

  async start(
    userId: string,
    oauthAccessToken: string,
    routeBias: string | null,
  ): Promise<JourneyProjection> {
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "AT_HOME") return current;

    const now = this.now();
    const journeyCount = this.countJourneys(userId);
    if (journeyCount === 0) {
      this.createJourney(userId, routeBias, now);
      return this.getProjection(userId, oauthAccessToken);
    }

    const userState = this.readUserState(userId);
    if (userState.next_eligible_at !== null && userState.next_eligible_at > now) {
      this.setQueuedRouteBias(userId, routeBias);
      return this.homeProjection(userId, now);
    }

    this.createJourney(userId, routeBias, now);
    return this.getProjection(userId, oauthAccessToken);
  }

  async archive(userId: string, oauthAccessToken: string): Promise<JourneyProjection> {
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "RETURNED" || !current.journey) return current;
    this.archiveJourney(current.journey.id, userId, this.now());
    return this.getProjection(userId, oauthAccessToken);
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

  async getAtlas(userId: string, oauthAccessToken: string): Promise<JourneyAtlasView> {
    await this.getProjection(userId, oauthAccessToken);
    const rows = this.db.prepare(`
      SELECT
        j.id AS journey_id, j.route_bias,
        l.completed_at, l.content_source,
        l.question_title, l.question_url, l.question_summary, l.question_thumbnail_url,
        p.headline AS postcard_headline, p.body AS postcard_body,
        a.id AS artifact_id, a.type AS artifact_type,
        a.title AS artifact_title, a.source_url AS artifact_source_url
      FROM journey_logs l
      JOIN journeys j ON j.id = l.journey_id
      JOIN journey_postcards p ON p.journey_id = l.journey_id
      LEFT JOIN return_artifacts a ON a.origin_journey_id = l.journey_id
      WHERE l.user_id = ?
      ORDER BY l.completed_at DESC
      LIMIT 30
    `).all(userId) as unknown as AtlasRow[];

    const journeys: JourneyAtlasEntry[] = rows.map((row) => {
      const question = questionFromRow(row);
      const postcard: JourneyPostcard = {
        headline: row.postcard_headline,
        body: row.postcard_body,
        question,
      };
      return {
        journeyId: row.journey_id,
        completedAt: row.completed_at,
        routeBias: row.route_bias,
        postcard,
        artifact: artifactFromRow(row),
        contentSource: row.content_source,
      };
    });

    const memoryRows = this.db.prepare(`
      SELECT id, source_event_id, topic_ref, observation, created_at
      FROM persona_memories
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(userId) as unknown as Array<{
      id: string;
      source_event_id: string;
      topic_ref: string | null;
      observation: string;
      created_at: number;
    }>;
    const memories: PersonaMemoryView[] = memoryRows.map((row) => ({
      id: row.id,
      sourceEventId: row.source_event_id,
      topicRef: row.topic_ref,
      observation: row.observation,
      createdAt: row.created_at,
    }));

    return { journeys, memories };
  }

  close(): void {
    this.db.close();
  }

  private async discoverOrEmpty(
    userId: string,
    oauthAccessToken: string,
    row: JourneyRow,
    now: number,
  ): Promise<JourneyDiscoveryResult> {
    try {
      return await this.options.discover({
        userId,
        oauthAccessToken,
        routeBias: row.route_bias,
        planSeed: row.plan_seed,
        recentQuestionUrls: this.readRecentQuestionUrls(userId),
        recentMemoryTopicRefs: this.readRecentMemoryTopicRefs(userId),
      });
    } catch {
      return {
        question: null,
        contentSource: "none",
        knowledgeSource: "none",
        sourceFetchedAt: now,
        postcardBody: "这趟没碰到值得带回来的新问题，但它还是按时回家了。",
      };
    }
  }

  private createJourney(userId: string, routeBias: string | null, scheduledAt: number): void {
    const sequence = this.countJourneys(userId) + 1;
    const id = this.createId();
    const planSeed = `${id}:journey-v1:${sequence}`;
    const durationMs = journeyDurationMs(sequence, planSeed, this.timeScale);
    const preparingMs = scaleMs(rangedMs(`${planSeed}:prepare`, 15_000, 30_000), this.timeScale);

    this.db.prepare(`
      INSERT INTO journeys (
        id, user_id, state, route_bias, created_at, depart_at, return_at,
        plan_seed, engine_version
      ) VALUES (?, ?, 'PREPARING', ?, ?, ?, ?, ?, 'journey-v1')
    `).run(
      id,
      userId,
      routeBias,
      scheduledAt,
      scheduledAt + preparingMs,
      scheduledAt + durationMs,
      planSeed,
    );
    this.ensureUserState(userId);
    this.db.prepare(`
      UPDATE journey_user_state SET queued_route_bias = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(this.now(), userId);
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
    const artifactSeed = result.returnArtifact ?? (question
      ? {
          type: "QUESTION_TICKET" as const,
          title: question.title,
          sourceUrl: question.url,
          sourceKey: question.url,
        }
      : null);
    const artifactId = artifactSeed ? this.createId() : null;
    const memoryId = question ? this.createId() : null;
    const nextEligibleAt = row.return_at + restDurationMs(row.plan_seed, this.timeScale);

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

      if (artifactSeed && artifactId) {
        this.db.prepare(`
          INSERT OR IGNORE INTO return_artifacts (
            id, owner_user_id, origin_journey_id, type, title,
            source_url, source_key, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          artifactId,
          userId,
          journeyId,
          artifactSeed.type,
          artifactSeed.title,
          artifactSeed.sourceUrl,
          artifactSeed.sourceKey,
          latest.return_at,
        );
      }

      if (question && memoryId) {
        this.db.prepare(`
          INSERT OR IGNORE INTO persona_memories (
            id, user_id, type, source_event_id, topic_ref,
            observation, weight, created_at
          ) VALUES (?, ?, 'JOURNEY_TOPIC', ?, ?, ?, 1, ?)
        `).run(
          memoryId,
          userId,
          journeyId,
          question.url,
          `在一次旅途中停在「${question.title}」前。`,
          latest.return_at,
        );
      }

      this.db.prepare(`
        UPDATE journeys
        SET state = 'RETURNED', materialized_at = ?, returned_at = ?
        WHERE id = ? AND user_id = ? AND materialized_at IS NULL
      `).run(materializedAt, latest.return_at, journeyId, userId);

      this.db.prepare(`
        INSERT INTO journey_user_state (user_id, next_eligible_at, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          next_eligible_at = excluded.next_eligible_at,
          updated_at = excluded.updated_at
      `).run(userId, nextEligibleAt, materializedAt);
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

  private archiveJourney(journeyId: string, userId: string, archivedAt: number): void {
    this.db.prepare(`
      UPDATE journeys SET archived_at = ?
      WHERE id = ? AND user_id = ? AND state = 'RETURNED' AND archived_at IS NULL
    `).run(archivedAt, journeyId, userId);
  }

  private deferAfterCatchUp(userId: string, now: number, seed: string): void {
    this.ensureUserState(userId);
    this.db.prepare(`
      UPDATE journey_user_state
      SET next_eligible_at = ?, queued_route_bias = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(now + restDurationMs(`${seed}:catch-up-cap`, this.timeScale), now, userId);
  }

  private setQueuedRouteBias(userId: string, routeBias: string | null): void {
    this.ensureUserState(userId);
    this.db.prepare(`
      UPDATE journey_user_state SET queued_route_bias = ?, updated_at = ?
      WHERE user_id = ?
    `).run(routeBias, this.now(), userId);
  }

  private ensureUserState(userId: string): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO journey_user_state (user_id, next_eligible_at, updated_at)
      VALUES (?, NULL, ?)
    `).run(userId, this.now());
  }

  private readUserState(userId: string): JourneyUserStateRow {
    this.ensureUserState(userId);
    return this.db.prepare(`
      SELECT next_eligible_at, queued_route_bias
      FROM journey_user_state WHERE user_id = ?
    `).get(userId) as unknown as JourneyUserStateRow;
  }

  private homeProjection(userId: string, now: number): JourneyProjection {
    const state = this.readUserState(userId);
    return {
      state: "AT_HOME",
      journey: null,
      resting: state.next_eligible_at !== null && state.next_eligible_at > now,
      queuedRouteBias: state.queued_route_bias,
      nextJourneyAt: state.next_eligible_at,
    };
  }

  private readRecentQuestionUrls(userId: string): string[] {
    return (this.db.prepare(`
      SELECT question_url FROM journey_logs
      WHERE user_id = ? AND question_url IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 8
    `).all(userId) as unknown as Array<{ question_url: string }>).map((row) => row.question_url);
  }

  private readRecentMemoryTopicRefs(userId: string): string[] {
    return (this.db.prepare(`
      SELECT topic_ref FROM persona_memories
      WHERE user_id = ? AND topic_ref IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 8
    `).all(userId) as unknown as Array<{ topic_ref: string }>).map((row) => row.topic_ref);
  }

  private countJourneys(userId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) AS count FROM journeys WHERE user_id = ?
    `).get(userId) as { count: number };
    return Number(row.count);
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
          ? { headline: row.postcard_headline, body: row.postcard_body, question }
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

      CREATE TABLE IF NOT EXISTS journey_user_state (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        next_eligible_at INTEGER,
        queued_route_bias TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS persona_memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        source_event_id TEXT NOT NULL,
        topic_ref TEXT,
        observation TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        UNIQUE(user_id, type, source_event_id)
      );
    `);
  }
}
