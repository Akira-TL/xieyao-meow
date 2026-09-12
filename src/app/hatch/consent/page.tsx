import { DemoFlowButton, DemoRouteGuard } from "@/features/demo/client";
import {
  ActivationHeader,
  DemoBanner,
  DemoPage,
  KanshanPlaceholder,
  PaperCard,
} from "@/features/demo/components";
import { BottomSheet } from "@/features/demo/interaction-client";

const permissions = [
  ["公开创作", "理解你的表达方式", "读取你公开的回答、文章、想法等，用于分析语言风格、思考方式与观点特征。"],
  ["关注", "理解你的长期兴趣", "读取你公开关注的专栏、话题、用户等，了解持续关注的领域与兴趣方向。"],
  ["公开收藏", "理解你真正留下什么", "读取你公开收藏的内容，发现反复认可的知识、观点与价值取向。"],
] as const;

export default function ConsentPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="default">
        <DemoBanner />
        <ActivationHeader current={2} />
        <section className="consent-layout">
          <div className="consent-intro">
            <p className="stage-caption">ACT 01 · PERMISSION</p>
            <h1>孵化需要一点<br />你的<span>知乎</span>成分。</h1>
            <p>这些公开内容，用来理解一个更像你的它。不是复制你，而是从你的思想轨迹里，孵化出一个更完整的你。</p>
            <div className="consent-guide-row">
              <KanshanPlaceholder />
              <em>这些线索，让我们更懂你。</em>
            </div>
          </div>

          <PaperCard className="consent-paper">
            <h2>我们需要以下授权<br />来理解更真实的你：</h2>
            <div className="permission-list">
              {permissions.map(([name, reason, detail]) => (
                <article key={name}>
                  <span className="permission-icon">✓</span>
                  <div>
                    <strong>{name}</strong>
                    <b>{reason}</b>
                    <p>{detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="privacy-boundary">
              <strong>我们有明确的隐私边界：</strong>
              <span>✓ 不读取：私信 / 手机号 / 邮箱</span>
              <span>✓ 不会：自动发布 / 自动私信</span>
            </div>
            <div className="consent-actions">
              <DemoFlowButton href="/hatch/scanning" stage="PROFILE_SCANNING">用知乎开始孵化</DemoFlowButton>
              <BottomSheet trigger={<span>数据怎么用？ →</span>} title="数据怎么用？">
                <p>当前交互骨架只读取 DEMO fixture。正式接入时，页面只承诺实际 OAuth 已开放的公开数据能力。</p>
                <p>公开创作、关注和公开收藏会先转成结构化「知乎成分」，再用于 Persona、匹配解释和后续 outing。</p>
                <p>私信、手机号、邮箱以及自动发布、自动私信不在本产品的数据边界内。</p>
                <a className="sheet-inline-link" href="/privacy">查看完整数据边界 →</a>
              </BottomSheet>
            </div>
          </PaperCard>
        </section>
      </DemoPage>
    </DemoRouteGuard>
  );
}
