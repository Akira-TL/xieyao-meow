import { DemoRouteGuard } from "@/features/demo/client";
import {
  AppBottomNav,
  AppHeader,
  ArtSlot,
  DemoBanner,
  DemoPage,
  PaperCard,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function AtlasPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="archive">
        <DemoBanner />
        <AppHeader active="atlas" />
        <section className="atlas-stage">
          <div className="atlas-hero-copy">
            <p className="stage-caption">ARCHIVE · PERSONA HISTORY</p>
            <h1>它的故事，<br />也是<span>你的</span><br />另一种履历。</h1>
            <p>在这里，遇见一个更完整的它，也遇见一直好奇的你。</p>
          </div>

          <PaperCard className="atlas-persona-card">
            <span>当前人格 · CURRENT PERSONA</span>
            <ArtSlot name="atlas/current-persona" label="当前人格 / 英短工具猫" aspect="portrait" />
            <h2>{DEMO_FIXTURE.persona.species}</h2>
            <h3>{DEMO_FIXTURE.persona.archetype.toUpperCase()} · {DEMO_FIXTURE.persona.title}</h3>
            <blockquote>“{DEMO_FIXTURE.persona.catchphrase}”</blockquote>
            <div className="atlas-tags">
              {DEMO_FIXTURE.persona.highlights.map((item) => <span key={item.label}>{item.value}</span>)}
            </div>
          </PaperCard>

          <div className="atlas-grid">
            <PaperCard>
              <div className="section-heading-row"><h2>最近变化</h2><a href="#history">查看全部 →</a></div>
              <div className="atlas-change-list">
                <p>03.08　获得新称号「盐选级工具猫」</p>
                <p>03.06　关注了「AI 与生产力」话题</p>
                <p>03.03　解锁了新城市「上海」</p>
              </div>
            </PaperCard>
            <PaperCard>
              <div className="section-heading-row"><h2>旅途收藏</h2><a href="/journey/demo-note-014">查看全部 →</a></div>
              <div className="atlas-stats"><b>28<small>收集的回答</small></b><b>12<small>收藏的想法</small></b><b>6<small>去过的城市</small></b><b>32<small>标记的问题</small></b></div>
              <ArtSlot name="atlas/journey-collection" label="旅途收藏快照" aspect="wide" />
            </PaperCard>
          </div>

          <div className="atlas-grid atlas-grid-bottom">
            <PaperCard>
              <div className="section-heading-row"><h2>关系图鉴</h2><a href="/encounter">查看全部 →</a></div>
              <div className="atlas-relationship-polaroids">
                {DEMO_FIXTURE.atlas.relationships.map((item, index) => (
                  <a href={`/relationship/${index === 0 ? "gear" : "neighbor"}`} key={item.name}>
                    <ArtSlot name={`atlas/relation-${index + 1}`} label={item.name} aspect="polaroid" />
                    <span>{item.status}</span>
                  </a>
                ))}
              </div>
            </PaperCard>
            <PaperCard id="history">
              <div className="section-heading-row"><h2>人格历史</h2><span>PERSONA HISTORY</span></div>
              <div className="persona-history-flow">
                <article><b>好奇新手</b><span>Lv.1 · 2024.10</span></article>
                <i>→</i>
                <article><b>思考者</b><span>Lv.5 · 2024.12</span></article>
                <i>→</i>
                <article className="is-current"><b>盐选级工具猫</b><span>Lv.8 · 当前</span></article>
              </div>
            </PaperCard>
          </div>
        </section>
        <AppBottomNav active="atlas" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
