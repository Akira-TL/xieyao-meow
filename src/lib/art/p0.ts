export type P0ArtGeneration = "generation-01" | "generation-02";

export type PersonaEggState = "idle" | "scanning" | "glowing" | "cracking" | "opened";

export type P0ArtKey =
  | `egg-${PersonaEggState}`
  | "room-home-night"
  | "room-empty-night"
  | "journey-zhihu-gate"
  | "blue-line-icons"
  | "neon-good-minds"
  | "stage-shadow-empty"
  | "stage-industrial-empty"
  | "collage-zhihu-signals"
  | "neon-scanning-mind"
  | "collage-following"
  | "stage-spotlight-empty"
  | "room-study-night-empty"
  | "stage-paper-archive";

export const DEFAULT_P0_ART_GENERATION: P0ArtGeneration = "generation-02";

const FILES: Record<P0ArtKey, string> = {
  "egg-idle": "01_egg_idle.png",
  "egg-scanning": "02_egg_scanning.png",
  "egg-glowing": "03_egg_glowing.png",
  "egg-cracking": "04_egg_cracking.png",
  "egg-opened": "05_egg_opened.png",
  "room-home-night": "06_room_home_night.png",
  "room-empty-night": "07_room_empty_night.png",
  "journey-zhihu-gate": "08_journey_zhihu_gate.png",
  "blue-line-icons": "08_blue_line_icons.png",
  "neon-good-minds": "09_neon_good_minds.png",
  "stage-shadow-empty": "10_stage_shadow_empty.png",
  "stage-industrial-empty": "11_stage_industrial_empty.png",
  "collage-zhihu-signals": "12_collage_zhihu_signals.png",
  "neon-scanning-mind": "13_neon_scanning_mind.png",
  "collage-following": "14_collage_following.png",
  "stage-spotlight-empty": "17_stage_spotlight_empty.png",
  "room-study-night-empty": "18_room_study_night_empty.png",
  "stage-paper-archive": "19_stage_paper_archive.png",
};

export function resolveP0Art(
  key: P0ArtKey,
  generation: P0ArtGeneration = DEFAULT_P0_ART_GENERATION,
): string {
  return `/art/p0/${generation}/${FILES[key]}`;
}
