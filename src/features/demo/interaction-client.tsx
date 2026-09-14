"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { AnswerExperience } from "@/lib/experience";
import type {
  PersonaExperienceMemory,
  SocialDialogueRound,
  SocialDialogueTurn,
  SocialEvent,
  SocialMatchInsight,
} from "@/lib/social";

import {
  DEMO_STAGE_STORAGE_KEY,
  advanceActivationStage,
  isDemoActivationStage,
  type DemoActivationStage,
} from "./activation";
import { PersonaArt, ResidentArt } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
import {
  LIVE_EXPERIENCE_STORAGE_KEY,
  LIVE_PERSONA_STORAGE_KEY,
  LIVE_QUESTION_STORAGE_KEY,
  type LivePersonaSnapshot,
  type LiveQuestionSnapshot,
} from "./live-client";

const SELECTED_RESIDENT_STORAGE_KEY = "xieya-selected-resident";
const SOCIAL_EVENT_STORAGE_KEY = "xieya-social-event";
const PERSONA_EXPERIENCE_MEMORY_STORAGE_KEY = "xieya-persona-experience-memory-v1";

const EMPTY_PERSONA_EXPERIENCE_MEMORY: PersonaExperienceMemory = {
  encounterCount: 0,
  recentTopics: [],
  recentResidents: [],
  notes: [],
};

function loadPersonaExperienceMemory(): PersonaExperienceMemory {
  const raw = window.localStorage.getItem(PERSONA_EXPERIENCE_MEMORY_STORAGE_KEY);
  if (!raw) return EMPTY_PERSONA_EXPERIENCE_MEMORY;
  try {
    const parsed = JSON.parse(raw) as Partial<PersonaExperienceMemory>;
    return {
      encounterCount: typeof parsed.encounterCount === "number" ? Math.max(0, Math.floor(parsed.encounterCount)) : 0,
      recentTopics: Array.isArray(parsed.recentTopics) ? parsed.recentTopics.filter((item): item is string => typeof item === "string").slice(0, 6) : [],
      recentResidents: Array.isArray(parsed.recentResidents) ? parsed.recentResidents.filter((item): item is string => typeof item === "string").slice(0, 6) : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter((item): item is string => typeof item === "string").slice(0, 8) : [],
    };
  } catch {
    window.localStorage.removeItem(PERSONA_EXPERIENCE_MEMORY_STORAGE_KEY);
    return EMPTY_PERSONA_EXPERIENCE_MEMORY;
  }
}

function evolvePersonaExperienceMemory(
  current: PersonaExperienceMemory,
  topic: string,
  resident: string,
  note: string,
  completed: boolean,
): PersonaExperienceMemory {
  const uniqueFront = (value: string, values: string[], limit: number) =>
    [value, ...values.filter((item) => item !== value)].slice(0, limit);
  return {
    encounterCount: current.encounterCount + (completed ? 1 : 0),
    recentTopics: uniqueFront(topic, current.recentTopics, 6),
    recentResidents: uniqueFront(resident, current.recentResidents, 6),
    notes: uniqueFront(note, current.notes, 8),
  };
}

function advanceStage(requested: DemoActivationStage) {
  const stored = window.localStorage.getItem(DEMO_STAGE_STORAGE_KEY);
  const current = isDemoActivationStage(stored) ? stored : "VISITOR";
  window.localStorage.setItem(DEMO_STAGE_STORAGE_KEY, advanceActivationStage(current, requested));
}

function useLiveExperience() {
  const [experience, setExperience] = useState<AnswerExperience | null>(null);

  useEffect(() => {
    let cancelled = false;
    const raw = window.sessionStorage.getItem(LIVE_EXPERIENCE_STORAGE_KEY);
    if (raw) {
      try {
        setExperience(JSON.parse(raw) as AnswerExperience);
        return () => {
          cancelled = true;
        };
      } catch {
        window.sessionStorage.removeItem(LIVE_EXPERIENCE_STORAGE_KEY);
      }
    }

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
        if (cancelled) return;
        window.sessionStorage.setItem(LIVE_EXPERIENCE_STORAGE_KEY, JSON.stringify(next));
        setExperience(next);
      })
      .catch(() => {
        // Later scenes can keep the deterministic fallback if the live experience is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return experience;
}

function usePersonaSnapshot() {
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

  return snapshot;
}

function useQuestionSnapshot() {
  const [snapshot, setSnapshot] = useState<LiveQuestionSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const raw = window.sessionStorage.getItem(LIVE_QUESTION_STORAGE_KEY);
    if (raw) {
      try {
        setSnapshot(JSON.parse(raw) as LiveQuestionSnapshot);
        return () => {
          cancelled = true;
        };
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
      .catch(() => {
        // Encounter keeps the deterministic fallback if discovery is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}

interface ZhihuOAuthStatus {
  oauthConfigured: boolean;
  oauthPartiallyConfigured: boolean;
  connected: boolean;
  developmentIdentityAvailable: boolean;
  demoIdentityAvailable: boolean;
  callbackRequiresPublicHttps: boolean;
  protocolNote: string;
}

export function ZhihuConsentActions() {
  const router = useRouter();
  const developmentBypass = process.env.NODE_ENV === "development";
  const [status, setStatus] = useState<ZhihuOAuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (developmentBypass) return;

    let cancelled = false;
    fetch("/api/auth/zhihu/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("无法读取知乎登录状态");
        return (await response.json()) as ZhihuOAuthStatus;
      })
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "无法读取知乎登录状态");
      });
    return () => {
      cancelled = true;
    };
  }, [developmentBypass]);

  if (developmentBypass) {
    return (
      <div className="oauth-actions">
        <a
          className="theatre-button theatre-button-primary"
          href="/hatch/scanning"
          onClick={() => advanceStage("PROFILE_SCANNING")}
        >
          <VerifiedUserOutlinedIcon fontSize="small" /> 开发模式：直接孵化 <ArrowForwardRoundedIcon fontSize="small" />
        </a>
        <p className="oauth-inline-note">仅本地开发环境跳过注册 / OAuth，方便连续验收后续页面；生产环境仍走正式知乎授权。</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="oauth-actions">
        <button className="theatre-button theatre-button-primary" disabled type="button">
          <LoginRoundedIcon fontSize="small" /> 正在检查知乎登录…
        </button>
        {error ? <p className="oauth-inline-note is-error">{error}</p> : null}
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="oauth-actions">
        <button
          className="theatre-button theatre-button-primary"
          onClick={() => {
            advanceStage("PROFILE_SCANNING");
            router.push("/hatch/scanning");
          }}
          type="button"
        >
          <VerifiedUserOutlinedIcon fontSize="small" /> 已连接知乎，继续孵化 <ArrowForwardRoundedIcon fontSize="small" />
        </button>
      </div>
    );
  }

  if (status.oauthConfigured) {
    return (
      <div className="oauth-actions">
        <a className="theatre-button theatre-button-primary" href="/api/auth/zhihu/start">
          <LoginRoundedIcon fontSize="small" /> 登录知乎并授权 <ArrowForwardRoundedIcon fontSize="small" />
        </a>
        <p className="oauth-inline-note">将跳转到知乎官方授权页；完成授权后自动回到谢邀喵继续孵化。</p>
      </div>
    );
  }

  if (status.developmentIdentityAvailable || status.demoIdentityAvailable) {
    const publicDemo = status.demoIdentityAvailable && !status.developmentIdentityAvailable;
    return (
      <div className="oauth-actions">
        <button
          className="theatre-button theatre-button-primary"
          onClick={() => {
            advanceStage("PROFILE_SCANNING");
            router.push(publicDemo ? "/hatch/scanning?identity=demo" : "/hatch/scanning?identity=developer");
          }}
          type="button"
        >
          <VerifiedUserOutlinedIcon fontSize="small" /> {publicDemo ? "先用公开数据孵化一只" : "用当前知乎开发账号继续"} <ArrowForwardRoundedIcon fontSize="small" />
        </button>
        <p className="oauth-inline-note">
          {publicDemo
            ? "知乎正式授权正在接入；试玩会使用项目测试账号的公开知乎内容，完整体验人格孵化流程。"
            : "本地会读取当前开发账号的真实公开数据；正式 OAuth 凭证与公网回调配置完成后，同一位置切换为知乎官方登录。"}
        </p>
      </div>
    );
  }

  return (
    <div className="oauth-actions">
      <button className="theatre-button theatre-button-primary" disabled type="button">
        <LoginRoundedIcon fontSize="small" /> 知乎登录尚未配置
      </button>
      <p className="oauth-inline-note is-error">需要先配置知乎 OAuth 应用与平台登记的公网 HTTPS 回调地址。</p>
    </div>
  );
}

export function BottomSheet({
  trigger,
  title,
  children,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className="sheet-trigger" onClick={() => setOpen(true)} type="button">
        {trigger}
      </button>
      {open ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            aria-label={title}
            aria-modal="true"
            className="responsive-sheet"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="sheet-header">
              <h2>{title}</h2>
              <button aria-label="关闭" onClick={() => setOpen(false)} type="button">×</button>
            </div>
            <div className="sheet-body">{children}</div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function FirstMatchInteraction() {
  const router = useRouter();
  const snapshot = usePersonaSnapshot();
  const candidates = useMemo(() => DEMO_FIXTURE.residents, []);
  const [index, setIndex] = useState(0);
  const [matchInsight, setMatchInsight] = useState<SocialMatchInsight | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const candidate = candidates[index % candidates.length];
  const selfPersona = snapshot?.persona;
  const playerPersona = selfPersona ?? DEMO_FIXTURE.persona;
  const selfInterests = selfPersona?.interests ?? DEMO_FIXTURE.persona.interests;
  const candidateInterestSet = new Set<string>(candidate.interests);
  const sharedInterests = selfInterests.filter((interest: string) => candidateInterestSet.has(interest));
  const score = matchInsight?.score;
  const selfStyle = snapshot?.composition.writingLength === "long"
    ? "长答工程脑"
    : snapshot?.composition.writingLength === "short"
      ? "短句直给型"
      : "结构化表达型";
  const primaryInterest = snapshot?.composition.primaryInterest ?? DEMO_FIXTURE.persona.archetype;
  const prediction = matchInsight?.prediction ?? (matchLoading ? "正在比较两种思考方式…" : "匹配结果暂时不可用");
  const bridge = matchInsight?.bridge ?? (matchLoading ? "寻找连接点…" : candidate.interests[0]);

  useEffect(() => {
    let cancelled = false;
    setMatchInsight(null);
    setMatchLoading(true);
    fetch("/api/community/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ residentId: candidate.id }),
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("match request failed");
        return (await response.json()) as SocialMatchInsight;
      })
      .then((next) => {
        if (!cancelled) setMatchInsight(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setMatchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [candidate.id]);

  return (
    <div className="first-match-shell">
      <p className="stage-caption">SCENE 05 · 两个不同的思考方式，也许能走得很远</p>
      <h1 className="match-title">第一次<span>相遇</span></h1>
      <p className="match-handwriting">不同，才更有意思。</p>

      <div className="match-stage-grid">
        <div className="match-persona">
          <PersonaArt alt="本喵第一次遇见候选 Persona" className="match-self-persona-art" persona={playerPersona} state="thinking" />
          <strong>{selfPersona?.certifiedTitle ?? DEMO_FIXTURE.persona.title}</strong>
          <span>{selfStyle}</span>
          <q>{selfPersona?.catchphrase ?? DEMO_FIXTURE.persona.catchphrase}</q>
        </div>
        <div className="match-score-block">
          <span>谢邀喵匹配度</span>
          <strong>{score === undefined ? "…" : `${score}%`}</strong>
          <div className="match-common-grid">
            <div><b>共同兴趣</b><em>{sharedInterests[0] ?? primaryInterest}</em><small>你的长期偏好</small></div>
            <i>♥</i>
            <div><b>连接话题</b><em>{bridge}</em><small>{matchInsight?.mode === "zhida" ? "知乎直答找到的连接点" : "决定第一场对手戏"}</small></div>
          </div>
        </div>
        <div className="match-persona">
          <ResidentArt
            alt={`${candidate.displayName} · ${candidate.species}`}
            className="match-resident-art"
            priority
            residentId={candidate.id}
            state="meeting"
          />
          <strong>{candidate.displayName}</strong>
          <span>{candidate.title}</span>
          <q>{candidate.catchphrase}</q>
        </div>
      </div>

      <div className="match-contrast-row">
        <span>{selfStyle} <small>{primaryInterest} · {selfPersona?.answerStyle.tone ?? "理性玩梗"}</small></span>
        <b>↔</b>
        <span>{candidate.personality[0]} <small>{candidate.interests.join(" · ")}</small></span>
      </div>
      <p className="match-prediction">关系预测：{prediction}</p>
      <p className="match-reason">
        {matchLoading ? "正在比较两种思考方式…" : matchInsight?.reason ?? "先从共同兴趣和表达差异建立第一条连接。"}
        <span className={matchInsight?.mode === "zhida" ? "is-live" : ""}>
          {matchLoading ? "匹配中" : matchInsight?.sourceLabel ?? "匹配暂不可用"}
        </span>
      </p>

      <button
        className="theatre-button theatre-button-primary match-main-cta"
        onClick={() => {
          window.sessionStorage.setItem(SELECTED_RESIDENT_STORAGE_KEY, candidate.id);
          advanceStage("FIRST_ENCOUNTER");
          router.push("/encounter/first?phase=encounter");
        }}
        type="button"
      >
        让它们先聊两句 <span>→</span>
      </button>
      <button
        className="match-switch"
        onClick={() => setIndex((value) => (value + 1) % candidates.length)}
        type="button"
      >
        换一个候选 ↻
      </button>
    </div>
  );
}

export function EncounterPlayback() {
  const router = useRouter();
  const experience = useLiveExperience();
  const snapshot = usePersonaSnapshot();
  const questionSnapshot = useQuestionSnapshot();
  const [residentId, setResidentId] = useState<string>(DEMO_FIXTURE.match.candidate.id);
  const [ready, setReady] = useState(false);
  const [turns, setTurns] = useState<SocialDialogueTurn[]>([]);
  const [memory, setMemory] = useState<PersonaExperienceMemory>(EMPTY_PERSONA_EXPERIENCE_MEMORY);
  const [dialogueLoading, setDialogueLoading] = useState(false);
  const [dialogueDone, setDialogueDone] = useState(false);
  const [dialogueSource, setDialogueSource] = useState<string | null>(null);
  const [dialogueError, setDialogueError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [relationshipSettled, setRelationshipSettled] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SELECTED_RESIDENT_STORAGE_KEY);
    if (stored && DEMO_FIXTURE.residents.some((resident) => resident.id === stored)) {
      setResidentId(stored);
    }
    setMemory(loadPersonaExperienceMemory());
    setReady(true);
  }, []);

  const candidate = DEMO_FIXTURE.residents.find((resident) => resident.id === residentId) ?? DEMO_FIXTURE.residents[0];
  const liveTopic = experience?.question ?? questionSnapshot?.question ?? null;
  const topic = liveTopic ?? {
    ...DEMO_FIXTURE.encounter.topic,
    summary: "",
  };
  const selfPersona = snapshot?.persona ?? experience?.persona;
  const playerPersona = selfPersona ?? DEMO_FIXTURE.persona;
  const selfTitle = selfPersona?.certifiedTitle ?? DEMO_FIXTURE.persona.title;
  const selfDescriptor = selfPersona?.personality[0] ?? DEMO_FIXTURE.persona.archetype;

  useEffect(() => {
    if (!ready || !liveTopic || dialogueDone || dialogueLoading || turns.length >= 8 || turns.length % 2 !== 0) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDialogueLoading(true);
      setDialogueError(null);

      fetch("/api/community/dialogue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          residentId: candidate.id,
          topic: {
            title: liveTopic.title,
            url: liveTopic.url,
            summary: liveTopic.summary ?? "",
          },
          history: turns,
          memory,
        }),
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("dialogue request failed");
          return (await response.json()) as {
            round: SocialDialogueRound;
            personaMode: "live" | "fallback";
          };
        })
        .then(({ round }) => {
          if (cancelled) return;
          const nextMemory = evolvePersonaExperienceMemory(
            memory,
            liveTopic.title,
            candidate.displayName,
            round.memoryNote,
            round.shouldStop,
          );
          setTurns((current) => [...current, ...round.turns]);
          setMemory(nextMemory);
          window.localStorage.setItem(PERSONA_EXPERIENCE_MEMORY_STORAGE_KEY, JSON.stringify(nextMemory));
          setDialogueSource(round.sourceLabel);
          setDialogueDone(round.shouldStop);
        })
        .catch((error: unknown) => {
          if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
          setDialogueError("这轮接话断了一下。再让它们试一次。 ");
        })
        .finally(() => {
          if (!cancelled) setDialogueLoading(false);
        });
    }, turns.length === 0 ? 180 : 720);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [candidate.displayName, candidate.id, dialogueDone, liveTopic, memory, ready, retryKey, turns]);

  useEffect(() => {
    if (!dialogueDone || relationshipSettled) return;
    let cancelled = false;
    fetch("/api/community/interact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ residentId }),
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("community interaction failed");
        return (await response.json()) as { event: SocialEvent };
      })
      .then(({ event }) => {
        if (cancelled) return;
        window.sessionStorage.setItem(SOCIAL_EVENT_STORAGE_KEY, JSON.stringify(event));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setRelationshipSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [dialogueDone, relationshipSettled, residentId]);

  const roundCount = Math.ceil(turns.length / 2);
  const conversationStatus = !liveTopic
    ? "正在把今天的问题带进舞台…"
    : dialogueError
      ? dialogueError
      : dialogueDone
        ? `聊到第 ${roundCount} 轮，刚好停在这里。`
        : dialogueLoading
          ? roundCount === 0
            ? "两只 Persona 正在找第一句。"
            : `第 ${roundCount + 1} 轮，它们还在接话。`
          : "准备接下一句。";

  return (
    <div className="encounter-playback">
      <h1 className="encounter-headline">{topic.title}</h1>
      <p className="encounter-subtitle">同一个知乎问题，两种性格自己往下聊。</p>

      <div className="encounter-actors">
        <div className="encounter-actor">
          <PersonaArt alt="本喵正在和社区居民对话" className="encounter-playback-self-art" persona={playerPersona} state="talking" />
          <strong>{selfTitle}</strong>
          <span>{selfDescriptor} · {selfPersona?.answerStyle.tone ?? "理性玩梗"}</span>
        </div>
        <article className="encounter-topic-card">
          <span>知乎 · 真实问题</span>
          <h2>{topic.title}</h2>
          {topic.url ? <a href={topic.url} rel="noreferrer" target="_blank">查看原问题 ↗</a> : null}
        </article>
        <div className="encounter-actor">
          <ResidentArt
            alt={`${candidate.displayName} 正在和本喵对话`}
            className="encounter-resident-art"
            priority
            residentId={candidate.id}
            state="talking"
          />
          <strong>{candidate.displayName}</strong>
          <span>{candidate.personality[0]} · {candidate.answerStyle.tone}</span>
        </div>
      </div>

      <div className="encounter-chat" aria-live="polite">
        {turns.map((turn, index) => (
          <article
            className={`encounter-bubble ${turn.speaker === "other" ? "is-other" : "is-self"}`}
            key={`${turn.speaker}-${index}`}
            style={{ animationDelay: `${index % 2 === 0 ? 0 : 120}ms` }}
          >
            <div className="encounter-bubble-speaker">
              <strong>{turn.speaker === "other" ? candidate.displayName : "本喵"}</strong>
              <span>{turn.speaker === "other" ? candidate.personality[0] : selfDescriptor}</span>
            </div>
            <p>{turn.text}</p>
          </article>
        ))}
        {dialogueLoading ? (
          <div className="encounter-typing" role="status">
            <i /><i /><i />
            <span>{roundCount === 0 ? "找第一句" : "接下一轮"}</span>
          </div>
        ) : null}
      </div>

      <div className="encounter-dialogue-status">
        <span className={dialogueSource?.includes("知乎直答") ? "is-live" : ""}>
          {dialogueSource ?? "双 Persona 对话"}
        </span>
        <p>{conversationStatus}</p>
        {dialogueError ? (
          <button onClick={() => setRetryKey((value) => value + 1)} type="button">再接一次 ↻</button>
        ) : null}
      </div>

      <button
        className="theatre-button theatre-button-primary encounter-main-cta"
        disabled={!dialogueDone || !relationshipSettled}
        onClick={() => {
          advanceStage("ACTIVATED");
          router.push("/share/demo-match");
        }}
        type="button"
      >
        {!dialogueDone
          ? "它们还在聊…"
          : !relationshipSettled
            ? "关系落笔中…"
            : "收下这段关系"} <span>→</span>
      </button>
      <button className="match-switch" onClick={() => router.push("/encounter/first?phase=match")} type="button">
        再看一个
      </button>
    </div>
  );
}

export function ShareRelationshipVisual({ compact = false }: { compact?: boolean } = {}) {
  const snapshot = usePersonaSnapshot();
  const playerPersona = snapshot?.persona ?? DEMO_FIXTURE.persona;
  const [residentId, setResidentId] = useState<string>(DEMO_FIXTURE.match.candidate.id);
  const resident = DEMO_FIXTURE.residents.find((item) => item.id === residentId) ?? DEMO_FIXTURE.match.candidate;

  useEffect(() => {
    const storedResidentId = window.sessionStorage.getItem(SELECTED_RESIDENT_STORAGE_KEY);
    if (storedResidentId && DEMO_FIXTURE.residents.some((item) => item.id === storedResidentId)) {
      setResidentId(storedResidentId);
    }
  }, []);

  return (
    <div className={`share-live-visual ${compact ? "is-compact" : ""}`}>
      <PersonaArt alt="本喵完成第一次相遇" className="share-player-persona" persona={playerPersona} priority state="returned" />
      <span className="share-live-mark">×</span>
      <ResidentArt
        alt={`${resident.displayName} 与本喵的第一次关系纪念照`}
        className="share-resident-art"
        priority
        residentId={resident.id}
        state="meeting"
      />
    </div>
  );
}

export function ShareSceneButton() {
  const snapshot = usePersonaSnapshot();
  const [saved, setSaved] = useState(false);
  const [residentName, setResidentName] = useState<string>(DEMO_FIXTURE.match.candidate.displayName);
  const [relationship, setRelationship] = useState<string | null>(null);

  useEffect(() => {
    const residentId = window.sessionStorage.getItem(SELECTED_RESIDENT_STORAGE_KEY);
    const resident = DEMO_FIXTURE.residents.find((item) => item.id === residentId);
    if (resident) setResidentName(resident.displayName);

    const rawEvent = window.sessionStorage.getItem(SOCIAL_EVENT_STORAGE_KEY);
    if (!rawEvent) return;
    try {
      const event = JSON.parse(rawEvent) as SocialEvent;
      setRelationship(event.relationship);
    } catch {
      window.sessionStorage.removeItem(SOCIAL_EVENT_STORAGE_KEY);
    }
  }, []);

  async function save() {
    const title = snapshot?.persona.certifiedTitle ?? DEMO_FIXTURE.persona.title;
    const text = `谢邀喵：第一段关系已经成立。${title} × ${residentName}${relationship ? `，现在是「${relationship}」` : ""}。`;
    try {
      await navigator.clipboard?.writeText(text);
      setSaved(true);
    } catch {
      setSaved(true);
    }
  }

  return (
    <button className="theatre-button theatre-button-secondary" onClick={save} type="button">
      {saved ? "分享文案已复制" : "保存这一幕"} <span>{saved ? "✓" : "↓"}</span>
    </button>
  );
}
