import type { PersonaVisualVariant, PlayerPersona, ZhihuComposition } from "./types";

export type PersonaArtState = "base" | "thinking" | "talking" | "walking" | "returned";

const VARIANT_DIR: Record<PersonaVisualVariant, string> = {
  "engineer-blue": "01_engineer_blue",
  "analyst-black": "02_analyst_black",
  "thinker-red": "03_thinker_red",
  "observer-canvas": "04_observer_canvas",
  "traveler-blue": "05_traveler_blue",
};

export function resolvePersonaVisualVariant(composition: ZhihuComposition): PersonaVisualVariant {
  if (composition.primaryInterest === "AI 与数码") return "engineer-blue";
  if (composition.primaryInterest === "科学" || composition.primaryInterest === "职场与创业") return "analyst-black";
  if (composition.primaryInterest === "文化与生活" && composition.writingLength === "long") return "thinker-red";
  if (composition.primaryInterest === "文化与生活" || composition.primaryInterest === "宠物") return "observer-canvas";
  return "traveler-blue";
}

export function resolvePersonaArt(persona: Pick<PlayerPersona, "visualVariant">, state: PersonaArtState): string {
  return `/art/personas/generated-v1/${VARIANT_DIR[persona.visualVariant]}/${state}.png`;
}
