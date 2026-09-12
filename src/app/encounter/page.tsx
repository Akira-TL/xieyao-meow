import Link from "next/link";

import { DemoRouteGuard } from "@/features/demo/client";
import {
  AppBottomNav,
  BrandHeader,
  DemoBanner,
  DemoLabel,
  DemoPage,
  PetStage,
  Surface,
} from "@/features/demo/components";
import { DEMO_FIXTURE } from "@/features/demo/fixtures";

export default async function EncounterHubPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; demo?: string }>;
}) {
  const { view, demo } = await searchParams;
  const showFeatured = view === "featured" || demo === "relationship";

  return (
    <DemoRouteGuard>
      <DemoPage>
        <DemoBanner />
        <BrandHeader />
        <Surface>
          {showFeatured ? <DailyEncounter /> : <EncounterHub />}
        </Surface>
        <AppBottomNav active="encounter" />
      </DemoPage>
    </DemoRouteGuard>
  );
}

function EncounterHub() {
  return (
    <>
      <p className="eyebrow">ENCOUNTER / MET ON THE ROAD</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">上次它出去时，遇见了齿轮。</h1>
      <div className="mt-6 grid gap-6 border border-zinc-800 bg-black/20 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <PetStage
          size="small"
          name={DEMO_FIXTURE.match.candidate.displayName}
          species={DEMO_FIXTURE.match.candidate.species}
          demoResident
        />
        <div>
          <p className="text-3xl font-semibold text-amber-200">82% 同频</p>
          <p className="mt-2 text-sm text-zinc-500">AI / 科学 · 最大差异：表达直接度</p>
          <Link
            className="mt-4 inline-flex min-h-12 items-center justify-center bg-amber-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
            href="/encounter?view=featured"
          >
            让它们先聊
          </Link>
        </div>
      </div>
      <div className="mt-7">
        <p className="meta-label">最近关系</p>
        <div className="mt-3 space-y-2">
          {DEMO_FIXTURE.atlas.relationships.map((relationship) => (
            <div
              className="flex items-center justify-between border border-zinc-800 px-4 py-3 text-sm"
              key={relationship.name}
            >
              <span className="text-zinc-200">{relationship.name}</span>
              <span className="text-zinc-600">{relationship.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DailyEncounter() {
  const encounter = DEMO_FIXTURE.encounter;
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">DAILY ENCOUNTER</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">齿轮又来抬杠了。</h1>
        </div>
        <Link className="text-xs text-zinc-600 hover:text-zinc-200" href="/encounter">
          返回关系簿
        </Link>
      </div>
      <a
        className="mt-6 block border border-zinc-800 bg-black/20 p-4 hover:border-zinc-600"
        href={encounter.topic.url}
        rel="noreferrer"
        target="_blank"
      >
        <DemoLabel>{encounter.topic.sourceLabel}</DemoLabel>
        <p className="mt-3 text-sm font-medium leading-6 text-zinc-200">{encounter.topic.title}</p>
      </a>
      <div className="mt-5 space-y-3">
        {encounter.turns.slice(0, 2).map((turn, index) => (
          <div
            className={`max-w-[88%] border p-4 text-sm leading-6 ${
              turn.speaker === "other"
                ? "ml-auto border-blue-400/20 bg-blue-400/5 text-blue-100/80"
                : "border-amber-300/20 bg-amber-300/5 text-amber-50/80"
            }`}
            key={`${turn.speaker}-${index}`}
          >
            <p className="mb-1 text-[10px] text-zinc-600">
              {turn.speaker === "other" ? DEMO_FIXTURE.match.candidate.displayName : "本喵"}
            </p>
            {turn.text}
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-zinc-800 pt-4 text-xs leading-5 text-zinc-600">
        日常 Encounter 与首访 `/encounter/first` 分离；这里后续接真实 Relationship / Event 数据。
      </p>
    </>
  );
}
