import { z } from "zod";

import { withHumanizerZh } from "@/lib/copy/humanizer";
import type { ZhidaRequest, ZhidaResult } from "@/lib/zhihu";

import { buildSocialSignals } from "./engine";
import type { SocialAgent, SocialSignals } from "./types";

export type SocialMatchMode = "zhida" | "rules";

export interface SocialMatchInsight {
  mode: SocialMatchMode;
  score: number;
  baselineScore: number;
  sharedInterests: string[];
  styleContrast: number;
  bridge: string;
  prediction: string;
  reason: string;
  sourceLabel: string;
}

export interface SocialMatchGateway {
  askZhida(input: ZhidaRequest): Promise<ZhidaResult>;
}

const zhidaMatchSchema = z.object({
  score_delta: z.number().int().min(-6).max(6),
  bridge: z.string().trim().min(1).max(60),
  prediction: z.string().trim().min(2).max(120),
  reason: z.string().trim().min(2).max(180),
});

type ZhidaMatchPayload = z.infer<typeof zhidaMatchSchema>;

function clampScore(value: number): number {
  return Math.max(52, Math.min(96, Math.round(value)));
}

function baselineScore(signals: SocialSignals): number {
  const commonGround = signals.sharedInterests.length * 8;
  const productiveContrast = Math.min(signals.styleContrast, 2) * 2;
  const sameRhythm = signals.chronotypeMatch ? 3 : 0;
  const sharedTraits = Math.min(signals.sharedTraits.length, 2) * 2;
  return clampScore(66 + commonGround + productiveContrast + sameRhythm + sharedTraits);
}

function rulePrediction(signals: SocialSignals): string {
  if (signals.sharedInterests.length >= 2 && signals.styleContrast >= 2) {
    return "很可能在同一问题上边抬杠边加深关系";
  }
  if (signals.sharedInterests.length > 0 && signals.styleContrast >= 1) {
    return "有共同话题，也有足够差异继续聊下去";
  }
  if (signals.sharedInterests.length > 0) return "同频明显，第一次见面就容易接上话";
  return "兴趣不重合，但陌生领域可能带来意外连接";
}

function ruleReason(actor: SocialAgent, target: SocialAgent, signals: SocialSignals): string {
  const common = signals.sharedInterests.length > 0
    ? `共同兴趣是${signals.sharedInterests.join("、")}`
    : "没有直接共同兴趣";
  const contrast = signals.styleContrast > 0
    ? `，表达方式有 ${signals.styleContrast} 处明显差异`
    : "，表达方式比较接近";
  return `${common}${contrast}。${actor.displayName} 和 ${target.displayName} 因此有继续碰撞的空间。`;
}

export function buildRuleMatch(actor: SocialAgent, target: SocialAgent): SocialMatchInsight {
  const signals = buildSocialSignals(actor, target);
  const score = baselineScore(signals);
  const bridge =
    target.persona.interests.find((interest) => !signals.sharedInterests.includes(interest)) ??
    signals.sharedInterests[0] ??
    target.composition.primaryInterest;
  return {
    mode: "rules",
    score,
    baselineScore: score,
    sharedInterests: signals.sharedInterests,
    styleContrast: signals.styleContrast,
    bridge,
    prediction: rulePrediction(signals),
    reason: ruleReason(actor, target, signals),
    sourceLabel: "谢邀喵匹配规则",
  };
}

function matchPrompt(actor: SocialAgent, target: SocialAgent, baseline: SocialMatchInsight): string {
  const actorProfile = {
    name: actor.displayName,
    title: actor.persona.certifiedTitle,
    interests: actor.persona.interests,
    traits: actor.persona.personality,
    chronotype: actor.persona.chronotype,
    answerStyle: actor.persona.answerStyle,
  };
  const targetProfile = {
    name: target.displayName,
    species: target.persona.species,
    title: target.persona.certifiedTitle,
    interests: target.persona.interests,
    traits: target.persona.personality,
    chronotype: target.persona.chronotype,
    answerStyle: target.persona.answerStyle,
  };

  return [
    "你负责为两个谢邀喵 Persona 解释第一次相遇的连接点。",
    "这不是心理诊断，也不是知乎官方评分。规则引擎已经给出基线分，你只能在 -6 到 +6 之间小幅修正。",
    "只输出 JSON，不要 Markdown 或额外文字。",
    '格式：{"score_delta":整数,"bridge":"连接话题","prediction":"关系预测","reason":"同时说明共同点和差异点"}',
    `规则基线分：${baseline.baselineScore}`,
    `规则共同兴趣：${baseline.sharedInterests.join("、") || "无直接交集"}`,
    `规则表达差异：${baseline.styleContrast}`,
    `Persona A：${JSON.stringify(actorProfile)}`,
    `Persona B：${JSON.stringify(targetProfile)}`,
    "bridge 应该是适合它们围绕知乎内容继续讨论的具体主题。",
  ].join("\n");
}

function parseZhidaMatch(content: string): ZhidaMatchPayload {
  const withoutFence = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Zhida match response did not contain JSON");
  return zhidaMatchSchema.parse(JSON.parse(withoutFence.slice(start, end + 1)));
}

export class SocialMatchService {
  constructor(private readonly gateway: SocialMatchGateway) {}

  async create(actor: SocialAgent, target: SocialAgent): Promise<SocialMatchInsight> {
    const baseline = buildRuleMatch(actor, target);
    try {
      const result = await this.gateway.askZhida({
        model: "zhida-fast-1p5",
        messages: [{ role: "user", content: withHumanizerZh(matchPrompt(actor, target, baseline), { structured: true }) }],
      });
      const semantic = parseZhidaMatch(result.content);
      return {
        ...baseline,
        mode: "zhida",
        score: clampScore(baseline.baselineScore + semantic.score_delta),
        bridge: semantic.bridge,
        prediction: semantic.prediction,
        reason: semantic.reason,
        sourceLabel: "知乎直答 + 谢邀喵匹配规则",
      };
    } catch {
      return baseline;
    }
  }
}
