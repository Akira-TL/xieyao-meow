"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { AnswerExperience } from "@/lib/experience";
import type { SocialEvent } from "@/lib/social";

import {
  DEMO_STAGE_STORAGE_KEY,
  advanceActivationStage,
  isDemoActivationStage,
  type DemoActivationStage,
} from "./activation";
import { ArtSlot, PersonaArt, ResidentArt } from "./components";
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

function excerpt(value: string, max = 86) {
  const normalized = value.replace(/[#*_`>\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
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
  const candidate = candidates[index % candidates.length];
  const selfPersona = snapshot?.persona;
  const playerPersona = selfPersona ?? DEMO_FIXTURE.persona;
  const selfInterests = selfPersona?.interests ?? DEMO_FIXTURE.persona.interests;
  const candidateInterestSet = new Set<string>(candidate.interests);
  const sharedInterests = selfInterests.filter((interest: string) => candidateInterestSet.has(interest));
  const score = Math.min(95, 72 + sharedInterests.length * 8 + (index === 0 ? 3 : 0));
  const selfStyle = snapshot?.composition.writingLength === "long"
    ? "长答工程脑"
    : snapshot?.composition.writingLength === "short"
      ? "短句直给型"
      : "结构化表达型";
  const primaryInterest = snapshot?.composition.primaryInterest ?? DEMO_FIXTURE.persona.archetype;
  const prediction = sharedInterests.length > 0
    ? candidate.answerStyle.length === "short" && snapshot?.composition.writingLength === "long"
      ? "很可能边吵边加好友"
      : "很可能聊着聊着就互相关注"
    : "暂时陌生，但值得再碰一次";

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
          <strong>{score}%</strong>
          <div className="match-common-grid">
            <div><b>共同兴趣</b><em>{sharedInterests[0] ?? primaryInterest}</em><small>你的长期偏好</small></div>
            <i>♥</i>
            <div><b>{sharedInterests[1] ? "共同兴趣" : "对方气味"}</b><em>{sharedInterests[1] ?? candidate.interests[0]}</em><small>决定第一场对手戏</small></div>
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
  const [shown, setShown] = useState(1);
  const [socialEvent, setSocialEvent] = useState<SocialEvent | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SELECTED_RESIDENT_STORAGE_KEY);
    if (stored && DEMO_FIXTURE.residents.some((resident) => resident.id === stored)) {
      setResidentId(stored);
    }
  }, []);

  useEffect(() => {
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
        setSocialEvent(event);
        window.sessionStorage.setItem(SOCIAL_EVENT_STORAGE_KEY, JSON.stringify(event));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [residentId]);

  const candidate = DEMO_FIXTURE.residents.find((resident) => resident.id === residentId) ?? DEMO_FIXTURE.residents[0];
  const topic = experience?.question ?? questionSnapshot?.question ?? DEMO_FIXTURE.encounter.topic;
  const selfPersona = snapshot?.persona ?? experience?.persona;
  const playerPersona = selfPersona ?? DEMO_FIXTURE.persona;
  const selfTitle = selfPersona?.certifiedTitle ?? DEMO_FIXTURE.persona.title;
  const selfDescriptor = selfPersona?.personality[0] ?? DEMO_FIXTURE.persona.archetype;
  const selfInterests = selfPersona?.interests ?? DEMO_FIXTURE.persona.interests;
  const sharedInterests = selfInterests.filter((interest) => new Set<string>(candidate.interests).has(interest));
  const turns = useMemo(() => {
    if (experience?.mode === "live") {
      return [
        {
          speaker: "self" as const,
          text: excerpt(experience.card.answer),
        },
        {
          speaker: "other" as const,
          text: `${candidate.catchphrase} 我先不接你的结论：如果把人的体验放在前面，你这套拆法还成立吗？`,
        },
        {
          speaker: "self" as const,
          text: "行，那就从人的体验往回推，再看技术应该替人做到哪一步。",
        },
      ];
    }
    if (snapshot?.mode === "live") {
      return [
        {
          speaker: "self" as const,
          text: `${snapshot.persona.catchphrase} 这题我先不急着下结论，先把谁在做决定、谁在承担代价拆开。`,
        },
        {
          speaker: "other" as const,
          text: `${candidate.catchphrase} 你负责拆结构，我先替普通人问一句：这么做到底让人更轻松了吗？`,
        },
        {
          speaker: "self" as const,
          text: "那就对了。先把人的体验放在前面，再看技术应该走到哪一步。",
        },
      ];
    }
    return [...DEMO_FIXTURE.encounter.turns];
  }, [candidate.catchphrase, experience, snapshot]);

  useEffect(() => {
    if (shown >= turns.length) return;
    const timer = window.setTimeout(() => setShown((value) => value + 1), 650);
    return () => window.clearTimeout(timer);
  }, [shown, turns.length]);

  return (
    <div className="encounter-playback">
      <h1 className="encounter-headline">{topic.title}</h1>
      <p className="encounter-subtitle">一场从真实知乎问题长出来的第一次对手戏</p>

      <div className="encounter-actors">
        <div className="encounter-actor">
          <PersonaArt alt="本喵正在和社区居民对话" className="encounter-playback-self-art" persona={playerPersona} state="talking" />
          <strong>{selfTitle}</strong>
          <span>{selfDescriptor}</span>
        </div>
        <article className="encounter-topic-card">
          <span>知乎 · 真实问题</span>
          <h2>{topic.title}</h2>
          <a href={topic.url} rel="noreferrer" target="_blank">查看原问题 ↗</a>
        </article>
        <div className="encounter-actor">
          <ArtSlot
            name={`npc/${candidate.id}/talking`}
            label={candidate.displayName}
            aspect="portrait"
            className="encounter-art"
            fit="contain"
          />
          <strong>{candidate.displayName}</strong>
          <span>{candidate.personality[0]}</span>
        </div>
      </div>

      <div className="encounter-lines" aria-live="polite">
        {turns.slice(0, shown).map((turn, index) => (
          <p className={turn.speaker === "other" ? "is-other" : "is-self"} key={`${turn.speaker}-${index}`}>
            <b>{turn.speaker === "other" ? candidate.displayName : "本喵"}：</b>
            「{turn.text}」
          </p>
        ))}
      </div>

      <div className="encounter-explanation">
        <b>为什么会这么聊？</b>
        <span>{sharedInterests.length > 0 ? sharedInterests.join(" / ") : "不同兴趣"} · {selfDescriptor} × {candidate.personality[0]}</span>
        <p>
          {socialEvent
            ? `${socialEvent.reasons.slice(0, 2).join("；")}。这次互动让关系变成「${socialEvent.relationship}」${socialEvent.affinityDelta >= 0 ? `，关系 +${socialEvent.affinityDelta}` : `，关系 ${socialEvent.affinityDelta}`}。`
            : experience?.mode === "live" || snapshot?.mode === "live"
              ? "问题来自当前知乎真实内容；你的这一侧使用刚刚孵化出的 Persona 表达，另一侧使用社区居民 Persona。"
              : DEMO_FIXTURE.encounter.explanation}
        </p>
      </div>

      <button
        className="theatre-button theatre-button-primary encounter-main-cta"
        disabled={shown < turns.length}
        onClick={() => {
          advanceStage("ACTIVATED");
          router.push("/share/demo-match");
        }}
        type="button"
      >
        {shown < turns.length ? "对手戏进行中…" : "我也想认识 TA"} <span>→</span>
      </button>
      <button className="match-switch" onClick={() => router.push("/encounter/first?phase=match")} type="button">
        再看一个
      </button>
    </div>
  );
}

export function ShareRelationshipVisual() {
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
    <div className="share-live-visual">
      <PersonaArt alt="本喵完成第一次相遇" className="share-player-persona" persona={playerPersona} state="returned" />
      <span className="share-live-mark">×</span>
      <ArtSlot
        name={`npc/${resident.id}/meeting`}
        label={resident.displayName}
        aspect="portrait"
        className="share-resident-art"
        fit="contain"
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
