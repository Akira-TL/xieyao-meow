import type { WritingLength } from "@/lib/persona/types";

import type {
  RelationshipState,
  SocialAction,
  SocialAgent,
  SocialEvent,
  SocialSignals,
} from "./types";

const LENGTH_RANK: Record<WritingLength, number> = {
  short: 0,
  medium: 1,
  long: 2,
};

const DENSITY_RANK = {
  light: 0,
  balanced: 1,
  dense: 2,
} as const;

function pairKey(left: string, right: string): string {
  return [left, right].sort().join("::");
}

function buildSignals(actor: SocialAgent, target: SocialAgent): SocialSignals {
  const sharedInterests = actor.persona.interests.filter((interest) =>
    target.persona.interests.includes(interest),
  );
  const sharedTraits = actor.persona.personality.filter((trait) =>
    target.persona.personality.includes(trait),
  );

  let styleContrast = 0;
  if (
    Math.abs(
      LENGTH_RANK[actor.persona.answerStyle.length] -
        LENGTH_RANK[target.persona.answerStyle.length],
    ) >= 1
  ) {
    styleContrast += 1;
  }
  if (
    Math.abs(
      DENSITY_RANK[actor.persona.answerStyle.density] -
        DENSITY_RANK[target.persona.answerStyle.density],
    ) >= 1
  ) {
    styleContrast += 1;
  }
  if (actor.persona.answerStyle.tone !== target.persona.answerStyle.tone) {
    styleContrast += 1;
  }

  return {
    sharedInterests,
    styleContrast,
    chronotypeMatch:
      actor.persona.chronotype !== "未知" &&
      actor.persona.chronotype === target.persona.chronotype,
    sharedTraits,
  };
}

function chooseAction(signals: SocialSignals): SocialAction {
  if (signals.sharedInterests.length === 0) return "visit";
  if (signals.styleContrast >= 2) return "debate";
  return "comment";
}

function affinityDelta(action: SocialAction, signals: SocialSignals): number {
  const commonGround = signals.sharedInterests.length * 2;
  const familiarity = (signals.chronotypeMatch ? 1 : 0) + Math.min(signals.sharedTraits.length, 1);

  if (action === "debate") {
    return commonGround + familiarity - signals.styleContrast;
  }
  if (action === "comment") {
    return commonGround + familiarity + 1;
  }
  return 1;
}

function relationshipFor(affinity: number): RelationshipState {
  if (affinity <= -3) return "对线冤家";
  if (affinity <= 1) return "初识";
  if (affinity <= 4) return "同频路人";
  if (affinity <= 8) return "互关搭子";
  return "灵魂猫友";
}

function explain(signals: SocialSignals, action: SocialAction): string[] {
  const reasons: string[] = [];
  if (signals.sharedInterests.length > 0) {
    reasons.push(`共同兴趣：${signals.sharedInterests.join("、")}`);
  } else {
    reasons.push("没有直接共同兴趣，因此先以好奇串门建立弱连接");
  }
  if (signals.styleContrast >= 2) {
    reasons.push(`表达风格差异明显（contrast=${signals.styleContrast}）`);
  }
  if (signals.chronotypeMatch) reasons.push("活跃时段相近");
  if (signals.sharedTraits.length > 0) {
    reasons.push(`共享人格特征：${signals.sharedTraits.join("、")}`);
  }
  reasons.push(`因此选择行为：${action}`);
  return reasons;
}

function renderEvent(
  actor: SocialAgent,
  target: SocialAgent,
  action: SocialAction,
  signals: SocialSignals,
): { narrative: string; comment: string } {
  const topic = signals.sharedInterests[0] ?? target.composition.primaryInterest;

  if (action === "debate") {
    return {
      narrative: `${actor.displayName} 顺着「${topic}」的话题闯进了 ${target.displayName} 的窝，两个 Persona 因为回答风格差太大，当场开始友好对线。`,
      comment: `${actor.persona.catchphrase} 同一个话题你这么讲，本喵得从另一个角度拆一拆。`,
    };
  }
  if (action === "comment") {
    return {
      narrative: `${actor.displayName} 在「${topic}」上和 ${target.displayName} 对上了电波，留下了一条同频评论。`,
      comment: `${actor.persona.catchphrase} 这题我们居然想到一块去了。`,
    };
  }
  return {
    narrative: `${actor.displayName} 发现 ${target.displayName} 平时混的是「${topic}」区，虽然不熟，还是先过去串门留了个脚印。`,
    comment: `${actor.persona.catchphrase} 路过围观一下，你这个坑本喵还没研究过。`,
  };
}

export class SocialCommunity {
  private readonly affinities = new Map<string, number>();
  private readonly feed: SocialEvent[] = [];
  private sequence = 0;

  interact(actor: SocialAgent, target: SocialAgent): SocialEvent {
    if (actor.id === target.id) {
      throw new Error("Social agents must be different");
    }

    const key = pairKey(actor.id, target.id);
    const affinityBefore = this.affinities.get(key) ?? 0;
    const signals = buildSignals(actor, target);
    const action = chooseAction(signals);
    const delta = affinityDelta(action, signals);
    const affinityAfter = affinityBefore + delta;
    this.affinities.set(key, affinityAfter);

    const rendered = renderEvent(actor, target, action, signals);
    this.sequence += 1;
    const event: SocialEvent = {
      id: `${key}:${this.sequence}`,
      actorId: actor.id,
      actorName: actor.displayName,
      targetId: target.id,
      targetName: target.displayName,
      action,
      narrative: rendered.narrative,
      comment: rendered.comment,
      reasons: explain(signals, action),
      signals,
      affinityBefore,
      affinityDelta: delta,
      affinityAfter,
      relationship: relationshipFor(affinityAfter),
    };

    this.feed.unshift(event);
    if (this.feed.length > 50) this.feed.length = 50;
    return event;
  }

  getFeed(): SocialEvent[] {
    return [...this.feed];
  }

  getAffinity(leftId: string, rightId: string): number {
    return this.affinities.get(pairKey(leftId, rightId)) ?? 0;
  }
}
