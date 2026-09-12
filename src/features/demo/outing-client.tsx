"use client";

import { useEffect, useState } from "react";

import { ArtSlot, GrowthStrip, PaperCard } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
import { BottomSheet } from "./interaction-client";
import {
  DEMO_OUTING_STORAGE_KEY,
  advanceDemoOuting,
  createDemoOutingState,
  isDemoOutingState,
  type DemoOutingState,
} from "./outing";

function loadOuting(): DemoOutingState {
  if (typeof window === "undefined") return createDemoOutingState();
  const raw = window.localStorage.getItem(DEMO_OUTING_STORAGE_KEY);
  if (!raw) return createDemoOutingState();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isDemoOutingState(parsed) ? parsed : createDemoOutingState();
  } catch {
    return createDemoOutingState();
  }
}

function saveOuting(state: DemoOutingState) {
  window.localStorage.setItem(DEMO_OUTING_STORAGE_KEY, JSON.stringify(state));
}

export function DemoOutingHome() {
  const [outing, setOuting] = useState<DemoOutingState>(createDemoOutingState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOuting(loadOuting());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveOuting(outing);
  }, [outing, ready]);

  useEffect(() => {
    if (!ready || outing.state !== "PREPARING") return;
    const timer = window.setTimeout(() => {
      setOuting((current) => advanceDemoOuting(current, { type: "depart" }));
    }, 1050);
    return () => window.clearTimeout(timer);
  }, [outing.state, ready]);

  if (!ready) {
    return <div className="outing-loading">正在看它在不在家……</div>;
  }
  if (outing.state === "PREPARING") return <PreparingStage routeBias={outing.routeBias} />;
  if (outing.state === "AWAY") {
    return (
      <AwayStage
        routeBias={outing.routeBias}
        onAdvance={() => setOuting((current) => advanceDemoOuting(current, { type: "return" }))}
      />
    );
  }
  if (outing.state === "RETURNED") {
    return <ReturnedStage onArchive={() => setOuting((current) => advanceDemoOuting(current, { type: "archive" }))} />;
  }

  return <AtHomeStage onPrepare={(routeBias) => setOuting((current) => advanceDemoOuting(current, { type: "prepare", routeBias }))} />;
}

function AtHomeStage({ onPrepare }: { onPrepare: (routeBias: string) => void }) {
  const fixture = DEMO_FIXTURE;
  return (
    <div className="home-at-home">
      <div className="home-hero-copy">
        <p className="stage-caption">ACT / AT HOME · 昨晚发生了一点事</p>
        <h1>昨晚，<br /><span>齿轮</span>来过。</h1>
        <p>我们为了一个 AI 问题吵了很久：「AI 会让人类更自由吗？」不同的视角，让问题变得更有趣。</p>
        <a className="theatre-button theatre-button-primary" href={fixture.home.heroEvent.target}>看这一幕 <span>→</span></a>
      </div>

      <div className="home-hero-art">
        <ArtSlot name="home/last-night-gear" label="昨晚齿轮来过 / 房间场景" aspect="wide" />
        <span className="home-resting-note">吵完了。<br />但还是好朋友。</span>
      </div>

      <div className="home-outing-control">
        <BottomSheet trigger={<span className="home-outing-trigger">让它出去逛逛 →</span>} title="留张出门纸条">
          <p>你只能影响方向，不能指定它最终看什么、遇见谁。</p>
          <div className="route-bias-list">
            {fixture.outing.routeBiases.map((bias) => (
              <button key={bias} onClick={() => onPrepare(bias)} type="button">{bias}</button>
            ))}
          </div>
        </BottomSheet>
      </div>

      <div className="home-growth-row">
        <GrowthStrip knowledge={fixture.home.growth.knowledge} expression={fixture.home.growth.expression} social={fixture.home.growth.social} />
      </div>
    </div>
  );
}

function PreparingStage({ routeBias }: { routeBias: string | null }) {
  return (
    <div className="outing-empty-stage">
      <p className="stage-caption">BACKSTAGE / PREPARING</p>
      <h1>它在后台<br />收东西。</h1>
      <PaperCard className="outing-note-card">
        <span>今天的纸条</span>
        <strong>「{routeBias ?? "随便逛"}」</strong>
        <p>看见了。至于听不听，是它的事。</p>
      </PaperCard>
    </div>
  );
}

function AwayStage({ routeBias, onAdvance }: { routeBias: string | null; onAdvance: () => void }) {
  return (
    <div className="outing-empty-stage outing-away-stage">
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
        <button onClick={onAdvance} type="button">DEMO · 让时间往后走</button>
      </div>
    </div>
  );
}

function ReturnedStage({ onArchive }: { onArchive: () => void }) {
  const artifact = DEMO_FIXTURE.outing.returnArtifact;
  return (
    <div className="returned-stage">
      <div className="returned-copy">
        <p className="stage-caption">LIGHTS UP / RETURNED</p>
        <span>门响了一下。</span>
        <h1>它回来了。</h1>
        <p>而且好像有话要说。</p>
      </div>
      <PaperCard className="returned-artifact">
        <span>{artifact.label}</span>
        <h2>{artifact.topic.title}</h2>
        <p>今天去了：{artifact.places.join(" / ")}</p>
        <blockquote>“{artifact.thought}”</blockquote>
        <div className="returned-meta">
          <span>同行者 <b>{artifact.companion}</b></span>
          <span>关系变化 <b>{artifact.relationshipDelta}</b></span>
        </div>
        <button className="theatre-button theatre-button-primary" onClick={onArchive} type="button">收进图鉴 <span>→</span></button>
      </PaperCard>
    </div>
  );
}
