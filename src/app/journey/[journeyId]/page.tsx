import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { LiveJourneyDetail } from "@/features/demo/live/daily-live-client";

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const { journeyId } = await params;

  return (
    <DemoRouteGuard>
      <DemoPage scene="archive">
        <AppHeader active="explore" />
        <LiveJourneyDetail journeyId={journeyId} />
        <AppBottomNav active="explore" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
