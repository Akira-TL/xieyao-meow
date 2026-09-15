"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import type { JourneyAtlasView } from "@/lib/journey/types";

import { ArtSlot, PaperCard, PersonaArt, ResidentArt } from "../components";
import { useLivePersonaSnapshot } from "../live-client";
import { useCatProfile } from "../profile/client";

function compact(value: string, max = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function relationshipLabel(count: number) {
  if (count >= 5) return "常碰见";
  if (count >= 3) return "熟面孔";
  if (count >= 2) return "又碰见了";
  return "初见";
}

export function NpcRelationshipDetail({ relationshipId }: { relationshipId: string }) {
  const residentId = relationshipId.startsWith("resident-") ? relationshipId : `resident-${relationshipId}`;
  const resident = COMMUNITY_RESIDENTS.find((item) => item.id === residentId) ?? null;
  const snapshot = useLivePersonaSnapshot();
  const basePersona = snapshot?.persona ?? { visualVariant: "observer-canvas" as const };
  const { profile, persona } = useCatProfile(basePersona);
  const [atlas, setAtlas] = useState<JourneyAtlasView | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/atlas", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`atlas HTTP ${response.status}`);
        return (await response.json()) as JourneyAtlasView;
      })
      .then((next) => {
        if (!cancelled) setAtlas(next);
      })
      .catch(() => {
        if (!cancelled) setAtlas({ journeys: [], memories: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const encounters = useMemo(() => (atlas?.journeys ?? [])
    .filter((journey) => journey.conversation?.kind === "NPC" && journey.conversation.participantId === residentId)
    .sort((left, right) => right.completedAt - left.completedAt), [atlas, residentId]);
  const latest = encounters[0] ?? null;
  const latestConversation = latest?.conversation ?? null;
  const residentInterests = new Set<string>(resident?.persona.interests ?? []);
  const sharedInterests = resident && snapshot?.persona
    ? snapshot.persona.interests.filter((interest) => residentInterests.has(interest))
    : [];

  if (!resident) {
    return (
      <section className="relationship-detail-stage">
        <PaperCard className="relationship-status-card">
          <h2>这段关系记录不存在。</h2>
          <p>它可能来自已经失效的旧链接。</p>
          <Link href="/encounter">返回相遇档案 →</Link>
        </PaperCard>
      </section>
    );
  }

  return (
    <section className="relationship-detail-stage">
      <p className="stage-caption">RELATIONSHIP LOG · COMMUNITY RESIDENT</p>
      <h1 className="target-lock-title">
        <span className="target-title-line">和 <em>{resident.displayName}</em></span>
        <span className="target-title-line">已经碰见 {encounters.length} 次。</span>
      </h1>
      <p className="relationship-subtitle">关系不是一张静态标签，而是一段段真正聊过的话留下来的。</p>

      <div className="relationship-pair-stage">
        <div>
          <q className="relationship-speech">{snapshot?.persona.catchphrase ?? "先看看它这次会说什么。"}</q>
          <PersonaArt alt={profile.catName} className="relationship-self-art" persona={persona} state="thinking" />
          <strong>{profile.catName}</strong>
          <span>{snapshot?.persona.certifiedTitle ?? "你的谢邀喵"}</span>
        </div>
        <i>♡</i>
        <div>
          <q className="relationship-speech">{resident.persona.catchphrase}</q>
          <ResidentArt alt={resident.displayName} className="relationship-resident-art" residentId={resident.id} state="meeting" />
          <strong>{resident.displayName}</strong>
          <span>{resident.persona.personality[0]} · {resident.persona.interests.join(" × ")}</span>
        </div>
      </div>

      <div className="relationship-detail-grid">
        <PaperCard className="relationship-status-card">
          <h2>现在的关系</h2>
          <strong>{relationshipLabel(encounters.length)}</strong>
          <blockquote>“{latestConversation?.turns.find((turn) => turn.speaker === "other")?.text ?? resident.persona.catchphrase}”</blockquote>
          <p>{encounters.length
            ? `已经留下 ${encounters.length} 次实际相遇、${encounters.reduce((sum, encounter) => sum + (encounter.conversation?.turns.length ?? 0), 0)} 句对话。`
            : "还没有实际相遇记录。等它们真的在旅途中碰见，关系才会从这里开始。"}</p>
        </PaperCard>

        <PaperCard>
          <h2>来往时间线</h2>
          {encounters.length ? (
            <ol className="relationship-timeline">
              {encounters.slice(0, 6).map((encounter, index) => (
                <li className={index === 0 ? "is-current" : ""} key={encounter.journeyId}>
                  <b>{index === 0 ? "最近一次" : formatTime(encounter.completedAt)}</b>
                  <span>纸条「{encounter.routeBias ?? "随便逛"}」 · {encounter.conversation?.turns.length ?? 0} 句</span>
                  <Link href={`/encounter?scene=${encodeURIComponent(`journey:${encounter.journeyId}`)}`}>查看这一幕 →</Link>
                </li>
              ))}
            </ol>
          ) : <p>还没留下时间线。</p>}
        </PaperCard>

        <PaperCard>
          <h2>它们容易聊到什么</h2>
          <div className="relationship-topic-tags">
            {(sharedInterests.length ? sharedInterests : resident.persona.interests.slice(0, 3)).map((interest) => <span key={interest}>{interest}</span>)}
          </div>
          <h2 className="relationship-difference-heading">说话差在哪</h2>
          <div className="relationship-difference">
            <span><b>{profile.catName}</b>{snapshot?.persona.personality[0] ?? "好奇"}</span>
            <span><b>{resident.displayName}</b>{resident.persona.personality[0]}</span>
          </div>
          <p className="relationship-note">下次再碰见时，DeepSeek 会继续按双方自己的性格和口癖接话，而不是把两边写成同一种声音。</p>
        </PaperCard>

        {latest ? (
          <PaperCard className="relationship-latest-scene">
            <h2>最新一幕</h2>
            {latest.postcard.question?.thumbnailUrl ? (
              <ArtSlot
                name="relationship/latest-scene"
                label="最近一次真实知乎问题配图"
                aspect="wide"
                src={latest.postcard.question.thumbnailUrl}
              />
            ) : null}
            <h3>{latest.postcard.question ? `“${latest.postcard.question.title}”` : `纸条「${latest.routeBias ?? "随便逛"}」`}</h3>
            <div className="relationship-scene-dialogue">
              {latestConversation?.turns.map((turn, index) => (
                <p className={turn.speaker === "other" ? "is-other" : "is-self"} key={`${turn.speaker}-${index}`}>
                  <b>{turn.speaker === "other" ? resident.displayName : profile.catName}</b>
                  {compact(turn.text, 90)}
                </p>
              ))}
            </div>
            <Link href={`/encounter?scene=${encodeURIComponent(`journey:${latest.journeyId}`)}`}>完整查看这一幕 →</Link>
          </PaperCard>
        ) : null}
      </div>

      <Link className="theatre-button theatre-button-primary relationship-back" href="/encounter">返回相遇档案 <span>→</span></Link>
    </section>
  );
}
