import { z } from "zod";

import { withHumanizerZh } from "@/lib/copy/humanizer";
import type { PersonaNarrativeGateway } from "@/lib/narrative/deepseek";

import type { SocialAgent } from "./types";

export type SocialDialogueMode = "deepseek" | "rules";
export type SocialDialogueSpeaker = "self" | "other";

export interface SocialDialogueTurn {
  speaker: SocialDialogueSpeaker;
  text: string;
}

export interface SocialDialogueTopic {
  title: string;
  url: string;
  summary: string;
  contextLabel?: string;
}

export interface PersonaExperienceMemory {
  encounterCount: number;
  recentTopics: string[];
  recentResidents: string[];
  notes: string[];
}

export interface SocialDialogueRound {
  mode: SocialDialogueMode;
  turns: [SocialDialogueTurn, SocialDialogueTurn];
  shouldStop: boolean;
  roundNumber: number;
  memoryNote: string;
  sourceLabel: string;
}

export type SocialDialogueGateway = PersonaNarrativeGateway;

export interface NextDialogueRoundInput {
  actor: SocialAgent;
  target: SocialAgent;
  topic: SocialDialogueTopic;
  history: SocialDialogueTurn[];
  memory: PersonaExperienceMemory;
}

const MIN_ROUNDS = 2;
const MAX_ROUNDS = 4;

const firstSpeakerSchema = z.object({
  text: z.string().trim().min(4).max(64),
});

const secondSpeakerSchema = z.object({
  text: z.string().trim().min(4).max(64),
  should_stop: z.boolean(),
  memory_note: z.string().trim().min(2).max(56),
});

function roundNumberFor(history: SocialDialogueTurn[]): number {
  return Math.min(MAX_ROUNDS, Math.floor(history.length / 2) + 1);
}

function compactPersona(agent: SocialAgent) {
  return {
    name: agent.displayName,
    species: agent.persona.species,
    title: agent.persona.certifiedTitle,
    personality: agent.persona.personality,
    interests: agent.persona.interests,
    catchphrase: agent.persona.catchphrase,
    chronotype: agent.persona.chronotype,
    answerStyle: agent.persona.answerStyle,
  };
}

function compactHistory(input: NextDialogueRoundInput) {
  return input.history.map((turn) => ({
    speaker: turn.speaker === "self" ? input.actor.displayName : input.target.displayName,
    text: turn.text,
  }));
}

function factBoundary(input: NextDialogueRoundInput): string {
  if (input.topic.contextLabel === "本趟路线") {
    return "这不是外部事实场景。只能依据已提供的纸条、Persona 兴趣和性格进行讨论；禁止声称自己真实看过某条新闻、首页推荐、直播、商品、人物、日期、价格、数量或其他未提供的具体事件。需要举例时必须明确写成‘比如’或‘假设’。";
  }
  return "只能依据已提供的问题标题与摘要讨论；不要补写摘要里没有的具体人物、时间、数字、事件或来源。需要举例时明确标成假设。";
}

function firstSpeakerPrompt(input: NextDialogueRoundInput, roundNumber: number): string {
  const contextLabel = input.topic.contextLabel ?? "知乎问题";
  return [
    `你只扮演 Persona A「${input.actor.displayName}」，不要替 Persona B 说话。`,
    `你正在围绕下面的「${contextLabel}」继续真实聊天。不要解释人格设定，不要做主持人总结，不要说‘作为 AI’。`,
    factBoundary(input),
    "严格保持 A 的性格、兴趣、口头禅倾向和回答风格；最近经历只能让表达产生轻微变化，不能把核心性格洗掉。",
    "这一句应当直接回应上一轮，或提出新的具体判断 / 反例 / 有锋芒的问题。避免礼貌套话和机械复述题目。",
    "正文控制在 16～64 个汉字。只输出 JSON，不要 Markdown。",
    '格式：{"text":"A 的下一句"}',
    `当前第 ${roundNumber} 轮，最多 ${MAX_ROUNDS} 轮。`,
    `${contextLabel}：${input.topic.title}`,
    `上下文摘要：${input.topic.summary || "暂无摘要"}`,
    `Persona A：${JSON.stringify(compactPersona(input.actor))}`,
    `Persona B：${JSON.stringify(compactPersona(input.target))}`,
    `A 最近的经历记忆：${JSON.stringify(input.memory)}`,
    `已经聊过：${JSON.stringify(compactHistory(input))}`,
  ].join("\n");
}

function secondSpeakerPrompt(
  input: NextDialogueRoundInput,
  roundNumber: number,
  selfText: string,
): string {
  const contextLabel = input.topic.contextLabel ?? "知乎问题";
  return [
    `你只扮演 Persona B「${input.target.displayName}」，不要替 Persona A 说话。`,
    "你刚刚听到 Persona A 的新一句话，现在必须用 B 自己的性格直接回应。不要解释人格设定，不要做主持人总结。",
    factBoundary(input),
    "可以抬杠、接梗、追问、让步或留下一个未解决的分歧；优先给具体反例和具体判断，不要说空泛的‘你说得有道理’。",
    "至少完成两轮之前 should_stop 必须倾向 false。两轮以后，只有形成自然共识、值得保留的分歧、或一句适合收尾的回扣时才允许 true。",
    "memory_note 记录这次聊天让 Persona A 多记住的一点，只写轻量经历，不改写核心人格。",
    "正文控制在 16～64 个汉字，memory_note≤56字。只输出 JSON，不要 Markdown。",
    '格式：{"text":"B 的回应","should_stop":false,"memory_note":"A 新记住的一点"}',
    `当前第 ${roundNumber} 轮，最多 ${MAX_ROUNDS} 轮。`,
    `${contextLabel}：${input.topic.title}`,
    `上下文摘要：${input.topic.summary || "暂无摘要"}`,
    `Persona A：${JSON.stringify(compactPersona(input.actor))}`,
    `Persona B：${JSON.stringify(compactPersona(input.target))}`,
    `A 最近的经历记忆：${JSON.stringify(input.memory)}`,
    `此前对话：${JSON.stringify(compactHistory(input))}`,
    `A 刚刚的新一句：${selfText}`,
  ].join("\n");
}

function parseJsonObject(content: string): unknown {
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Persona dialogue response did not contain JSON");
  return JSON.parse(normalized.slice(start, end + 1));
}

function fallbackRound(input: NextDialogueRoundInput, roundNumber: number): SocialDialogueRound {
  const actorTrait = input.actor.persona.personality[0] ?? "好奇";
  const targetTrait = input.target.persona.personality[0] ?? "直觉派";
  const actorInterest = input.actor.persona.interests[0] ?? input.actor.composition.primaryInterest;
  const targetInterest = input.target.persona.interests[0] ?? input.target.composition.primaryInterest;

  const roundOne: [SocialDialogueTurn, SocialDialogueTurn] = [
    {
      speaker: "self",
      text: `${input.target.displayName}，我先不站队。按${actorTrait}这股劲，我想先拆清「${actorInterest}」里谁做决定、谁承担后果。`,
    },
    {
      speaker: "other",
      text: `${input.target.persona.catchphrase} 从${targetTrait}这边看，我更在意替错以后，人还能不能马上反悔。`,
    },
  ];

  const later: [SocialDialogueTurn, SocialDialogueTurn] = [
    {
      speaker: "self",
      text: `那我收一半：可以更主动，但反悔成本得低。否则只是把${actorInterest}的复杂度偷偷塞回给人。`,
    },
    {
      speaker: "other",
      text: `这句我认。${targetInterest}那套我也不全丢；下次遇到反例，我再来敲你。`,
    },
  ];

  return {
    mode: "rules",
    turns: roundNumber === 1 ? roundOne : later,
    shouldStop: roundNumber >= MIN_ROUNDS,
    roundNumber,
    memoryNote: roundNumber === 1
      ? `和${input.target.displayName}聊过“控制权和反悔成本”`
      : "开始把主动性和反悔成本放在一起判断",
    sourceLabel: "Persona 对话回退",
  };
}

export class SocialDialogueService {
  constructor(private readonly gateway: SocialDialogueGateway | null) {}

  async nextRound(input: NextDialogueRoundInput): Promise<SocialDialogueRound> {
    const roundNumber = roundNumberFor(input.history);
    try {
      if (!this.gateway) throw new Error("DeepSeek narrative gateway is unavailable");

      // One request owns exactly one speaker; B only sees A after A has finished.
      const selfResult = await this.gateway.generateJson({
        prompt: withHumanizerZh(firstSpeakerPrompt(input, roundNumber), { structured: true }),
        maxTokens: 180,
      });
      const selfPayload = firstSpeakerSchema.parse(parseJsonObject(selfResult.content));

      const otherResult = await this.gateway.generateJson({
        prompt: withHumanizerZh(secondSpeakerPrompt(input, roundNumber, selfPayload.text), { structured: true }),
        maxTokens: 220,
      });
      const otherPayload = secondSpeakerSchema.parse(parseJsonObject(otherResult.content));

      const shouldStop = roundNumber >= MAX_ROUNDS || (roundNumber >= MIN_ROUNDS && otherPayload.should_stop);
      return {
        mode: "deepseek",
        turns: [
          { speaker: "self", text: selfPayload.text },
          { speaker: "other", text: otherPayload.text },
        ],
        shouldStop,
        roundNumber,
        memoryNote: otherPayload.memory_note,
        sourceLabel: "DeepSeek Flash · 单角色逐句对话",
      };
    } catch (error) {
      console.warn(
        "[social-dialogue] DeepSeek round unavailable; using persona fallback",
        error instanceof Error ? error.message : "unknown error",
      );
      return fallbackRound(input, roundNumber);
    }
  }
}
