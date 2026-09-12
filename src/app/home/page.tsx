import { DemoRouteGuard, ResetDemoButton } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoBanner, DemoPage } from "@/features/demo/components";
import { DemoOutingHome } from "@/features/demo/outing-client";

export default function HomePage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="default">
        <DemoBanner />
        <AppHeader active="home" right={<ResetDemoButton />} />
        <section className="app-stage-shell">
          <DemoOutingHome />
        </section>
        <AppBottomNav active="home" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
