import type { InterestName, PersonaVisualVariant, PlayerPersona } from "@/lib/persona";

export type WaitingGamePersonaActivity =
  | "carry_photo"
  | "carry_ticket"
  | "desk_reading"
  | "floor_reading"
  | "packing_bag"
  | "sleep_curl"
  | "sorting_tickets"
  | "stretching"
  | "wake_up"
  | "window_sit";

export type WaitingGameHomeTableState =
  | "empty"
  | "messy_cozy"
  | "milestone"
  | "open_bundle"
  | "photo_sorting"
  | "prepare_trip"
  | "reading"
  | "ticket_sorting"
  | "unopened_bag"
  | "visitor_note";

export type WaitingGameCollectionArt =
  | "album_cover"
  | "album_page"
  | "relationship_book"
  | "souvenir_shelf"
  | "ticket_box";

export type WaitingGameReturnItemArt = "question_ticket" | "relation_note" | "oddity";
export type WaitingGameWorldZone = "ai" | "science" | "career" | "pets" | "life" | "unknown";

const PERSONA_SLUG: Record<PersonaVisualVariant, string> = {
  "engineer-blue": "engineer",
  "analyst-black": "analyst",
  "thinker-red": "thinker",
  "observer-canvas": "observer",
  "traveler-blue": "traveler",
};

const ROOT = "/art/waiting-game-v2";

const WORLD_SUBZONE_FILE: Partial<Record<InterestName, string>> = {
  "AI 与数码": "world_subzone_ai_tools.png",
  "科学": "world_subzone_science_evidence.png",
  "职场与创业": "world_subzone_career_team.png",
  "宠物": "world_subzone_pets_companion.png",
  "文化与生活": "world_subzone_life_books.png",
};

const POSTCARD_FOLDER: Record<InterestName, string> = {
  "AI 与数码": "ai",
  "宠物": "pets",
  "科学": "science",
  "职场与创业": "career",
  "游戏": "unknown",
  "文化与生活": "life",
  "综合": "unknown",
};

const WORLD_ZONE_FILE: Record<Exclude<WaitingGameWorldZone, "ai">, { locked: string; unlocked: string }> = {
  science: { locked: "world_zone_science_locked.png", unlocked: "world_zone_science_unlocked.png" },
  career: { locked: "world_zone_career_locked.png", unlocked: "world_zone_career_unlocked.png" },
  pets: { locked: "world_zone_pets_locked.png", unlocked: "world_zone_pets_unlocked.png" },
  life: { locked: "world_zone_life_locked.png", unlocked: "world_zone_life_unlocked.png" },
  unknown: { locked: "world_zone_unknown_locked.png", unlocked: "world_zone_unknown_unlocked.png" },
};

const WORLD_ZONE_KEYWORDS: Record<Exclude<WaitingGameWorldZone, "unknown">, string[]> = {
  ai: ["ai", "人工智能", "大模型", "模型", "算法", "deepseek", "openai", "agent", "芯片", "数码", "软件", "编程", "程序", "计算机", "互联网"],
  science: ["科学", "研究", "实验", "证据", "物理", "化学", "生物", "医学", "数学", "天文", "基因", "细胞", "学术"],
  career: ["职场", "工作", "公司", "创业", "商业", "管理", "职业", "招聘", "薪资", "面试", "同事", "老板", "行业"],
  pets: ["宠物", "养猫", "养狗", "猫咪", "狗狗", "动物"],
  life: ["生活", "电影", "文学", "历史", "音乐", "摄影", "艺术", "美食", "情感", "教育", "家庭", "住房", "城市", "婚姻"],
};

const NPC_ENCOUNTER_POSTCARD_FILE: Record<string, string> = {
  "齿轮": "postcard_encounter_gear.png",
  "糯米": "postcard_encounter_rice.png",
  "刻度": "postcard_encounter_thesis.png",
  "墨点": "postcard_encounter_ink.png",
  "路标": "postcard_encounter_waypoint.png",
};

export function resolveWaitingGamePersonaActivity(
  persona: Pick<PlayerPersona, "visualVariant">,
  activity: WaitingGamePersonaActivity,
): string {
  const slug = PERSONA_SLUG[persona.visualVariant];
  return `${ROOT}/personas/${slug}/player_${slug}_${activity}.png`;
}

export function resolveWaitingGameHomeRoom(empty = false): string {
  return `${ROOT}/home/rooms/${empty ? "home_room_empty_02" : "home_room_empty_01"}.png`;
}

export function resolveWaitingGameHomeTable(state: WaitingGameHomeTableState): string {
  return `${ROOT}/home/tables/home_table_${state}.png`;
}

export function resolveWaitingGameCollectionArt(asset: WaitingGameCollectionArt): string {
  return `${ROOT}/collections/${asset}.png`;
}

export function resolveWaitingGameReturnItemArt(asset: WaitingGameReturnItemArt): string {
  if (asset === "question_ticket") return `${ROOT}/return-bundle/tickets/bundle_item_question_ticket_01.png`;
  if (asset === "relation_note") return `${ROOT}/return-bundle/relations/bundle_item_relation_note_01.png`;
  return `${ROOT}/return-bundle/oddities/bundle_item_oddity_bookmark.png`;
}

export function resolveWaitingGameWorldSubzone(interest: InterestName | string): string {
  return `${ROOT}/world/zones/${WORLD_SUBZONE_FILE[interest as InterestName] ?? "world_subzone_unknown_border.png"}`;
}

export function resolveWaitingGameWorldZone(zone: WaitingGameWorldZone, unlocked: boolean): string {
  if (zone === "ai") return `${ROOT}/world/zones/world_subzone_ai_tools.png`;
  const file = WORLD_ZONE_FILE[zone][unlocked ? "unlocked" : "locked"];
  return `${ROOT}/world/zones/${file}`;
}

export function inferWaitingGameWorldZone({
  routeBias,
  questionTitle = "",
  questionSummary = "",
}: {
  routeBias: string | null;
  questionTitle?: string;
  questionSummary?: string;
}): WaitingGameWorldZone {
  const route = (routeBias ?? "").toLocaleLowerCase("zh-CN");
  if (route.includes("ai") || route.includes("数码")) return "ai";
  if (route.includes("科学")) return "science";
  if (route.includes("职场") || route.includes("创业")) return "career";
  if (route.includes("宠物")) return "pets";
  if (route.includes("生活") || route.includes("文化")) return "life";

  const text = `${questionTitle}\n${questionSummary}`.toLocaleLowerCase("zh-CN");
  let best: WaitingGameWorldZone = "unknown";
  let bestScore = 0;
  let tied = false;
  for (const [zone, keywords] of Object.entries(WORLD_ZONE_KEYWORDS) as Array<[Exclude<WaitingGameWorldZone, "unknown">, string[]]>) {
    const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword.toLocaleLowerCase("zh-CN")) ? 1 : 0), 0);
    if (score > bestScore) {
      best = zone;
      bestScore = score;
      tied = false;
    } else if (score > 0 && score === bestScore) {
      tied = true;
    }
  }
  return bestScore > 0 && !tied ? best : "unknown";
}

export function resolveWaitingGamePostcard(interest: InterestName | string, variant = 1): string {
  const normalizedInterest = (interest in POSTCARD_FOLDER ? interest : "综合") as InterestName;
  const folder = POSTCARD_FOLDER[normalizedInterest];
  const safeVariant = Math.max(1, Math.min(3, Math.trunc(variant)));
  return `${ROOT}/postcards/${folder}/postcard_${folder}_${String(safeVariant).padStart(2, "0")}.png`;
}

export function resolveWaitingGameEncounterPostcard(participantName: string, sharedUser = false): string {
  const filename = sharedUser
    ? "postcard_encounter_two_player_cats.png"
    : NPC_ENCOUNTER_POSTCARD_FILE[participantName] ?? "postcard_encounter_glimpse_01.png";
  return `${ROOT}/postcards/encounter/${filename}`;
}

function stablePostcardVariant(key: string): number {
  let hash = 0;
  for (const character of key) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return (hash % 3) + 1;
}

export function resolveWaitingGameJourneyPostcard({
  journeyKey,
  routeBias,
  fallbackInterest = "综合",
  participantName,
  sharedUser = false,
}: {
  journeyKey: string;
  routeBias: string | null;
  fallbackInterest?: InterestName | string;
  participantName?: string | null;
  sharedUser?: boolean;
}): string {
  if (participantName) return resolveWaitingGameEncounterPostcard(participantName, sharedUser);

  const route = (routeBias ?? "").toLocaleLowerCase("zh-CN");
  const interest = route.includes("ai") || route.includes("数码")
    ? "AI 与数码"
    : route.includes("科学")
      ? "科学"
      : route.includes("职场") || route.includes("创业")
        ? "职场与创业"
        : route.includes("宠物")
          ? "宠物"
          : route.includes("生活") || route.includes("文化")
            ? "文化与生活"
            : fallbackInterest;
  return resolveWaitingGamePostcard(interest, stablePostcardVariant(journeyKey));
}

export const WAITING_GAME_ART_ROOT = ROOT;
