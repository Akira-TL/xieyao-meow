"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  DEMO_STAGE_STORAGE_KEY,
  advanceActivationStage,
  isDemoActivationStage,
  type DemoActivationStage,
} from "./activation";
import { DEMO_FIXTURE } from "./fixtures";

function advanceStage(requested: DemoActivationStage) {
  const stored = window.localStorage.getItem(DEMO_STAGE_STORAGE_KEY);
  const current = isDemoActivationStage(stored) ? stored : "VISITOR";
  window.localStorage.setItem(DEMO_STAGE_STORAGE_KEY, advanceActivationStage(current, requested));
}

interface ZhihuOAuthStatus {
  oauthConfigured: boolean;
  oauthPartiallyConfigured: boolean;
  connected: boolean;
  developmentIdentityAvailable: boolean;
  callbackRequiresPublicHttps: boolean;
  protocolNote: string;
}

export function ZhihuConsentActions() {
  const router = useRouter();
  const [status, setStatus] = useState<ZhihuOAuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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
          <LoginRoundedIcon fontSize="small" /> 用知乎登录并开始孵化 <ArrowForwardRoundedIcon fontSize="small" />
        </a>
        <p className="oauth-inline-note">授权确认发生在知乎官方页面；授权码和访问令牌只由服务端处理。</p>
      </div>
    );
  }

  if (status.developmentIdentityAvailable) {
    return (
      <div className="oauth-actions">
        <button
          className="theatre-button theatre-button-primary"
          onClick={() => {
            advanceStage("PROFILE_SCANNING");
            router.push("/hatch/scanning?identity=developer");
          }}
          type="button"
        >
          <VerifiedUserOutlinedIcon fontSize="small" /> 用当前知乎开发账号继续 <ArrowForwardRoundedIcon fontSize="small" />
        </button>
        <p className="oauth-inline-note">本地会读取当前开发账号的真实公开数据；正式 OAuth 凭证与公网回调配置完成后，同一位置切换为知乎官方登录。</p>
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
  const candidates = useMemo(() => {
    const primary = DEMO_FIXTURE.match.candidate;
    const alternatives = DEMO_FIXTURE.residents.filter((resident) => resident.id !== primary.id);
    return [primary, ...alternatives];
  }, []);
  const [index, setIndex] = useState(0);
  const candidate = candidates[index % candidates.length];
  const score = Math.max(68, DEMO_FIXTURE.match.score - index * 7);

  return (
    <div className="first-match-shell">
      <p className="stage-caption">SCENE 05 · 两个不同的思考方式，也许能走得很远</p>
      <h1 className="match-title">第一次<span>相遇</span></h1>
      <p className="match-handwriting">不同，才更有意思。</p>

      <div className="match-stage-grid">
        <div className="match-persona">
          <div className="match-art-slot" data-art-slot="persona/self-match">本喵</div>
          <strong>工具猫</strong>
          <span>长答工程脑</span>
          <q>把复杂的问题，拆成可执行的步骤。</q>
        </div>
        <div className="match-score-block">
          <span>谢邀喵匹配度</span>
          <strong>{score}%</strong>
          <div className="match-common-grid">
            <div><b>共同兴趣</b><em>AI</em><small>人工智能</small></div>
            <i>♥</i>
            <div><b>共同兴趣</b><em>科学</em><small>探索未知</small></div>
          </div>
        </div>
        <div className="match-persona">
          <div className="match-art-slot" data-art-slot={`persona/${candidate.id}`}>{candidate.displayName}</div>
          <strong>{candidate.displayName}</strong>
          <span>{candidate.title}</span>
          <q>重要的不是答案，而是更好的问题。</q>
        </div>
      </div>

      <div className="match-contrast-row">
        <span>长答工程脑 <small>系统 · 工具 · 结构</small></span>
        <b>↔</b>
        <span>短句直球型 <small>灵感 · 追问 · 人文</small></span>
      </div>
      <p className="match-prediction">关系预测：{DEMO_FIXTURE.match.relationPrediction}</p>

      <button
        className="theatre-button theatre-button-primary match-main-cta"
        onClick={() => {
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
  const turns = DEMO_FIXTURE.encounter.turns;
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= turns.length) return;
    const timer = window.setTimeout(() => setShown((value) => value + 1), 650);
    return () => window.clearTimeout(timer);
  }, [shown, turns.length]);

  return (
    <div className="encounter-playback">
      <div className="encounter-actors">
        <div className="encounter-actor">
          <div className="encounter-art" data-art-slot="persona/self-encounter">工具猫</div>
          <strong>工具猫</strong>
          <span>AI 提问派</span>
        </div>
        <article className="encounter-topic-card">
          <span>知乎 · 热议话题</span>
          <h2>{DEMO_FIXTURE.encounter.topic.title}</h2>
          <a href={DEMO_FIXTURE.encounter.topic.url} rel="noreferrer" target="_blank">查看原问题 ↗</a>
        </article>
        <div className="encounter-actor">
          <div className="encounter-art" data-art-slot="persona/other-encounter">{DEMO_FIXTURE.match.candidate.displayName}</div>
          <strong>{DEMO_FIXTURE.match.candidate.displayName}</strong>
          <span>人文思考者</span>
        </div>
      </div>

      <div className="encounter-lines" aria-live="polite">
        {turns.slice(0, shown).map((turn, index) => (
          <p className={turn.speaker === "other" ? "is-other" : "is-self"} key={`${turn.speaker}-${index}`}>
            <b>{turn.speaker === "other" ? DEMO_FIXTURE.match.candidate.displayName : "工具猫"}：</b>
            「{turn.text}」
          </p>
        ))}
      </div>

      <div className="encounter-explanation">
        <b>为什么会这么聊？</b>
        <span>AI / 结构化长答 × 短句直球</span>
        <p>{DEMO_FIXTURE.encounter.explanation}</p>
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

export function ShareSceneButton() {
  const [saved, setSaved] = useState(false);

  async function save() {
    const text = `谢邀喵：第一段关系已经成立。${DEMO_FIXTURE.persona.title} × ${DEMO_FIXTURE.match.candidate.displayName}，${DEMO_FIXTURE.match.score}% 同频。`;
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
