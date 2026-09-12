import {
  BrandHeader,
  DemoBanner,
  DemoLabel,
  DemoPage,
  KanshanPlaceholder,
  PersonaEgg,
  Surface,
} from "@/features/demo/components";
import { LandingActions } from "@/features/demo/client";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function LandingPage() {
  return (
    <DemoPage>
      <DemoBanner />
      <BrandHeader right={<a className="hover:text-zinc-200" href="/explore?mode=public">先逛逛</a>} />
      <Surface className="min-h-[72vh]">
        <div className="grid min-h-[62vh] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-end justify-center gap-4 lg:order-2">
            <KanshanPlaceholder />
            <PersonaEgg />
          </div>
          <div>
            <DemoLabel>FIRST HOOK</DemoLabel>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.055em] text-zinc-100 sm:text-6xl">
              你在知乎这些年，其实已经偷偷养出了一只东西。
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              你的关注、收藏和创作决定它是什么脾气，也决定它最容易和谁一见如故。
            </p>
            <div className="mt-8">
              <LandingActions />
            </div>
            <div className="mt-8 border-l border-zinc-800 pl-4 text-xs leading-6 text-zinc-500">
              {DEMO_FIXTURE.landing.publicEvent}
            </div>
          </div>
        </div>
      </Surface>
    </DemoPage>
  );
}
