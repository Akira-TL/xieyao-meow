import type { PersonaVisualVariant } from "@/lib/persona";

export const DEFAULT_CAT_NAME = "小谢";
export const CAT_NAME_MAX_LENGTH = 6;

export const CAT_APPEARANCE_VARIANTS = [
  "engineer-blue",
  "analyst-black",
  "thinker-red",
  "observer-canvas",
  "traveler-blue",
] as const satisfies readonly PersonaVisualVariant[];

export interface CatProfile {
  catName: string;
  appearanceId: PersonaVisualVariant | null;
  createdAt: number;
  updatedAt: number;
}

export interface CatProfilePatch {
  catName?: string;
  appearanceId?: PersonaVisualVariant | null;
}

export function normalizeCatName(value: string): string {
  return value.trim();
}

export function isValidCatName(value: string): boolean {
  const normalized = normalizeCatName(value);
  const length = Array.from(normalized).length;
  return length >= 1 && length <= CAT_NAME_MAX_LENGTH;
}

export function createDefaultCatProfile(now = Date.now()): CatProfile {
  return {
    catName: DEFAULT_CAT_NAME,
    appearanceId: null,
    createdAt: now,
    updatedAt: now,
  };
}
