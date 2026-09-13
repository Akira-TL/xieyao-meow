import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { LiveAtlasSection } from "@/features/demo/live/daily-live-client";

export default function AtlasPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="archive">
        <AppHeader active="atlas" />
        <LiveAtlasSection />
        <AppBottomNav active="atlas" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
