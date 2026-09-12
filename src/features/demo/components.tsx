import Link from "next/link";
import type { ReactNode } from "react";

export function DemoPage({
  children,
  width = "max-w-3xl",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8">
      <div className="ambient-grid" aria-hidden="true" />
      <div className={`relative mx-auto ${width}`}>{children}</div>
    </main>
  );
}

export function DemoBanner() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[11px] leading-5 text-amber-100/80">
      <span>DEMO FIXTURE · 当前只验证产品流程，不读取你的知乎账号</span>
      <span className="hidden text-zinc-600 sm:inline">provenance=demo</span>
    </div>
  );
}

export function BrandHeader({
  step,
  right,
}: {
  step?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-center justify-between gap-4">
      <Link className="text-lg font-semibold tracking-[-0.04em] text-zinc-100" href="/">
        谢邀<span className="text-amber-300">喵</span>
      </Link>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        {step ? <span>{step}</span> : null}
        {right}
      </div>
    </header>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-zinc-800 bg-zinc-950/72 p-5 shadow-2xl shadow-black/20 sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

export function PetStage({
  name,
  species,
  title,
  size = "large",
  demoResident = false,
}: {
  name?: string;
  species: string;
  title?: string;
  size?: "small" | "large";
  demoResident?: boolean;
}) {
  const dimensions = size === "large" ? "h-36 w-36 text-5xl" : "h-20 w-20 text-3xl";
  return (
    <div className="text-center">
      <div
        className={`mx-auto grid ${dimensions} place-items-center rounded-[32%] border border-amber-300/20 bg-gradient-to-br from-amber-300/10 via-zinc-900 to-zinc-950 text-amber-200 shadow-inner shadow-amber-300/5`}
        aria-label={`${species}宠物占位图`}
      >
        ᓚᘏᗢ
      </div>
      {name ? <p className="mt-3 text-sm font-medium text-zinc-100">{name}</p> : null}
      <p className="mt-1 text-xs text-zinc-500">{species}</p>
      {title ? <p className="mt-1 text-xs text-amber-200/70">{title}</p> : null}
      {demoResident ? (
        <span className="mt-2 inline-flex border border-zinc-700 px-2 py-1 text-[10px] text-zinc-500">
          演示居民
        </span>
      ) : null}
    </div>
  );
}

export function KanshanPlaceholder() {
  return (
    <div className="grid h-20 w-20 place-items-center rounded-full border border-blue-400/20 bg-blue-400/5 text-center text-[10px] leading-4 text-blue-200/70">
      刘看山
      <br />
      官方向导
    </div>
  );
}

export function PersonaEgg() {
  return (
    <div className="grid h-48 w-36 place-items-center rounded-[48%_48%_44%_44%] border border-amber-300/30 bg-gradient-to-b from-amber-100/10 via-amber-300/5 to-zinc-950 shadow-[0_0_80px_rgba(252,211,77,0.08)]">
      <span className="text-xs tracking-[0.24em] text-amber-100/50">ZHIHU DNA</span>
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-12 items-center justify-center bg-amber-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
      href={href}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center border border-zinc-800 px-4 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
      href={href}
    >
      {children}
    </Link>
  );
}

export function DemoLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] tracking-[0.12em] text-zinc-500">
      {children}
    </span>
  );
}

export function AppBottomNav({ active }: { active: "home" | "explore" | "encounter" | "atlas" }) {
  const items = [
    ["home", "/home", "窝"],
    ["explore", "/explore?mode=app", "逛"],
    ["encounter", "/encounter", "遇见"],
    ["atlas", "/atlas", "图鉴"],
  ] as const;

  return (
    <nav className="sticky bottom-3 mt-6 grid grid-cols-4 border border-zinc-800 bg-zinc-950/95 p-1 backdrop-blur">
      {items.map(([key, href, label]) => (
        <Link
          className={`px-2 py-3 text-center text-xs transition ${active === key ? "bg-zinc-800 text-amber-200" : "text-zinc-500 hover:text-zinc-200"}`}
          href={href}
          key={key}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
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
    <div className="grid grid-cols-3 gap-2">
      {[
        ["见识", knowledge],
        ["表达", expression],
        ["社交", social],
      ].map(([label, value]) => (
        <div className="border border-zinc-800 bg-black/20 p-3 text-center" key={label}>
          <p className="text-[10px] text-zinc-600">{label}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-200">Lv.{value}</p>
        </div>
      ))}
    </div>
  );
}

export function PageTitle({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-100 sm:text-4xl">{title}</h1>
      {detail ? <p className="mt-3 text-sm leading-6 text-zinc-500">{detail}</p> : null}
    </div>
  );
}
