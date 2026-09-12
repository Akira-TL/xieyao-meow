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

export default function RelationshipDetailPage() {
  const candidate = DEMO_FIXTURE.match.candidate;
  return (
    <DemoRouteGuard>
      <DemoPage scene="encounter">
        <DemoBanner />
        <AppHeader active="encounter" />
        <section className="relationship-detail-stage">
          <p className="stage-caption">关系详情 · ANOTHER YOU, A KINDER WORLD</p>
          <h1>你们为什么<br />总会聊到<span>深夜</span>？</h1>
          <p className="relationship-subtitle">不同的视角，刚好拼出更大的世界。</p>

          <div className="relationship-pair-stage">
            <div>
              <ArtSlot name="relationship/self" label="工具猫" aspect="portrait" />
              <strong>工具猫</strong><span>AI × 知识 × 理性</span>
            </div>
            <i>♡</i>
            <div>
              <ArtSlot name="relationship/other" label={candidate.displayName} aspect="portrait" />
              <strong>{candidate.displayName}</strong><span>人文 × 思考 × 生活</span>
            </div>
          </div>

          <PaperCard className="relationship-status-card">
            <h2>我们的关系</h2>
            <strong>边吵边加好友</strong>
            <blockquote>“不同，但刚好合拍。”</blockquote>
            <p>我们常常观点不同，也会争得面红耳赤，但每次对话后，都更理解彼此一点。</p>
          </PaperCard>

          <div className="relationship-detail-grid">
            <PaperCard>
              <h2>关系时间线</h2>
              <ol className="relationship-timeline">
                <li><b>第一次相遇</b><span>在「AI 会让人类更自由吗？」下相遇</span></li>
                <li><b>第一次对手戏</b><span>关于「效率与意义」展开激烈讨论</span></li>
                <li><b>昨晚来过</b><span>一起聊到深夜，从工具聊到人生</span></li>
                <li className="is-current"><b>最新关系变化</b><span>达成共识：保持不同，但继续对话</span></li>
              </ol>
            </PaperCard>

            <PaperCard>
              <h2>我们都关心</h2>
              <div className="relationship-topic-tags">
                <span>AI 与未来</span><span>人的意义</span><span>学习方法</span><span>创造与表达</span><span>城市与生活</span>
              </div>
              <h2 className="relationship-difference-heading">我们也不一样</h2>
              <div className="relationship-difference">
                <span><b>工具猫</b>更偏理性</span>
                <span><b>{candidate.displayName}</b>更偏感性</span>
              </div>
              <p className="relationship-note">不同，才有更多的对话。</p>
            </PaperCard>

            <PaperCard className="relationship-latest-scene">
              <h2>最新一幕</h2>
              <ArtSlot name="relationship/latest-scene" label="昨晚最新一幕" aspect="wide" />
              <h3>“效率重要，但生活的意义可能更重要？”</h3>
              <p>关于「用 AI 提高效率后，我们该怎样使用多出来的时间？」我们聊了很久……</p>
              <a href="/encounter?demo=relationship">看最新一幕 →</a>
            </PaperCard>
          </div>

          <a className="theatre-button theatre-button-primary relationship-back" href="/encounter">回到遇见 <span>→</span></a>
        </section>
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
