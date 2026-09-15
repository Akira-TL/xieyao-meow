import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { SharedEncounterPanel } from "@/features/demo/live/shared-encounter-client";

export default async function EncounterHubPage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string }>;
}) {
  const { scene } = await searchParams;

  return (
    <DemoRouteGuard>
      <DemoPage scene="encounter">
        <AppHeader active="encounter" />
        <section className="encounter-hub-stage">
          <SharedEncounterPanel selectedSceneId={scene ?? null} />
        </section>
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
