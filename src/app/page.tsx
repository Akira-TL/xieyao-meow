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
          <span className="landing-bubble">要开幕吗？</span>
          <KanshanPlaceholder action="wave" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <DemoPage scene="landing" sceneOverlay={<LandingVisual />}>
      <PublicHeader right={<span className="public-kicker">知乎 × 谢邀喵 · 人格剧场</span>} />
      <section className="landing-stage">
        <div className="landing-copy">
          <p className="stage-caption">知乎 × 谢邀喵 · 每一个认真提问的人都值得被看见</p>
          <h1>
            你在<span>知乎</span>这些年<br />
            其实已经偷偷<br />
            养出了一只<span>东西</span>。
          </h1>
          <p className="landing-handwriting">每一个问题，都是一颗种子。</p>
          <p className="landing-detail">从提问到思考，从讨论到创造，你已经悄悄养出了一只独一无二的东西。</p>
        </div>

        <div className="landing-actions">
          <LandingActions />
          <LiveLandingSignal />
        </div>
      </section>
    </DemoPage>
  );
}
