"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Link from "next/link";
import { useEffect, useState } from "react";

import { resolveP0Art } from "@/lib/art/p0";
import type { JourneyAtlasView } from "@/lib/journey/types";

import { DemoFlowButton } from "../client";
import { ArtSlot, PaperCard, PersonaArt } from "../components";
import { DEMO_FIXTURE } from "../fixtures";
import { useLivePersonaSnapshot, useLiveQuestionSnapshot } from "../live-client";
import { CatProfileEditor, useCatProfile } from "../profile/client";

function compact(value: string, max = 112) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "这只喵不做解释，只把问题叼了回来。";
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

function questionReason(index: number, primaryInterest: string) {
  if (index === 0) return `它先在这道题前停了下来。你常看「${primaryInterest}」，这题又刚好留了个能继续追问的口子。`;
  if (index === 1) return `和「${primaryInterest}」不完全同路，所以它反而多看了一会儿。`;
  return "完全是顺路拐进去的陌生地方。它觉得这张票根值得带回来。";
}

function formatJourneyDate(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LiveExploreSection({ appMode }: { appMode: boolean }) {
  const personaSnapshot = useLivePersonaSnapshot();
  const questionSnapshot = useLiveQuestionSnapshot();
  const primaryInterest = personaSnapshot?.composition.primaryInterest ?? DEMO_FIXTURE.persona.interests[0];
  const basePersona = personaSnapshot?.persona ?? DEMO_FIXTURE.persona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona, appMode);
  const catName = profile.catName;
  const [atlas, setAtlas] = useState<JourneyAtlasView | null>(null);

  useEffect(() => {
    if (!appMode) return;
    let cancelled = false;
    fetch("/api/atlas", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`atlas HTTP ${response.status}`);
        return (await response.json()) as JourneyAtlasView;
      })
      .then((next) => {
        if (!cancelled) setAtlas(next);
      })
      .catch(() => {
        if (!cancelled) setAtlas({ journeys: [], memories: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [appMode]);

  const liveQuestions = questionSnapshot?.questions?.length
    ? questionSnapshot.questions
    : questionSnapshot?.question
      ? [questionSnapshot.question]
      : [];
  const publicQuestions = liveQuestions.slice(0, 3).map((item) => ({
    ...item,
    completedAt: null as number | null,
    routeBias: null as string | null,
    artifactType: null as string | null,
  }));
  const journeyQuestions = (atlas?.journeys ?? [])
    .filter((entry) => entry.postcard.question)
    .slice(0, 3)
    .map((entry) => ({
      title: entry.postcard.question!.title,
      url: entry.postcard.question!.url,
      summary: entry.postcard.body,
      thumbnailUrl: entry.postcard.question!.thumbnailUrl ?? "",
      completedAt: entry.completedAt,
      routeBias: entry.routeBias,
      artifactType: entry.artifact?.type ?? null,
    }));
  const showingLivePool = publicQuestions.length > 0;
  const questions = showingLivePool ? publicQuestions : journeyQuestions;

  return (
    <section className={`explore-stage ${appMode ? "explore-stage--app" : "explore-stage--public"}`}>
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
              {DEMO_FIXTURE.residents.slice(0, 4).map((resident, index) => (
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

      <div className={`explore-cards explore-cards--${questions.length}`}>
        {questions.map((item, index) => (
          <PaperCard
            aria-label={`打开知乎原问题：${item.title}`}
            className={`${index === 0 ? `explore-card is-featured${questions.length === 1 ? " is-single" : ""}` : "explore-card"} is-clickable`}
            key={`${item.url}-${index}`}
            onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              window.open(item.url, "_blank", "noopener,noreferrer");
            }}
            role="link"
            tabIndex={0}
          >
            <div className="explore-card-number">{String(index + 1).padStart(2, "0")}</div>
            <span className="explore-card-badge">{showingLivePool
              ? (index === 0 ? "现在热榜" : index === 1 ? "顺路看看" : "再逛一题")
              : (index === 0 ? "最近带回" : `旅途 ${index + 1}`)}</span>
            <h2>{item.title}</h2>
            <p>{compact(item.summary)}</p>
            {item.thumbnailUrl ? (
              <ArtSlot
                name={`journey/question-${index + 1}`}
                label={`知乎问题配图 ${index + 1}`}
                aspect="wide"
                src={item.thumbnailUrl}
              />
            ) : null}
            <div className="explore-why">
              <b>{showingLivePool ? "现在为什么会看到：" : "这一趟："}</b>{showingLivePool
                ? `来自当前知乎公开发现池。它会结合「${primaryInterest}」和你塞进包里的纸条，在真正出门时自己挑一题。`
                : `${item.completedAt ? formatJourneyDate(item.completedAt) : ""} · 纸条「${item.routeBias ?? "随便逛"}」${item.artifactType === "RELATION_TICKET" ? " · 途中还遇见了另一只猫" : ""}`}
            </div>
          </PaperCard>
        ))}
      </div>

      {appMode ? (
        <div className="explore-log-strip">
          <strong>{showingLivePool ? "当前知乎发现池" : "真实旅途航迹"}</strong>
          <span>{showingLivePool
            ? `现在刷到 ${questions.length} 个真实公开问题 · 旅行时会从更大的候选池里自己挑`
            : atlas === null
              ? "正在翻旅行册……"
              : journeyQuestions.length
                ? `${primaryInterest} · 最近 ${journeyQuestions.length} 趟带回了问题`
                : "知乎发现暂时不可用，旅行册里也还没有问题票根。"}</span>
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

function residentRelationshipStatus(residentId: string) {
  return DEMO_FIXTURE.atlas.relationships.find((item) => item.id === residentId)?.status ?? "初见";
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
    relationshipStatus: residentRelationshipStatus(resident.id),
  }));
  const latest = residents[0];
  const latestRelationship = DEMO_FIXTURE.encounter.relationship;
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
        <p className="encounter-subtitle">{selfDescriptor} × {latest.personality[0]} · {latestRelationship.status} · 熟悉度 {latestRelationship.familiarity} · 化学反应 {latestRelationship.chemistry >= 0 ? "+" : ""}{latestRelationship.chemistry}</p>
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
          <b>{latestRelationship.status}</b>
          <small>熟悉度 {latestRelationship.familiarity} · 化学反应 {latestRelationship.chemistry >= 0 ? "+" : ""}{latestRelationship.chemistry} · 已相遇 {latestRelationship.encounterCount} 次</small>
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
              <div><strong>{item.displayName}</strong><span>{item.personality[0]} · {item.interests.join(" / ")}</span><b>{item.relationshipStatus}</b></div>
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
              {galleryQuestions.filter((item) => Boolean(item.thumbnailUrl)).map((item, index) => (
                <ArtSlot
                  key={`${item.url}-${index}`}
                  name={`journey/photo-${String(index + 1).padStart(2, "0")}`}
                  label={`知乎内容配图 ${String(index + 1).padStart(2, "0")}`}
                  aspect="polaroid"
                  src={item.thumbnailUrl!}
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
  const relationshipStatus = residentRelationshipStatus(candidate.id);
  const relationshipMetrics = candidate.id === DEMO_FIXTURE.residents[0].id ? DEMO_FIXTURE.encounter.relationship : null;
  const candidateInterestSet = new Set<string>(candidate.interests);
  const shared = selfInterests.filter((item) => candidateInterestSet.has(item));
  const question = questionSnapshot?.question ?? {
    title: DEMO_FIXTURE.encounter.topic.title,
    url: DEMO_FIXTURE.encounter.topic.url,
    summary: "",
    thumbnailUrl: "",
  };
  const selfTitle = persona?.certifiedTitle ?? DEMO_FIXTURE.persona.title;
  const selfDescriptor = persona?.personality[0] ?? DEMO_FIXTURE.persona.archetype;

  return (
    <section className="relationship-detail-stage">
      <p className="stage-caption">关系详情 · PERSONA RELATIONSHIP</p>
      <h1 className="target-lock-title">
        <span className="target-title-line">你们为什么</span>
        <span className="target-title-line">总会聊到<em>深夜</em>？</span>
      </h1>
      <p className="relationship-subtitle">不同的视角，刚好拼出更大的世界。</p>

      <div className="relationship-pair-stage">
        <div>
          <q className="relationship-speech">我觉得，问题可以再想深一点。</q>
          <PersonaArt alt={`${catName} · ${selfTitle}`} className="relationship-self-art" persona={playerPersona} state="thinking" />
          <strong>{catName}</strong><span>{basePersona.species} · {selfDescriptor} · {selfInterests.slice(0, 2).join(" × ")}</span>
        </div>
        <i>♡</i>
        <div>
          <q className="relationship-speech">但也别忘了，生活本身也很重要啊。</q>
          <ArtSlot name={`npc/${candidate.id}/meeting`} label={candidate.displayName} aspect="portrait" fit="contain" />
          <strong>{candidate.displayName}</strong><span>{candidate.personality[0]} · {candidate.interests.join(" × ")}</span>
        </div>
      </div>

      <div className="relationship-detail-grid">
        <PaperCard className="relationship-status-card">
          <h2>我们的关系</h2>
          <strong>{relationshipStatus}</strong>
          <blockquote>“不同，但刚好合拍。”</blockquote>
          <p>{relationshipMetrics ? `熟悉度 ${relationshipMetrics.familiarity} · 化学反应 ${relationshipMetrics.chemistry >= 0 ? "+" : ""}${relationshipMetrics.chemistry} · 已相遇 ${relationshipMetrics.encounterCount} 次。` : "关系仍在初见阶段。"}</p>
        </PaperCard>
        <PaperCard>
          <h2>关系时间线</h2>
          <ol className="relationship-timeline">
            <li><b>第一次闻到对方</b><span>Persona 根据兴趣和表达风格完成第一次匹配</span></li>
            <li><b>第一次对手戏</b><span>围绕真实知乎问题「{question.title}」开始对话</span></li>
            <li className="is-current"><b>现在</b><span>{relationshipStatus} · 等待下一次真实问题把它们重新拉到一起</span></li>
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
          {question.thumbnailUrl ? (
            <ArtSlot
              name="relationship/latest-scene"
              label="最近一次真实知乎问题配图"
              aspect="wide"
              src={question.thumbnailUrl}
            />
          ) : null}
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

  if (!question) return <p>今天，谢邀喵正在知乎里嗅探新问题。</p>;
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
  const production = process.env.NODE_ENV === "production";
  const [journeyAtlas, setJourneyAtlas] = useState<JourneyAtlasView | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/atlas", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`atlas HTTP ${response.status}`);
        return (await response.json()) as JourneyAtlasView;
      })
      .then((next) => {
        if (!cancelled) setJourneyAtlas(next);
      })
      .catch(() => {
        if (!cancelled) setJourneyAtlas({ journeys: [], memories: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentJourneys = journeyAtlas?.journeys.slice(0, 4) ?? [];
  const allJourneys = journeyAtlas?.journeys ?? [];
  const journeyCount = allJourneys.length;
  const questionTicketCount = allJourneys.filter((entry) => Boolean(entry.postcard.question)).length;
  const relationTicketCount = allJourneys.filter((entry) => entry.artifact?.type === "RELATION_TICKET").length;
  const insightCount = allJourneys.filter((entry) => Boolean(entry.insight)).length;
  const recentInsights = allJourneys.flatMap((entry) => entry.insight ? [entry.insight] : []).slice(0, 3);

  const observations = recentInsights.length
    ? recentInsights.map((item) => item.headline)
    : composition
      ? [
          `核心兴趣当前稳定在「${primaryInterest}」`,
          `公开创作 ${counts?.contents ?? 0} 条，表达节奏偏${composition.writingLength === "long" ? "长答" : composition.writingLength === "short" ? "短句" : "中等篇幅"}`,
          `公开收藏 ${counts?.collections ?? 0} 条、收藏夹 ${counts?.favlists ?? 0} 个，收藏倾向 ${composition.hoardingLevel}%`,
        ]
      : ["正在整理你的知乎成分。", "人格档案会随你的公开行为持续更新。", "旅途与关系会逐步留下新的痕迹。"];

  return (
    <section className="atlas-stage">
      <div className="atlas-hero-copy">
        <p className="stage-caption">ARCHIVE · PERSONA HISTORY</p>
        <h1 className="target-lock-title atlas-target-title">
          <span className="target-title-line">它的故事，</span>
          <span className="target-title-line atlas-target-title-second">也是<em>你的</em>另一种履历。</span>
        </h1>
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
        <details className="atlas-profile-settings">
          <summary>调整名字与外观</summary>
          <CatProfileEditor profile={profile} saving={saving} onSave={updateProfile} />
        </details>
      </PaperCard>

      <div className="atlas-mobile-index" aria-label="移动端图鉴索引">
        <details open>
          <summary><b>最近变化</b><span>{observations[0]}</span></summary>
          <div className="atlas-mobile-detail">
            {observations.map((item, index) => <p key={item}>{String(index + 1).padStart(2, "0")}　{item}</p>)}
          </div>
        </details>
        <details>
          <summary><b>称号</b><span>{title}</span></summary>
          <p className="atlas-mobile-trace">{counts ? `${counts.contents} 条公开创作 · ${counts.followees} 个关注 · ${counts.collections} 条近期收藏` : "由你的公开知乎成分持续校准"}</p>
        </details>
        <details>
          <summary><b>旅途收藏</b><span>{journeyAtlas === null ? "正在翻页…" : `${journeyCount} 趟 · ${questionTicketCount} 张问题票`}</span></summary>
          <div className="atlas-mobile-journeys">
            {recentJourneys.length ? recentJourneys.map((entry, index) => (
              <article key={entry.journeyId}>
                <b>{String(index + 1).padStart(2, "0")} · {entry.postcard.headline}</b>
                <span>{formatJourneyDate(entry.completedAt)} · 纸条「{entry.routeBias ?? "随便逛"}」</span>
                <p>{compact(entry.postcard.body, 92)}</p>
                {entry.postcard.question ? <a href={entry.postcard.question.url} rel="noreferrer" target="_blank">看知乎原问题 →</a> : entry.insight ? <em>{entry.insight.headline} · {entry.insight.textCharCount} 字</em> : <em>这趟留下了一页旅行记录</em>}
              </article>
            )) : <p className="atlas-mobile-trace">等它第一次真正回家，这里会出现第一张旅行页。</p>}
          </div>
        </details>
        <Link href="/encounter"><b>关系图鉴</b><span>{production ? "真实相遇发生后，会在这里留下关系" : `${DEMO_FIXTURE.atlas.relationships.length} 个关系 · 去看看它遇见了谁`}</span></Link>
        <details>
          <summary><b>人格历史</b><span>{primaryInterest} → {title}</span></summary>
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
          <div className="section-heading-row"><h2>旅途收藏</h2><span>JOURNEY COLLECTION</span></div>
          <div className="atlas-stats atlas-journey-stats">
            <b>{journeyCount}<small><AutoAwesomeRoundedIcon fontSize="inherit" /> 真实旅途</small></b>
            <b>{questionTicketCount}<small><BookmarkBorderRoundedIcon fontSize="inherit" /> 问题票根</small></b>
            <b>{relationTicketCount}<small><PeopleAltOutlinedIcon fontSize="inherit" /> 关系票根</small></b>
            <b>{insightCount}<small><CreateOutlinedIcon fontSize="inherit" /> 新认识</small></b>
          </div>
          <div className="atlas-collection-caption">
            {recentJourneys[0] ? <><b>最近一趟</b><span>{recentJourneys[0].postcard.headline}</span></> : <><b>旅行册</b><span>第一趟回来后，这里会留下真实收藏。</span></>}
          </div>
        </PaperCard>
      </div>

      <div className="atlas-grid atlas-grid-bottom">
        <PaperCard>
          <div className="section-heading-row"><h2>关系图鉴</h2><a href="/encounter">查看全部 →</a></div>
          {production ? (
            <div className="atlas-real-relationship-empty">
              <strong>真实关系从 Shared Encounter 开始。</strong>
              <p>不会用预置 NPC 填满这里。等你的猫真正遇见另一只 Persona，这张纸才会留下名字。</p>
              <a href="/encounter">去遇见页看看 →</a>
            </div>
          ) : (
            <div className="atlas-relationship-polaroids">
              {DEMO_FIXTURE.atlas.relationships.map((item) => (
                <a href={`/relationship/${relationshipSlug(item.id)}`} key={item.name}>
                  <ArtSlot name={`npc/${item.id}/idle`} label={item.name} aspect="polaroid" fit="contain" />
                  <span>{item.status}</span>
                </a>
              ))}
            </div>
          )}
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
