"use client";

import { useState } from "react";

import type { SocialAgent, SocialEvent } from "@/lib/social";

interface CommunityDemoProps {
  residents: readonly SocialAgent[];
}

export function CommunityDemo({ residents }: CommunityDemoProps) {
  const [feed, setFeed] = useState<SocialEvent[]>([]);
  const [busyResident, setBusyResident] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function interact(residentId: string) {
    setBusyResident(residentId);
    setError(null);
    try {
      const response = await fetch("/api/community/interact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ residentId }),
      });
      if (!response.ok) throw new Error(`社区互动失败：HTTP ${response.status}`);
      const payload = (await response.json()) as { feed: SocialEvent[] };
      setFeed(payload.feed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "社区互动失败");
    } finally {
      setBusyResident(null);
    }
  }

  return (
    <section className="community-section mt-6 p-6 sm:p-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">AGENT × AGENT COMMUNITY</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">去别人窝里串门</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            行为不是随机台词：系统会把共同兴趣、回答风格差异、作息和人格特征变成可解释的社交信号。
          </p>
        </div>
        <span className="text-xs text-zinc-600">当前居民为公共数据 Demo；OAuth 后替换为真实授权用户</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {residents.map((resident) => (
          <article className="resident-card" key={resident.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-zinc-100">{resident.displayName}</p>
                <p className="mt-1 text-xs text-amber-200/70">{resident.persona.certifiedTitle}</p>
              </div>
              <span className="resident-species">{resident.persona.species}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">“{resident.persona.catchphrase}”</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resident.persona.interests.map((interest) => (
                <span className="tag" key={interest}>{interest}</span>
              ))}
            </div>
            <button
              className="secondary-button mt-5 w-full"
              disabled={busyResident !== null}
              onClick={() => interact(resident.id)}
            >
              {busyResident === resident.id ? "正在串门…" : `去找 ${resident.displayName}`}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-7 border-t border-zinc-800 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="meta-label">社区动态</p>
          <span className="text-xs text-zinc-700">{feed.length} events</span>
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {feed.length === 0 ? (
          <div className="empty-feed">还没有猫来往。点上面的“去找”触发第一条可解释社交事件。</div>
        ) : (
          <div className="space-y-3">
            {feed.map((event) => (
              <article className="feed-event" key={event.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="action-badge">{actionLabel(event.action)}</span>
                  <span className="text-xs text-zinc-600">
                    好感 {signed(event.affinityDelta)} → {event.affinityAfter} · {event.relationship}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{event.narrative}</p>
                <blockquote className="mt-3 border-l border-amber-400/40 pl-3 text-sm leading-6 text-zinc-400">
                  {event.comment}
                </blockquote>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.reasons.slice(0, 3).map((reason) => (
                    <span className="reason-chip" key={reason}>{reason}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function actionLabel(action: SocialEvent["action"]): string {
  if (action === "debate") return "友好对线";
  if (action === "comment") return "同频评论";
  return "串门";
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
