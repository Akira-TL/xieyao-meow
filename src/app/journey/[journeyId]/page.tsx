import { DemoRouteGuard } from "@/features/demo/client";
import {
  AppBottomNav,
  AppHeader,
  ArtSlot,
  DemoPage,
  PaperCard,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function JourneyDetailPage() {
  const artifact = DEMO_FIXTURE.outing.returnArtifact;
  return (
    <DemoRouteGuard>
      <DemoPage scene="archive">
          <AppHeader active="explore" />
        <section className="journey-detail-stage">
          <aside className="journey-side-nav">
            <a href="/explore?mode=app">⌂ 探索首页</a>
            <strong>▣ 旅途详情</strong>
            <a href="/atlas">▤ 收集图鉴</a>
            <a href="/encounter">◎ 喵的足迹</a>
          </aside>

          <div className="journey-main">
            <PaperCard className="journey-title-paper">
              <span>{artifact.label}</span>
              <h1><em>它</em>为什么去了那里？</h1>
              <blockquote>“因为这个问题，值得被更多人认真讨论。”</blockquote>
              <div className="journey-meta">
                <span>目的地 <b>数字生活馆</b></span>
                <span>出发时间 <b>2026.09.12</b></span>
                <span>随行装备 <b>好奇心 × 1</b></span>
              </div>
            </PaperCard>

            <div className="journey-art-and-topic">
              <ArtSlot name="journey/persona-travelling" label="本喵旅途中" aspect="portrait" />
              <PaperCard className="journey-topic-paper">
                <span>带回的问题 · 知乎</span>
                <h2>{artifact.topic.title}</h2>
                <p>AI 能完成越来越多的工作，人类会从重复劳动中解放出来，还是会陷入新的依赖？</p>
                <a href={artifact.topic.url} rel="noreferrer" target="_blank">在知乎，看看大家怎么说 →</a>
              </PaperCard>
            </div>

            <PaperCard className="journey-timeline-paper">
              <h2>旅途轨迹</h2>
              <div className="journey-timeline">
                <span><b>出门</b><small>带着好奇心走进数字生活馆</small></span>
                <i>→</i>
                <span><b>路过的话题</b><small>看到了很多关于 AI 与未来的讨论</small></span>
                <i>→</i>
                <span><b>停下来的原因</b><small>“这个问题让我停下脚步。”</small></span>
                <i>→</i>
                <span><b>带回的问题</b><small>{artifact.topic.title}</small></span>
              </div>
            </PaperCard>

            <div className="journey-gallery-and-why">
              <div>
                <h2>路上的一些画面</h2>
                <div className="journey-gallery">
                  <ArtSlot name="journey/photo-01" label="旅途照片 01" aspect="polaroid" />
                  <ArtSlot name="journey/photo-02" label="旅途照片 02" aspect="polaroid" />
                  <ArtSlot name="journey/photo-03" label="旅途照片 03" aspect="polaroid" />
                </div>
              </div>
              <PaperCard>
                <h2>本喵为什么把这个带给你？</h2>
                <p>因为我发现，这个问题不只有技术的答案，更关乎每一个普通人的生活。它让我重新思考：我们想要怎样的未来？</p>
                <p>而这个思考，值得你也来一起加入。</p>
              </PaperCard>
            </div>

            <a className="theatre-button theatre-button-primary journey-collect" href="/atlas">收进图鉴 <span>→</span></a>
          </div>
        </section>
        <AppBottomNav active="explore" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
