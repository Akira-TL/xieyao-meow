import type { Persona, ZhihuComposition } from "@/lib/persona";
import type { InterestName } from "@/lib/persona/types";

export type SocialAction = "visit" | "comment" | "debate";
export type RelationshipState = "初识" | "同频路人" | "互关搭子" | "灵魂猫友" | "对线冤家";

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
  affinityBefore: number;
  affinityDelta: number;
  affinityAfter: number;
  relationship: RelationshipState;
}
