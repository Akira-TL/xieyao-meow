import { DemoRouteGuard, DemoScanningFlow } from "@/features/demo/client";
import { BrandHeader, DemoBanner, DemoPage, PersonaEgg, Surface } from "@/features/demo/components";

export default function ScanningPage() {
  return (
    <DemoRouteGuard>
      <DemoPage>
        <DemoBanner />
        <BrandHeader step="孵化 2/4" />
        <Surface>
          <div className="mb-8 flex justify-center"><PersonaEgg /></div>
          <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-100">正在做人格化验</h1>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-zinc-600">
            不是普通 Loading：每一条“发现”只有对应来源完成后才出现。
          </p>
          <div className="mx-auto mt-7 max-w-xl"><DemoScanningFlow /></div>
        </Surface>
      </DemoPage>
    </DemoRouteGuard>
  );
}
