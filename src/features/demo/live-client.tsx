"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AnswerExperience } from "@/lib/experience";

import { DEMO_STAGE_STORAGE_KEY, advanceActivationStage, isDemoActivationStage } from "./activation";
import { DemoFlowButton, EvidenceList } from "./client";
import { PetStage } from "./components";
import { DEMO_FIXTURE } from "./fixtures";

export interface LivePersonaSnapshot {
  mode: AnswerExperience["mode"];
  generatedAt: number;
  composition: AnswerExperience["composition"];
  persona: AnswerExperience["persona"];
}

export interface LiveQuestionSnapshot {
  mode: AnswerExperience["mode"];
  generatedAt: number;
  question: AnswerExperience["question"];
  questions?: AnswerExperience["question"][];
}

export const LIVE_PERSONA_STORAGE_KEY = "xieya-live-persona";
export const LIVE_QUESTION_STORAGE_KEY = "xieya-live-question";
export const LIVE_EXPERIENCE_STORAGE_KEY = "xieya-live-experience";

export function useLivePersonaSnapshot() {
  const [snapshot, setSnapshot] = useState<LivePersonaSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = window.sessionStorage.getItem(LIVE_PERSONA_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as LivePersonaSnapshot;
        setSnapshot(parsed);
        if (Date.now() / 1000 - parsed.generatedAt < 300) {
          return () => {
            cancelled = true;
          };
        }
      } catch {
        window.sessionStorage.removeItem(LIVE_PERSONA_STORAGE_KEY);
      }
    }

    fetch("/api/persona", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("persona request failed");
        return (await response.json()) as LivePersonaSnapshot;
      })
      .then((next) => {
        if (cancelled) return;
        window.sessionStorage.setItem(LIVE_PERSONA_STORAGE_KEY, JSON.stringify(next));
        setSnapshot(next);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}

export function useLiveQuestionSnapshot() {
  const [snapshot, setSnapshot] = useState<LiveQuestionSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = window.sessionStorage.getItem(LIVE_QUESTION_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as LiveQuestionSnapshot;
        setSnapshot(parsed);
        if (Date.now() / 1000 - parsed.generatedAt < 300) {
          return () => {
            cancelled = true;
          };
        }
      } catch {
        window.sessionStorage.removeItem(LIVE_QUESTION_STORAGE_KEY);
      }
    }

    fetch("/api/discovery/question", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("question discovery failed");
        return (await response.json()) as LiveQuestionSnapshot;
      })
      .then((next) => {
        if (cancelled) return;
        window.sessionStorage.setItem(LIVE_QUESTION_STORAGE_KEY, JSON.stringify(next));
        setSnapshot(next);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}

function persistActivation(stage: "HATCH_REVEAL") {
  const stored = window.localStorage.getItem(DEMO_STAGE_STORAGE_KEY);
  const current = isDemoActivationStage(stored) ? stored : "PROFILE_SCANNING";
  window.localStorage.setItem(DEMO_STAGE_STORAGE_KEY, advanceActivationStage(current, stage));
}

function scanRows(snapshot: LivePersonaSnapshot | null) {
  if (!snapshot) {
    return [
      { key: "contents", question: "写过什么？", value: "读取公开创作", finding: "分析表达长度与结构" },
      { key: "followees", question: "关注谁？", value: "读取关注关系", finding: "分析长期兴趣方向" },
      { key: "collections", question: "收藏什么？", value: "读取公开收藏", finding: "分析长期保留的主题" },
    ];
  }

  const { composition } = snapshot;
  return [
    {
      key: "contents",
      question: "写过什么？",
      value: `${composition.sourceCounts.contents} 条公开创作 · ${composition.writingLength.toUpperCase()}`,
      finding: composition.writingLength === "long" ? "长期表达偏长答，结构信息密度较高" : "表达长度与节奏已经形成稳定偏好",
    },
    {
      key: "followees",
      question: "关注谁？",
      value: `${composition.primaryInterest} · ${composition.sourceCounts.followees} 个关注`,
      finding: `当前最稳定的兴趣方向是「${composition.primaryInterest}」`,
    },
    {
      key: "collections",
      question: "收藏什么？",
      value: `${composition.sourceCounts.collections} 条近期收藏 · ${composition.sourceCounts.favlists} 个收藏夹`,
      finding: `收藏倾向 ${composition.hoardingLevel}% · 用留下来的内容补全长期偏好`,
    },
  ];
}

export function LiveScanningFlow() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<LivePersonaSnapshot | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/persona", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("persona request failed");
        return (await response.json()) as LivePersonaSnapshot;
      })
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
        window.sessionStorage.setItem(LIVE_PERSONA_STORAGE_KEY, JSON.stringify(next));
        setDataReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setDataReady(true);
      });

    fetch("/api/discovery/question", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("question discovery failed");
        return (await response.json()) as LiveQuestionSnapshot;
      })
      .then((next) => {
        window.sessionStorage.setItem(LIVE_QUESTION_STORAGE_KEY, JSON.stringify(next));
      })
      .catch(() => {
        // A deterministic question fallback remains available if discovery fails.
      });

    fetch("/api/experience", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("experience request failed");
        return (await response.json()) as AnswerExperience;
      })
      .then((next) => {
        window.sessionStorage.setItem(LIVE_EXPERIENCE_STORAGE_KEY, JSON.stringify(next));
      })
      .catch(() => {
        // Full question/knowledge generation is prefetched for later scenes and does not block reveal.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => scanRows(snapshot), [snapshot]);

  useEffect(() => {
    if (!dataReady) return;
    const timers = rows.map((_, index) =>
      window.setTimeout(() => setCompleted(index + 1), 250 + index * 650),
    );
    const finish = window.setTimeout(() => {
      persistActivation("HATCH_REVEAL");
      router.replace("/hatch/reveal");
    }, 250 + rows.length * 650 + 900);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [dataReady, router, rows]);

  return (
    <div className="scan-cues" aria-live="polite">
      {rows.map((row, index) => {
        const state = !dataReady ? "loading" : index < completed ? "complete" : index === completed ? "loading" : "waiting";
        return (
          <article className={`scan-cue scan-cue--${state}`} key={row.key}>
            <span className="scan-cue-number">CUE {String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{row.question}</h2>
              <strong>{state === "complete" ? row.value : state === "loading" ? "READING…" : "WAIT"}</strong>
              <p>{state === "complete" ? `发现：${row.finding}` : state === "loading" ? "正在读取知乎公开数据…" : "等待上一项完成"}</p>
            </div>
          </article>
        );
      })}
      <p className={`scan-footnote ${error ? "is-fallback" : "is-live"}`}>
        {error || snapshot?.mode === "fallback" ? (
          <>上游暂时不可用 · 本轮使用备用人格数据</>
        ) : (
          <><CloudDoneOutlinedIcon fontSize="inherit" /> 知乎公开数据已读取 · 正在拼出你的社交气味</>
        )}
      </p>
    </div>
  );
}

function buildLiveHighlights(snapshot: LivePersonaSnapshot) {
  const { composition } = snapshot;
  const topInterest = composition.interests[0];
  return [
    {
      label: "主兴趣",
      value: `${composition.primaryInterest}${topInterest ? ` ${Math.round(topInterest.score * 100)}%` : ""}`,
      explanation: `由公开创作、关注与收藏主题共同聚合。当前样本：创作 ${composition.sourceCounts.contents}、关注 ${composition.sourceCounts.followees}、近期收藏 ${composition.sourceCounts.collections}。`,
    },
    {
      label: "表达方式",
      value: composition.writingLength === "long" ? "高密度长答" : composition.writingLength === "short" ? "短句直给" : "中等篇幅",
      explanation: "由公开创作的长度与结构特征映射，不直接复述任何一条原始内容。",
    },
    {
      label: "收藏倾向",
      value: `${composition.hoardingLevel}%`,
      explanation: `结合近期收藏和 ${composition.sourceCounts.favlists} 个公开收藏夹得到的趣味属性。`,
    },
    {
      label: "活跃节奏",
      value: composition.chronotype,
      explanation: "根据公开内容的时间分布做轻量映射，只作为人格彩蛋，不作为事实判断。",
    },
  ];
}

export function LiveRevealPanel() {
  const [snapshot, setSnapshot] = useState<LivePersonaSnapshot | null>(null);

  useEffect(() => {
    const raw =
      window.sessionStorage.getItem(LIVE_PERSONA_STORAGE_KEY) ??
      window.sessionStorage.getItem(LIVE_EXPERIENCE_STORAGE_KEY);
    if (!raw) return;
    try {
      setSnapshot(JSON.parse(raw) as LivePersonaSnapshot);
    } catch {
      window.sessionStorage.removeItem(LIVE_PERSONA_STORAGE_KEY);
    }
  }, []);

  const fallback = DEMO_FIXTURE.persona;
  const species = snapshot?.persona.species ?? fallback.species;
  const personaTitle = snapshot?.persona.certifiedTitle ?? fallback.title;
  const catchphrase = snapshot?.persona.catchphrase ?? fallback.catchphrase;
  const descriptor = snapshot?.persona.personality[0] ?? fallback.archetype;
  const secondary = snapshot?.composition.primaryInterest ?? fallback.archetype;
  const highlights = snapshot ? buildLiveHighlights(snapshot) : fallback.highlights;
  const live = snapshot?.mode === "live";

  return (
    <section className="reveal-layout">
      <div className="reveal-title-block">
        <p className="stage-caption">“{descriptor}。”</p>
        <h1>{species}</h1>
        <h2>{secondary} <span>ZHIHU PERSONA</span></h2>
        <h3>{personaTitle}</h3>
        <span className={`live-data-mark ${live ? "is-live" : "is-fallback"}`}>
          <CheckCircleOutlineRoundedIcon fontSize="inherit" /> {live ? "来自知乎公开数据" : "备用人格数据"}
        </span>
      </div>

      <div className="reveal-main">
        <PetStage
          name="本喵"
          species={`${species} · ${secondary}`}
          slot="persona/reveal-main"
        />
        <blockquote>“{catchphrase}”</blockquote>
      </div>

      <div className="reveal-evidence">
        <EvidenceList items={highlights} />
      </div>

      <p className="reveal-manifesto">你留下的问题和答案，正在变成它理解世界的方式。</p>

      <div className="reveal-action">
        <DemoFlowButton href="/encounter/first?phase=match" stage="FIRST_MATCH_READY">带它出去闻闻</DemoFlowButton>
      </div>
    </section>
  );
}
