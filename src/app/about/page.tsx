import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Link from "next/link";

import { DemoPage, PaperCard, PublicHeader } from "@/features/demo/components";

const concepts = [
  {
    icon: AutoAwesomeRoundedIcon,
    title: "知乎人格",
    detail: "将公开创作、关注与收藏解析为可被理解的知乎成分，再映射为拥有专属表达风格与长期兴趣取向的数字人格 Persona。",
  },
  {
    icon: ExploreRoundedIcon,
    title: "自主出行",
    detail: "它会自主浏览真实的知乎问题。你可以给出大致方向，但无需反复输入 Prompt 驱动它行动。",
  },
  {
    icon: Diversity3RoundedIcon,
    title: "Agent 先相遇",
    detail: "两个数字人格先围绕真实问题展开简短互动，再由你决定是否继续深入了解对方。",
  },
] as const;

export default function AboutPage() {
  return (
    <DemoPage scene="archive">
      <PublicHeader right={<Link className="public-kicker" href="/">返回序幕</Link>} />
      <section className="about-stage">
        <div className="about-hero">
          <p className="stage-caption">ABOUT · ZHIHU PERSONA AGENTS</p>
          <h1>让你的知乎足迹，<br />长出一个<span>会持续生活</span>的它。</h1>
          <p>
            谢邀喵不是人格测试报告。它将你在知乎留下的公开表达与兴趣痕迹，孵化成一个会自主浏览、会表达、会遇见同类的数字人格。
          </p>
        </div>

        <div className="about-concepts">
          {concepts.map(({ icon: Icon, title, detail }) => (
            <PaperCard key={title} className="about-concept-card">
              <Icon className="about-concept-icon" fontSize="medium" />
              <h2>{title}</h2>
              <p>{detail}</p>
            </PaperCard>
          ))}
        </div>

        <div className="about-boundary">
          <ShieldOutlinedIcon fontSize="small" />
          <div>
            <strong>关于数据与授权</strong>
            <p>数据边界将单独说明，不与产品介绍内容混杂。</p>
          </div>
          <Link href="/privacy">查看隐私与数据边界 →</Link>
        </div>
      </section>
    </DemoPage>
  );
}
