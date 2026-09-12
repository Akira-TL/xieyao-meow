import { DemoRouteGuard, ResetDemoButton } from "@/features/demo/client";
import { AppBottomNav, BrandHeader, DemoBanner, DemoPage, Surface } from "@/features/demo/components";
import { DemoOutingHome } from "@/features/demo/outing-client";

export default function HomePage() {
  return (
    <DemoRouteGuard>
      <DemoPage>
        <DemoBanner />
        <BrandHeader right={<ResetDemoButton />} />
        <Surface>
          <DemoOutingHome />
        </Surface>
        <AppBottomNav active="home" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
