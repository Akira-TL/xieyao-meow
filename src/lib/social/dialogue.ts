import { z } from "zod";

import { withHumanizerZh } from "@/lib/copy/humanizer";
import type { ZhidaRequest, ZhidaResult } from "@/lib/zhihu";

import type { SocialAgent } from "./types";

export type SocialDialogueMode = "zhida" | "rules";
export type SocialDialogueSpeaker = "self" | "other";

export interface SocialDialogueTurn {
  speaker: SocialDialogueSpeaker;
  text: string;
}

export interface SocialDialogueTopic {
  title: string;
  url: string;
  summary: string;
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

export interface SocialDialogueGateway {
  askZhida(input: ZhidaRequest): Promise<ZhidaResult>;
}

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
  text: z.string().trim().min(4).max(180),
});

const secondSpeakerSchema = z.object({
  text: z.string().trim().min(4).max(180),
  should_stop: z.boolean(),
  memory_note: z.string().trim().min(2).max(100),
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

function firstSpeakerPrompt(input: NextDialogueRoundInput, roundNumber: number): string {
  return [
    `你只扮演 Persona A「${input.actor.displayName}」，不要替 Persona B 说话。`,
    "你正在围绕一个知乎问题继续真实聊天。不要解释人格设定，不要做主持人总结，不要说‘作为 AI’。",
    "严格保持 A 的性格、兴趣、口头禅倾向和回答风格；最近经历只能让表达产生轻微变化，不能把核心性格洗掉。",
    "这一句应当直接回应上一轮，或提出新的具体判断 / 反例 / 有锋芒的问题。避免礼貌套话和机械复述题目。",
    "建议 18～72 个汉字。只输出 JSON，不要 Markdown。",
    '格式：{"text":"A 的下一句"}',
    `当前第 ${roundNumber} 轮，最多 ${MAX_ROUNDS} 轮。`,
    `知乎问题：${input.topic.title}`,
    `问题摘要：${input.topic.summary || "暂无摘要"}`,
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
  return [
    `你只扮演 Persona B「${input.target.displayName}」，不要替 Persona A 说话。`,
    "你刚刚听到 Persona A 的新一句话，现在必须用 B 自己的性格直接回应。不要解释人格设定，不要做主持人总结。",
    "可以抬杠、接梗、追问、让步或留下一个未解决的分歧；优先给具体反例和具体判断，不要说空泛的‘你说得有道理’。",
    "至少完成两轮之前 should_stop 必须倾向 false。两轮以后，只有形成自然共识、值得保留的分歧、或一句适合收尾的回扣时才允许 true。",
    "memory_note 记录这次聊天让 Persona A 多记住的一点，只写轻量经历，不改写核心人格。",
    "建议 18～72 个汉字。只输出 JSON，不要 Markdown。",
    '格式：{"text":"B 的回应","should_stop":false,"memory_note":"A 新记住的一点"}',
    `当前第 ${roundNumber} 轮，最多 ${MAX_ROUNDS} 轮。`,
    `知乎问题：${input.topic.title}`,
    `问题摘要：${input.topic.summary || "暂无摘要"}`,
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
  if (start === -1 || end <= start) throw new Error("Zhida dialogue response did not contain JSON");
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
      text: `${input.target.displayName}，这题我先不站队。按我这股${actorTrait}劲儿，我更想把「${actorInterest}」里的控制权拆清楚：替人做事可以，替人承担后果不行。`,
    },
    {
      speaker: "other",
      text: `${input.target.persona.catchphrase} 我从${targetTrait}这边看，麻烦不在“替不替”，而在替错以后人还能不能立刻反悔。`,
    },
  ];

  const later: [SocialDialogueTurn, SocialDialogueTurn] = [
    {
      speaker: "self",
      text: `那我收一半：默认可以更主动，但反悔成本必须低。否则所谓智能，只是把${actorInterest}的复杂度偷偷塞回给用户。`,
    },
    {
      speaker: "other",
      text: `这句我认。${targetInterest}那套我也不想全丢——下次真遇到一个“替人决定反而更轻松”的例子，我再来敲你。`,
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
  constructor(private readonly gateway: SocialDialogueGateway) {}

  async nextRound(input: NextDialogueRoundInput): Promise<SocialDialogueRound> {
    const roundNumber = roundNumberFor(input.history);
    try {
      const selfResult = await this.gateway.askZhida({
        model: "zhida-fast-1p5",
        messages: [{ role: "user", content: withHumanizerZh(firstSpeakerPrompt(input, roundNumber), { structured: true }) }],
      });
      const selfPayload = firstSpeakerSchema.parse(parseJsonObject(selfResult.content));

      const otherResult = await this.gateway.askZhida({
        model: "zhida-fast-1p5",
        messages: [{ role: "user", content: withHumanizerZh(secondSpeakerPrompt(input, roundNumber, selfPayload.text), { structured: true }) }],
      });
      const otherPayload = secondSpeakerSchema.parse(parseJsonObject(otherResult.content));

      const shouldStop = roundNumber >= MAX_ROUNDS || (roundNumber >= MIN_ROUNDS && otherPayload.should_stop);
      return {
        mode: "zhida",
        turns: [
          { speaker: "self", text: selfPayload.text },
          { speaker: "other", text: otherPayload.text },
        ],
        shouldStop,
        roundNumber,
        memoryNote: otherPayload.memory_note,
        sourceLabel: "知乎直答 · 双 Persona 对话",
      };
    } catch (error) {
      console.warn(
        "[social-dialogue] Zhida round unavailable; using persona fallback",
        error instanceof Error ? error.message : "unknown error",
      );
      return fallbackRound(input, roundNumber);
    }
  }
}
