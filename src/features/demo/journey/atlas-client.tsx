"use client";

import { useEffect, useState } from "react";

import type { JourneyAtlasView } from "@/lib/journey/types";

import { PaperCard } from "./components";
import { LiveAtlasSection } from "./live/daily-live-client";

function formatJourneyTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function JourneyAtlasPageContent() {
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

  return (
    <>
      <LiveAtlasSection />
      <section className="atlas-grid atlas-grid-bottom" aria-label="真实旅途历史">
        <PaperCard>
          <div className="section-heading-row">
            <h2>旅途明信片</h2>
            <span>JOURNEY POSTCARDS</span>
          </div>
          {!atlas ? <p>正在翻旅途册……</p> : null}
          {atlas && atlas.journeys.length === 0 ? <p>第一趟真实旅行回来后，明信片会自动出现在这里。</p> : null}
          <div className="atlas-change-list">
            {atlas?.journeys.slice(0, 10).map((entry) => (
              <article key={entry.journeyId}>
                <p><b>{formatJourneyTime(entry.completedAt)}</b>　{entry.postcard.headline}</p>
                <p>{entry.postcard.body}</p>
                {entry.postcard.question ? (
                  <a href={entry.postcard.question.url} rel="noreferrer" target="_blank">
                    {entry.postcard.question.title} →
                  </a>
                ) : null}
                {entry.artifact ? <small>收藏：{entry.artifact.type} · {entry.artifact.title}</small> : <small>这趟没有额外收藏</small>}
              </article>
            ))}
          </div>
        </PaperCard>

        <PaperCard>
          <div className="section-heading-row">
            <h2>经历记忆</h2>
            <span>TRACEABLE MEMORY</span>
          </div>
          {!atlas ? <p>正在整理经历……</p> : null}
          {atlas && atlas.memories.length === 0 ? <p>这里只记录有真实 source event 的经历，不让模型随手改写人格。</p> : null}
          <div className="atlas-change-list">
            {atlas?.memories.slice(0, 10).map((memory) => (
              <p key={memory.id}>
                {memory.observation}
                {memory.topicRef ? <>　<a href={memory.topicRef} rel="noreferrer" target="_blank">来源 →</a></> : null}
              </p>
            ))}
          </div>
        </PaperCard>
      </section>
    </>
  );
}
