import { ExperienceDemo } from "@/components/experience-demo";
import { DEMO_FALLBACK } from "@/data/demo-fallback";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-6 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">ZHIHU HACKATHON 2026 · DIGITAL PERSONA</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-zinc-100 sm:text-7xl">
              谢邀<span className="text-amber-300">喵</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              用你的知乎兴趣、收藏和创作，孵化一只会替你逛知乎、读问题、认真回答的赛博宠物。
            </p>
          </div>
          <div className="max-w-sm border-l border-zinc-800 pl-4 text-xs leading-5 text-zinc-600">
            当前开发版先使用项目 Access Secret 所属账号跑通完整 L0；OAuth 获批后，同一链路直接切换到每位授权用户的知乎人格。
          </div>
        </header>

        <ExperienceDemo
          initialExperience={DEMO_FALLBACK}
          allowForceRefresh={process.env.NODE_ENV !== "production"}
        />

        <footer className="mt-6 flex flex-col justify-between gap-2 text-[11px] tracking-wide text-zinc-700 sm:flex-row">
          <span>REAL ZHIHU DATA → KNOWLEDGE LAYER → PERSONA LAYER</span>
          <span>没有实时数据时，界面会明确显示 DEMO CACHE</span>
        </footer>
      </div>
    </main>
  );
}
