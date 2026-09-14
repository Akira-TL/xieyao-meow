import type { UserProfile } from "@/lib/zhihu";
import { resolvePersonaVisualVariant } from "./art";

import type {
  Chronotype,
  InterestName,
  InterestScore,
  PlayerPersona,
  WritingLength,
  ZhihuComposition,
} from "./types";

const INTEREST_KEYWORDS: Record<Exclude<InterestName, "综合">, string[]> = {
  "AI 与数码": [
    "ai",
    "agent",
    "llm",
    "mcp",
    "rag",
    "api",
    "大模型",
    "人工智能",
    "开发者",
    "编程",
    "程序",
    "软件",
    "数码",
    "模型",
    "工具",
  ],
  宠物: ["猫", "狗", "宠物", "猫咪", "猫猫", "养猫", "养狗"],
  科学: ["科学", "科研", "论文", "生物", "医学", "物理", "化学", "数学", "实验"],
  职场与创业: ["职场", "工作", "面试", "创业", "商业", "公司", "产品", "管理", "程序员"],
  游戏: ["游戏", "主机", "steam", "手游", "电竞", "玩家"],
  文化与生活: ["电影", "文学", "历史", "音乐", "旅行", "生活", "摄影", "艺术", "美食"],
};

const PERSONA_PRESETS: Record<InterestName, Omit<PlayerPersona, "interests" | "chronotype" | "answerStyle" | "easterEggs" | "visualVariant">> = {
  "AI 与数码": {
    species: "黑猫",
    appearance: ["炭黑短毛", "圆框眼镜", "知乎蓝工具包"],
    personality: ["工程脑", "好奇", "爱抬杠"],
    catchphrase: "这个问题，我先从底层逻辑扒两层。",
    certifiedTitle: "知乎盐选级工具猫",
  },
  宠物: {
    species: "黑猫",
    appearance: ["炭黑短毛", "肉垫徽章", "帆布零食挂包"],
    personality: ["亲人", "护短", "嘴馋"],
    catchphrase: "先别急，本喵闻一闻这个问题。",
    certifiedTitle: "铲屎官认证 · 资深纸箱测评员",
  },
  科学: {
    species: "黑猫",
    appearance: ["炭黑短毛", "窄框眼镜", "数据夹"],
    personality: ["考据党", "冷静", "证据优先"],
    catchphrase: "先看证据，再决定要不要炸毛。",
    certifiedTitle: "同行评审级严谨猫",
  },
  职场与创业: {
    species: "黑猫",
    appearance: ["炭黑短毛", "工牌领饰", "深色工具包"],
    personality: ["现实派", "行动快", "会算账"],
    catchphrase: "可以画饼，但先把账算明白。",
    certifiedTitle: "工位巡视委员会主任",
  },
  游戏: {
    species: "黑猫",
    appearance: ["炭黑短毛", "像素护目镜", "手柄吊坠"],
    personality: ["胜负欲", "反应快", "梗很多"],
    catchphrase: "这题先过一遍机制，再开打。",
    certifiedTitle: "连续在线但拒绝承认熬夜",
  },
  文化与生活: {
    species: "黑猫",
    appearance: ["炭黑短毛", "胶片相机挂件", "帆布斜挎包"],
    personality: ["感性", "会观察", "叙事欲强"],
    catchphrase: "这事儿有点意思，容本喵展开讲讲。",
    certifiedTitle: "生活观察局常驻猫员",
  },
  综合: {
    species: "黑猫",
    appearance: ["炭黑短毛", "问号吊牌", "知乎蓝旅行包"],
    personality: ["杂食", "适应力强", "什么都想看一眼"],
    catchphrase: "谢邀，这题本喵恰好路过。",
    certifiedTitle: "知乎在逃百科猫",
  },
};

function normalizeText(value: string): string {
  return value.toLocaleLowerCase("zh-CN");
}

function countKeywordHits(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  return keywords.reduce((sum, keyword) => {
    const needle = keyword.toLocaleLowerCase("zh-CN");
    let count = 0;
    let index = 0;
    while ((index = normalized.indexOf(needle, index)) !== -1) {
      count += 1;
      index += needle.length;
    }
    return sum + count;
  }, 0);
}

function scoreInterests(profile: UserProfile): InterestScore[] {
  const scores = new Map<Exclude<InterestName, "综合">, number>();
  for (const name of Object.keys(INTEREST_KEYWORDS) as Array<Exclude<InterestName, "综合">>) {
    scores.set(name, 0);
  }

  const addSignal = (text: string, weight: number) => {
    for (const [name, keywords] of Object.entries(INTEREST_KEYWORDS) as Array<
      [Exclude<InterestName, "综合">, string[]]
    >) {
      scores.set(name, (scores.get(name) ?? 0) + countKeywordHits(text, keywords) * weight);
    }
  };

  for (const content of profile.contents) {
    addSignal(`${content.title}\n${content.summary}`, 2);
  }
  for (const followee of profile.followees) {
    addSignal(`${followee.fullname}\n${followee.headline}`, 1);
  }
  for (const collection of profile.collections) {
    addSignal(`${collection.title}\n${collection.summary}`, 3);
    for (const favlist of collection.favlists) {
      addSignal(favlist.title, 2);
    }
  }
  for (const favlist of profile.favlists) {
    addSignal(`${favlist.title}\n${favlist.description}`, 4);
  }

  const sorted = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));

  if (sorted.length === 0) {
    return [{ name: "综合", score: 1 }];
  }

  const total = sorted.reduce((sum, [, score]) => sum + score, 0);
  return sorted.map(([name, score]) => ({
    name,
    score: Number((score / total).toFixed(3)),
  }));
}

function inferWritingLength(profile: UserProfile): WritingLength {
  if (profile.contents.length === 0) {
    return "medium";
  }
  const average =
    profile.contents.reduce((sum, content) => sum + content.summary.trim().length, 0) /
    profile.contents.length;
  if (average < 80) return "short";
  if (average < 180) return "medium";
  return "long";
}

function chinaHour(unixSeconds: number): number {
  const chinaOffsetSeconds = 8 * 60 * 60;
  return new Date((unixSeconds + chinaOffsetSeconds) * 1000).getUTCHours();
}

function inferChronotype(profile: UserProfile): Chronotype {
  const timestamps = [
    ...profile.contents.map((content) => content.createdAt),
    ...profile.collections.map((collection) => collection.favTime),
  ];
  if (timestamps.length === 0) return "未知";

  let night = 0;
  let morning = 0;
  for (const timestamp of timestamps) {
    const hour = chinaHour(timestamp);
    if (hour >= 22 || hour < 5) night += 1;
    else if (hour >= 5 && hour < 10) morning += 1;
  }

  if (night / timestamps.length >= 0.5) return "夜猫子";
  if (morning / timestamps.length >= 0.5) return "早起鸟";
  return "日间活跃";
}

function inferInfluenceLevel(profile: UserProfile): number {
  if (profile.contents.length === 0) return 0;
  const engagement = profile.contents.reduce(
    (sum, content) => sum + content.likeCount + content.commentCount + content.favoriteCount,
    0,
  );
  return Math.min(100, Math.round((engagement / profile.contents.length) * 1.5));
}

export function buildComposition(profile: UserProfile): ZhihuComposition {
  const interests = scoreInterests(profile);
  return {
    primaryInterest: interests[0]?.name ?? "综合",
    interests,
    writingLength: inferWritingLength(profile),
    chronotype: inferChronotype(profile),
    hoardingLevel: Math.min(100, profile.favlists.length * 18 + profile.collections.length * 4),
    influenceLevel: inferInfluenceLevel(profile),
    sourceCounts: {
      contents: profile.contents.length,
      followees: profile.followees.length,
      collections: profile.collections.length,
      favlists: profile.favlists.length,
    },
  };
}

export function buildPersona(composition: ZhihuComposition): PlayerPersona {
  const preset = PERSONA_PRESETS[composition.primaryInterest];
  const density = composition.writingLength === "long" ? "dense" : composition.writingLength === "short" ? "light" : "balanced";
  const tone = composition.influenceLevel >= 60 ? "笃定吐槽" : composition.primaryInterest === "科学" ? "冷静考据" : "理性玩梗";

  return {
    ...preset,
    visualVariant: resolvePersonaVisualVariant(composition),
    interests: composition.interests.slice(0, 3).map((item) => item.name),
    chronotype: composition.chronotype,
    answerStyle: {
      length: composition.writingLength,
      tone,
      density,
    },
    easterEggs: [
      `收藏夹囤积指数 ${composition.hoardingLevel}%`,
      `活跃作息：${composition.chronotype}`,
      `内容影响力指数 ${composition.influenceLevel}%`,
    ],
  };
}
