import { DemoRouteGuard } from "@/features/demo/client";
import {
  ActivationHeader,
  DemoPage,
} from "@/features/demo/components";
import { LiveScanningFlow, ScanningStageVisual } from "@/features/demo/live-client";

export default function ScanningPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="casting" activation sceneOverlay={<ScanningStageVisual />}>
        <ActivationHeader current={3} />
        <section className="scanning-layout">
          <div className="scanning-hero">
            <p className="stage-caption">ACT 02 · CASTING · 正在扫描你的知乎宇宙</p>
            <h1>正在读取<br />你的<span>知乎</span>宇宙…</h1>
            <p className="scanning-handwriting">别急，它还在壳里梳理你留下的所有线索。</p>
          </div>
          <div className="scanning-cues-panel">
            <LiveScanningFlow />
          </div>
        </section>
      </DemoPage>
    </DemoRouteGuard>
  );
}
