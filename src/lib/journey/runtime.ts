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
  const hotItems = await gateway.getHotList(30);
  const questions = hotItems.filter((item) => isQuestion(item.url));
  if (!questions.length) {
    return {
      question: null,
      contentSource: "none",
      knowledgeSource: "none",
      sourceFetchedAt: fetchedAt,
      postcardBody: "今天的公开候选里没有合适的问题，它转了一圈就回来了。",
    };
  }

  let interests: string[] = [];
  let actor: SocialAgent | null = null;
  try {
    const zhihuProfile = await gateway.getUserProfile({ oauthAccessToken });
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

  const interestTerms = interests.flatMap((interest) => INTEREST_TERMS[interest] ?? []);
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  const recentRefs = new Set([...recentQuestionUrls, ...recentMemoryTopicRefs]);
  const unseenQuestions = questions.filter((item) => !recentRefs.has(item.url));
  const candidatePool = unseenQuestions.length ? unseenQuestions : questions;
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

  const selected = ranked[0]!.item;
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
    postcardBody: encounterName
      ? `它在「${selected.title}」前停了一会儿，还碰见了 ${encounterName}。你不在场，但两只 Persona 已经把这一幕聊完了。`
      : `它在「${selected.title}」前停了一会儿。没有替你下结论，只觉得这题值得叼回来。`,
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
