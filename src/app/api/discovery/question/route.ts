import { NextResponse } from "next/server";

import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

function isQuestionUrl(url: string): boolean {
  try {
    return new URL(url).pathname.includes("/question/");
  } catch {
    return false;
  }
}

const DISCOVERY_QUERIES = ["人工智能 AI", "科学 研究", "城市生活", "职场 创业", "心理学"] as const;

export async function GET() {
  const gateway = createZhihuGatewayFromEnv();
  const generatedAt = Math.floor(Date.now() / 1000);
  let questions: Array<{ title: string; url: string; summary: string; thumbnailUrl: string }> = [];
  let source: "hot_list" | "search" = "hot_list";

  try {
    const hotItems = await gateway.getHotList(30);
    questions = hotItems
      .filter((item) => isQuestionUrl(item.url))
      .slice(0, 6)
      .map((item) => ({
        title: item.title,
        url: item.url,
        summary: item.summary,
        thumbnailUrl: item.thumbnailUrl,
      }));
  } catch (error) {
    console.warn(
      "[discovery] hot list unavailable; trying zhihu_search",
      error instanceof Error ? error.message : "unknown error",
    );
  }

  if (!questions.length) {
    source = "search";
    try {
      const slot = Math.floor(Date.now() / (5 * 60_000)) % DISCOVERY_QUERIES.length;
      const query = DISCOVERY_QUERIES[slot]!;
      questions = (await gateway.searchZhihu(query, 8))
        .filter((item) => isQuestionUrl(item.url))
        .slice(0, 6)
        .map((item) => ({
          title: item.title,
          url: item.url,
          summary: item.summary,
          thumbnailUrl: "",
        }));
    } catch (error) {
      console.warn(
        "[discovery] zhihu_search unavailable",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }

  const question = questions[0] ?? null;
  if (!question) {
    return NextResponse.json(
      { mode: "unavailable" as const, generatedAt, question: null, questions: [] },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    { mode: "live" as const, source, generatedAt, question, questions },
    { headers: { "cache-control": "no-store" } },
  );
}
