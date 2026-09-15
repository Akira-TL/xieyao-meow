import { DemoRouteGuard } from "@/features/demo/client";
import { ActivationHeader, DemoPage } from "@/features/demo/components";
import { EncounterPlayback, FirstMatchInteraction } from "@/features/demo/interaction-client";

export default async function FirstEncounterPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const { phase } = await searchParams;
  const isEncounter = phase === "encounter";

  return (
    <DemoRouteGuard>
      <DemoPage scene="encounter" activation>
        <ActivationHeader current={isEncounter ? 6 : 5} />
        <section className="first-encounter-stage">
          {isEncounter ? (
            <>
              <p className="stage-caption">SCENE 06 · 对手戏：两种不同的思考方式，在同一个真实问题上相遇</p>
              <EncounterPlayback />
            </>
          ) : (
            <FirstMatchInteraction />
          )}
        </section>
      </DemoPage>
    </DemoRouteGuard>
  );
}
