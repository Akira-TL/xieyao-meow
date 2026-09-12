export type InterestName =
  | "AI 与数码"
  | "宠物"
  | "科学"
  | "职场与创业"
  | "游戏"
  | "文化与生活"
  | "综合";

export type WritingLength = "short" | "medium" | "long";
export type Chronotype = "夜猫子" | "早起鸟" | "日间活跃" | "未知";

export interface InterestScore {
  name: InterestName;
  score: number;
}

export interface ZhihuComposition {
  primaryInterest: InterestName;
  interests: InterestScore[];
  writingLength: WritingLength;
  chronotype: Chronotype;
  hoardingLevel: number;
  influenceLevel: number;
  sourceCounts: {
    contents: number;
    followees: number;
    collections: number;
    favlists: number;
  };
}

export interface Persona {
  species: string;
  appearance: string[];
  personality: string[];
  catchphrase: string;
  certifiedTitle: string;
  interests: InterestName[];
  chronotype: Chronotype;
  answerStyle: {
    length: WritingLength;
    tone: string;
    density: "light" | "balanced" | "dense";
  };
  easterEggs: string[];
}
