import { describe, expect, it } from "vitest";

import {
  activationPathForStage,
  advanceActivationStage,
  resolveRequestedDemoPath,
  type DemoActivationStage,
} from "@/features/demo/activation";

describe("demo activation route guard", () => {
  it("advances only forward through the activation funnel", () => {
    expect(advanceActivationStage("VISITOR", "PRE_AUTH")).toBe("PRE_AUTH");
    expect(advanceActivationStage("HATCH_REVEAL", "PROFILE_SCANNING")).toBe("HATCH_REVEAL");
    expect(advanceActivationStage("FIRST_ENCOUNTER", "ACTIVATED")).toBe("ACTIVATED");
  });

  it.each<[DemoActivationStage, string]>([
    ["VISITOR", "/"],
    ["PRE_AUTH", "/hatch/consent"],
    ["PROFILE_SCANNING", "/hatch/scanning"],
    ["HATCH_REVEAL", "/hatch/reveal"],
    ["FIRST_MATCH_READY", "/encounter/first?phase=match"],
    ["FIRST_ENCOUNTER", "/encounter/first?phase=encounter"],
    ["ACTIVATED", "/home"],
  ])("maps %s to %s", (stage, path) => {
    expect(activationPathForStage(stage)).toBe(path);
  });

  it("redirects users who request a route ahead of their current activation stage", () => {
    expect(resolveRequestedDemoPath("PROFILE_SCANNING", "/hatch/reveal")).toBe(
      "/hatch/scanning",
    );
    expect(resolveRequestedDemoPath("HATCH_REVEAL", "/home")).toBe("/hatch/reveal");
  });

  it("keeps public routes public and sends activated users away from activation-only pages", () => {
    expect(resolveRequestedDemoPath("VISITOR", "/share/demo-match")).toBeNull();
    expect(resolveRequestedDemoPath("ACTIVATED", "/hatch/consent")).toBe("/home");
    expect(resolveRequestedDemoPath("ACTIVATED", "/encounter/first?phase=match")).toBe("/home");
    expect(resolveRequestedDemoPath("ACTIVATED", "/atlas")).toBeNull();
  });
});
