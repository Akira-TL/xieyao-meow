import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import { DemoRouteGuard } from "@/features/demo/client";
import {
  ActivationHeader,
  ArtSlot,
  DemoPage,
  KanshanPlaceholder,
  PaperCard,
} from "@/features/demo/components";
import { resolveP0Art } from "@/lib/art/p0";
import { BottomSheet, ZhihuConsentActions } from "@/features/demo/interaction-client";

const permissions = [
  { icon: ArticleOutlinedIcon, name: "公开创作", reason: "解析你的表达风格", detail: "读取你公开的回答、文章、想法等内容，用于分析语言风格、思考逻辑与观点特征。" },
  { icon: PeopleAltOutlinedIcon, name: "关注", reason: "识别你的长期兴趣", detail: "读取你公开关注的用户等信息，识别你持续关注的领域与兴趣方向。" },
  { icon: BookmarkBorderRoundedIcon, name: "公开收藏", reason: "读懂你真正的偏好", detail: "读取你公开收藏的内容，挖掘你反复认可的知识、观点与价值取向。" },
] as const;

export default function ConsentPage() {
  return (
    <DemoRouteGuard>
      <DemoPage scene="consent" activation>
        <ActivationHeader current={2} />
        <section className="consent-layout">
          <div className="consent-intro">
            <p className="stage-caption">ACT 01 · PERMISSION</p>
            <h1>孵化需要一点<br />你的<span>知乎</span>成分。</h1>
            <p>这些公开内容，用于塑造一个更贴近你的它。不是复制你，而是从你的思想轨迹里，孵化出一个更完整的数字分身。</p>
            <div className="consent-collage-stack" aria-hidden="true">
              <ArtSlot
                aspect="portrait"
                className="consent-collage-art consent-collage-art--signals"
                fit="contain"
                name="consent/zhihu-signals"
                src={resolveP0Art("collage-zhihu-signals")}
              />
              <ArtSlot
                aspect="portrait"
                className="consent-collage-art consent-collage-art--following"
                fit="contain"
                name="consent/following"
                src={resolveP0Art("collage-following")}
              />
            </div>
            <div className="consent-guide-row">
              <KanshanPlaceholder action="computer" className="consent-guide-persona" />
              <em>这些线索，让我们更懂你。</em>
            </div>
          </div>

          <PaperCard className="consent-paper">
            <h2>我们需要以下授权<br />来理解更真实的你：</h2>
            <div className="permission-list">
              {permissions.map(({ icon: Icon, name, reason, detail }) => (
                <article key={name}>
                  <span className="permission-icon"><Icon fontSize="small" /></span>
                  <div>
                    <strong>{name}</strong>
                    <b>{reason}</b>
                    <p>{detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="privacy-boundary">
              <strong>我们有明确的数据边界：</strong>
              <span>✓ 不读取：私信 / 手机号 / 邮箱</span>
              <span>✓ 不执行：自动发布 / 自动私信</span>
            </div>
            <div className="consent-actions">
              <ZhihuConsentActions />
              <BottomSheet trigger={<span>数据如何使用？ →</span>} title="数据如何使用？">
                <p>公开创作、关注与公开收藏会先转化为结构化的「知乎成分」，再用于人格生成、匹配解释与后续的探索出行。</p>
                <p>登录与数据请求均由后端完成，前端仅接收已整理完成的产品结果。</p>
                <p>私信、手机号、邮箱，以及自动发布、自动私信，均不在本产品的数据边界内。</p>
                <a className="sheet-inline-link" href="/privacy">查看完整数据边界 →</a>
              </BottomSheet>
            </div>
          </PaperCard>
        </section>
      </DemoPage>
    </DemoRouteGuard>
  );
}
