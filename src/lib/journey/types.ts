export type JourneyState = "AT_HOME" | "PREPARING" | "AWAY" | "RETURNED";
export type JourneyContentSource = "live" | "none";
export type JourneyKnowledgeSource = "template" | "none";
export type ReturnArtifactType =
  | "QUESTION_TICKET"
  | "OPINION_FRAGMENT"
  | "RELATION_TICKET"
  | "NEW_SCENT"
  | "ODDITY_SPECIMEN";

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
}

export interface JourneyProjection {
  state: JourneyState;
  journey: JourneyView | null;
}

export interface JourneyDiscoveryResult {
  question: JourneyQuestion | null;
  contentSource: JourneyContentSource;
  knowledgeSource: JourneyKnowledgeSource;
  sourceFetchedAt: number;
  postcardBody: string;
}

export interface JourneyDiscoveryInput {
  userId: string;
  oauthAccessToken: string;
  routeBias: string | null;
  planSeed: string;
}

export type JourneyDiscoverer = (input: JourneyDiscoveryInput) => Promise<JourneyDiscoveryResult>;
