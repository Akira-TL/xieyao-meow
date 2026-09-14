"use client";

import { useCallback, useEffect, useState } from "react";

import { resolveP0Art } from "@/lib/art/p0";
import type { JourneyProjection, JourneyView } from "@/lib/journey/types";
import type { PlayerPersona, ZhihuComposition } from "@/lib/persona";

import { PaperCard, PersonaArt } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
import { BottomSheet } from "./interaction-client";
import { useCatProfile } from "./profile/client";
import {
  type LiveQuestionSnapshot,
  useLivePersonaSnapshot,
  useLiveQuestionSnapshot,
} from "./live-client";

function RoomBackdrop({ empty = false }: { empty?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="home-room-backdrop"
      style={{ backgroundImage: `url(${resolveP0Art(empty ? "room-empty-night" : "room-study-night-empty")})` }}
    />
  );
}

export function DemoOutingHome() {
  const [projection, setProjection] = useState<JourneyProjection | null>(null);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();
  const basePersona = (personaSnapshot?.persona ?? DEMO_FIXTURE.persona) as PlayerPersona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona);
  const catName = profile.catName;

  const refreshJourney = useCallback(async () => {
    try {
      const response = await fetch("/api/journey", { cache: "no-store" });
      if (response.status === 401) {
        setJourneyError(null);
        setProjection({ state: "AT_HOME", journey: null, resting: false, queuedRouteBias: null, nextJourneyAt: null });
        return;
      }
      if (!response.ok) throw new Error(`journey HTTP ${response.status}`);
      setProjection((await response.json()) as JourneyProjection);
      setJourneyError(null);
    } catch {
      setJourneyError("旅途状态暂时没读到，刷新页面再试一次。");
      setProjection((current) => current ?? { state: "AT_HOME", journey: null, resting: false, queuedRouteBias: null, nextJourneyAt: null });
    }
  }, []);

  const runAction = useCallback(async (body: unknown) => {
    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        setJourneyError("先完成知乎授权，这只猫才有自己的长期旅途。");
        return;
      }
      if (!response.ok) throw new Error(`journey HTTP ${response.status}`);
      setProjection((await response.json()) as JourneyProjection);
      setJourneyError(null);
    } catch {
      setJourneyError("这次没能把纸条交给它，再点一次就好。");
    }
  }, []);

  useEffect(() => {
    void refreshJourney();
  }, [refreshJourney]);

  useEffect(() => {
    if (projection?.state !== "PREPARING" && projection?.state !== "AWAY") return;
    const timer = window.setInterval(() => void refreshJourney(), 8_000);
    return () => window.clearInterval(timer);
  }, [projection?.state, refreshJourney]);

  if (!projection) {
    return <div className="outing-loading">正在看它在不在家……</div>;
  }
  if (projection.state === "PREPARING" && projection.journey) {
    return <PreparingStage catName={catName} playerPersona={playerPersona} routeBias={projection.journey.routeBias} />;
  }
  if (projection.state === "AWAY" && projection.journey) {
    return <AwayStage routeBias={projection.journey.routeBias} />;
  }
  if (projection.state === "RETURNED" && projection.journey) {
    return (
      <ReturnedStage
        catName={catName}
        journey={projection.journey}
        playerPersona={playerPersona}
        onArchive={() => void runAction({ action: "archive" })}
      />
    );
  }

  return (
    <AtHomeStage
      catName={catName}
      playerPersona={playerPersona}
      questionSnapshot={questionSnapshot}
      composition={personaSnapshot?.composition ?? null}
      resting={projection.resting}
      queuedRouteBias={projection.queuedRouteBias}
      journeyNotice={journeyError}
      onPrepare={(routeBias) => void runAction({ action: "start", routeBias })}
    />
  );
}

function AtHomeStage({
  catName,
  onPrepare,
  playerPersona,
  questionSnapshot,
  composition,
  resting,
  queuedRouteBias,
  journeyNotice,
}: {
  catName: string;
  onPrepare: (routeBias: string) => void;
  playerPersona: PlayerPersona;
  questionSnapshot: LiveQuestionSnapshot | null;
  composition: ZhihuComposition | null;
  resting: boolean;
  queuedRouteBias: string | null;
  journeyNotice: string | null;
}) {
  const fixture = DEMO_FIXTURE;
  const question = questionSnapshot?.question ?? {
    title: fixture.encounter.topic.title,
    url: fixture.encounter.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const previewTitle = question.title.length > 22 ? `${question.title.slice(0, 22)}…` : question.title;
  return (
    <div className="home-at-home home-room-stage">
      <RoomBackdrop />
      <div className="home-hero-copy">
        <p className="stage-caption">{resting ? "LIGHTS DOWN · 刚回来，先歇会儿" : "ACT / AT HOME · 第一趟马上开场"}</p>
        <h1><span>{resting ? "刚刚" : "今晚"}</span>，<br />{resting ? "它回窝了。" : "第一趟要开场。"}</h1>
        <p>{resting ? (queuedRouteBias ? `下一趟的纸条已经压好了：「${queuedRouteBias}」。它歇够了会自己出门。` : "上一趟已经结算，明信片也收好了。歇够以后，它会自己再出门。") : "它会从你的真实知乎兴趣出发，自己挑问题、自己决定停在哪里，再把这一趟带回家。"}</p>
        {journeyNotice ? <p className="home-status-note" role="status">{journeyNotice}</p> : null}
      </div>

      <PaperCard className="home-story-polaroid">
        <span>知乎现在 · REAL QUESTION</span>
        <strong>{previewTitle}</strong>
        <p>这一题正在真实知乎世界里发生。它可能会路过，也可能完全不理。</p>
        <a href={question.url} rel="noreferrer" target="_blank">先看这一题 →</a>
      </PaperCard>

      <div className="home-hero-art">
        <PersonaArt
          alt={`${catName}在窝里准备下一趟旅途`}
          aspect="portrait"
          className="home-persona-art"
          persona={playerPersona}
          priority
          state="thinking"
        />
        <span className="home-resting-note">{resting ? <>刚回来。<br />先歇会儿。</> : <>好奇心已经<br />开始转了。</>}</span>
      </div>

      <div className="home-event-actions">
        <BottomSheet trigger={<span className="home-outing-trigger home-outing-primary">{resting ? "给下一趟留纸条" : "带它出去闻闻"} <b>→</b></span>} title="留张出门纸条">
          <p>给它一个大概方向就行。最后看什么、遇见谁，让它自己决定。</p>
          <div className="route-bias-list">
            {fixture.outing.routeBiases.map((bias) => (
              <button key={bias} onClick={() => onPrepare(bias)} type="button">{bias}</button>
            ))}
          </div>
        </BottomSheet>
        <a className="home-last-night-link" href="/explore?mode=public">先看看知乎现在有什么 →</a>
      </div>

      <div className="home-context-strip home-context-strip--stats">
        <span><small>公开创作</small><b>{composition?.sourceCounts.contents ?? "—"}</b><em>表达线索</em></span>
        <span><small>关注</small><b>{composition?.sourceCounts.followees ?? "—"}</b><em>长期兴趣</em></span>
        <span><small>近期收藏</small><b>{composition?.sourceCounts.collections ?? "—"}</b><em>真正留下</em></span>
        <span><small>人格方向</small><b>{composition?.primaryInterest ?? playerPersona.interests[0] ?? "综合"}</b><em>{playerPersona.certifiedTitle}</em></span>
      </div>
    </div>
  );
}

function PreparingStage({
  catName,
  playerPersona,
  routeBias,
}: {
  catName: string;
  playerPersona: PlayerPersona;
  routeBias: string | null;
}) {
  return (
    <div className="outing-empty-stage home-room-stage">
      <RoomBackdrop />
      <p className="stage-caption">BACKSTAGE / PREPARING</p>
      <h1>它在后台<br />收东西。</h1>
      <PersonaArt alt={`${catName}收拾出门装备`} className="outing-state-persona" persona={playerPersona} state="thinking" />
      <PaperCard className="outing-note-card">
        <span>今天的纸条</span>
        <strong>「{routeBias ?? "随便逛"}」</strong>
        <p>看见了。至于听不听，是它的事。</p>
      </PaperCard>
    </div>
  );
}

function AwayStage({ routeBias }: { routeBias: string | null }) {
  return (
    <div className="outing-empty-stage outing-away-stage home-room-stage">
      <RoomBackdrop empty />
      <p className="stage-caption">ACT / AWAY</p>
      <h1>它不在。</h1>
      <p>大概又跑去看别人为什么吵架了。</p>
      <PaperCard className="outing-note-card">
        <span>桌上压着一张纸</span>
        <strong>“{DEMO_FIXTURE.outing.note}”</strong>
        <p>你留的方向：{routeBias ?? "随便逛"}</p>
      </PaperCard>
      <div className="outing-away-actions">
        <a href="/explore?mode=app">看看它上次带回来的东西 →</a>
        <span>不用催，它逛够了会自己回来。</span>
      </div>
    </div>
  );
}

function ReturnedStage({
  catName,
  journey,
  onArchive,
  playerPersona,
}: {
  catName: string;
  journey: JourneyView;
  onArchive: () => void;
  playerPersona: PlayerPersona;
}) {
  const question = journey.question;
  const interests = playerPersona.interests.slice(0, 2);
  const thought = journey.postcard?.body ?? "它按时回来了，只是这趟没有值得带回来的新问题。";
  return (
    <div className="returned-stage home-room-stage">
      <RoomBackdrop />
      <div className="returned-copy">
        <p className="stage-caption">LIGHTS UP / RETURNED</p>
        <span>门响了一下。</span>
        <h1>它回来了。</h1>
        <p>{question ? "而且叼回来一个真实问题。" : "这趟空着爪子，但没有迟到。"}</p>
      </div>
      <PersonaArt alt={`${catName}带着旅途札记回到窝里`} className="returned-persona-art" persona={playerPersona} state="returned" />
      <PaperCard className="returned-artifact">
        <span>{journey.artifact ? "问题票根 · QUESTION TICKET" : "旅途明信片 · POSTCARD"}</span>
        <h2>{question?.title ?? "今天没碰到值得带回来的新问题"}</h2>
        <p>出门方向：{journey.routeBias ?? "随便逛"}{interests.length ? ` · ${interests.join(" / ")}` : ""}</p>
        <blockquote>“{thought}”</blockquote>
        <div className="returned-meta">
          <span>内容来源 <b>{journey.contentSource === "live" ? "知乎实时公开内容" : "本趟无新内容"}</b></span>
          <span>收藏 <b>{journey.artifact ? "已自动写入" : "没有额外掉落"}</b></span>
        </div>
        {question ? <a className="home-last-night-link" href={question.url} rel="noreferrer" target="_blank">查看知乎原问题 →</a> : null}
        <button className="theatre-button theatre-button-primary" onClick={onArchive} type="button">看完了 <span>→</span></button>
      </PaperCard>
    </div>
  );
}
