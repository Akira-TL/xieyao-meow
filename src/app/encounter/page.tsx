import Link from "next/link";

import { DemoRouteGuard } from "@/features/demo/client";
import {
  AppBottomNav,
  AppHeader,
  ArtSlot,
  DemoPage,
  PaperCard,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default async function EncounterHubPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; demo?: string }>;
}) {
  const { view, demo } = await searchParams;
  const showFeatured = view === "featured" || demo === "relationship";

  return (
    <DemoRouteGuard>
      <DemoPage scene="encounter">
        <AppHeader active="encounter" />
        <section className="encounter-hub-stage">
          {showFeatured ? <DailyEncounter /> : <EncounterHub />}
        </section>
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}

function EncounterHub() {
  const relationships = [
    { name: DEMO_FIXTURE.match.candidate.displayName, score: 92, type: "人文思考者", id: "gear" },
    { name: "程序喵", score: 78, type: "理性｜技术探索者", id: "programmer" },
    { name: "艺术熊", score: 68, type: "审美生活家", id: "artist" },
    { name: "数据鸟", score: 56, type: "理性分析者", id: "data" },
  ];

  return (
    <>
      <div className="encounter-hub-hero">
        <p className="stage-caption">MORE ENCOUNTERS · A KINDER VIEW</p>
        <h1>最近，<br />它<span>遇见</span>了<br />这些有趣的灵魂。</h1>
        <p>不同的问题，让不同的灵魂在这里相遇。每一次对话，都是更大的世界。</p>
        <ArtSlot name="encounter/audience-hero" label="本喵坐在剧场看相遇" aspect="wide" />
      </div>

      <PaperCard className="latest-encounter-card">
        <div className="latest-encounter-art">
          <ArtSlot name="encounter/latest-gear" label="最近相遇 / 哲学狐" aspect="square" />
        </div>
        <div className="latest-encounter-copy">
          <span>最近的相遇 · LATEST ENCOUNTER</span>
          <h2>{DEMO_FIXTURE.match.candidate.displayName}</h2>
          <b>92% 契合度</b>
          <p>我们聊了关于「意义感」的话题，从工作到生活，从焦虑到自由。你总能提出那些让我重新思考的问题。</p>
          <blockquote>“真正重要的问题，往往没有标准答案，但它们让生活更值得。”</blockquote>
          <Link href="/relationship/gear">查看这次对话 →</Link>
        </div>
      </PaperCard>

      <section className="more-encounters">
        <div className="section-heading-row"><h2>更多有趣的灵魂</h2><span>MORE ENCOUNTERS</span></div>
        <div className="relationship-card-grid">
          {relationships.map((item) => (
            <Link className="relationship-mini-card" href={`/relationship/${item.id}`} key={item.id}>
              <ArtSlot name={`encounter/${item.id}`} label={item.name} aspect="avatar" />
              <div><strong>{item.name}</strong><span>{item.type}</span><b>{item.score}%</b></div>
              <small>查看关系 →</small>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function DailyEncounter() {
  const encounter = DEMO_FIXTURE.encounter;
  return (
    <div className="daily-encounter-detail">
      <div className="section-heading-row">
        <div><p className="stage-caption">DAILY ENCOUNTER</p><h1>昨晚，齿轮来过。</h1></div>
        <Link href="/encounter">返回关系簿</Link>
      </div>
      <PaperCard className="daily-topic-paper">
        <span>{encounter.topic.sourceLabel}</span>
        <h2>{encounter.topic.title}</h2>
        <a href={encounter.topic.url} rel="noreferrer" target="_blank">查看知乎原问题 ↗</a>
      </PaperCard>
      <div className="daily-dialogue-stage">
        <ArtSlot name="encounter/daily-self" label="工具猫" aspect="portrait" />
        <div className="daily-dialogue-lines">
          {encounter.turns.map((turn, index) => (
            <p className={turn.speaker === "other" ? "is-other" : ""} key={`${turn.speaker}-${index}`}>
              <b>{turn.speaker === "other" ? DEMO_FIXTURE.match.candidate.displayName : "工具猫"}</b>：{turn.text}
            </p>
          ))}
        </div>
        <ArtSlot name="encounter/daily-other" label={DEMO_FIXTURE.match.candidate.displayName} aspect="portrait" />
      </div>
      <Link className="theatre-button theatre-button-primary daily-relationship-link" href="/relationship/gear">看看这段关系 <span>→</span></Link>
    </div>
  );
}
