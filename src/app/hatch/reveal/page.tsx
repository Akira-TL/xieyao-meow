import { DemoRouteGuard } from "@/features/demo/client";
import { ActivationHeader, DemoPage } from "@/features/demo/components";
import { LiveRevealPanel } from "@/features/demo/live-client";

export default function RevealPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="reveal" activation>
        <ActivationHeader current={4} />
        <LiveRevealPanel />
      </DemoPage>
    </DemoRouteGuard>
  );
}
