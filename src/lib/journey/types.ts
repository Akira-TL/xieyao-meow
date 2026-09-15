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

export interface ReturnArtifact {
  id: string;
  type: ReturnArtifactType;
  title: string;
  sourceUrl: string;
}

export interface JourneyView {
  id: string;
  state: Exclude<JourneyState, "AT_HOME">;
  routeBias: string | null;
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
}

export interface JourneyProjection {
  state: JourneyState;
  journey: JourneyView | null;
  resting: boolean;
  queuedRouteBias: string | null;
  nextJourneyAt: number | null;
}

export interface JourneyAtlasEntry {
  journeyId: string;
  completedAt: number;
  routeBias: string | null;
  postcard: JourneyPostcard;
  artifact: ReturnArtifact | null;
  insight: JourneyInsight | null;
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
  returnArtifact?: JourneyReturnArtifactSeed;
}

export interface JourneyDiscoveryInput {
  userId: string;
  oauthAccessToken: string;
  routeBias: string | null;
  planSeed: string;
  recentQuestionUrls: string[];
  recentMemoryTopicRefs: string[];
}

export type JourneyDiscoverer = (input: JourneyDiscoveryInput) => Promise<JourneyDiscoveryResult>;
