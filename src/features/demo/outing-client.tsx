"use client";

import { useEffect, useState } from "react";

import { ArtSlot, GrowthStrip, PaperCard } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
import { BottomSheet } from "./interaction-client";
import {
  type LivePersonaSnapshot,
  type LiveQuestionSnapshot,
  useLivePersonaSnapshot,
  useLiveQuestionSnapshot,
} from "./live-client";
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
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();

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

  useEffect(() => {
    if (!ready || outing.state !== "AWAY") return;
    const timer = window.setTimeout(() => {
      setOuting((current) => advanceDemoOuting(current, { type: "return" }));
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [outing.state, ready]);

  if (!ready) {
    return <div className="outing-loading">正在看它在不在家……</div>;
  }
  if (outing.state === "PREPARING") return <PreparingStage routeBias={outing.routeBias} />;
  if (outing.state === "AWAY") return <AwayStage routeBias={outing.routeBias} />;
  if (outing.state === "RETURNED") {
    return (
      <ReturnedStage
        personaSnapshot={personaSnapshot}
        questionSnapshot={questionSnapshot}
        onArchive={() => setOuting((current) => advanceDemoOuting(current, { type: "archive" }))}
      />
    );
  }

  return (
    <AtHomeStage
      personaSnapshot={personaSnapshot}
      questionSnapshot={questionSnapshot}
      onPrepare={(routeBias) => setOuting((current) => advanceDemoOuting(current, { type: "prepare", routeBias }))}
    />
  );
}

function AtHomeStage({
  onPrepare,
  personaSnapshot,
  questionSnapshot,
}: {
  onPrepare: (routeBias: string) => void;
  personaSnapshot: LivePersonaSnapshot | null;
  questionSnapshot: LiveQuestionSnapshot | null;
}) {
  const fixture = DEMO_FIXTURE;
  const question = questionSnapshot?.question ?? {
    title: fixture.encounter.topic.title,
    url: fixture.encounter.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const composition = personaSnapshot?.composition;
  const growth = {
    knowledge: Math.max(1, Math.min(5, composition?.interests.length ?? fixture.home.growth.knowledge)),
    expression: Math.max(1, Math.min(5, Math.ceil((composition?.sourceCounts.contents ?? 10) / 12))),
    social: Math.max(1, Math.min(5, Math.ceil((composition?.sourceCounts.followees ?? 12) / 12))),
  };
  return (
    <div className="home-at-home">
      <div className="home-hero-copy">
        <p className="stage-caption">ACT / AT HOME · 昨晚发生了一点事</p>
        <h1>昨晚，<br /><span>齿轮</span>来过。</h1>
        <p>它和齿轮围着一个真实知乎问题聊了很久：「{question.title}」不同的表达方式，把同一个问题照出了不同侧面。</p>
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
        <GrowthStrip knowledge={growth.knowledge} expression={growth.expression} social={growth.social} />
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

function AwayStage({ routeBias }: { routeBias: string | null }) {
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
        <span>不用催，它逛够了会自己回来。</span>
      </div>
    </div>
  );
}

function ReturnedStage({
  onArchive,
  personaSnapshot,
  questionSnapshot,
}: {
  onArchive: () => void;
  personaSnapshot: LivePersonaSnapshot | null;
  questionSnapshot: LiveQuestionSnapshot | null;
}) {
  const artifact = DEMO_FIXTURE.outing.returnArtifact;
  const question = questionSnapshot?.question ?? {
    title: artifact.topic.title,
    url: artifact.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const interests = personaSnapshot?.persona.interests.slice(0, 2) ?? artifact.places;
  const thought = question.summary?.trim()
    ? `${question.summary.replace(/\s+/g, " ").trim().slice(0, 72)}${question.summary.length > 72 ? "…" : ""}`
    : "这题不一定和你最像，但值得带回来多问一步。";
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
        <h2>{question.title}</h2>
        <p>今天去了：{interests.join(" / ")}</p>
        <blockquote>“{thought}”</blockquote>
        <div className="returned-meta">
          <span>同行者 <b>{artifact.companion}</b></span>
          <span>关系变化 <b>{artifact.relationshipDelta}</b></span>
        </div>
        <button className="theatre-button theatre-button-primary" onClick={onArchive} type="button">收进图鉴 <span>→</span></button>
      </PaperCard>
    </div>
  );
}
