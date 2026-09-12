"use client";

import { useEffect, useState } from "react";

import { GrowthStrip, PetStage } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
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
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [outing.state, ready]);

  if (!ready) {
    return <div className="grid min-h-[28rem] place-items-center text-sm text-zinc-600">正在看它在不在家……</div>;
  }

  if (outing.state === "PREPARING") {
    return <PreparingStage routeBias={outing.routeBias} />;
  }
  if (outing.state === "AWAY") {
    return (
      <AwayStage
        routeBias={outing.routeBias}
        onAdvance={() => setOuting((current) => advanceDemoOuting(current, { type: "return" }))}
      />
    );
  }
  if (outing.state === "RETURNED") {
    return (
      <ReturnedStage
        onArchive={() => setOuting((current) => advanceDemoOuting(current, { type: "archive" }))}
      />
    );
  }

  return (
    <AtHomeStage
      onPrepare={(routeBias) =>
        setOuting((current) => advanceDemoOuting(current, { type: "prepare", routeBias }))
      }
    />
  );
}

function AtHomeStage({ onPrepare }: { onPrepare: (routeBias: string) => void }) {
  const fixture = DEMO_FIXTURE;
  return (
    <div>
      <div className="relative overflow-hidden border border-zinc-800 bg-black/30 px-5 py-10 text-center">
        <p className="absolute left-4 top-3 text-[10px] tracking-[0.18em] text-zinc-700">ACT / AT HOME</p>
        <PetStage
          name="本喵"
          species={`${fixture.persona.species} · ${fixture.persona.archetype}`}
          title={fixture.persona.title}
        />
        <p className="mt-4 text-sm text-zinc-500">它今天还没决定去哪。</p>
      </div>

      <div className="mt-6">
        <p className="meta-label">留张出门纸条</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">你只能影响方向，不能指定它最终看什么、遇见谁。</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {fixture.outing.routeBiases.map((bias) => (
            <button
              className="border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-amber-300/30 hover:text-amber-100"
              key={bias}
              onClick={() => onPrepare(bias)}
              type="button"
            >
              {bias}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-5">
        <p className="meta-label">上次带回</p>
        <p className="mt-2 text-sm text-zinc-300">{fixture.outing.journeyLog[0].label}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-600">{fixture.outing.journeyLog[0].summary}</p>
      </div>

      <div className="mt-5">
        <GrowthStrip
          knowledge={fixture.home.growth.knowledge}
          expression={fixture.home.growth.expression}
          social={fixture.home.growth.social}
        />
      </div>
    </div>
  );
}

function PreparingStage({ routeBias }: { routeBias: string | null }) {
  return (
    <div className="grid min-h-[30rem] place-items-center border border-zinc-800 bg-black/30 px-6 text-center">
      <div>
        <p className="text-[10px] tracking-[0.24em] text-zinc-700">BACKSTAGE / PREPARING</p>
        <p className="mt-7 text-4xl font-semibold tracking-[-0.05em] text-zinc-100">它在后台收东西。</p>
        <p className="mt-5 text-sm text-zinc-500">今天的纸条：</p>
        <p className="mt-2 text-xl text-amber-100">「{routeBias ?? "随便逛"}」</p>
        <p className="mt-8 text-xs text-zinc-700">看见了。至于听不听，是它的事。</p>
      </div>
    </div>
  );
}

function AwayStage({ routeBias, onAdvance }: { routeBias: string | null; onAdvance: () => void }) {
  return (
    <div>
      <div className="relative grid min-h-[30rem] place-items-center overflow-hidden border border-zinc-800 bg-black/40 px-6 text-center">
        <div className="absolute inset-x-10 bottom-20 h-px bg-zinc-900" aria-hidden="true" />
        <div>
          <p className="text-[10px] tracking-[0.24em] text-zinc-700">ACT / AWAY</p>
          <h1 className="mt-8 text-5xl font-semibold tracking-[-0.06em] text-zinc-200">它不在。</h1>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-6 text-zinc-600">大概又跑去看别人为什么吵架了。</p>
          <div className="mx-auto mt-10 max-w-sm border border-zinc-800 bg-zinc-950/80 p-4 text-left">
            <p className="text-[10px] text-zinc-700">桌上压着一张纸</p>
            <p className="mt-2 text-sm text-zinc-400">“{DEMO_FIXTURE.outing.note}”</p>
            <p className="mt-3 text-xs text-zinc-700">你留的方向：{routeBias ?? "随便逛"}</p>
          </div>
          <p className="mt-6 text-xs text-zinc-700">状态：{DEMO_FIXTURE.outing.awayStatus}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <a className="text-xs text-zinc-600 hover:text-zinc-300" href="/explore?mode=app">看看它上次带回来的东西 →</a>
        <button className="text-[10px] text-zinc-800 hover:text-zinc-500" onClick={onAdvance} type="button">
          DEMO · 让时间往后走
        </button>
      </div>
    </div>
  );
}

function ReturnedStage({ onArchive }: { onArchive: () => void }) {
  const artifact = DEMO_FIXTURE.outing.returnArtifact;
  return (
    <div>
      <div className="border border-zinc-800 bg-black/30 px-5 py-8 text-center">
        <p className="text-[10px] tracking-[0.24em] text-zinc-700">LIGHTS UP / RETURNED</p>
        <p className="mt-7 text-sm text-zinc-600">门响了一下。</p>
        <h1 className="mt-2 text-5xl font-semibold tracking-[-0.06em] text-zinc-100">它回来了。</h1>
        <p className="mt-3 text-sm text-zinc-500">而且好像有话要说。</p>
      </div>

      <article className="mt-5 border border-amber-300/20 bg-amber-300/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] tracking-[0.16em] text-amber-100/60">{artifact.label}</p>
          <p className="text-[10px] text-zinc-700">provenance={artifact.provenance}</p>
        </div>
        <p className="mt-5 text-xs text-zinc-600">今天去了：{artifact.places.join(" / ")}</p>
        <a className="mt-3 block text-lg font-medium leading-7 text-zinc-100 hover:text-amber-100" href={artifact.topic.url} rel="noreferrer" target="_blank">
          {artifact.topic.title} ↗
        </a>
        <blockquote className="mt-5 border-l border-amber-300/30 pl-4 text-base leading-7 text-zinc-300">“{artifact.thought}”</blockquote>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div className="border border-zinc-800 p-3"><span className="text-zinc-700">同行者</span><p className="mt-1 text-zinc-300">{artifact.companion}</p></div>
          <div className="border border-zinc-800 p-3"><span className="text-zinc-700">关系变化</span><p className="mt-1 text-zinc-300">{artifact.relationshipDelta}</p></div>
        </div>
      </article>

      <button className="mt-5 min-h-12 w-full bg-amber-300 px-5 text-sm font-semibold text-zinc-950 hover:bg-amber-200" onClick={onArchive} type="button">
        收进图鉴
      </button>
    </div>
  );
}
