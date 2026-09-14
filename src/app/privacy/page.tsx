import {
  DemoPage,
  KanshanPlaceholder,
  PublicHeader,
} from "@/features/demo/components";

const cards = [
  {
    title: "我们读取什么",
    summary: "仅基于你在知乎的公开内容",
    items: ["公开创作 · 用来理解你的表达", "关注 · 用来理解兴趣方向", "公开收藏 · 用来理解长期偏好"],
    tone: "blue",
  },
  {
    title: "我们不读取什么",
    summary: "以下私人信息不会被获取",
    items: ["私信 · 不会读取你的私信内容", "手机号 · 不会获取你的手机号", "邮箱 · 不会获取你的邮箱"],
    tone: "muted",
  },
  {
    title: "我们不会做什么",
    summary: "我们不会进行以下行为",
    items: ["自动发布 · 不会代表你发布内容", "自动私信 · 不会向他人发送私信", "用于广告投放 · 不会将数据用于商业广告"],
    tone: "red",
  },
  {
    title: "你可以做什么",
    summary: "你始终拥有控制权",
    items: ["删除数据 · 可随时申请删除相关数据", "退出授权 · 可随时取消授权", "管理分享可见性 · 可设置内容的可见范围"],
    tone: "gear",
  },
] as const;

export default function PrivacyPage() {
  return (
    <DemoPage scene="landing">
      <PublicHeader right={<a className="public-kicker" href="/">返回序幕</a>} />
      <section className="privacy-stage">
        <div className="privacy-hero-copy">
          <p className="stage-caption">DATA BOUNDARY · TRUST CREATES A WIDER YOU</p>
          <h1>你的数据，<br />只用来认识你的<span>另一面</span>。</h1>
          <p>我们尊重你的隐私，只在你授权的范围内，用公开的内容，帮助你孵化另一个更像你的自己。</p>
        </div>
        <div className="privacy-hero-art">
          <KanshanPlaceholder action="wander" className="kanshan-art--privacy" />
        </div>
        <div className="privacy-card-grid">
          {cards.map((card) => (
            <article className={`privacy-card privacy-card--${card.tone}`} key={card.title}>
              <span className="privacy-card-icon" aria-hidden="true">{card.tone === "blue" ? "▤" : card.tone === "muted" ? "◉" : card.tone === "red" ? "⊘" : "⚙"}</span>
              <h2>{card.title}</h2>
              <p>{card.summary}</p>
              <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
        <div className="privacy-actions">
          <a className="theatre-button theatre-button-primary" href="/hatch/consent">开始孵化 <span>→</span></a>
          <a className="theatre-button theatre-button-secondary" href="/">返回序幕 <span>→</span></a>
        </div>
      </section>
    </DemoPage>
  );
}
