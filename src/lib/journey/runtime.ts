import "server-only";

import { getAccountStore } from "@/lib/auth/runtime";
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

function journeySearchQuery(routeBias: string | null, interests: string[]): string {
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  if (route.includes("ai")) return "人工智能 AI";
  if (route.includes("吵")) {
    const topic = SEARCH_QUERY_BY_INTEREST[interests[0] ?? "综合"] ?? "社会";
    return `${topic.split(" ")[0]} 争议`;
  }
  if (route.includes("陌生")) return "心理学 历史 城市生活";
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
      headline: `${primaryInterest}，又被它圈了一次。`,
      body: `它沿着「${route}」出去，把你在知乎留下的「${primaryInterest}」线索重新理了一遍${secondaryInterest ? `，顺手把「${secondaryInterest}」也圈在旁边` : ""}。这张兴趣札记被塞进了旅行册。`,
    },
    {
      headline: `带回一张「${primaryInterest}」札记。`,
      body: `这趟它没有替你下结论，只把「${route}」和你长期留下的「${primaryInterest}」兴趣线叠在一起，做成了一张新的旅行札记。`,
    },
    {
      headline: `它把「${route}」记住了。`,
      body: `回来时，它把这次方向和你的「${primaryInterest}」人格线索并排记进旅行册。下一趟再碰见相关内容时，这条线会继续长。`,
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

  if (!unseenQuestions.length) {
    const narrative = await createJourneyNarrative({
      gateway,
      planSeed,
      routeBias,
      actor,
    });
    const primaryInterest = actor?.persona.interests[0] ?? "兴趣线索";
    return {
      question: null,
      contentSource: "live",
      knowledgeSource: "template",
      sourceFetchedAt: fetchedAt,
      postcardHeadline: narrative.headline,
      postcardBody: narrative.body,
      returnArtifact: {
        type: "NEW_SCENT",
        title: `${primaryInterest} · 旅行兴趣札记`,
        sourceUrl: "/atlas",
        sourceKey: `persona-note:${primaryInterest}:${planSeed}`,
      },
    };
  }

  const interestTerms = interests.flatMap((interest) => INTEREST_TERMS[interest] ?? []);
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
