"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Link from "next/link";

import { resolveP0Art } from "@/lib/art/p0";

import { DemoFlowButton } from "../client";
import { ArtSlot, PaperCard, PersonaArt } from "../components";
import { DEMO_FIXTURE } from "../fixtures";
import { useLivePersonaSnapshot, useLiveQuestionSnapshot } from "../live-client";
import { CatProfileEditor, useCatProfile } from "../profile/client";

function compact(value: string, max = 112) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "这只喵没有解释，只把问题叼了回来。";
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

function questionReason(index: number, primaryInterest: string) {
  if (index === 0) return `它把当前最值得看的问题先叼了回来；你的主兴趣是「${primaryInterest}」，所以它会优先寻找能激起追问的内容。`;
  if (index === 1) return `这题和「${primaryInterest}」不完全重合，但有足够的分歧感，适合让人格离开舒适区。`;
  return "这是一张陌生领域票根：不是因为完全同频，而是因为它觉得你可能会因此多问一个问题。";
}

export function LiveExploreSection({ appMode }: { appMode: boolean }) {
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();
  const primaryInterest = personaSnapshot?.composition.primaryInterest ?? DEMO_FIXTURE.persona.interests[0];
  const basePersona = personaSnapshot?.persona ?? DEMO_FIXTURE.persona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona, appMode);
  const catName = profile.catName;
  const fallbackQuestions = DEMO_FIXTURE.explore.items.map((item) => ({
    title: item.title,
    url: item.sourceUrl,
    summary: item.whyPicked,
    thumbnailUrl: "",
  }));
  const liveQuestions = questionSnapshot?.questions?.length
    ? questionSnapshot.questions
    : questionSnapshot?.question
      ? [questionSnapshot.question]
      : [];
  const questions = [...liveQuestions, ...fallbackQuestions]
    .filter((item, index, collection) => collection.findIndex((candidate) => candidate.title === item.title) === index)
    .slice(0, 3);

  return (
    <section className="explore-stage">
      <div className="explore-hero-copy">
        <p className="stage-caption">{appMode ? "JOURNEY LOG · 它今天去了哪里" : "PUBLIC EXPLORE · 看看别人养出了什么"}</p>
        <h1>{appMode ? <>它今天去了<br /><span>知乎</span>。</> : <>在这个世界里，<br />问题会让<span>灵魂</span>相遇。</>}</h1>
        <p>{appMode ? `它现在知道你最常停留在「${primaryInterest}」，但不会只去那里。` : "这里展示的是当前知乎公开问题如何进入谢邀喵的世界。"}</p>
      </div>

      <div className="explore-hero-art">
        <div
          className={`journey-gate-scene${appMode ? " is-app" : " is-public"}`}
          style={{ backgroundImage: `url(${resolveP0Art("journey-zhihu-gate")})` }}
        >
          {appMode ? (
            <PersonaArt alt={`${catName}背着包走进知乎知识世界`} aspect="portrait" className="explore-persona-art" persona={playerPersona} state="walking" />
          ) : (
            <div className="public-world-ensemble" aria-label="社区居民群像">
              {DEMO_FIXTURE.residents.slice(0, 3).map((resident, index) => (
                <div className={`public-world-resident public-world-resident--${index + 1}`} key={resident.id}>
                  <ArtSlot name={`npc/${resident.id}/idle`} label={resident.displayName} aspect="portrait" fit="contain" />
                  <span>{resident.displayName}</span>
                  <small>{resident.species}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="explore-cards">
        {questions.map((item, index) => (
          <PaperCard className={index === 0 ? "explore-card is-featured" : "explore-card"} key={`${item.url}-${index}`}>
            <div className="explore-card-number">{String(index + 1).padStart(2, "0")}</div>
            <span className="explore-card-badge">{index === 0 ? "今天先看" : index === 1 ? "顺路闻到" : "陌生领域"}</span>
            <h2>{item.title}</h2>
            <p>{compact(item.summary)}</p>
            <ArtSlot
              name={`journey/question-${index + 1}`}
              label={`旅途卡 ${index + 1}`}
              aspect="wide"
              src={item.thumbnailUrl || undefined}
            />
            <div className="explore-why">
              <b>为什么带回来：</b>{appMode ? questionReason(index, primaryInterest) : "来自当前知乎公开内容，用来展示不同问题如何触发不同 Persona 的注意。"}
            </div>
            <a className="explore-card-link" href={item.url} rel="noreferrer" target="_blank">
              查看知乎原问题 <OpenInNewRoundedIcon fontSize="inherit" />
            </a>
          </PaperCard>
        ))}
      </div>

      {appMode ? (
        <div className="explore-log-strip">
          <strong>{questionSnapshot?.mode === "live" ? "今天的真实知乎航迹" : "本轮备用航迹"}</strong>
          <span>{primaryInterest} · 已带回 {questions.length} 张问题票根</span>
          <a href="/home">回窝看看它在不在 →</a>
        </div>
      ) : (
        <div className="public-explore-action">
          <DemoFlowButton href="/hatch/consent" stage="PRE_AUTH">我也想养一个</DemoFlowButton>
        </div>
      )}
    </section>
  );
}

function residentScore(selfInterests: string[], residentInterests: readonly string[]) {
  const overlap = selfInterests.filter((item) => residentInterests.includes(item)).length;
  return Math.min(96, 64 + overlap * 14);
}

function relationshipSlug(residentId: string) {
  return residentId.replace(/^resident-/, "");
}

export function LiveEncounterSection({ showFeatured }: { showFeatured: boolean }) {
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();
  const persona = personaSnapshot?.persona;
  const basePersona = persona ?? DEMO_FIXTURE.persona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona);
  const catName = profile.catName;
  const selfInterests = basePersona.interests;
  const question = questionSnapshot?.question ?? {
    title: DEMO_FIXTURE.encounter.topic.title,
    url: DEMO_FIXTURE.encounter.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const residents = DEMO_FIXTURE.residents.map((resident) => ({
    ...resident,
    score: residentScore(selfInterests, resident.interests),
  }));
  const latest = residents[0];
  const selfTitle = persona?.certifiedTitle ?? DEMO_FIXTURE.persona.title;
  const selfDescriptor = persona?.personality[0] ?? DEMO_FIXTURE.persona.archetype;

  if (showFeatured) {
    const summary = compact(question.summary, 130);
    return (
      <div className="daily-encounter-detail">
        <div className="section-heading-row">
          <div><p className="stage-caption">DAILY ENCOUNTER</p><h1>昨晚，{latest.displayName}来过。</h1></div>
          <Link href="/encounter">返回关系簿</Link>
        </div>
        <PaperCard className="daily-topic-paper">
          <span>知乎 · 当前真实问题</span>
          <h2>{question.title}</h2>
          <a href={question.url} rel="noreferrer" target="_blank">查看知乎原问题 <OpenInNewRoundedIcon fontSize="inherit" /></a>
        </PaperCard>
        <div className="daily-dialogue-stage">
          <PersonaArt alt={selfTitle} className="encounter-self-art" persona={playerPersona} state="talking" />
          <div className="daily-dialogue-lines">
            <p><b>{catName}</b>：{persona?.catchphrase ?? DEMO_FIXTURE.persona.catchphrase} 先别急着站队，这题要先看谁在承担真正的代价。</p>
            <p className="is-other"><b>{latest.displayName}</b>：{latest.catchphrase} 你负责拆结构，我先问普通人的感受是不是被漏掉了。</p>
            <p><b>{catName}</b>：{summary}</p>
          </div>
          <ArtSlot name={`npc/${latest.id}/talking`} label={latest.displayName} aspect="portrait" fit="contain" />
        </div>
        <p className="encounter-subtitle">{selfDescriptor} × {latest.personality[0]} · 契合度 {latest.score}%</p>
        <Link className="theatre-button theatre-button-primary daily-relationship-link" href={`/relationship/${relationshipSlug(latest.id)}`}>看看这段关系 <span>→</span></Link>
      </div>
    );
  }

  return (
    <>
      <div className="encounter-hub-hero">
        <p className="stage-caption">MORE ENCOUNTERS · PERSONA RELATIONSHIPS</p>
        <h1>最近，<br />它<span>遇见</span>了<br />这些有趣的灵魂。</h1>
        <p>每段关系都从共同兴趣、表达差异和一个真实问题开始。</p>
        <PersonaArt alt={`${catName}坐在剧场回看最近的相遇`} aspect="wide" className="encounter-audience-persona" persona={playerPersona} state="thinking" />
      </div>

      <PaperCard className="latest-encounter-card">
        <div className="latest-encounter-art">
          <ArtSlot name={`npc/${latest.id}/meeting`} label={`最近相遇 / ${latest.displayName}`} aspect="square" fit="contain" />
        </div>
        <div className="latest-encounter-copy">
          <span>最近的相遇 · LATEST ENCOUNTER</span>
          <h2>{latest.displayName}</h2>
          <b>{latest.score}% 契合度</b>
          <p>最近一次，它们围着「{question.title}」碰到了一起。共同兴趣让它们愿意停下来，表达差异决定了这场对话不会太无聊。</p>
          <blockquote>“{persona?.catchphrase ?? DEMO_FIXTURE.persona.catchphrase}”</blockquote>
          <Link href="/encounter?view=featured">看这一幕 →</Link>
        </div>
      </PaperCard>

      <section className="more-encounters">
        <div className="section-heading-row"><h2>关系簿</h2><span>RELATIONSHIPS</span></div>
        <div className="relationship-card-grid">
          {residents.map((item) => (
            <Link className="relationship-mini-card" href={`/relationship/${relationshipSlug(item.id)}`} key={item.id}>
              <ArtSlot name={`npc/${item.id}/idle`} label={item.displayName} aspect="avatar" fit="contain" />
              <div><strong>{item.displayName}</strong><span>{item.personality[0]} · {item.interests.join(" / ")}</span><b>{item.score}%</b></div>
              <small>查看关系 →</small>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export function LiveJourneyDetail() {
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();
  const question = questionSnapshot?.question ?? {
    title: DEMO_FIXTURE.outing.returnArtifact.topic.title,
    url: DEMO_FIXTURE.outing.returnArtifact.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const primaryInterest = personaSnapshot?.composition.primaryInterest ?? DEMO_FIXTURE.persona.interests[0];
  const basePersona = personaSnapshot?.persona ?? DEMO_FIXTURE.persona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona);
  const catName = profile.catName;
  const summary = compact(question.summary, 180);
  const galleryQuestions = questionSnapshot?.questions?.length
    ? questionSnapshot.questions.slice(0, 3)
    : [question];

  return (
    <section className="journey-detail-stage">
      <aside className="journey-side-nav">
        <a href="/explore?mode=app">⌂ 探索首页</a>
        <strong>▣ 旅途详情</strong>
        <a href="/atlas">▤ 收集图鉴</a>
        <a href="/encounter">◎ 喵的足迹</a>
      </aside>

      <div className="journey-main">
        <PaperCard className="journey-title-paper">
          <span>今天带回的一张问题票根</span>
          <h1><em>它</em>为什么去了那里？</h1>
          <blockquote>“不是因为这题最像你，而是因为它值得你多问一步。”</blockquote>
          <div className="journey-meta">
            <span>出门方向 <b>{primaryInterest}</b></span>
            <span>内容来源 <b>{questionSnapshot?.mode === "live" ? "知乎当前公开内容" : "备用内容"}</b></span>
            <span>随行装备 <b>好奇心 × 1</b></span>
          </div>
        </PaperCard>

        <div className="journey-art-and-topic">
          <div
            className="journey-scene-visual"
            style={{ backgroundImage: `url(${resolveP0Art("journey-zhihu-gate")})` }}
          >
            <PersonaArt alt={`${catName}穿过知乎知识世界`} className="journey-persona-art" persona={playerPersona} state="walking" />
          </div>
          <PaperCard className="journey-topic-paper">
            <span>带回的问题 · 知乎</span>
            <h2>{question.title}</h2>
            <p>{summary}</p>
            <a href={question.url} rel="noreferrer" target="_blank">在知乎看看大家怎么说 <OpenInNewRoundedIcon fontSize="inherit" /></a>
          </PaperCard>
        </div>

        <PaperCard className="journey-timeline-paper">
          <h2>旅途轨迹</h2>
          <div className="journey-timeline">
            <span><b>出门</b><small>你只给了一个方向，它自己决定去哪。</small></span>
            <i>→</i>
            <span><b>路过</b><small>从当前知乎公开问题里寻找值得停下来的讨论。</small></span>
            <i>→</i>
            <span><b>停下来</b><small>这题和「{primaryInterest}」之间产生了新的连接。</small></span>
            <i>→</i>
            <span><b>带回来</b><small>{question.title}</small></span>
          </div>
        </PaperCard>

        <div className="journey-gallery-and-why">
          <div>
            <h2>路上的一些画面</h2>
            <div className="journey-gallery">
              {galleryQuestions.map((item, index) => (
                <ArtSlot
                  key={`${item.url}-${index}`}
                  name={`journey/photo-${String(index + 1).padStart(2, "0")}`}
                  label={`旅途照片 ${String(index + 1).padStart(2, "0")}`}
                  aspect="polaroid"
                  src={item.thumbnailUrl || undefined}
                />
              ))}
            </div>
          </div>
          <PaperCard>
            <h2>{catName}为什么把这个带给你？</h2>
            <p>{questionReason(0, primaryInterest)}</p>
            <p>你可以去看原问题，也可以什么都不做。旅途的意义不是完成任务，而是让人格真的多见一点东西。</p>
          </PaperCard>
        </div>

        <a className="theatre-button theatre-button-primary journey-collect" href="/atlas">收进图鉴 <span>→</span></a>
      </div>
    </section>
  );
}

export function LiveRelationshipDetail({ relationshipId }: { relationshipId: string }) {
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();
  const persona = personaSnapshot?.persona;
  const basePersona = persona ?? DEMO_FIXTURE.persona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona);
  const catName = profile.catName;
  const selfInterests = basePersona.interests;
  const legacyResidentId = relationshipId === "neighbor" ? "resident-rice" : `resident-${relationshipId}`;
  const candidate = DEMO_FIXTURE.residents.find((resident) => resident.id === legacyResidentId) ?? DEMO_FIXTURE.residents[0];
  const score = residentScore(selfInterests, candidate.interests);
  const candidateInterestSet = new Set<string>(candidate.interests);
  const shared = selfInterests.filter((item) => candidateInterestSet.has(item));
  const question = questionSnapshot?.question ?? {
    title: DEMO_FIXTURE.encounter.topic.title,
    url: DEMO_FIXTURE.encounter.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const relation = score >= 88 ? "很容易继续聊下去" : score >= 76 ? "同频路人" : "还在互相闻味道";
  const selfTitle = persona?.certifiedTitle ?? DEMO_FIXTURE.persona.title;
  const selfDescriptor = persona?.personality[0] ?? DEMO_FIXTURE.persona.archetype;

  return (
    <section className="relationship-detail-stage">
      <p className="stage-caption">关系详情 · PERSONA RELATIONSHIP</p>
      <h1>为什么同一个问题，<br />你们总能聊出<span>两个方向</span>？</h1>
      <p className="relationship-subtitle">关系不是一个抽象百分比，而是共同兴趣和表达差异叠出来的结果。</p>

      <div className="relationship-pair-stage">
        <div>
          <PersonaArt alt={`${catName} · ${selfTitle}`} className="relationship-self-art" persona={playerPersona} state="thinking" />
          <strong>{catName}</strong><span>{basePersona.species} · {selfDescriptor} · {selfInterests.slice(0, 2).join(" × ")}</span>
        </div>
        <i>♡</i>
        <div>
          <ArtSlot name={`npc/${candidate.id}/meeting`} label={candidate.displayName} aspect="portrait" fit="contain" />
          <strong>{candidate.displayName}</strong><span>{candidate.personality[0]} · {candidate.interests.join(" × ")}</span>
        </div>
      </div>

      <PaperCard className="relationship-status-card">
        <h2>当前关系</h2>
        <strong>{relation}</strong>
        <blockquote>“共同点决定愿不愿意停下，差异决定还有没有下一句话。”</blockquote>
        <p>谢邀喵匹配度 {score}%。{shared.length ? `共同兴趣是 ${shared.join("、")}。` : "暂时没有明显的兴趣重合，关系主要由好奇心驱动。"}</p>
      </PaperCard>

      <div className="relationship-detail-grid">
        <PaperCard>
          <h2>关系时间线</h2>
          <ol className="relationship-timeline">
            <li><b>第一次闻到对方</b><span>Persona 根据兴趣和表达风格完成第一次匹配</span></li>
            <li><b>第一次对手戏</b><span>围绕真实知乎问题「{question.title}」开始对话</span></li>
            <li className="is-current"><b>现在</b><span>{relation} · 等待下一次真实问题把它们重新拉到一起</span></li>
          </ol>
        </PaperCard>

        <PaperCard>
          <h2>共同气味</h2>
          <div className="relationship-topic-tags">
            {(shared.length ? shared : [...selfInterests.slice(0, 2), ...candidate.interests.slice(0, 1)]).map((item) => <span key={item}>{item}</span>)}
          </div>
          <h2 className="relationship-difference-heading">最大的差异</h2>
          <div className="relationship-difference">
            <span><b>{catName}</b>{selfDescriptor}</span>
            <span><b>{candidate.displayName}</b>{candidate.personality[0]}</span>
          </div>
          <p className="relationship-note">不是越像越好；能围绕同一问题继续说下一句，才是这段关系真正有价值的地方。</p>
        </PaperCard>

        <PaperCard className="relationship-latest-scene">
          <h2>最新一幕</h2>
          <ArtSlot
            name="relationship/latest-scene"
            label="最近一次真实问题对手戏"
            aspect="wide"
            src={question.thumbnailUrl || undefined}
          />
          <h3>“{question.title}”</h3>
          <p>{compact(question.summary, 120)}</p>
          <a href="/encounter?view=featured">看最新一幕 →</a>
        </PaperCard>
      </div>

      <a className="theatre-button theatre-button-primary relationship-back" href="/encounter">回到遇见 <span>→</span></a>
    </section>
  );
}

export function LiveLandingSignal() {
  const questionSnapshot = useLiveQuestionSnapshot();
  const question = questionSnapshot?.question;

  if (!question) return <p>今天，谢邀喵正在知乎闻新的问题。</p>;
  return <p>刚刚闻到：{compact(question.title, 42)}</p>;
}

export function LiveAtlasSection() {
  const snapshot = useLivePersonaSnapshot();
  const persona = snapshot?.persona;
  const composition = snapshot?.composition;
  const fallback = DEMO_FIXTURE.persona;
  const basePersona = persona ?? fallback;
  const { profile, persona: playerPersona, saving, updateProfile } = useCatProfile(basePersona);
  const catName = profile.catName;
  const species = basePersona.species;
  const title = persona?.certifiedTitle ?? fallback.title;
  const catchphrase = persona?.catchphrase ?? fallback.catchphrase;
  const primaryInterest = composition?.primaryInterest ?? fallback.interests[0];
  const interests = composition?.interests.slice(0, 4).map((item) => item.name) ?? fallback.interests;
  const counts = composition?.sourceCounts;

  const observations = composition
    ? [
        `主兴趣目前稳定在「${primaryInterest}」`,
        `公开创作 ${counts?.contents ?? 0} 条，表达节奏偏${composition.writingLength === "long" ? "长答" : composition.writingLength === "short" ? "短句" : "中等篇幅"}`,
        `公开收藏 ${counts?.collections ?? 0} 条、收藏夹 ${counts?.favlists ?? 0} 个，收藏倾向 ${composition.hoardingLevel}%`,
      ]
    : ["正在整理你的知乎成分。", "人格档案会随着公开行为继续变化。", "旅途与关系会逐步留下新的痕迹。"];

  return (
    <section className="atlas-stage">
      <div className="atlas-hero-copy">
        <p className="stage-caption">ARCHIVE · PERSONA HISTORY</p>
        <h1>它的故事，<br />也是<span>你的</span><br />另一种履历。</h1>
        <p>这里收着它从你的知乎成分里长出来的性格、兴趣和关系痕迹。</p>
      </div>

      <PaperCard className="atlas-persona-card">
        <span>当前人格 · CURRENT PERSONA</span>
        <PersonaArt alt={`${catName} / ${species}`} className="atlas-current-persona-art" persona={playerPersona} state="base" />
        <h2>{catName}</h2>
        <h3>{species} · {persona?.personality[0] ?? fallback.archetype}</h3>
        <p className="atlas-cert-title">{title}</p>
        <blockquote>“{catchphrase}”</blockquote>
        <div className="atlas-tags">
          {interests.map((item) => <span key={item}>{item}</span>)}
        </div>
        <CatProfileEditor profile={profile} saving={saving} onSave={updateProfile} />
      </PaperCard>

      <div className="atlas-mobile-index" aria-label="移动端图鉴索引">
        <details open>
          <summary><b>最近变化</b><span>{observations[0]}</span></summary>
          <div className="atlas-mobile-detail">
            {observations.map((item, index) => <p key={item}>{String(index + 1).padStart(2, "0")}　{item}</p>)}
          </div>
        </details>
        <details>
          <summary><b>知乎成分</b><span>{counts?.contents ?? 0} 创作 · {counts?.followees ?? 0} 关注</span></summary>
          <div className="atlas-mobile-stats">
            <span><b>{counts?.contents ?? 0}</b>公开创作</span>
            <span><b>{counts?.followees ?? 0}</b>关注</span>
            <span><b>{counts?.collections ?? 0}</b>近期收藏</span>
            <span><b>{counts?.favlists ?? 0}</b>收藏夹</span>
          </div>
        </details>
        <Link href="/encounter"><b>关系图鉴</b><span>{DEMO_FIXTURE.atlas.relationships.length} 个关系 · 去看看它遇见了谁</span></Link>
        <details>
          <summary><b>人格轨迹</b><span>{primaryInterest} → {title}</span></summary>
          <p className="atlas-mobile-trace">知乎成分「{primaryInterest}」正在把它推向「{title}」。人格会随之后的旅途继续变化。</p>
        </details>
      </div>

      <div className="atlas-grid">
        <PaperCard>
          <div className="section-heading-row"><h2>最近变化</h2><span>{snapshot?.mode === "live" ? "当前知乎成分" : "备用成分"}</span></div>
          <div className="atlas-change-list">
            {observations.map((item, index) => <p key={item}>{String(index + 1).padStart(2, "0")}　{item}</p>)}
          </div>
        </PaperCard>
        <PaperCard>
          <div className="section-heading-row"><h2>知乎成分</h2><span>PUBLIC PROFILE SIGNALS</span></div>
          <div className="atlas-stats">
            <b>{counts?.contents ?? 0}<small><CreateOutlinedIcon fontSize="inherit" /> 公开创作</small></b>
            <b>{counts?.followees ?? 0}<small><PeopleAltOutlinedIcon fontSize="inherit" /> 关注</small></b>
            <b>{counts?.collections ?? 0}<small><BookmarkBorderRoundedIcon fontSize="inherit" /> 近期收藏</small></b>
            <b>{counts?.favlists ?? 0}<small><AutoAwesomeRoundedIcon fontSize="inherit" /> 收藏夹</small></b>
          </div>
          <div className="atlas-collection-strip" aria-label="旅途收藏摘要">
            <span><b>14</b><small>幕间札记</small></span>
            <span><b>9</b><small>问题票根</small></span>
            <span><b>{DEMO_FIXTURE.atlas.relationships.length}</b><small>关系票根</small></span>
          </div>
        </PaperCard>
      </div>

      <div className="atlas-grid atlas-grid-bottom">
        <PaperCard>
          <div className="section-heading-row"><h2>关系图鉴</h2><a href="/encounter">查看全部 →</a></div>
          <div className="atlas-relationship-polaroids">
            {DEMO_FIXTURE.atlas.relationships.map((item) => (
              <a href={`/relationship/${relationshipSlug(item.id)}`} key={item.name}>
                <ArtSlot name={`npc/${item.id}/idle`} label={item.name} aspect="polaroid" fit="contain" />
                <span>{item.status}</span>
              </a>
            ))}
          </div>
        </PaperCard>
        <PaperCard id="history">
          <div className="section-heading-row"><h2>人格轨迹</h2><span>PERSONA TRACE</span></div>
          <div className="persona-history-flow">
            <article><b>知乎成分</b><span>{primaryInterest}</span></article>
            <i>→</i>
            <article><b>{catName}</b><span>{species} · {persona?.personality[0] ?? fallback.archetype}</span></article>
            <i>→</i>
            <article className="is-current"><b>{title}</b><span>当前</span></article>
          </div>
        </PaperCard>
      </div>
    </section>
  );
}
