import { LandingActions } from "@/features/demo/client";
import {
  DemoPage,
  PersonaArt,
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
          <PersonaArt
            alt="人格蛋旁的谢邀喵向导"
            className="landing-guide-persona"
            persona={{ visualVariant: "analyst-black" }}
            state="thinking"
          />
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
            你在<span>知乎</span>这些年，<br />
            其实已经偷偷<br />
            养出了一只<span>东西</span>。
          </h1>
          <p className="landing-handwriting">每一个认真提问的人，都值得被看见。</p>
          <p className="landing-detail">它由你的公开创作、关注与收藏长出来。不是复制你，而是把长期留下的兴趣与表达方式，孵化成一只会继续逛知乎、带回问题、也会认识别人的 AI 数字人格。</p>
        </div>

        <div className="landing-actions">
          <LandingActions />
          <LiveLandingSignal />
        </div>
      </section>
    </DemoPage>
  );
}
