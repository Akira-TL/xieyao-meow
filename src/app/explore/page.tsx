import { DemoFlowButton, DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, BrandHeader, DemoBanner, DemoPage, DemoLabel, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

function ExploreContent({ appMode }: { appMode: boolean }) {
  const outing = DEMO_FIXTURE.outing;
  return (
    <DemoPage>
      <DemoBanner />
      <BrandHeader right={!appMode ? <a href="/">返回入口</a> : undefined} />
      <Surface>
        <p className="eyebrow">EXPLORE / JOURNEY LOG</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">
          {appMode ? "它最近都跑去了哪。" : "先看看别人的人格都捡回了什么。"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {appMode
            ? "「逛」不是实时搜索框，而是它真正出去以后留下来的路线和东西。"
            : "这些是 DEMO 内容，用来预览谢邀喵会如何解释自己为什么对某个问题感兴趣。"}
        </p>

        {appMode ? (
          <div className="mt-7 border border-amber-300/20 bg-amber-300/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <DemoLabel>{outing.returnArtifact.label}</DemoLabel>
              <span className="text-[10px] text-zinc-700">provenance=demo</span>
            </div>
            <p className="mt-4 text-xs text-zinc-600">去过：{outing.returnArtifact.places.join(" / ")}</p>
            <a
              className="mt-2 block text-lg font-medium leading-7 text-zinc-100 hover:text-amber-100"
              href={outing.returnArtifact.topic.url}
              rel="noreferrer"
              target="_blank"
            >
              {outing.returnArtifact.topic.title} ↗
            </a>
            <p className="mt-4 border-l border-amber-300/30 pl-4 text-sm leading-6 text-zinc-400">
              “{outing.returnArtifact.thought}”
            </p>
          </div>
        ) : null}

        {appMode ? (
          <div className="mt-7">
            <p className="meta-label">以前的幕间记录</p>
            <div className="mt-3 space-y-2">
              {outing.journeyLog.map((item) => (
                <article className="border border-zinc-800 bg-black/20 p-4" key={item.label}>
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.summary}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-7">
          <p className="meta-label">{appMode ? "它容易被这些东西吸引" : "DEMO 内容候选"}</p>
          <div className="mt-3 space-y-3">
            {DEMO_FIXTURE.explore.items.map((item) => (
              <article className="border border-zinc-800 bg-black/20 p-4" key={item.title}>
                <DemoLabel>DEMO · 知乎内容候选</DemoLabel>
                <h2 className="mt-3 text-lg font-medium leading-7 text-zinc-200">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">为什么会闻过去：{item.whyPicked}</p>
                <div className="mt-4 text-xs">
                  <a className="text-amber-200/70 hover:text-amber-200" href={item.sourceUrl} rel="noreferrer" target="_blank">看原内容 ↗</a>
                </div>
              </article>
            ))}
          </div>
        </div>

        {!appMode ? (
          <div className="mt-7"><DemoFlowButton href="/hatch/consent" stage="PRE_AUTH">看看我养出了什么</DemoFlowButton></div>
        ) : (
          <p className="mt-6 text-xs text-zinc-700">想影响下一趟？回「窝」留一张出门纸条。</p>
        )}
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
