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
      <DemoFlowButton href="/hatch/consent" stage="PRE_AUTH">
        看看我养出了什么
      </DemoFlowButton>
      <DemoFlowButton href="/explore?mode=public" variant="secondary">
        先逛逛别人养出的东西
      </DemoFlowButton>
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
      className={
        variant === "primary"
          ? "min-h-12 bg-amber-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
          : "min-h-11 border border-zinc-800 px-4 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
      }
      onClick={go}
      type="button"
    >
      {children}
    </button>
  );
}

export function DemoRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const requested = `${window.location.pathname}${window.location.search}`;
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
    <div className="space-y-3">
      {rows.map((source) => (
        <div className="border border-zinc-800 bg-black/20 p-4" key={source.key}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-300">{source.label}</span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
              {source.state === "complete" ? "DONE" : source.state === "loading" ? "READING" : "WAIT"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {source.state === "complete"
              ? source.finding
              : source.state === "loading"
                ? "正在读取演示快照……"
                : "等待上一项完成"}
          </p>
        </div>
      ))}
      <p className="pt-2 text-center text-xs text-zinc-600">所有“发现”均来自 DEMO fixture，不代表你的真实知乎数据。</p>
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
        <div className="border border-zinc-800 bg-black/20" key={item.label}>
          <button
            className="flex w-full items-center justify-between gap-3 p-3 text-left"
            onClick={() => setOpen(open === item.label ? null : item.label)}
            type="button"
          >
            <span>
              <span className="block text-[10px] text-zinc-600">{item.label}</span>
              <span className="mt-1 block text-sm text-zinc-200">{item.value}</span>
            </span>
            <span className="text-xs text-amber-200/70">为什么？</span>
          </button>
          {open === item.label ? (
            <p className="border-t border-zinc-800 px-3 py-3 text-xs leading-5 text-zinc-500">
              {item.explanation}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
