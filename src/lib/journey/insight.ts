import { z } from "zod";

import type { Persona, ZhihuComposition } from "@/lib/persona/types";
import type { PersonaNarrativeGateway } from "@/lib/narrative/deepseek";

import type {
  JourneyDiscoveryResult,
  JourneyInsight,
  JourneyInsightFeedback,
  JourneyQuestion,
} from "./types";

export const JOURNEY_INSIGHT_PROMPT_VERSION = "journey-insight-v1";

const generatedInsightSchema = z.object({
  headline: z.string().trim().min(4).max(28),
  insight: z.string().trim().min(8).max(70),
  why_it_matters: z.string().trim().min(6).max(52),
  interaction: z.object({
    question: z.string().trim().min(4).max(22),
    confirm_label: z.string().trim().min(2).max(10),
    correct_label: z.string().trim().min(2).max(10),
    reduce_label: z.string().trim().min(2).max(10),
  }),
});

type GeneratedInsight = z.infer<typeof generatedInsightSchema>;

type InsightSeed = NonNullable<JourneyDiscoveryResult["insight"]>;

export interface JourneyInsightInput {
  persona: Persona;
  composition: ZhihuComposition;
  routeBias: string | null;
  question: JourneyQuestion | null;
  encounterName?: string | null;
  recentFeedback?: JourneyInsightFeedback[];
}

function compact(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function charCount(values: string[]): number {
  return Array.from(values.join("")).length;
}

function buildFacts(input: JourneyInsightInput) {
  return {
    persona: {
      title: input.persona.certifiedTitle,
      traits: input.persona.personality.slice(0, 3),
      interests: input.persona.interests.slice(0, 4),
      answerStyle: input.persona.answerStyle,
    },
    zhihuComposition: {
      primaryInterest: input.composition.primaryInterest,
      interests: input.composition.interests.slice(0, 4),
      writingLength: input.composition.writingLength,
      sourceCounts: input.composition.sourceCounts,
    },
    journey: {
      routeBias: input.routeBias,
      question: input.question
        ? {
            title: input.question.title,
            summary: compact(input.question.summary, 220),
          }
        : null,
      encounterName: input.encounterName ?? null,
    },
    recentFeedback: (input.recentFeedback ?? []).slice(0, 4),
  };
}

function buildEvidenceSummary(input: JourneyInsightInput): string {
  const parts = [
    `长期兴趣：${input.persona.interests.slice(0, 3).join(" / ")}`,
    input.routeBias ? `本趟纸条：「${compact(input.routeBias, 24)}」` : "本趟没有指定方向",
  ];
  if (input.question) parts.push(`本趟停留：「${compact(input.question.title, 30)}」`);
  if (input.encounterName) parts.push(`途中遇见：${compact(input.encounterName, 12)}`);
  const latestFeedback = input.recentFeedback?.[0];
  if (latestFeedback) {
    const label = latestFeedback.action === "CONFIRM_INTEREST"
      ? "你确认过"
      : latestFeedback.action === "CORRECT_INTEREST"
        ? "你纠正过"
        : "你要求少看";
    parts.push(`${label}：「${compact(latestFeedback.topic, 18)}」`);
  }
  return parts.join(" · ");
}

function personaQuestion(persona: Persona): string {
  const profile = persona.personality.join("、");
  if (/严谨|证据|校验|分析|工程/.test(profile)) return "这条推断成立吗？";
  if (/旅行|探索|跨界|行动/.test(profile)) return "这条气味，它闻对了吗？";
  if (/观察|生活|创作|画面/.test(profile)) return "这一面，像不像你？";
  return "它这次猜得像你吗？";
}

function fallbackGenerated(input: JourneyInsightInput): GeneratedInsight {
  const primary = input.composition.primaryInterest;
  const question = input.question ? compact(input.question.title, 24) : null;
  return {
    headline: `它对「${primary}」的理解又多了一点`,
    insight: question
      ? `这趟它停在「${question}」前，开始猜：你会被能继续追问的问题吸引，而不只是熟悉的标签。`
      : `这趟它把你给的方向和长期兴趣并排记下，形成了一条可以继续校准的新观察。`,
    why_it_matters: "它会把这条观察当成后续探索的参考，但不会把一次旅途直接写成你的定论。",
    interaction: {
      question: personaQuestion(input.persona),
      confirm_label: "挺像我的",
      correct_label: "方向不太对",
      reduce_label: "以后少看这个",
    },
  };
}

function prompt(input: JourneyInsightInput): string {
  return [
    "你是谢邀喵的 Persona Narrative Layer。只负责理解与表达，不决定事实、游戏状态或业务动作。",
    "下面 FACTS 是唯一事实来源。禁止补充 FACTS 中没有的收藏主题、行为次数、动机或结论。",
    "把内容写成“这只猫对主人形成的一条可被纠正的新理解”，允许用“像是、可能、开始觉得”等保守措辞。",
    "必须简短：headline≤28字，insight≤70字，why_it_matters≤52字，互动问题≤22字，每个按钮≤10字。",
    "三个按钮只生成显示文案，实际动作由服务端固定映射；不要发明第四个动作。confirm_label 必须表示“这条理解基本准确”，correct_label 必须表示“这条理解需要修正”，reduce_label 必须表示“以后减少这个主题”，不得互换语义。",
    "只输出 JSON，不要 Markdown，不要解释。",
    '格式：{"headline":"…","insight":"…","why_it_matters":"…","interaction":{"question":"…","confirm_label":"…","correct_label":"…","reduce_label":"…"}}',
    `FACTS=${JSON.stringify(buildFacts(input))}`,
  ].join("\n");
}

function parse(content: string): GeneratedInsight {
  const withoutFence = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("DeepSeek insight response did not contain JSON");
  return generatedInsightSchema.parse(JSON.parse(withoutFence.slice(start, end + 1)));
}

function toSeed(
  generated: GeneratedInsight,
  evidenceSummary: string,
  factsJson: string,
  model: string,
): InsightSeed {
  const options: JourneyInsight["options"] = [
    { action: "CONFIRM_INTEREST", label: generated.interaction.confirm_label },
    { action: "CORRECT_INTEREST", label: generated.interaction.correct_label },
    { action: "REDUCE_INTEREST", label: generated.interaction.reduce_label },
  ];
  const visibleText = [
    generated.headline,
    generated.insight,
    generated.why_it_matters,
    generated.interaction.question,
    ...options.map((item) => item.label),
  ];
  return {
    headline: generated.headline,
    insight: generated.insight,
    whyItMatters: generated.why_it_matters,
    evidenceSummary,
    interactionQuestion: generated.interaction.question,
    options,
    textCharCount: charCount(visibleText),
    model,
    promptVersion: JOURNEY_INSIGHT_PROMPT_VERSION,
    factsJson,
  };
}

export async function createJourneyInsight(
  input: JourneyInsightInput,
  gateway: PersonaNarrativeGateway | null,
): Promise<InsightSeed> {
  const factsJson = JSON.stringify(buildFacts(input));
  const evidenceSummary = buildEvidenceSummary(input);
  if (gateway) {
    try {
      const result = await gateway.generateJson({ prompt: prompt(input), maxTokens: 220 });
      return toSeed(parse(result.content), evidenceSummary, factsJson, result.model);
    } catch (error) {
      console.warn(
        "[journey-insight] DeepSeek unavailable; using bounded local fallback",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }
  return toSeed(fallbackGenerated(input), evidenceSummary, factsJson, "local-fallback");
}

export function createFallbackJourneyInsight(routeBias: string | null): InsightSeed {
  const route = compact(routeBias || "随便逛", 24);
  const generated: GeneratedInsight = {
    headline: "它把你给的方向认真记下了",
    insight: `「${route}」这张纸条被它收进了这趟旅程，并成为下一次探索时会继续参考的一条线索。`,
    why_it_matters: "这条记录只代表你给过的方向；等遇到可追溯内容以后，它再继续校准对你的理解。",
    interaction: {
      question: "这个方向还要保留吗？",
      confirm_label: "继续看看",
      correct_label: "换个方向",
      reduce_label: "先少看点",
    },
  };
  const evidenceSummary = `本趟纸条：「${route}」 · 当前只记录这条已知路线意图`;
  const factsJson = JSON.stringify({ journey: { routeBias: routeBias ?? null, question: null } });
  return toSeed(generated, evidenceSummary, factsJson, "local-fallback");
}
