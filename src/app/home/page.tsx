import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { DemoOutingHome } from "@/features/demo/outing-client";

export default function HomePage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="default">
        <AppHeader active="home" />
        <section className="app-stage-shell">
          <DemoOutingHome />
        </section>
        <AppBottomNav active="home" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
