import type { HomeActivityType, JourneyKind, PrimaryToolId, SmallItemId } from "./game";

export type JourneyState = "AT_HOME" | "PREPARING" | "AWAY" | "RETURNED";
export type JourneyContentSource = "live" | "none";
export type JourneyKnowledgeSource = "template" | "none";
export type ReturnArtifactType =
  | "QUESTION_TICKET"
  | "OPINION_FRAGMENT"
  | "RELATION_TICKET"
  | "NEW_SCENT"
  | "ODDITY_SPECIMEN";

export type JourneyInsightAction =
  | "CONFIRM_INTEREST"
  | "CORRECT_INTEREST"
  | "REDUCE_INTEREST";

export interface JourneyInsightOption {
  action: JourneyInsightAction;
  label: string;
}

export interface JourneyInsightFeedback {
  action: JourneyInsightAction;
  topic: string;
}

export interface JourneyInsight {
  headline: string;
  insight: string;
  whyItMatters: string;
  evidenceSummary: string;
  interactionQuestion: string;
  options: JourneyInsightOption[];
  textCharCount: number;
  model: string;
  promptVersion: string;
  feedbackAction: JourneyInsightAction | null;
}

export interface JourneyQuestion {
  title: string;
  url: string;
  summary: string;
  thumbnailUrl?: string;
}

export interface JourneyPostcard {
  headline: string;
  body: string;
  question: JourneyQuestion | null;
}

export type JourneyConversationKind = "NPC" | "USER";

export interface JourneyConversationTurn {
  speaker: "self" | "other";
  text: string;
}

export interface JourneyConversation {
  kind: JourneyConversationKind;
  participantId: string;
  participantName: string;
  turns: JourneyConversationTurn[];
  sourceLabel: string;
  textCharCount: number;
}

export interface ReturnArtifact {
  id: string;
  type: ReturnArtifactType;
  title: string;
  sourceUrl: string;
}

export interface WaitingGameToolView {
  id: PrimaryToolId;
  unlocked: boolean;
}

export interface WaitingGameSupplyView {
  id: SmallItemId;
  quantity: number;
}

export interface WaitingGameHomeActivityView {
  type: HomeActivityType;
  startedAt: number;
  endsAt: number;
}

export interface WaitingGameStateView {
  leaves: {
    balance: number;
    pendingHome: number;
    passiveCap: number;
  };
  primaryTools: WaitingGameToolView[];
  supplies: WaitingGameSupplyView[];
  loadout: {
    primaryToolId: PrimaryToolId | null;
    smallItemId: SmallItemId | null;
  };
  homeActivity: WaitingGameHomeActivityView | null;
}

export interface JourneyView {
  id: string;
  state: Exclude<JourneyState, "AT_HOME">;
  routeBias: string | null;
  kind: JourneyKind;
  primaryToolId: PrimaryToolId | null;
  smallItemId: SmallItemId | null;
  inspirationLeaves: number | null;
  createdAt: number;
  departAt: number;
  returnAt: number;
  contentSource: JourneyContentSource | null;
  knowledgeSource: JourneyKnowledgeSource | null;
  sourceFetchedAt: number | null;
  question: JourneyQuestion | null;
  postcard: JourneyPostcard | null;
  artifact: ReturnArtifact | null;
  insight: JourneyInsight | null;
  conversation: JourneyConversation | null;
}

export interface JourneyProjection {
  state: JourneyState;
  journey: JourneyView | null;
  resting: boolean;
  queuedJourney: boolean;
  queuedRouteBias: string | null;
  nextJourneyAt: number | null;
  game: WaitingGameStateView;
}

export interface JourneyAtlasEntry {
  journeyId: string;
  completedAt: number;
  routeBias: string | null;
  inspirationLeaves: number;
  postcard: JourneyPostcard;
  artifact: ReturnArtifact | null;
  insight: JourneyInsight | null;
  conversation: JourneyConversation | null;
  contentSource: JourneyContentSource;
}

export interface PersonaMemoryView {
  id: string;
  sourceEventId: string;
  topicRef: string | null;
  observation: string;
  createdAt: number;
}

export interface JourneyAtlasView {
  journeys: JourneyAtlasEntry[];
  memories: PersonaMemoryView[];
}

export interface JourneyReturnArtifactSeed {
  type: ReturnArtifactType;
  title: string;
  sourceUrl: string;
  sourceKey: string;
}

export interface JourneyDiscoveryResult {
  question: JourneyQuestion | null;
  contentSource: JourneyContentSource;
  knowledgeSource: JourneyKnowledgeSource;
  sourceFetchedAt: number;
  postcardHeadline?: string;
  postcardBody: string;
  insight?: Omit<JourneyInsight, "feedbackAction"> & {
    factsJson: string;
  };
  conversation?: JourneyConversation;
  returnArtifact?: JourneyReturnArtifactSeed;
}

export interface JourneyDiscoveryInput {
  userId: string;
  oauthAccessToken: string;
  routeBias: string | null;
  planSeed: string;
  primaryToolId: PrimaryToolId | null;
  smallItemId: SmallItemId | null;
  recentQuestionUrls: string[];
  recentMemoryTopicRefs: string[];
  recentInsightFeedback: JourneyInsightFeedback[];
}

export type JourneyDiscoverer = (input: JourneyDiscoveryInput) => Promise<JourneyDiscoveryResult>;
