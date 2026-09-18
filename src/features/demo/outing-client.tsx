"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import {
  resolveWaitingGameHomeActivityRoom,
  resolveWaitingGameHomeRoom,
  resolveWaitingGameHomeTable,
  resolveWaitingGameInspirationLeafArt,
  resolveWaitingGameJourneyPostcard,
  resolveWaitingGamePersonaActivity,
  resolveWaitingGamePrimaryToolArt,
  resolveWaitingGameReturnItemArt,
  resolveWaitingGameSmallItemArt,
  resolveWaitingGameSupplyShelfArt,
  type WaitingGameHomeTableState,
  type WaitingGamePersonaActivity,
} from "@/lib/art/waiting-game";
import {
  PRIMARY_TOOLS,
  PRIMARY_TOOL_BY_ID,
  SMALL_ITEMS,
  SMALL_ITEM_BY_ID,
  type HomeActivityType,
  type PrimaryToolId,
  type SmallItemId,
} from "@/lib/journey/game";
import type {
  JourneyInsightAction,
  JourneyProjection,
  JourneyView,
  WaitingGameStateView,
} from "@/lib/journey/types";
import type { PlayerPersona } from "@/lib/persona";

import { PaperCard } from "./components";
import { DEMO_FIXTURE } from "./fixtures";
import { BottomSheet } from "./interaction-client";
import { useCatProfile } from "./profile/client";
import { useLivePersonaSnapshot } from "./live-client";

const EMPTY_GAME_STATE: WaitingGameStateView = {
  leaves: { balance: 0, pendingHome: 0, passiveCap: 6 },
  primaryTools: PRIMARY_TOOLS.map((tool) => ({ id: tool.id, unlocked: tool.id === "notebook" })),
  supplies: SMALL_ITEMS.map((item) => ({ id: item.id, quantity: 0 })),
  loadout: { primaryToolId: "notebook", smallItemId: null },
  homeActivity: null,
};

const EMPTY_PROJECTION: JourneyProjection = {
  state: "AT_HOME",
  journey: null,
  resting: false,
  queuedJourney: false,
  queuedRouteBias: null,
  nextJourneyAt: null,
  game: EMPTY_GAME_STATE,
};

const HOME_ACTIVITY_COPY: Record<HomeActivityType, {
  caption: string;
  titleLead: string;
  titleTail: string;
  body: string;
  note: string;
  personaActivity: WaitingGamePersonaActivity;
}> = {
  RESTING: {
    caption: "LIGHTS DOWN · 刚回来，先睡一会儿",
    titleLead: "睡着",
    titleTail: "以后会再走。",
    body: "它刚从外面回来。你可以什么都不做，等它睡醒以后自己再走。",
    note: "刚回来。\n先歇会儿。",
    personaActivity: "sleep_curl",
  },
  READING: {
    caption: "AT HOME · 它在看东西",
    titleLead: "它在",
    titleTail: "慢慢翻页。",
    body: "它会自己消磨在家的时间。你可以准备下一趟，但不能命令它现在出门。",
    note: "这会儿\n不太想动。",
    personaActivity: "desk_reading",
  },
  SORTING: {
    caption: "AT HOME · 它在整理带回来的东西",
    titleLead: "它在",
    titleTail: "整理票根。",
    body: "旅行册不是奖励列表。它会把带回来的纸片、照片和关系痕迹慢慢收好。",
    note: "桌上还有\n一点没理完。",
    personaActivity: "sorting_tickets",
  },
  WINDOW_WATCHING: {
    caption: "AT HOME · 它在窗边待着",
    titleLead: "它还",
    titleTail: "在窝里。",
    body: "你可以替行囊准备一点东西。什么时候走、停在哪里，还是由它自己决定。",
    note: "好奇心已经\n开始转了。",
    personaActivity: "window_sit",
  },
  IDLING: {
    caption: "AT HOME · 今天没有急事",
    titleLead: "它在",
    titleTail: "发自己的呆。",
    body: "没有任务要清，也没有倒计时。准备好行囊以后，它会在合适的时候自己离开。",
    note: "先伸个懒腰。\n别催。",
    personaActivity: "stretching",
  },
};

function RoomBackdrop({
  empty = false,
  activity,
}: {
  empty?: boolean;
  activity?: HomeActivityType | null;
}) {
  return (
    <div
      aria-hidden="true"
      className="home-room-backdrop home-room-backdrop--waiting-game"
      style={{
        backgroundImage: `url(${empty
          ? resolveWaitingGameHomeRoom(true)
          : activity
            ? resolveWaitingGameHomeActivityRoom(activity)
            : resolveWaitingGameHomeRoom(false)})`,
      }}
    />
  );
}

function WaitingGamePersonaArt({
  persona,
  activity,
  alt,
  className = "",
  priority = false,
}: {
  persona: Pick<PlayerPersona, "visualVariant">;
  activity: WaitingGamePersonaActivity;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`waiting-game-persona-art ${className}`} data-activity={activity} data-persona-variant={persona.visualVariant}>
      <Image
        alt={alt}
        className="waiting-game-persona-art-image"
        fill
        priority={priority}
        sizes="(max-width: 760px) 62vw, 360px"
        src={resolveWaitingGamePersonaActivity(persona, activity)}
      />
    </div>
  );
}

function HomeTableArt({ state, alt }: { state: WaitingGameHomeTableState; alt: string }) {
  return (
    <div className="home-table-art">
      <Image
        alt={alt}
        className="home-table-art-image"
        fill
        priority
        sizes="(max-width: 760px) 78vw, 420px"
        src={resolveWaitingGameHomeTable(state)}
      />
    </div>
  );
}

function ReturnItemArt({ kind, alt }: { kind: "question_ticket" | "relation_note" | "oddity"; alt: string }) {
  return (
    <div className="returned-item-art">
      <Image
        alt={alt}
        className="returned-item-art-image"
        fill
        sizes="(max-width: 760px) 32vw, 180px"
        src={resolveWaitingGameReturnItemArt(kind)}
      />
    </div>
  );
}

function JourneyPostcardArt({
  journey,
  fallbackInterest,
}: {
  journey: JourneyView;
  fallbackInterest: string;
}) {
  const src = resolveWaitingGameJourneyPostcard({
    journeyKey: journey.id,
    routeBias: journey.routeBias,
    fallbackInterest,
    participantName: journey.conversation?.participantName,
    sharedUser: journey.conversation?.kind === "USER",
  });
  return (
    <figure className="returned-postcard-art">
      <Image
        alt="这一趟知识漫游留下的插画"
        className="returned-postcard-art-image"
        fill
        sizes="(max-width: 760px) 86vw, 420px"
        src={src}
      />
      <figcaption>这一趟的知识漫游插画</figcaption>
    </figure>
  );
}

export function DemoOutingHome() {
  const [projection, setProjection] = useState<JourneyProjection | null>(null);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const personaSnapshot = useLivePersonaSnapshot();
  const basePersona = (personaSnapshot?.persona ?? DEMO_FIXTURE.persona) as PlayerPersona;
  const { profile, persona: playerPersona } = useCatProfile(basePersona);
  const catName = profile.catName;
  const primaryInterest = personaSnapshot?.composition?.primaryInterest ?? basePersona.interests[0] ?? "综合";

  const refreshJourney = useCallback(async () => {
    try {
      const response = await fetch("/api/journey", { cache: "no-store" });
      if (response.status === 401) {
        setJourneyError(null);
        setProjection(EMPTY_PROJECTION);
        return;
      }
      if (!response.ok) throw new Error(`journey HTTP ${response.status}`);
      setProjection((await response.json()) as JourneyProjection);
      setJourneyError(null);
    } catch {
      setJourneyError("旅途状态暂时没读到，刷新页面再试一次。");
      setProjection((current) => current ?? EMPTY_PROJECTION);
    }
  }, []);

  const runAction = useCallback(async (body: unknown): Promise<JourneyProjection | null> => {
    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        setJourneyError("先完成知乎授权，这只猫才有自己的长期旅途。");
        return null;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || `journey HTTP ${response.status}`);
      }
      const next = (await response.json()) as JourneyProjection;
      setProjection(next);
      setJourneyError(null);
      return next;
    } catch (error) {
      setJourneyError(error instanceof Error ? error.message : "这次没能完成，稍后再试一次。");
      return null;
    }
  }, []);

  const prepareJourney = useCallback(async (routeBias: string | null) => {
    const next = await runAction({ action: "start", routeBias });
    if (next?.state === "AT_HOME" && next.resting) {
      setJourneyError(routeBias
        ? `纸条塞好了：「${routeBias}」。它还在睡，醒了会自己决定什么时候走。`
        : "行囊已经收好。它还在睡，醒了以后会自己决定什么时候走。");
    }
  }, [runAction]);

  useEffect(() => {
    void refreshJourney();
  }, [refreshJourney]);

  useEffect(() => {
    const shouldPoll = projection?.state === "PREPARING"
      || projection?.state === "AWAY"
      || Boolean(projection?.resting)
      || Boolean(projection?.queuedJourney);
    if (!shouldPoll) return;
    const timer = window.setInterval(() => void refreshJourney(), 6_000);
    return () => window.clearInterval(timer);
  }, [projection?.state, projection?.resting, projection?.queuedJourney, refreshJourney]);

  if (!projection) {
    return <div className="outing-loading">正在看它在不在家……</div>;
  }
  if (projection.state === "PREPARING" && projection.journey) {
    return <PreparingStage catName={catName} journey={projection.journey} playerPersona={playerPersona} />;
  }
  if (projection.state === "AWAY" && projection.journey) {
    return <AwayStage journey={projection.journey} />;
  }
  if (projection.state === "RETURNED" && projection.journey) {
    return (
      <ReturnedStage
        catName={catName}
        journey={projection.journey}
        playerPersona={playerPersona}
        primaryInterest={primaryInterest}
        onArchive={() => void runAction({ action: "archive" })}
        onInsightFeedback={async (response) => {
          await runAction({ action: "insight_feedback", journeyId: projection.journey!.id, response });
        }}
      />
    );
  }

  return (
    <AtHomeStage
      catName={catName}
      game={projection.game}
      playerPersona={playerPersona}
      resting={projection.resting}
      queuedJourney={projection.queuedJourney}
      queuedRouteBias={projection.queuedRouteBias}
      journeyNotice={journeyError}
      onPrepare={prepareJourney}
      onCollectLeaves={async () => {
        await runAction({ action: "collect_leaves" });
      }}
      onBuySupply={async (supplyId) => {
        await runAction({ action: "buy_supply", supplyId });
      }}
      onSetLoadout={async (primaryToolId, smallItemId) => {
        await runAction({ action: "set_loadout", primaryToolId, smallItemId });
      }}
    />
  );
}

function AtHomeStage({
  catName,
  game,
  onPrepare,
  onCollectLeaves,
  onBuySupply,
  onSetLoadout,
  playerPersona,
  resting,
  queuedJourney,
  queuedRouteBias,
  journeyNotice,
}: {
  catName: string;
  game: WaitingGameStateView;
  onPrepare: (routeBias: string | null) => Promise<void>;
  onCollectLeaves: () => Promise<void>;
  onBuySupply: (supplyId: SmallItemId) => Promise<void>;
  onSetLoadout: (primaryToolId: PrimaryToolId | null, smallItemId: SmallItemId | null) => Promise<void>;
  playerPersona: PlayerPersona;
  resting: boolean;
  queuedJourney: boolean;
  queuedRouteBias: string | null;
  journeyNotice: string | null;
}) {
  const fixture = DEMO_FIXTURE;
  const [draftRouteBias, setDraftRouteBias] = useState(queuedRouteBias ?? "");
  const activityType = game.homeActivity?.type ?? (resting ? "RESTING" : "IDLING");
  const activityCopy = HOME_ACTIVITY_COPY[activityType];
  const selectedTool = game.loadout.primaryToolId ? PRIMARY_TOOL_BY_ID[game.loadout.primaryToolId] : null;
  const selectedSmallItem = game.loadout.smallItemId ? SMALL_ITEM_BY_ID[game.loadout.smallItemId] : null;
  const totalSupplyCount = game.supplies.reduce((sum, item) => sum + item.quantity, 0);
  const shelfState = game.leaves.pendingHome > 0
    ? "leaves"
    : totalSupplyCount >= 5
      ? "full"
      : totalSupplyCount >= 2
        ? "normal"
        : totalSupplyCount > 0
          ? "low"
          : "empty";

  useEffect(() => {
    setDraftRouteBias(queuedRouteBias ?? "");
  }, [queuedRouteBias]);

  const submitLoadout = async (close: () => void) => {
    const routeBias = draftRouteBias.trim() || null;
    await onPrepare(routeBias);
    close();
  };

  return (
    <div className="home-at-home home-room-stage">
      <RoomBackdrop activity={activityType} />
      <div className="home-hero-copy">
        <p className="stage-caption">{activityCopy.caption}</p>
        <h1 className="target-lock-title">
          <span className="target-title-line"><em>{activityCopy.titleLead}</em>，</span>
          <span className="target-title-line">{activityCopy.titleTail}</span>
        </h1>
        <p>{queuedJourney
          ? queuedRouteBias
            ? `下一趟的纸条已经压好了：「${queuedRouteBias}」。它会在休息结束后自己收包、自己出门。`
            : "下一趟的行囊已经准备好了。没有纸条也没关系，它会自己决定去哪。"
          : activityCopy.body}</p>
        {journeyNotice ? <p className="home-status-note" role="status">{journeyNotice}</p> : null}
      </div>

      <PaperCard className="home-story-polaroid">
        <span>旅行册 · TRAVEL BOOK</span>
        <strong>{queuedJourney ? "下一趟已经准备好了。" : "它的世界还会继续往外长。"}</strong>
        <p>{queuedJourney
          ? `主道具：${selectedTool?.name ?? "不带"} · 小物：${selectedSmallItem?.name ?? "不带"} · ${queuedRouteBias ? `纸条「${queuedRouteBias}」` : "没有纸条"}`
          : "不要提前知道它会去哪。回来以后再拆包，才知道它真正停在了什么地方。"}</p>
        <a href="/atlas">翻一翻旅行册 →</a>
      </PaperCard>

      <div className="home-hero-art">
        <WaitingGamePersonaArt
          activity={activityCopy.personaActivity}
          alt={`${catName}现在正在${activityType === "RESTING" ? "休息" : activityType === "READING" ? "看书" : activityType === "SORTING" ? "整理票根" : activityType === "WINDOW_WATCHING" ? "看窗外" : "发呆"}`}
          className={`home-persona-art${activityType === "RESTING" ? " is-sleeping" : ""}`}
          persona={playerPersona}
          priority
        />
        <span className="home-resting-note">{activityCopy.note.split("\n").map((line, index) => <span key={`${line}-${index}`}>{line}<br /></span>)}</span>
      </div>

      <div className="home-event-actions">
        <BottomSheet
          trigger={<span className="home-outing-trigger home-outing-primary">{queuedJourney ? "重新整理下一趟" : "给它准备行囊"} <b>→</b></span>}
          title="行囊准备"
        >
          {(close) => (
            <>
              <p>主道具会一直留着，小物只在它真正出门时消耗。纸条最多 20 个字，也可以一张都不塞。</p>

              <div className="home-loadout-section">
                <div className="home-loadout-heading"><b>主道具</b><span>最多 1 个 · 永久</span></div>
                <div className="home-loadout-grid">
                  <button
                    className={!game.loadout.primaryToolId ? "is-selected" : ""}
                    onClick={() => void onSetLoadout(null, game.loadout.smallItemId)}
                    type="button"
                  >
                    <span className="home-loadout-empty">空</span>
                    <b>不带主道具</b>
                    <small>完全交给它自己。</small>
                  </button>
                  {PRIMARY_TOOLS.map((tool) => {
                    const unlocked = game.primaryTools.find((item) => item.id === tool.id)?.unlocked ?? false;
                    return (
                      <button
                        className={game.loadout.primaryToolId === tool.id ? "is-selected" : ""}
                        disabled={!unlocked}
                        key={tool.id}
                        onClick={() => void onSetLoadout(tool.id, game.loadout.smallItemId)}
                        type="button"
                      >
                        <span className="home-loadout-art"><Image alt="" fill sizes="84px" src={resolveWaitingGamePrimaryToolArt(tool.id)} /></span>
                        <b>{tool.name}</b>
                        <small>{unlocked ? tool.description : `走到第 ${tool.unlockAtJourneys} 趟后解锁`}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="home-loadout-section">
                <div className="home-loadout-heading"><b>单趟小物</b><span>最多 1 个 · 出门时消耗</span></div>
                <div className="home-loadout-grid home-loadout-grid--supplies">
                  <button
                    className={!game.loadout.smallItemId ? "is-selected" : ""}
                    onClick={() => void onSetLoadout(game.loadout.primaryToolId, null)}
                    type="button"
                  >
                    <span className="home-loadout-empty">空</span>
                    <b>不带小物</b>
                    <small>空包也能走。</small>
                  </button>
                  {SMALL_ITEMS.map((item) => {
                    const stock = game.supplies.find((supply) => supply.id === item.id)?.quantity ?? 0;
                    return (
                      <button
                        className={game.loadout.smallItemId === item.id ? "is-selected" : ""}
                        disabled={stock <= 0}
                        key={item.id}
                        onClick={() => void onSetLoadout(game.loadout.primaryToolId, item.id)}
                        type="button"
                      >
                        <span className="home-loadout-art"><Image alt="" fill sizes="84px" src={resolveWaitingGameSmallItemArt(item.id)} /></span>
                        <b>{item.name}</b>
                        <small>{stock > 0 ? `还有 ${stock} 个 · ${item.description}` : "补给架里还没有"}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="route-bias-list" aria-label="纸条方向建议">
                {fixture.outing.routeBiases.map((bias) => (
                  <button
                    className={draftRouteBias === bias ? "is-selected" : ""}
                    key={bias}
                    onClick={() => setDraftRouteBias(bias.slice(0, 20))}
                    type="button"
                  >
                    {bias}
                  </button>
                ))}
              </div>
              <form
                className="route-bias-custom"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitLoadout(close);
                }}
              >
                <label htmlFor="journey-route-note">短纸条 · 可选</label>
                <textarea
                  id="journey-route-note"
                  maxLength={20}
                  onChange={(event) => setDraftRouteBias(event.target.value)}
                  placeholder="比如：看看反对意见。"
                  rows={2}
                  value={draftRouteBias}
                />
                <div className="route-bias-custom-footer">
                  <span>{Array.from(draftRouteBias).length}/20 字</span>
                  <button type="submit">{resting ? "先压进包里 →" : "收好行囊 →"}</button>
                </div>
              </form>
            </>
          )}
        </BottomSheet>

        <BottomSheet
          trigger={<span className="home-outing-trigger home-supply-trigger">补给架 · {game.leaves.balance} 片 <b>→</b></span>}
          title="补给架"
        >
          {() => (
            <>
              <p>这里只有灵感叶和会被消耗的小东西。没有签到、折扣、随机刷新，也不能拿叶子买等待时间。</p>
              <div className="home-supply-shelf-art">
                <Image alt="猫窝里的补给架" fill sizes="(max-width: 760px) 86vw, 420px" src={resolveWaitingGameSupplyShelfArt(shelfState)} />
              </div>
              <div className="home-leaf-wallet">
                <span className="home-leaf-art"><Image alt="" fill sizes="72px" src={resolveWaitingGameInspirationLeafArt(true)} /></span>
                <div><small>灵感叶</small><b>{game.leaves.balance} 片</b><em>在家自然攒下来的待收：{game.leaves.pendingHome} / {game.leaves.passiveCap}</em></div>
                <button disabled={game.leaves.pendingHome <= 0} onClick={() => void onCollectLeaves()} type="button">收起来 +{game.leaves.pendingHome}</button>
              </div>
              <div className="home-supply-list">
                {SMALL_ITEMS.map((item) => {
                  const stock = game.supplies.find((supply) => supply.id === item.id)?.quantity ?? 0;
                  return (
                    <article key={item.id}>
                      <span className="home-supply-item-art"><Image alt="" fill sizes="86px" src={resolveWaitingGameSmallItemArt(item.id)} /></span>
                      <div><b>{item.name}</b><p>{item.description}</p><small>现有 {stock} 个</small></div>
                      <button disabled={game.leaves.balance < item.price} onClick={() => void onBuySupply(item.id)} type="button">{item.price} 片叶子</button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </BottomSheet>

        <a className="home-last-night-link" href="/explore?mode=app">看看它已经走到哪里 →</a>
      </div>

      <div className="home-context-strip home-context-strip--stats">
        <span><small>现在</small><b>{activityType === "RESTING" ? "睡觉" : activityType === "READING" ? "看书" : activityType === "SORTING" ? "整理" : activityType === "WINDOW_WATCHING" ? "窗边" : "发呆"}</b><em>它自己安排</em></span>
        <span><small>灵感叶</small><b>{game.leaves.balance}</b><em>{game.leaves.pendingHome ? `还有 ${game.leaves.pendingHome} 片待收` : "慢慢长"}</em></span>
        <span><small>主道具</small><b>{selectedTool?.name ?? "不带"}</b><em>改变探索方式</em></span>
        <span><small>小物</small><b>{selectedSmallItem?.name ?? "不带"}</b><em>出门时消耗</em></span>
      </div>
    </div>
  );
}

function PreparingStage({
  catName,
  journey,
  playerPersona,
}: {
  catName: string;
  journey: JourneyView;
  playerPersona: PlayerPersona;
}) {
  const primaryTool = journey.primaryToolId ? PRIMARY_TOOL_BY_ID[journey.primaryToolId] : null;
  const smallItem = journey.smallItemId ? SMALL_ITEM_BY_ID[journey.smallItemId] : null;

  return (
    <div className="outing-empty-stage home-room-stage">
      <RoomBackdrop activity="IDLING" />
      <p className="stage-caption">PACKING · 别催，它自己决定什么时候走</p>
      <h1>它开始<br />收行囊了。</h1>
      <WaitingGamePersonaArt activity="packing_bag" alt={`${catName}正在收拾行囊`} className="outing-state-persona" persona={playerPersona} priority />
      <PaperCard className="outing-note-card">
        <span>这一趟的行囊</span>
        <strong>{journey.routeBias ? `纸条「${journey.routeBias}」` : "这趟没有塞纸条。"}</strong>
        <p>主道具只改变它怎么找问题；小物要等它真正把门带上时才会消耗。</p>
        <div className="outing-loadout-summary">
          <div>
            {primaryTool ? <span className="outing-loadout-art"><Image alt="" fill sizes="92px" src={resolveWaitingGamePrimaryToolArt(primaryTool.id)} /></span> : null}
            <small>主道具</small><b>{primaryTool?.name ?? "不带"}</b>
          </div>
          <div>
            {smallItem ? <span className="outing-loadout-art"><Image alt="" fill sizes="92px" src={resolveWaitingGameSmallItemArt(smallItem.id)} /></span> : null}
            <small>小物</small><b>{smallItem?.name ?? "不带"}</b>
          </div>
        </div>
        <HomeTableArt alt="桌上摊着正在整理的行囊" state="prepare_trip" />
        <div className="outing-pack-steps" aria-label="出门准备">
          <span className="is-done">行囊收好</span>
          <span className="is-current">自己磨蹭</span>
          <span>自己出门</span>
        </div>
      </PaperCard>
    </div>
  );
}

function awayMood(journey: JourneyView): string {
  const total = Math.max(1, journey.returnAt - journey.departAt);
  const progress = Math.min(1, Math.max(0, (Date.now() - journey.departAt) / total));
  if (progress < 0.22) return "刚出门。门口的脚印还很新。";
  if (progress < 0.68) return "已经走远了。现在不知道它在哪。";
  return "外面安静了很久。也许快回来了。";
}

function AwayStage({ journey }: { journey: JourneyView }) {
  const primaryTool = journey.primaryToolId ? PRIMARY_TOOL_BY_ID[journey.primaryToolId] : null;
  const smallItem = journey.smallItemId ? SMALL_ITEM_BY_ID[journey.smallItemId] : null;
  const journeyLabel = journey.kind === "FAR" ? "走得更远的一趟" : journey.kind === "WARMUP" ? "刚开始熟悉路" : "普通的一趟";

  return (
    <div className="outing-empty-stage outing-away-stage home-room-stage">
      <RoomBackdrop empty />
      <p className="stage-caption">AWAY · THE ROOM IS EMPTY</p>
      <h1>窝空了。</h1>
      <p>{awayMood(journey)}</p>
      <PaperCard className="outing-note-card">
        <span>{journeyLabel}</span>
        <strong>{journey.routeBias ? `纸条「${journey.routeBias}」` : "这趟没有塞纸条。"}</strong>
        <p>这只是一个方向。你不会看到倒计时，也不能把它叫回来。</p>
        <div className="outing-away-loadout">
          <span>主道具 <b>{primaryTool?.name ?? "没带"}</b></span>
          <span>小物 <b>{smallItem?.name ?? "没带"}</b></span>
        </div>
      </PaperCard>
      <div className="outing-away-actions">
        <a href="/atlas">翻翻以前的旅行册 →</a>
        <span>等门自己响。</span>
      </div>
    </div>
  );
}

function ReturnedStage({
  catName,
  journey,
  onArchive,
  onInsightFeedback,
  playerPersona,
  primaryInterest,
}: {
  catName: string;
  journey: JourneyView;
  onArchive: () => void;
  onInsightFeedback: (response: JourneyInsightAction) => Promise<void>;
  playerPersona: PlayerPersona;
  primaryInterest: string;
}) {
  const [opened, setOpened] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const question = journey.question;
  const thought = journey.postcard?.body ?? "这一趟只留下了出门记录。";
  const relationTicket = journey.artifact?.type === "RELATION_TICKET";
  const conversation = journey.conversation;
  const insight = journey.insight;
  const artifactLabel = relationTicket
    ? "关系票根 · RELATION TICKET"
    : journey.artifact?.type === "OPINION_FRAGMENT"
      ? "观点碎片 · OPINION FRAGMENT"
      : journey.artifact?.type === "ODDITY_SPECIMEN"
        ? "怪东西 · ODDITY"
        : question
          ? "问题票根 · QUESTION TICKET"
          : insight
            ? "新认识 · ABOUT YOU"
            : "旅途札记 · POSTCARD";
  const legacyScentArtifact = journey.artifact?.type === "NEW_SCENT";
  const returnItemArt = relationTicket
    ? { kind: "relation_note" as const, alt: "这一趟留下的关系纸条" }
    : question
      ? { kind: "question_ticket" as const, alt: "这一趟带回的问题票根" }
      : journey.artifact?.type === "ODDITY_SPECIMEN"
        ? { kind: "oddity" as const, alt: "这一趟带回的奇怪纪念物" }
        : null;
  const artifactTitle = legacyScentArtifact
    ? insight?.headline ?? "这一趟留下的旅行记录"
    : journey.artifact?.title ?? question?.title ?? insight?.headline ?? journey.postcard?.headline ?? "这一趟的旅行札记";

  async function submitInsightFeedback(response: JourneyInsightAction) {
    if (!insight || feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      await onInsightFeedback(response);
    } finally {
      setFeedbackBusy(false);
    }
  }

  useEffect(() => {
    setOpened(false);
  }, [journey.id]);

  return (
    <div className="returned-stage home-room-stage">
      <RoomBackdrop />
      <div className="returned-copy">
        <p className="stage-caption">RETURNED · 回窝</p>
        <span>旅包已经放在桌边。</span>
        <h1>{catName}<br />回窝了。</h1>
        <p>{opened ? "这一趟留下的东西，都在这里。" : "先拆包。里面是什么，打开以后才知道。"}</p>
      </div>
      <WaitingGamePersonaArt
        activity={question ? "carry_ticket" : "carry_photo"}
        alt={question ? `${catName}带着问题票根回到窝里` : `${catName}带着旅途照片回到窝里`}
        className="returned-persona-art"
        persona={playerPersona}
        priority
      />
      {!opened ? (
        <PaperCard className="returned-artifact returned-artifact--sealed">
          <span>旅包 · SEALED</span>
          <h2>东西还没摊开。</h2>
          <p>可能是一张问题票，也可能是它对你的一个新发现。这一趟回来，总会留下能继续看的东西。</p>
          <HomeTableArt alt="桌边还没拆开的旅包" state="unopened_bag" />
          <button className="theatre-button theatre-button-primary" onClick={() => setOpened(true)} type="button">拆开它的包 <span>→</span></button>
        </PaperCard>
      ) : (
        <PaperCard className="returned-artifact is-opened">
          <span>{artifactLabel}</span>
          <HomeTableArt alt="旅包已经在桌上摊开" state="open_bundle" />
          <JourneyPostcardArt fallbackInterest={primaryInterest} journey={journey} />
          {journey.inspirationLeaves !== null ? (
            <div className="returned-leaf-reward">
              <span className="returned-leaf-art">
                <Image alt="" fill sizes="92px" src={resolveWaitingGameInspirationLeafArt(true)} />
              </span>
              <div>
                <small>这一趟带回的灵感叶</small>
                <b>+{journey.inspirationLeaves} 片</b>
                <em>回窝时已经放进库存，不需要“领取”。</em>
              </div>
            </div>
          ) : null}
          {returnItemArt ? <ReturnItemArt alt={returnItemArt.alt} kind={returnItemArt.kind} /> : null}
          <h2>{artifactTitle}</h2>
          <p>你塞的纸条：{journey.routeBias ?? "随便逛"}</p>
          {question || relationTicket ? <blockquote>“{thought}”</blockquote> : null}
          <div className="returned-meta">
            <span>它看到了什么 <b>{question ? "一个真实知乎问题" : relationTicket ? "一场真实相遇" : insight ? "一条沿这趟路线形成的新观察" : "一页可追溯的旅行记录"}</b></span>
            <span>它路上聊了什么 <b>{conversation ? `${conversation.kind === "USER" ? "真实用户 Persona" : "社区 NPC"} · ${conversation.textCharCount} 字` : "这趟没有停下来聊天"}</b></span>
            <span>它更懂你什么 <b>{insight ? `1 条新认识 · ${insight.textCharCount} 字` : "仍按可验证事实记录"}</b></span>
          </div>
          {conversation ? (
            <section className="returned-conversation" aria-label="旅途中发生的对话">
              <span>{conversation.kind === "USER" ? "SHARED ENCOUNTER · 真实用户" : "ROADSIDE CHAT · 社区 NPC"}</span>
              <h3>路上碰见了 {conversation.participantName}。</h3>
              <div className="returned-conversation-turns">
                {conversation.turns.map((turn, index) => (
                  <p className={turn.speaker === "other" ? "is-other" : ""} key={`${turn.speaker}-${index}`}>
                    <b>{turn.speaker === "self" ? catName : conversation.participantName}</b>
                    {turn.text}
                  </p>
                ))}
              </div>
              <small>{conversation.sourceLabel} · {conversation.turns.length} 句 · {conversation.textCharCount} 字</small>
            </section>
          ) : null}
          {insight ? (
            <section className="returned-insight" aria-label="它对你的一个新发现">
              <span>新认识 · ABOUT YOU · {insight.textCharCount} 字</span>
              <h3>{insight.headline}</h3>
              <p>{insight.insight}</p>
              <small>{insight.whyItMatters}</small>
              <details>
                <summary>它为什么这么想 →</summary>
                <p>{insight.evidenceSummary}</p>
              </details>
              <strong>{insight.interactionQuestion}</strong>
              <div className="returned-insight-actions">
                {insight.options.map((option) => (
                  <button
                    className={insight.feedbackAction === option.action ? "is-selected" : ""}
                    disabled={feedbackBusy}
                    key={option.action}
                    onClick={() => void submitInsightFeedback(option.action)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {insight.feedbackAction ? <em>这次回应已经记进这趟旅程，不会直接改写你的人格。</em> : null}
            </section>
          ) : null}
          {relationTicket ? (
            <a className="home-last-night-link" href="/encounter">看它们这一幕 →</a>
          ) : question ? (
            <a className="home-last-night-link" href={question.url} rel="noreferrer" target="_blank">去知乎看原问题 →</a>
          ) : null}
          <button className="theatre-button theatre-button-primary" onClick={onArchive} type="button">收进旅行册 <span>→</span></button>
        </PaperCard>
      )}
    </div>
  );
}
