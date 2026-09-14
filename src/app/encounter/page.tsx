import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { LiveEncounterSection } from "@/features/demo/live/daily-live-client";
import { SharedEncounterPanel } from "@/features/demo/live/shared-encounter-client";

export default async function EncounterHubPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; demo?: string }>;
}) {
  const { view, demo } = await searchParams;
  const showFeatured = view === "featured" || demo === "relationship";
  const production = process.env.NODE_ENV === "production";

  return (
    <DemoRouteGuard>
      <DemoPage scene="encounter">
        <AppHeader active="encounter" />
        <section className="encounter-hub-stage">
          <SharedEncounterPanel />
          {!production ? <LiveEncounterSection showFeatured={showFeatured} /> : null}
        </section>
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
