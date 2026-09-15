import { describe, expect, it } from "vitest";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import {
  createFallbackJourneyInsight,
  createJourneyInsight,
  resolveJourneyInsightTopic,
} from "@/lib/journey/insight";

const EMPTY_PACKAGE_COPY = /没有带回|没能留下|没有硬编|空白|没捡到|没带新|没有留下/;

describe("JourneyInsight fallback copy", () => {
  it("keeps persona-aware no-question returns positive instead of describing an empty package", async () => {
    const insight = await createJourneyInsight({
      persona: DEMO_FALLBACK.persona,
      composition: DEMO_FALLBACK.composition,
      topic: "AI 与数码",
      routeBias: "多看看 AI",
      question: null,
    }, null);

    const visible = [
      insight.headline,
      insight.insight,
      insight.whyItMatters,
      insight.evidenceSummary,
      insight.interactionQuestion,
      ...insight.options.map((option) => option.label),
    ].join(" ");
    expect(visible).not.toMatch(EMPTY_PACKAGE_COPY);
    expect(visible).toContain("多看看 AI");
    expect(JSON.parse(insight.factsJson)).toMatchObject({ insightTopic: "AI 与数码" });
  });

  it("binds an AI route to AI instead of the Persona primary interest", () => {
    expect(resolveJourneyInsightTopic("多看看 AI", null, ["科学", "宠物"])).toBe("AI 与数码");
  });

  it("uses the selected question to resolve the feedback topic when the route is generic", () => {
    expect(resolveJourneyInsightTopic(
      "看看大家在吵什么",
      {
        title: "AI Agent 应该替用户做多少决定？",
        url: "https://www.zhihu.com/question/1",
        summary: "人工智能工具的控制权与自动化边界。",
      },
      ["科学", "AI 与数码"],
    )).toBe("AI 与数码");
  });

  it("keeps upstream-failure fallback as a route record, never an empty-package message", () => {
    const insight = createFallbackJourneyInsight("去陌生地方");
    const visible = [
      insight.headline,
      insight.insight,
      insight.whyItMatters,
      insight.evidenceSummary,
      insight.interactionQuestion,
      ...insight.options.map((option) => option.label),
    ].join(" ");

    expect(visible).not.toMatch(EMPTY_PACKAGE_COPY);
    expect(visible).toContain("去陌生地方");
  });
});
