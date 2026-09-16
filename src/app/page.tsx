import { redirect } from "next/navigation";

import { LandingActions } from "@/features/demo/client";
import {
  DemoPage,
  KanshanPlaceholder,
  PersonaEgg,
  PublicHeader,
} from "@/features/demo/components";
import { LiveLandingSignal } from "@/features/demo/live/daily-live-client";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getSharedEncounterStore } from "@/lib/social/runtime";

function LandingVisual() {
  return (
    <div className="landing-visual landing-visual--scene" aria-label="人格蛋与刘看山主视觉">
      <div className="landing-stage-cast">
        <PersonaEgg />
        <div className="landing-guide">
          <span className="landing-bubble">要开幕吗？</span>
          <KanshanPlaceholder action="wave" className="landing-guide-persona" />
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  if (process.env.NODE_ENV === "production") {
    const identity = await getRequestOAuthIdentity();
    if (identity && getSharedEncounterStore().getPersonaSnapshot(identity.userId)) {
      redirect("/home");
    }
  }

  return (
    <DemoPage scene="landing" sceneOverlay={<LandingVisual />}>
      <PublicHeader right={<span className="public-kicker">知乎 × 谢邀喵 · AI 数字人格</span>} />
      <section className="landing-stage">
        <div className="landing-copy">
          <p className="stage-caption">知乎 × 谢邀喵 · AI 数字人格</p>
          <h1 className="target-lock-title">
            <span className="target-title-line">你在<em>知乎</em>这些年，</span>
            <span className="target-title-line">其实已经悄悄</span>
            <span className="target-title-line">养出了一只<em>小东西</em>。</span>
          </h1>
          <p className="landing-handwriting">每一个认真提问的人，都值得被看见。</p>
          <p className="landing-detail">它从你的公开创作、关注与收藏中生长而来。不是复制你，而是将你长期沉淀的兴趣与表达习惯，孵化成一只会自主逛知乎、带回问题、也会遇见同类的 AI 数字人格。</p>
        </div>

        <div className="landing-actions">
          <LandingActions />
          <LiveLandingSignal />
        </div>
      </section>
    </DemoPage>
  );
}
