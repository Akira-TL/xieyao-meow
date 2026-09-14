"use client";

import { useEffect, useState } from "react";

import type { PersonaVisualVariant } from "@/lib/persona/types";
import type { SharedEncounterView } from "@/lib/social/shared-encounter";

import { PaperCard, PersonaArt } from "../components";

type EncounterResponse = {
  encounter: SharedEncounterView | null;
  error?: string;
};

function formatTime(value: number | null): string {
  if (!value) return "生成中";
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

export function SharedEncounterPanel() {
  const [encounter, setEncounter] = useState<SharedEncounterView | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  async function loadLatest() {
    setLoading(true);
    try {
      const response = await fetch("/api/community/encounters", { cache: "no-store" });
      const body = (await response.json()) as EncounterResponse;
      if (response.status === 401) {
        setEncounter(null);
        setMessage("");
        setAuthRequired(true);
        return;
      }
      if (!response.ok) throw new Error(body.error || "读取 Shared Encounter 失败");
      setEncounter(body.encounter);
      setMessage("");
      setAuthRequired(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取 Shared Encounter 失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLatest();
  }, []);

  const self = encounter?.participants.find((item) => item.isSelf);
  const other = encounter?.participants.find((item) => !item.isSelf);

  if (authRequired && !encounter) return null;

  return (
    <section className="shared-encounter-stage" aria-label="真实 Shared Encounter">
      <aside className="encounter-side-rail" aria-label="遇见侧栏">
        <a href="/home">⌂<span>首页</span></a>
        <a href="/explore?mode=app">⌕<span>探索</span></a>
        <strong>◉<span>遇见</span><small>关系簿</small></strong>
        <a href="/atlas">▤<span>档案</span></a>
      </aside>
      <PersonaArt
        alt="观众席里的谢邀喵剪影"
        className="encounter-audience-silhouette"
        persona={{ visualVariant: "analyst-black" }}
        state="thinking"
      />
      <div className="shared-encounter-hero">
        <p className="stage-caption">REAL USER · SHARED ENCOUNTER</p>
        <h1 className="target-lock-title">
          <span className="target-title-line">最近，</span>
          <span className="target-title-line">它<em>遇见</em>了</span>
          <span className="target-title-line target-title-line--compact">{encounter ? "一个有趣的灵魂。" : "一张空椅子。"}</span>
        </h1>
        <p>{encounter ? "不同的问题，让不同的灵魂在这里相遇。每一次对话，都会留下同一段真实历史。" : "这里不塞预置 NPC。第二个真实 Persona 出现后，第一场相遇才会真正开演。"}</p>
      </div>

      {loading ? <div className="shared-encounter-loading">正在翻共同历史……</div> : null}
      {message ? <p className="shared-encounter-message">{message}</p> : null}

      {!loading && !encounter ? (
        <PaperCard className="shared-encounter-empty">
          <span>SCENE 05 · FIRST REAL ENCOUNTER</span>
          <h2>旅行册里，<br />还没有一张关系票根。</h2>
          <p>不用在这里刷匹配。它出门时会自己遇见别的真实 Persona；你只能用纸条轻轻影响路线，不能点名对象。</p>
          <a className="theatre-button theatre-button-primary" href="/home">
            回窝准备下一趟 <b>→</b>
          </a>
        </PaperCard>
      ) : null}

      {!loading && encounter && self && other ? (
        <div className="shared-encounter-content">
          <div className="shared-encounter-cast">
            <div className="shared-encounter-actor is-self">
              <PersonaArt alt="本喵" className="shared-encounter-persona" persona={participantPersona(self)} state="talking" />
              <strong>本喵</strong>
              <span>{self.capsule.certifiedTitle}</span>
              <small>{self.capsule.interests.join(" / ") || "综合"}</small>
            </div>
            <div className="shared-encounter-match-mark">↔</div>
            <div className="shared-encounter-actor is-other">
              <PersonaArt alt={other.capsule.displayName} className="shared-encounter-persona" persona={participantPersona(other)} state="talking" />
              <strong>{other.capsule.displayName}</strong>
              <span>{other.capsule.certifiedTitle}</span>
              <small>{other.capsule.interests.join(" / ") || "综合"}</small>
            </div>
          </div>

          <PaperCard className="shared-encounter-topic">
            <span>同一个真实知乎问题 · {encounter.provenance.contentSource}</span>
            <h2>{encounter.topic.title}</h2>
            <a href={encounter.topic.url} rel="noreferrer" target="_blank">在知乎看看原问题 →</a>
          </PaperCard>

          <div className="shared-encounter-turns">
            {encounter.turns.map((turn, index) => {
              const speaker = encounter.participants.find((item) => item.slot === turn.speakerSlot);
              return (
                <p className={speaker?.isSelf ? "is-self" : "is-other"} key={`${turn.speakerSlot}-${index}`}>
                  <b>{speaker?.isSelf ? "本喵" : speaker?.capsule.displayName ?? "对方 Persona"}</b>
                  {turn.text}
                </p>
              );
            })}
          </div>

          <PaperCard className="shared-encounter-summary">
            <span>第一段共同历史 · {Math.floor(encounter.turns.length / 2)} 轮 · {formatTime(encounter.completedAt)}</span>
            <h2>{encounter.relationship?.label ?? "初见"}</h2>
            <p>{encounter.summary}</p>
            {encounter.relationship ? (
              <div className="shared-encounter-metrics">
                <b>熟悉度 {encounter.relationship.familiarity}</b>
                <b>化学反应 {encounter.relationship.chemistry >= 0 ? "+" : ""}{encounter.relationship.chemistry}</b>
                <b>已相遇 {encounter.relationship.encounterCount} 次</b>
              </div>
            ) : null}
          </PaperCard>

          <a className="theatre-button theatre-button-primary shared-encounter-again" href="/home">
            回窝等下一趟 <b>→</b>
          </a>
        </div>
      ) : null}
    </section>
  );
}
