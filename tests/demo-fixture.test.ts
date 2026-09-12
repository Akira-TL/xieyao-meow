import { describe, expect, it } from "vitest";

import { DEMO_FIXTURE } from "@/features/demo/fixtures";

describe("low-fi demo fixture", () => {
  it("is explicitly marked as demo provenance", () => {
    expect(DEMO_FIXTURE.provenance).toBe("demo");
    expect(DEMO_FIXTURE.residents).toHaveLength(2);
    expect(DEMO_FIXTURE.residents.every((resident) => resident.kind === "demo_resident")).toBe(true);
    expect(DEMO_FIXTURE.match.candidate.kind).toBe("demo_resident");
  });

  it("anchors the encounter in a public Zhihu question", () => {
    expect(DEMO_FIXTURE.encounter.topic.url).toMatch(/^https:\/\/www\.zhihu\.com\/question\//);
    expect(DEMO_FIXTURE.encounter.turns.length).toBeGreaterThanOrEqual(2);
    expect(DEMO_FIXTURE.encounter.turns.length).toBeLessThanOrEqual(4);
  });

  it("keeps the retained product shell focused on three growth axes", () => {
    expect(Object.keys(DEMO_FIXTURE.home.growth).sort()).toEqual([
      "expression",
      "knowledge",
      "social",
    ]);
  });
});
