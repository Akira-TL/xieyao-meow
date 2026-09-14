import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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

export function DemoPage({
  children,
  width = "max-w-[1200px]",
  scene = "default",
  activation = false,
}: {
  children: ReactNode;
  width?: string;
  scene?: "default" | "landing" | "casting" | "reveal" | "encounter" | "archive";
  activation?: boolean;
}) {
  const usesTheatreScenery = scene === "landing" || scene === "casting" || scene === "reveal" || scene === "encounter";

  return (
    <main className={`theatre-page theatre-page--${scene}${activation ? " theatre-page--activation" : ""}`}>
      {usesTheatreScenery ? <div className="theatre-scene-art" aria-hidden="true" /> : null}
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
}: {
  name: string;
  label?: string;
  aspect?: "stage" | "portrait" | "square" | "wide" | "polaroid" | "avatar";
  className?: string;
}) {
  return (
    <div
      className={`art-slot art-slot--${aspect} ${className}`}
      data-art-slot={name}
      aria-label={`${label ?? name} 图片位置`}
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

export function KanshanPlaceholder() {
  return <ArtSlot name="official/liukanshan" label="刘看山" aspect="avatar" />;
}

export function PersonaEgg() {
  return (
    <div className="persona-egg" data-art-slot="hatch/persona-egg" aria-label="人格蛋图片占位">
      <span>?</span>
      <small>PERSONA EGG</small>
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
