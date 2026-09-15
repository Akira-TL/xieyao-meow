"use client";

import { useCallback, useEffect, useState } from "react";

import { resolveP0Art } from "@/lib/art/p0";
import type { JourneyInsightAction, JourneyProjection, JourneyView } from "@/lib/journey/types";
import type { PlayerPersona, ZhihuComposition } from "@/lib/persona";

import { PaperCard, PersonaArt } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
import { BottomSheet } from "./interaction-client";
import { useCatProfile } from "./profile/client";
import { useLivePersonaSnapshot } from "./live-client";

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

  const runAction = useCallback(async (body: unknown): Promise<JourneyProjection | null> => {
    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        setJourneyError("先完成知乎授权，这只猫才有自己的长期旅途。");
        return null;
      }
      if (!response.ok) throw new Error(`journey HTTP ${response.status}`);
      const next = (await response.json()) as JourneyProjection;
      setProjection(next);
      setJourneyError(null);
      return next;
    } catch {
      setJourneyError("这次没能把纸条交给它，再点一次就好。");
      return null;
    }
  }, []);

  const prepareJourney = useCallback(async (routeBias: string) => {
    const next = await runAction({ action: "start", routeBias });
    if (next?.state === "AT_HOME" && next.resting) {
      setJourneyError(`纸条塞好了：「${routeBias}」。它还在睡，醒了会自己决定什么时候走。`);
    }
  }, [runAction]);

  useEffect(() => {
    void refreshJourney();
  }, [refreshJourney]);

  useEffect(() => {
    const shouldPoll = projection?.state === "PREPARING"
      || projection?.state === "AWAY"
      || Boolean(projection?.resting)
      || Boolean(projection?.queuedRouteBias);
    if (!shouldPoll) return;
    const timer = window.setInterval(() => void refreshJourney(), 6_000);
    return () => window.clearInterval(timer);
  }, [projection?.state, projection?.resting, projection?.queuedRouteBias, refreshJourney]);

  if (!projection) {
    return <div className="outing-loading">正在看它在不在家……</div>;
  }
  if (projection.state === "PREPARING" && projection.journey) {
    return <PreparingStage catName={catName} playerPersona={playerPersona} routeBias={projection.journey.routeBias} />;
  }
  if (projection.state === "AWAY" && projection.journey) {
    return <AwayStage journey={projection.journey} />;
  }
  if (projection.state === "RETURNED" && projection.journey) {
    return (
      <ReturnedStage
        catName={catName}
        journey={projection.journey}
        playerPersona={playerPersona}
        onArchive={() => void runAction({ action: "archive" })}
        onInsightFeedback={async (response) => {
          await runAction({ action: "insight_feedback", journeyId: projection.journey!.id, response });
        }}
      />
    );
  }

  return (
    <AtHomeStage
      catName={catName}
      playerPersona={playerPersona}
      composition={personaSnapshot?.composition ?? null}
      resting={projection.resting}
      queuedRouteBias={projection.queuedRouteBias}
      journeyNotice={journeyError}
      onPrepare={prepareJourney}
    />
  );
}

function AtHomeStage({
  catName,
  onPrepare,
  playerPersona,
  composition,
  resting,
  queuedRouteBias,
  journeyNotice,
}: {
  catName: string;
  onPrepare: (routeBias: string) => Promise<void>;
  playerPersona: PlayerPersona;
  composition: ZhihuComposition | null;
  resting: boolean;
  queuedRouteBias: string | null;
  journeyNotice: string | null;
}) {
  const fixture = DEMO_FIXTURE;
  return (
    <div className="home-at-home home-room-stage">
      <RoomBackdrop />
      <div className="home-hero-copy">
        <p className="stage-caption">{resting ? "LIGHTS DOWN · 刚回来，先睡一会儿" : "AT HOME · 先替它准备一点东西"}</p>
        <h1 className="target-lock-title">
          <span className="target-title-line"><em>{resting ? "睡着" : "它还"}</em>，</span>
          <span className="target-title-line">{resting ? "以后会再走。" : "在窝里。"}</span>
        </h1>
        <p>{resting ? (queuedRouteBias ? `下一趟的纸条已经压好了：「${queuedRouteBias}」。它醒了以后会自己决定什么时候出门。` : "它刚从外面回来。你可以什么都不做，等它睡醒以后自己再走。") : "你只负责把纸条放进它的行囊。什么时候出门、去哪、会看见什么，都是它自己的决定。"}</p>
        {journeyNotice ? <p className="home-status-note" role="status">{journeyNotice}</p> : null}
      </div>

      <PaperCard className="home-story-polaroid">
        <span>旅行册 · TRAVEL BOOK</span>
        <strong>{resting ? "上一趟已经收进旅行册。" : "第一张明信片，还没有回来。"}</strong>
        <p>{queuedRouteBias ? `下一趟纸条：「${queuedRouteBias}」` : "不要提前知道它会去哪。回来以后再拆包，才知道它看见了什么。"}</p>
        <a href="/atlas">翻一翻旅行册 →</a>
      </PaperCard>

      <div className="home-hero-art">
        <PersonaArt
          alt={resting ? `${catName}刚回来，正在窝里睡觉` : `${catName}在窝里准备下一趟旅途`}
          aspect={resting ? "wide" : "portrait"}
          className={`home-persona-art${resting ? " is-sleeping" : ""}`}
          persona={playerPersona}
          priority
          state={resting ? "sleeping" : "thinking"}
        />
        <span className="home-resting-note">{resting ? <>刚回来。<br />先歇会儿。</> : <>好奇心已经<br />开始转了。</>}</span>
      </div>

      <div className="home-event-actions">
        <BottomSheet trigger={<span className="home-outing-trigger home-outing-primary">{resting ? "给下一趟压张纸条" : "给它准备行囊"} <b>→</b></span>} title="给行囊塞张纸条">
          {(close) => (
            <>
              <p>{resting ? "它刚回来，还在睡。你可以先塞一张纸条；醒了以后它会自己决定什么时候走。" : "你只能给一个模糊方向。纸条不会决定目的地，更不会决定它带什么回来。"}</p>
              <div className="route-bias-list">
                {fixture.outing.routeBiases.map((bias) => (
                  <button
                    key={bias}
                    onClick={() => void onPrepare(bias).finally(close)}
                    type="button"
                  >
                    {bias}
                  </button>
                ))}
              </div>
            </>
          )}
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
      <p className="stage-caption">PACKING · 别催，它自己决定什么时候走</p>
      <h1>它开始<br />收行囊了。</h1>
      <PersonaArt alt={`${catName}收拾出门装备`} className="outing-state-persona" persona={playerPersona} state="thinking" />
      <PaperCard className="outing-note-card">
        <span>行囊里唯一由你放进去的东西</span>
        <strong>「{routeBias ?? "随便逛"}」</strong>
        <p>纸条看见了。接下来不用点“出发”，它会自己把门带上。</p>
        <div className="outing-pack-steps" aria-label="出门准备">
          <span className="is-done">纸条收好</span>
          <span className="is-current">自己收包</span>
          <span>自己出门</span>
        </div>
      </PaperCard>
    </div>
  );
}

function awayMood(journey: JourneyView): string {
  const total = Math.max(1, journey.returnAt - journey.departAt);
  const progress = Math.min(1, Math.max(0, (Date.now() - journey.departAt) / total));
  if (progress < 0.22) return "刚出门。门口的脚印还很新。";
  if (progress < 0.68) return "已经走远了。现在不知道它在哪。";
  return "外面安静了很久。也许快回来了。";
}

function AwayStage({ journey }: { journey: JourneyView }) {
  return (
    <div className="outing-empty-stage outing-away-stage home-room-stage">
      <RoomBackdrop empty />
      <p className="stage-caption">AWAY · THE ROOM IS EMPTY</p>
      <h1>窝空了。</h1>
      <p>{awayMood(journey)}</p>
      <PaperCard className="outing-note-card">
        <span>它带走的纸条</span>
        <strong>「{journey.routeBias ?? "随便逛"}」</strong>
        <p>这只是一个方向。你不会看到倒计时，也不能把它叫回来。</p>
      </PaperCard>
      <div className="outing-away-actions">
        <a href="/atlas">翻翻以前的旅行册 →</a>
        <span>等门自己响。</span>
      </div>
    </div>
  );
}

function ReturnedStage({
  catName,
  journey,
  onArchive,
  onInsightFeedback,
  playerPersona,
}: {
  catName: string;
  journey: JourneyView;
  onArchive: () => void;
  onInsightFeedback: (response: JourneyInsightAction) => Promise<void>;
  playerPersona: PlayerPersona;
}) {
  const [opened, setOpened] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const question = journey.question;
  const thought = journey.postcard?.body ?? "这一趟只留下了出门记录。";
  const relationTicket = journey.artifact?.type === "RELATION_TICKET";
  const insight = journey.insight;
  const artifactLabel = relationTicket
    ? "关系票根 · RELATION TICKET"
    : journey.artifact?.type === "OPINION_FRAGMENT"
      ? "观点碎片 · OPINION FRAGMENT"
      : journey.artifact?.type === "ODDITY_SPECIMEN"
        ? "怪东西 · ODDITY"
        : question
          ? "问题票根 · QUESTION TICKET"
          : insight
            ? "新认识 · ABOUT YOU"
            : "旅途札记 · POSTCARD";
  const legacyScentArtifact = journey.artifact?.type === "NEW_SCENT";
  const artifactTitle = legacyScentArtifact
    ? insight?.headline ?? "这一趟留下的旅行记录"
    : journey.artifact?.title ?? question?.title ?? insight?.headline ?? journey.postcard?.headline ?? "这一趟的旅行札记";

  async function submitInsightFeedback(response: JourneyInsightAction) {
    if (!insight || feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      await onInsightFeedback(response);
    } finally {
      setFeedbackBusy(false);
    }
  }

  useEffect(() => {
    setOpened(false);
  }, [journey.id]);

  return (
    <div className="returned-stage home-room-stage">
      <RoomBackdrop />
      <div className="returned-copy">
        <p className="stage-caption">RETURNED · 回窝</p>
        <span>旅包已经放在桌边。</span>
        <h1>{catName}<br />回窝了。</h1>
        <p>{opened ? "这一趟留下的东西，都在这里。" : "先拆包。里面是什么，打开以后才知道。"}</p>
      </div>
      <PersonaArt alt={`${catName}背着旅包回到窝里`} className="returned-persona-art" persona={playerPersona} state="returned" />
      {!opened ? (
        <PaperCard className="returned-artifact returned-artifact--sealed">
          <span>旅包 · SEALED</span>
          <h2>东西还没摊开。</h2>
          <p>可能是一张问题票，也可能是它对你的一个新发现。这一趟回来，总会留下能继续看的东西。</p>
          <div className="returned-package-mark" aria-hidden="true">?</div>
          <button className="theatre-button theatre-button-primary" onClick={() => setOpened(true)} type="button">拆开它的包 <span>→</span></button>
        </PaperCard>
      ) : (
        <PaperCard className="returned-artifact is-opened">
          <span>{artifactLabel}</span>
          <h2>{artifactTitle}</h2>
          <p>你塞的纸条：{journey.routeBias ?? "随便逛"}</p>
          {question || relationTicket ? <blockquote>“{thought}”</blockquote> : null}
          <div className="returned-meta">
            <span>它看到了什么 <b>{question ? "一个真实知乎问题" : relationTicket ? "一场真实相遇" : "这一趟没有硬编新问题"}</b></span>
            <span>它更懂你什么 <b>{insight ? `1 条新认识 · ${insight.textCharCount} 字` : "仍按可验证事实记录"}</b></span>
          </div>
          {insight ? (
            <section className="returned-insight" aria-label="它对你的一个新发现">
              <span>新认识 · ABOUT YOU · {insight.textCharCount} 字</span>
              <h3>{insight.headline}</h3>
              <p>{insight.insight}</p>
              <small>{insight.whyItMatters}</small>
              <details>
                <summary>它为什么这么想 →</summary>
                <p>{insight.evidenceSummary}</p>
              </details>
              <strong>{insight.interactionQuestion}</strong>
              <div className="returned-insight-actions">
                {insight.options.map((option) => (
                  <button
                    className={insight.feedbackAction === option.action ? "is-selected" : ""}
                    disabled={feedbackBusy}
                    key={option.action}
                    onClick={() => void submitInsightFeedback(option.action)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {insight.feedbackAction ? <em>这次回应已经记进这趟旅程，不会直接改写你的人格。</em> : null}
            </section>
          ) : null}
          {relationTicket ? (
            <a className="home-last-night-link" href="/encounter">看它们这一幕 →</a>
          ) : question ? (
            <a className="home-last-night-link" href={question.url} rel="noreferrer" target="_blank">去知乎看原问题 →</a>
          ) : null}
          <button className="theatre-button theatre-button-primary" onClick={onArchive} type="button">收进旅行册 <span>→</span></button>
        </PaperCard>
      )}
    </div>
  );
}
