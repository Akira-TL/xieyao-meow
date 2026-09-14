"use client";

import { useEffect, useState } from "react";

import type { SharedEncounterView } from "@/lib/social/shared-encounter";

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

export function SharedEncounterPanel() {
  const [encounter, setEncounter] = useState<SharedEncounterView | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function loadLatest() {
    setLoading(true);
    try {
      const response = await fetch("/api/community/encounters", { cache: "no-store" });
      const body = (await response.json()) as EncounterResponse;
      if (!response.ok) throw new Error(body.error || "读取 Shared Encounter 失败");
      setEncounter(body.encounter);
      setMessage("");
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
      if (!response.ok && response.status !== 202) {
        throw new Error(body.error || "创建 Shared Encounter 失败");
      }
      setEncounter(body.encounter);
      if (response.status === 202) setMessage("两只猫正在把同一次相遇写进共同历史。刷新后仍会读取这一场。 ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建 Shared Encounter 失败");
    } finally {
      setCreating(false);
    }
  }

  const self = encounter?.participants.find((item) => item.isSelf);
  const other = encounter?.participants.find((item) => !item.isSelf);

  return (
    <section
      aria-label="Shared Encounter"
      style={{
        margin: "0 auto 24px",
        maxWidth: 920,
        padding: "20px",
        border: "1px solid rgba(23, 114, 246, 0.24)",
        borderRadius: 18,
        background: "rgba(255,255,255,0.88)",
      }}
    >
      <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", opacity: 0.65 }}>REAL USER · SHARED ENCOUNTER</p>
          <h2 style={{ margin: "6px 0 4px", fontSize: 24 }}>两只真实 Persona，共用同一段相遇历史</h2>
          <p style={{ margin: 0, opacity: 0.72 }}>对话只生成一次；双方刷新、换设备或晚点回来，读到的仍是这一次。</p>
        </div>
        <button
          disabled={creating}
          onClick={createEncounter}
          type="button"
          style={{ padding: "10px 16px", borderRadius: 999, cursor: creating ? "wait" : "pointer" }}
        >
          {creating ? "正在相遇…" : encounter ? "遇见另一只猫" : "开始真实相遇"}
        </button>
      </div>

      {loading ? <p style={{ marginTop: 18 }}>正在读取共同历史…</p> : null}
      {message ? <p style={{ marginTop: 18 }}>{message}</p> : null}

      {!loading && encounter ? (
        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[self, other].map((participant, index) => participant ? (
              <article key={participant.slot} style={{ padding: 14, borderRadius: 14, background: "rgba(23,114,246,0.06)" }}>
                <strong>{participant.isSelf ? "本喵" : participant.capsule.displayName}</strong>
                <div style={{ marginTop: 5 }}>{participant.capsule.certifiedTitle}</div>
                <div style={{ marginTop: 7, fontSize: 13, opacity: 0.72 }}>
                  Persona v{participant.personaVersion} · {participant.capsule.interests.join(" / ") || "综合"}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, opacity: 0.72 }}>
                  {participant.capsule.personality.join(" · ")}
                </div>
              </article>
            ) : <span key={index} />)}
          </div>

          <article style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,0.035)" }}>
            <div style={{ fontSize: 12, opacity: 0.62 }}>同一真实知乎问题 · {encounter.provenance.contentSource} / {encounter.provenance.knowledgeSource}</div>
            <a href={encounter.topic.url} rel="noreferrer" target="_blank" style={{ display: "inline-block", marginTop: 6, fontWeight: 700 }}>
              {encounter.topic.title}
            </a>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.68 }}>
              {Math.floor(encounter.turns.length / 2)} 轮 · 完成于 {formatTime(encounter.completedAt)}
            </div>
          </article>

          <div style={{ display: "grid", gap: 10 }}>
            {encounter.turns.map((turn, index) => {
              const speaker = encounter.participants.find((item) => item.slot === turn.speakerSlot);
              return (
                <div
                  key={`${turn.speakerSlot}-${index}`}
                  style={{
                    justifySelf: speaker?.isSelf ? "end" : "start",
                    maxWidth: "78%",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: speaker?.isSelf ? "rgba(23,114,246,0.11)" : "rgba(0,0,0,0.055)",
                  }}
                >
                  <div style={{ marginBottom: 4, fontSize: 11, opacity: 0.58 }}>
                    {speaker?.isSelf ? "本喵" : speaker?.capsule.displayName ?? "对方 Persona"}
                  </div>
                  {turn.text}
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: 4, fontSize: 14 }}>
            <strong>共同摘要：</strong>{encounter.summary}
            {encounter.relationship ? (
              <span style={{ display: "block", marginTop: 6, opacity: 0.72 }}>
                猫关系：{encounter.relationship.label} · 熟悉度 {encounter.relationship.familiarity} · 化学反应 {encounter.relationship.chemistry >= 0 ? "+" : ""}{encounter.relationship.chemistry} · 已相遇 {encounter.relationship.encounterCount} 次
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {!loading && !encounter && !message ? (
        <p style={{ marginTop: 18, opacity: 0.72 }}>还没有真实双用户相遇。另一名已激活用户出现后，就可以生成第一场共同历史。</p>
      ) : null}
    </section>
  );
}
