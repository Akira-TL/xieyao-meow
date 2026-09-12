import { DemoFlowButton, DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, BrandHeader, DemoBanner, DemoPage, DemoLabel, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

function ExploreContent({ appMode }: { appMode: boolean }) {
  return (
    <DemoPage>
      <DemoBanner />
      <BrandHeader right={!appMode ? <a href="/">返回入口</a> : undefined} />
      <Surface>
        <p className="eyebrow">EXPLORE</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">本喵今天给你叼回来了 3 个东西。</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">重点不是“推荐了什么”，而是每一条都必须说明为什么会叼给你。</p>
        <div className="mt-6 space-y-3">
          {DEMO_FIXTURE.explore.items.map((item) => (
            <article className="border border-zinc-800 bg-black/20 p-4" key={item.title}>
              <DemoLabel>DEMO · 知乎内容候选</DemoLabel>
              <h2 className="mt-3 text-lg font-medium leading-7 text-zinc-200">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">因为：{item.whyPicked}</p>
              <div className="mt-4 flex gap-4 text-xs">
                <a className="text-amber-200/70 hover:text-amber-200" href={item.sourceUrl} rel="noreferrer" target="_blank">看原内容 ↗</a>
                <span className="text-zinc-700">听本喵怎么想（后续接 ContentEncounter）</span>
              </div>
            </article>
          ))}
        </div>
        {!appMode ? (
          <div className="mt-7"><DemoFlowButton href="/hatch/consent" stage="PRE_AUTH">看看我养出了什么</DemoFlowButton></div>
        ) : null}
      </Surface>
      {appMode ? <AppBottomNav active="explore" /> : null}
    </DemoPage>
  );
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const appMode = mode === "app";
  return appMode ? <DemoRouteGuard><ExploreContent appMode /></DemoRouteGuard> : <ExploreContent appMode={false} />;
}
