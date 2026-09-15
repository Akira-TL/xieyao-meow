"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import type { JourneyAtlasEntry, JourneyAtlasView } from "@/lib/journey/types";
import type { PersonaVisualVariant } from "@/lib/persona/types";
import type { SharedEncounterView } from "@/lib/social/shared-encounter";

import { PaperCard, PersonaArt, ResidentArt } from "../components";
import { useLivePersonaSnapshot } from "../live-client";
import { useCatProfile } from "../profile/client";

type EncounterResponse = {
  encounter: SharedEncounterView | null;
  encounters?: SharedEncounterView[];
  error?: string;
};

type NpcHistoryItem = {
  kind: "NPC";
  id: string;
  at: number;
  journey: JourneyAtlasEntry;
};

type UserHistoryItem = {
  kind: "USER";
  id: string;
  at: number;
  encounter: SharedEncounterView;
};

type EncounterHistoryItem = NpcHistoryItem | UserHistoryItem;

function formatTime(value: number | null): string {
  if (!value) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function participantPersona(participant: SharedEncounterView["participants"][number]) {
  return {
    visualVariant: (participant.capsule.visualVariant as PersonaVisualVariant | undefined) ?? "observer-canvas",
  };
}

function residentById(id: string) {
  return COMMUNITY_RESIDENTS.find((resident) => resident.id === id) ?? null;
}

function relationshipHref(residentId: string) {
  return `/relationship/${residentId.replace(/^resident-/, "")}`;
}

function sceneHref(id: string) {
  return `/encounter?scene=${encodeURIComponent(id)}`;
}

function historyFromAtlas(atlas: JourneyAtlasView | null): NpcHistoryItem[] {
  return (atlas?.journeys ?? [])
    .filter((journey) => journey.conversation?.kind === "NPC")
    .map((journey) => ({
      kind: "NPC" as const,
      id: `journey:${journey.journeyId}`,
      at: journey.completedAt,
      journey,
    }));
}

function historyFromShared(encounters: SharedEncounterView[]): UserHistoryItem[] {
  return encounters
    .filter((encounter) => encounter.status === "completed")
    .map((encounter) => ({
      kind: "USER" as const,
      id: `shared:${encounter.id}`,
      at: encounter.completedAt ?? encounter.createdAt,
      encounter,
    }));
}

function NpcScene({ item }: { item: NpcHistoryItem }) {
  const snapshot = useLivePersonaSnapshot();
  const basePersona = snapshot?.persona ?? { visualVariant: "observer-canvas" as const };
  const { profile, persona } = useCatProfile(basePersona);
  const conversation = item.journey.conversation!;
  const resident = residentById(conversation.participantId);
  const question = item.journey.postcard.question;

  return (
    <div className="encounter-scene encounter-scene--npc">
      <div className="encounter-scene-cast">
        <div className="encounter-scene-actor">
          <PersonaArt alt={profile.catName} className="encounter-scene-persona" persona={persona} state="talking" />
          <strong>{profile.catName}</strong>
          <span>{snapshot?.persona.certifiedTitle ?? "你的谢邀喵"}</span>
        </div>
        <div className="encounter-scene-mark">↔</div>
        <div className="encounter-scene-actor">
          <ResidentArt
            alt={conversation.participantName}
            className="encounter-scene-resident"
            priority
            residentId={conversation.participantId}
            state="talking"
          />
          <strong>{conversation.participantName}</strong>
          <span>{resident?.persona.certifiedTitle ?? "社区居民"}</span>
        </div>
      </div>

      <PaperCard className="encounter-scene-topic">
        <span>{question ? "这次停下来的真实知乎问题" : "这次聊的是旅途方向，不伪装成知乎事实"}</span>
        <h2>{question?.title ?? `纸条「${item.journey.routeBias ?? "随便逛"}」`}</h2>
        {question ? <a href={question.url} rel="noreferrer" target="_blank">在知乎看看原问题 →</a> : null}
      </PaperCard>

      <div className="encounter-scene-turns">
        {conversation.turns.map((turn, index) => (
          <p className={turn.speaker === "other" ? "is-other" : "is-self"} key={`${turn.speaker}-${index}`}>
            <b>{turn.speaker === "other" ? conversation.participantName : profile.catName}</b>
            {turn.text}
          </p>
        ))}
      </div>

      <PaperCard className="encounter-scene-summary">
        <span>社区 NPC · {conversation.turns.length} 句 · {conversation.textCharCount} 字 · {formatTime(item.at)}</span>
        <h2>和 {conversation.participantName} 的一次路边聊天</h2>
        <p>{conversation.sourceLabel}。这段对话已经收进旅行历史，刷新页面也不会重新生成。</p>
        <div className="encounter-scene-actions">
          <Link href={relationshipHref(conversation.participantId)}>关系记录 →</Link>
          <Link href="/encounter">返回全部相遇</Link>
        </div>
      </PaperCard>
    </div>
  );
}

function UserScene({ item }: { item: UserHistoryItem }) {
  const encounter = item.encounter;
  const self = encounter.participants.find((participant) => participant.isSelf);
  const other = encounter.participants.find((participant) => !participant.isSelf);
  if (!self || !other) return null;
  const dialogueCharCount = encounter.turns.reduce((total, turn) => total + Array.from(turn.text).length, 0);

  return (
    <div className="encounter-scene encounter-scene--user">
      <div className="encounter-scene-cast">
        <div className="encounter-scene-actor">
          <PersonaArt alt="本喵" className="encounter-scene-persona" persona={participantPersona(self)} state="talking" />
          <strong>本喵</strong>
          <span>{self.capsule.certifiedTitle}</span>
        </div>
        <div className="encounter-scene-mark">↔</div>
        <div className="encounter-scene-actor">
          <PersonaArt alt={other.capsule.displayName} className="encounter-scene-persona" persona={participantPersona(other)} state="talking" />
          <strong>{other.capsule.displayName}</strong>
          <span>{other.capsule.certifiedTitle}</span>
        </div>
      </div>

      <PaperCard className="encounter-scene-topic">
        <span>同一个真实知乎问题 · REAL USER</span>
        <h2>{encounter.topic.title}</h2>
        <a href={encounter.topic.url} rel="noreferrer" target="_blank">在知乎看看原问题 →</a>
      </PaperCard>

      <div className="encounter-scene-turns">
        {encounter.turns.map((turn, index) => {
          const speaker = encounter.participants.find((participant) => participant.slot === turn.speakerSlot);
          return (
            <p className={speaker?.isSelf ? "is-self" : "is-other"} key={`${turn.speakerSlot}-${index}`}>
              <b>{speaker?.isSelf ? "本喵" : speaker?.capsule.displayName ?? "对方 Persona"}</b>
              {turn.text}
            </p>
          );
        })}
      </div>

      <PaperCard className="encounter-scene-summary">
        <span>真实用户 Persona · {encounter.turns.length} 句 · {dialogueCharCount} 字 · {formatTime(encounter.completedAt)}</span>
        <h2>{encounter.relationship?.label ?? "初见"}</h2>
        <p>{encounter.summary}</p>
        {encounter.relationship ? (
          <div className="shared-encounter-metrics">
            <b>熟悉度 {encounter.relationship.familiarity}</b>
            <b>化学反应 {encounter.relationship.chemistry >= 0 ? "+" : ""}{encounter.relationship.chemistry}</b>
            <b>已相遇 {encounter.relationship.encounterCount} 次</b>
          </div>
        ) : null}
        <div className="encounter-scene-actions"><Link href="/encounter">返回全部相遇</Link></div>
      </PaperCard>
    </div>
  );
}

function HistoryCard({ item }: { item: EncounterHistoryItem }) {
  if (item.kind === "NPC") {
    const conversation = item.journey.conversation!;
    const resident = residentById(conversation.participantId);
    const firstOther = conversation.turns.find((turn) => turn.speaker === "other")?.text ?? conversation.turns[0]?.text ?? "";
    return (
      <article className="encounter-history-card">
        <ResidentArt alt={conversation.participantName} className="encounter-history-resident" residentId={conversation.participantId} state="meeting" />
        <div>
          <span>社区 NPC · {formatTime(item.at)}</span>
          <h3>{conversation.participantName}</h3>
          <small>{resident?.persona.certifiedTitle ?? "社区居民"}</small>
          <p>{firstOther}</p>
          <div className="encounter-history-actions">
            <Link href={sceneHref(item.id)}>查看这一幕 →</Link>
            <Link href={relationshipHref(conversation.participantId)}>关系记录</Link>
          </div>
        </div>
      </article>
    );
  }

  const other = item.encounter.participants.find((participant) => !participant.isSelf);
  const firstOther = item.encounter.turns.find((turn) => {
    const speaker = item.encounter.participants.find((participant) => participant.slot === turn.speakerSlot);
    return speaker && !speaker.isSelf;
  })?.text ?? item.encounter.summary;
  return (
    <article className="encounter-history-card">
      {other ? <PersonaArt alt={other.capsule.displayName} aspect="avatar" className="encounter-history-persona" persona={participantPersona(other)} state="talking" /> : null}
      <div>
        <span>真实用户 Persona · {formatTime(item.at)}</span>
        <h3>{other?.capsule.displayName ?? "另一只 Persona"}</h3>
        <small>{other?.capsule.certifiedTitle ?? "Shared Encounter"}</small>
        <p>{firstOther}</p>
        <div className="encounter-history-actions"><Link href={sceneHref(item.id)}>查看这一幕 →</Link></div>
      </div>
    </article>
  );
}

export function SharedEncounterPanel({ selectedSceneId }: { selectedSceneId: string | null }) {
  const [encounters, setEncounters] = useState<SharedEncounterView[]>([]);
  const [atlas, setAtlas] = useState<JourneyAtlasView | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch("/api/community/encounters", { cache: "no-store" }),
      fetch("/api/atlas", { cache: "no-store" }),
    ])
      .then(async ([encounterResponse, atlasResponse]) => {
        if (encounterResponse.status === 401 || atlasResponse.status === 401) {
          return { authRequired: true as const, encounters: [], atlas: null };
        }
        const encounterBody = (await encounterResponse.json()) as EncounterResponse;
        if (!encounterResponse.ok) throw new Error(encounterBody.error || "读取相遇记录失败");
        if (!atlasResponse.ok) throw new Error("读取旅行历史失败");
        const atlasBody = (await atlasResponse.json()) as JourneyAtlasView;
        return {
          authRequired: false as const,
          encounters: encounterBody.encounters ?? (encounterBody.encounter ? [encounterBody.encounter] : []),
          atlas: atlasBody,
        };
      })
      .then((result) => {
        if (cancelled) return;
        setAuthRequired(result.authRequired);
        setEncounters(result.encounters);
        setAtlas(result.atlas);
        setMessage("");
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "读取相遇记录失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const history = useMemo<EncounterHistoryItem[]>(() => [
    ...historyFromAtlas(atlas),
    ...historyFromShared(encounters),
  ].sort((left, right) => right.at - left.at), [atlas, encounters]);

  const selected = selectedSceneId
    ? history.find((item) => item.id === selectedSceneId) ?? null
    : null;

  if (authRequired && !history.length) return null;

  return (
    <section className="shared-encounter-stage" aria-label="相遇与关系记录">
      <div className="shared-encounter-hero">
        <p className="stage-caption">ENCOUNTER ARCHIVE · PERSONA RELATIONSHIPS</p>
        <h1 className="target-lock-title">
          <span className="target-title-line">最近，</span>
          <span className="target-title-line">它<em>遇见</em>了</span>
          <span className="target-title-line target-title-line--compact">{history.length ? "这些有趣的灵魂。" : "一张还空着的椅子。"}</span>
        </h1>
        <p>{history.length
          ? "NPC 和真实用户 Persona 的对话都会留在这里。不是一次性的弹窗，而是它认识世界、也认识别人的历史。"
          : "下一次出门，它可能先碰到一位社区居民；如果有其他真实 Persona，也可能留下属于双方的共同历史。"}</p>
      </div>

      {loading ? <div className="shared-encounter-loading">正在翻以前的相遇……</div> : null}
      {message ? <p className="shared-encounter-message">{message}</p> : null}

      {!loading && selected?.kind === "NPC" ? <NpcScene item={selected} /> : null}
      {!loading && selected?.kind === "USER" ? <UserScene item={selected} /> : null}

      {!loading && !selected && history.length ? (
        <>
          <section className="encounter-history-featured" aria-label="最近的相遇">
            <HistoryCard item={history[0]!} />
          </section>
          <section className="encounter-history" aria-label="以前的相遇">
            <div className="encounter-history-heading">
              <h2>以前碰见过谁</h2>
              <span>{history.length} 段对话已经留下</span>
            </div>
            <div className="encounter-history-grid">
              {history.slice(1).map((item) => <HistoryCard item={item} key={item.id} />)}
            </div>
          </section>
        </>
      ) : null}

      {!loading && !selected && !history.length ? (
        <PaperCard className="shared-encounter-empty">
          <span>FIRST ENCOUNTER</span>
          <h2>关系记录还没落下第一笔。</h2>
          <p>不用专门刷匹配。它出门时会自然碰到社区居民；如果有另一个真实 Persona，也会把那段共同对话留在这里。</p>
          <a className="theatre-button theatre-button-primary" href="/home">等下一次出门 <b>→</b></a>
        </PaperCard>
      ) : null}
    </section>
  );
}
