import Link from "next/link";
import { DemoRouteGuard, ResetDemoButton } from "@/features/demo/client";
import { AppBottomNav, BrandHeader, DemoBanner, DemoPage, GrowthStrip, PetStage, Surface } from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default function HomePage() {
  const home = DEMO_FIXTURE.home;
  return (
    <DemoRouteGuard>
      <DemoPage>
        <DemoBanner />
        <BrandHeader right={<ResetDemoButton />} />
        <Surface>
          <PetStage name="本喵" species={`${DEMO_FIXTURE.persona.species} · ${DEMO_FIXTURE.persona.archetype}`} title={DEMO_FIXTURE.persona.title} />
          <p className="mt-3 text-center text-sm text-zinc-500">今天状态：{home.mood}</p>
          <Link className="mt-7 block border border-amber-300/20 bg-amber-300/5 p-5 transition hover:border-amber-300/40" href={home.heroEvent.target}>
            <p className="text-[10px] tracking-[0.14em] text-amber-200/60">今天最值得看的一件事</p>
            <h1 className="mt-2 text-xl font-semibold text-zinc-100">{home.heroEvent.headline}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{home.heroEvent.detail}</p>
            <p className="mt-4 text-xs text-amber-200/70">去看看 →</p>
          </Link>
          <div className="mt-5"><GrowthStrip knowledge={home.growth.knowledge} expression={home.growth.expression} social={home.growth.social} /></div>
        </Surface>
        <AppBottomNav active="home" />
      </DemoPage>
    </DemoRouteGuard>
  );
}
