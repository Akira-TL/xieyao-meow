"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  DEMO_STAGE_STORAGE_KEY,
  advanceActivationStage,
  isDemoActivationStage,
  resolveRequestedDemoPath,
  type DemoActivationStage,
} from "./activation";
import { DEMO_FIXTURE } from "./fixtures";
import { DEMO_OUTING_STORAGE_KEY } from "./outing";

function currentStage(): DemoActivationStage {
  if (typeof window === "undefined") return "VISITOR";
  const stored = window.localStorage.getItem(DEMO_STAGE_STORAGE_KEY);
  return isDemoActivationStage(stored) ? stored : "VISITOR";
}

function persistStage(stage: DemoActivationStage) {
  window.localStorage.setItem(DEMO_STAGE_STORAGE_KEY, stage);
}

export function LandingActions() {
  const [stage, setStage] = useState<DemoActivationStage>("VISITOR");

  useEffect(() => {
    setStage(currentStage());
  }, []);

  if (stage === "ACTIVATED") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <DemoFlowButton href="/home">回我的窝</DemoFlowButton>
        <DemoFlowButton href="/explore?mode=app" variant="secondary">
          看看它今天叼了什么
        </DemoFlowButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <DemoFlowButton href="/hatch/consent" stage="PRE_AUTH">开幕</DemoFlowButton>
      <DemoFlowButton href="/explore?mode=public" variant="secondary">先看看这个世界</DemoFlowButton>
    </div>
  );
}

export function DemoFlowButton({
  href,
  stage,
  children,
  variant = "primary",
}: {
  href: string;
  stage?: DemoActivationStage;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();

  function go() {
    if (stage) {
      persistStage(advanceActivationStage(currentStage(), stage));
    }
    router.push(href);
  }

  return (
    <button
      className={`theatre-button ${variant === "primary" ? "theatre-button-primary" : "theatre-button-secondary"}`}
      onClick={go}
      type="button"
    >
      {children}<span aria-hidden="true">→</span>
    </button>
  );
}

export function DemoRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const requested = `${window.location.pathname}${window.location.search}`;
    const query = new URLSearchParams(window.location.search);
    if (window.location.pathname === "/hatch/scanning" && query.get("oauth") === "connected") {
      persistStage(advanceActivationStage(currentStage(), "PROFILE_SCANNING"));
    }
    const redirect = resolveRequestedDemoPath(currentStage(), requested);
    if (redirect && redirect !== requested) {
      router.replace(redirect);
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-zinc-600">
        正在恢复这只喵的状态……
      </div>
    );
  }

  return children;
}

export function ResetDemoButton() {
  const router = useRouter();

  return (
    <button
      className="text-xs text-zinc-600 transition hover:text-zinc-300"
      onClick={() => {
        window.localStorage.removeItem(DEMO_STAGE_STORAGE_KEY);
        window.localStorage.removeItem(DEMO_OUTING_STORAGE_KEY);
        router.push("/");
      }}
      type="button"
    >
      重置演示
    </button>
  );
}

export function DemoScanningFlow() {
  const router = useRouter();
  const sources = DEMO_FIXTURE.scan.sources;
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const timers = sources.map((_, index) =>
      window.setTimeout(() => setCompleted(index + 1), 650 + index * 700),
    );
    const finish = window.setTimeout(() => {
      persistStage(advanceActivationStage(currentStage(), "HATCH_REVEAL"));
      router.replace("/hatch/reveal");
    }, 650 + sources.length * 700 + 900);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [router, sources]);

  const rows = useMemo(
    () =>
      sources.map((source, index) => ({
        ...source,
        state: index < completed ? "complete" : index === completed ? "loading" : "waiting",
      })),
    [completed, sources],
  );

  return (
    <div className="scan-cues" aria-live="polite">
      {rows.map((source, index) => (
        <article className={`scan-cue scan-cue--${source.state}`} key={source.key}>
          <span className="scan-cue-number">CUE {String(index + 1).padStart(2, "0")}</span>
          <div>
            <h2>{source.label === "公开创作" ? "写过什么？" : source.label === "关注" ? "关注谁？" : "收藏什么？"}</h2>
            <strong>
              {source.state === "complete"
                ? source.label === "公开创作"
                  ? "LONG FORM 81%"
                  : source.label === "关注"
                    ? "TECH CLUSTER HIGH"
                    : "AI / SCIENCE / TOOLS"
                : source.state === "loading"
                  ? "READING…"
                  : "WAIT"}
            </strong>
            <p>
              {source.state === "complete"
                ? `发现：${source.finding}`
                : source.state === "loading"
                  ? "正在读取知乎成分……"
                  : "等待上一项完成"}
            </p>
          </div>
        </article>
      ))}
      <p className="scan-footnote">正在拼出你的社交气味…</p>
    </div>
  );
}

export function EvidenceList({
  items,
}: {
  items: readonly { label: string; value: string; explanation: string }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div className="evidence-card" key={item.label}>
          <button onClick={() => setOpen(open === item.label ? null : item.label)} type="button">
            <span>
              <span className="evidence-label">{item.label}</span>
              <span className="evidence-value">{item.value}</span>
            </span>
            <span className="evidence-why">WHY?</span>
          </button>
          {open === item.label ? <p>{item.explanation}</p> : null}
        </div>
      ))}
    </div>
  );
}
