import { describe, expect, it } from "vitest";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import {
  createFallbackJourneyInsight,
  createJourneyInsight,
} from "@/lib/journey/insight";

const EMPTY_PACKAGE_COPY = /没有带回|没能留下|没有硬编|空白|没捡到|没带新|没有留下/;

describe("JourneyInsight fallback copy", () => {
  it("keeps persona-aware no-question returns positive instead of describing an empty package", async () => {
    const insight = await createJourneyInsight({
      persona: DEMO_FALLBACK.persona,
      composition: DEMO_FALLBACK.composition,
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
