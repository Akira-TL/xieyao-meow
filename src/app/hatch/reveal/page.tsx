import { DemoFlowButton, DemoRouteGuard, EvidenceList } from "@/features/demo/client";
import { BrandHeader, DemoBanner, DemoPage, PetStage, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function RevealPage() {
  const persona = DEMO_FIXTURE.persona;
  return (
    <DemoRouteGuard>
      <DemoPage width="max-w-4xl">
        <DemoBanner />
        <BrandHeader step="孵化 3/4" />
        <Surface>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <PetStage name={persona.displayName} species={`${persona.species} · ${persona.archetype}`} title={persona.title} />
            <div>
              <p className="eyebrow">HATCH REVEAL</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-100">这只东西，像你吗？</h1>
              <p className="mt-3 text-base text-amber-100/80">“{persona.catchphrase}”</p>
              <div className="mt-6"><EvidenceList items={persona.highlights} /></div>
              <div className="mt-7 grid gap-3">
                <DemoFlowButton href="/encounter/first?phase=match" stage="FIRST_MATCH_READY">让它出去闻闻</DemoFlowButton>
              </div>
            </div>
          </div>
        </Surface>
      </DemoPage>
    </DemoRouteGuard>
  );
}
