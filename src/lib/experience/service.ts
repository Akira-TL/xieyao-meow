import { withHumanizerZh } from "@/lib/copy/humanizer";
import { buildComposition, buildPersona } from "@/lib/persona";

import type {
  AnswerExperience,
  AnswerExperienceCache,
  AnswerExperienceGateway,
  CreateAnswerExperienceInput,
  KnowledgeContext,
  QuestionCandidate,
} from "./types";

export interface AnswerExperienceServiceOptions {
  gateway: AnswerExperienceGateway;
  cache: AnswerExperienceCache;
  fallback: AnswerExperience;
  now?: () => number;
}

function isQuestion(item: { url: string }): boolean {
  try {
    return new URL(item.url).pathname.includes("/question/");
  } catch {
    return false;
  }
}

function toQuestionCandidate(item: {
  title: string;
  url: string;
  summary: string;
  thumbnailUrl: string;
}): QuestionCandidate {
  return {
    title: item.title,
    url: item.url,
    summary: item.summary,
    thumbnailUrl: item.thumbnailUrl,
  };
}

function knowledgePrompt(question: QuestionCandidate, answerSummaries: string[]): string {
  const summaries = answerSummaries.length
    ? answerSummaries.map((summary, index) => `${index + 1}. ${summary}`).join("\n")
    : "当前未取得知乎回答摘要。";

  return [
    "你是 Knowledge Layer。请只整理问题的事实基础、主要解释框架和已知分歧，不进行角色扮演。",
    "不要把不确定信息写成确定事实；信息不足时明确说明。",
    `问题：${question.title}`,
    question.summary ? `问题摘要：${question.summary}` : "",
    "知乎回答摘要：",
    summaries,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function personaPrompt(
  question: QuestionCandidate,
  knowledge: KnowledgeContext,
  persona: AnswerExperience["persona"],
): string {
  return [
    "你是 Persona Layer。你的任务是把给定 Knowledge Layer 改写成指定人格的知乎回答。",
    "必须保留 Knowledge Layer 的事实边界，不新增无法从事实层支持的事实性主张；不确定之处继续保留不确定性。",
    `问题：${question.title}`,
    `Knowledge Layer：${knowledge.synthesis}`,
    `宠物品种：${persona.species}`,
    `认证头衔：${persona.certifiedTitle}`,
    `性格：${persona.personality.join("、")}`,
    `口头禅：${persona.catchphrase}`,
    `回答风格：${persona.answerStyle.tone}；篇幅=${persona.answerStyle.length}；信息密度=${persona.answerStyle.density}`,
    "输出最终回答正文即可，不要解释你的生成过程。",
  ].join("\n\n");
}

export class AnswerExperienceService {
  private readonly now: () => number;
  private readonly inFlight = new Map<string, Promise<AnswerExperience>>();

  constructor(private readonly options: AnswerExperienceServiceOptions) {
    this.now = options.now ?? Date.now;
  }

  async create(input: CreateAnswerExperienceInput): Promise<AnswerExperience> {
    if (!input.forceRefresh) {
      const cached = await this.options.cache.get(input.cacheKey);
      if (cached) return cached;
    }

    const active = this.inFlight.get(input.cacheKey);
    if (active) return active;

    const pending = this.createUncached(input).finally(() => {
      if (this.inFlight.get(input.cacheKey) === pending) {
        this.inFlight.delete(input.cacheKey);
      }
    });
    this.inFlight.set(input.cacheKey, pending);
    return pending;
  }

  private async createUncached(input: CreateAnswerExperienceInput): Promise<AnswerExperience> {
    try {
      const profile = await this.options.gateway.getUserProfile({
        oauthAccessToken: input.oauthAccessToken,
      });
      const composition = buildComposition(profile);
      const persona = buildPersona(composition);

      const hotItems = await this.options.gateway.getHotList(30);
      const questionItem = hotItems.find(isQuestion);
      if (!questionItem) {
        throw new Error("Zhihu hot list contains no question item");
      }
      const question = toQuestionCandidate(questionItem);

      let summaries: string[] = [];
      try {
        summaries = (await this.options.gateway.getQuestionAnswers(question.url, 5)).map(
          (answer) => answer.summary,
        );
      } catch {
        summaries = [];
      }

      const knowledgeResult = await this.options.gateway.askZhida({
        model: "zhida-fast-1p5",
        messages: [{ role: "user", content: withHumanizerZh(knowledgePrompt(question, summaries)) }],
      });
      const knowledge: KnowledgeContext = {
        source: summaries.length > 0 ? "zhihu-question-answers+zhida" : "zhida",
        answerSummaries: summaries,
        synthesis: knowledgeResult.content,
      };

      const personaResult = await this.options.gateway.askZhida({
        model: "zhida-fast-1p5",
        messages: [{ role: "user", content: withHumanizerZh(personaPrompt(question, knowledge, persona)) }],
      });

      const experience: AnswerExperience = {
        mode: "live",
        generatedAt: Math.floor(this.now() / 1000),
        composition,
        persona,
        question,
        knowledge,
        card: {
          questionTitle: question.title,
          questionUrl: question.url,
          answer: personaResult.content,
          personaTitle: persona.certifiedTitle,
          sourceLabel:
            knowledge.source === "zhihu-question-answers+zhida"
              ? "知乎回答摘要 + 知乎直答"
              : "知乎直答",
        },
      };

      await this.options.cache.set(input.cacheKey, experience);
      return experience;
    } catch {
      return this.options.fallback;
    }
  }
}
