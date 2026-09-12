import { DemoFlowButton } from "@/features/demo/client";
import { BrandHeader, DemoBanner, DemoPage, PetStage, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function SharePage() {
  const { relationship } = DEMO_FIXTURE.encounter;
  return (
    <DemoPage>
      <DemoBanner />
      <BrandHeader />
      <Surface>
        <p className="eyebrow">FIRST RELATIONSHIP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">你们已经留下第一段关系。</h1>
        <div className="mt-8 grid grid-cols-2 gap-6">
          <PetStage size="small" name="本喵" species={DEMO_FIXTURE.persona.species} />
          <PetStage size="small" name={DEMO_FIXTURE.match.candidate.displayName} species={DEMO_FIXTURE.match.candidate.species} demoResident />
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2 text-center">
          <div className="border border-zinc-800 p-3"><p className="text-[10px] text-zinc-600">关系</p><p className="mt-1 text-sm text-zinc-200">{relationship.status}</p></div>
          <div className="border border-zinc-800 p-3"><p className="text-[10px] text-zinc-600">好感</p><p className="mt-1 text-sm text-zinc-200">+{relationship.affinity}</p></div>
          <div className="border border-zinc-800 p-3"><p className="text-[10px] text-zinc-600">争议</p><p className="mt-1 text-sm text-zinc-200">+{relationship.controversy}</p></div>
        </div>
        <p className="mt-6 text-center text-lg text-zinc-300">「{DEMO_FIXTURE.match.relationPrediction}」</p>
        <div className="mt-7 grid gap-3">
          <DemoFlowButton href="/home" stage="ACTIVATED">回到我的窝</DemoFlowButton>
          <DemoFlowButton href="/hatch/consent" stage="PRE_AUTH" variant="secondary">那你在知乎养出了什么？</DemoFlowButton>
        </div>
      </Surface>
    </DemoPage>
  );
}
