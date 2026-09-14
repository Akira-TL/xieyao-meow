import { LandingActions } from "@/features/demo/client";
import {
  DemoPage,
  KanshanPlaceholder,
  PersonaEgg,
  PublicHeader,
} from "@/features/demo/components";
import { LiveLandingSignal } from "@/features/demo/live/daily-live-client";

function LandingVisual() {
  return (
    <div className="landing-visual landing-visual--scene" aria-label="人格蛋与刘看山主视觉">
      <div className="landing-stage-cast">
        <PersonaEgg />
        <div className="landing-guide">
          <span className="landing-bubble">要孵化吗？</span>
          <KanshanPlaceholder action="wave" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <DemoPage scene="landing" sceneOverlay={<LandingVisual />}>
      <PublicHeader right={<span className="public-kicker">知乎 × 谢邀喵 · AI 数字人格</span>} />
      <section className="landing-stage">
        <div className="landing-copy">
          <p className="stage-caption">知乎 × 谢邀喵 · AI 数字人格</p>
          <h1>
            你在<span>知乎</span>留下的足迹，<br />
            会长成一只<br />
            <span>继续生活</span>的猫。
          </h1>
          <p className="landing-handwriting">它会替你逛知乎，也会认识别人的猫。</p>
          <p className="landing-detail">用你的公开创作、关注与收藏孵化一个有长期兴趣和表达方式的 AI 数字人格。它会自主出门，围绕真实知乎问题形成经历，把新的问题、观点和关系带回家。</p>
        </div>

        <div className="landing-actions">
          <LandingActions />
          <LiveLandingSignal />
        </div>
      </section>
    </DemoPage>
  );
}
