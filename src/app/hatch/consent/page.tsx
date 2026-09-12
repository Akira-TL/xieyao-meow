import { DemoFlowButton, DemoRouteGuard } from "@/features/demo/client";
import { BrandHeader, DemoBanner, DemoPage, PageTitle, Surface } from "@/features/demo/components";

export default function ConsentPage() {
  return (
    <DemoRouteGuard>
      <DemoPage>
        <DemoBanner />
        <BrandHeader step="孵化 1/4" />
        <Surface>
          <PageTitle
            eyebrow="CONSENT"
            title="孵化需要一点你的知乎成分。"
            detail="正式版会在这里解释真实 OAuth 权限；当前低保真流程只使用 DEMO fixture。"
          />
          <div className="space-y-3">
            {[
              ["公开创作", "理解你的表达方式"],
              ["关注", "理解你的长期兴趣方向"],
              ["公开收藏 / 收藏夹", "理解你反复保存的主题"],
            ].map(([name, reason]) => (
              <div className="flex items-start gap-3 border border-zinc-800 bg-black/20 p-4" key={name}>
                <span className="mt-0.5 text-amber-200">✓</span>
                <div>
                  <p className="text-sm text-zinc-200">{name}</p>
                  <p className="mt-1 text-xs text-zinc-600">{reason}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border border-zinc-800 p-4 text-xs leading-6 text-zinc-500">
            不读取私信、手机号或邮箱；不替你自动发布内容。
          </div>
          <div className="mt-7 grid gap-3">
            <DemoFlowButton href="/hatch/scanning" stage="PROFILE_SCANNING">用知乎孵化我的分身</DemoFlowButton>
            <a className="text-center text-xs text-zinc-600 hover:text-zinc-300" href="/privacy">查看数据边界</a>
          </div>
        </Surface>
      </DemoPage>
    </DemoRouteGuard>
  );
}
