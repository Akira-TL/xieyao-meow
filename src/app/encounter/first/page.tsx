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
              <p className="stage-caption">SCENE 06 · 对手戏：两个不同的思考方式，在同一个问题上相遇</p>
              <h1 className="encounter-headline"><span>AI Agent</span> 应该<br />替用户做多少决定？</h1>
              <p className="encounter-subtitle">一场关于「技术、信任与人的边界」的对手戏</p>
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
