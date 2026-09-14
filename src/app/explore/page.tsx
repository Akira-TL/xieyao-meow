import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage, PublicHeader } from "@/features/demo/components";
import { LiveExploreSection } from "@/features/demo/live/daily-live-client";

function ExploreContent({ appMode }: { appMode: boolean }) {
  return (
    <DemoPage scene={appMode ? "default" : "encounter"}>
      {appMode ? <AppHeader active="explore" /> : <PublicHeader right={<span className="public-kicker">PUBLIC EXPLORE</span>} />}
      <LiveExploreSection appMode={appMode} />
      {appMode ? <AppBottomNav active="explore" /> : null}
    </DemoPage>
  );
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const appMode = mode === "app";
  return appMode ? <DemoRouteGuard><ExploreContent appMode /></DemoRouteGuard> : <ExploreContent appMode={false} />;
}
