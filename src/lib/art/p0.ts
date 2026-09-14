export type P0ArtGeneration = "generation-01" | "generation-02";

export type PersonaEggState = "idle" | "scanning" | "glowing" | "cracking" | "opened";

export type P0ArtKey =
  | `egg-${PersonaEggState}`
  | "room-home-night"
  | "room-empty-night"
  | "journey-zhihu-gate";

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
};

export function resolveP0Art(
  key: P0ArtKey,
  generation: P0ArtGeneration = DEFAULT_P0_ART_GENERATION,
): string {
  return `/art/p0/${generation}/${FILES[key]}`;
}
