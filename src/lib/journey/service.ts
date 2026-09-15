import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { resolveDatabasePath } from "@/lib/persistence/database-path";

import type {
  JourneyAtlasEntry,
  JourneyAtlasView,
  JourneyConversation,
  JourneyDiscoverer,
  JourneyDiscoveryResult,
  JourneyInsight,
  JourneyInsightAction,
  JourneyInsightFeedback,
  JourneyPostcard,
  JourneyProjection,
  JourneyQuestion,
  JourneyView,
  PersonaMemoryView,
  ReturnArtifact,
} from "./types";
import { createFallbackJourneyInsight } from "./insight";

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
  insight_headline: string | null;
  insight_body: string | null;
  insight_why_it_matters: string | null;
  insight_evidence_summary: string | null;
  insight_interaction_question: string | null;
  insight_options_json: string | null;
  insight_text_char_count: number | null;
  insight_model: string | null;
  insight_prompt_version: string | null;
  insight_feedback_action: JourneyInsightAction | null;
  conversation_kind: JourneyConversation["kind"] | null;
  conversation_participant_id: string | null;
  conversation_participant_name: string | null;
  conversation_turns_json: string | null;
  conversation_source_label: string | null;
  conversation_text_char_count: number | null;
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
  insight_headline: string | null;
  insight_body: string | null;
  insight_why_it_matters: string | null;
  insight_evidence_summary: string | null;
  insight_interaction_question: string | null;
  insight_options_json: string | null;
  insight_text_char_count: number | null;
  insight_model: string | null;
  insight_prompt_version: string | null;
  insight_feedback_action: JourneyInsightAction | null;
  conversation_kind: JourneyConversation["kind"] | null;
  conversation_participant_id: string | null;
  conversation_participant_name: string | null;
  conversation_turns_json: string | null;
  conversation_source_label: string | null;
  conversation_text_char_count: number | null;
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
  // Journeys should feel alive during a short product session, not disappear for tens of minutes.
  if (sequence <= 1) return scaleMs(rangedMs(seed, 1 * MINUTE, 2 * MINUTE), timeScale);
  if (sequence === 2) return scaleMs(rangedMs(seed, 2 * MINUTE, 4 * MINUTE), timeScale);
  if (sequence === 3) return scaleMs(rangedMs(seed, 3 * MINUTE, 6 * MINUTE), timeScale);
  return scaleMs(rangedMs(seed, 5 * MINUTE, 10 * MINUTE), timeScale);
}

function restDurationMs(seed: string, timeScale: number, sequence: number): number {
  if (sequence <= 1) return scaleMs(rangedMs(`${seed}:rest`, 30_000, 1 * MINUTE), timeScale);
  if (sequence === 2) return scaleMs(rangedMs(`${seed}:rest`, 45_000, 90_000), timeScale);
  if (sequence === 3) return scaleMs(rangedMs(`${seed}:rest`, 1 * MINUTE, 2 * MINUTE), timeScale);
  return scaleMs(rangedMs(`${seed}:rest`, 2 * MINUTE, 5 * MINUTE), timeScale);
}

function routePostcardFallback(seed: string, routeBias: string | null) {
  const route = routeBias ?? "随便逛";
  const variants = [
    {
      headline: `「${route}」被它记进了旅行册。`,
      body: `这一趟，它把你塞进包里的「${route}」做成了一张路线札记。下一次再沿这条线出去时，这段旅程会继续往下长。`,
    },
    {
      headline: "包里多了一张路线札记。",
      body: `它回来时把「${route}」折成了一张小纸片，和这一趟的时间一起夹进旅行册。`,
    },
    {
      headline: `这趟留下了「${route}」。`,
      body: `纸条不只是出门前的提示；回来以后，它也成了这次旅程的一部分。它把「${route}」原样收进了旅行册。`,
    },
  ];
  const selected = variants[hashString(`${seed}:route-copy`) % variants.length]!;
  return { postcardHeadline: selected.headline, postcardBody: selected.body };
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

function insightFromRow(row: Pick<
  JourneyRow,
  | "insight_headline"
  | "insight_body"
  | "insight_why_it_matters"
  | "insight_evidence_summary"
  | "insight_interaction_question"
  | "insight_options_json"
  | "insight_text_char_count"
  | "insight_model"
  | "insight_prompt_version"
  | "insight_feedback_action"
>): JourneyInsight | null {
  if (
    !row.insight_headline || !row.insight_body || !row.insight_why_it_matters ||
    !row.insight_evidence_summary || !row.insight_interaction_question ||
    !row.insight_options_json || row.insight_text_char_count === null ||
    !row.insight_model || !row.insight_prompt_version
  ) return null;
  try {
    const options = JSON.parse(row.insight_options_json) as JourneyInsight["options"];
    if (!Array.isArray(options) || options.length !== 3) return null;
    return {
      headline: row.insight_headline,
      insight: row.insight_body,
      whyItMatters: row.insight_why_it_matters,
      evidenceSummary: row.insight_evidence_summary,
      interactionQuestion: row.insight_interaction_question,
      options,
      textCharCount: row.insight_text_char_count,
      model: row.insight_model,
      promptVersion: row.insight_prompt_version,
      feedbackAction: row.insight_feedback_action,
    };
  } catch {
    return null;
  }
}

function conversationFromRow(row: Pick<
  JourneyRow,
  | "conversation_kind"
  | "conversation_participant_id"
  | "conversation_participant_name"
  | "conversation_turns_json"
  | "conversation_source_label"
  | "conversation_text_char_count"
>): JourneyConversation | null {
  if (
    !row.conversation_kind || !row.conversation_participant_id || !row.conversation_participant_name ||
    !row.conversation_turns_json || !row.conversation_source_label || row.conversation_text_char_count === null
  ) return null;
  try {
    const turns = JSON.parse(row.conversation_turns_json) as JourneyConversation["turns"];
    if (!Array.isArray(turns) || turns.length < 2) return null;
    return {
      kind: row.conversation_kind,
      participantId: row.conversation_participant_id,
      participantName: row.conversation_participant_name,
      turns,
      sourceLabel: row.conversation_source_label,
      textCharCount: row.conversation_text_char_count,
    };
  } catch {
    return null;
  }
}

export class JourneyService {
  private readonly db: DatabaseSync;
  private readonly now: () => number;
  private readonly createId: () => string;
  private readonly timeScale: number;
  private readonly materializationInFlight = new Map<string, Promise<boolean>>();

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
        if (journeyCount > 0 && journeyCount <= 3 && userState.queued_route_bias) {
          this.createJourney(userId, userState.queued_route_bias, now);
          continue;
        }
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
        const didMaterialize = await this.ensureMaterialized(userId, oauthAccessToken, row, now);
        if (didMaterialize) completedThisRequest += 1;
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
    if (current.resting) {
      this.setQueuedRouteBias(userId, routeBias, current.nextJourneyAt ?? undefined);
      return this.homeProjection(userId, this.now());
    }

    const now = this.now();
    this.createJourney(userId, routeBias, now);
    return this.getProjection(userId, oauthAccessToken);
  }

  async archive(userId: string, oauthAccessToken: string): Promise<JourneyProjection> {
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "RETURNED" || !current.journey) return current;
    this.archiveJourney(current.journey.id, userId, this.now());
    return this.getProjection(userId, oauthAccessToken);
  }

  async respondToInsight(
    userId: string,
    oauthAccessToken: string,
    journeyId: string,
    action: JourneyInsightAction,
  ): Promise<JourneyProjection> {
    await this.getProjection(userId, oauthAccessToken);
    const result = this.db.prepare(`
      UPDATE journey_insights
      SET feedback_action = ?, feedback_at = ?
      WHERE journey_id = ? AND user_id = ?
    `).run(action, this.now(), journeyId, userId);
    if (Number(result.changes) === 0) throw new Error("journey insight not found");
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
        a.title AS artifact_title, a.source_url AS artifact_source_url,
        i.headline AS insight_headline, i.insight AS insight_body,
        i.why_it_matters AS insight_why_it_matters,
        i.evidence_summary AS insight_evidence_summary,
        i.interaction_question AS insight_interaction_question,
        i.options_json AS insight_options_json,
        i.text_char_count AS insight_text_char_count,
        i.model AS insight_model, i.prompt_version AS insight_prompt_version,
        i.feedback_action AS insight_feedback_action,
        c.kind AS conversation_kind,
        c.participant_id AS conversation_participant_id,
        c.participant_name AS conversation_participant_name,
        c.turns_json AS conversation_turns_json,
        c.source_label AS conversation_source_label,
        c.text_char_count AS conversation_text_char_count
      FROM journey_logs l
      JOIN journeys j ON j.id = l.journey_id
      JOIN journey_postcards p ON p.journey_id = l.journey_id
      LEFT JOIN return_artifacts a ON a.origin_journey_id = l.journey_id
      LEFT JOIN journey_insights i ON i.journey_id = l.journey_id
      LEFT JOIN journey_conversations c ON c.journey_id = l.journey_id
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
        insight: insightFromRow(row),
        conversation: conversationFromRow(row),
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

  private async ensureMaterialized(
    userId: string,
    oauthAccessToken: string,
    row: JourneyRow,
    now: number,
  ): Promise<boolean> {
    const existing = this.materializationInFlight.get(row.id);
    if (existing) {
      await existing;
      return false;
    }

    const pending = (async () => {
      const latest = this.readRow(userId, row.id, true);
      if (!latest || latest.materialized_at !== null) return false;
      const result = await this.discoverOrEmpty(userId, oauthAccessToken, latest, now);
      this.materialize(latest.id, userId, result, now);
      return true;
    })();
    this.materializationInFlight.set(row.id, pending);
    try {
      return await pending;
    } finally {
      if (this.materializationInFlight.get(row.id) === pending) {
        this.materializationInFlight.delete(row.id);
      }
    }
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
        recentInsightFeedback: this.readRecentInsightFeedback(userId),
      });
    } catch {
      const fallback = routePostcardFallback(row.plan_seed, row.route_bias);
      return {
        question: null,
        contentSource: "none",
        knowledgeSource: "template",
        sourceFetchedAt: now,
        ...fallback,
        insight: createFallbackJourneyInsight(row.route_bias),
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
      UPDATE journey_user_state
      SET queued_route_bias = NULL, next_eligible_at = NULL, updated_at = ?
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
    const headline = result.postcardHeadline ?? (question ? "带回一张问题票。" : "它对你多懂了一点。");
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
    const sequence = this.countJourneys(userId);
    const nextEligibleAt = row.return_at + restDurationMs(row.plan_seed, this.timeScale, sequence);

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

      if (result.insight) {
        this.db.prepare(`
          INSERT OR IGNORE INTO journey_insights (
            journey_id, user_id, prompt_version, facts_json, headline, insight,
            why_it_matters, evidence_summary, interaction_question, options_json,
            text_char_count, model, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          journeyId,
          userId,
          result.insight.promptVersion,
          result.insight.factsJson,
          result.insight.headline,
          result.insight.insight,
          result.insight.whyItMatters,
          result.insight.evidenceSummary,
          result.insight.interactionQuestion,
          JSON.stringify(result.insight.options),
          result.insight.textCharCount,
          result.insight.model,
          latest.return_at,
        );
      }

      if (result.conversation) {
        this.db.prepare(`
          INSERT OR IGNORE INTO journey_conversations (
            journey_id, user_id, kind, participant_id, participant_name,
            turns_json, source_label, text_char_count, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          journeyId,
          userId,
          result.conversation.kind,
          result.conversation.participantId,
          result.conversation.participantName,
          JSON.stringify(result.conversation.turns),
          result.conversation.sourceLabel,
          result.conversation.textCharCount,
          latest.return_at,
        );
      }

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
    const sequence = this.countJourneys(userId);
    this.db.prepare(`
      UPDATE journey_user_state
      SET next_eligible_at = ?, queued_route_bias = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(now + restDurationMs(`${seed}:catch-up-cap`, this.timeScale, sequence), now, userId);
  }

  private setQueuedRouteBias(
    userId: string,
    routeBias: string | null,
    nextEligibleAt?: number,
  ): void {
    this.ensureUserState(userId);
    if (typeof nextEligibleAt === "number") {
      this.db.prepare(`
        UPDATE journey_user_state
        SET queued_route_bias = ?, next_eligible_at = ?, updated_at = ?
        WHERE user_id = ?
      `).run(routeBias, nextEligibleAt, this.now(), userId);
      return;
    }
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

  private readRecentInsightFeedback(userId: string): JourneyInsightFeedback[] {
    const rows = this.db.prepare(`
      SELECT feedback_action, facts_json
      FROM journey_insights
      WHERE user_id = ? AND feedback_action IS NOT NULL
      ORDER BY COALESCE(feedback_at, created_at) DESC
      LIMIT 6
    `).all(userId) as unknown as Array<{
      feedback_action: JourneyInsightAction;
      facts_json: string;
    }>;
    return rows.flatMap((row) => {
      try {
        const facts = JSON.parse(row.facts_json) as {
          insightTopic?: unknown;
          zhihuComposition?: { primaryInterest?: unknown };
        };
        const explicitTopic = facts.insightTopic;
        const legacyTopic = facts.zhihuComposition?.primaryInterest;
        const topic = typeof explicitTopic === "string" && explicitTopic.trim()
          ? explicitTopic
          : legacyTopic;
        return typeof topic === "string" && topic.trim()
          ? [{ action: row.feedback_action, topic: topic.trim() }]
          : [];
      } catch {
        return [];
      }
    });
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
      insight: insightFromRow(row),
      conversation: conversationFromRow(row),
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
        a.title AS artifact_title, a.source_url AS artifact_source_url,
        i.headline AS insight_headline, i.insight AS insight_body,
        i.why_it_matters AS insight_why_it_matters,
        i.evidence_summary AS insight_evidence_summary,
        i.interaction_question AS insight_interaction_question,
        i.options_json AS insight_options_json,
        i.text_char_count AS insight_text_char_count,
        i.model AS insight_model, i.prompt_version AS insight_prompt_version,
        i.feedback_action AS insight_feedback_action,
        c.kind AS conversation_kind,
        c.participant_id AS conversation_participant_id,
        c.participant_name AS conversation_participant_name,
        c.turns_json AS conversation_turns_json,
        c.source_label AS conversation_source_label,
        c.text_char_count AS conversation_text_char_count
      FROM journeys j
      LEFT JOIN journey_logs l ON l.journey_id = j.id
      LEFT JOIN journey_postcards p ON p.journey_id = j.id
      LEFT JOIN return_artifacts a ON a.origin_journey_id = j.id
      LEFT JOIN journey_insights i ON i.journey_id = j.id
      LEFT JOIN journey_conversations c ON c.journey_id = j.id
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

      CREATE TABLE IF NOT EXISTS journey_insights (
        journey_id TEXT PRIMARY KEY REFERENCES journeys(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        prompt_version TEXT NOT NULL,
        facts_json TEXT NOT NULL,
        headline TEXT NOT NULL,
        insight TEXT NOT NULL,
        why_it_matters TEXT NOT NULL,
        evidence_summary TEXT NOT NULL,
        interaction_question TEXT NOT NULL,
        options_json TEXT NOT NULL,
        text_char_count INTEGER NOT NULL,
        model TEXT NOT NULL,
        feedback_action TEXT CHECK (feedback_action IN (
          'CONFIRM_INTEREST', 'CORRECT_INTEREST', 'REDUCE_INTEREST'
        )),
        feedback_at INTEGER,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_journey_insights_user_created
        ON journey_insights(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS journey_conversations (
        journey_id TEXT PRIMARY KEY REFERENCES journeys(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('NPC', 'USER')),
        participant_id TEXT NOT NULL,
        participant_name TEXT NOT NULL,
        turns_json TEXT NOT NULL,
        source_label TEXT NOT NULL,
        text_char_count INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_journey_conversations_user_created
        ON journey_conversations(user_id, created_at DESC);

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

      UPDATE journey_logs
      SET result_summary = '这趟旅行被整理成了一张路线札记，和出门时的方向一起收进旅行册。'
      WHERE result_summary IN (
        '这趟没碰到值得带回来的新问题，但它还是按时回家了。',
        '这次没有留下能追溯到知乎原问题的新票根。旅行照样发生，只是这一页没有链接。',
        '旅行照样发生了，只是没有新的公开问题满足收录条件。这一趟只留下出门记录。'
      ) OR result_summary LIKE '没有新的知乎原问题被收进旅行册%';

      UPDATE journey_postcards
      SET headline = '带回一张旅行札记。',
          body = '这趟旅行被整理成了一张路线札记，和出门时的方向一起收进旅行册。'
      WHERE body IN (
        '这趟没碰到值得带回来的新问题，但它还是按时回家了。',
        '这次没有留下能追溯到知乎原问题的新票根。旅行照样发生，只是这一页没有链接。',
        '旅行照样发生了，只是没有新的公开问题满足收录条件。这一趟只留下出门记录。'
      ) OR body LIKE '没有新的知乎原问题被收进旅行册%'
         OR headline IN ('这一页先空着。', '这趟，包里没多一张票。', '没捡到新票根。', '没带新问题回来。');
    `);
  }
}
