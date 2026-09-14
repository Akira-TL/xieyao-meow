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
  const [creating, setCreating] = useState(false);
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

  async function createEncounter() {
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/encounters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = (await response.json()) as EncounterResponse;
      if (response.status === 401) {
        setAuthRequired(true);
        setMessage("");
        return;
      }
      if (!response.ok && response.status !== 202) {
        throw new Error(body.error || "创建 Shared Encounter 失败");
      }
      setAuthRequired(false);
      setEncounter(body.encounter);
      if (response.status === 202) setMessage("两只猫正在把这一幕写进共同历史。刷新后仍然会读到同一场。 ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建 Shared Encounter 失败");
    } finally {
      setCreating(false);
    }
  }

  const self = encounter?.participants.find((item) => item.isSelf);
  const other = encounter?.participants.find((item) => !item.isSelf);

  if (authRequired && !encounter) return null;

  return (
    <section className="shared-encounter-stage" aria-label="真实 Shared Encounter">
      <div className="shared-encounter-hero">
        <p className="stage-caption">REAL USER · SHARED ENCOUNTER</p>
        <h1>最近，<br />它<span>遇见</span>了<br />{encounter ? "另一个真实灵魂。" : "一个空位。"}</h1>
        <p>{encounter ? "同一个真实知乎问题，让两只 Persona 留下同一段、不会被刷新改写的共同历史。" : "这里不会塞预置 NPC。等第二个真实 Persona 出现，第一场相遇才会开始。"}</p>
      </div>

      {loading ? <div className="shared-encounter-loading">正在翻共同历史……</div> : null}
      {message ? <p className="shared-encounter-message">{message}</p> : null}

      {!loading && !encounter ? (
        <PaperCard className="shared-encounter-empty">
          <span>SCENE 05 · FIRST REAL ENCOUNTER</span>
          <h2>舞台已经亮了，<br />还差另一只真实的猫。</h2>
          <p>匹配只会从已完成知乎授权、已经生成 Persona 的真实用户里选；不会让你点名，也不会用测试居民补位。</p>
          <button className="theatre-button theatre-button-primary" disabled={creating} onClick={createEncounter} type="button">
            {creating ? "正在找另一只猫…" : "让它去遇见谁"} <b>→</b>
          </button>
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

          <button className="theatre-button theatre-button-primary shared-encounter-again" disabled={creating} onClick={createEncounter} type="button">
            {creating ? "正在找下一场…" : "去见更多真实灵魂"} <b>→</b>
          </button>
        </div>
      ) : null}
    </section>
  );
}
