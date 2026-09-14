import "server-only";

import { buildComposition, buildPersona } from "@/lib/persona";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

import { JourneyService } from "./service";
import type { JourneyDiscoverer } from "./types";

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

const discoverJourneyContent: JourneyDiscoverer = async ({
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
  try {
    const profile = await gateway.getUserProfile({ oauthAccessToken });
    const persona = buildPersona(buildComposition(profile));
    interests = persona.interests;
  } catch {
    interests = [];
  }

  const interestTerms = interests.flatMap((interest) => INTEREST_TERMS[interest] ?? []);
  const route = routeBias?.toLocaleLowerCase("zh-CN") ?? "";
  const recentRefs = new Set([...recentQuestionUrls, ...recentMemoryTopicRefs]);
  const ranked = questions
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
    postcardBody: `它在「${selected.title}」前停了一会儿。没有替你下结论，只觉得这题值得叼回来。`,
  };
};

type JourneyGlobal = typeof globalThis & {
  __xieyaoJourneyService?: JourneyService;
};

const journeyGlobal = globalThis as JourneyGlobal;

export function getJourneyService(): JourneyService {
  journeyGlobal.__xieyaoJourneyService ??= new JourneyService({
    discover: discoverJourneyContent,
  });
  return journeyGlobal.__xieyaoJourneyService;
}
