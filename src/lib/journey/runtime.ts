import "server-only";

import { getAccountStore } from "@/lib/auth/runtime";
import { withHumanizerZh } from "@/lib/copy/humanizer";
import { buildComposition, buildPersona } from "@/lib/persona";
import { SocialDialogueService, type SocialAgent } from "@/lib/social";
import {
  SharedEncounterService,
  type SharedEncounterProvenance,
} from "@/lib/social/shared-encounter";
import { getSharedEncounterStore } from "@/lib/social/runtime";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

import { JourneyService } from "./service";
import type { JourneyDiscoverer, JourneyReturnArtifactSeed } from "./types";

const INTEREST_TERMS: Record<string, string[]> = {
  "AI 与数码": ["ai", "人工智能", "大模型", "模型", "机器人", "科技", "数码", "智能"],
  "宠物": ["宠物", "猫", "狗", "动物"],
  "科学": ["科学", "物理", "化学", "生物", "研究", "实验", "宇宙"],
  "职场与创业": ["职场", "工作", "公司", "创业", "职业", "管理"],
  "游戏": ["游戏", "玩家", "电竞", "主机"],
  "文化与生活": ["文化", "生活", "电影", "音乐", "文学", "社会"],
  "综合": [],
};

function isQuestion(url: string): boolean {
  try {
    return new URL(url).pathname.includes("/question/");
  } catch {
    return false;
  }
}

function stableTieBreak(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return hash >>> 0;
}

const SEARCH_QUERY_BY_INTEREST: Record<string, string> = {
  "AI 与数码": "人工智能 AI",
  "宠物": "宠物 动物",
  "科学": "科学 研究",
  "职场与创业": "职场 创业",
  "游戏": "游戏 玩家",
  "文化与生活": "文化 生活",
  "综合": "社会 生活",
};

function journeySearchQuery(routeBias: string | null, interests: string[], planSeed: string): string {
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  if (route.includes("ai")) return "人工智能 AI";
  if (route.includes("吵")) {
    const topic = SEARCH_QUERY_BY_INTEREST[interests[0] ?? "综合"] ?? "社会";
    return `${topic.split(" ")[0]} 争议`;
  }
  if (route.includes("陌生")) {
    const options = ["心理学", "历史", "城市生活", "生物", "文学", "设计", "经济学"];
    return options[stableTieBreak(`${planSeed}:strange-query`) % options.length]!;
  }
  return SEARCH_QUERY_BY_INTEREST[interests[0] ?? "综合"] ?? "社会 生活";
}

type JourneyNarrative = { headline: string; body: string };

function fallbackJourneyNarrative(input: {
  planSeed: string;
  routeBias: string | null;
  actor: SocialAgent | null;
  questionTitle?: string;
  encounterName?: string | null;
}): JourneyNarrative {
  if (input.encounterName && input.questionTitle) {
    return {
      headline: `路上碰见了 ${input.encounterName}。`,
      body: `它们在「${input.questionTitle}」前停在了同一个地方。你塞的纸条是「${input.routeBias ?? "随便逛"}」，但这场相遇不是你安排的。`,
    };
  }
  if (input.questionTitle) {
    const variants = [
      { headline: "包里多了一张问题票。", body: `它在「${input.questionTitle}」前停了下来。没有替你回答，只把原问题和自己的停留记进了旅行册。` },
      { headline: "这题，被它留了下来。", body: `「${input.questionTitle}」让它多停了一会儿。纸条只给了方向，真正停在哪一题是它自己选的。` },
      { headline: "它给这一题留了位置。", body: `这趟留下的是「${input.questionTitle}」。它没替你下结论，只保留了原问题和这次停留。` },
    ];
    return variants[stableTieBreak(`${input.planSeed}:question-copy`) % variants.length]!;
  }
  const title = input.actor?.persona.certifiedTitle;
  const variants = [
    { headline: "这趟，包里没多一张票。", body: `没有新的知乎原问题被收进旅行册。${title ? `以「${title}」的脾气，它宁可空一格，也不拿无来源的东西凑数。` : "空一格，也比拿无来源的东西凑数强。"}` },
    { headline: "这一页先空着。", body: `这次没有留下能追溯到知乎原问题的新票根。你给的是「${input.routeBias ?? "随便逛"}」，结果由它自己承担。` },
    { headline: "没捡到新票根。", body: "旅行照样发生了，只是没有新的公开问题满足收录条件。这一趟只留下出门记录。" },
  ];
  return variants[stableTieBreak(`${input.planSeed}:empty-copy`) % variants.length]!;
}

function parseJourneyNarrative(raw: string, fallback: JourneyNarrative): JourneyNarrative {
  const match = raw.replace(/```(?:json)?/gi, "").match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    const parsed = JSON.parse(match[0]) as { headline?: unknown; body?: unknown };
    const headline = typeof parsed.headline === "string" ? parsed.headline.trim().slice(0, 36) : "";
    const body = typeof parsed.body === "string" ? parsed.body.trim().slice(0, 180) : "";
    return headline && body ? { headline, body } : fallback;
  } catch {
    return fallback;
  }
}

async function createJourneyNarrative(input: {
  gateway: ReturnType<typeof createZhihuGatewayFromEnv>;
  planSeed: string;
  routeBias: string | null;
  actor: SocialAgent | null;
  questionTitle?: string;
  questionSummary?: string;
  encounterName?: string | null;
}): Promise<JourneyNarrative> {
  const fallback = fallbackJourneyNarrative(input);
  if (!input.actor) return fallback;
  const facts = [
    `纸条方向：${input.routeBias ?? "随便逛"}`,
    input.questionTitle ? `确实带回的知乎原问题：${input.questionTitle}` : "这趟没有可收录的知乎原问题",
    input.questionSummary ? `原问题摘要：${input.questionSummary.slice(0, 420)}` : "",
    input.encounterName ? `途中确实遇见了：${input.encounterName}` : "途中没有已完成的 Shared Encounter",
  ].filter(Boolean).join("\n");
  const prompt = [
    "你是谢邀喵 Journey 的 Persona 表达层，只负责把已给事实写成一张短旅途札记。",
    "绝对不能新增地点、事件、人物、观点或知乎内容；没有问题就明确允许空手，不要假装看到了什么。",
    "不要使用这些句式或近似套话：你没叫它回来、它还是按时回家了、值得带回来、今天没碰到值得带回来的新问题、按时回来。",
    "口吻要像这只猫自己留下的便签，不像系统状态提示。标题 6–18 个中文字符；正文 30–80 个中文字符。",
    `人格头衔：${input.actor.persona.certifiedTitle}`,
    `性格：${input.actor.persona.personality.join("、")}`,
    `口头禅：${input.actor.persona.catchphrase}`,
    `回答风格：${input.actor.persona.answerStyle.tone}；${input.actor.persona.answerStyle.length}；${input.actor.persona.answerStyle.density}`,
    "事实边界：",
    facts,
    '只输出 JSON：{"headline":"...","body":"..."}',
  ].join("\n\n");
  try {
    const result = await input.gateway.askZhida({
      model: "zhida-fast-1p5",
      messages: [{ role: "user", content: withHumanizerZh(prompt) }],
    });
    return parseJourneyNarrative(result.content, fallback);
  } catch {
    return fallback;
  }
}

const ENCOUNTER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function shouldTryEncounter(planSeed: string, routeBias: string | null): boolean {
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  const chance = route.includes("吵") ? 85 : route.includes("陌生") ? 55 : 35;
  return stableTieBreak(`${planSeed}:shared-encounter`) % 100 < chance;
}

const discoverJourneyContent: JourneyDiscoverer = async ({
  userId,
  oauthAccessToken,
  routeBias,
  planSeed,
  recentQuestionUrls,
  recentMemoryTopicRefs,
}) => {
  const gateway = createZhihuGatewayFromEnv();
  const fetchedAt = Date.now();

  let interests: string[] = [];
  let actor: SocialAgent | null = null;
  let profileQuestions: Array<{ title: string; url: string; summary: string; thumbnailUrl: string }> = [];
  try {
    const zhihuProfile = await gateway.getUserProfile({ oauthAccessToken });
    profileQuestions = [...zhihuProfile.collections, ...zhihuProfile.contents]
      .filter((item) => Boolean(item.title?.trim()) && isQuestion(item.url))
      .map((item) => ({
        title: item.title.trim(),
        url: item.url,
        summary: item.summary ?? "",
        thumbnailUrl: "",
      }));
    const composition = buildComposition(zhihuProfile);
    const persona = buildPersona(composition);
    interests = persona.interests;
    actor = {
      id: `user:${userId}`,
      displayName: getAccountStore().getUserProfile(userId).catName,
      composition,
      persona,
    };
    getSharedEncounterStore().savePersonaSnapshot(userId, actor, "live");
  } catch {
    interests = [];
    actor = null;
  }

  const searchQuery = journeySearchQuery(routeBias, interests, planSeed);
  let questions: Array<{ title: string; url: string; summary: string; thumbnailUrl: string }> = [];
  try {
    questions = (await gateway.searchZhihu(searchQuery, 8))
      .filter((item) => isQuestion(item.url))
      .map((item) => ({
        title: item.title,
        url: item.url,
        summary: item.summary,
        thumbnailUrl: "",
      }));
  } catch {
    questions = [];
  }
  if (!questions.length && profileQuestions.length) {
    questions = profileQuestions;
  }
  if (!questions.length) {
    const narrative = await createJourneyNarrative({
      gateway,
      planSeed,
      routeBias,
      actor,
    });
    return {
      question: null,
      contentSource: "none",
      knowledgeSource: "none",
      sourceFetchedAt: fetchedAt,
      postcardHeadline: narrative.headline,
      postcardBody: narrative.body,
    };
  }

  const interestTerms = interests.flatMap((interest) => INTEREST_TERMS[interest] ?? []);
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  const recentRefs = new Set([...recentQuestionUrls, ...recentMemoryTopicRefs]);
  const unseenQuestions = questions.filter((item) => !recentRefs.has(item.url));
  if (!unseenQuestions.length) {
    const narrative = await createJourneyNarrative({
      gateway,
      planSeed,
      routeBias,
      actor,
    });
    return {
      question: null,
      contentSource: "none",
      knowledgeSource: "none",
      sourceFetchedAt: fetchedAt,
      postcardHeadline: narrative.headline,
      postcardBody: narrative.body,
    };
  }
  const candidatePool = unseenQuestions;
  const ranked = candidatePool
    .map((item) => {
      const haystack = `${item.title} ${item.summary}`.toLocaleLowerCase("zh-CN");
      const interestHits = interestTerms.reduce(
        (sum, term) => sum + (haystack.includes(term) ? 1 : 0),
        0,
      );
      let score = interestHits * 4;
      if (recentRefs.has(item.url)) score -= 20;
      if (route.includes("ai")) {
        score += INTEREST_TERMS["AI 与数码"].some((term) => haystack.includes(term)) ? 8 : 0;
      }
      if (route.includes("陌生")) score += interestHits === 0 ? 7 : 0;
      if (route.includes("吵")) {
        score += ["争议", "应该", "是否", "为什么", "如何看待"].some((term) =>
          haystack.includes(term),
        )
          ? 5
          : 0;
      }
      return {
        item,
        score,
        tie: stableTieBreak(`${planSeed}:${item.url}`),
      };
    })
    .sort((left, right) => right.score - left.score || left.tie - right.tie);

  const shortlist = ranked.slice(0, Math.min(8, ranked.length));
  const minScore = Math.min(...shortlist.map((entry) => entry.score));
  const weighted = shortlist.map((entry) => ({
    ...entry,
    weight: Math.max(1, entry.score - minScore + 2),
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = stableTieBreak(`${planSeed}:weighted-topic`) % totalWeight;
  let selected = weighted[0]!.item;
  for (const entry of weighted) {
    if (roll < entry.weight) {
      selected = entry.item;
      break;
    }
    roll -= entry.weight;
  }
  let returnArtifact: JourneyReturnArtifactSeed | undefined;
  let encounterName: string | null = null;

  if (actor && shouldTryEncounter(planSeed, routeBias)) {
    const store = getSharedEncounterStore();
    const target = store.findPersonaCandidate(userId);
    const relationship = target ? store.getRelationship(userId, target.userId) : null;
    const insideCooldown = relationship?.lastEncounterAt
      ? fetchedAt - relationship.lastEncounterAt < ENCOUNTER_COOLDOWN_MS
      : false;

    if (target && target.source === "live" && !insideCooldown) {
      const provenance: SharedEncounterProvenance = {
        contentSource: "live",
        knowledgeSource: "journey-selected-question",
        fetchedAt,
      };
      try {
        const encounter = await new SharedEncounterService(
          store,
          new SocialDialogueService(gateway),
        ).create({
          requestUserId: userId,
          otherUserId: target.userId,
          topic: {
            title: selected.title,
            url: selected.url,
            summary: selected.summary.slice(0, 1800),
          },
          provenance,
        });
        if (encounter.status === "completed") {
          encounterName = target.agent.displayName;
          returnArtifact = {
            type: "RELATION_TICKET",
            title: `和 ${target.agent.displayName} 的一场相遇`,
            sourceUrl: "/encounter",
            sourceKey: encounter.id,
          };
        }
      } catch {
        // Social luck never blocks a Journey from coming home.
      }
    }
  }

  const narrative = await createJourneyNarrative({
    gateway,
    planSeed,
    routeBias,
    actor,
    questionTitle: selected.title,
    questionSummary: selected.summary,
    encounterName,
  });

  return {
    question: {
      title: selected.title,
      url: selected.url,
      summary: selected.summary,
      ...(selected.thumbnailUrl ? { thumbnailUrl: selected.thumbnailUrl } : {}),
    },
    contentSource: "live",
    knowledgeSource: "template",
    sourceFetchedAt: fetchedAt,
    postcardHeadline: narrative.headline,
    postcardBody: narrative.body,
    ...(returnArtifact ? { returnArtifact } : {}),
  };
};

function rehearsalTimeScale(): number {
  const raw = process.env.XIEYAO_REHEARSAL_JOURNEY_TIME_SCALE?.trim();
  if (!raw) return 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(1, Math.max(0.01, parsed)) : 1;
}

type JourneyGlobal = typeof globalThis & {
  __xieyaoJourneyService?: JourneyService;
};

const journeyGlobal = globalThis as JourneyGlobal;

export function getJourneyService(): JourneyService {
  journeyGlobal.__xieyaoJourneyService ??= new JourneyService({
    discover: discoverJourneyContent,
    timeScale: rehearsalTimeScale(),
  });
  return journeyGlobal.__xieyaoJourneyService;
}
