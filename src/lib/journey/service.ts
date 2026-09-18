import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { resolveDatabasePath } from "@/lib/persistence/database-path";

import {
  HOME_PASSIVE_LEAF_CAP,
  HOME_PASSIVE_LEAF_INTERVAL_MS,
  ONBOARDING_LEAVES,
  PRIMARY_TOOLS,
  PRIMARY_TOOL_BY_ID,
  SMALL_ITEMS,
  SMALL_ITEM_BY_ID,
  type HomeActivityType,
  type JourneyKind,
  type PrimaryToolId,
  type SmallItemId,
} from "./game";
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
  WaitingGameStateView,
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
  journey_kind: JourneyKind;
  primary_tool_id: PrimaryToolId | null;
  small_item_id: SmallItemId | null;
  small_item_consumed_at: number | null;
  reward_leaves: number | null;
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
  queued_ready: number;
}

interface WaitingGameWalletRow {
  balance: number;
  pending_home: number;
  home_active_since: number | null;
  home_remainder_ms: number;
}

interface WaitingGameLoadoutRow {
  primary_tool_id: PrimaryToolId | null;
  small_item_id: SmallItemId | null;
}

interface WaitingGameHomeActivityRow {
  activity: HomeActivityType;
  started_at: number;
  ends_at: number;
  seed: string;
}

interface AtlasRow {
  journey_id: string;
  route_bias: string | null;
  completed_at: number;
  reward_leaves: number | null;
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
const HOUR = 60 * MINUTE;
const MAX_OFFLINE_COMPLETIONS = 2;

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

function journeyPlan(input: {
  sequence: number;
  seed: string;
  timeScale: number;
  previousWasFar: boolean;
  smallItemId: SmallItemId | null;
}): { kind: JourneyKind; durationMs: number } {
  if (input.sequence <= 1) {
    return {
      kind: "WARMUP",
      durationMs: scaleMs(rangedMs(input.seed, 2 * MINUTE, 3 * MINUTE), input.timeScale),
    };
  }
  if (input.sequence === 2) {
    return {
      kind: "WARMUP",
      durationMs: scaleMs(rangedMs(input.seed, 3 * MINUTE, 5 * MINUTE), input.timeScale),
    };
  }

  const roll = hashString(`${input.seed}:duration-band`) % 100;
  const farCutoff = input.smallItemId === "pocket_calendar" ? 92 : 95;
  const longCutoff = input.smallItemId === "pocket_calendar" ? 75 : 80;

  if (!input.previousWasFar && roll >= farCutoff) {
    return {
      kind: "FAR",
      durationMs: scaleMs(rangedMs(`${input.seed}:far`, 2 * HOUR, 6 * HOUR), input.timeScale),
    };
  }
  if (roll >= longCutoff) {
    return {
      kind: "NORMAL",
      durationMs: scaleMs(rangedMs(`${input.seed}:long`, 90 * MINUTE, 180 * MINUTE), input.timeScale),
    };
  }
  return {
    kind: "NORMAL",
    durationMs: scaleMs(rangedMs(`${input.seed}:normal`, 30 * MINUTE, 90 * MINUTE), input.timeScale),
  };
}

function preparingDurationMs(sequence: number, seed: string, timeScale: number): number {
  if (sequence <= 2) return scaleMs(rangedMs(`${seed}:prepare`, 10_000, 30_000), timeScale);
  return scaleMs(rangedMs(`${seed}:prepare`, 2 * MINUTE, 8 * MINUTE), timeScale);
}

function restDurationMs(seed: string, timeScale: number): number {
  return scaleMs(rangedMs(`${seed}:rest`, 20 * MINUTE, 60 * MINUTE), timeScale);
}

function journeyLeafReward(kind: JourneyKind, seed: string): number {
  return kind === "FAR"
    ? 4 + (hashString(`${seed}:leaf-reward`) % 4)
    : 2 + (hashString(`${seed}:leaf-reward`) % 3);
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
    this.ensureGameState(userId, now);
    let completedThisRequest = 0;

    for (let guard = 0; guard < 12; guard += 1) {
      let row = this.readCurrentRow(userId);
      if (!row) {
        const userState = this.readUserState(userId);
        const eligible = userState.next_eligible_at === null || userState.next_eligible_at <= now;
        if (userState.queued_ready === 1 && eligible) {
          this.createJourney(
            userId,
            userState.queued_route_bias,
            userState.next_eligible_at ?? now,
          );
          continue;
        }
        return this.homeProjection(userId, now);
      }

      if (row.state === "PREPARING") {
        if (now >= row.depart_at) {
          this.syncHomeAccrual(userId, row.depart_at, false);
          this.consumeJourneySmallItem(row, userId);
          this.db.prepare(`
            UPDATE journeys SET state = 'AWAY'
            WHERE id = ? AND user_id = ? AND state = 'PREPARING'
          `).run(row.id, userId);
          row = this.readCurrentRow(userId) ?? row;
        } else {
          this.syncHomeAccrual(userId, now, true);
        }
      } else if (row.state === "AWAY") {
        this.syncHomeAccrual(userId, Math.min(now, row.return_at), false);
      } else {
        this.syncHomeAccrual(userId, now, true);
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
        if (userState.next_eligible_at !== null && userState.next_eligible_at <= now) {
          this.archiveJourney(row.id, userId, userState.next_eligible_at);
          continue;
        }
      }

      const userState = this.readUserState(userId);
      const homeActive = row.state !== "AWAY";
      return {
        state: row.state,
        journey: this.toView(row),
        resting: false,
        queuedJourney: userState.queued_ready === 1,
        queuedRouteBias: userState.queued_route_bias,
        nextJourneyAt: userState.next_eligible_at,
        game: this.readGameState(userId, now, {
          homeActive,
          includeActivity: false,
        }),
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

  async collectHomeLeaves(
    userId: string,
    oauthAccessToken: string,
  ): Promise<JourneyProjection> {
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "AT_HOME") throw new Error("cat is not at home");
    const pending = current.game.leaves.pendingHome;
    if (pending > 0) {
      const now = this.now();
      this.db.prepare(`
        UPDATE waiting_game_wallets
        SET balance = balance + ?, pending_home = 0, home_active_since = ?, updated_at = ?
        WHERE user_id = ?
      `).run(pending, now, now, userId);
    }
    return this.homeProjection(userId, this.now());
  }

  async buySupply(
    userId: string,
    oauthAccessToken: string,
    supplyId: SmallItemId,
  ): Promise<JourneyProjection> {
    const definition = SMALL_ITEM_BY_ID[supplyId];
    if (!definition) throw new Error("unknown supply");
    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "AT_HOME") throw new Error("cat is not at home");
    if (current.game.leaves.balance < definition.price) throw new Error("not enough inspiration leaves");

    const now = this.now();
    try {
      this.db.exec("BEGIN IMMEDIATE;");
      const debit = this.db.prepare(`
        UPDATE waiting_game_wallets
        SET balance = balance - ?, updated_at = ?
        WHERE user_id = ? AND balance >= ?
      `).run(definition.price, now, userId, definition.price);
      if (Number(debit.changes) === 0) throw new Error("not enough inspiration leaves");
      this.db.prepare(`
        INSERT INTO waiting_game_supplies (user_id, supply_id, quantity, updated_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(user_id, supply_id) DO UPDATE SET
          quantity = quantity + 1,
          updated_at = excluded.updated_at
      `).run(userId, supplyId, now);
      this.db.exec("COMMIT;");
    } catch (error) {
      try {
        this.db.exec("ROLLBACK;");
      } catch {
        // No active transaction.
      }
      throw error;
    }
    return this.homeProjection(userId, now);
  }

  async setLoadout(
    userId: string,
    oauthAccessToken: string,
    input: {
      primaryToolId: PrimaryToolId | null;
      smallItemId: SmallItemId | null;
    },
  ): Promise<JourneyProjection> {
    if (input.primaryToolId && !PRIMARY_TOOL_BY_ID[input.primaryToolId]) {
      throw new Error("unknown primary tool");
    }
    if (input.smallItemId && !SMALL_ITEM_BY_ID[input.smallItemId]) {
      throw new Error("unknown small item");
    }

    const current = await this.getProjection(userId, oauthAccessToken);
    if (current.state !== "AT_HOME") throw new Error("cat is not at home");

    if (input.primaryToolId) {
      const unlocked = current.game.primaryTools.some(
        (tool) => tool.id === input.primaryToolId && tool.unlocked,
      );
      if (!unlocked) throw new Error("primary tool is locked");
    }
    if (input.smallItemId) {
      const supply = current.game.supplies.find((item) => item.id === input.smallItemId);
      if (!supply || supply.quantity <= 0) throw new Error("small item is out of stock");
    }

    const now = this.now();
    this.db.prepare(`
      INSERT INTO waiting_game_loadouts (
        user_id, primary_tool_id, small_item_id, updated_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        primary_tool_id = excluded.primary_tool_id,
        small_item_id = excluded.small_item_id,
        updated_at = excluded.updated_at
    `).run(userId, input.primaryToolId, input.smallItemId, now);
    return this.homeProjection(userId, now);
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
        r.inspiration_leaves AS reward_leaves,
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
      LEFT JOIN journey_rewards r ON r.journey_id = l.journey_id
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
        inspirationLeaves: row.reward_leaves ?? 0,
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
        primaryToolId: row.primary_tool_id,
        smallItemId: row.small_item_id,
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
    const planSeed = `${id}:journey-v2:${sequence}`;
    this.ensureGameState(userId, scheduledAt);

    const loadout = this.db.prepare(`
      SELECT primary_tool_id, small_item_id
      FROM waiting_game_loadouts WHERE user_id = ?
    `).get(userId) as unknown as WaitingGameLoadoutRow;
    let smallItemId = loadout.small_item_id;
    if (smallItemId) {
      const stock = this.db.prepare(`
        SELECT quantity FROM waiting_game_supplies
        WHERE user_id = ? AND supply_id = ?
      `).get(userId, smallItemId) as { quantity: number } | undefined;
      if (!stock || Number(stock.quantity) <= 0) {
        smallItemId = null;
        this.db.prepare(`
          UPDATE waiting_game_loadouts SET small_item_id = NULL, updated_at = ?
          WHERE user_id = ?
        `).run(this.now(), userId);
      }
    }

    const plan = journeyPlan({
      sequence,
      seed: planSeed,
      timeScale: this.timeScale,
      previousWasFar: this.previousJourneyWasFar(userId),
      smallItemId,
    });
    const preparingMs = preparingDurationMs(sequence, planSeed, this.timeScale);
    const departAt = scheduledAt + preparingMs;
    const returnAt = departAt + plan.durationMs;

    this.db.prepare(`
      INSERT INTO journeys (
        id, user_id, state, route_bias, journey_kind,
        primary_tool_id, small_item_id,
        created_at, depart_at, return_at, plan_seed, engine_version
      ) VALUES (?, ?, 'PREPARING', ?, ?, ?, ?, ?, ?, ?, ?, 'journey-v2')
    `).run(
      id,
      userId,
      routeBias,
      plan.kind,
      loadout.primary_tool_id,
      smallItemId,
      scheduledAt,
      departAt,
      returnAt,
      planSeed,
    );
    this.ensureUserState(userId);
    this.db.prepare(`
      UPDATE journey_user_state
      SET queued_route_bias = NULL, queued_ready = 0, next_eligible_at = NULL, updated_at = ?
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
    const oddityRoll = hashString(`${row.plan_seed}:oddity`) % 100;
    const oddityChance = row.small_item_id === "luck_charm" ? 40 : 15;
    const artifactSeed = result.returnArtifact ?? (question
      ? {
          type: "QUESTION_TICKET" as const,
          title: question.title,
          sourceUrl: question.url,
          sourceKey: question.url,
        }
      : oddityRoll < oddityChance
        ? {
            type: "ODDITY_SPECIMEN" as const,
            title: "一枚没写名字的小纸片",
            sourceUrl: "/atlas",
            sourceKey: `oddity:${journeyId}`,
          }
        : null);
    const artifactId = artifactSeed ? this.createId() : null;
    const memoryId = question ? this.createId() : null;
    const nextEligibleAt = row.return_at + restDurationMs(row.plan_seed, this.timeScale);
    const rewardLeaves = journeyLeafReward(row.journey_kind, row.plan_seed);
    this.ensureGameState(userId, row.return_at);

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

      const rewardInsert = this.db.prepare(`
        INSERT OR IGNORE INTO journey_rewards (
          journey_id, user_id, inspiration_leaves, created_at
        ) VALUES (?, ?, ?, ?)
      `).run(journeyId, userId, rewardLeaves, latest.return_at);
      if (Number(rewardInsert.changes) > 0) {
        this.db.prepare(`
          UPDATE waiting_game_wallets
          SET balance = balance + ?, updated_at = ?
          WHERE user_id = ?
        `).run(rewardLeaves, latest.return_at, userId);
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
      this.syncHomeAccrual(userId, latest.return_at, true);
    } catch (error) {
      try {
        this.db.exec("ROLLBACK;");
      } catch {
        // No active transaction.
      }
      throw error;
    }
  }

  private consumeJourneySmallItem(row: JourneyRow, userId: string): void {
    if (!row.small_item_id || row.small_item_consumed_at !== null) return;

    try {
      this.db.exec("BEGIN IMMEDIATE;");
      const latest = this.db.prepare(`
        SELECT small_item_id, small_item_consumed_at
        FROM journeys
        WHERE id = ? AND user_id = ? AND state = 'PREPARING'
      `).get(row.id, userId) as {
        small_item_id: SmallItemId | null;
        small_item_consumed_at: number | null;
      } | undefined;
      if (!latest?.small_item_id || latest.small_item_consumed_at !== null) {
        this.db.exec("COMMIT;");
        return;
      }

      const consumed = this.db.prepare(`
        UPDATE waiting_game_supplies
        SET quantity = quantity - 1, updated_at = ?
        WHERE user_id = ? AND supply_id = ? AND quantity > 0
      `).run(row.depart_at, userId, latest.small_item_id);

      if (Number(consumed.changes) > 0) {
        this.db.prepare(`
          UPDATE journeys
          SET small_item_consumed_at = ?
          WHERE id = ? AND user_id = ?
        `).run(row.depart_at, row.id, userId);
      } else {
        this.db.prepare(`
          UPDATE journeys
          SET small_item_id = NULL, small_item_consumed_at = ?
          WHERE id = ? AND user_id = ?
        `).run(row.depart_at, row.id, userId);
      }

      this.db.prepare(`
        UPDATE waiting_game_loadouts
        SET small_item_id = CASE WHEN small_item_id = ? THEN NULL ELSE small_item_id END,
            updated_at = ?
        WHERE user_id = ?
      `).run(latest.small_item_id, row.depart_at, userId);
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
      SET next_eligible_at = ?, queued_route_bias = NULL, queued_ready = 0, updated_at = ?
      WHERE user_id = ?
    `).run(now + restDurationMs(`${seed}:catch-up-cap`, this.timeScale), now, userId);
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
        SET queued_route_bias = ?, queued_ready = 1, next_eligible_at = ?, updated_at = ?
        WHERE user_id = ?
      `).run(routeBias, nextEligibleAt, this.now(), userId);
      return;
    }
    this.db.prepare(`
      UPDATE journey_user_state
      SET queued_route_bias = ?, queued_ready = 1, updated_at = ?
      WHERE user_id = ?
    `).run(routeBias, this.now(), userId);
  }

  private ensureUserState(userId: string): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO journey_user_state (
        user_id, next_eligible_at, queued_route_bias, queued_ready, updated_at
      ) VALUES (?, NULL, NULL, 0, ?)
    `).run(userId, this.now());
  }

  private readUserState(userId: string): JourneyUserStateRow {
    this.ensureUserState(userId);
    return this.db.prepare(`
      SELECT next_eligible_at, queued_route_bias, queued_ready
      FROM journey_user_state WHERE user_id = ?
    `).get(userId) as unknown as JourneyUserStateRow;
  }

  private countCompletedJourneys(userId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) AS count FROM journey_logs WHERE user_id = ?
    `).get(userId) as { count: number };
    return Number(row.count);
  }

  private previousJourneyWasFar(userId: string): boolean {
    const row = this.db.prepare(`
      SELECT journey_kind FROM journeys
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId) as { journey_kind?: JourneyKind } | undefined;
    return row?.journey_kind === "FAR";
  }

  private ensureGameState(userId: string, now: number): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO waiting_game_wallets (
        user_id, balance, passive_anchor_at, pending_home,
        home_active_since, home_remainder_ms, updated_at
      ) VALUES (?, ?, ?, 0, ?, 0, ?)
    `).run(userId, ONBOARDING_LEAVES, now, now, now);

    const completed = this.countCompletedJourneys(userId);
    for (const tool of PRIMARY_TOOLS) {
      if (completed < tool.unlockAtJourneys) continue;
      this.db.prepare(`
        INSERT OR IGNORE INTO waiting_game_primary_tools (user_id, tool_id, unlocked_at)
        VALUES (?, ?, ?)
      `).run(userId, tool.id, now);
    }

    this.db.prepare(`
      INSERT OR IGNORE INTO waiting_game_loadouts (
        user_id, primary_tool_id, small_item_id, updated_at
      ) VALUES (?, 'notebook', NULL, ?)
    `).run(userId, now);
  }

  private syncHomeAccrual(userId: string, at: number, homeActive: boolean): void {
    this.ensureGameState(userId, at);
    const wallet = this.db.prepare(`
      SELECT balance, pending_home, home_active_since, home_remainder_ms
      FROM waiting_game_wallets WHERE user_id = ?
    `).get(userId) as unknown as WaitingGameWalletRow;

    let pending = wallet.pending_home;
    let remainder = wallet.home_remainder_ms;
    if (wallet.home_active_since !== null && at >= wallet.home_active_since) {
      const elapsed = at - wallet.home_active_since + remainder;
      if (pending < HOME_PASSIVE_LEAF_CAP) {
        const earned = Math.min(
          HOME_PASSIVE_LEAF_CAP - pending,
          Math.floor(elapsed / HOME_PASSIVE_LEAF_INTERVAL_MS),
        );
        pending += earned;
        remainder = pending >= HOME_PASSIVE_LEAF_CAP
          ? 0
          : elapsed - earned * HOME_PASSIVE_LEAF_INTERVAL_MS;
      } else {
        remainder = 0;
      }
    }

    this.db.prepare(`
      UPDATE waiting_game_wallets
      SET pending_home = ?, home_active_since = ?, home_remainder_ms = ?, updated_at = ?
      WHERE user_id = ?
    `).run(pending, homeActive ? at : null, remainder, at, userId);
  }

  private resolveHomeActivity(
    userId: string,
    now: number,
    resting: boolean,
    restEndsAt: number | null,
  ): WaitingGameHomeActivityRow {
    const current = this.db.prepare(`
      SELECT activity, started_at, ends_at, seed
      FROM waiting_game_home_activity
      WHERE user_id = ?
    `).get(userId) as unknown as WaitingGameHomeActivityRow | undefined;

    if (resting) {
      const endsAt = restEndsAt ?? now + restDurationMs(`${userId}:resting`, this.timeScale);
      if (current?.activity === "RESTING" && current.ends_at === endsAt) return current;
      const latestReturn = this.db.prepare(`
        SELECT MAX(returned_at) AS returned_at FROM journeys WHERE user_id = ?
      `).get(userId) as { returned_at: number | null };
      const startedAt = Math.min(now, latestReturn.returned_at ?? now);
      const row: WaitingGameHomeActivityRow = {
        activity: "RESTING",
        started_at: startedAt,
        ends_at: endsAt,
        seed: `${userId}:rest:${startedAt}`,
      };
      this.db.prepare(`
        INSERT INTO waiting_game_home_activity (user_id, activity, started_at, ends_at, seed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          activity = excluded.activity,
          started_at = excluded.started_at,
          ends_at = excluded.ends_at,
          seed = excluded.seed
      `).run(userId, row.activity, row.started_at, row.ends_at, row.seed);
      return row;
    }

    if (current && current.activity !== "RESTING" && current.ends_at > now) return current;

    const activities: Exclude<HomeActivityType, "RESTING">[] = [
      "READING",
      "SORTING",
      "WINDOW_WATCHING",
      "IDLING",
    ];
    const seed = `${userId}:home:${this.countCompletedJourneys(userId)}:${now}`;
    const activity = activities[hashString(`${seed}:activity`) % activities.length]!;
    const endsAt = now + scaleMs(rangedMs(`${seed}:duration`, 8 * MINUTE, 25 * MINUTE), this.timeScale);
    const row: WaitingGameHomeActivityRow = {
      activity,
      started_at: now,
      ends_at: endsAt,
      seed,
    };
    this.db.prepare(`
      INSERT INTO waiting_game_home_activity (user_id, activity, started_at, ends_at, seed)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        activity = excluded.activity,
        started_at = excluded.started_at,
        ends_at = excluded.ends_at,
        seed = excluded.seed
    `).run(userId, row.activity, row.started_at, row.ends_at, row.seed);
    return row;
  }

  private readGameState(
    userId: string,
    now: number,
    options: {
      homeActive: boolean;
      includeActivity: boolean;
      resting?: boolean;
      restEndsAt?: number | null;
    },
  ): WaitingGameStateView {
    this.syncHomeAccrual(userId, now, options.homeActive);
    this.ensureGameState(userId, now);

    const wallet = this.db.prepare(`
      SELECT balance, pending_home, home_active_since, home_remainder_ms
      FROM waiting_game_wallets WHERE user_id = ?
    `).get(userId) as unknown as WaitingGameWalletRow;
    const loadout = this.db.prepare(`
      SELECT primary_tool_id, small_item_id
      FROM waiting_game_loadouts WHERE user_id = ?
    `).get(userId) as unknown as WaitingGameLoadoutRow;
    const unlocked = new Set(
      (this.db.prepare(`
        SELECT tool_id FROM waiting_game_primary_tools WHERE user_id = ?
      `).all(userId) as unknown as Array<{ tool_id: PrimaryToolId }>).map((row) => row.tool_id),
    );
    const quantities = new Map(
      (this.db.prepare(`
        SELECT supply_id, quantity FROM waiting_game_supplies WHERE user_id = ?
      `).all(userId) as unknown as Array<{ supply_id: SmallItemId; quantity: number }>)
        .map((row) => [row.supply_id, Number(row.quantity)] as const),
    );

    const activity = options.includeActivity
      ? this.resolveHomeActivity(
          userId,
          now,
          Boolean(options.resting),
          options.restEndsAt ?? null,
        )
      : null;

    return {
      leaves: {
        balance: Number(wallet.balance),
        pendingHome: Number(wallet.pending_home),
        passiveCap: HOME_PASSIVE_LEAF_CAP,
      },
      primaryTools: PRIMARY_TOOLS.map((tool) => ({
        id: tool.id,
        unlocked: unlocked.has(tool.id),
      })),
      supplies: SMALL_ITEMS.map((item) => ({
        id: item.id,
        quantity: quantities.get(item.id) ?? 0,
      })),
      loadout: {
        primaryToolId: loadout.primary_tool_id,
        smallItemId: loadout.small_item_id,
      },
      homeActivity: activity
        ? {
            type: activity.activity,
            startedAt: activity.started_at,
            endsAt: activity.ends_at,
          }
        : null,
    };
  }

  private homeProjection(userId: string, now: number): JourneyProjection {
    const state = this.readUserState(userId);
    const resting = state.next_eligible_at !== null && state.next_eligible_at > now;
    if (!resting && state.next_eligible_at !== null && state.queued_ready === 0) {
      this.db.prepare(`
        UPDATE journey_user_state SET next_eligible_at = NULL, updated_at = ?
        WHERE user_id = ?
      `).run(now, userId);
      state.next_eligible_at = null;
    }
    return {
      state: "AT_HOME",
      journey: null,
      resting,
      queuedJourney: state.queued_ready === 1,
      queuedRouteBias: state.queued_route_bias,
      nextJourneyAt: state.next_eligible_at,
      game: this.readGameState(userId, now, {
        homeActive: true,
        includeActivity: true,
        resting,
        restEndsAt: state.next_eligible_at,
      }),
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
      kind: row.journey_kind,
      primaryToolId: row.primary_tool_id,
      smallItemId: row.small_item_id,
      inspirationLeaves: row.reward_leaves,
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
        j.id, j.user_id, j.state, j.route_bias,
        j.journey_kind, j.primary_tool_id, j.small_item_id, j.small_item_consumed_at,
        j.created_at, j.depart_at, j.return_at, j.plan_seed, j.materialized_at,
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
        c.text_char_count AS conversation_text_char_count,
        r.inspiration_leaves AS reward_leaves
      FROM journeys j
      LEFT JOIN journey_logs l ON l.journey_id = j.id
      LEFT JOIN journey_postcards p ON p.journey_id = j.id
      LEFT JOIN return_artifacts a ON a.origin_journey_id = j.id
      LEFT JOIN journey_insights i ON i.journey_id = j.id
      LEFT JOIN journey_conversations c ON c.journey_id = j.id
      LEFT JOIN journey_rewards r ON r.journey_id = j.id
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
        journey_kind TEXT NOT NULL DEFAULT 'NORMAL',
        primary_tool_id TEXT,
        small_item_id TEXT,
        small_item_consumed_at INTEGER,
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
        queued_ready INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS waiting_game_wallets (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        balance INTEGER NOT NULL DEFAULT ${ONBOARDING_LEAVES},
        passive_anchor_at INTEGER NOT NULL,
        pending_home INTEGER NOT NULL DEFAULT 0,
        home_active_since INTEGER,
        home_remainder_ms INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS waiting_game_primary_tools (
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        tool_id TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, tool_id)
      );

      CREATE TABLE IF NOT EXISTS waiting_game_supplies (
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        supply_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, supply_id)
      );

      CREATE TABLE IF NOT EXISTS waiting_game_loadouts (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        primary_tool_id TEXT,
        small_item_id TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS waiting_game_home_activity (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        activity TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ends_at INTEGER NOT NULL,
        seed TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journey_rewards (
        journey_id TEXT PRIMARY KEY REFERENCES journeys(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        inspiration_leaves INTEGER NOT NULL CHECK (inspiration_leaves >= 0),
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_journey_rewards_user_created
        ON journey_rewards(user_id, created_at DESC);

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

    this.ensureColumn("journeys", "journey_kind", "TEXT NOT NULL DEFAULT 'NORMAL'");
    this.ensureColumn("journeys", "primary_tool_id", "TEXT");
    this.ensureColumn("journeys", "small_item_id", "TEXT");
    this.ensureColumn("journeys", "small_item_consumed_at", "INTEGER");
    this.ensureColumn("journey_user_state", "queued_ready", "INTEGER NOT NULL DEFAULT 0");
    this.db.exec(`
      UPDATE journey_user_state
      SET queued_ready = 1
      WHERE queued_route_bias IS NOT NULL AND queued_ready = 0
    `);
    this.ensureColumn("waiting_game_wallets", "pending_home", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("waiting_game_wallets", "home_active_since", "INTEGER");
    this.ensureColumn("waiting_game_wallets", "home_remainder_ms", "INTEGER NOT NULL DEFAULT 0");
  }

  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{ name: string }>;
    if (columns.some((item) => item.name === column)) return;
    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
