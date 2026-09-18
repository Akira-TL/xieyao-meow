export type JourneyKind = "WARMUP" | "NORMAL" | "FAR";
export type HomeActivityType = "RESTING" | "READING" | "SORTING" | "WINDOW_WATCHING" | "IDLING";
export type PrimaryToolId = "notebook" | "magnifier" | "old_camera" | "clipboard";
export type SmallItemId = "dried_fish" | "pocket_calendar" | "luck_charm";

export interface PrimaryToolDefinition {
  id: PrimaryToolId;
  name: string;
  description: string;
  unlockAtJourneys: number;
  artFile: string;
}

export interface SmallItemDefinition {
  id: SmallItemId;
  name: string;
  description: string;
  price: 2 | 3 | 4;
  artFile: string;
}

export const PRIMARY_TOOLS: readonly PrimaryToolDefinition[] = [
  {
    id: "notebook",
    name: "厚笔记本",
    description: "更愿意把问题的前因后果记完整。",
    unlockAtJourneys: 0,
    artFile: "tool_notebook.png",
  },
  {
    id: "magnifier",
    name: "旧放大镜",
    description: "更容易停在证据、机制和细节前。",
    unlockAtJourneys: 3,
    artFile: "tool_magnifier.png",
  },
  {
    id: "old_camera",
    name: "旧相机",
    description: "更容易留意本来就带真实内容图的问题。",
    unlockAtJourneys: 10,
    artFile: "tool_old_camera.png",
  },
  {
    id: "clipboard",
    name: "夹板",
    description: "更容易停在有正反讨论空间的问题前。",
    unlockAtJourneys: 20,
    artFile: "tool_clipboard.png",
  },
] as const;

export const SMALL_ITEMS: readonly SmallItemDefinition[] = [
  {
    id: "dried_fish",
    name: "一小包鱼干",
    description: "这趟路上更容易愿意停下来和别的猫聊两句。",
    price: 2,
    artFile: "supply_dried_fish.png",
  },
  {
    id: "pocket_calendar",
    name: "口袋日历",
    description: "这趟更有可能走得久一点，但不会指定它去哪。",
    price: 3,
    artFile: "supply_pocket_calendar.png",
  },
  {
    id: "luck_charm",
    name: "小小幸运符",
    description: "空手回来时，更容易顺手带一件不承担事实语义的小东西。",
    price: 4,
    artFile: "supply_luck_charm.png",
  },
] as const;

export const PRIMARY_TOOL_BY_ID = Object.fromEntries(
  PRIMARY_TOOLS.map((item) => [item.id, item]),
) as Record<PrimaryToolId, PrimaryToolDefinition>;

export const SMALL_ITEM_BY_ID = Object.fromEntries(
  SMALL_ITEMS.map((item) => [item.id, item]),
) as Record<SmallItemId, SmallItemDefinition>;

export const HOME_PASSIVE_LEAF_INTERVAL_MS = 60 * 60 * 1000;
export const HOME_PASSIVE_LEAF_CAP = 6;
export const ONBOARDING_LEAVES = 6;
export const ROUTE_NOTE_MAX_CHARS = 20;
