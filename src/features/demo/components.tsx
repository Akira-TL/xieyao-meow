import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { resolveP0Art, type PersonaEggState } from "@/lib/art/p0";
import { resolvePersonaArt, type PersonaArtState, type PlayerPersona } from "@/lib/persona";

export type AppSection = "home" | "explore" | "encounter" | "atlas";

const APP_ITEMS: readonly [AppSection, string, string, string][] = [
  ["home", "/home", "窝", "首页"],
  ["explore", "/explore?mode=app", "逛", "探索"],
  ["encounter", "/encounter", "遇见", "遇见"],
  ["atlas", "/atlas", "图鉴", "档案"],
];

const ACTIVATION_STEPS = [
  ["01", "序幕"],
  ["02", "授权"],
  ["03", "数据扫描"],
  ["04", "人格登台"],
  ["05", "首次相遇"],
  ["06", "对手戏"],
] as const;

function TheatreSceneArt({ overlay }: { overlay?: ReactNode }) {
  return (
    <div className="theatre-scene-art" aria-hidden="true">
      <div className="theatre-scene-wing theatre-scene-wing--left" />
      <div className="theatre-scene-wing theatre-scene-wing--right" />
      <div className="theatre-scene-canvas">
        <div className="theatre-scene-curtain" />
        <div className="theatre-scene-spotlight" />
        <div className="theatre-scene-floor" />
        {overlay ? <div className="theatre-scene-overlay">{overlay}</div> : null}
      </div>
    </div>
  );
}

export function DemoPage({
  children,
  width = "max-w-[1200px]",
  scene = "default",
  activation = false,
  sceneOverlay,
}: {
  children: ReactNode;
  width?: string;
  scene?: "default" | "landing" | "casting" | "reveal" | "encounter" | "archive";
  activation?: boolean;
  sceneOverlay?: ReactNode;
}) {
  const usesTheatreScenery = scene === "landing" || scene === "casting" || scene === "reveal" || scene === "encounter";

  return (
    <main className={`theatre-page theatre-page--${scene}${activation ? " theatre-page--activation" : ""}`}>
      {usesTheatreScenery ? <TheatreSceneArt overlay={sceneOverlay} /> : null}
      <div className="theatre-grain" aria-hidden="true" />
      <div className={`relative z-10 mx-auto w-full ${width}`}>{children}</div>
    </main>
  );
}

export function BrandMark() {
  return (
    <Link className="theatre-brand" href="/" aria-label="谢邀喵首页">
      <span className="theatre-brand-name">谢邀喵</span>
      <span className="theatre-brand-tagline">每一个认真提问的人，都值得被看见</span>
    </Link>
  );
}

export function ActivationHeader({ current, right }: { current: number; right?: ReactNode }) {
  return (
    <header className="activation-header">
      <BrandMark />
      <nav className="activation-steps" aria-label="首访进度">
        {ACTIVATION_STEPS.map(([number, label], index) => (
          <span className={index + 1 === current ? "is-current" : index + 1 < current ? "is-done" : ""} key={number}>
            <b>{number}</b> {label}
          </span>
        ))}
      </nav>
      <div className="activation-step-mobile" aria-label={`首访进度 ${current}/6`}>
        <span>ACT {String(current).padStart(2, "0")}</span>
        <strong>{ACTIVATION_STEPS[current - 1]?.[1]}</strong>
      </div>
      {right ? <div className="activation-header-right">{right}</div> : null}
    </header>
  );
}

export function AppHeader({ active, right }: { active: AppSection; right?: ReactNode }) {
  return (
    <header className="app-header">
      <BrandMark />
      <nav className="app-top-nav" aria-label="主导航">
        {APP_ITEMS.map(([key, href, , desktopLabel]) => (
          <Link className={active === key ? "is-active" : ""} href={href} key={key}>
            {desktopLabel}
          </Link>
        ))}
        <Link href="/about">关于</Link>
      </nav>
      <div className="app-header-right">
        <Link className="header-icon-link" href="/explore?mode=app" aria-label="探索">
          <SearchRoundedIcon fontSize="small" />
        </Link>
        <Link className="header-icon-link" href="/atlas" aria-label="我的人格档案">
          <AccountCircleRoundedIcon fontSize="small" />
        </Link>
        {right}
      </div>
    </header>
  );
}

export function PublicHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="public-header">
      <BrandMark />
      <nav className="app-top-nav" aria-label="公开导航">
        <Link href="/explore?mode=public">公开试看</Link>
        <Link href="/about">关于谢邀喵</Link>
      </nav>
      <div className="app-header-right">{right}</div>
    </header>
  );
}

const APP_ICONS = {
  home: HomeRoundedIcon,
  explore: ExploreRoundedIcon,
  encounter: Diversity3RoundedIcon,
  atlas: AutoStoriesRoundedIcon,
} as const;

export function AppBottomNav({ active }: { active: AppSection }) {
  return (
    <nav className="app-bottom-nav" aria-label="移动端主导航">
      {APP_ITEMS.map(([key, href, mobileLabel]) => {
        const Icon = APP_ICONS[key];
        return (
          <Link className={active === key ? "is-active" : ""} href={href} key={key}>
            <span className="app-bottom-icon" aria-hidden="true"><Icon fontSize="small" /></span>
            <span>{mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Surface({
  children,
  className = "",
  paper = false,
}: {
  children: ReactNode;
  className?: string;
  paper?: boolean;
}) {
  return (
    <section className={`${paper ? "paper-surface" : "stage-surface"} ${className}`}>
      {children}
    </section>
  );
}

export function ArtSlot({
  name,
  label,
  aspect = "stage",
  className = "",
  src,
  fit = "cover",
}: {
  name: string;
  label?: string;
  aspect?: "stage" | "portrait" | "square" | "wide" | "polaroid" | "avatar";
  className?: string;
  src?: string;
  fit?: "cover" | "contain";
}) {
  const assetSrc = src?.trim() || (name.startsWith("npc/") ? `/art/slots/${name}.png` : undefined);
  const style = assetSrc
    ? ({ "--art-slot-image": `url(${JSON.stringify(assetSrc)})` } as CSSProperties & { "--art-slot-image": string })
    : undefined;

  return (
    <div
      className={`art-slot art-slot--${aspect} art-slot--fit-${fit} ${className}`}
      data-art-slot={name}
      aria-label={label ?? name}
      style={style}
    />
  );
}

export function PersonaArt({
  persona,
  state = "base",
  alt,
  aspect = "portrait",
  className = "",
  priority = false,
}: {
  persona: Pick<PlayerPersona, "visualVariant">;
  state?: PersonaArtState;
  alt: string;
  aspect?: "portrait" | "square" | "wide" | "avatar";
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`persona-art persona-art--${aspect} ${className}`}
      data-persona-state={state}
      data-persona-variant={persona.visualVariant}
    >
      <Image
        alt={alt}
        className="persona-art-image"
        fill
        priority={priority}
        sizes={aspect === "avatar" ? "88px" : aspect === "wide" ? "(max-width: 760px) 92vw, 600px" : "(max-width: 760px) 70vw, 360px"}
        src={resolvePersonaArt(persona, state)}
      />
    </div>
  );
}

export function PetStage({
  name,
  species,
  title,
  size = "large",
  demoResident = false,
  slot = "persona/self",
  persona,
  state = "base",
}: {
  name?: string;
  species: string;
  title?: string;
  size?: "small" | "large";
  demoResident?: boolean;
  slot?: string;
  persona?: Pick<PlayerPersona, "visualVariant">;
  state?: PersonaArtState;
}) {
  return (
    <div className={`pet-stage pet-stage--${size}`}>
      {persona ? (
        <PersonaArt
          alt={name ?? species}
          aspect={size === "large" ? "portrait" : "avatar"}
          persona={persona}
          priority={size === "large"}
          state={state}
        />
      ) : (
        <ArtSlot name={slot} label={name ?? species} aspect={size === "large" ? "portrait" : "avatar"} />
      )}
      {name ? <p className="pet-stage-name">{name}</p> : null}
      <p className="pet-stage-species">{species}</p>
      {title ? <p className="pet-stage-title">{title}</p> : null}
      {demoResident ? <span className="demo-resident-badge">社区居民</span> : null}
    </div>
  );
}

type KanshanAction = "idle" | "wave" | "wander" | "computer" | "sleepy" | "ball";

export function KanshanPlaceholder({
  action = "idle",
  className = "",
}: {
  action?: KanshanAction;
  className?: string;
}) {
  return (
    <div className={`kanshan-art ${className}`} data-kanshan-action={action}>
      <Image
        alt={`刘看山 · ${action}`}
        className="kanshan-art-image"
        fill
        sizes="(max-width: 760px) 96px, 128px"
        src={`/art/official/liukanshan/${action}.gif`}
        unoptimized
      />
    </div>
  );
}

export function PersonaEgg({ state = "idle" }: { state?: PersonaEggState }) {
  return (
    <div className="persona-egg" data-egg-state={state} aria-label={`人格蛋 · ${state}`}>
      <Image
        alt=""
        aria-hidden="true"
        className="persona-egg-image"
        fill
        priority={state === "idle"}
        sizes="(max-width: 760px) 190px, 280px"
        src={resolveP0Art(`egg-${state}`)}
      />
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="theatre-button theatre-button-primary" href={href}>
      {children}<span aria-hidden="true">→</span>
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="theatre-button theatre-button-secondary" href={href}>
      {children}<span aria-hidden="true">→</span>
    </Link>
  );
}

export function DemoLabel({ children }: { children: ReactNode }) {
  return <span className="demo-label">{children}</span>;
}

export function GrowthStrip({
  knowledge,
  expression,
  social,
}: {
  knowledge: number;
  expression: number;
  social: number;
}) {
  return (
    <div className="growth-strip">
      {[
        ["见识", knowledge],
        ["表达", expression],
        ["社交", social],
      ].map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>Lv.{value}</strong>
          <i style={{ width: `${Math.min(100, Number(value) * 18)}%` }} />
        </div>
      ))}
    </div>
  );
}

export function PageTitle({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <div className="page-title-block">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}

export function StageCaption({ children }: { children: ReactNode }) {
  return <p className="stage-caption">{children}</p>;
}

export function PaperCard({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <article className={`paper-card ${className}`} id={id}>{children}</article>;
}
