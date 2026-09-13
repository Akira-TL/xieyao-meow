import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { LiveRelationshipDetail } from "@/features/demo/live/daily-live-client";

export default async function RelationshipDetailPage({
  params,
}: {
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;

  return (
    <DemoRouteGuard>
      <DemoPage scene="encounter">
        <AppHeader active="encounter" />
        <LiveRelationshipDetail relationshipId={relationshipId} />
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
