import type { Persona, ZhihuComposition } from "@/lib/persona";
import type { InterestName } from "@/lib/persona/types";

export type SocialAction = "visit" | "comment" | "debate";
export type RelationshipState = "初见" | "同频猫友" | "熟悉的杠精" | "灵魂猫友" | "对线冤家";

export interface PersonaRelationship {
  userAId: string;
  userBId: string;
  familiarity: number;
  chemistry: number;
  encounterCount: number;
  lastEncounterAt: number | null;
}

export interface SocialAgent {
  id: string;
  displayName: string;
  composition: ZhihuComposition;
  persona: Persona;
}

export interface SocialSignals {
  sharedInterests: InterestName[];
  styleContrast: number;
  chronotypeMatch: boolean;
  sharedTraits: string[];
}

export interface SocialEvent {
  id: string;
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  action: SocialAction;
  narrative: string;
  comment: string;
  reasons: string[];
  signals: SocialSignals;
  familiarity: number;
  chemistry: number;
  encounterCount: number;
  relationship: RelationshipState;
}
