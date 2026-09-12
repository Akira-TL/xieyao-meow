import type { Persona, ZhihuComposition } from "@/lib/persona";
import type {
  GetUserProfileInput,
  UserProfile,
  ZhidaRequest,
  ZhidaResult,
  ZhihuAnswerSummary,
  ZhihuHotItem,
} from "@/lib/zhihu";

export interface QuestionCandidate {
  title: string;
  url: string;
  summary: string;
  thumbnailUrl: string;
}

export type KnowledgeSource =
  | "zhihu-question-answers+zhida"
  | "zhida"
  | "demo-fallback";

export interface KnowledgeContext {
  source: KnowledgeSource;
  answerSummaries: string[];
  synthesis: string;
}

export interface AnswerCard {
  questionTitle: string;
  questionUrl: string;
  answer: string;
  personaTitle: string;
  sourceLabel: string;
}

export interface AnswerExperience {
  mode: "live" | "fallback";
  generatedAt: number;
  composition: ZhihuComposition;
  persona: Persona;
  question: QuestionCandidate;
  knowledge: KnowledgeContext;
  card: AnswerCard;
}

export interface CreateAnswerExperienceInput {
  cacheKey: string;
  oauthAccessToken?: string;
  forceRefresh?: boolean;
}

export interface AnswerExperienceGateway {
  getUserProfile(input?: GetUserProfileInput): Promise<UserProfile>;
  getHotList(limit?: number): Promise<ZhihuHotItem[]>;
  getQuestionAnswers(questionUrl: string, limit?: number): Promise<ZhihuAnswerSummary[]>;
  askZhida(input: ZhidaRequest): Promise<ZhidaResult>;
}

export interface AnswerExperienceCache {
  get(key: string): Promise<AnswerExperience | null>;
  set(key: string, value: AnswerExperience): Promise<void>;
}
