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

export function resolveWaitingGamePostcard(interest: InterestName | string, variant = 1): string {
  const normalizedInterest = (interest in POSTCARD_FOLDER ? interest : "综合") as InterestName;
  const folder = POSTCARD_FOLDER[normalizedInterest];
  const safeVariant = Math.max(1, Math.min(3, Math.trunc(variant)));
  return `${ROOT}/postcards/${folder}/postcard_${folder}_${String(safeVariant).padStart(2, "0")}.png`;
}

export const WAITING_GAME_ART_ROOT = ROOT;
