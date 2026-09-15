import { DemoRouteGuard } from "@/features/demo/client";
import { AppBottomNav, AppHeader, DemoPage } from "@/features/demo/components";
import { NpcRelationshipDetail } from "@/features/demo/live/npc-relationship-client";

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
        <NpcRelationshipDetail relationshipId={relationshipId} />
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
