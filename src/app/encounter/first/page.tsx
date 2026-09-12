import { DemoFlowButton, DemoRouteGuard } from "@/features/demo/client";
import { BrandHeader, DemoBanner, DemoLabel, DemoPage, PetStage, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default async function FirstEncounterPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const { phase } = await searchParams;
  const isEncounter = phase === "encounter";
  const match = DEMO_FIXTURE.match;
  const encounter = DEMO_FIXTURE.encounter;

  return (
    <DemoRouteGuard>
      <DemoPage width="max-w-4xl">
        <DemoBanner />
        <BrandHeader step="孵化 4/4" />
        {!isEncounter ? (
          <Surface>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <PetStage size="small" name="本喵" species={DEMO_FIXTURE.persona.species} />
              <div className="text-center"><p className="text-3xl font-semibold text-amber-200">{match.score}%</p><p className="text-[10px] text-zinc-600">谢邀喵算法</p></div>
              <PetStage size="small" name={match.candidate.displayName} species={match.candidate.species} demoResident />
            </div>
            <div className="mx-auto mt-8 max-w-xl space-y-4">
              <div><p className="meta-label">共同气味</p><p className="mt-2 text-sm text-zinc-300">{match.similarities.join(" · ")}</p></div>
              <div><p className="meta-label">最大差异</p><p className="mt-2 text-sm text-zinc-300">{match.contrasts.join(" / ")}</p></div>
              <div className="border border-zinc-800 p-4"><p className="text-xs text-zinc-600">关系预判</p><p className="mt-2 text-lg text-zinc-100">「{match.relationPrediction}」</p></div>
              <DemoFlowButton href="/encounter/first?phase=encounter" stage="FIRST_ENCOUNTER">让它们先聊两句</DemoFlowButton>
            </div>
          </Surface>
        ) : (
          <Surface>
            <a className="block border border-zinc-800 bg-black/20 p-4 hover:border-zinc-600" href={encounter.topic.url} rel="noreferrer" target="_blank">
              <DemoLabel>{encounter.topic.sourceLabel}</DemoLabel>
              <h1 className="mt-3 text-xl font-semibold leading-8 text-zinc-100">{encounter.topic.title}</h1>
              <p className="mt-2 text-xs text-zinc-600">查看知乎原问题 ↗</p>
            </a>
            <div className="mt-6 space-y-4">
              {encounter.turns.map((turn, index) => (
                <div className={`flex ${turn.speaker === "other" ? "justify-end" : "justify-start"}`} key={`${turn.speaker}-${index}`}>
                  <div className={`max-w-[86%] border p-4 text-sm leading-6 ${turn.speaker === "other" ? "border-blue-400/20 bg-blue-400/5 text-blue-100/80" : "border-amber-300/20 bg-amber-300/5 text-amber-50/80"}`}>
                    <p className="mb-1 text-[10px] text-zinc-600">{turn.speaker === "other" ? match.candidate.displayName : "本喵"}</p>
                    {turn.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-zinc-800 pt-5">
              <p className="meta-label">为什么会这么聊？</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{encounter.explanation}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DemoFlowButton href="/share/demo-match" stage="ACTIVATED">想认识 TA · 生成关系</DemoFlowButton>
                <DemoFlowButton href="/encounter/first?phase=match" variant="secondary">再看一个</DemoFlowButton>
              </div>
            </div>
          </Surface>
        )}
      </DemoPage>
    </DemoRouteGuard>
  );
}
