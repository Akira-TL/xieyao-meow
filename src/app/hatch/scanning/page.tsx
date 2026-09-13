import { DemoRouteGuard } from "@/features/demo/client";
import {
  ActivationHeader,
  ArtSlot,
  DemoPage,
  PersonaEgg,
} from "@/features/demo/components";
import { LiveScanningFlow } from "@/features/demo/live-client";

export default function ScanningPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="casting" activation>
          <ActivationHeader current={3} />
        <section className="scanning-layout">
          <div className="scanning-hero">
            <p className="stage-caption">ACT 02 · CASTING · 正在扫描你的知乎宇宙</p>
            <h1>正在读取<br />你的<span>知乎</span>宇宙…</h1>
            <p className="scanning-handwriting">Scanning Your Mind.</p>
            <div className="scanning-egg-stage">
              <PersonaEgg />
              <ArtSlot name="official/liukanshan-casting" label="刘看山 / 扫描引导" aspect="avatar" />
            </div>
          </div>
          <div className="scanning-cues-panel">
            <LiveScanningFlow />
          </div>
        </section>
      </DemoPage>
    </DemoRouteGuard>
  );
}
