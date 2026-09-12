import { DemoFlowButton, DemoRouteGuard } from "@/features/demo/client";
import {
  AppBottomNav,
  AppHeader,
  ArtSlot,
  DemoBanner,
  DemoPage,
  PaperCard,
  PublicHeader,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

function ExploreContent({ appMode }: { appMode: boolean }) {
  const outing = DEMO_FIXTURE.outing;
  return (
    <DemoPage scene="default">
      <DemoBanner />
      {appMode ? <AppHeader active="explore" /> : <PublicHeader right={<span className="public-kicker">PUBLIC EXPLORE</span>} />}
      <section className="explore-stage">
        <div className="explore-hero-copy">
          <p className="stage-caption">{appMode ? "JOURNEY LOG · 它今天去了哪里" : "PUBLIC EXPLORE · 看看别人养出了什么"}</p>
          <h1>{appMode ? <>它今天去了<br /><span>知乎</span>。</> : <>在这个世界里，<br />问题会让<span>灵魂</span>相遇。</>}</h1>
          <p>{appMode ? "在成千上万的问题里，本喵为你叼回了这些。" : "不同的灵魂，正在这个世界的某个角落认真生活着。"}</p>
        </div>

        <div className="explore-hero-art">
          <ArtSlot name={appMode ? "explore/hero-journey" : "explore/public-world"} label={appMode ? "本喵背包出发 / 知乎入口" : "多个 Persona 在舞台相遇"} aspect="wide" />
        </div>

        <div className="explore-cards">
          {(appMode ? DEMO_FIXTURE.explore.items : DEMO_FIXTURE.explore.items.slice(0, 3)).map((item, index) => (
            <PaperCard className={index === 0 ? "explore-card is-featured" : "explore-card"} key={item.title}>
              <div className="explore-card-number">{String(index + 1).padStart(2, "0")}</div>
              <span className="explore-card-badge">{index === 0 ? "值得一读" : index === 1 ? "有启发" : "很有趣"}</span>
              <h2>{item.title}</h2>
              <p>{index === 0 ? "从工具到伙伴，我们如何与 AI 共处一个更好的未来。" : item.whyPicked}</p>
              <ArtSlot name={`explore/card-${index + 1}`} label={`旅途卡 ${index + 1}`} aspect="wide" />
              <div className="explore-why">
                <b>因为：</b>{item.whyPicked}
              </div>
              {appMode ? (
                <a className="explore-card-link" href={`/journey/demo-note-014?item=${index}`}>看完整航迹 →</a>
              ) : (
                <a className="explore-card-link" href={item.sourceUrl} rel="noreferrer" target="_blank">围观这场讨论 →</a>
              )}
            </PaperCard>
          ))}
        </div>

        {appMode ? (
          <div className="explore-log-strip">
            <strong>{outing.returnArtifact.label}</strong>
            <span>{outing.returnArtifact.places.join(" / ")} · “{outing.returnArtifact.thought}”</span>
            <a href="/journey/demo-note-014">看完整航迹 →</a>
          </div>
        ) : (
          <div className="public-explore-action">
            <DemoFlowButton href="/hatch/consent" stage="PRE_AUTH">我也想养一个</DemoFlowButton>
          </div>
        )}
      </section>
      {appMode ? <AppBottomNav active="explore" /> : null}
    </DemoPage>
  );
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const appMode = mode === "app";
  return appMode ? <DemoRouteGuard><ExploreContent appMode /></DemoRouteGuard> : <ExploreContent appMode={false} />;
}
