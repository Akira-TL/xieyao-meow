import { describe, expect, it } from "vitest";

import {
  inferWaitingGameWorldZone,
  resolveWaitingGameHomeActivityRoom,
  resolveWaitingGameInspirationLeafArt,
  resolveWaitingGameJourneyPostcard,
  resolveWaitingGamePrimaryToolArt,
  resolveWaitingGameSmallItemArt,
  resolveWaitingGameSupplyShelfArt,
  resolveWaitingGameWorldZone,
} from "@/lib/art/waiting-game";

describe("waiting game art mapping", () => {
  it("prefers an explicit route hint when assigning a knowledge zone", () => {
    expect(inferWaitingGameWorldZone({
      routeBias: "多看看 AI",
      questionTitle: "一份完全无关的生活问题",
    })).toBe("ai");
    expect(inferWaitingGameWorldZone({
      routeBias: "看看科学",
      questionTitle: "任天堂为什么这么做？",
    })).toBe("science");
  });

  it("uses precise question-title evidence instead of broad company wording", () => {
    expect(inferWaitingGameWorldZone({
      routeBias: "随便逛",
      questionTitle: "DeepSeek 新模型为什么更省显存？",
    })).toBe("ai");
    expect(inferWaitingGameWorldZone({
      routeBias: "随便逛",
      questionTitle: "量子纠缠实验为什么需要这么做？",
    })).toBe("science");
    expect(inferWaitingGameWorldZone({
      routeBias: "随便逛",
      questionTitle: "如果任天堂是最伟大的游戏公司，第二名是谁？",
    })).toBe("unknown");
  });

  it("keeps ambiguous journeys in the unknown border", () => {
    expect(inferWaitingGameWorldZone({
      routeBias: "随便逛",
      questionTitle: "为什么大家对这件事看法不一样？",
    })).toBe("unknown");
  });

  it("maps persisted Home Activity and loadout state to the generated game assets", () => {
    expect(resolveWaitingGameHomeActivityRoom("READING")).toContain("home_room_reading_01.png");
    expect(resolveWaitingGameHomeActivityRoom("SORTING")).toContain("home_room_sorting_01.png");
    expect(resolveWaitingGamePrimaryToolArt("magnifier")).toContain("/tools/tool_magnifier.png");
    expect(resolveWaitingGameSmallItemArt("dried_fish")).toContain("/supplies/supply_dried_fish.png");
    expect(resolveWaitingGameSupplyShelfArt("leaves")).toContain("supply_shelf_leaves.png");
    expect(resolveWaitingGameInspirationLeafArt(true)).toContain("resource_inspiration_leaf_cluster.png");
  });

  it("resolves generated world and postcard assets without inventing a geographic destination", () => {
    expect(resolveWaitingGameWorldZone("science", true)).toContain("world_zone_science_unlocked.png");
    expect(resolveWaitingGameWorldZone("science", false)).toContain("world_zone_science_locked.png");
    expect(resolveWaitingGameJourneyPostcard({
      journeyKey: "journey-42",
      routeBias: "看看科学",
      fallbackInterest: "综合",
    })).toContain("/postcards/science/postcard_science_");
  });
});
