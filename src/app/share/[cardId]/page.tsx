import { DemoFlowButton } from "@/features/demo/client";
import {
  DemoPage,
  PublicHeader,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";
import { ShareRelationshipVisual, ShareSceneButton } from "@/features/demo/interaction-client";

export default function SharePage() {
  return (
    <DemoPage scene="encounter">
      <PublicHeader right={<span className="public-kicker">SCENE 07 · 第一段关系成立</span>} />
      <section className="share-stage">
        <p className="stage-caption">SCENE 07 · 第一次相遇 · 第一段关系成立</p>
        <h1>第一段关系，<br />已经<span>成立</span>。</h1>

        <div className="share-relationship-visual">
          <div className="share-actors">
            <ShareRelationshipVisual />
          </div>
          <div className="share-polaroid">
            <div className="share-polaroid-frame">
              <ShareRelationshipVisual compact />
            </div>
            <strong>第一段关系，已经成立。</strong>
          </div>
        </div>

        <div className="relationship-beliefs">
          <article><b>⚙</b><strong>都相信技术是人的延伸</strong><span>用工具放大善意，让好奇走得更远。</span></article>
          <article><b>♥</b><strong>对问题有长期耐心</strong><span>相信时间会给出更好的答案。</span></article>
          <article><b>◆</b><strong>一理一感刚好互补</strong><span>理性的思考，感性的温度，让世界更完整。</span></article>
        </div>

        <p className="share-pair">工具猫 × {DEMO_FIXTURE.match.candidate.displayName}<br /><span>从不同的角度，看见更大的世界。</span></p>

        <div className="share-actions">
          <ShareSceneButton />
          <DemoFlowButton href="/home" stage="ACTIVATED">回我的窝</DemoFlowButton>
        </div>
      </section>
    </DemoPage>
  );
}
