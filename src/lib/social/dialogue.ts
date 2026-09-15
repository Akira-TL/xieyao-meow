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

function personaVoiceBrief(agent: SocialAgent): string {
  const traits = new Set(agent.persona.personality);
  const rules: string[] = [];

  if (traits.has("工程脑") || traits.has("爱抬杠")) {
    rules.push("说话习惯先拆机制、边界或因果链；可以自然冒出‘先拆一层’‘等等，这里有个边界’，不要反复说‘底层逻辑’。");
  }
  if (traits.has("考据党") || traits.has("证据优先") || traits.has("证据派") || traits.has("模式猎手")) {
    rules.push("习惯追问证据、样本、定义和可验证条件；可偶尔说‘先看证据’‘样本呢？’，但没有数据时绝不能编数字。");
  }
  if (traits.has("亲人") || traits.has("护短") || traits.has("生活派") || traits.has("情绪观察员")) {
    rules.push("先落到人的真实感受、麻烦和日常细节；语气可以护短、温和，常从‘人舒不舒服’‘真用起来麻不麻烦’切入。");
  }
  if (traits.has("现实派") || traits.has("行动快") || traits.has("会算账")) {
    rules.push("喜欢追问成本、收益、谁执行、谁买单；可以说‘账先算明白’‘落到执行上呢’，不要写成商业汇报。");
  }
  if (traits.has("胜负欲") || traits.has("反应快") || traits.has("梗很多")) {
    rules.push("允许少量游戏口吻，如‘机制’‘开局’‘翻车’‘这波’，每句话最多一个，不要变成满屏网络梗。");
  }
  if (traits.has("感性") || traits.has("会观察") || traits.has("叙事欲强") || traits.has("创作派") || traits.has("画面先行")) {
    rules.push("偏爱具体画面、动作和感官细节；会说‘给我个画面’‘我先想象一下’，没有事实素材时只能明确用‘比如/假设’来构造画面。");
  }
  if (traits.has("杂食") || traits.has("适应力强") || traits.has("跨界玩家") || traits.has("行动派")) {
    rules.push("口气更像探索者，愿意先试再判断；可以说‘先去看看’‘回来再下结论’，不要假装已经真的去过。");
  }
  if (traits.has("反方辩手") || traits.has("技术乐子人")) {
    rules.push("本能会找反例和边界条件；常用‘等等’‘那要是……呢？’‘为什么？’这种短切口，别每句都抬杠。");
  }

  const base = rules.length
    ? rules.join(" ")
    : `按「${agent.persona.answerStyle.tone}」自然说话，句式和节奏要能和另一个角色听出区别。`;
  return [
    base,
    `角色原始口头禅是「${agent.persona.catchphrase}」。把它当成语言习惯，不要整句重复；最多隔 2～3 轮借其中一个词或半句自然带出一次。`,
    "不要用‘作为一个……’自报人格，不要把 personality 标签直接说出口。",
  ].join(" ");
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
    `A 的专属说话习惯：${personaVoiceBrief(input.actor)}`,
    `B 的说话习惯只用来帮助 A 区分对方，不要偷用：${personaVoiceBrief(input.target)}`,
    "这一句必须像在接人话：直接回应上一句里的一个词、判断或漏洞，再往前推半步。避免礼貌套话、总结腔、主持人口吻和机械复述题目。",
    "允许半句、反问、短停顿和不完整句；不要每轮都先下定义、再分析、再总结。",
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
    `B 的专属说话习惯：${personaVoiceBrief(input.target)}`,
    `A 的说话习惯只用来帮助 B 听出差异，不要偷用：${personaVoiceBrief(input.actor)}`,
    "可以抬杠、接梗、追问、让步或留下一个未解决的分歧；优先接住 A 刚刚说的具体词句，不要说空泛的‘你说得有道理’。",
    "允许半句、反问、短停顿和轻微口语；不要每轮都写成完整小论文。",
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
