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

export function resolveWaitingGameWorldSubzone(interest: InterestName | string): string {
  return `${ROOT}/world/zones/${WORLD_SUBZONE_FILE[interest as InterestName] ?? "world_subzone_unknown_border.png"}`;
}

export const WAITING_GAME_ART_ROOT = ROOT;
