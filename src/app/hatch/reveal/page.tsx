import { DemoFlowButton, DemoRouteGuard, EvidenceList } from "@/features/demo/client";
import {
  ActivationHeader,
  DemoBanner,
  DemoPage,
  PetStage,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function RevealPage() {
  const persona = DEMO_FIXTURE.persona;
  return (
    <DemoRouteGuard>
      <DemoPage scene="reveal">
        <DemoBanner />
        <ActivationHeader current={4} />
        <section className="reveal-layout">
          <div className="reveal-title-block">
            <p className="stage-caption">“一个喜欢把复杂问题拆开看的家伙。”</p>
            <h1>{persona.species}</h1>
            <h2>{persona.archetype.toUpperCase()} <span>ENGINEER BRAIN</span></h2>
            <h3>{persona.title}</h3>
          </div>

          <div className="reveal-main">
            <PetStage
              name={persona.displayName}
              species={`${persona.species} · ${persona.archetype}`}
              slot="persona/reveal-main"
            />
            <blockquote>“{persona.catchphrase}”</blockquote>
          </div>

          <div className="reveal-evidence">
            <EvidenceList items={persona.highlights} />
          </div>

          <p className="reveal-manifesto">工具不只是工具，而是通往更大世界的门。</p>

          <div className="reveal-action">
            <DemoFlowButton href="/encounter/first?phase=match" stage="FIRST_MATCH_READY">带它出去闻闻</DemoFlowButton>
          </div>
        </section>
      </DemoPage>
    </DemoRouteGuard>
  );
}
