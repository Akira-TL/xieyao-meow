import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { buildSocialSignals } from "./engine";
import type {
  PersonaRelationship,
  RelationshipState,
  SocialAgent,
  SocialSignals,
} from "./types";
import type {
  PersonaExperienceMemory,
  SocialDialogueRound,
  SocialDialogueTopic,
  SocialDialogueTurn,
} from "./dialogue";

export type PersonaSnapshotSource = "live" | "fallback";
export type EncounterStatus = "pending" | "completed" | "failed";

export interface PersonaSnapshot {
  userId: string;
  version: number;
  source: PersonaSnapshotSource;
  agent: SocialAgent;
  createdAt: number;
  updatedAt: number;
}

export interface PersonaCapsule {
  displayName: string;
  visualVariant?: string;
  certifiedTitle: string;
  interests: string[];
  personality: string[];
  answerStyle: SocialAgent["persona"]["answerStyle"];
}

export interface SharedEncounterProvenance {
  contentSource: "live" | "cached" | "demo";
  knowledgeSource: string;
  fetchedAt: number;
}

export interface SharedEncounterTurn {
  speakerUserId: string;
  text: string;
}

export interface PersonaMemoryCandidate {
  ownerUserId: string;
  type: "shared_encounter";
  sourceEventId: string;
  observation: string;
  weight: number;
  createdAt: number;
}

export interface SharedEncounter {
  id: string;
  status: EncounterStatus;
  participantAUserId: string;
  participantBUserId: string;
  participantAPersonaVersion: number;
  participantBPersonaVersion: number;
  participantASnapshot: SocialAgent;
  participantBSnapshot: SocialAgent;
  topic: SocialDialogueTopic;
  provenance: SharedEncounterProvenance;
  turns: SharedEncounterTurn[];
  summary: string;
  relationship: PersonaRelationship | null;
  createdAt: number;
  completedAt: number | null;
}

export interface SharedEncounterView {
  id: string;
  status: EncounterStatus;
  viewerSlot: "a" | "b";
  participants: Array<{
    slot: "a" | "b";
    isSelf: boolean;
    personaVersion: number;
    capsule: PersonaCapsule;
  }>;
  topic: SocialDialogueTopic;
  provenance: SharedEncounterProvenance;
  turns: Array<{ speakerSlot: "a" | "b"; text: string }>;
  summary: string;
  relationship: {
    familiarity: number;
    chemistry: number;
    encounterCount: number;
    lastEncounterAt: number | null;
    label: RelationshipState;
  } | null;
  createdAt: number;
  completedAt: number | null;
}

interface SharedEncounterStoreOptions {
  dbPath?: string;
  now?: () => number;
  createId?: () => string;
}

interface PersonaSnapshotRow {
  user_id: string;
  version: number;
  source: PersonaSnapshotSource;
  agent_json: string;
  created_at: number;
  updated_at: number;
}

interface EncounterRow {
  id: string;
  status: EncounterStatus;
  participant_a_user_id: string;
  participant_b_user_id: string;
  participant_a_persona_version: number;
  participant_b_persona_version: number;
  participant_a_snapshot_json: string;
  participant_b_snapshot_json: string;
  topic_title: string;
  topic_url: string;
  topic_summary: string;
  provenance_json: string;
  turns_json: string;
  summary: string;
  created_at: number;
  completed_at: number | null;
}

interface RelationshipRow {
  user_a_id: string;
  user_b_id: string;
  familiarity: number;
  chemistry: number;
  encounter_count: number;
  last_encounter_at: number | null;
}

function pairIds(leftUserId: string, rightUserId: string): [string, string] {
  return leftUserId.localeCompare(rightUserId) <= 0
    ? [leftUserId, rightUserId]
    : [rightUserId, leftUserId];
}

function dedupeKey(leftUserId: string, rightUserId: string, topicUrl: string): string {
  const [userA, userB] = pairIds(leftUserId, rightUserId);
  return `${userA}::${userB}::${topicUrl.trim()}`;
}

function clampChemistry(value: number): number {
  return Math.max(-20, Math.min(20, value));
}

function relationshipDelta(signals: SocialSignals): number {
  return (
    signals.sharedInterests.length * 2 +
    Math.min(signals.sharedTraits.length, 2) +
    (signals.chronotypeMatch ? 1 : 0) -
    signals.styleContrast
  );
}

export function relationshipLabel(relationship: PersonaRelationship): RelationshipState {
  if (relationship.chemistry <= -4 && relationship.familiarity >= 3) return "对线冤家";
  if (relationship.chemistry < 0 && relationship.familiarity >= 2) return "熟悉的杠精";
  if (relationship.chemistry >= 6 && relationship.familiarity >= 3) return "灵魂猫友";
  if (relationship.familiarity >= 2 || relationship.chemistry >= 2) return "同频猫友";
  return "初见";
}

export function toPersonaCapsule(agent: SocialAgent): PersonaCapsule {
  const visualVariant = "visualVariant" in agent.persona && typeof agent.persona.visualVariant === "string"
    ? agent.persona.visualVariant
    : undefined;
  return {
    displayName: agent.displayName,
    visualVariant,
    certifiedTitle: agent.persona.certifiedTitle,
    interests: [...agent.persona.interests].slice(0, 3),
    personality: [...agent.persona.personality].slice(0, 3),
    answerStyle: { ...agent.persona.answerStyle },
  };
}

export class SharedEncounterStore {
  private readonly db: DatabaseSync;
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(options: SharedEncounterStoreOptions = {}) {
    const dbPath = options.dbPath ?? path.join(process.cwd(), "data", "xieyao.sqlite");
    if (dbPath !== ":memory:") mkdirSync(path.dirname(dbPath), { recursive: true });
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.ensureSchema();
  }

  savePersonaSnapshot(userId: string, agent: SocialAgent, source: PersonaSnapshotSource): PersonaSnapshot {
    this.requireUser(userId);
    const normalizedAgent: SocialAgent = { ...agent, id: `user:${userId}` };
    const serialized = JSON.stringify(normalizedAgent);
    const existing = this.db.prepare(`
      SELECT user_id, version, source, agent_json, created_at, updated_at
      FROM social_persona_snapshots
      WHERE user_id = ?
    `).get(userId) as PersonaSnapshotRow | undefined;

    if (existing?.agent_json === serialized && existing.source === source) {
      return this.snapshotFromRow(existing);
    }

    const now = this.now();
    const version = (existing?.version ?? 0) + 1;
    if (existing) {
      this.db.prepare(`
        UPDATE social_persona_snapshots
        SET version = ?, source = ?, agent_json = ?, updated_at = ?
        WHERE user_id = ?
      `).run(version, source, serialized, now, userId);
    } else {
      this.db.prepare(`
        INSERT INTO social_persona_snapshots (
          user_id, version, source, agent_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, version, source, serialized, now, now);
    }

    return {
      userId,
      version,
      source,
      agent: normalizedAgent,
      createdAt: existing?.created_at ?? now,
      updatedAt: now,
    };
  }

  getPersonaSnapshot(userId: string): PersonaSnapshot | null {
    const row = this.db.prepare(`
      SELECT user_id, version, source, agent_json, created_at, updated_at
      FROM social_persona_snapshots
      WHERE user_id = ?
    `).get(userId) as PersonaSnapshotRow | undefined;
    return row ? this.snapshotFromRow(row) : null;
  }

  findPersonaCandidate(excludeUserId: string): PersonaSnapshot | null {
    const row = this.db.prepare(`
      SELECT user_id, version, source, agent_json, created_at, updated_at
      FROM social_persona_snapshots
      WHERE user_id <> ?
      ORDER BY updated_at DESC, user_id ASC
      LIMIT 1
    `).get(excludeUserId) as PersonaSnapshotRow | undefined;
    return row ? this.snapshotFromRow(row) : null;
  }

  reserveEncounter(input: {
    participantA: PersonaSnapshot;
    participantB: PersonaSnapshot;
    topic: SocialDialogueTopic;
    provenance: SharedEncounterProvenance;
  }): { created: boolean; encounter: SharedEncounter } {
    if (input.participantA.userId === input.participantB.userId) {
      throw new Error("Shared Encounter requires two different Users");
    }
    if (!input.topic.url.trim()) throw new Error("Shared Encounter requires a canonical topic URL");

    const key = dedupeKey(input.participantA.userId, input.participantB.userId, input.topic.url);
    const existing = this.getEncounterByDedupeKey(key);
    if (existing) return { created: false, encounter: existing };

    const id = this.createId();
    const createdAt = this.now();
    try {
      this.db.prepare(`
        INSERT INTO shared_encounters (
          id, dedupe_key, status,
          participant_a_user_id, participant_b_user_id,
          participant_a_persona_version, participant_b_persona_version,
          participant_a_snapshot_json, participant_b_snapshot_json,
          topic_title, topic_url, topic_summary, provenance_json,
          turns_json, summary, created_at, completed_at
        ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '', ?, NULL)
      `).run(
        id,
        key,
        input.participantA.userId,
        input.participantB.userId,
        input.participantA.version,
        input.participantB.version,
        JSON.stringify(input.participantA.agent),
        JSON.stringify(input.participantB.agent),
        input.topic.title,
        input.topic.url,
        input.topic.summary,
        JSON.stringify(input.provenance),
        createdAt,
      );
    } catch (error) {
      const raced = this.getEncounterByDedupeKey(key);
      if (raced) return { created: false, encounter: raced };
      throw error;
    }

    const encounter = this.getEncounterById(id);
    if (!encounter) throw new Error("Reserved encounter disappeared");
    return { created: true, encounter };
  }

  completeEncounter(input: {
    encounterId: string;
    turns: SharedEncounterTurn[];
    summary: string;
    signals: SocialSignals;
    memoryObservationA: string;
    memoryObservationB: string;
  }): SharedEncounter {
    const existing = this.getEncounterById(input.encounterId);
    if (!existing) throw new Error("Unknown Shared Encounter");
    if (existing.status === "completed") return existing;
    if (existing.status !== "pending") throw new Error("Shared Encounter is not completable");

    const completedAt = this.now();
    const [userA, userB] = pairIds(existing.participantAUserId, existing.participantBUserId);

    try {
      this.db.exec("BEGIN IMMEDIATE;");
      const current = this.db.prepare(`
        SELECT status FROM shared_encounters WHERE id = ?
      `).get(input.encounterId) as { status: EncounterStatus } | undefined;
      if (!current) throw new Error("Shared Encounter disappeared during completion");
      if (current.status === "completed") {
        this.db.exec("COMMIT;");
        return this.getEncounterById(input.encounterId)!;
      }
      if (current.status !== "pending") throw new Error("Shared Encounter is not pending");

      this.db.prepare(`
        UPDATE shared_encounters
        SET status = 'completed', turns_json = ?, summary = ?, completed_at = ?
        WHERE id = ? AND status = 'pending'
      `).run(JSON.stringify(input.turns), input.summary, completedAt, input.encounterId);

      const relationship = this.readRelationship(userA, userB);
      const familiarity = (relationship?.familiarity ?? 0) + 1;
      const chemistry = clampChemistry((relationship?.chemistry ?? 0) + relationshipDelta(input.signals));
      const encounterCount = (relationship?.encounterCount ?? 0) + 1;
      this.db.prepare(`
        INSERT INTO persona_relationships (
          user_a_id, user_b_id, familiarity, chemistry, encounter_count, last_encounter_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_a_id, user_b_id) DO UPDATE SET
          familiarity = excluded.familiarity,
          chemistry = excluded.chemistry,
          encounter_count = excluded.encounter_count,
          last_encounter_at = excluded.last_encounter_at
      `).run(userA, userB, familiarity, chemistry, encounterCount, completedAt);

      const memoryStatement = this.db.prepare(`
        INSERT OR IGNORE INTO persona_memory_candidates (
          id, owner_user_id, type, source_event_id, observation, weight, created_at
        ) VALUES (?, ?, 'shared_encounter', ?, ?, 1, ?)
      `);
      memoryStatement.run(
        `${input.encounterId}:${existing.participantAUserId}`,
        existing.participantAUserId,
        input.encounterId,
        input.memoryObservationA,
        completedAt,
      );
      memoryStatement.run(
        `${input.encounterId}:${existing.participantBUserId}`,
        existing.participantBUserId,
        input.encounterId,
        input.memoryObservationB,
        completedAt,
      );
      this.db.exec("COMMIT;");
    } catch (error) {
      this.rollbackQuietly();
      throw error;
    }

    const completed = this.getEncounterById(input.encounterId);
    if (!completed) throw new Error("Completed encounter disappeared");
    return completed;
  }

  markEncounterFailed(encounterId: string): void {
    this.db.prepare(`
      UPDATE shared_encounters SET status = 'failed'
      WHERE id = ? AND status = 'pending'
    `).run(encounterId);
  }

  getEncounterForUser(encounterId: string, userId: string): SharedEncounter | null {
    const row = this.db.prepare(`
      SELECT * FROM shared_encounters
      WHERE id = ? AND (participant_a_user_id = ? OR participant_b_user_id = ?)
    `).get(encounterId, userId, userId) as EncounterRow | undefined;
    return row ? this.encounterFromRow(row) : null;
  }

  getLatestEncounterForUser(userId: string): SharedEncounter | null {
    const row = this.db.prepare(`
      SELECT * FROM shared_encounters
      WHERE status = 'completed'
        AND (participant_a_user_id = ? OR participant_b_user_id = ?)
      ORDER BY completed_at DESC, created_at DESC
      LIMIT 1
    `).get(userId, userId) as EncounterRow | undefined;
    return row ? this.encounterFromRow(row) : null;
  }

  getRelationship(leftUserId: string, rightUserId: string): PersonaRelationship | null {
    const [userA, userB] = pairIds(leftUserId, rightUserId);
    return this.readRelationship(userA, userB);
  }

  getMemoryCandidatesForUser(userId: string): PersonaMemoryCandidate[] {
    const rows = this.db.prepare(`
      SELECT owner_user_id, type, source_event_id, observation, weight, created_at
      FROM persona_memory_candidates
      WHERE owner_user_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(userId) as Array<{
      owner_user_id: string;
      type: "shared_encounter";
      source_event_id: string;
      observation: string;
      weight: number;
      created_at: number;
    }>;
    return rows.map((row) => ({
      ownerUserId: row.owner_user_id,
      type: row.type,
      sourceEventId: row.source_event_id,
      observation: row.observation,
      weight: row.weight,
      createdAt: row.created_at,
    }));
  }

  close(): void {
    this.db.close();
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS social_persona_snapshots (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('live', 'fallback')),
        agent_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS shared_encounters (
        id TEXT PRIMARY KEY,
        dedupe_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
        participant_a_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        participant_b_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        participant_a_persona_version INTEGER NOT NULL,
        participant_b_persona_version INTEGER NOT NULL,
        participant_a_snapshot_json TEXT NOT NULL,
        participant_b_snapshot_json TEXT NOT NULL,
        topic_title TEXT NOT NULL,
        topic_url TEXT NOT NULL,
        topic_summary TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        turns_json TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        CHECK(participant_a_user_id <> participant_b_user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_shared_encounters_participant_a
        ON shared_encounters(participant_a_user_id, completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_shared_encounters_participant_b
        ON shared_encounters(participant_b_user_id, completed_at DESC);
      CREATE TABLE IF NOT EXISTS persona_relationships (
        user_a_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        user_b_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        familiarity INTEGER NOT NULL,
        chemistry INTEGER NOT NULL,
        encounter_count INTEGER NOT NULL,
        last_encounter_at INTEGER,
        PRIMARY KEY(user_a_id, user_b_id),
        CHECK(user_a_id <> user_b_id)
      );
      CREATE TABLE IF NOT EXISTS persona_memory_candidates (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type = 'shared_encounter'),
        source_event_id TEXT NOT NULL REFERENCES shared_encounters(id) ON DELETE CASCADE,
        observation TEXT NOT NULL,
        weight REAL NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(owner_user_id, source_event_id)
      );
      CREATE INDEX IF NOT EXISTS idx_persona_memory_candidates_owner
        ON persona_memory_candidates(owner_user_id, created_at DESC);
    `);
  }

  private requireUser(userId: string): void {
    const row = this.db.prepare("SELECT 1 FROM app_users WHERE id = ?").get(userId);
    if (!row) throw new Error("Unknown user");
  }

  private snapshotFromRow(row: PersonaSnapshotRow): PersonaSnapshot {
    return {
      userId: row.user_id,
      version: row.version,
      source: row.source,
      agent: JSON.parse(row.agent_json) as SocialAgent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private getEncounterByDedupeKey(key: string): SharedEncounter | null {
    const row = this.db.prepare("SELECT * FROM shared_encounters WHERE dedupe_key = ?").get(key) as EncounterRow | undefined;
    return row ? this.encounterFromRow(row) : null;
  }

  private getEncounterById(id: string): SharedEncounter | null {
    const row = this.db.prepare("SELECT * FROM shared_encounters WHERE id = ?").get(id) as EncounterRow | undefined;
    return row ? this.encounterFromRow(row) : null;
  }

  private readRelationship(userA: string, userB: string): PersonaRelationship | null {
    const row = this.db.prepare(`
      SELECT user_a_id, user_b_id, familiarity, chemistry, encounter_count, last_encounter_at
      FROM persona_relationships
      WHERE user_a_id = ? AND user_b_id = ?
    `).get(userA, userB) as RelationshipRow | undefined;
    if (!row) return null;
    return {
      userAId: row.user_a_id,
      userBId: row.user_b_id,
      familiarity: row.familiarity,
      chemistry: row.chemistry,
      encounterCount: row.encounter_count,
      lastEncounterAt: row.last_encounter_at,
    };
  }

  private encounterFromRow(row: EncounterRow): SharedEncounter {
    return {
      id: row.id,
      status: row.status,
      participantAUserId: row.participant_a_user_id,
      participantBUserId: row.participant_b_user_id,
      participantAPersonaVersion: row.participant_a_persona_version,
      participantBPersonaVersion: row.participant_b_persona_version,
      participantASnapshot: JSON.parse(row.participant_a_snapshot_json) as SocialAgent,
      participantBSnapshot: JSON.parse(row.participant_b_snapshot_json) as SocialAgent,
      topic: {
        title: row.topic_title,
        url: row.topic_url,
        summary: row.topic_summary,
      },
      provenance: JSON.parse(row.provenance_json) as SharedEncounterProvenance,
      turns: JSON.parse(row.turns_json) as SharedEncounterTurn[],
      summary: row.summary,
      relationship: this.getRelationship(row.participant_a_user_id, row.participant_b_user_id),
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  private rollbackQuietly(): void {
    try {
      this.db.exec("ROLLBACK;");
    } catch {
      // No active transaction.
    }
  }
}

export interface SharedEncounterDialogue {
  nextRound(input: {
    actor: SocialAgent;
    target: SocialAgent;
    topic: SocialDialogueTopic;
    history: SocialDialogueTurn[];
    memory: PersonaExperienceMemory;
  }): Promise<SocialDialogueRound>;
}

export class SharedEncounterService {
  constructor(
    private readonly store: SharedEncounterStore,
    private readonly dialogue: SharedEncounterDialogue,
  ) {}

  async create(input: {
    requestUserId: string;
    otherUserId: string;
    topic: SocialDialogueTopic;
    provenance: SharedEncounterProvenance;
  }): Promise<SharedEncounter> {
    if (input.requestUserId === input.otherUserId) {
      throw new Error("Shared Encounter requires two different Users");
    }

    const actorSnapshot = this.store.getPersonaSnapshot(input.requestUserId);
    const targetSnapshot = this.store.getPersonaSnapshot(input.otherUserId);
    if (!actorSnapshot) throw new Error("Current User has no Persona snapshot");
    if (!targetSnapshot) throw new Error("Other User has no Persona snapshot");

    const reservation = this.store.reserveEncounter({
      participantA: actorSnapshot,
      participantB: targetSnapshot,
      topic: input.topic,
      provenance: input.provenance,
    });
    if (!reservation.created) {
      return reservation.encounter;
    }

    const relationship = this.store.getRelationship(input.requestUserId, input.otherUserId);
    const memory: PersonaExperienceMemory = {
      encounterCount: relationship?.encounterCount ?? 0,
      recentTopics: [],
      recentResidents: [],
      notes: [],
    };
    const history: SocialDialogueTurn[] = [];
    const memoryNotes: string[] = [];
    let roundCount = 0;

    try {
      while (roundCount < 4) {
        const round = await this.dialogue.nextRound({
          actor: actorSnapshot.agent,
          target: targetSnapshot.agent,
          topic: input.topic,
          history: [...history],
          memory,
        });
        history.push(...round.turns.map((turn) => ({ ...turn })));
        memoryNotes.push(round.memoryNote);
        roundCount = round.roundNumber;
        if (round.shouldStop && roundCount >= 2) break;
      }

      const turns: SharedEncounterTurn[] = history.map((turn) => ({
        speakerUserId: turn.speaker === "self" ? input.requestUserId : input.otherUserId,
        text: turn.text,
      }));
      const signals = buildSocialSignals(actorSnapshot.agent, targetSnapshot.agent);
      const summary = `${actorSnapshot.agent.displayName} 与 ${targetSnapshot.agent.displayName} 围绕「${input.topic.title}」完成 ${roundCount} 轮相遇，留下 ${turns.length} 句共同历史。`;
      const memoryObservationA = memoryNotes.at(-1) || summary;
      const memoryObservationB = `与${actorSnapshot.agent.displayName}围绕「${input.topic.title}」完成了一次 ${roundCount} 轮相遇。`;

      return this.store.completeEncounter({
        encounterId: reservation.encounter.id,
        turns,
        summary,
        signals,
        memoryObservationA,
        memoryObservationB,
      });
    } catch (error) {
      this.store.markEncounterFailed(reservation.encounter.id);
      throw error;
    }
  }
}

export function toSharedEncounterView(encounter: SharedEncounter, viewerUserId: string): SharedEncounterView {
  const viewerSlot = encounter.participantAUserId === viewerUserId
    ? "a"
    : encounter.participantBUserId === viewerUserId
      ? "b"
      : null;
  if (!viewerSlot) throw new Error("User is not a Shared Encounter participant");

  const relationship = encounter.relationship
    ? {
        familiarity: encounter.relationship.familiarity,
        chemistry: encounter.relationship.chemistry,
        encounterCount: encounter.relationship.encounterCount,
        lastEncounterAt: encounter.relationship.lastEncounterAt,
        label: relationshipLabel(encounter.relationship),
      }
    : null;

  return {
    id: encounter.id,
    status: encounter.status,
    viewerSlot,
    participants: [
      {
        slot: "a",
        isSelf: viewerSlot === "a",
        personaVersion: encounter.participantAPersonaVersion,
        capsule: toPersonaCapsule(encounter.participantASnapshot),
      },
      {
        slot: "b",
        isSelf: viewerSlot === "b",
        personaVersion: encounter.participantBPersonaVersion,
        capsule: toPersonaCapsule(encounter.participantBSnapshot),
      },
    ],
    topic: { ...encounter.topic },
    provenance: { ...encounter.provenance },
    turns: encounter.turns.map((turn) => ({
      speakerSlot: turn.speakerUserId === encounter.participantAUserId ? "a" : "b",
      text: turn.text,
    })),
    summary: encounter.summary,
    relationship,
    createdAt: encounter.createdAt,
    completedAt: encounter.completedAt,
  };
}
