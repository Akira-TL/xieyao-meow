import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { JourneyAtlasPageContent } from "@/features/demo/journey/atlas-client";

export default function AtlasPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="archive">
        <AppHeader active="atlas" />
        <JourneyAtlasPageContent />
        <AppBottomNav active="atlas" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
