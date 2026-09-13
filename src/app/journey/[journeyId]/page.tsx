import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { LiveJourneyDetail } from "@/features/demo/live/daily-live-client";

export default function JourneyDetailPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="archive">
        <AppHeader active="explore" />
        <LiveJourneyDetail />
        <AppBottomNav active="explore" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
