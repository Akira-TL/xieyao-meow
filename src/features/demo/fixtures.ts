import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import { DEMO_FALLBACK } from "@/data/demo-fallback";

const selfPersona = {
  id: "demo-self",
  displayName: "本喵",
  species: "黑猫",
  visualVariant: "engineer-blue" as const,
  archetype: "工程脑",
  title: "盐选级工具猫",
  catchphrase: "别急，让本喵先拆成三个模块。",
  interests: ["AI 与数码", "科学", "职场与创业"],
};

const resident = COMMUNITY_RESIDENTS[0];

export const DEMO_FIXTURE = {
  provenance: "demo" as const,
  residents: COMMUNITY_RESIDENTS.map((agent) => ({
    id: agent.id,
    displayName: agent.displayName,
    species: agent.persona.species,
    title: agent.persona.certifiedTitle,
    interests: [...agent.persona.interests],
    personality: [...agent.persona.personality],
    catchphrase: agent.persona.catchphrase,
    answerStyle: { ...agent.persona.answerStyle },
    kind: "demo_resident" as const,
  })),
  landing: {
    publicEvent: "齿轮刚刚因为一个 AI 问题追问了 3 回合。",
  },
  scan: {
    sources: [
      {
        key: "contents",
        label: "公开创作",
        finding: "偏结构化长答，习惯先拆问题再下结论",
      },
      {
        key: "followees",
        label: "关注",
        finding: "AI、开发工具与科学型创作者出现得最多",
      },
      {
        key: "collections",
        label: "公开收藏",
        finding: "AI / 工具 / 科学主题长期重复出现",
      },
    ],
  },
  persona: {
    ...selfPersona,
    highlights: [
      {
        label: "主兴趣",
        value: "AI 与数码 42%",
        explanation: "来自公开创作标题、关注对象简介和收藏主题的演示聚合。",
      },
      {
        label: "表达方式",
        value: "高密度长答",
        explanation: "公开创作摘要在当前样本中表现为较长、结构化表达。",
      },
      {
        label: "收藏癖",
        value: "76%",
        explanation: "当前样本把收藏夹主题集中度映射成了一个趣味属性。",
      },
      {
        label: "社交气味",
        value: "AI × 科学 × 创业",
        explanation: "由兴趣向量中最稳定的三个方向生成，属于谢邀喵产品语言。",
      },
    ],
  },
  match: {
    score: 87,
    candidate: {
      id: resident.id,
      displayName: resident.displayName,
      species: resident.persona.species,
      title: resident.persona.certifiedTitle,
      interests: [...resident.persona.interests],
      kind: "demo_resident" as const,
    },
    similarities: ["AI 与数码", "科学"],
    contrasts: ["你偏结构化长答", "TA 偏短句、直接、爱抖机灵"],
    relationPrediction: "很可能边吵边加好友",
  },
  encounter: {
    topic: {
      title: DEMO_FALLBACK.question.title,
      url: DEMO_FALLBACK.question.url,
      sourceLabel: "知乎公开问题",
    },
    turns: [
      {
        speaker: "self" as const,
        text: "先别急着说操纵杆更灵敏。民用车首先要考虑的是普通人的容错和稳定。",
      },
      {
        speaker: "other" as const,
        text: "你又开始写技术方案了。我只问一句：方向盘这么大，不就是为了让手抖没那么致命？",
      },
      {
        speaker: "self" as const,
        text: "这次你概括得还行。再补一个转向比和力矩放大，答案就完整了。",
      },
    ],
    explanation: "共同兴趣是工程与 AI；你的表达偏结构化，齿轮偏证据直给，所以它们会在同一事实基础上用不同方式说话。",
    relationship: {
      status: "同频路人",
      affinity: 4,
      controversy: 7,
    },
  },
  home: {
    mood: "有点想抬杠",
    heroEvent: {
      headline: "齿轮刚刚来你窝里串门了。",
      detail: "它不同意你把一个机械问题拆成五层来讲。",
      target: "/encounter?demo=relationship",
    },
    growth: {
      knowledge: 3,
      expression: 2,
      social: 4,
    },
  },
  outing: {
    routeBiases: ["随便逛", "多看看 AI", "去陌生地方", "看看大家在吵什么"],
    note: "出去转转。",
    awayStatus: "已经逛了一会儿",
    returnArtifact: {
      id: "demo-note-014",
      type: "NOTE" as const,
      label: "幕间札记 #014",
      places: ["AI", "科学"],
      topic: {
        title: DEMO_FALLBACK.question.title,
        url: DEMO_FALLBACK.question.url,
      },
      thought: "真正麻烦的不是灵敏，而是容错。",
      companion: "齿轮",
      relationshipDelta: "+2",
      provenance: "demo" as const,
    },
    journeyLog: [
      {
        label: "幕间札记 #013",
        summary: "跑去看了一圈 AI Agent，最后记住的却是‘人为什么愿意把判断交出去’。",
      },
      {
        label: "关系票根 #004",
        summary: "在一个机械问题下面再次遇见齿轮，关系从同频路人变成了熟悉的杠精。",
      },
    ],
  },
  explore: {
    items: [
      {
        title: DEMO_FALLBACK.question.title,
        whyPicked: "工程脑 + 机械结构关键词，和你的兴趣向量高度重合。",
        sourceUrl: DEMO_FALLBACK.question.url,
      },
      {
        title: "AI Agent 应该替用户做多少决定？",
        whyPicked: "你最近的主兴趣是 AI，与齿轮的争论也集中在 Agent 自主性。",
        sourceUrl: "https://www.zhihu.com/",
      },
      {
        title: "为什么有些工具越复杂，反而越让人上瘾？",
        whyPicked: "它把你的工具偏好和‘结构化表达’同时命中了。",
        sourceUrl: "https://www.zhihu.com/",
      },
    ],
  },
  atlas: {
    titles: ["盐选级工具猫", "收藏夹考古学家", "问题拆解工程师"],
    relationships: [
      { id: "resident-gear", name: "齿轮", status: "同频路人" },
      { id: "resident-rice", name: "糯米", status: "串门邻居" },
      { id: "resident-thesis", name: "刻度", status: "证据搭子" },
      { id: "resident-ink", name: "墨点", status: "灵感交换生" },
      { id: "resident-waypoint", name: "路标", status: "偶遇旅伴" },
    ],
    history: ["孵化完成", "第一次遇见齿轮", "认识了 5 位社区居民", "社交 Lv.4"],
  },
} as const;
