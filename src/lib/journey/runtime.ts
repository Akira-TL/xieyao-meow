import "server-only";

import { getAccountStore } from "@/lib/auth/runtime";
import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import { tryCreateDeepSeekFlashClientFromEnv } from "@/lib/narrative/deepseek";
import { buildComposition, buildPersona } from "@/lib/persona";
import { SocialDialogueService, type SocialAgent, type SocialDialogueTopic } from "@/lib/social";
import {
  SharedEncounterService,
  type SharedEncounterProvenance,
} from "@/lib/social/shared-encounter";
import { getSharedEncounterStore } from "@/lib/social/runtime";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

import {
  createFallbackJourneyInsight,
  createJourneyInsight,
  JOURNEY_INTEREST_TERMS,
  resolveJourneyInsightTopic,
} from "./insight";
import { JourneyService } from "./service";
import type { JourneyConversation, JourneyDiscoverer, JourneyReturnArtifactSeed, JourneyQuestion } from "./types";

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

function journeySearchQuery(routeBias: string | null, interests: string[]): string {
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  if (route.includes("ai") || route.includes("数码") || route.includes("人工智能")) return "人工智能 AI";
  if (route.includes("科学") || route.includes("研究")) return "科学 研究";
  if (route.includes("宠物") || route.includes("动物")) return "宠物 动物";
  if (route.includes("游戏")) return "游戏 玩家";
  if (route.includes("职场") || route.includes("创业")) return "职场 创业";
  if (route.includes("生活") || route.includes("轻松")) return "文化 生活";
  if (route.includes("吵") || route.includes("争议") || route.includes("反对")) {
    const topic = SEARCH_QUERY_BY_INTEREST[interests[0] ?? "综合"] ?? "社会";
    return `${topic.split(" ")[0]} 争议`;
  }
  if (route.includes("陌生") || route.includes("不会点开")) return "心理学 历史 城市生活";
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
  const primaryInterest = input.actor?.persona.interests[0] ?? "这条兴趣线";
  const secondaryInterest = input.actor?.persona.interests[1];
  const route = input.routeBias ?? "随便逛";
  const variants = [
    {
      headline: `它又重新看了一眼「${primaryInterest}」。`,
      body: `这趟它沿着「${route}」出去，把这次方向和你已经留下的「${primaryInterest}」线索并排记进旅行册${secondaryInterest ? `，旁边也保留了「${secondaryInterest}」这条长期线索` : ""}。新的理解会继续等真实内容来校准。`,
    },
    {
      headline: "这一趟，它把两条线放在了一起。",
      body: `「${route}」是你给的方向；「${primaryInterest}」是它已经知道的长期线索。它先把两者并排记下，再用之后可追溯的内容继续校准。`,
    },
    {
      headline: `它把「${route}」原样记住了。`,
      body: `回来时，它只保留了这次方向和既有的「${primaryInterest}」人格线索。下一趟碰到真实内容以后，再看这条理解要不要继续长。`,
    },
  ];
  return variants[stableTieBreak(`${input.planSeed}:profile-note`) % variants.length]!;
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
  // Journey 回信只重述已经验证过的事实，不再为每趟旅行消耗 zhida_openai 配额。
  return fallbackJourneyNarrative(input);
}

function narrativeGateway() {
  return tryCreateDeepSeekFlashClientFromEnv();
}

const ENCOUNTER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function conversationCharCount(turns: JourneyConversation["turns"]): number {
  return turns.reduce((total, turn) => total + Array.from(turn.text).length, 0);
}

async function createNpcJourneyConversation(input: {
  actor: SocialAgent;
  topic: SocialDialogueTopic;
  planSeed: string;
}): Promise<JourneyConversation> {
  const target = COMMUNITY_RESIDENTS[
    stableTieBreak(`${input.planSeed}:npc`) % COMMUNITY_RESIDENTS.length
  ]! as SocialAgent;
  const dialogue = new SocialDialogueService(narrativeGateway());
  const history: JourneyConversation["turns"] = [];
  const memory = {
    encounterCount: 0,
    recentTopics: [] as string[],
    recentResidents: [] as string[],
    notes: [] as string[],
  };
  let sourceLabel = "Persona 对话回退";

  // Two short rounds are enough to feel like an encounter while keeping Flash usage bounded.
  for (let index = 0; index < 2; index += 1) {
    const round = await dialogue.nextRound({
      actor: input.actor,
      target,
      topic: {
        ...input.topic,
        summary: input.topic.summary.slice(0, 1800),
      },
      history,
      memory,
    });
    history.push(...round.turns);
    sourceLabel = round.sourceLabel;
    if (round.memoryNote) memory.notes = [...memory.notes, round.memoryNote].slice(-3);
  }

  return {
    kind: "NPC",
    participantId: target.id,
    participantName: target.displayName,
    turns: history,
    sourceLabel,
    textCharCount: conversationCharCount(history),
  };
}

const discoverJourneyContent: JourneyDiscoverer = async ({
  userId,
  oauthAccessToken,
  routeBias,
  planSeed,
  primaryToolId,
  smallItemId,
  recentQuestionUrls,
  recentMemoryTopicRefs,
  recentInsightFeedback,
}) => {
  const gateway = createZhihuGatewayFromEnv();
  const fetchedAt = Date.now();

  const socialStore = getSharedEncounterStore();
  const cachedPersona = socialStore.getPersonaSnapshot(userId);
  let actor: SocialAgent | null = cachedPersona?.source === "live" ? cachedPersona.agent : null;
  let interests: string[] = actor?.persona.interests ?? [];
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
    const signalCount = zhihuProfile.contents.length
      + zhihuProfile.followees.length
      + zhihuProfile.collections.length
      + zhihuProfile.favlists.length;
    if (signalCount > 0) {
      const composition = buildComposition(zhihuProfile);
      const persona = buildPersona(composition);
      interests = persona.interests;
      actor = {
        id: `user:${userId}`,
        displayName: getAccountStore().getUserProfile(userId).catName,
        composition,
        persona,
      };
      socialStore.savePersonaSnapshot(userId, actor, "live");
    }
  } catch {
    // Keep the last verified Persona snapshot if the user-data API is temporarily unavailable.
  }

  const hotQuestions: Array<{ title: string; url: string; summary: string; thumbnailUrl: string }> = [];
  try {
    for (const item of await gateway.getHotList(30)) {
      if (!isQuestion(item.url)) continue;
      hotQuestions.push({
        title: item.title,
        url: item.url,
        summary: item.summary,
        thumbnailUrl: item.thumbnailUrl,
      });
    }
  } catch {
    // Hot list is a once-per-day reservoir. A failed daily pull must not block the Journey.
  }

  const questionMap = new Map<string, { title: string; url: string; summary: string; thumbnailUrl: string }>();
  for (const item of [...hotQuestions, ...profileQuestions]) {
    if (!questionMap.has(item.url)) questionMap.set(item.url, item);
  }

  const recentRefs = new Set([...recentQuestionUrls, ...recentMemoryTopicRefs]);
  let unseenQuestions = [...questionMap.values()].filter((item) => !recentRefs.has(item.url));

  // Search is a sparse refill, not a per-Journey dependency. With a healthy local pool this makes no API call.
  if (unseenQuestions.length < 4) {
    const searchQuery = journeySearchQuery(routeBias, interests);
    try {
      const searched = (await gateway.searchZhihu(searchQuery, 8))
        .filter((item) => isQuestion(item.url))
        .map((item) => ({
          title: item.title,
          url: item.url,
          summary: item.summary,
          thumbnailUrl: "",
        }));
      for (const item of searched) {
        if (!questionMap.has(item.url)) questionMap.set(item.url, item);
      }
      unseenQuestions = [...questionMap.values()].filter((item) => !recentRefs.has(item.url));
    } catch {
      // Persisted hot/search/profile pools remain available when the daily search quota is exhausted.
    }
  }

  const encounterChance = smallItemId === "dried_fish" ? 75 : 55;
  const shouldEncounter = stableTieBreak(`${planSeed}:encounter-roll`) % 100 < encounterChance;

  if (!unseenQuestions.length) {
    const conversation = actor && shouldEncounter
      ? await createNpcJourneyConversation({
          actor,
          planSeed,
          topic: {
            title: routeBias ? `纸条「${routeBias}」` : "没有指定方向的随便逛",
            url: "/home",
            summary: `这是旅途路上的 Persona 闲聊，不是知乎问题，也不代表外部事实。已知路线倾向：${routeBias ?? "随便逛"}。Persona 当前兴趣：${interests.join("、") || actor.composition.primaryInterest}。`,
            contextLabel: "本趟路线",
          },
        })
      : undefined;
    const narrative = await createJourneyNarrative({
      gateway,
      planSeed,
      routeBias,
      actor,
      encounterName: conversation?.participantName ?? null,
    });
    const insight = actor
      ? await createJourneyInsight({
          persona: actor.persona,
          composition: actor.composition,
          topic: resolveJourneyInsightTopic(routeBias, null, interests),
          routeBias,
          question: null,
          recentFeedback: recentInsightFeedback,
        }, narrativeGateway())
      : createFallbackJourneyInsight(routeBias);
    return {
      question: null,
      contentSource: actor ? "live" : "none",
      knowledgeSource: "template",
      sourceFetchedAt: fetchedAt,
      postcardHeadline: narrative.headline,
      postcardBody: narrative.body,
      insight,
      ...(conversation ? { conversation } : {}),
    };
  }

  const interestTerms = interests.flatMap((interest) => JOURNEY_INTEREST_TERMS[interest] ?? []);
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
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
      for (const feedback of recentInsightFeedback) {
        const feedbackTerms = JOURNEY_INTEREST_TERMS[feedback.topic] ?? [feedback.topic.toLocaleLowerCase("zh-CN")];
        if (!feedbackTerms.some((term) => haystack.includes(term))) continue;
        score += feedback.action === "CONFIRM_INTEREST"
          ? 3
          : feedback.action === "CORRECT_INTEREST"
            ? -3
            : -6;
      }
      const routeTopic = Object.entries(JOURNEY_INTEREST_TERMS).find(([topic]) => {
        const key = topic.toLocaleLowerCase("zh-CN");
        return route.includes(key) || (topic === "AI 与数码" && (route.includes("ai") || route.includes("数码")));
      });
      if (routeTopic) {
        score += routeTopic[1].some((term) => haystack.includes(term)) ? 2 : 0;
      }
      if (route.includes("陌生") || route.includes("不会点开")) score += interestHits === 0 ? 2 : 0;

      if (primaryToolId === "notebook" && item.summary.trim().length >= 180) score += 3;
      if (primaryToolId === "magnifier") {
        score += ["证据", "数据", "研究", "实验", "机制", "报告", "样本"].some((term) =>
          haystack.includes(term),
        )
          ? 4
          : 0;
      }
      if (primaryToolId === "old_camera" && item.thumbnailUrl) score += 4;
      if (primaryToolId === "clipboard") {
        score += ["争议", "反对", "是否", "为什么", "如何看待", "支持"].some((term) =>
          haystack.includes(term),
        )
          ? 4
          : 0;
      }

      if (route.includes("吵") || route.includes("争议") || route.includes("反对")) {
        score += ["争议", "应该", "是否", "为什么", "如何看待"].some((term) =>
          haystack.includes(term),
        )
          ? 2
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
  let conversation: JourneyConversation | undefined;
  const question: JourneyQuestion = {
    title: selected.title,
    url: selected.url,
    summary: selected.summary,
    ...(selected.thumbnailUrl ? { thumbnailUrl: selected.thumbnailUrl } : {}),
  };

  if (actor && shouldEncounter) {
    const store = getSharedEncounterStore();
    const target = store.findPersonaCandidate(userId);
    const relationship = target ? store.getRelationship(userId, target.userId) : null;
    const insideCooldown = relationship?.lastEncounterAt
      ? fetchedAt - relationship.lastEncounterAt < ENCOUNTER_COOLDOWN_MS
      : false;

    // Prefer another real activated User Persona whenever one is available.
    if (target && target.source === "live" && !insideCooldown) {
      const provenance: SharedEncounterProvenance = {
        contentSource: "live",
        knowledgeSource: "journey-selected-question",
        fetchedAt,
      };
      try {
        const encounter = await new SharedEncounterService(
          store,
          new SocialDialogueService(narrativeGateway()),
        ).create({
          requestUserId: userId,
          otherUserId: target.userId,
          topic: {
            title: question.title,
            url: question.url,
            summary: question.summary.slice(0, 1800),
          },
          provenance,
        });
        if (encounter.status === "completed") {
          encounterName = target.agent.displayName;
          const turns = encounter.turns.map((turn) => ({
            speaker: turn.speakerUserId === userId ? "self" as const : "other" as const,
            text: turn.text,
          }));
          conversation = {
            kind: "USER",
            participantId: target.userId,
            participantName: target.agent.displayName,
            turns,
            sourceLabel: "Shared Encounter · 真实用户 Persona 对话",
            textCharCount: conversationCharCount(turns),
          };
          returnArtifact = {
            type: "RELATION_TICKET",
            title: `和 ${target.agent.displayName} 的一场相遇`,
            sourceUrl: "/encounter",
            sourceKey: encounter.id,
          };
        }
      } catch {
        // A failed real-user encounter falls through to an NPC encounter instead of blocking the Journey.
      }
    }

    if (!conversation) {
      conversation = await createNpcJourneyConversation({ actor, topic: question, planSeed });
      encounterName = conversation.participantName;
    }
  }

  const narrative = await createJourneyNarrative({
    gateway,
    planSeed,
    routeBias,
    actor,
    questionTitle: question.title,
    questionSummary: question.summary,
    encounterName,
  });
  const insight = actor
    ? await createJourneyInsight({
        persona: actor.persona,
        composition: actor.composition,
        topic: resolveJourneyInsightTopic(routeBias, question, interests),
        routeBias,
        question,
        encounterName,
        recentFeedback: recentInsightFeedback,
      }, narrativeGateway())
    : createFallbackJourneyInsight(routeBias);

  return {
    question,
    contentSource: "live",
    knowledgeSource: "template",
    sourceFetchedAt: fetchedAt,
    postcardHeadline: narrative.headline,
    postcardBody: narrative.body,
    insight,
    ...(conversation ? { conversation } : {}),
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
