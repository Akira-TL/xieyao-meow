import { BrandHeader, DemoBanner, DemoPage, Surface } from "@/features/demo/components";

export default function PrivacyPage() {
  return (
    <DemoPage>
      <DemoBanner />
      <BrandHeader />
      <Surface>
        <p className="eyebrow">DATA BOUNDARY</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">我们只需要能解释人格的公开 Context。</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-500">
          <p>目标正式版只读取公开创作、关注、公开收藏/收藏夹，用来生成知乎成分、Persona 与匹配解释。</p>
          <p>不读取私信、手机号、邮箱，也不自动代表用户向知乎发布内容或给真人发消息。</p>
          <p>当前低保真版本只使用明确标记的 DEMO fixture，不会读取你的真实知乎账号。</p>
        </div>
      </Surface>
    </DemoPage>
  );
}
