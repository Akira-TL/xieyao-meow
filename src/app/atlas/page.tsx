import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, BrandHeader, DemoBanner, DemoPage, GrowthStrip, PetStage, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function AtlasPage() {
  return (
    <DemoRouteGuard>
      <DemoPage>
        <DemoBanner />
        <BrandHeader />
        <Surface>
          <p className="eyebrow">ATLAS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">我的知乎人格图鉴。</h1>
          <div className="mt-7 grid gap-7 sm:grid-cols-[0.8fr_1.2fr]">
            <PetStage name="本喵" species={`${DEMO_FIXTURE.persona.species} · ${DEMO_FIXTURE.persona.archetype}`} title={DEMO_FIXTURE.persona.title} />
            <div>
              <p className="meta-label">知乎成分</p>
              <div className="mt-3 space-y-2">
                {DEMO_FIXTURE.persona.highlights.slice(0, 3).map((item) => (
                  <div className="flex justify-between gap-4 border-b border-zinc-800 py-2 text-sm" key={item.label}><span className="text-zinc-600">{item.label}</span><span className="text-zinc-200">{item.value}</span></div>
                ))}
              </div>
              <p className="meta-label mt-6">已解锁称号</p>
              <div className="mt-3 flex flex-wrap gap-2">{DEMO_FIXTURE.atlas.titles.map((title) => <span className="tag" key={title}>{title}</span>)}</div>
            </div>
          </div>
          <div className="mt-7"><GrowthStrip knowledge={DEMO_FIXTURE.home.growth.knowledge} expression={DEMO_FIXTURE.home.growth.expression} social={DEMO_FIXTURE.home.growth.social} /></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div><p className="meta-label">关系图鉴</p><div className="mt-3 space-y-2">{DEMO_FIXTURE.atlas.relationships.map((item) => <div className="border border-zinc-800 p-3 text-sm" key={item.name}><span className="text-zinc-200">{item.name}</span><span className="float-right text-zinc-600">{item.status}</span></div>)}</div></div>
            <div><p className="meta-label">成长历史</p><div className="mt-3 space-y-2">{DEMO_FIXTURE.atlas.history.map((item) => <div className="border-l border-zinc-800 py-2 pl-3 text-sm text-zinc-500" key={item}>{item}</div>)}</div></div>
          </div>
          <div className="mt-7 border-t border-zinc-800 pt-6">
            <p className="meta-label">旅途收藏</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs text-zinc-600">{DEMO_FIXTURE.outing.returnArtifact.label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{DEMO_FIXTURE.outing.returnArtifact.thought}</p>
              </div>
              <div className="border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs text-zinc-600">关系票根 · {DEMO_FIXTURE.outing.returnArtifact.companion}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">一次 outing 中再次遇见，关系变化 {DEMO_FIXTURE.outing.returnArtifact.relationshipDelta}。</p>
              </div>
            </div>
          </div>
        </Surface>
        <AppBottomNav active="atlas" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
