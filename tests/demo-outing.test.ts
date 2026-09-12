import { describe, expect, it } from "vitest";

import {
  advanceDemoOuting,
  createDemoOutingState,
  type DemoOutingState,
} from "@/features/demo/outing";

describe("demo outing state machine", () => {
  it("starts at home without a route bias", () => {
    expect(createDemoOutingState()).toEqual({ state: "AT_HOME", routeBias: null });
  });

  it("accepts a weak route bias while preparing", () => {
    const next = advanceDemoOuting(createDemoOutingState(), {
      type: "prepare",
      routeBias: "多看看 AI",
    });

    expect(next).toEqual({ state: "PREPARING", routeBias: "多看看 AI" });
  });

  it("moves from preparing to away without changing the chosen result", () => {
    const preparing: DemoOutingState = { state: "PREPARING", routeBias: "去陌生地方" };
    expect(advanceDemoOuting(preparing, { type: "depart" })).toEqual({
      state: "AWAY",
      routeBias: "去陌生地方",
    });
  });

  it("returns with the same route bias and can be archived back home", () => {
    const away: DemoOutingState = { state: "AWAY", routeBias: "看看大家在吵什么" };
    const returned = advanceDemoOuting(away, { type: "return" });
    expect(returned).toEqual({ state: "RETURNED", routeBias: "看看大家在吵什么" });
    expect(advanceDemoOuting(returned, { type: "archive" })).toEqual({
      state: "AT_HOME",
      routeBias: null,
    });
  });

  it("ignores invalid transitions instead of skipping stages", () => {
    const home = createDemoOutingState();
    expect(advanceDemoOuting(home, { type: "return" })).toEqual(home);
  });
});
